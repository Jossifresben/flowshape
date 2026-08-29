---
source: Webb, J. "2D Differential Growth Experiments" (en curso desde 2018)
url: https://github.com/jasonwebb/2d-differential-growth-experiments
---

## Fórmula

    polilínea cerrada de nodos n₀ … n_{m-1}
    en cada iteración, para cada nodo nᵢ (prev = n_{i-1}, next = n_{i+1}):

      atracción = k_a · (punto_medio(prev, next) − nᵢ)
      repulsión = Σ_{j: |nᵢ−nⱼ| < R}  (1 − d/R) · (nᵢ − nⱼ) / d      (d = |nᵢ − nⱼ|, R = radio de repulsión)
      nᵢ ← nᵢ + clamp(atracción + repulsión + ruido)

    dividir arista (nᵢ, n_{i+1}) si |nᵢ − n_{i+1}| > dMax   (se inserta un punto medio)
    fusionar arista (nᵢ, n_{i+1}) si |nᵢ − n_{i+1}| < dMin  (se elimina nᵢ)

## Qué significa

Se parte de un bucle cerrado de puntos y se le aplican dos fuerzas opuestas en cada fotograma, indefinidamente. La atracción tira de cada punto hacia el punto medio de sus dos vecinos; dejada sola, esta fuerza se limitaría a suavizar el bucle hasta convertirlo en un círculo liso que se encoge hasta un punto. La repulsión actúa en sentido contrario: empuja cada punto lejos de cualquier otro punto del bucle que se haya acercado dentro del radio de repulsión R, sea o no su vecino real sobre la curva. Ese es el detalle decisivo: a la repulsión no le importa la topología del bucle, solo la proximidad física, así que cuando la curva se apretuja tiene que combarse hacia fuera para aliviar la presión, porque ya no puede simplemente encogerse.

La contabilidad de división y fusión es lo que permite que ese combado se acumule en crecimiento en vez de atascarse: cada vez que dos puntos adyacentes se separan demasiado, se inserta un punto nuevo entre ellos, añadiendo perímetro; cada vez que dos puntos adyacentes quedan demasiado juntos, se elimina uno de ellos. Eso mantiene la densidad de puntos más o menos constante sobre una curva cuya longitud total no deja de aumentar —exactamente el mecanismo que hay detrás del arrugamiento del coral, los bordes de una hoja de lechuga o los pliegues de la corteza cerebral: se añade material más deprisa de lo que el espacio disponible puede absorber, y ese material se ve forzado a plegarse en nuevos pliegues.

El radio de repulsión es, en la práctica, el único mando real de forma del patrón: un R pequeño deja que los puntos se apiñen antes de empujarse entre sí, así que los pliegues aparecen pronto y quedan pequeños y apretados; un R grande mantiene los puntos separados durante más tiempo, produciendo lóbulos más amplios, más pausados, antes de que se active la misma presión de apiñamiento.

## Parámetros

- **iterations** — cuántos pasos de la simulación se ejecutan antes de congelar el bucle y dibujarlo. Más iteraciones permiten acumular más plegado; las instantáneas muy tempranas todavía parecen un bucle liso, mientras que las tardías están densamente arrugadas.
- **repulsion** — R, el radio de repulsión. El mando real de forma del patrón: valores pequeños producen muchos pliegues pequeños y apretados; valores grandes producen lóbulos más amplios y menos numerosos.
- **rings** — cuántas instantáneas anteriores del bucle, tomadas en puntos igualmente espaciados a lo largo de la simulación, se conservan y se dibujan tenuemente detrás de la forma final como anillos de crecimiento. Una decisión de visualización superpuesta a la simulación, no parte de la regla de crecimiento en sí: muestra la historia del mismo bucle, no cambia su resultado.
- **strokeWidth** — el grosor de línea del bucle final. Una decisión de dibujo; las instantáneas de anillos anteriores se dibujan automáticamente más finas y transparentes.
