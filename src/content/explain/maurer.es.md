---
source: Maurer, P.M. (1987) "A Rose is a Rose...", The American Mathematical Monthly 94(7), 631–645
url: https://en.wikipedia.org/wiki/Maurer_rose
doi: 10.1080/00029890.1987.12000695
---

## Fórmula

    para k = 0 … 360:
      θ = k · d · (π/180)        (d en grados, el paso de la caminata)
      r = R · sin(n · θ)
      punto_k = (R·cosθ, R·senθ) escalado por r
    unir los puntos consecutivos con líneas rectas

## Qué significa

Debajo de todo hay una rosa polar corriente, r = sen(nθ): para n entero traza n pétalos si n es impar, o 2n pétalos si n es par, a medida que θ recorre la vuelta completa. El truco de Maurer, publicado como una curiosidad de una sola página en 1987, es no dibujar nunca esa curva directamente. En su lugar, la muestrea en 361 valores de θ separados d grados —no 1 grado— y une esas muestras con cuerdas rectas en vez de seguir la curva entre ellas.

Como 360 y d casi siempre se eligen sin factores comunes simples (el par por defecto del módulo, n=6, d=71, es uno de los propios ejemplos de Maurer), cada salto de d grados lleva el ángulo subyacente a un punto alejado de donde terminó la cuerda anterior. Las cuerdas se abren en abanico por todo el interior de la rosa en vez de ceñirse a su contorno, y tras los 360 pasos cada punto de la rosa ha sido visitado exactamente una vez, así que la red se cierra sobre sí misma. El resultado se lee como arte de hilo —el mismo tejido de pasa-por-arriba-y-por-abajo que se obtiene tensando hilo entre clavos en un tablero— aunque cada punto de la figura esté exactamente sobre la curva matemática de la rosa.

La ruta de envolvente opcional es esa misma curva de la rosa muestreada de forma densa (cada 0,25°) en lugar de mediante la caminata de d grados, dibujada tenuemente debajo de la red de cuerdas para que se vea la forma suave de pétalos que las cuerdas aproximan.

## Parámetros

- **n** — el número de pétalos de la rosa subyacente, r = sen(nθ). n impar da n pétalos; n par da 2n pétalos.
- **d** — el paso de la caminata en grados entre los 361 puntos muestreados. Es el parámetro que más importa: un d pequeño traza algo cercano al contorno suave de la rosa, mientras que valores de d cercanos a fracciones simples de 360° (pero no exactamente sobre ellas) producen las redes de cuerdas más densas y enmarañadas.
- **strokeWidth** — grosor de la línea de la red de cuerdas. Una decisión de dibujo, no parte de la construcción de Maurer.
- **envelope** — si se dibuja o no la propia curva suave de la rosa, tenuemente, debajo de la red de cuerdas, para que se vea la forma subyacente que las cuerdas aproximan. También es una decisión de dibujo: activarla o no cambia el aspecto pero no la geometría de las cuerdas.
