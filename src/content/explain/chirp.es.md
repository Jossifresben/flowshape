---
source: Señal chirp lineal (barrido de frecuencia); cf. Wikipedia, "Chirp"
url: https://en.wikipedia.org/wiki/Chirp
---

## Fórmula

    u    = (x − margin) / W                        (u ∈ [0, 1] a lo ancho del marco)
    φ(u) = 2π · ( freqStart·u + (freqEnd − freqStart)·u² / 2 )
    env(u) = amplitude · (0,06 + 0,94·u²)
    y(u) = fila_i + env(u) · sin( φ(u) + i·phaseStep )

## Qué significa

Cada una de las lineCount filas es una onda seno, pero no de tono constante: φ(u) es la fase de un *chirp lineal* — una señal cuya frecuencia instantánea sube de forma lineal desde freqStart hasta freqEnd conforme u recorre el marco de izquierda a derecha. Derivar φ(u) respecto a u da exactamente esa rampa, `freqStart + (freqEnd − freqStart)·u`; el término en u² de la fase es simplemente lo que resulta de integrar una frecuencia que crece de forma lineal. Es la misma construcción que se usa en el radar y en los chirps de audio, aquí dispuesta en horizontal en vez de reproducida en el tiempo.

La envolvente refuerza el efecto: env(u) arranca en solo el 6% de la amplitud y crece hasta la amplitud completa en u = 1, siguiendo u². Así que cada línea empieza casi plana y lenta a la izquierda —visualmente en calma, casi paralela— y en el borde derecho oscila a alta frecuencia con toda su amplitud, ambos efectos reforzándose hasta leerse como un cierre repentino en un nudo tejido.

phaseStep es lo que evita que las filas se muevan al unísono: desplaza la fase de cada línea sucesiva en i·phaseStep, así que las filas vecinas se desincronizan a medida que u crece. Cerca de u = 0 las pequeñas diferencias de fase apenas importan y las líneas parecen una pila ordenada y tranquila; en u = 1, con frecuencia y amplitud al máximo, ese mismo pequeño desfase basta para que las líneas vecinas se crucen y se entrelacen — el arco visual, del orden al caos tejido, sobre el que está construido este patrón.

## Parámetros

- **lineCount** — cuántas filas paralelas de chirp se dibujan, apiladas en vertical a lo ancho del marco.
- **freqStart** — la frecuencia instantánea en el borde izquierdo (u = 0); valores bajos arrancan el barrido casi plano.
- **freqEnd** — la frecuencia instantánea en el borde derecho (u = 1); la diferencia entre freqStart y freqEnd es el rango que recorre el barrido.
- **amplitude** — la oscilación vertical máxima de la onda seno, alcanzada en el borde derecho; también fija el espacio vertical necesario entre filas para que el barrido nunca se recorte.
- **phaseStep** — el desfase aplicado a cada fila sucesiva; el parámetro que convierte el lado izquierdo en calma en el lado derecho entrelazado y tejido.
- **strokeWidth** — el grosor de línea de cada fila; una decisión de dibujo sin efecto sobre el chirp subyacente.
