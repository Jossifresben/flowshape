---
source: Formulación por función de corriente de un campo vectorial 2D sin divergencia (cálculo vectorial clásico — un campo plano es el rotacional de una función de corriente escalar exactamente cuando carece de divergencia; cf. la descomposición de Helmholtz); deformación de dominio según Quílez, I. (2002) "Domain Warping"; la composición del campo de vórtices y ondas en rizo, su coherencia de orden forzado y su movimiento de fase son construcción propia de este proyecto
url: https://en.wikipedia.org/wiki/Stream_function
construction: original
---

## Fórmula

    V(x,y) = swirl · Σᵢ (−Δyᵢ, Δxᵢ) · sᵢ · exp(−|Δᵢ|² / 2σᵢ²)          (vórtices, Δᵢ = (x,y) − centroᵢ)
             + waviness · Σⱼ (kyⱼ, −kxⱼ) · Aⱼ · cos(kxⱼ·x + kyⱼ·y + φⱼ)  (ondas en rizo)

    (x, y) evaluadas en la coordenada deformada  x′ = x + warp·N₁(x,y),  y′ = y + warp·N₂(x,y)

    θ(x,y) = atan2(Vy, Vx)                      (orientación del trazo, θ ≡ θ + π)

## Qué significa

Cada trazo de la retícula apunta como lo haría una brújula diminuta soltada en ese punto dentro de un viento: la dirección sale de un campo vectorial, y el campo está construido para que solo pueda arremolinarse. Cada término de vórtice de arriba es el rotacional de una campana gaussiana, y cada término de onda es el rotacional de una sinusoide plana — y el rotacional de *cualquier* función escalar carece automáticamente de divergencia, lo que en un flujo significa que no hay fuentes ni sumideros: nada puede brotar hacia fuera ni drenarse. La coherencia entre trazos vecinos es, por tanto, un teorema, no un ajuste — los trazos cercanos concuerdan porque muestrean el mismo campo suave, nunca porque se les haya empujado a coincidir.

Los vórtices marcan la estructura amplia —direcciones de rotación alternas, de modo que el ojo lee ruedas que giran en sentidos opuestos cosidas en una sola tela— y las ondas en rizo cabalgan encima como una flexión menor y local, exactamente el "movimiento coherente amplio, luego flexión local, luego otra región coherente" que se le pidió a este patrón. Antes de muestrear ninguno de los dos, las propias coordenadas se doblan a través de dos campos de ruido de baja frecuencia —la deformación de dominio de Quílez, la misma técnica que este proyecto ya usa en la retícula del tejido deformado—, lo que impide que los vórtices se lean como círculos de brújula perfectos y da a los remolinos su borde orgánico, dibujado a mano.

Solo se mueve la orientación de cada trazo; la retícula en sí queda fija, así que nada aparece ni desaparece en toda la animación. En movimiento, el campo entero gira un tic por ciclo con un destello ajustado a la propia estructura montado sobre ese giro, la fase de cada onda avanza a su propio ritmo entero pequeño para que la flexión local viaje de forma visible, y cada centro de vórtice deambula por un círculo cerrado diminuto —todo ello exactamente periódico en uno, así que el bucle cierra sin costura. Donde el campo se apagaría —el ojo de un vórtice—, es la opacidad del trazo la que se atenúa en vez de que el ángulo se vuelva inestable, de modo que los núcleos se leen como una respiración y no como un parpadeo.

## Parámetros

- **cells** — la resolución de la retícula (trazos por lado corto); un eje estructural que recoloca cada trazo.
- **vortices** — cuántos centros giratorios siembran el campo; otro eje estructural, pues añadir uno reordena toda la colocación.
- **swirl** — la fuerza del campo de vórtices, desde un susurro de rotación hasta un flujo plenamente dominante.
- **waviness** — la amplitud de las ondas en rizo que superponen flexión local sobre los vórtices.
- **warp** — cuánto dobla el ruido de deformación de dominio las coordenadas antes de que el campo las lea; el control del borde orgánico.
- **strokeLen** — la longitud dibujada de cada trazo, como fracción del espaciado de la retícula.
- **strokeWidth** — el grosor de línea. Una decisión de dibujo.
- **opacity** — la opacidad base sobre la que se escala cada trazo, antes de que la propia fuerza del campo atenúe sus regiones más calladas.
