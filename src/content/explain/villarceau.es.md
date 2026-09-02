---
source: Hopf, H. (1931) "Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche", Mathematische Annalen 104, 637–665; la reparametrización en cintas y el movimiento SO(4) son construcción propia de este proyecto
url: https://en.wikipedia.org/wiki/Hopf_fibration
doi: 10.1007/BF01457962
construction: original
---

## Fórmula

    fibra sobre p ∈ S³:        { p·e^{iτ} : τ ∈ [0, 2π) }
    mapa de Hopf:               h(p) = p·i·p̄  ∈ S²
    proyección estereográfica:  S³ \ {polo} → ℝ³
    rotación, un parámetro:     R(φ): p ↦ q(φ)·p,
                                 q(φ) = cos(πφ) + sin(πφ)·n,  n cuaternión puro unitario
                                 R(1) = −I  (el mapa antipodal)

## Qué significa

Cada punto de la 3-esfera está en exactamente un círculo máximo de una familia muy particular: multiplícalo por e^{iτ} y barre una fibra, y las fibras reparten toda S³ sin tocarse entre sí. El mapa de Hopf de 1931 envía cada fibra a un único punto de la esfera ordinaria S², de modo que la 3-esfera resulta ser un haz de círculos apoyado sobre una esfera —una de las primeras formas genuinamente tridimensionales que los topólogos aprendieron a visualizar—. Proyectando esa estructura al espacio ordinario mediante estereografía, cada fibra se convierte en un círculo de verdad; las fibras que están sobre una misma latitud de S² forman un toro de círculos que lo rodean dando dos vueltas, llamados círculos de Villarceau en honor al astrónomo que notó primero que un plano puede cortar un toro en círculos en vez de las elipses esperadas. Latitudes anidadas dan toros anidados, y como cada fibra enlaza con todas las demás, la figura entera se lee como anillos ensartados en anillos y no como un tejido plano.

El movimiento no se elige a ojo: lo impone el grupo. Multiplicar por la izquierda cada punto de S³ por una familia de un parámetro q(φ) es una rotación rígida de toda la esfera de 4 dimensiones, y como esa multiplicación ocurre en el lado opuesto al τ que define una fibra, siempre lleva fibras a fibras: haga lo que haga q(φ), la estructura del haz sobrevive. En φ = 1 la rotación llega a q = −1, el mapa antipodal, que actúa sobre cada fibra como su propio medio giro: el punto vuelve a un punto que ya estaba en su círculo, así que las cintas dibujadas cierran el bucle con exactitud, por la propia ley del grupo y no por ninguna costura añadida después. Es el mismo criterio que el proyecto exige a las frecuencias coprimas del nudo y a la congruencia de Farris de la curva misteriosa.

El eje de esa rotación, inclinado respecto al polo de la proyección, es lo que hace que los toros rueden unos a través de otros en lugar de girar rígidamente en su sitio; cerca del extremo de la inclinación la banda barre el propio polo de la proyección y los anillos se dan la vuelta a través del infinito, un efecto que el código recorta en vez de dejar que estalle fuera de la página.

## Parámetros

**Latitudes** fija cuántos toros anidados se dibujan, repartidos en la banda. **Fibras** es cuántos círculos de Villarceau forman la cinta de cada toro. **Abanico** es cuánto rodea cada cinta a su toro: valores pequeños dejan una banda torcida y delgada, valores grandes cubren el toro entero. **Anidado** ensancha o estrecha el rango de latitudes, de modo que los toros quedan juntos o muy separados. **Polo** aleja el punto de proyección estereográfica de la propia esfera, lo que atrae los anillos exteriores desde el infinito. **Inclinación** aparta el eje de rotación del eje propio de los toros: en cero la figura gira en su sitio, al máximo se da la vuelta a través del infinito. **Vista** inclina toda la escena proyectada, desde mirar de frente por el eje compartido hasta verla de canto.
