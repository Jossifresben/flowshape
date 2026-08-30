---
source: Proyección isométrica; algoritmo del pintor (Newell, Newell y Sancha, 1972, "A Solution to the Hidden Surface Problem"); 3-coloración de la retícula triangular
url: https://en.wikipedia.org/wiki/Painter%27s_algorithm
doi: 10.1145/800193.569954
construction: original
---

## Fórmula

    proyección isométrica (tamaño de celda c — idéntica a la de voxel):
      W = (c·√3) / 2
      pantallaX(i,j,k) = cx + (i − k)·W
      pantallaY(i,j,k) = cy + ((i + k)/2 − j)·c

    orígenes de las unidades, con  A = (1,−1,0),  B = (0,1,−1),  a = m+n,  b = m−n:
      δ(m,n) = (m + n) mod stagger
      O(m,n) = m·A + n·B + δ·(1,1,1)

      proy(O) = (cx + a·W,  cy + 1.5·b·c)        ← δ no aparece,
      porque  proy(1,1,1) = (0, 0)

    clave del algoritmo del pintor (centro de la caja, dibujo en orden ascendente):
      profundidad = (i₀ + sᵢ/2) + (j₀ + s_j/2) + (k₀ + s_k/2)

    cota de disyunción sobre la longitud de brazo L y la sección w:
      L ≤ (stagger ≥ 3 ? 2 : 1) − w
      chevrón con stagger par:  L ≤ (3 − w) / 2

## Qué significa

El motivo es un pequeño ensamblaje de vigas de sección cuadrada que concurren en un cubo de esquina compartido: un trípode (tres brazos que salen de la esquina según +i, +j, +k), un codo (dos brazos perpendiculares, con la terna de ejes rotada cíclicamente según *a* mod 3, de modo que las columnas sucesivas forman una espiga) o un chevrón (dos brazos colineales separados por el collar de la esquina — un empalme a tope, no un inglete, porque entre vigas colineales no hay ángulo alguno que un inglete pueda bisecar). Se coloca una copia de ese motivo en cada punto de la retícula triangular generada por A y B, y todo el campo se proyecta isométricamente. No hay azar en ninguna parte: la imagen es una función pura de los parámetros, y por eso el patrón declara `usesSeed: false` y el archivo no importa ningún PRNG.

La idea que lo sostiene todo es el término `δ·(1,1,1)` del origen. La explicación gemela de voxel establece que (1,1,1) es la *única* dirección de la retícula que la proyección isométrica colapsa a desplazamiento nulo en pantalla — precisamente por eso `i+j+k` es allí la única clave de profundidad correcta para el algoritmo del pintor. Este patrón toma el mismo hecho y lo emplea para el propósito opuesto. Desplazar una unidad en δ·(1,1,1) cambia su profundidad, y por tanto por delante de qué brazos vecinos pasa y por detrás de cuáles, sin moverla ni un solo píxel en pantalla. El enlosado permanece perfectamente registrado —cada unidad cae en el mismo punto de retícula en el que habría caído sin el desfase— y lo único que cambia es el entrelazado por encima/por debajo. Un mismo hecho, dos usos: voxel necesita la dirección que se proyecta a nada para poder *ordenar* por ella, e isoweave la necesita para poder *desplazarse* a lo largo de ella de forma invisible.

La coloración con la que se desfasa tampoco es libre, y la opción evidente falla. δ = (m − n) mod stagger es invariante a lo largo de A + B = (1,0,−1), que es el paso horizontal puro en pantalla — de modo que todo par de vecinos horizontales compartiría clase de profundidad por grande que fuera `stagger`. δ = (m + n), en cambio, desplaza la clase en +1 según A, +1 según B y +2 según A+B, lo que separa los tres pasos de vecino más próximo a la vez. Y tres es un suelo duro, no una preferencia: los centros de las unidades forman una retícula triangular, cuyo número cromático es 3, así que con solo dos niveles *algún* par de vecinos próximos colisiona siempre. Por eso `stagger` 1 y 2 dibujan ambos el entrelazado plano y coplanar, y solo 3 y 4 tejen.

