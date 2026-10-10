# Mejoras del club FUTIN

## Objetivo

Completar los controles del sitio, dar un uso real a las monedas ganadas y mantener la identidad clara/oscura con selección coral. Las carreras conservan su plantilla y simulación independientes del club.

## Funciones incorporadas

- Perfil editable: nombre de mánager y club, avatar con iniciales, jugadores, sobres y progreso del pase.
- Notificaciones de compras, incorporaciones, recompensas, niveles del pase y resultados de carrera. Permiten abrir el destino y marcar avisos como leídos.
- Monedero: saldo compartido, historial de movimientos y sección de compra de monedas pendiente de integrar pagos.
- Tienda: confirmación de compra, saldo insuficiente, almacenamiento y apertura de los siete tipos de sobre. Las cartas obtenidas llegan al club y otorgan experiencia por su primer desbloqueo.
- Mi equipo: asignación de jugadores a posiciones, sustitución desde el club, selección para huecos vacíos, filtros de categoría y navegación con teclado.
- Pase: ruta horizontal de 50 niveles, selector de nivel, regreso al nivel actual, detalle de requisitos, progreso total y seguimiento de límites diarios de XP.
- Carrera: partidas guardadas más compactas, herramientas de liga agrupadas, iconos vectoriales y paneles del partido con contraste para ambos temas. El mercado se identifica como pendiente de apertura.
- Minijuegos: premios en el monedero, pistas de país/equipo y atributos al revelar la identidad. Renovación de intentos y límites de XP a las 00:00 UTC, también con la página abierta.
- Apariencia automática: claro entre 07:00 y 19:00 y oscuro el resto del día, según la hora local del dispositivo. También se puede fijar claro u oscuro.

## Estructura compartida

| Archivo | Responsabilidad |
| --- | --- |
| `futin-players.js` | Catálogo ficticio y plantilla inicial del club |
| `futin-core.js` | Reloj UTC, perfil, monedero y notificaciones |
| `futin-shell.js` | Controles comunes, iconos SVG, avisos y navegación accesible |
| `futin-polish.css` | Presentación de controles y nuevas secciones con tokens de tema |
| `futin-theme.js` | Preferencia clara, oscura o automática |
| `perfil.*` / `monedas.*` | Páginas nuevas de perfil y monedero |

Los saldos y sobres anteriores se leen desde sus claves existentes y se incorporan al monedero compartido. Las recompensas usan identificadores para evitar que una recarga vuelva a abonar el mismo premio. La entrega pendiente de un sobre se conserva para poder recuperarla si se interrumpe el guardado.

## Revisión realizada

Se interactuó con el sitio en Microsoft Edge mediante un contexto aislado del navegador, sin alterar el progreso del navegador del usuario:

- Guardar perfil, cambiar tema, abrir monedero desde el saldo y abrir/cerrar notificaciones.
- Comprar y abrir un sobre Bronce: descuento de 250 monedas, cuatro jugadores incorporados y saldo/XP conservados tras recargar.
- Seleccionar y filtrar cartas compradas; asignar jugadores a huecos y cambiar posiciones.
- Consultar el nivel 50 y regresar al nivel actual del pase.
- Crear una carrera, abrir sus seis secciones y completar un partido con sus oportunidades de gol. Comprobar la experiencia recibida.
- Retirarse de Penalti decisivo tras acertar: 25 monedas y 15 XP. Adivinar al jugador: 180 monedas y 60 XP; tras un fallo, 150 monedas y 50 XP.
- Pasar de las 23:59:50 UTC al día siguiente con reloj aislado: ambos juegos pasan de tres intentos usados a cero; los límites diarios de XP se renuevan.
- Comprobar el cambio automático a oscuro a las 19:00 locales y a claro durante la mañana.
- Revisar las nueve páginas a 320, 390, 768 y 1440 px: el documento no genera desplazamiento horizontal. La ruta del pase conserva su desplazamiento interno.
- Revisar los flujos sin errores de JavaScript y comprobar sintaxis de los scripts modificados.

## Pendientes deliberados

La compra de monedas con dinero real, las recompensas del pase y el mercado de carrera requieren una siguiente implementación. El progreso de este prototipo permanece guardado en el navegador y dispositivo actuales. La temporada mantiene el balance de 50 niveles; no se incorporó un cierre mensual automático ni se rediseñó la geometría de las cartas en esta mejora.
