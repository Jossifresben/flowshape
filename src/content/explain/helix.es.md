---
source: Hélice, curva paramétrica de doble hélice; cf. Wikipedia, "Hélice"
url: https://es.wikipedia.org/wiki/H%C3%A9lice_(geometr%C3%ADa)
---

## Fórmula

    t(k)  = (k / N) · turns · 2π                    (k = 0 … N)
    x(t,φ) = cx + radius · cos(t + φ)
    y(t)   = yTop + (t / tMax) · usableHeight
    z(t,φ) = sin(t + φ)

    hebra A: φ = 0        hebra B: φ = π
    peldaño en k:  segmento del punto de la hebra A al de la hebra B, mismo k

## Qué significa

Una hélice es una curva que gira a velocidad angular constante alrededor de un eje mientras avanza a velocidad lineal constante a lo largo de él — aquí x y z trazan la sección circular (coseno y seno del mismo ángulo t) mientras y desciende de forma constante por el marco a medida que t crece. Dos copias de esa curva, desfasadas exactamente π, se sitúan en lados opuestos del eje a cada altura: esa es la construcción de doble hélice, y como el desfase es media vuelta, la hebra B está siempre exactamente donde estuvo la hebra A media vuelta antes — nunca se tocan pero mantienen una relación especular constante, la forma clásica de escalera.

z aquí es una tercera coordenada genuina, no un truco de dibujo: es la componente de profundidad que una vista ortográfica cenital de la hélice normalmente descartaría. El patrón la conserva y la usa para el sombreado en vez de para la proyección — el grosor de trazo de cada segmento de hebra se escala con la z media de sus extremos mediante depthFade, así que las partes de la curva que giran hacia el espectador (z cerca de +1) se dibujan más gruesas que las que giran hacia atrás (z cerca de −1). Así es como se falsea la profundidad en un SVG plano: sin proyección 3D real, solo el grosor haciendo de sustituto de la distancia.

Los peldaños se dibujan primero, y luego ambas hebras encima, de modo que las hebras siempre se leen por delante de los peldaños — un simple truco de orden de dibujo, no parte de la geometría de la hélice en sí. rungEvery controla cuántos de los N peldaños muestreados se dibujan realmente; saltarse algunos mantiene el aspecto de escalera sin cablear cada sección transversal.

## Parámetros

- **turns** — cuántas vueltas completas de 2π da la hélice de arriba abajo del marco; más vueltas significa una espiral más apretada y densa.
- **radiusFraction** — el radio de la hélice como fracción del lado más corto del marco.
- **rungEvery** — cada cuántos pasos muestreados se dibuja un peldaño entre las dos hebras; una decisión de muestreo/dibujo, no parte de la geometría propia de la hélice.
- **depthFade** — cuán fuerte puede la coordenada z hacer oscilar el grosor de trazo entre fino y grueso; 0 elimina por completo la ilusión de profundidad y todos los segmentos se dibujan con el mismo grosor.
- **strokeWidth** — el grosor de línea base antes de aplicar el sombreado por profundidad; una decisión de dibujo.
