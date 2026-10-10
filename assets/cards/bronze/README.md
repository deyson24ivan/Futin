# Capas de la carta FUTIN

La base conserva el marco y el fondo bronce cálido de 1024 × 1536. No contiene texto, fotografía, valoración, posición, bandera ni escudo fijo. El exterior es transparente y el interior opaco.

## Recursos activos

| Archivo | Uso |
| --- | --- |
| base.png | Marco, fondo y línea de división |
| base-half.png | Parte superior de la base, cerrada debajo del nombre, para las cartas cortas de carrera |
| nombre.png | Banda de nombre vacía |
| placa-estadistica.svg | Placa individual con remates en punta y divisor interno, repetida seis veces |
| efectos-especial.png | Partículas transparentes del acabado especial |
| escudo-ejemplo-blanco.png | Escudo FUTIN opcional; se selecciona en el editor |

base-mini.png, valoracion.png, posicion.png, casilla-estadistica.png e identity-safe-mask.svg son recursos anteriores conservados; no se utilizan en la composición actual.

## Medidas proporcionales

- Contenedor: proporción 2:3; capas sin estirar y texto en cqw.
- Identidad izquierda: izquierda 17%, arriba 16%, ancho 20%, alto 37%. Media, posición, bandera y escudo se apilan en este orden. No hay círculo ni hexágono.
- Media: 12cqw; posición: 7cqw. Ambos centrados en su columna.
- Foto: zona invisible a la derecha, izquierda 36%, arriba 14%, ancho 50%, alto 41%. object-fit: contain y alineación inferior conservan la proporción.
- Nombre: izquierda 13%, arriba 55%, ancho 74%, alto 7.5%; PNG centrado manteniendo su proporción original.
- Estadísticas: izquierda 16%, arriba 64.8%, ancho 68%; seis columnas iguales: RIT, PAS, TIR, REG, DEF y FIS. Etiquetas y números se centran dentro de cada placa.
- Acabado: partículas con intensidad variable debajo de la foto y datos, incluidas las placas opacas de estadísticas. El reflejo diagonal de 6.5 segundos se coloca encima de toda la carta. Ambas capas se limitan a la silueta con recorte CSS nativo, derivado del alfa de los PNG (procedencia en contornos-css.json), y mezcla screen. Con prefers-reduced-motion conservan estrellas y brillo estático.
- Carrera: base corta 1024:1088; frente sobre un lienzo virtual 2:3, sin estadísticas ni escudo. La foto y el nombre se elevan al 12% y 51.5% del lienzo para dejar margen inferior. Cuatro materiales base: Bronce, Plata, Oro y Élite, todos con estrellas y flash en ambas caras. Reverso con la misma silueta y los datos de carrera delante de las estrellas.

## Editor e integración

Vista grande editable: cartas.html#bronce. Tipos: Bronce, Plata, Oro, Élite, Especial y Otra; usan variantes de color CSS sobre la misma base PNG. Selección de país con bandera SVG local, catálogo de escudos inicialmente FUTIN y carga de foto y escudo personalizados.

Cargar futin-card-data.js antes de futin-card.js y usar FutinCard.render(player, options). Datos opcionales: countryCode, portrait, clubCrest y cardStats con seis valores explícitos. FutinCard.bronze conserva compatibilidad. El catálogo anterior guarda RIT, TIR, PAS, DEF, FIS; en ese caso REG conserva su cálculo anterior (RIT + PAS) / 2.

El mismo componente se usa en Inicio, Mi equipo, fichas de jugador, galería y apertura de sobres. El modo carrera usa FutinCard.mini al frente, con media, posición, país, foto o avatar y nombre; al girar muestra seis estadísticas, edad, potencial y valor. Sus cartas usan solo materiales base. La vista previa del editor no modifica la plantilla guardada.

Guías: docs/CREADOR-CARTAS.md y docs/CARTAS-CARRERA.md. Los prompts originales constan en generacion.json, la edición del fondo en ajuste-bronce-calido.json, la versión mini anterior en mini-generacion.json y la base corta actual en half-generacion.json (herramienta integrada image_gen).
