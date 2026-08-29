---
source: Voronoi, G. (1908) "Nouvelles applications des paramètres continus à la théorie des formes quadratiques", Journal für die reine und angewandte Mathematik 133
url: https://en.wikipedia.org/wiki/Voronoi_diagram
---

## Fórmula

    V_i = { x en el plano : |x − s_i| ≤ |x − s_j|  para todo otro sitio s_j }

    cada V_i es la intersección de semiplanos, uno por cada vecino s_j,
    delimitados por la mediatriz del segmento s_i–s_j

## Qué significa

Un diagrama de Voronoi responde una pregunta para cada punto del plano: ¿cuál de los sitios dispersos está más cerca? La región V_i reúne todos los puntos para los que s_i gana esa competición. Como "más cerca de s_i que de s_j" es exactamente la mitad del plano que queda del lado de s_i respecto a la mediatriz entre ambos, cada celda es simplemente la superposición de un semiplano por cada sitio vecino: un polígono convexo tallado a base de cortes rectos, un corte por cada sitio cercano.

La construcción usada aquí forma cada celda exactamente así: partiendo del rectángulo completo del lienzo, recorta el lado lejano de la mediatriz para cada uno de los sitios más cercanos, por turno, en orden de distancia, hasta que solo queda el territorio propio del sitio. Los sitios cercanos al borde del lienzo terminan con celdas truncadas por el límite del lienzo en lugar de cerrarse de forma natural; eso es un hecho ineludible de los diagramas de Voronoi de un conjunto finito de puntos, no una aproximación de esta implementación.

Una vez calculado el polígono real de la celda, cada vértice se arrastra una fracción del camino hacia el centroide de la propia celda antes de dibujarlo. Ese encogimiento no tiene nada que ver con la construcción de Voronoi en sí: matemáticamente, las celdas vecinas comparten una arista exacta, sin ningún hueco entre ellas. Arrastrar los vértices hacia dentro es puramente una decisión de dibujo, hecha para abrir una "línea de mortero" visible de papel entre baldosas adyacentes en vez de dibujarlas borde con borde.

## Parámetros

- **sites** — el número de puntos dispersos al azar que reparten el plano. Más sitios dan celdas más pequeñas y numerosas.
- **inset** — cuánto se arrastra cada vértice de una celda hacia su propio centroide antes de dibujarla, desde 1 (las celdas se tocan exactamente, como en el diagrama real) hasta cerca de 0,5 (se abre un hueco visible entre cada par de vecinas). Una decisión de dibujo añadida sobre la geometría, no parte de ella.
- **strokeWidth** — grosor de línea del contorno de cada celda.
- **inkEvery** — rellena una de cada k celdas (por índice) con tinta en vez de papel. Una decisión de dibujo.
- **accentEvery** — rellena una de cada k celdas con el color de acento, con prioridad sobre inkEvery cuando ambos coincidirían. También puramente decorativo.
