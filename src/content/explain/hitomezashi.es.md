---
source: Seaton, K.A. (2023) "Mathematical specification of hitomezashi designs", Journal of Mathematics and the Arts 17(1-2)
url: https://arxiv.org/abs/2208.12580
doi: 10.1080/17513472.2023.2187999
---

## Fórmula

    cᵢ, rⱼ ∈ {0, 1}                       para cada columna i, cada fila j (moneda con semilla)

    guion vertical en columna i, fila j    si (j + cᵢ) mod 2 = 0
    guion horizontal en fila j, columna i  si (i + rⱼ) mod 2 = 0

    paridad de región: fill(i, j) = prefixXor(c, i) ⊕ prefixXor(r, j)

## Qué significa

El hitomezashi ("una puntada") es una técnica sashiko de punto corrido: la aguja entra y sale siguiendo una cuadrícula, y cada fila o columna de puntadas queda desplazada según si empieza en un cuadro par o impar. Las matemáticas detrás de esto son casi sorprendentemente simples: se lanza una moneda por columna y otra por fila, y se coloca un guion allí donde una comprobación de paridad —índice de fila más bit de columna— da resultado par. Esa única regla, aplicada de forma independiente a cada columna para los guiones verticales y a cada fila para los horizontales, es todo el generador. Ningún guion mira a sus vecinos; los muros largos, los zigzags y los bucles cerrados del dibujo surgen únicamente de cómo interactúan esos bits fijos por línea a medida que se recorre la cuadrícula.

El truco de paridad de la segunda línea hace algo más: colorea a dos tintas las regiones que encierra el punteado, sin trazar ningún contorno ni rellenar nada por inundación. Acumular el XOR de los bits de columna hasta i, y por separado el de los bits de fila hasta j, y combinar ambas sumas parciales con otro XOR, dice al instante en qué "lado" cae una celda cualquiera —la misma idea de propagar la paridad que se usa para colorear a dos tintas un enlosado de arcos de Truchet, aplicada aquí a una cuadrícula de puntadas corridas en vez de baldosas curvas.

Como cada columna y cada fila se decide con un lanzamiento de moneda independiente, la probabilidad del bit es el único mando real sobre el carácter del patrón: una moneda equilibrada (0,5) produce una mezcla pareja de muros largos y zigzags cortos, mientras que sesgarla hacia 0 o hacia 1 estira los guiones en tramos largos sin cortes en una sola dirección.

## Parámetros

- **cell** — el paso de la cuadrícula, en unidades del lienzo: la separación entre líneas de puntada. Celdas más pequeñas encajan más filas y columnas en el marco, dando un punteado más fino.
- **bitChance** — la probabilidad de que un bit de columna o de fila dado sea 1, en vez de una moneda equilibrada al 50/50. Apartarla de 0,5 sesga la propia construcción, alargando los guiones en tramos más largos con menos cambios de dirección.
- **strokeWidth** — el grosor de las líneas de puntada. Una decisión de dibujo sin efecto sobre el patrón de bits subyacente.
- **fillParity** — activa un relleno translúcido de acento sobre las regiones a dos tintas que identifica la fórmula de paridad. Visualiza matemáticas reales (el coloreado de regiones por XOR acumulado), pero desactivarlo no cambia el patrón de puntadas en sí —solo si esa estructura oculta se dibuja o no.
