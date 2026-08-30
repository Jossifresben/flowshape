---
source: Teselado rómbico o rhombille ("tumbling blocks", cubos apilados), dual del teselado trihexagonal — Grünbaum, B. y Shephard, G.C. (1987) "Tilings and Patterns"; regla de relleno nonzero (número de vueltas), W3C SVG 1.1 §11.3 "fill-rule"
url: https://en.wikipedia.org/wiki/Rhombille_tiling
construction: original
---

## Fórmula

    hexágono de vértice superior y circunradio S en torno al centro C:
      V_k = C + S·(cos(−π/2 + kπ/3), sin(−π/2 + kπ/3)),   k = 0…5

    sus tres rombos de 60°/120° — exactamente las tres caras visibles
    de un cubo unitario isométrico de arista S:
      superior = (C, V₅, V₀, V₁)
      derecha  = (C, V₁, V₂, V₃)
      izquierda= (C, V₃, V₄, V₅)

    retícula rómbica, coordenadas axiales (q, r):
      C(q,r) = (S·√3·(q + r/2),  S·1.5·r)

    anillo n = 0 … depth−1, de un rombo:
      escala exterior  sₙ = ratio ⁿ      escala interior  sₙ·ratio
      banda = quad(C, A, M, B) a sₙ  +  quad(C, B, M, A) a sₙ·ratio
                                        ↑ orientación invertida ⇒ un hueco
                                          bajo fill-rule="nonzero"

    paridad de relleno:  tinta  ⇔  (n + (twist ? f : 0)) mod 2 = 0
    cubo del núcleo:     escala = min(coreSize, 0,8 · ratio^depth)

## Qué significa

Conviene empezar por el hecho que hace legible toda la imagen. Bajo proyección isométrica, las tres caras visibles de un cubo unitario se aplican cada una sobre un rombo de lado unidad con ángulos de 60° y 120°, y esos tres rombos comparten el vértice de esquina proyectado. Su unión no es meramente *parecida* a un hexágono: es exactamente un hexágono regular de circunradio igual a la arista del cubo. Esa identidad es la razón de que el teselado rómbico —dual del teselado trihexagonal, conocido en el patchwork como "cubos apilados"— se lea como un muro de cubos apilados y no como un campo de rombos, y es también lo que sostiene la clásica báscula tipo cubo de Necker, en la que el mismo dibujo se lee cóncavo o convexo según qué rombo se tome por cara superior. Este archivo hereda la identidad de la proyección del patrón voxel de forma deliberada: la cara 0 de aquí es la superior de voxel, la cara 1 su +x y la cara 2 su −x, y los tonos del cubo del núcleo siguen la misma asignación para que un núcleo se sombree igual que se sombrea un cubo de voxel.

Sobre cada celda rómbica el patrón anida escalados concéntricos del hexágono completo respecto a su centro, con un factor fijo `stepRatio` por paso. Como el escalado es uniforme y respecto al vértice compartido C, los rombos de cada anillo quedan *estrictamente dentro* de los del anillo anterior, sin solapamiento parcial en ninguna parte. Eso tiene una consecuencia agradable para la oclusión: aquí el orden del pintor no es algo que se calcule, es el contador del bucle. Emitir los anillos del más exterior al más interior ya es el orden correcto de atrás hacia adelante, así que, a diferencia de voxel o de isoweave, en este archivo no hay clave de profundidad, ni ordenación, ni comparación de ningún tipo.

La implementación va todavía un paso más allá y elimina por completo la necesidad de un orden de pintado. En lugar de apilar `depth` hexágonos sólidos y dejar que los posteriores tapen a los anteriores, emite cada anillo como una **banda**: el rombo exterior seguido de inmediato por el rombo interior recorrido en sentido contrario. Bajo `fill-rule="nonzero"` el subtrazado invertido aporta el número de vueltas opuesto, de modo que el interior se cancela a cero y se convierte en un hueco — la misma regla que vacía el ojo de una letra *o* en el contorno de una tipografía. La banda que sobrevive es el anillo comprendido entre la escala sₙ y la escala sₙ·ratio, que es píxel a píxel lo que habría mostrado la versión de sólidos superpuestos. Como ahora cada banda es disjunta de todas las demás de su grupo, todas las bandas de tinta del encuadre entero pueden compartir un único `<path>` y todas las de papel otro, a cualquier densidad de retícula. La imagen completa cuesta unos siete elementos SVG: un trazado de papel, uno de tinta, uno de trama, tres de las caras del núcleo y uno de contornos. Esa es la diferencia entre un SVG que escala a tamaño de cartel y otro que expide decenas de miles de polígonos.

