---
source: Conjuntos de nivel de una rampa con colinas y fosas gaussianas, trazados con marching squares — Lorensen, W. E. y Cline, H. E. (1987), el caso 2-D; el registro de bandas sigue a Riley, B. "Current" (1964); la construcción rampa-más-centros es de este proyecto
url: https://es.wikipedia.org/wiki/Función_gaussiana
doi: 10.1145/37401.37422
construction: original
---

## Fórmula

    f(p) = count · ⟨p − o, n⟩ / H  +  Σᵢ sᵢ · Aᵢ · exp(−|p − cᵢ|² / 2σᵢ²)

    n   = (−sen angle, cos angle), la normal de las franjas;  o = el centro de la hoja
    sᵢ  = +1 en un centro de atracción, −1 en uno de repulsión;  Aᵢ = pull · count  o  push · count
    σᵢ  = reach · mín(W, H), con variación por centro

    banda  =  ⌊f⌋ mod 2        (tinta donde es impar)

## Qué significa

Imagina la hoja como un paisaje. Sin centros es un plano inclinado que sube exactamente una unidad por franja; sus curvas de nivel a alturas enteras son rectas paralelas equiespaciadas, y pintar uno de cada dos huecos entre ellas da franjas lisas. Cada centro de atracción añade entonces una colina suave, una campana gaussiana cuya altura es la fuerza de atracción medida en franjas y cuya anchura es el alcance; cada centro de repulsión cava la misma forma como fosa. Las bandas siguen siendo nada más que las curvas de nivel de esa superficie a alturas enteras, así que todo lo que hace el dibujo se deduce de cómo se comportan las curvas de nivel. Lejos de todo centro gana el plano y las franjas corren rectas. Al acercarse a una colina la rodean, exactamente como las curvas de un mapa rodean una cumbre, y donde la colina es más empinada que el plano las curvas se cierran en anillos alrededor de la cima. Una fosa hace lo mismo con la curvatura invertida. Dos centros próximos crean una silla entre ellos, y ahí las bandas se estrechan y cambian de pareja: de eso salen los remolinos.

El dibujo traza cada conjunto de nivel entero con marching squares y los mete todos en un único trazado relleno con la regla par-impar. Las regiones por encima de cada nivel están anidadas una dentro de la siguiente, de modo que un punto que queda dentro de m lazos tiene altura entre m y m + 1, y la regla par-impar lo rellena exactamente cuando m es impar. La alternancia es una propiedad de la regla de relleno, no algo que el código lleve contado. El modo líneas traza los mismos lazos como contornos.

En movimiento los umbrales se deslizan: cada fotograma corta la superficie a alturas desplazadas el doble de la fase, así que las bandas fluyen por el paisaje y alrededor de los centros, y como un periodo de franja son dos bandas, un ciclo completo devuelve la imagen al fotograma inicial.

## Parámetros

- **count** — cuántas franjas caben en la altura de la hoja con esa inclinación. Fija además la unidad en que se miden pull y push, así que el aspecto se mantiene al cambiar el número.
- **centres** — el número de colinas y fosas, colocadas por la semilla. Se alternan, atracción primero: un centro es una sola colina; dos son una colina y una fosa.
- **pull** — la altura de cada colina, como fracción del número de franjas. Pasada más o menos la mitad, las franjas se cierran en anillos alrededor del centro.
- **push** — la profundidad de cada fosa, en la misma unidad.
- **reach** — σ, la anchura de cada colina y fosa, como fracción del lado corto de la hoja. Valores pequeños dan remolinos locales apretados; valores grandes doblan todo el campo.
- **angle** — la dirección de las franjas. 0 es horizontal.
- **render** — bandas (la paridad rellena) o líneas (los conjuntos de nivel como líneas finas).
- **strokeWidth** — grosor en modo líneas. Una decisión de dibujo.
