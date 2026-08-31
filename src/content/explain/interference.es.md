---
source: Interferencia de ondas de dos fuentes — el argumento de diferencia de fase que fija las franjas a la familia de hipérbolas con focos en las fuentes es física de ondas clásica, la misma construcción que hay detrás del patrón de doble rendija y de la figura de dos puntos en una cubeta de ondas; cf. Wikipedia, "Wave interference"; el dibujo por desplazamiento de líneas horizontales y su composición son construcción propia de este proyecto
url: https://en.wikipedia.org/wiki/Wave_interference
construction: original
---

## Fórmula

    Sᵢ = fuentes en la línea horizontal central del cuadro, separadas `separation`, simétricas respecto al eje vertical
    kᵢ = frequency · (1 + detune · i)                    (número de onda por fuente)

    z(x,y) = Σᵢ sin( kᵢ · dist((x,y), Sᵢ) + φᵢ )         (campo sumado)

    y(x) = fila_y + z(x, fila_y) · amplitude             (cada vértice de la polilínea, desplazado en vertical)

## Qué significa

Dos fuentes puntuales, cada una irradiando una onda circular en expansión: con igual número de onda, las crestas de una sola fuente caen sobre una familia de círculos concéntricos. Donde dos de esas ondas se solapan, lo que un ojo o un oído reciben de verdad es la SUMA, y esa suma es máxima allí donde la diferencia de camino entre las dos fuentes —`dist` a S₁ menos `dist` a S₂— es un múltiplo entero de la longitud de onda, y mínima allí donde cae en un semi-múltiplo. El conjunto de puntos que comparte una diferencia de camino fija respecto a dos focos fijos es, por definición de manual, una hipérbola —así que las franjas claras y oscuras de un campo de dos fuentes caen exactamente sobre la familia de hipérbolas con focos en las dos fuentes. Eso lo impone la geometría del propio campo de distancias, no una decisión tomada en el código.

Este patrón dibuja ese campo de forma indirecta: en vez de sombrear el plano, un lecho de líneas horizontales se dobla en vertical según el valor del campo en cada punto, de modo que una franja se lee como el lugar donde varias líneas vecinas se juntan (interferencia destructiva que las atrae entre sí) o se separan (interferencia constructiva que las aparta). En el registro por defecto las fuentes quedan muy fuera del lienzo y el desplazamiento es lo bastante grande como para que las líneas vecinas no solo se acerquen: se cruzan y permanecen cruzadas a lo largo de un tramo real del cuadro, y bajo un trazo translúcido esos cruces sostenidos se trenzan en las cintas luminosas y sedosas que son la razón de ser de este registro; bajar el número de líneas y la amplitud relaja la misma geometría hacia un barrido más calmado, sin cruces.

`detune` rompe a propósito la premisa de igual número de onda: con k₂/k₁ ≠ 1, las hipérbolas dejan de ser estáticas y las franjas derivan de forma visible a medida que avanza la fase. La fase de cada fuente avanza su propio número entero pequeño de vueltas completas por ciclo de animación, lo que mantiene el campo entero exactamente periódico en uno pase lo que pase con el número de onda de esa fuente bajo `detune`, así que el bucle cierra sin costura por muy rápido que parezcan viajar las franjas.

## Parámetros

- **lines** — el número de polilíneas horizontales que muestrean el campo. Un eje estructural: cambia con cuánta densidad se muestrea el campo, no es una deformación suave de las líneas ya dibujadas.
- **sources** — cuántas fuentes puntuales contribuyen al campo (2 o 3).
- **frequency** — el número de onda k, en radianes por píxel de distancia real; fija cuántas franjas cruzan el cuadro.
- **amplitude** — la ganancia del desplazamiento vertical; el botón dramático propio del patrón, lo bastante profundo por defecto como para que las líneas se crucen y se trencen.
- **separation** — la distancia entre fuentes contiguas; se mantiene muy fuera del lienzo por defecto, lo que impide que las franjas se lean como anillos cerrados alrededor de un centro visible y las deja como curvas abiertas y amplias.
- **detune** — cuánto difiere el número de onda de la segunda fuente (y la tercera) respecto al de la primera, como fracción; los valores distintos de cero hacen que el patrón de franjas derive en vez de permanecer estático.
- **strokeWidth** — el grosor de línea. Una decisión de dibujo.
- **opacity** — la opacidad base con la que se dibuja cada línea; los valores bajos son lo que permite que las líneas cruzadas se trencen en solapes más brillantes.
