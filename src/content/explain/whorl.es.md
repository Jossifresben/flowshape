---
source: Sherlock, B. G. y Monro, D. M. (1993) "A model for interpreting fingerprint topology", Pattern Recognition 26(7); clases de crestas según Galton, F. (1892) Finger Prints; separación de líneas según Jobard, B. y Lefer, W. (1997)
url: https://es.wikipedia.org/wiki/Huella_dactilar
doi: 10.1016/0031-3203(93)90006-I
---

## Fórmula

    θ(z) = θ₀ + ½ · [ Σᵢ arg(z − cᵢ) − Σⱼ arg(z − dⱼ) ]      (z = x + iy)

    cᵢ  los núcleos,  dⱼ  los deltas,  θ₀ = lean
    cresta  =  línea de corriente de la dirección (cos θ, sen θ), trazada en ambos sentidos

## Qué significa

Una huella dactilar no es un campo de flechas. Una cresta no tiene delante ni detrás, así que la dirección del dibujo en cualquier punto es un ángulo tomado módulo media vuelta, y ese solo hecho decide todo el aspecto de las huellas. Sherlock y Monro observaron que la orientación de una huella entera cabe en una única fórmula sobre el plano complejo: se suma la mitad del ángulo hacia cada núcleo, se resta la mitad del ángulo hacia cada delta, y se toman las líneas de corriente. Un núcleo es el centro de un lazo, el lugar donde una cresta gira sobre sí misma. Un delta es el trirradio, el punto donde tres sistemas de crestas se encuentran en forma de Y. En la fórmula un núcleo es un cero y un delta es un polo, y el ½ que los precede es lo que les da ese extraño índice semientero que ningún campo eléctrico ni magnético puede tener: al dar una vuelta completa alrededor de un núcleo, la dirección de la cresta solo ha girado media vuelta, y por eso las crestas forman lazos en vez de radiar como las líneas de campo de una carga.

Las cuatro clases de Galton salen de los dos recuentos sin más. Sin núcleos ni deltas es un arco: las crestas cruzan el dedo en ondas suaves. Uno de cada es un lazo (presilla). Dos núcleos muy juntos con dos deltas debajo es el verticilo simple, el dibujo que da nombre a esta página; si se separan los núcleos, se abre en un doble lazo. Las huellas reales añaden un periodo de cresta de medio milímetro aproximadamente, unas diez crestas por centímetro, que es la escala que imita el espaciado por defecto.

El dibujo traza las crestas como líneas de corriente desde una rejilla de semillas, en ambos sentidos puesto que el campo no tiene sentido preferente, y las mantiene separadas con una rejilla de ocupación tosca: la misma regla de celdas reclamadas que usan el campo de flujo y el campo de Coulomb, una versión en rejilla de las líneas equiespaciadas de Jobard y Lefer. Las crestas se detienen antes de cada singularidad, lo que deja el pequeño ojo en blanco en el centro de cada lazo que también tiene una huella real.

## Parámetros

- **cores** — el número de centros de lazo (ceros del campo). 0 con 0 deltas es un arco; 1 con 1 delta es una presilla; 2 con 2 deltas es el verticilo simple.
- **deltas** — el número de trirradios (polos). Se sitúan bajo los núcleos, abiertos en abanico por la mitad inferior de la hoja.
- **separation** — la distancia entre núcleos, como fracción del marco. Valores pequeños los funden en un verticilo apretado; valores grandes abren un doble lazo. El par de núcleos además orbita su centro una vez por ciclo de animación.
- **lean** — θ₀, una constante que se suma a cada orientación. En un arco inclina todo el campo; con núcleos presentes gira el dibujo. Cuando no hay par de núcleos que orbitar, la animación avanza lean media vuelta por ciclo.
- **spacing** — el paso de la rejilla de semillas, y su mitad el tamaño de celda que mantiene separadas las crestas. Valores menores dan una huella más densa y fina.
- **steps** — la longitud máxima de una cresta, en pasos de integración de dos unidades, repartidos entre sus dos sentidos.
- **strokeWidth** — grosor de cresta. Una decisión de dibujo.
- **accentEvery** — una de cada k crestas dibujadas, en el orden en que se colocaron, en color de acento y más gruesa. 0 lo desactiva. Puramente decorativo.
