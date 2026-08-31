---
source: Gilbert, E. N. (1961) "Random Plane Networks", Journal of the Society for Industrial and Applied Mathematics 9(4), 533–543 (el grafo geométrico aleatorio —puntos unidos siempre que caen dentro de un radio fijo el uno del otro— es el modelo subyacente de este patrón); la colocación en retícula con desorden, el recorte de aristas de borde a borde y la órbita de deriva guiada por la fase son construcción propia de este proyecto
url: https://epubs.siam.org/doi/10.1137/0109045
doi: 10.1137/0109045
construction: original
---

## Fórmula

    p(i,j) = retícula(i,j) + jitter·ξᵢⱼ + drift·N(x + ρ·cos2πph, y + ρ·sin2πph)

    arista(a,b) existe  ⇔  dist(pₐ, p_b) < radius

    opacidad(arista) = 1                                          si dist ≤ radius·(1 − edgeFade)
                      = 1 − (dist − radius·(1−edgeFade)) / (radius·edgeFade)   si no, → 0 en dist = radius

## Qué significa

El artículo de Gilbert de 1961 planteó una pregunta sencilla sobre un conjunto de puntos aleatorios: une cualquier par que caiga dentro de un radio fijo el uno del otro, ¿qué aspecto tiene la red resultante? La respuesta —agrupaciones, cadenas y huecos abiertos, en vez de una malla uniforme— es el grafo geométrico aleatorio, y es exactamente la regla de este patrón para decidir cuándo se dibuja una línea.

Lo que sí es propio de este proyecto es de dónde parten los puntos y cómo se dibuja el grafo. En vez de una dispersión pura, los puntos se asientan en una retícula regular desplazada por un pequeño desorden —filas y columnas siguen siendo legibles de un vistazo, y es solo el desorden el que a veces acerca lo bastante a un par de vecinos como para conectarlos—. Como los puntos se dibujan grandes y el radio de conexión queda un poco por debajo del espaciado de la retícula, la mayoría de los puntos no llevan ninguna arista en los valores por defecto; el puñado que sí la lleva es la composición: el objetivo no es una malla, sino un salpicado de pequeñas constelaciones. Las aristas se recortan de borde a borde en vez de centro a centro, así que la línea dibujada es el hueco real de papel entre dos puntos y no un segmento medio enterrado bajo los rellenos que une —y mientras un par deriva hacia el radio de conexión, `edgeFade` desvanece su línea hasta la nada justo en el cruce, de modo que una conexión se rompe atenuándose, no apagándose de golpe.

El movimiento viene de una única órbita cerrada: el desorden nunca se mueve, pero el desplazamiento de cada punto también lee un campo de ruido en un punto que da una vuelta completa a un bucle fijo en el espacio de ruido cada ciclo. Un bucle cerrado es el único camino capaz de devolver la lectura de ruido exactamente a donde empezó —el ruido de valor no tiene periodo propio—, así que la fase 0 y la fase 1 muestrean el campo idéntico y el bucle cierra sin costura. A medida que los puntos derivan, las distancias cruzan el umbral del radio en ambos sentidos, y todo el jardín se lee como puntos y aristas que se forman y disuelven en silencio mientras el campo respira.

## Parámetros

- **cell** — el espaciado de la retícula subyacente. Un eje estructural: recoloca toda la rejilla.
- **jitter** — cuánto puede vagar cada punto respecto a su casilla de retícula; el carácter del "jardín" frente a una rejilla rígida.
- **radius** — la distancia de conexión. El botón dramático propio del patrón: tanto el audio como pequeños ajustes hacen que más o menos pares lo crucen.
- **drift** — la amplitud del desplazamiento de ruido guiado por la fase que porta el movimiento intrínseco.
- **dotSize** — el radio dibujado de cada punto; también fija cuánto se recorta una arista desde cada extremo.
- **edgeFade** — cuánta longitud de una arista se desvanece de forma continua hacia el radio de conexión, frente a aparecer y desaparecer de golpe en un corte duro.
- **strokeWidth** — el grosor de línea. Una decisión de dibujo.
- **opacity** — la opacidad base sobre la que se escala cada punto y cada arista.
