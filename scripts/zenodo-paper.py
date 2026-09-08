#!/usr/bin/env python3
"""Create (never publish) a Zenodo draft for the stripe-tiles note.

Metadata: docs/paper/zenodo.json. Files: the PDF, the Word file, the
Markdown source and figures/numbers.json. Token: ZENODO_TOKEN from the
environment, or from ../bibcrit/.env (git-ignored) as a fallback.

    python3 scripts/zenodo-paper.py            # create draft, upload, set metadata
    python3 scripts/zenodo-paper.py show ID    # inspect a deposition
Publishing is a human step in the Zenodo web UI: files are frozen after it.
"""
import json, os, sys, hashlib
import requests

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN = os.environ.get("ZENODO_TOKEN", "")
if not TOKEN:
    env = os.path.join(os.path.dirname(HERE), "bibcrit", ".env")
    if os.path.exists(env):
        for line in open(env):
            if line.startswith("ZENODO_TOKEN="):
                TOKEN = line.split("=", 1)[1].strip().strip('"').strip("'")
if not TOKEN:
    sys.exit("ERROR: no ZENODO_TOKEN")
BASE = "https://zenodo.org"
S = requests.Session(); S.headers["Authorization"] = f"Bearer {TOKEN}"

def check(r):
    if not r.ok:
        sys.exit(f"ERROR {r.status_code} {r.request.method} {r.request.path_url}: {r.text[:400]}")
    return r

PAPER = os.path.join(HERE, "docs", "paper")
FILES = ["stripe-tiles.pdf", "stripe-tiles.docx", "stripe-tiles.md", os.path.join("figures", "numbers.json")]

def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""): h.update(chunk)
    return h.hexdigest()

def create():
    meta = json.load(open(os.path.join(PAPER, "zenodo.json")))
    dep = check(S.post(f"{BASE}/api/deposit/depositions", json={})).json()
    dep_id = dep["id"]; bucket = dep["links"]["bucket"]
    print("deposition", dep_id)
    for rel in FILES:
        p = os.path.join(PAPER, rel); name = os.path.basename(p)
        with open(p, "rb") as f:
            r = check(S.put(f"{bucket}/{name}", data=f))
        print(f"  uploaded {name}: {os.path.getsize(p)} bytes, checksum {r.json().get('checksum')} (local md5 {md5(p)})")
    check(S.put(f"{BASE}/api/deposit/depositions/{dep_id}", json={"metadata": meta}, headers={"Content-Type": "application/json"}))
    show(dep_id)

def show(dep_id):
    d = check(S.get(f"{BASE}/api/deposit/depositions/{dep_id}")).json()
    print("state:", d.get("state"), "| submitted:", d.get("submitted"))
    print("reserved DOI:", d.get("metadata", {}).get("prereserve_doi", {}).get("doi") or d.get("doi"))
    print("review/edit URL:", d["links"].get("html"))
    for f in d.get("files", []): print("  file:", f["filename"], f["filesize"], f.get("checksum"))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "show": show(sys.argv[2])
    else: create()
