---
source: Müller-Brockmann, J. (1955) cartel del Tonhalle ("Beethoven") — linaje de diseño de arcos concéntricos; la ley potencial del grosor de bandas es una parametrización propia de este proyecto
url: https://commons.wikimedia.org/wiki/File:Josef_M%C3%BCller-Brockmann._beethoven_poster(1955).jpg
---

## Fórmula

    grosorᵢ = minT + (maxT − minT) · (i / (N−1))^growth        para i = 0 … N−1
    r₀ᵢ = Σ_{k<i} (grosorₖ + gap)                                 (radio interior de la banda i)
    r₁ᵢ = r₀ᵢ + grosorᵢ                                           (radio exterior de la banda i)
    banda i = sector anular relleno, radios [r₀ᵢ, r₁ᵢ], ángulos [a₀, a₀+sweep]

## Qué significa

Este patrón es un homenaje directo al cartel de 1955 de Josef Müller-Brockmann para un concierto de Beethoven en la Tonhalle de Zúrich, una de las imágenes que definen el diseño gráfico suizo: apenas un puñado de arcos negros rotundos que irradian desde un centro común, pensados para sugerir la intensidad de la música sin ninguna ilustración. La construcción aquí se reduce a lo geométricamente esencial: cada banda es un sector anular relleno —un segmento de anillo, como una loncha cortada de una rosquilla muy gruesa— sin ningún trazo, de modo que la imagen se lee como formas planas contrapuestas y no como círculos delineados. Ese enfoque de relleno plano es deliberado: todo lo demás en este catálogo de patrones se dibuja con trazos; este es el único construido enteramente con formas de tinta sólida.

La fórmula del grosor es lo que da a las bandas su ritmo. El ancho de cada banda se interpola entre un grosor mínimo y uno máximo mediante una curva de potencia, no una línea recta: el exponente decide cómo se reparte ese crecimiento entre las N bandas. Un exponente cercano a 1 da una rampa más o menos lineal, banda a banda; muy por debajo de 1 concentra el crecimiento al principio, de modo que las primeras bandas se ensanchan deprisa y las últimas apenas cambian; muy por encima de 1 hace lo contrario, mantiene finas las bandas interiores y vuelca la mayor parte del crecimiento en las últimas —visualmente cercano a la propia técnica de Müller-Brockmann de doblar el ancho de cada arco hacia fuera desde el centro.

El barrido angular es independiente de la progresión de grosor: las bandas pueden envolver un anillo completo de 360° a modo de diana, o abarcar una cuña más estrecha, como en el abanico de arcos del cartel original, que sugiere un solo gesto en vez de un círculo cerrado.

## Parámetros

- **bandCount** — N, el número de bandas concéntricas. El número de términos de la progresión de grosor; más bandas dan un control más fino de cómo el ancho asciende de minThickness a maxThickness.
- **minThickness** / **maxThickness** — minT, maxT: el grosor de la primera y de la última banda, los dos extremos entre los que interpola la progresión de potencia.
- **growthExponent** — el exponente de la progresión (i / (N−1))^growth. Controla si la rampa de grosor concentra el crecimiento al principio (exponente < 1), crece de forma lineal (≈1), o lo concentra al final (exponente > 1) a lo largo de las bandas.
- **gap** — el espacio radial vacío entre bandas consecutivas. Entra directamente en la contabilidad acumulada del radio, así que cambia la extensión total del patrón, no solo su aspecto.
- **startAngle** / **sweepAngle** — a₀ y el arco angular que cubre el sector de cada banda. Juntos deciden si las bandas forman un anillo completo (barrido de 360°) o un abanico parcial, como en la composición original de Müller-Brockmann.
- **accentEvery** — una decisión de dibujo: cada k-ésima banda se rellena con el color de acento en vez de tinta. Puramente una elección de color superpuesta a la geometría; los radios y grosores de las bandas no se ven afectados.
