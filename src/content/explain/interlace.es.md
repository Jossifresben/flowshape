---
source: Construcción del entrelazado celta (Cromwell, P.R., 1993, "Celtic Knotwork: Mathematical Art", The Mathematical Intelligencer 15(1), 36–47); el paso por encima/por debajo sale gratis porque el grafo del panal es bipartito — un grafo es bipartito si y solo si no contiene ciclos impares (Kőnig, D., 1916)
url: https://doi.org/10.1007/BF03025256
doi: 10.1007/BF03025256, 10.1007/BF01456961
---

## Fórmula

    panal, coords axiales de vértice arriba (q, r), circunradio del hexágono S:
      C(q,r) = ( √3·S·(q + r/2),  1.5·S·r )
      u_k    = ( cos(−π/2 + kπ/3), sin(−π/2 + kπ/3) ),   k = 0..5
      V_k    = C + S·u_k          vértice del panal, de valencia 3
      P_k    = C + rs·S·u_k       vértice del anillo   (rs = ringScale)

    clase bipartita de un vértice:  clase(V_k) = k mod 2  (la misma desde las 3 caras)
      k par   (subred A): el anillo pasa por encima del brazo → se corta el brazo
      k impar (subred B): el brazo pasa por encima del anillo → se corta el anillo

    el ángulo de cruce es constante, θ = 60°; ancho de banda W = ribbonWidth·S
      semilongitud del hueco  t₀ = ( W/2 + (W/2)·cos θ ) / sin θ  ·  gapScale
      t_anillo = min(t₀, 0.4·lado),   lado = rs·S
      recorrido libre del brazo  d = (1 − rs)·S,  longitud L = d + 0.5·t_anillo + 0.7·W
      t_brazo  = min(t₀, 0.4·L)

    banda = un trazo de tinta de ancho W, recubierto por un trazo de papel de ancho core·W

## Qué significa

Se dibujan dos familias de hebras, y solo dos. Cada cara hexagonal del panal lleva un anillo hexagonal cerrado, encogido hasta `ringScale` de la cara. Cada *vértice* del panal —un vértice compartido por tres caras— lleva una hebra trirradiada en Y cuyos tres brazos avanzan hacia dentro por las tres bisectrices de las caras y cruzan los tres anillos que lo rodean. Ese es todo el reparto: anillos e íes griegas, sobre una retícula, hasta el infinito.

La alternancia por encima/por debajo, que en el entrelazado celta dibujado a mano es la parte engorrosa, aquí sale gratis, y la razón es un resultado de teoría de grafos. El grafo del panal es bipartito: sus vértices se reparten en dos clases —las subredes A y B, conocidas por el grafeno— de modo que toda arista une una A con una B. Al recorrer cualquier cara hexagonal se visita, por tanto, A, B, A, B, A, B y se vuelve al punto de partida. Basta con asignar "el anillo pasa por encima del brazo en los vértices A, el brazo pasa por encima del anillo en los vértices B" para que la secuencia de cruces del propio anillo se lea encima, debajo, encima, debajo, encima, debajo en toda la vuelta: alternancia celta perfecta, en cada anillo del plano, con cero aleatoriedad y cero contabilidad. Y aún mejor: la clase se calcula localmente, sin consulta ninguna. Indexando los vértices k = 0..5 desde el origen angular de la propia retícula, la clase es exactamente k mod 2, y coincide desde las tres caras que comparten ese vértice. El vértice situado a −90° de una cara es el vértice a +30° de una vecina y el de +150° de la otra: índices 0, 2, 4, todos pares. Todos los vértices se comportan igual.

El hecho que sostiene todo es que seis es par, y conviene ser preciso sobre qué falla cuando no lo es. Cada anillo cruza exactamente un brazo por vértice, así que sus cruces forman una secuencia cíclica cerrada con tantos términos como lados tenga la cara. Un ciclo cerrado de longitud impar no puede alternar: si se va encima, debajo, encima a lo largo de cinco vértices, el quinto cruce se encuentra con el primero con el mismo valor, y ahí queda el defecto. Es la misma obstrucción de paridad por la cual un grafo es bipartito precisamente cuando no tiene ciclos impares. De modo que en una retícula triangular o pentagonal el fallo no es que esta regla resulte incómoda y exija más contabilidad: es que *ninguna* asignación, de ningún tipo, consigue que esos anillos alternen. Los hexágonos no son una elección estilística para este tejido, son la cara de número par de lados más barata que lo admite.

