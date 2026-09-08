---
source: Smith, C.S. (1987) "The Tiling Patterns of Sébastien Truchet and the Topology of Structural Hierarchy", Leonardo 20(4); el alfabeto de glifos de N franjas, el trazado de cadenas de banda y el flujo lateral son construcción propia de este proyecto
url: https://en.wikipedia.org/wiki/Truchet_tiles
doi: 10.2307/1578535
construction: original
---

## Fórmula

    celda unidad, N franjas; la franja k cruza cada lado en t_k = (k + ½) / N

    curvas base (en cualquier rotación o reflexión):
      línea     lado ↔ lado opuesto             p_sal = p_ent
      arco      conector de esquina, radio r    r = p_ent o 1 − p_ent,
      chaflán   la cuerda recta del arco          según en qué extremo del
      codo      el ángulo que pasa por (r, r)     lado esté la esquina

    cadena de banda: lado → lado enfrentado del vecino → … hasta un borde o un bucle
    franja k en una cadena: posición de entrada λ_k = (t_k + fase) mod 1,
                            propagada paso a paso con p_sal = f(p_ent)

    bucle de Möbius: cadena cerrada cuya vuelta completa lleva p → 1 − p;
                     no puede deslizarse de forma consistente y se queda en fase 0

    simetría sobre un bloque m×m con semilla:
      pmm  espejo en ambos ejes        p4m  pmm más el espejo diagonal
      p4   cuartos de vuelta en torno al centro de la supercelda

## Qué significa

Los carteles, tejidos y papeles pintados de la Bauhaus a los que acude cualquier referencia de "patrón geométrico" son, casi sin excepción, un mismo objeto: franjas paralelas que siguen un recorrido de tramos rectos y cuartos de vuelta sobre una retícula cuadrada. Tuberías que doblan esquinas, semidiscos apilados en columnas, chevrones y rombos anidados, bloques de rayado, el nudo tejido con sus cruces por encima y por debajo: cada uno es el mismo haz de franjas tomando otra ruta.

Lo que los hace teselar es una sola regla. Cada franja toca cada borde de celda a las mismas alturas fijas, las N fracciones equiespaciadas del lado. Un cuarto de arco centrado en una esquina con radio t toca los dos lados adyacentes en t; una línea horizontal a altura t toca los dos lados verticales en t. Así que, sea cual sea el glifo de la celda vecina, sus franjas continúan exactamente donde estas terminan, y los glifos pueden rotarse, reflejarse y barajarse sin abrir nunca un hueco. Las teselas de arcos de Truchet son el caso N = 1: una franja, un arco por esquina.

El dibujo no va celda por celda. Sigue cada haz, la cadena de banda, desde el borde por el que entra hasta el borde por el que sale, o alrededor de su bucle, y coloca cada franja según dónde cruza el borde de entrada. Ese giro es lo que permite que el campo se mueva: desplaza las posiciones de entrada y propaga, y cada cruce en cada borde sigue casando. Bajo espejos, cuatro cuartos de disco se convierten en un disco y las franjas que se deslizan pasan a ser anillos que irradian desde su centro. En un nudo, la banda parece rodar. Algunos bucles cerrados resultan ser de Möbius: una franja que da la vuelta regresa por el otro lado de la banda, así que no existe un desplazamiento consistente y esos bucles se quedan quietos.

La simetría es lo que convierte unos pocos glifos en las composiciones clásicas. Un bloque con semilla de dos por dos celdas, reflejado en ambos ejes, da los discos y semidiscos concéntricos; añade el espejo diagonal y las franjas diagonales se encuentran como rombos anidados; rota el bloque y el campo gira en torno a sus centros como un caleidoscopio.

## Parámetros

- **motif** — el alfabeto de glifos: tuberías (arcos, líneas y cruces), solo arcos, discos, discos de esquina con cuadrado macizo, chevrones, rombos, rayado, nudo, o una cadena de puntos (discos unidos en diagonal; no se basa en franjas).
- **symmetry** — colocación libre, o el grupo del plano que extiende el bloque con semilla: pmm refleja, p4m refleja y añade la diagonal, p4 rota.
- **cell** — el paso de la retícula en unidades de usuario.
- **repeat** — el lado del bloque con semilla, en celdas. 0 significa que cada celda es independiente en colocación libre, y un bloque 2×2 bajo cualquier simetría.
- **stripes** — N, el número de franjas paralelas de cada banda.
- **render** — trazos (N líneas del grosor elegido) o bandas (carriles alternos rellenos, de modo que la banda se lee como anillos concéntricos).
- **width** — grosor del trazo como fracción del carril, en modo trazos.
- **tilt** — un gradiente de grosor a través de la banda: positivo engorda las franjas exteriores, negativo las interiores. Un solo eje continuo para el audio.
- **accentEvery** — dibuja cada n-ésima cadena de banda en el color de acento; 0 para ninguna.
