---
source: Proyección isométrica; algoritmo del pintor (Newell, Newell y Sancha, 1972, "A Solution to the Hidden Surface Problem")
url: https://en.wikipedia.org/wiki/Painter%27s_algorithm
doi: 10.1145/800193.569954
---

## Fórmula

    proyección isométrica (cubo unitario, arista s = 1):
      w = (s·√3) / 2,  h = s / 2,  v = s
      pantallaX(i,j,k) = (i − k)·w
      pantallaY(i,j,k) = (i + k)·h − j·v

    clave de profundidad del algoritmo del pintor:
      profundidad(i,j,k) = i + j + k
      dibujar las celdas en orden ascendente de profundidad  (las más lejanas primero, las más cercanas al final)

## Qué significa

Cada vóxel ocupa una coordenada entera de retícula (i, j, k) dentro de una forma envolvente — una esfera (i²+j²+k² ≤ D²), un cubo (sin condición) o un toro (una superficie implícita en anillo sobre i,k con espesor en j). La proyección isométrica aplana esa retícula 3D a 2D proyectando a lo largo de la diagonal del cubo, razón por la cual las tres caras visibles de cada cubo (superior, izquierda, derecha) se dibujan siempre como paralelogramos del mismo tamaño y el conjunto se lee como "sólido" sin ninguna distorsión de perspectiva real — es la convención axonométrica estándar que se usa tanto en pixel art isométrico como en wireframes de CAD.

El único detalle que hace que un dibujo isométrico de muchos cubos superpuestos se vea correcto, en vez de un amasijo, es dibujarlos en el orden correcto de atrás hacia adelante. Este patrón ordena las celdas por i + j + k antes de dibujarlas. Esa suma no es una elección arbitraria: es la única combinación lineal de (i, j, k) que crece de forma estricta cuando un cubo se mueve a lo largo de la diagonal del cubo — la única dirección en 3D que la proyección isométrica colapsa a un solo punto de pantalla (desplazamiento en pantalla nulo). Cualquier otra dirección cambia i+j+k *y* se mueve en pantalla, así que dos celdas nunca pueden compartir posición en pantalla mientras difieren en orden de profundidad por ningún eje salvo esa diagonal — precisamente por eso i+j+k, y nada más, produce aquí un orden de algoritmo del pintor correcto píxel a píxel.

scatter es el único parámetro aquí que cambia el conjunto matemático real de celdas conservadas, no solo cómo se dibujan: cada celda de la retícula extrae un valor de un flujo de PRNG fijo, ordenado por coordenadas, y la celda se descarta si ese valor cae por debajo de scatter — un raleo con semilla genuino del sólido, razón por la cual semillas distintas remodelan visiblemente la silueta. shellOnly, en cambio, solo elimina celdas *interiores* (las que tienen sus seis vecinas presentes) — celdas que un render sólido y opaco jamás mostraría de todos modos, ya que el algoritmo del pintor ya las dibuja por encima. Es una optimización puramente de rendimiento: para una forma opaca, shellOnly activado o desactivado producen una salida idéntica píxel a píxel, solo que con muchos menos polígonos cuando está desactivado y se conserva el interior.

## Parámetros

- **shape** — a qué superficie envolvente implícita se recorta la retícula: esfera, cubo o toro. Es la definición matemática real del sólido.
- **dimension** — la semiextensión D de la retícula; valores mayores significan más vóxeles, más pequeños, empaquetados en la misma forma envolvente.
- **gap** — encoge cada cara dibujada hacia su propio centroide, abriendo una costura visible entre vóxeles vecinos; una decisión de dibujo, no parte de la retícula ni de las matemáticas de la proyección.
- **shellOnly** — descarta las celdas interiores que un render sólido nunca revelaría. Una optimización de rendimiento, invisible en la salida para un sólido opaco — véase arriba.
- **scatter** — el umbral de probabilidad con semilla por debajo del cual se descarta una celda de la retícula. Genuinamente matemático: cambia qué celdas existen en el conjunto que se proyecta, no solo cómo se dibujan.
- **faceShading** — cuánto más oscuras se dibujan las caras isométricas izquierda y derecha respecto a la cara superior; una decisión de dibujo que simula una dirección de luz fija.
- **depthShading** — cuánto se atenúan las celdas más alejadas según el eje de profundidad del algoritmo del pintor respecto a las más cercanas; una decisión de dibujo añadida sobre el orden de profundidad, no el orden en sí.
- **strokeWidth** — el grosor del contorno de cada cara dibujada; una decisión de dibujo.
