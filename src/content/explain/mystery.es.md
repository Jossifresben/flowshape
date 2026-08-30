---
source: Farris, F. A., "Creating Symmetry: The Artful Mathematics of Wallpaper Patterns" (Princeton University Press, 2015)
url: https://press.princeton.edu/books/hardcover/9780691161730/creating-symmetry
---

## Fórmula

    z(t) = Σₕ Aₕ · e^{i(kₕt + φₕ)},   t ∈ [0, 2π]
    con cada frecuencia kₕ ≡ 1 (mod m),  p. ej. k ∈ {1, 1+m, 1−m, 1+2m, …}
    Las amplitudes decaen como Aₕ = 1/(1+|s|)^β donde kₕ = 1 + m·s

## Qué significa

Encadena unos pocos círculos —un punto que viaja sobre un círculo que viaja sobre otro, cada uno girando a su propia frecuencia entera— y traza el camino del último. Eso es una serie de Fourier finita, la maquinaria de los dibujos por epiciclos. Casi cualquier elección de frecuencias da una maraña. Frank Farris vio la excepción, y es un teorema de una línea.

Exige que toda frecuencia deje resto 1 al dividirla por m. Entonces avanzar t un m-ésimo de vuelta multiplica cada término por el mismo factor unitario e^{2πi/m}: la curva entera se aplica sobre sí misma girada exactamente 360/m grados. Simetría rotacional de orden m perfecta, no ajustada ni aproximada sino *forzada* por una congruencia. Farris llamó a los resultados «curvas misteriosas» porque la simetría parece salir de la nada: fases y amplitudes son completamente libres, así que cada elección aleatoria es una floritura distinta con el mismo orden impecable.

Esa libertad es el motor del patrón. La semilla sortea fases nuevas; el exponente de caída decide si las frecuencias altas susurran (lazos suaves, caligráficos) o gritan (rosetas salvajes y puntiagudas); y como girar la fase de cada armónico no toca las frecuencias, la curva puede transformarse continuamente dentro de su familia con la simetría intacta — que es justo lo que hace la animación.

## Parámetros

**Simetría** es m, el orden rotacional impuesto. **Armónicos** cuenta los círculos de la cadena; **caída**, qué tan rápido se apagan los altos. **Floración** deja que la amplitud de cada armónico crezca y se desplome a su propio ritmo entero mientras la curva se mueve: lazos floreciendo a compases distintos. **Capas** superpone la misma curva un poco más avanzada en su metamorfosis, una estela grabada que se abre en abanico a mitad de ciclo. La semilla sortea fases nuevas: otra floritura, el mismo teorema.
