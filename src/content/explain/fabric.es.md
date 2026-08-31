---
source: Quílez, I. (2002), "Domain Warping"
url: https://iquilezles.org/articles/warp/
---

## Fórmula

    s   = noiseScale / min(W, H)
    x'  = x + warpAmount · fbm(x·s, y·s)
    y'  = y + warpAmount · fbm(x·s + 5,2, y·s + 1,3)

    fbm(x, y) = Σₒ ruidoₒ(x·2ᵒ, y·2ᵒ) / 2ᵒ   (o = 0, 1 — dos octavas, normalizado)

## Qué significa

Se parte de una retícula regular de gridSize × gridSize puntos. El domain warping —el término que acuñó Quílez— no distorsiona la retícula directamente: desplaza cada punto *evaluando ruido en la posición del propio punto* y usando los dos valores devueltos como vector de desplazamiento. Las dos muestras de ruido se toman en posiciones separadas por un desfase fijo (`+5,2`, `+1,3`) precisamente para que los desplazamientos en x y en y queden descorrelacionados: sin ese desfase toda la retícula respiraría de forma uniforme en una sola diagonal en vez de ondular.

El ruido en sí es movimiento browniano fractal (fbm) — dos octavas de ruido de valor interpolado con smoothstep, donde la capa gruesa fija la deriva amplia y la capa fina se monta encima con la mitad de amplitud. Ese apilado es lo que mantiene el warp con aspecto orgánico en vez de una onda suave y única: los puntos vecinos se mueven juntos a la escala gruesa pero reciben desviaciones pequeñas e independientes de la segunda octava, que es justo la textura de una tela dibujada a mano o de un tejido de fibra impreso.

El patrón dibuja la retícula deformada de tres maneras. Como puntos, cada posición deformada se convierte en un círculo relleno — la retícula se lee como un moteado disperso, textil. Como malla, los puntos consecutivos de cada fila y columna original se conectan en polilíneas, de modo que las líneas *rectas* de la retícula sin deformar se convierten en curvas suavemente onduladas — visiblemente la misma construcción que describe Quílez para terrenos y nubes, solo que dibujada como líneas de tinta en vez de píxeles sombreados. Como cuadrados — un guiño al motivo de los "hiding squares" del arte computacional de los años 60 — cada *celda* de la retícula sin deformar dibuja un cuadrado relleno en vez de desplazar un punto: las mismas dos lecturas de ruido que desplazan puntos/malla ahora dirigen a la vez la traslación, la escala y la rotación del cuadrado de esa celda. Donde el ruido es casi cero el cuadrado queda centrado, sin girar, llenando su celda; donde el ruido es fuerte el cuadrado se encoge, se desliza y gira, dejando ver el papel en las esquinas. La traslación y el tamaño siempre se mantienen dentro de la propia celda del cuadrado — por mucho que empuje el ruido, como mucho puede tocar a sus vecinos, nunca solaparse con ellos. Como se monta sobre las mismas lecturas de ruido a la deriva que los otros dos modos, el efecto de ocultamiento viaja como una onda animada sin coste, sin matemática adicional propia.

## Parámetros

- **gridSize** — el número de puntos de la retícula por lado antes de deformar. Valores más altos dan un tejido más fino y más detalle de textura del ruido, a costa de más elementos.
- **warpAmount** — la magnitud del desplazamiento aplicado a cada punto; 0 deja la retícula perfectamente regular, valores mayores empujan el warp hacia desgarros y solapes visibles. En el modo de cuadrados este mismo valor fija, en cambio, cuánto puede morder el ruido el tamaño, el desplazamiento y el giro de cada cuadrado — 0 deja una retícula plana de cuadrados completos, sin tocar.
- **noiseScale** — cuántos ciclos del campo de ruido caben en el marco; valores bajos dan una deriva amplia y lenta, valores altos dan ondulaciones apretadas y rápidas.
- **mode** — una decisión de dibujo, no parte de las matemáticas: si la retícula deformada se dibuja como campo de puntos, como líneas de malla conectadas o como cuadrados que se ocultan.
- **dotSize** — el radio con que se dibuja cada punto en el modo de puntos; una decisión de dibujo pura, sin efecto sobre el warp subyacente. Sin efecto en los modos de malla y de cuadrados.
- **strokeWidth** — el grosor de línea de la malla en el modo de malla; también una decisión de dibujo. Sin efecto en los modos de puntos y de cuadrados.