`stagger` hace además una segunda cosa, menos evidente, y es la que realmente se ve. Un trípode o un codo ocupa un intervalo de anchura L + w en cada eje, así que dos unidades son disjuntas en cuanto su desplazamiento entero supera L + w en algún eje. Cuando el vecino más cercano de la misma clase de profundidad está a una unidad de retícula —el caso a stagger 1 y 2— eso fija L + w ≤ 1, y con L + w = 1 no hay solapamiento alguno en el espacio de pantalla: los brazos se limitan a topar contra los de sus vecinos. El desfase se reduce entonces a una permutación del orden de pintado sobre polígonos que nunca se solapan, y produce un *conjunto* idéntico de polígonos en distinta secuencia. Elevar a 2 la distancia del desplazamiento más cercano de la misma clase es lo que compra L + w ≤ 2 y permite que un brazo alcance una unidad de retícula completa más allá de un cruce. Así que `stagger` cumple dos funciones a la vez, y el tejido visible es la segunda. (El chevrón necesita una cota propia, ya que sus dos brazos colineales abarcan 2L + w sobre el eje de la viga; con staggers pares existen desplazamientos que dejan los otros dos ejes a cero, y de ahí sale el tope (3 − w)/2.)

Como aquí las unidades de δ contiguo sí comparten genuinamente área de pantalla, la ordenación por profundidad del centro tiene que ser exacta y no meramente plausible. Dos cajas se proyectan sobre regiones solapadas exactamente cuando la recta ℝ·(1,1,1) corta el interior de su diferencia de Minkowski, y el signo de esa intersección dice cuál está realmente delante; el test de geometría del patrón recorre todos los pares de cajas a lo largo del espacio de parámetros y confirma que la clave de profundidad del centro siempre coincide con él, sin empates entre pares que se solapan. Voxel puede tratar `i+j+k` como una aproximación; aquí es una afirmación verificada.

La última pieza que merece nombrarse es lo que ocurre en los modos `outline` y `hatch`. Allí cada cara se rellena con el color del *papel* y se contornea con tinta. Ese relleno no es decoración: **es** el algoritmo de eliminación de líneas ocultas. Las caras ya se emiten de atrás hacia adelante, así que una caja más cercana simplemente pinta su papel opaco sobre las líneas de lo que quede detrás, y en el código no aparece recorte de líneas, ni prueba de visibilidad, ni búfer de profundidad. Es el truco clásico anterior al z-buffer, y es la única razón por la que el modo de línea cuesta lo mismo que el modo sólido.

## Parámetros

- **cell** — el paso de la retícula en unidades de usuario, y por tanto el tamaño dibujado de la sección de una viga y la densidad de unidades en el encuadre. Celdas mayores dan menos unidades; un tope `MAX_UNITS` de 900 corta un recuento patológico de unidades con celdas muy pequeñas.
- **unit** — qué motivo se enlosa: trípode, codo o chevrón. Es el sólido real que se replica, no un estilo, y realimenta la cota de longitud de brazo (el chevrón arrastra una cota adicional propia).
- **armLength** — L, cuánto se aleja cada brazo del cubo de esquina, antes del recorte. Genuinamente geométrico: es lo que decide si los brazos llegan a cruzarse con los vecinos.
- **beamWidth** — w, la sección cuadrada de cada viga y la arista del cubo de esquina. También genuinamente geométrico, y entra directamente en la cota de disyunción: una viga más gruesa compra un brazo máximo más corto.
- **stagger** — el periodo de la coloración de profundidad δ = (m+n) mod stagger. El verdadero mando matemático: cambia la disposición 3D sin mover nada en pantalla, y es lo que eleva la cota de longitud de brazo de 1 − w a 2 − w. Los valores 1 y 2 dan el entrelazado plano y coplanar; 3 y 4 dan un tejido real por encima/por debajo, con entrelazados distintos.
- **render** — caras sólidas, contornos rellenos de papel o caras tramadas. Nominalmente una decisión de dibujo, pero véase arriba: el relleno de papel en los dos modos de línea es la eliminación de líneas ocultas, no un recurso estético.
- **hatchDensity** — cuántas líneas de trama cruzan una cara en modo trama. Un mando puramente de dibujo, ignorado por completo en los otros dos modos; las líneas se generan en el espacio de parámetros (a, b) propio de la cara, de modo que caen exactamente dentro del paralelogramo sin necesidad de recorte.
- **faceShading** — cuánto más oscuras se dibujan las dos caras laterales respecto a la cara superior. Una decisión de dibujo que simula una dirección de luz fija; fija la opacidad de relleno en modo sólido y el espaciado de trama en modo trama (las caras más oscuras traman más denso), y no tiene efecto alguno en modo contorno.
- **strokeWidth** — el grosor de línea. Una decisión de dibujo, pero no simétrica: en modo sólido el trazo es un filete del color del papel que separa las caras, así que 0 es un ajuste legítimo de "sin costuras", mientras que en modo contorno y trama el trazo de tinta *es* el dibujo, por lo que se le impone un mínimo de 0,2 para que la página no salga en blanco.
