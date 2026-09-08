---
source: Seigaiha (青海波), el teselado japonés de "olas del mar azul" de arcos concéntricos solapados, documentado en tejidos del periodo Nara; aquí reconstruido como retícula de dos rellenos en orden de pintor
url: https://en.wikipedia.org/wiki/Seigaiha
---

## Fórmula

    retícula:  x = −R + col · 2R·overlap  (+ R·overlap en filas impares)
               y = −R + fila · R·rowStep
    se dibujan las filas de arriba abajo y los discos de izquierda a derecha;
    cada disco cubre lo que tiene debajo

    por disco, según la semilla:
      negro  disco de tinta, n anillos de papel en r_j = R · ((j + ½)/n + fase) mod 1
      fino   disco de acento, 2n anillos de papel y S radios en ángulos 2πs/S

## Qué significa

Dibujar discos solapados en orden es uno de los trucos más antiguos del diseño de patrones. Cada disco oculta lo que se dibujó antes, así que con un paso de fila menor que el radio solo sobrevive la corona superior de cada disco anterior, y una retícula plana de círculos se lee como escamas de pez o como las olas apiladas de los tejidos seigaiha. No se calcula nada sobre el solape: el orden de dibujo es toda la construcción.

Los dos rellenos vienen de los estudios textiles de la Bauhaus que enfrentaban anillos gruesos a una cuadrícula fina sobre la misma retícula. Un disco negro es tinta con unos pocos anillos anchos de papel; un disco fino es el color de acento con una densa cuadrícula polar de anillos delgados y radios. Ninguno necesita recorte: cada anillo queda dentro de su disco por construcción y cada radio termina en el borde, así que el propio disco es el recorte.

Con la fase, los radios de los anillos avanzan hacia fuera y dan la vuelta, de modo que cada disco pulsa como ondas desde su propio centro mientras la retícula permanece quieta.

## Parámetros

- **radius** — radio del disco en unidades de usuario.
- **overlap** — paso horizontal como fracción del diámetro; por debajo de 1 los discos de una fila se solapan.
- **rowStep** — paso de fila como fracción del radio; cuanto menor, más apretadas las filas.
- **rings** — número de anillos en un disco negro (el fino usa el doble).
- **boldShare** — probabilidad de que un disco sea negro en lugar de fino.
- **ringWidth** — grosor del anillo como fracción del paso entre anillos.
- **spokes** — número de radios en un disco fino; 0 para solo anillos.
