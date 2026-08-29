---
source: Bourke, P. "Harmonograph"; la física subyacente se remonta a Lissajous, J.A. (1857)
url: https://paulbourke.net/geometry/harmonograph/
---

## Fórmula

    x(t) = A1·sen(f1·t + p1)·e^(−d1·t) + A2·sen(f2·t + p2)·e^(−d2·t)
    y(t) = A3·sen(f3·t + p3)·e^(−d3·t) + A4·sen(f4·t + p4)·e^(−d4·t)
    t ∈ [0, T]

## Qué significa

Un armonógrafo real es un aparato de péndulos: dos o más péndulos, cada uno oscilando a su propia frecuencia, guían juntos una pluma sobre el papel. Cada péndulo aporta un término seno amortiguado —amortiguado porque el rozamiento va drenando energía del péndulo, así que su amplitud se reduce con el tiempo como e^(−d·t) en lugar de oscilar para siempre—. Este patrón suma dos términos así por eje, un par que impulsa x y otro que impulsa y, de modo que la pluma traza la curva que resulta de lo que los cuatro péndulos acuerdan juntos.

Si las dos frecuencias que alimentan un eje estuvieran fijadas en una razón exacta de enteros pequeños y sin amortiguación, se obtendría una figura de Lissajous cerrada corriente: un ocho o un nudo fijo que se repite para siempre. Aquí dos cosas rompen esa quietud. La amortiguación va encogiendo toda la curva hacia dentro con el tiempo, así que en vez de retrazar un bucle fijo, la pluma va en espiral hacia el centro a medida que los péndulos se quedan sin energía —esa decadencia es lo que le da a un trazado de armonógrafo su aspecto característico, en capas y que se afina—. Y el desafine —un pequeño desplazamiento añadido a una frecuencia para que deje de tener una razón exacta de enteros con su pareja— impide que la figura llegue nunca a cerrarse sobre sí misma; en cambio, todo el patrón precesa lentamente, girando y remodelándose a lo largo de la duración del trazado, que es lo que rellena el aspecto denso y ricamente entrelazado de un trazado de armonógrafo real en vez de un único bucle limpio de Lissajous.

## Parámetros

- **ratio** — la razón de frecuencias base entre los dos pares de péndulos (2:3, 3:4, 1:2 o 3:5). Fija la familia de figura que trazaría la curva sin amortiguar y sin desafinar: el "esqueleto" que el resto de parámetros distorsiona.
- **detune** — un pequeño desplazamiento añadido a una de las frecuencias emparejadas, que rompe la razón exacta. Esto es lo que impide que la figura se cierre en un bucle fijo y en cambio hace que precese lentamente con el tiempo, rellenando el lienzo con pasadas entrelazadas.
- **damping** — la rapidez con que decae la amplitud de cada péndulo, e^(−d·t). Una amortiguación baja traza una figura grande y de vida larga; una amortiguación alta colapsa la curva hacia el centro rápidamente.
- **duration** — T, cuánto tiempo (en las mismas unidades que las frecuencias) se deja oscilar a los péndulos simulados antes de detener el muestreo.
- **strokeWidth** — grosor de línea de la curva trazada. Una decisión de dibujo.
- **opacity** — opacidad de la línea trazada. Como la curva se superpone sobre sí misma miles de veces mientras espirala hacia dentro, una opacidad baja es lo que hace que las regiones más densas y retrazadas del dibujo se lean visiblemente más oscuras: una decisión de dibujo, no parte de la física.
