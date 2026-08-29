---
source: Hankin, E.H. (1925) "The Drawing of Geometric Patterns in Saracenic Art", Memoirs of the Archaeological Survey of India; construcción formalizada por Kaplan, C.S. (2005) "Islamic Star Patterns from Polygons in Contact"
url: https://cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf
---

## Fórmula

    enlosado base: cuadrícula hexagonal, tamaño de hexágono S
    para cada hexágono, el lado k tiene punto medio Mₖ, dirección unitaria Eₖ, normal interior Nₖ

    rayo desde Mₖ, dirección  E_k·cosθ + N_k·sinθ            (θ = ángulo de contacto)
    rayo desde M_{k+1}, dirección −E_{k+1}·cosθ + N_{k+1}·sinθ

    P = intersección de los dos rayos
    segmento girih: Mₖ → P → M_{k+1}                          (para cada par de lados adyacentes)

## Qué significa

Esto no es una curva de forma cerrada, sino una regla de construcción: la que E.H. Hankin documentó en 1925 tras estudiar los patrones geométricos islámicos, y que llamó "polígonos en contacto". Se parte de un enlosado corriente (aquí, una cuadrícula hexagonal) que se descarta en cuanto ha cumplido su función: solo sirve para anclar la construcción. En el punto medio de cada lado del polígono se lanzan dos rayos hacia el interior, inclinados respecto al lado un ángulo de contacto fijo θ, en vez de entrar en línea recta. Donde el rayo lanzado desde un lado se encuentra con el rayo lanzado desde el lado vecino, esa intersección se convierte en una punta afilada; unir punto medio → punta → punto medio para cada par de lados adyacentes traza el motivo entrelazado de estrellas y cintas que se reconoce a simple vista como "patrón geométrico islámico".

La construcción es enteramente local —cada hexágono solo necesita sus seis lados y el ángulo θ—, y sin embargo el resultado es globalmente continuo. Como dos hexágonos vecinos comparten un lado, también comparten el punto medio de ese lado, así que una hebra que sale por el borde de una baldosa vuelve a entrar en la baldosa vecina exactamente por el mismo punto. Sin costuras ni tablas de correspondencia: la continuidad es una consecuencia gratuita de anclar la construcción en puntos medios compartidos.

El ángulo de contacto θ es el único número que decide todo el aspecto del patrón. Los propios ejemplos históricos de Hankin se agrupan en torno a un puñado de valores canónicos: 72°, 54° y 36° para patrones de estrella de diez puntas, o 30°, 45°, 60° para cuadrículas hexagonales y cuadradas (30° sobre una cuadrícula hexagonal da la clásica estrella de seis puntas rodeada de hexágonos). Fuera de esos ángulos especiales, los motivos de estrella simplemente se abren o se cierran de forma continua, lo cual es lo que hace de θ un mando tan efectivo: es una re-derivación exacta y suave del patrón entero para cada valor, no una aproximación.

## Parámetros

- **hexSize** — S, el tamaño de la cuadrícula hexagonal subyacente sobre la que se ancla la construcción. Hexágonos más grandes producen motivos de estrella más grandes y abiertos; la cuadrícula base se descarta del dibujo final.
- **contactAngle** — θ, el ángulo de contacto de Hankin con el que se inclina cada rayo respecto a su lado. Es el mando matemático real del patrón: abre o cierra de forma continua los motivos de estrellas y cintas, pasando por el camino por los valores canónicos del propio Hankin (30°, 36°, 45°, 54°, 60°, 72°).
- **render** — una decisión de dibujo: trazar las líneas girih como simples contornos, o como cintas entrelazadas a dos tintas que simulan un tejido con paso por encima/por debajo mediante un trazo ancho del color de fondo colocado bajo uno más estrecho de tinta.
- **ribbonWidth** — el ancho de las cintas en modo cinta. Un ajuste puramente de dibujo sobre la misma geometría de líneas subyacente.
- **strokeWidth** — el grosor de línea en modo contorno. También una decisión puramente de dibujo.
