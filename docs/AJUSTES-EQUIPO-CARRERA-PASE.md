# Equipo, Carrera y Pase

## Mi equipo

- La cancha usa todo el ancho del contenido. En escritorio, el portero queda a la izquierda y el ataque a la derecha; en pantallas estrechas se conserva la distribución vertical legible.
- Un solo carrusel controla las 16 formaciones. El selector interno permanece oculto como vínculo con el estado existente.
- Orden de secciones: once, suplentes, reservas, almacenamiento del club.
- Las reservas son una zona persistente de la plantilla. Se pueden mover desde la ficha, seleccionar para el once e intercambiar por arrastre con titulares y suplentes. No se cambian de sitio cartas existentes automáticamente.
- Las coordenadas explícitas de cada panel eliminan la columna lateral heredada. El tamaño de las líneas tácticas determina el alto necesario para evitar solapamientos.

## Carrera

- Crear: escribir nombre, elegir liga, seleccionar club y pulsar «Guardar y comenzar».
- Editar: botón «Editar nombre» en la partida guardada, con diálogo y validación de 1–40 caracteres.
- El nombre se conserva en los metadatos del espacio. Renombrar no altera resultados, jugadores ni temporada. Los nombres anteriores se mantienen hasta que el usuario los edite.
- Las tarjetas usan el trofeo premium en un área propia; se retira la copa antigua de fondo.

## Penalti

- Sprite reducido al 46% del alto de la escena y colocado debajo del límite inferior del HUD.
- Se conserva el balón anclado al punto de penalti y el orden de capas de interacción.
- Se retira el escudo decorativo de nueve rondas del encabezado.

## Pase

- Recorrido con imágenes reales de sobres, monedas, trofeo y bases de cartas FUTIN; Premium arriba y Gratis abajo.
- Las ilustraciones no asignan recompensas: todo sigue marcado «Por anunciar».
- Etapas de imagen de altura uniforme, niveles conectados, estados coral y scrollbar discreto.
- Los bloques de experiencia usan estadio y balón, y el trofeo premium en lugar de los SVG anteriores.

## Revisión

Revisión visual en el navegador de Mi equipo, Carrera, Pase y Penalti. No se añadieron ni ejecutaron pruebas automáticas.