Lo segundo que conviene entender es que el por encima/por debajo no se pinta: se *corta*. Allí donde una hebra pasa por debajo, se la interrumpe a ambos lados del cruce por la semilongitud de hueco t —el clásico corte del nudo celta—, y la hebra que pasa por encima simplemente se deja entera. Nada en el dibujo terminado se solapa con nada, así que el orden de pintado es genuinamente irrelevante: los cuatro trazados SVG (anillo de tinta, anillo de papel, brazo de tinta, brazo de papel) pueden emitirse en cualquier orden y la imagen es la misma. Un tejido basado en el orden de pintado necesitaría una decisión de z por cruce y una ordenación estable; este no necesita ninguna de las dos, y sigue siendo cuatro trazados por muchos miles de cruces que haya en pantalla. La longitud del hueco es deducida, no estimada a ojo: las dos aristas del anillo salen de un vértice a 60° de la bisectriz de ese vértice y el brazo corre por la bisectriz, así que el ángulo de cruce es constante e igual a 60° en todas partes, y t₀ = (W/2 + (W/2)·cos 60°)/sin 60° es exactamente la holgura a partir de la cual el extremo plano (butt) de la hebra que va por debajo deja de tocar la banda de la que va por encima. `gapScale` escala esa referencia; en 1 es el mínimo matemático.

La cinta en sí se dibuja sin matemática de curvas paralelas de ningún tipo. Se traza un trazo ancho en tinta a lo largo del camino y se dibuja encima, sobre el mismo camino, un trazo más estrecho en papel; lo que queda es una banda con dos bordes de tinta exactamente paralelos alrededor de un núcleo de papel, con las uniones y los extremos correctos regalados por el propio trazador. No hay curvas de offset que calcular, ni operaciones booleanas de polígonos, ni limpieza de autointersecciones: el mismo truco que `girih` emplea en su modo de cintas, y la razón de que ambos patrones puedan permitirse un aspecto de cinta con un puñado de elementos de camino.

La construcción tiene tres barandillas, todas ellas topes inertes con los valores por defecto y que solo actúan cuando una cinta gruesa se junta con un anillo grande. `ringScale` está acotado a 1 − 1.5·ribbonWidth para que cada brazo conserve al menos ancho y medio de banda de recorrido libre antes de alcanzar su anillo; el hueco del anillo está acotado al 40% de un lado del anillo y el del brazo al 40% del brazo, de modo que un corte nunca puede devorar la hebra que corta; y los brazos sobrepasan los extremos cortados del anillo en 0.5·t_anillo + 0.7·W, porque un paso por encima que se detiene a la altura del hueco se lee como dos hebras que simplemente terminan cerca la una de la otra.

## Parámetros

- **cell** — S, el circunradio del panal y por tanto su periodo. El dibujo entero es semejante a sí mismo para todo valor, así que esto es escala, no forma.
- **ribbonWidth** — W como fracción de la celda. Nominalmente el grosor de la cinta, pero no es meramente cosmético: alimenta la longitud deducida del hueco y fija el tope de `ringScale`, de modo que con valores altos mueve geometría de verdad.
- **ringScale** — rs, la distancia del vértice del anillo al centro de la cara como fracción de S. Geometría real: decide cuánto de la cara ocupa el anillo y, con ello, el recorrido libre de los brazos, (1 − rs)·S. Acotado en silencio a 1 − 1.5·ribbonWidth.
- **coreRatio** — el ancho del núcleo de papel como fracción de la banda, es decir, cuán gruesos se ven los dos bordes de tinta de la cinta. Una decisión puramente de dibujo, limitada para que los bordes nunca bajen de `strokeWidth`.
- **junctions** — desactivado, las hebras trirradiadas se omiten por completo y los anillos quedan enteros: un simple enlosado de anillos hexagonales sin ningún cruce. Cambia lo que existe en el dibujo, no cómo se dibuja: el tejido solo es un tejido cuando está activado.
- **gapScale** — multiplica la semilongitud deducida del hueco t₀. Una decisión de dibujo con una referencia con sentido: en 1 el hueco es exactamente la holgura a partir de la cual el extremo de la hebra inferior deja de tocar a la superior. Por debajo de 1 el corte se cierra y el cruce se ensucia; bastante por encima, las hebras se leen como rotas en vez de como tejidas.
- **strokeWidth** — una cota inferior para el grosor de los dos bordes de tinta de la cinta, aplicada limitando el núcleo de papel a W − 2·strokeWidth, para que una cinta fina siga leyéndose como banda y no como un par de pelos. Una decisión de dibujo.
