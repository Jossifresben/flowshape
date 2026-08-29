---
source: Hobbs, T. (2020) "Flow Fields"; la regla de separación de líneas sigue a Jobard, B. y Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density"
url: https://www.tylerxhobbs.com/words/flow-fields
---

## Fórmula

    ángulo(x, y) = noise2D(x·freq, y·freq) · π · curl
    x += cos(ángulo) · pasoLen
    y += sen(ángulo) · pasoLen     (integración de Euler)

## Qué significa

Un campo de flujo es una dirección asignada a cada punto del plano: aquí esa dirección sale de muestrear una función de ruido en cada posición y convertir el resultado en un ángulo. Una partícula soltada en cualquier lugar simplemente va dando pasos en la dirección que el campo marca en su posición actual, trazando una curva que se dobla allí donde se dobla el ruido subyacente. Como el propio campo de ruido es suave y continuo, partículas cercanas trazan curvas casi paralelas, y todo el lienzo se llena de líneas que se sienten como una única corriente coherente en vez de garabatos independientes: la misma lógica de las limaduras de hierro alineándose con las líneas de un campo magnético.

Dos parámetros dan forma a esa corriente antes de dibujar una sola línea. La frecuencia a la que se muestrea el ruido fija el tamaño de los remolinos: una frecuencia baja estira el mismo patrón de ruido sobre un área amplia, así que las líneas derivan y se curvan suavemente a lo largo de grandes distancias; una frecuencia alta lo comprime, produciendo bucles más apretados y turbulentos. El multiplicador curl escala cuánto se estira ese valor bruto de ruido al convertirlo en ángulo antes de que la partícula gire: un curl pequeño mantiene el campo cerca de una deriva laminar recta, mientras que un curl grande deja que un pequeño cambio de ruido haga virar la dirección de forma brusca, produciendo esos bucles ornamentales que aparecen cerca de la parte alta del control.

Las propias líneas se mantienen sin cruzarse ni amontonarse gracias a una regla sencilla: a medida que una línea avanza, va reclamando las pequeñas celdas de una rejilla por las que pasa, y en el momento en que entra en una celda ya reclamada por otra línea, se detiene. Es una versión tosca, basada en rejilla, de la técnica clásica de líneas de corriente equiespaciadas: en vez de medir distancias exactas a cada otra línea, solo comprueba si esa celda ya pertenece a otra.

## Parámetros

- **freq** — la frecuencia espacial a la que se muestrea el campo de ruido. Valores más bajos producen remolinos grandes que giran despacio; valores más altos producen curvas más apretadas y turbulentas.
- **curl** — multiplica el valor bruto del ruido antes de convertirlo en ángulo de giro, controlando cuán bruscamente pueden doblarse las líneas: desde una deriva laminar suave con valores bajos hasta bucles ornamentales muy cerrados con valores altos.
- **spacing** — el espaciado de la rejilla entre los puntos de partida candidatos para las líneas de corriente (se descarta al azar un 35% de los candidatos). Controla la densidad con que se siembran las líneas por el lienzo.
- **steps** — el número máximo de pasos de integración que puede dar una sola línea de corriente (cada paso avanza 2 unidades del lienzo) antes de cortarse, incluso si nunca choca con otra línea.
- **strokeWidth** — grosor de línea de cada línea de corriente trazada. Una decisión de dibujo.
- **emphasisEvery** — una de cada k líneas de corriente dibujadas con éxito, contadas en el orden en que se colocaron, se dibuja más gruesa y totalmente opaca en vez del trazo fino y translúcido por defecto. Puramente decorativo: no tiene efecto sobre las trayectorias trazadas.
