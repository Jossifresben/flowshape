---
source: Truchet, S. (1704) "Mémoire sur les combinaisons"; la variante de arcos fue popularizada por Smith, C.S. (1987) "The Tiling Patterns of Sébastien Truchet and the Topology of Structural Hierarchy", Leonardo 20(4)
url: https://en.wikipedia.org/wiki/Truchet_tiles
---

## Fórmula

    cuadrícula de celdas s×s, cols × filas sobre el marco
    en cada celda: flip ← lanzamiento de moneda con semilla

    variante diagonal (1704): la celda se corta por una diagonal;
      flip = verdadero → se rellena el triángulo superior-izquierdo
      flip = falso     → se rellena el triángulo inferior-derecho

    variante de arcos (Smith, 1987): dos arcos de cuarto de círculo,
      radio s/2, cada uno uniendo los puntos medios de dos lados
      adyacentes; flip decide sobre qué par de esquinas opuestas
      se curvan los arcos

## Qué significa

El memoire original de Truchet, de 1704, planteaba una pregunta engañosamente pequeña: ¿qué ocurre si se coloca una copia de una única baldosa asimétrica, girada al azar, en cada celda de una cuadrícula? Su baldosa era un cuadrado cortado por la diagonal, con uno de los dos triángulos coloreado. Con solo dos orientaciones efectivas por celda (girar 180° un cuadrado medio relleno da la misma imagen que invertirlo), el generador entero se reduce a una moneda por celda: ninguna celda vecina "sabe" nada de la otra, y sin embargo aparece una estructura global por pura estadística de vecindad.

La variante de Smith, de 1987, sustituye el corte diagonal por dos arcos de cuarto de círculo que caen siempre sobre los mismos dos puntos: los puntos medios de los lados de la celda. Ese anclaje fijo es la clave: como los arcos de cualquier baldosa tocan siempre esos mismos cuatro puntos medios, sin importar la orientación, un arco de una celda siempre encaja con el de la celda vecina, y toda la cuadrícula se resuelve en un campo de curvas continuas y serpenteantes, sin huecos ni callejones sin salida —las llamadas "curvas de Truchet"— que le dan a esta variante su aspecto de laberinto, muy distinto del aspecto cristalino y facetado de la variante diagonal.

Aquí ambas variantes son de escala única: cada celda se decide de forma independiente con un lanzamiento de moneda, sin ninguna jerarquía de tamaños de baldosa. Lo que decide el carácter del dibujo es, simplemente, cuánto se sesga esa moneda hacia una orientación u otra, y con qué densidad se empaqueta la cuadrícula.

## Parámetros

- **cell** — el paso de la cuadrícula, en unidades del lienzo: el lado de cada baldosa cuadrada. Celdas más pequeñas empaquetan más baldosas en el marco y se leen como curvas o facetas más finas y densas.
- **variant** — elige el motivo de la baldosa: el corte diagonal original de Truchet (1704) o los arcos de cuarto de círculo de Smith (1987). Cambia la construcción subyacente, no solo el aspecto.
- **render** — una decisión de dibujo, no matemática: trazar cada baldosa como un contorno abierto (el aspecto tradicional) o como una forma rellena a dos tintas (polígonos de tinta plana, sin ningún trazo).
- **strokeWidth** — el grosor de línea en modo contorno. Un ajuste puramente de dibujo.
- **boldChance** — la probabilidad de que el trazo de una baldosa concreta se dibuje al doble de grosor en vez del grosor base, en modo contorno. Un acento de dibujo que no afecta a la geometría de la baldosa.
- **accentChance** — la probabilidad de que una baldosa concreta se dibuje con el color de acento en vez de tinta. Otro ajuste puramente decorativo sobre la misma geometría de moneda al aire.
