---
source: Delaunay, B. (1934) "Sur la sphère vide", Bulletin de l'Académie des Sciences de l'URSS; Bowyer, A. y Watson, D.F. (1981), algoritmos incrementales independientes
url: https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm
doi: 10.1093/comjnl/24.2.162, 10.1093/comjnl/24.2.167
---

## Fórmula

    Una triangulación T del conjunto de puntos P es de Delaunay si y solo si:
      ningún punto de P está dentro de la circunferencia circunscrita de ningún triángulo de T

    Bowyer–Watson (construcción incremental):
      empezar con un "supertriángulo" que contenga a todos los puntos
      para cada punto p de P:
        hallar todos los triángulos cuya circunferencia circunscrita contiene a p ("triángulos malos")
        eliminarlos, dejando un hueco poligonal en forma de estrella
        retriangular el hueco uniendo p con cada arista de su contorno
      descartar cualquier triángulo que todavía toque al supertriángulo

## Qué significa

La regla que define la triangulación —que ningún otro punto puede estar dentro de la circunferencia circunscrita de un triángulo— parece una condición estrecha, pero tiene una consecuencia práctica muy fuerte: de todas las formas posibles de triangular un conjunto de puntos, la triangulación de Delaunay es la que evita en la mayor medida posible triángulos finos y alargados. Maximiza el ángulo más pequeño que aparece en toda la malla, y por eso es la elección estándar para mallas de terreno, arte low-poly y mallas de elementos finitos: nadie quiere un triángulo en forma de astilla.

La construcción usada aquí monta esa triangulación punto a punto. Empieza con un único triángulo tan grande que engloba todo el lienzo, y va insertando cada punto real por turno: cualquier triángulo existente cuya circunferencia circunscrita ahora contenga al nuevo punto deja de ser válido —esos se borran, dejando un hueco poligonal alrededor del punto nuevo— y el hueco se rellena trazando nuevos triángulos en abanico desde el punto hacia cada arista del contorno del hueco. Una vez insertados todos los puntos de esta manera, se descarta el triángulo inicial sobredimensionado y todo lo que todavía lo toque, dejando una triangulación limpia de solo los puntos reales.

Los dos modos de visualización de este patrón dibujan exactamente la misma malla: el modo solo cambia si los triángulos se muestran como un armazón sin relleno o como mosaico de piezas sólidas.

## Parámetros

- **points** — el número de puntos dispersos al azar que se triangulan. Más puntos dan una malla más fina con triángulos más pequeños.
- **mode** — edges dibuja la triangulación como un armazón sin relleno; mosaic rellena cada triángulo con un color plano. Una decisión de dibujo; la triangulación subyacente es la misma en ambos casos.
- **strokeWidth** — grosor de línea de las aristas de los triángulos.
- **vertexSize** — radio del punto dibujado en cada sitio, visible solo en el modo edges. 0 los oculta. Una decisión de dibujo.
- **accentEvery** — en modo mosaic, fija cada cuánto un triángulo (por índice) se rellena de tinta o de acento en vez de papel, creando un ritmo de color periódico en la malla. Puramente decorativo: no tiene efecto sobre la geometría.
