---
source: Modelo del disco de Poincaré del plano hiperbólico — las geodésicas son arcos circulares ortogonales a la frontera; Coxeter, H.S.M. (1979) "The Non-Euclidean Symmetry of Escher's Picture 'Circle Limit III'", Leonardo 12; el paseo cerrado coprimo y su simetría ondulada son construcción propia de este proyecto
url: https://es.wikipedia.org/wiki/Modelo_del_disco_de_Poincar%C3%A9
doi: 10.2307/1574078
construction: original
---

## Fórmula

    B = m · grano puntos en el círculo unidad:  Pⱼ en el ángulo θⱼ = 2πj/B + onda(j)
    paseo j → j + δ (mod B), con δ forzado al entero coprimo con B más cercano
    geodésica de u a v: el círculo que pasa por ambos, ortogonal al borde —
    centro (u+v)/(1+u·v),  radio √((1−u·v)/(1+u·v))
    onda(j) = a · sin(2π·w·j/grano + φ),  exactamente (B/m)-periódica en j

## Qué significa

En el disco de Poincaré —el mapa del plano hiperbólico sobre el que están dibujados los *Circle Limit* de Escher— una línea recta no parece recta. El camino más corto entre dos puntos de la frontera es un arco circular que corta el borde en ángulo recto, curvándose lejos del centro. Esa curvatura es la firma de la geometría hiperbólica: los arcos se pegan a la frontera, y la tinta se acumula junto al borde como en la orla de un grabado, igual que los peces de Escher se encogen hacia el límite de su disco.

Este patrón dibuja un único paseo cerrado de tales geodésicas, y dos teoremas lo mantienen en orden. Primero, el paso δ se fuerza al entero coprimo con B más cercano, de modo que el paseo visita *todos* los B puntos de la frontera antes de cerrarse: una sola línea continua, garantizada por la aritmética y nunca por la suerte. Segundo, el conjunto de aristas del paseo se transforma en sí mismo al rotar, y la onda de la semilla —una perturbación de los ángulos exactamente (B/m)-periódica en el índice— recorta esa simetría plena a exactamente m pliegues. La simetría que ves está forzada por la construcción, no afinada.

Un tope protege el aspecto: un paso cercano a B/2 uniría pares casi diametrales, cuyas geodésicas se aplanan en cuerdas rectas por el centro. El paso se mantiene por debajo de ~0,3·B, donde todo arco aún se curva de forma visible, así que la figura sigue siendo hiperbólica en cualquier valor que alcancen los controles. En movimiento, la figura entera precesa exactamente un paso de simetría por ciclo —la simetría m-fold hace de eso la identidad en el retorno— mientras la onda viaja una vez alrededor de su propio sector.

## Parámetros

**Simetría** es m, el orden rotacional impuesto. **Grano** fija cuántos puntos tiene cada sector de simetría (B = m·grano en total). **Devanado** pide un paso del paseo, reescalado bajo el tope y forzado coprimo: pasos cortos se pegan al borde, pasos largos abren la estrella. **Ondulación** es la amplitud de la onda de la semilla, un temblor del borde que nunca rompe el teorema. **Capas** superpone el paseo un poco más avanzado en su propio movimiento, una estela en abanico. La semilla sortea otra onda: otro tejido, el mismo orden.
