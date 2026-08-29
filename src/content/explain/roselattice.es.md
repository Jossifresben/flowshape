---
source: Weisstein, E. W., "Rose", MathWorld
url: https://mathworld.wolfram.com/Rose.html
---

## Fórmula

    θ(n) = 2π·n / spokes                             (n = 0 … spokes − 1)
    t(m) = m / rings                                  (m = 0 … rings)
    base(m) = innerRadius + (outerRadius − innerRadius) · t(m)
    r(m,n)  = base(m) + petalDepth · cos(petals·θ(n)) · t(m)
    x = cx + r·cosθ,  y = cy + r·sinθ

## Qué significa

Por debajo, esto es una malla polar corriente: anillos de radio constante cruzados por radios rectos a pasos angulares iguales, la forma habitual de dibujar un disco de alambre. La curva de rosa entra como una modulación añadida sobre esa retícula — el término `petalDepth · cos(petals·θ)` es exactamente la curva rodonea clásica r = A·cos(k·θ), donde un k entero da k pétalos si k es impar y 2k si es par. En vez de sustituir el radio de la malla, ese término se *suma* a él, así que la malla conserva su topología de anillos y radios mientras cada anillo se abomba hacia fuera donde cos(petals·θ) es positivo y se hunde hacia dentro donde es negativo.

El factor `t(m)` es lo que convierte una simple ondulación en una flor: escala el término del pétalo por la distancia fraccional de cada anillo al centro, así que la modulación es cero en el anillo más interior (m = 0) y alcanza su fuerza completa en el borde exterior (m = rings). El centro, por tanto, se mantiene como una malla casi circular sin perturbar —se lee como un núcleo oscuro y en calma— mientras los anillos exteriores despliegan la amplitud completa del pétalo, exactamente la construcción de "malla polar deformada en pétalos con núcleo en negativo" sobre la que está montado este patrón.

Como tanto los anillos (rutas cerradas, una por m) como los radios (rutas abiertas, una por n) se dibujan a través del mismo campo de puntos deformado, la forma del pétalo aparece dos veces — una vez como el contorno de los anillos curvándose hacia dentro y hacia fuera, y otra como los radios abanicándose de forma desigual entre ellos— lo que le da a la retícula su aspecto tejido y en capas, en vez de un simple contorno plano de rosa.

## Parámetros

- **petals** — k en el término de rosa cos(k·θ); fija cuántos lóbulos abomban los anillos exteriores.
- **rings** — cuántos anillos concéntricos componen la malla, del centro al borde.
- **spokes** — cuántas muestras angulares componen cada anillo y cada radio; más radios trazan la curva del pétalo con más suavidad.
- **petalDepth** — la amplitud de la modulación de rosa que se suma al radio; 0 devuelve el patrón a una malla polar sin más.
- **innerFraction** — el radio del anillo más interior como fracción del radio exterior, es decir, el tamaño del núcleo intacto antes de que actúe la modulación del pétalo.
- **strokeWidth** — el grosor de línea de anillos y radios; una decisión de dibujo, no parte de las matemáticas de la curva de rosa.
