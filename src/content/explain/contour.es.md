---
source: Lorensen, W. E. y Cline, H. E. (1987) "Marching Cubes: A high resolution 3D surface construction algorithm", SIGGRAPH '87 (el caso 2-D, marching squares); el campo es ruido de valor browniano fraccionario según Perlin, K. (1985) "An image synthesizer"
url: https://es.wikipedia.org/wiki/Marching_squares
doi: 10.1145/37401.37422
---

## Fórmula

    v(x, y) = ½ + ½ · contrast · fbm(x · s, y · s)          recortado a [0, 1]
    fbm     = Σₖ ruido(2ᵏ · x, 2ᵏ · y) / 2ᵏ,  k = 0 … octaves − 1

    nivel i:   región { v ≥ i / N },  i = 1 … N − 1
    frontera trazada con marching squares, cruces por interpolación lineal

## Qué significa

Un mapa de curvas de nivel es un campo escalar cortado a alturas equiespaciadas. El campo aquí es ruido browniano fraccionario: capas de ruido de valor suave, cada una el doble de fina y la mitad de intensa que la anterior, que es la receta habitual para un terreno que parece terreno. Lo interesante no es el campo sino el corte. Marching squares muestrea el campo en una retícula y examina cada cuadradito por turno: si algunas esquinas están por encima del umbral y otras por debajo, la línea de nivel tiene que cruzar ese cuadrado, y lo cruza exactamente por las aristas cuyos dos extremos discrepan. El punto de cruce lo fija la interpolación lineal entre los dos valores de esquina, de modo que la línea cae donde el campo alcanza de verdad el umbral, no sobre la retícula. Hay dieciséis maneras de que cuatro esquinas estén por encima o por debajo, dos de ellas sillas ambiguas que resuelve el valor central, y encadenar los segmentos resultantes arista con arista cierra cada línea de nivel en un lazo.

Como cada región contiene a la siguiente, dibujarlas de abajo arriba es una pila de pintor: cada terraza cubre de verdad a la que tiene debajo, y de ahí se lee la profundidad. Un anillo de muestras por debajo de todos los umbrales, justo fuera del marco, garantiza que una región que se sale de la hoja siga cerrándose, y sus cruces se ajustan al borde de la hoja. Con rellenos que alternan tinta y papel la hoja se lee como un mapa topográfico cortado en bandas; en modo isolíneas los mismos lazos se dibujan como líneas finas.

Nada de la construcción se suaviza después: los lazos son polígonos con un vértice por cruce de retícula, que a este paso es suficientemente fino para imprimir.

## Parámetros

- **noiseScale** — la frecuencia espacial a la que se muestrea el campo. Valores bajos dan colinas amplias y lentas; valores altos, muchos picos pequeños.
- **octaves** — cuántas capas de ruido se suman. Una octava es un único oleaje suave; cinco añaden detalle fino a cada borde.
- **levels** — N, el número de bandas de altura en que se corta el campo. Se dibujan N − 1 fronteras.
- **contrast** — estira el campo alrededor de su punto medio antes de cortarlo. Valores altos empujan más hoja a las bandas superior e inferior; valores bajos lo mantienen todo cerca de los niveles centrales.
- **mode** — terrazas (regiones rellenas, alternando tinta y papel) o isolíneas (los mismos lazos como trazos).
- **strokeWidth** — grosor de línea en modo isolíneas. Una decisión de dibujo.
- **accentEvery** — uno de cada k niveles en el color de acento, como relleno o como trazo más grueso. 0 lo desactiva.
