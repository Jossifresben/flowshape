---
source: Vogel, H. (1979) "A better way to construct the sunflower head", Mathematical Biosciences 44(3-4)
url: https://en.wikipedia.org/wiki/Phyllotaxis
---

## Formula

    θₙ = n · α                  (α ≈ 137,50776°, el ángulo áureo)
    rₙ = s · n^p                (p = 0,5 en el modelo original de Vogel)
    s  = R / (N − 1)^p          (R = radio máximo disponible en el marco)

## Qué significa

Cada punto n se coloca en el ángulo n·α y a un radio rₙ = s·n^p. El ángulo α es el ángulo áureo, la vuelta que divide un círculo entero según la proporción áurea, y ahí está la clave de todo: por muchos puntos que se coloquen, ninguno cae jamás sobre el mismo rayo que otro anterior. Esa sola propiedad es la que evita que un girasol —o este patrón— deje una costura visible o un radio que se repita.

La regla del radio reparte los puntos para que la densidad de empaquetado se mantenga más o menos constante a medida que n crece: con p = 0,5, la elección del propio Vogel, el área disponible a un radio r crece de forma lineal con r, lo que cancela exactamente el crecimiento ∝r² de un círculo corriente, así que los puntos ni se amontonan en el centro ni se dispersan hacia el borde. Basta desplazar p de 0,5 para que el ojo lo note de inmediato: valores bajos apiñan los puntos junto al centro, valores altos los empujan hacia el aro exterior.

El ángulo es la pieza inestable. A 137,50776° exactos, la espiral parece desordenada de cerca pero, al alejarse, revela familias de brazos espirales entrelazados —las parastiquias—; el propio artículo de Vogel señala que una décima de grado de desviación ya basta para que esas familias se tuerzan y aparezcan como radios rectos en lugar de espirales. Este patrón deja mover el ángulo a mano precisamente por eso: convierte una nota a pie de página de un artículo de 1979 en algo que se puede ver ocurrir en tiempo real.

## Parámetros

- **points** — N, el número total de puntos. Cuantos más puntos, más denso se ve el marco y más claras se leen las espirales de parastiquias a distancia.
- **angle** — el ángulo de divergencia α entre puntos consecutivos. Por defecto es el ángulo áureo (≈137,50776°); apartarlo aunque sea ligeramente de ese valor tuerce visiblemente el patrón hacia radios rectos, la inestabilidad que predice la fórmula.
- **radialExp** — p, el exponente de crecimiento radial. 0,5 es el modelo de densidad uniforme de Vogel; valores más bajos atraen los puntos hacia el centro, valores más altos los empujan hacia el borde.
- **dotMin** — el radio del primer punto (n = 0), en unidades del lienzo.
- **dotGrow** — cuánto crece el radio de cada punto por cada paso de n; los puntos dibujados al final de la secuencia (n grande, cerca del borde) terminan siendo más grandes que los del principio — una decisión de dibujo añadida sobre la geometría de Vogel, no parte del modelo original.
- **accentEvery** — resalta uno de cada k puntos con el color de acento en vez de tinta. El valor por defecto, 89, es un número de Fibonacci: el número de brazos espirales visibles en un patrón filotáctico es siempre un número de Fibonacci consecutivo, así que recorrer distintos valores de Fibonacci aquí traza cada vez una familia de brazos distinta. 0 desactiva el acento.
