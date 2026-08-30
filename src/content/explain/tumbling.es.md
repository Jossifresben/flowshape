---
source: Enlosado rómbico (rhombille; "tumbling blocks", "cubos reversibles"), el enlosado de Laves [3.6.3.6] dual del trihexagonal (Grünbaum, B. y Shephard, G.C., 1987, "Tilings and Patterns", enlosado P4-42); ambigüedad del cubo reversible (Necker, L.A., 1832, "Observations on some remarkable optical phænomena seen in Switzerland; and on an optical phænomenon which occurs on viewing a figure of a crystal or geometrical solid", London and Edinburgh Philosophical Magazine 1(5), 329–337)
url: https://en.wikipedia.org/wiki/Rhombille_tiling
doi: 10.1080/14786443208647909
---

## Fórmula

    retícula hexagonal de vértice arriba, circunradio S, coords axiales (q, r):
      C(q,r) = ( √3·S·(q + r/2),  1.5·S·r )
      V_k    = C + S·( cos(−π/2 + kπ/3), sin(−π/2 + kπ/3) ),   k = 0..5

    partición rómbica — tres rombos, cada uno  C + a·e₁ + b·e₂  con a, b ∈ [0,1]:
      superior  e₁ = V₅ − C,  e₂ = V₁ − C     vértices C, V₅, V₀, V₁
      derecho   e₁ = V₁ − C,  e₂ = V₃ − C     vértices C, V₁, V₂, V₃
      izquierdo e₁ = V₃ − C,  e₂ = V₅ − C     vértices C, V₃, V₄, V₅

    terna de tonos, ordenada de menor a mayor carga de tinta (s = faceShading):
      T = [ 1 − 0.75·s,  1 − 0.45·s,  1 ]
      tono(cara i) = i        (cubo hacia fuera)
                   = 2 − i    (cubo hacia dentro — la misma terna, invertida)

    decisión de inversión por hexágono, ξ una extracción de ruido blanco, c = coherence:
      u = (1 − c)·ξ + c·( 0.5 + 0.5·fbm(κ·x, κ·y) ),   κ = 3 / min(w, h)
      invertido ⇔ u < flipChance

    modo trama — cuerdas b = const, a: 0 → 1, altura del rombo |e₂ × ê₁| = (√3/2)·S
      espaciado(tono) = max( S / (hatchDensity · T[tono]),  2·strokeWidth )

## Qué significa

El enlosado es el rómbico (rhombille): se toma una retícula hexagonal de vértice arriba y se parte cada hexágono en tres rombos congruentes de 60°/120° que se encuentran en su centro. Grünbaum y Shephard lo catalogan como el enlosado de Laves [3.6.3.6], dual del trihexagonal (red kagome); las quilteras llevan dos siglos llamándolo "tumbling blocks". Es monoédrico —un solo rombo, repetido— y arista con arista: tres rombos concurren en cada vértice de 120° y seis en cada vértice de 60°, sin huecos ni solapes en ninguna parte.

La razón de que se lea como cubos apilados no es una sugerencia ni un truco óptico añadido por encima. Proyéctese un cubo unitario a lo largo de su diagonal (1,1,1) —la dirección isométrica— y la unión de sus tres caras visibles es *exactamente* un hexágono regular, y cada una de esas tres caras cuadradas cae *exactamente* sobre uno de estos tres rombos. Los pares de vectores de arista son los mismos que `voxel` usa para sus caras superior, izquierda y derecha: {(±√3/2, −1/2), (0, 1)}, escalados por S. Así que el rómbico no es un enlosado que casualmente recuerda a unos cubos: es el enlosado del plano por caras de cubo proyectadas, y de ahí que la ilusión no tenga costuras y que cada hexágono pueda leerse como un cubo sin que sobre nada.

Aquello de lo que el patrón *trata* de verdad es la ambigüedad que ese hecho regala. Sombréense los tres rombos claro, medio, oscuro y el hexágono se lee como un cubo que sale de la página. Inviértase la terna —oscuro, medio, claro— y el hexágono idéntico se lee como un hueco cúbico que entra en ella. Nada geométrico cambia: los tres rombos son congruentes, el enlosado es el mismo enlosado, los contornos son idénticos byte a byte. Solo cambia el reparto de la tinta, y la profundidad percibida se invierte con él. Es una percepción biestable genuina, de la familia del cubo de Necker, no una diferencia de dibujo; el otro nombre habitual del enlosado, "cubos reversibles", recoge la misma observación. El código lo hace literal ordenando la terna de tonos de menor a mayor carga de tinta —[el más claro, el medio, el más oscuro]— de modo que aplicar i ↦ 2 − i al índice de tono sea exactamente la inversión y nada más. Con los tonos en cualquier otro orden, "invertir" sería un simple recoloreado arbitrario; con ellos ordenados, invertir un hexágono es precisamente invertir su cubo.

