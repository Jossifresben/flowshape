---
source: Teorema del círculo de Descartes; forma compleja: Lagarias, J. C., Mallows, C. L. y Wilks, A. (2002), "Beyond the Descartes Circle Theorem", American Mathematical Monthly 109(4)
url: https://en.wikipedia.org/wiki/Descartes%27_theorem
---

## Fórmula

    relación de curvaturas:
      (k₁ + k₂ + k₃ + k₄)² = 2(k₁² + k₂² + k₃² + k₄²)
      k₄ = k₁ + k₂ + k₃ ± 2√(k₁k₂ + k₂k₃ + k₃k₁)

    forma en coordenadas complejas (centros z, curvaturas k):
      k₄·z₄ = k₁z₁ + k₂z₂ + k₃z₃ ± 2√(k₁k₂·z₁z₂ + k₂k₃·z₂z₃ + k₃k₁·z₃z₁)

## Qué significa

El teorema de Descartes dice que siempre que cuatro círculos son mutuamente tangentes —cada uno tocando a los otros tres— sus curvaturas (k = 1/radio, contando como negativa la de un círculo envolvente *internamente* tangente) cumplen esa relación cuadrática fija. Dados tres círculos mutuamente tangentes cualesquiera, la relación es una cuadrática en la cuarta curvatura y siempre tiene dos soluciones: una es el círculo ya conocido si se partió de una cuaterna, la otra (la raíz ±) es el *otro* círculo tangente a los tres — geométricamente, el pequeño hueco que queda en medio de tres círculos que se tocan, o el círculo mucho mayor que podría envolver a los tres desde fuera. Este patrón usa exactamente ese truco de la segunda raíz para hacer crecer todo el empaquetado: a partir de una terna inicial calcula el cuarto círculo que falta, y luego trata ese círculo como miembro nuevo de tres ternas frescas y recurre.

La forma compleja es lo que vuelve esto práctico sin necesidad de trigonometría ni geometría de intersección de círculos: representar el centro de cada círculo como un número complejo z permite que la misma cuadrática ± resuelva a la vez curvatura *y* posición, porque multiplicar y sumar números complejos codifica de forma natural las rotaciones y traslaciones que de otro modo habría que calcular caso por caso. Esa es la "forma en coordenadas complejas" —centros llevados como z en vez de pares (x, y)— y es exactamente lo que calcula el paso descartesRoots del patrón: la misma suma ponderada y raíz cuadrada del término cruzado que la fórmula de curvaturas, solo que llevada por ℂ en vez de por ℝ.

Partiendo de un círculo envolvente exterior y dos círculos iguales tangentes entre sí y con él, el cuarto círculo semilla (el "asimétrico") no se elige a mano — se genera aplicando el teorema de Descartes a esa primera terna, de modo que todo el empaquetado, semilla incluida, procede de una sola regla recursiva aplicada de cuatro maneras distintas a las cuatro caras de la tétrada inicial de círculos mutuamente tangentes.

## Parámetros

- **maxDepth** — cuántas generaciones de la recursión se permiten; cada generación rellena los huecos que dejó la anterior con círculos más pequeños, así que valores más altos empujan el empaquetado hacia su límite fractal, infinito.
- **minRadius** — el radio, en píxeles, por debajo del cual un círculo calculado se descarta en lugar de dibujarse o seguir recurriendo sobre él; esto es lo que realmente termina, en la práctica, la recursión (que de otro modo sería infinita).
- **strokeWidth** — el grosor de línea con que se dibuja cada círculo; una decisión de dibujo, no parte del teorema de Descartes.
- **fillAlternate** — rellena con un tono claro los círculos de las profundidades de recursión pares en vez de dejarlos vacíos; una decisión de dibujo usada para hacer visible de un vistazo la estructura generacional.
