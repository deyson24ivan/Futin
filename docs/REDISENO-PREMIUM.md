# FUTIN · dirección visual premium

## Contrato

Identidad original de fútbol: grafito mate y coral #FF4D67, superficies metálicas, oro para hitos y recompensas, coral para acciones y progresión, verde para el césped. Jerarquía deportiva con títulos condensados, texto de lectura claro, márgenes amplios y arte 3D integrado sin cubrir controles ni datos. Se conserva el modo claro y la elección guardada; nuevos visitantes empiezan en oscuro.

## Entregas

1. Sistema visual compartido en todas las páginas, marca vectorial consistente y mando de arcade propio.
2. Escudo El camino a la gloria, arte de Penalti decisivo y Quién es el jugador, trofeo Construye tu legado y boleto VIP del pase, generados como assets locales originales.
3. Catálogo táctico común con dieciséis formaciones, carrusel de minicampo y distribución de once jugadores sin solapamientos, en club y carrera.
4. Escena de penalti con atleta renderizado, estadio, balón animado con arco y giro, malla deformable con recuperación amortiguada y HUD de diez zonas accesibles. Las probabilidades y premios existentes se conservan. El resultado se registra antes de animar para impedir repetir el tiro al recargar.
5. Cartas con patrones de velocidad y detalle metálico, estadísticas PAC, SHO, PAS, DRI, DEF, PHY manteniendo las claves internas existentes y la lectura de partidas antiguas.
6. Carrera con una vitrina de logros ordenada; los trofeos sin ganar se identifican explícitamente. Pase horizontal Gratis/Premium conservado; recompensas reales siguen pendientes.

## Reglas de integración

Arte raster integrado en assets/premium con prompts de procedencia. Iconos y controles en SVG/HTML. Escena de juego en Canvas 2D con proyección y deformación de malla: presentación de profundidad 3D, sin afirmar que es un motor de física 3D completo. Menús y acciones continúan en HTML accesible. Movimiento reducido elimina animaciones no esenciales y conserva resultados, brillo estático y legibilidad. La escena solo anima durante tiros; su bucle se detiene en pestañas ocultas. Las cartas mantienen el acabado foil existente. Los jugadores sin foto usan una silueta de equipación neutral, sustituida por su PNG cuando esté disponible. No se borran partidas ni recursos previos.

## Revisión

Recorrido visual en navegador de inicio, equipo, galería, tienda, pase, carrera y ambos minijuegos. Revisar estados de selección, formación de cinco filas, caras de carta y adaptación móvil. No se añaden ni ejecutan pruebas automatizadas sin petición del usuario.

## Integración realizada

- Las nueve páginas cargan `futin-premium.css` al final del sistema visual y `futin-premium.js` para el arte compartido. El SVG de la marca, la moneda y el mando usan oro, grafito y coral.
- Los dieciséis esquemas se comparten entre Inicio, Mi equipo y Carrera. Los campos ajustan su altura al número de líneas. El almacenamiento y el banquillo se agrupan juntos para evitar un hueco vacío junto a la cancha.
- Las fotos reales o PNG cargados conservan su integración; cuando falta una imagen se usa una equipación neutral. Inicio usa la minicarta para que media, posición, bandera y nombre sean legibles en su vista compacta.
- La vitrina calcula primera victoria, cinco victorias y campeonato con los resultados reales de la temporada actual. Reiniciar una temporada muestra sus nuevos objetivos.
- Se recorrieron las nueve páginas en el navegador, incluidos modo claro/oscuro, una formación de seis líneas en club, cinco defensores en carrera y reverso con estadísticas. Se revisó el pase y los minijuegos a 390 × 844 px. El lanzamiento y la retirada entregaron una sola recompensa en la vista previa; el cambio natural de día UTC renovó los intentos.
- Ilustraciones generadas con la herramienta integrada de imágenes. Procedencia y prompts exactos en `assets/premium/generacion.json`. Vista previa estática mediante `node scripts/preview-server.ts` en `http://127.0.0.1:8765`.