`coherence` no es, por tanto, un mando sobre *cuántos* cubos se invierten —eso es `flipChance`— sino sobre cómo se *distribuyen* las inversiones. El estadístico u de cada sitio es una mezcla convexa de una extracción de ruido blanco y un campo fBm (movimiento browniano fraccionario) de dos octavas muestreado con κ = 3/min(w,h), es decir, unas tres celdas de ruido a lo ancho del lado corto del marco. Con coherence 0 los hexágonos vecinos son independientes y la superficie chisporrotea a sal y pimienta, cada cubo invertido respecto a sus vecinos. Con coherence 1 la decisión es una función suave de la posición, así que los bloques elevados y hundidos se agrupan en regiones del tamaño de continentes que se encuentran a lo largo de una costa en la que el ojo no consigue fijarse. Una salvedad honesta: como u es una mezcla de dos variables aleatorias, su varianza es mínima en coherencias intermedias, de modo que allí u se concentra cerca de 0.5 y la fracción real de hexágonos invertidos se desplaza hacia lo que dicte la posición de `flipChance` respecto a 0.5 en vez de seguirlo con exactitud. El parámetro controla la correlación, y solo es aproximadamente independiente de la tasa.

A diferencia de `voxel`, que dibuja sólidos superpuestos y tiene que ordenarlos de atrás hacia adelante, este patrón no tiene ningún orden de profundidad: ni algoritmo del pintor, ni clave z, nada. El enlosado no se solapa por construcción, así que ningún rombo puede ocultar a otro y el orden de pintado es genuinamente irrelevante para la salida. Toda la tridimensionalidad vive en el reparto de tonos. Eso es también lo que hace posible el modo de trama sobre la misma geometría: como todo rombo tiene la misma altura perpendicular (√3/2)·S a lo largo de su eje b, las líneas trazadas con b = constante recorriendo a: 0 → 1 son cuerdas exactas del rombo y no necesitan recorte alguno, de modo que el dibujo entero se reduce a cuatro trazados SVG —uno por cada cubo de tono, más la retícula hexagonal— por muchos miles de rombos que haya en pantalla.

## Parámetros

- **cell** — S, el circunradio del hexágono, que es además la longitud de arista del rombo. Fija el periodo de la retícula; el enlosado es semejante a sí mismo para todo valor, así que esto es escala, no forma.
- **flipChance** — el umbral sobre u, es decir, la fracción de hexágonos cuya terna de tonos se invierte. Cambia el *etiquetado* del enlosado, no su geometría; pero el etiquetado es aquí el asunto entero, de modo que no tiene nada de cosmético.
- **coherence** — mezcla el estadístico de inversión desde ruido blanco hacia un campo fBm suave. Controla la correlación espacial de las inversiones, no su tasa: chisporroteo a sal y pimienta en 0, continentes de bloques elevados y hundidos en 1.
- **voidChance** — la probabilidad, con semilla, de que un sitio de la retícula se descarte por completo. El único parámetro que cambia el conjunto real de baldosas dibujadas en lugar de reetiquetarlas, razón por la cual semillas distintas recolocan visiblemente los huecos.
- **render** — tonos (tres rombos rellenos por hexágono, separados por costuras del color del papel) o trama (tres cubos de tono con cuerdas paralelas más el contorno de la retícula hexagonal: cuatro trazados en total). Una decisión de dibujo: mismo enlosado, mismo campo de inversiones, distinta tinta.
- **hatchDensity** — con qué densidad se empaquetan las cuerdas de la trama, tono a tono: el espaciado es S/(hatchDensity·T[tono]), así que las caras más oscuras reciben líneas más juntas y es la propia densidad la que porta el sombreado. Una decisión de dibujo, inerte en el modo de tonos.
- **faceShading** — s, la amplitud de la terna de tonos, que hace las veces de intensidad de una luz fija cenital. Una decisión de dibujo, pero acotada por abajo en 0.15 y no en 0 a propósito: en 0 los tres tonos colapsan en uno, el rómbico se aplana y el cubo —todo el asunto— desaparece.
- **strokeWidth** — el grosor de la costura en el modo de tonos y el de las líneas en el modo de trama. Una decisión de dibujo, con un efecto colateral no cosmético: el espaciado de la trama está acotado por abajo en 2·strokeWidth, así que un trazo grueso con densidad alta ralea la trama en vez de dejar que una cara se entinte del todo.
