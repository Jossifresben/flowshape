---
source: Amidror, I. (2000) "The Theory of the Moiré Phenomenon, Volume I: Periodic Layers"
url: https://link.springer.com/book/10.1007/978-1-84882-181-1
doi: 10.1007/978-94-011-4205-2
---

## Fórmula

    Λ = 1 / √( 1/dA² + 1/dB² − 2·cos(θB − θA) / (dA·dB) )       (periodo de la franja)

    trama A: líneas paralelas, espaciado dA, ángulo θA
    trama B: líneas paralelas, espaciado dB, ángulo θB
    (modo círculos: dos familias de círculos concéntricos, espaciados dA/dB, centros separados por `offset`)

## Qué significa

Se dibujan dos tramas de forma independiente, cada una un simple conjunto de líneas paralelas igualmente espaciadas, y sencillamente se superponen. Ninguna de las dos tramas contiene, por sí sola, ninguna estructura a gran escala; pero allí donde las dos casi coinciden, el ojo lee una banda clara, y allí donde casi se cancelan, una banda oscura. Ese bandeado, la franja de moiré, no lo dibuja nada en el código: es un puro artefacto de interferencia por superponer dos estructuras periódicas, exactamente el efecto que se ve cuando se superponen dos mosquiteras o dos cortinas de gasa. La fórmula de Λ predice el espaciado de esas franjas a partir únicamente de los periodos propios de las dos tramas y del ángulo entre ellas.

La forma de la fórmula explica directamente los valores por defecto del patrón: cuando los dos espaciados son casi iguales (dA ≈ dB) y el ángulo entre ellos es pequeño, los dos términos 1/d² casi cancelan el término cruzado, y Λ se dispara —las franjas se estiran en bandas lentas y amplias, lo bastante anchas como para verse con claridad, que es exactamente el caso casi degenerado en el que se sitúan los valores por defecto (espaciado 9 frente a 9,6, con 6° de diferencia de ángulo). Al separar más los espaciados, o al ampliar el ángulo, Λ se reduce deprisa: las franjas se cierran en un entramado fino y acaban desapareciendo en lo que parece simplemente la superposición de dos cuadrículas corrientes.

El modo círculos sustituye las dos tramas de líneas por dos familias de círculos concéntricos, desplazadas entre sí en vez de rotadas: el desplazamiento cumple el mismo papel geométrico que la diferencia de ángulo para las líneas rectas, y produce el patrón de roseta en "ondas en un estanque" en lugar de franjas rectas.

## Parámetros

- **mode** — elige qué par de tramas interfiere: dos familias de líneas rectas, o dos familias de círculos concéntricos. Cambia la geometría subyacente sobre la que actúa la fórmula de la franja, no solo cómo se dibuja.
- **spacingA** / **spacingB** — dA, dB, los periodos de las dos tramas. Lo cerca que estén estos dos valores entre sí es la palanca más determinante sobre el periodo de franja Λ.
- **angleA** / **angleB** — θA, θB, la orientación de cada trama de líneas (se ignoran en modo círculos). Su diferencia es el otro término que controla Λ.
- **offset** — solo en modo círculos: la distancia entre los centros de las dos familias de círculos. Cumple el papel que la diferencia de ángulo cumple para las tramas de líneas, controlando cuán apretados quedan los anillos de la roseta resultante.
- **strokeWidth** — el grosor de línea de cada trama. Una decisión de dibujo, pero no neutra: trazos lo bastante gruesos como para solaparse físicamente diluyen la fina estructura de franjas que produce la matemática de la interferencia.
