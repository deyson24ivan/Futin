# Cartas de carrera y acabado especial

## Contrato de diseño

El acabado especial usa dos capas independientes, compartidas por `FutinCard.finish`. Las partículas y estrellas quedan detrás de la foto, identidad, nombre y placas opacas de estadísticas (z-index 2). El flash diagonal móvil queda por encima de toda la composición (z-index 8). Ambas capas se limitan a la silueta y no interceptan clics. El recorte CSS es nativo, derivado del alfa de cada base PNG; no depende de una máscara externa que puede dejar invisible la capa si falla su carga. `contornos-css.json` registra los contornos y su procedencia. Con movimiento reducido se conserva un brillo estático y las estrellas, sin animación.

Mi equipo en carrera usa la parte superior de la carta FUTIN, cerrada inmediatamente debajo del nombre. La proporción corta es 1024:1088; el frente usa el lienzo virtual original de 1024 × 1536. No se comprime una carta completa para encajar en ese espacio. Media, posición y país conservan sus coordenadas. La foto sube al 12% de ese lienzo, con alto 38%, y el nombre sube al 51.5%, para dejar aire antes del cierre. El frente muestra media, posición, país, retrato y nombre; omite escudo y estadísticas.

Se usan cuatro materiales base: Bronce, Plata, Oro y Élite. Todas las cartas de carrera incluyen estrellas y flash, tanto al frente como al reverso. `FutinCard.baseTypeFor` respeta un material base explícito en `cardDesign` o `rarity`; sin ese dato usa bronce bajo 65 de media, plata desde 65, oro desde 80 y élite desde 90. El frente y el reverso consultan la misma función.

La misma carta gira sobre sí misma. El reverso conserva la base corta y muestra seis atributos, edad, potencial y valor en COP. Clic, Enter o Espacio alternan caras. El arrastre conserva el intercambio de jugadores. Las caras no visibles quedan fuera de la lectura accesible. En móvil el reverso se amplía temporalmente para facilitar su lectura.

Los retratos PNG proporcionados se ajustan sin deformación. Cuando no existe foto se usa el avatar de carrera, sin inventar una fotografía. Las ligas ficticias de demostración incluyen nacionalidades estables; las ligas importadas conservan su país y retrato cuando se proporcionan, sin atribuir un país ficticio a datos importados desconocidos.

## Recursos

`assets/cards/bronze/base-half.png`: base corta transparente, generada con la herramienta integrada image_gen a partir de `base.png`; el prompt consta en `half-generacion.json`. Su PNG de 1217 × 1293 conserva la proporción prevista. Plata, Oro y Élite reutilizan los filtros de material existentes. Los datos se montan en HTML. `base-mini.png` y `mini-generacion.json` quedan como versión anterior, sin uso en carrera.

Vistas actuales: `assets/previews/carrera-acabado-v7.jpg` y `assets/previews/galeria-acabado-v7.jpg`. Las capturas v6 conservan la versión anterior.
