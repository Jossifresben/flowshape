---
source: Bridson, R. (2007) "Fast Poisson Disk Sampling in Arbitrary Dimensions", ACM SIGGRAPH 2007 Sketches
url: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
doi: 10.1145/1278780.1278807
---

## Fórmula

    viñeta(x,y) = 1 − dist((x,y), centro) / distMax
    densidad(x,y) = viñeta·(1 − contraste) + viñeta·ruido(x,y)·2·contraste     (recortado a [0,1])
    hueco(x,y)    = minGap + (1 − densidad(x,y))·(maxGap − minGap)

    aceptar un punto candidato al azar solo si ningún punto ya colocado está a menos de hueco(x,y)

## Qué significa

Esto es muestreo de disco de Poisson con densidad variable: en vez de imponer una única distancia mínima fija entre cada par de puntos, el hueco mínimo cambia de un lugar a otro según un campo de densidad, así que los puntos se apiñan donde el campo es "oscuro" y se separan donde es "claro". La versión implementada aquí es un muestreador por rechazo ingenuo, no el algoritmo original de lanzamiento de dardos O(N) de Bridson —acelera las búsquedas de vecinos con una rejilla para ir más rápido—, pero por lo demás es exactamente la idea que describe Bridson: lanzar un candidato al azar, calcular el espaciado exigido localmente a partir del campo, y quedarse con el punto solo si nada de lo ya colocado está más cerca que ese hueco.

El propio campo de densidad es una mezcla de dos cosas: una viñeta radial suave, más brillante en el centro del lienzo y que se apaga hacia las esquinas, y una textura de ruido fractal superpuesta. El parámetro contraste controla cuánto puede el ruido deformar esa viñeta lisa: con contraste 0 el campo es viñeta pura, así que los puntos simplemente se van espaciando de forma suave del centro al borde; a medida que el contraste sube hacia 1, parches de ruido empiezan a subir o bajar la densidad localmente, rompiendo el degradado suave en grumos y huecos irregulares, más parecido al grano de una impresión de medios tonos que a un desvanecido uniforme.

Cada punto aceptado se convierte directamente en un punto visible en la imagen final, así que aquí la regla de colocación y el dibujo son la misma operación: a diferencia de otros patrones de nube de puntos de esta colección, no hay un paso separado de "qué dibujar" después del muestreo.

## Parámetros

- **minGap** — la separación mínima entre puntos en las regiones más densas (densidad = 1). Fija el grano más fino que puede alcanzar el punteado.
- **maxGap** — la separación mínima en las regiones más vacías (densidad = 0). Fija cuánto pueden alejarse los puntos antes de que el lienzo se lea como en blanco.
- **noiseScale** — la frecuencia espacial del campo de ruido fractal que perturba la densidad; valores más altos meten más detalle de ruido en la misma área, dando un moteado más fino y agitado.
- **contrast** — cuánto puede ese campo de ruido deformar la viñeta radial suave, de 0 (degradado suave puro) a 1 (densidad muy dominada por el ruido, en parches).
- **dotSize** — el radio con que se dibuja cada punto. Una decisión de dibujo, sin efecto sobre dónde se colocan los puntos.
- **accentEvery** — colorea uno de cada k puntos colocados (en el orden en que se colocaron) con el color de acento en vez de tinta. Puramente decorativo; 0 lo desactiva.
