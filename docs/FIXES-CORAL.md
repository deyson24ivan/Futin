# FUTIN · correcciones de identidad y composición

## Contrato visual

Grafito `#17181C`, superficies `#1F2127` / `#252830`, acento coral `#FF4D67`. Claro/oscuro conservan la preferencia del usuario. Oro, plata y bronce mantienen su material; élite recupera el filtro rojo de la base original. No se introducen nuevas plantillas de carta.

## Capas y límites

- Tokens de capas en `futin-premium.css`: tablero 1, assets 2, HUD 10, cabecera/saldo 30. Cada composición usa `isolation:isolate`; los assets decorativos no capturan eventos. Los diálogos nativos permanecen en la capa superior del navegador.
- El pseudoelemento con el sobre se elimina de la cabecera de Tienda. Saldo y monedero son componentes relativos con ancho máximo y flex independiente. La portada recorta sus sobres dentro de la tarjeta; el precio es un badge con ancho de contenido.
- Chips tácticos separados del acabado de las cartas. Inicio, equipo y carrera obtienen cada rol del mismo catálogo de 16 formaciones. Se reserva separación vertical y espacio inferior en la cancha.
- La reflexión conserva el recorte de la silueta y termina con una máscara degradada. La minicarta recorta cualquier resto fuera de su caja. Partículas estáticas debajo de datos; reflexión móvil por encima.
- Pase con dos carriles horizontales, slots uniformes y niveles actuales/completados en coral. Recompensas pendientes siguen etiquetadas como por anunciar.

## Imágenes y cartas

Los siete assets se editaron con `image_gen` integrado; se generó un balón PNG transparente. Prompts y rutas originales guardados en `assets/premium/coral-prompts.json`; assets finales en `assets/premium/`. El balón nace sobre la marca de penalti del estadio: coordenadas lógicas `(500,505)`, centro elevado un radio sobre el suelo. Canvas, sprite y controles tienen capas independientes.

Trivia utiliza `FutinCard.render`; el jugador oculto solo entrega campos revelados al renderizador, también para su descripción accesible. El pase y las pancartas utilizan las mismas bases HTML/PNG de la colección. Las cartas inventadas se retiraron de las imágenes generadas.

El script `scripts/restore-brand.cjs` registra la migración inicial de colores nativos y dependencias; no se carga en el navegador. Las reglas de corrección y sus motivos están comentados en los archivos de producción.

## Revisión visual

Se revisaron Inicio, Tienda, Pase, Minijuegos, trivia y la plantilla de Carrera en escritorio. Se revisaron Inicio y Mi equipo a 390 × 844, incluyendo la formación de seis líneas; Inicio conserva once chips y el ancho del contenido coincide con el viewport. El saldo no tiene el sobre decorativo detrás. Los controles del penalti quedan sobre el sprite, y el balón se apoya sobre la marca. No se observaron errores de consola en Pase, Minijuegos o Carrera. No se ejecutaron pruebas automatizadas.
