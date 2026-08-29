---
source: Plouffe, S. (patrón); Polster, B. y Geracitano, G., "Times Tables, Mandelbrot and the Heart of Mathematics" (Mathologer, 2019)
url: https://www.youtube.com/watch?v=qhbuKbxJsk8
---

## Fórmula

    N puntos sobre un círculo: P_k = (cos 2πk/N, sen 2πk/N),   k = 0 … N−1
    para cada k: trazar una cuerda de P_k a P_(k·M mod N)

## Qué significa

Se colocan N puntos repartidos de forma uniforme sobre un círculo y se numeran de 0 a N−1, como la esfera de un reloj. Luego, para cada punto k, se traza una cuerda recta hasta el punto que está M veces más lejos alrededor del círculo; esa posición, envuelta con un módulo, es simplemente k·M mod N. Lo que se está viendo es literalmente la tabla de multiplicar de M, dibujada como geometría en vez de enumerada como números: el punto 7 se conecta con el lugar donde caiga "7×M" una vez que se da la vuelta pasando N.

Para valores enteros pequeños de M, las cuerdas no son aleatorias: su envolvente exterior traza una curva concreta y con nombre propio. M=2 produce una cardioide, M=3 una nefroide, M=4 una figura de tres cúspides (un deltoide); son las mismas curvas que aparecen como las cáusticas de luz en una taza de café o como cortes del conjunto de Mandelbrot, y por eso esta construcción tan sencilla tiene una fama tan desproporcionada. A medida que M se acerca a N/2, las cuerdas dejan de agruparse en una envolvente limpia y en su lugar tejen una red densa, en forma de estrella, por todo el disco.

Como la posición de cada punto es una función continua de k y no una consulta a una lista de índices, M no tiene por qué ser un número entero: el código evalúa k·M mod N como un ángulo continuo incluso cuando M lleva decimales. Eso significa que este patrón puede transformarse suavemente por todos los valores intermedios entre las curvas con nombre, en vez de saltar de una a otra de forma discreta.

## Parámetros

- **chords** — N, el número de puntos repartidos sobre el círculo (también el módulo en k·M mod N). Más puntos dan mayor resolución angular y más cuerdas.
- **multiplier** — M, el multiplicador de la tabla. Es el parámetro que más importa: los enteros pequeños (2, 3, 4…) producen las envolventes clásicas de cardioide/nefroide/deltoide, y como aquí M puede tener decimales, la figura se transforma de manera continua entre ellas en vez de cambiar de golpe.
- **strokeWidth** — grosor de línea de cada cuerda. Una decisión de dibujo.
- **opacity** — opacidad de cada cuerda. Con cientos de cuerdas superpuestas dibujadas, una opacidad baja es lo que convierte las regiones cruzadas por muchas cuerdas en curvas visiblemente más oscuras: la envolvente se hace visible solo por densidad de superposición, un efecto de dibujo añadido sobre la geometría.
- **showCircle** — si se dibuja o no un círculo de referencia tenue que pasa por los N puntos. Puramente decorativo.