La lectura de profundidad procede de un relleno de paridad de dos valores y de nada más. Un anillo se entinta cuando `(n + f·twist) mod 2 = 0` y se deja en papel en caso contrario — sin medios tonos, sin degradado, sin rampa de opacidad alguna sobre los anillos. Alternar escalones concéntricos claros y oscuros basta para que el ojo lea cada celda como un pozo de sección cuadrada que se aleja a lo largo de la diagonal del cubo, del mismo modo que un grabador obtiene profundidad de puro trazo negro sobre papel blanco. Es también lo que hace que el patrón sobreviva intacto a los ajustes monocromos por defecto del proyecto: con dos valores no hay nada que perder ante una paleta de bajo contraste o una mala impresión. `twist` suma el índice de cara *f* a la paridad, de modo que los tres rombos de una celda quedan desfasados entre sí y los anillos concéntricos se convierten en un molinete — un cambio genuino de la función de paridad, no una rotación del dibujo.

Dos degeneraciones están protegidas en vez de dejarse a la intemperie. El cubo del núcleo se recorta a `0,8 · ratio^depth` para que quede estrictamente dentro del hueco más interior en lugar de fundirse con el último marco (a depth 5 y stepRatio 0,88 el hueco interior llega a 0,53 mientras que `coreSize` puede alcanzar 0,5). Y la generación de anillos se detiene antes de tiempo en cuanto el circunradio de un anillo cae por debajo de un diámetro de trazo, porque tal anillo sería puro trazo sin relleno visible — lo que significa que el número efectivo de anillos puede ser menor que el `depth` pedido con `stepRatio` bajo. En modo `hatch` la trama es asimismo exacta y no recortada: el rombo se parametriza como C + a·e₁ + b·e₂ con a, b ∈ [0,1], el hueco es precisamente la región a, b < ratio, así que una línea a b constante recorre a: ratio→1 por debajo del hueco y a: 0→1 por encima, sin ruta de recorte y sin sobredibujo en ningún punto.

## Parámetros

- **cell** — S, el circunradio del hexágono y por tanto el paso de la retícula rómbica. Fija cuántos pozos llenan el encuadre; el enlosado en sí es el mismo objeto para cualquier valor.
- **depth** — cuántos anillos anidados lleva cada celda. Cambia genuinamente el objeto dibujado, no su estilo — aunque el recuento realizado puede salir menor cuando los anillos pequeños se descartan por caer bajo un diámetro de trazo.
- **stepRatio** — el factor de escala autosemejante entre un anillo y el siguiente, y el único número que decide con qué pendiente parece alejarse cada pozo. Matemático: define el anidamiento, y define además exactamente dónde se sitúa el hueco en la parametrización de la trama.
- **coreSize** — la arista del pequeño cubo sólido en el centro exacto, para que cada pozo termine en un objeto y no en un hueco. Matemático (añade un sólido a la figura) y recortado para permanecer dentro del anillo más interior. En 0 el pozo simplemente se cierra en un punto.
- **render** — marcos (bandas sólidas por paridad), contorno (línea pura, sin relleno alguno — un relleno de papel ahí sería indistinguible del fondo) o trama (los anillos de tinta se sustituyen por rayado exacto; los de papel siguen sólidos). Una decisión de dibujo sobre una geometría que no cambia.
- **twist** — suma el índice de cara a la paridad de relleno, desfasando entre sí los tres rombos de una celda y convirtiendo los anillos concéntricos en un molinete. Cambia la propia función de paridad, así que es un cambio del objeto matemático, no un cambio de estilo.
- **faceShading** — cuánto más oscuras se dibujan las dos caras laterales del **cubo del núcleo** respecto a su cara superior. Más estrecho de lo que parece: el vector de tonos que alimenta solo lo usa el núcleo, de modo que no tiene efecto alguno cuando `coreSize` es 0 ni en modo contorno. Una decisión de dibujo que simula una dirección de luz fija.
- **strokeWidth** — el grosor de tinta del contorno de cada rombo. Sobre todo una decisión de dibujo, con un efecto colateral real: es el umbral que detiene la generación de anillos en cuanto un anillo sería más fino que un diámetro de trazo.
