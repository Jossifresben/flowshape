---
source: Mumford, D., Series, C., Wright, D., "Indra's Pearls: The Vision of Felix Klein" (Cambridge University Press, 2002)
url: https://es.wikipedia.org/wiki/Transformaci%C3%B3n_de_M%C3%B6bius
doi: 10.1017/CBO9781107050051
---

## Fórmula

    T(z) = (z − p)/(z − q)   lleva los puntos fijos p → 0, q → ∞
    M = T⁻¹ ∘ (λ·) ∘ T,   λ = s·e^{iθ},  0 < s < 1
    Cada círculo dibujado es M^u(C₀) con u entero; la animación usa u real.

## Qué significa

Una transformación de Möbius es un mapa del plano construido con los cuatro movimientos más simples que existen —trasladar, girar, escalar, invertir— y tiene una propiedad que roza el milagro: envía cada círculo a otro círculo perfecto. Sin muestreo ni aproximación; la imagen de un círculo tiene fórmula cerrada.

La variedad *loxodrómica* tiene dos puntos fijos y un multiplicador complejo λ que a la vez contrae (|λ| < 1) y gira (el ángulo de λ). Conjugada al origen es solo "multiplicar por λ": cada órbita cae en espiral logarítmica. Deshecha la conjugación, la misma historia ocurre entre los dos puntos fijos p y q: cada círculo semilla, iterado hacia delante y hacia atrás, sale de q y entra en espiral hacia p por un vórtice de dos brazos. El nombre viene de la navegación: una loxodromia es el rumbo que corta todos los meridianos con ángulo constante, y estas órbitas cortan la familia de círculos por p y q con ángulo constante exactamente igual.

Es la geometría de *Indra's Pearls*, las imágenes de grupos kleinianos que Mumford, Series y Wright rastrearon hasta la escuela de Felix Klein. Y como λ^u tiene sentido para u fraccionario, la cadena discreta de círculos se extiende a un flujo continuo: la animación desliza cada círculo un paso por su propia órbita en cada ciclo, de modo que la figura fluye a través de sí misma y regresa exacta.

## Parámetros

**Semillas** fija cuántas cadenas de círculos montan el flujo; **pasos**, hasta dónde se itera cada una en ambos sentidos. **Giro** es la rotación por paso y **contracción** el encogimiento: juntos son λ. **Tamaño semilla** y **extensión** colocan los círculos iniciales, moldeando el vórtice que los arrastra.
