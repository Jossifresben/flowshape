---
source: Jobard, B. y Lefer, W. (1997) "Creating Evenly-Spaced Streamlines of Arbitrary Density", Visualization in Scientific Computing '97 (el campo es el clásico campo electrostático de cargas puntuales en 2D)
url: https://link.springer.com/chapter/10.1007/978-3-7091-6876-9_5
---

## Fórmula

    E(r) = Σᵢ qᵢ (r − rᵢ) / |r − rᵢ|²           (n cargas puntuales qᵢ ∈ {+1, −1} en posiciones rᵢ)

    paso:  r ← r + h · E(r) / |E(r)|             (integración de línea de campo a velocidad unitaria)

## Qué significa

Cada punto del plano tiene un vector de campo: la suma de la atracción o repulsión de cada carga, cada una aportando un vector que apunta hacia ella (si es negativa) o se aleja de ella (si es positiva), ponderado de forma inversamente proporcional al cuadrado de la distancia —la misma ley del inverso del cuadrado que rige la electrostática real. Una línea de campo (streamline) es lo que se obtiene al soltar un punto de prueba en cualquier lugar y dejar que camine, un pequeño paso cada vez, siempre en la dirección que marca el campo local. Como las cargas alternan de signo alrededor de un anillo con desviaciones aleatorias, la mayoría de las líneas se curvan alejándose de una carga positiva y arqueándose hacia la carga negativa más cercana, trazando los mismos bucles de líneas de campo que se ven en el diagrama de libro de texto de dos cargas puntuales opuestas —solo que aquí hay varias cargas, y cientos de líneas independientes sembradas por todo el marco trazan la forma completa del campo a la vez.

Para evitar que las líneas de campo se disparen a velocidad infinita justo al lado de una carga —algo físicamente real en una singularidad 1/r² verdadera—, el término de la distancia se acota por abajo (el radio del núcleo), y las líneas se detienen en cuanto se acercan lo bastante a una carga como para volverse redundantes. También se detienen, o directamente no se dibujan, si repetirían un terreno que otra línea ya ha cubierto, comprobado contra una cuadrícula de ocupación de grano grueso —una versión simplificada de la colocación adaptativa y controlada por densidad de líneas que describen Jobard y Lefer, orientada al mismo objetivo: una cobertura visual pareja sin solapamientos innecesarios, aunque sin su algoritmo completo de distancia de separación.

## Parámetros

- **charges** — n, el número de cargas puntuales colocadas con variación aleatoria alrededor de un anillo, alternando signo. Fija directamente la topología del campo: decide cuántas fuentes y sumideros organizan el flujo, y por tanto en cuántas regiones de arco distintas caen las líneas.
- **spacing** — el paso de la cuadrícula de la que se muestrean los puntos de partida de las líneas. Un parámetro matemático/de muestreo: un espaciado más apretado siembra más líneas y se lee como una cobertura de campo más densa.
- **steps** — el número máximo de pasos de integración permitidos por línea antes de cortarla, sin importar dónde termine.
- **coreRadius** — la distancia mínima a una carga a la que puede acercarse una línea antes de detenerse, y también el suelo aplicado al término de distancia en la propia ecuación del campo para que nunca divida entre (casi) cero. Forma parte de la regularización del propio campo, no solo de la regla de parada.
- **strokeWidth** — el grosor de línea. Una decisión de dibujo.
- **emphasisEvery** — cada k-ésima línea superviviente se dibuja más gruesa y totalmente opaca en vez de fina y translúcida. Un acento puramente visual sin efecto sobre el campo ni sobre las trayectorias en sí.
