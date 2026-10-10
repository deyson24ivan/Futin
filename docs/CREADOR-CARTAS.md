# Creador de cartas FUTIN

Vista: `cartas.html#bronce`.

## Distribución

La carta conserva el marco bronce de 1024 × 1536 y la proporción 2:3. Media, posición, bandera y escudo se apilan a la izquierda. La media y la posición son texto sin círculo ni hexágono. La zona de foto es invisible y ocupa el centro y la derecha; `object-fit: contain` mantiene la proporción del PNG y lo alinea abajo, antes del nombre.

Las seis placas inferiores mantienen el orden RIT, PAS, TIR, REG, DEF, FIS. Las etiquetas y los valores se centran en las áreas superior e inferior de cada placa. Las estrellas del acabado especial quedan detrás de las placas opacas y los datos. El flash diagonal móvil pasa por encima de toda la composición: foto, identidad, nombre y estadísticas. Ambas capas se limitan a la silueta y usan mezcla de luz; respetan movimiento reducido.

## Editor

- Bronce, Plata, Oro, Élite, Especial y Otra: variantes de color de las mismas capas. No son seis nuevas bases PNG independientes. Élite y Especial usan el acabado animado.
- País y bandera: 249 códigos ISO de países y territorios, más Inglaterra, Escocia, Gales e Irlanda del Norte. La búsqueda ignora tildes. Las banderas SVG son locales.
- Escudos: catálogo inicial FUTIN, selección con clic, búsqueda y opción sin escudo. Se pueden añadir entradas en `FutinCardData.crests`; también subir un escudo personalizado para la vista previa.
- Foto y escudo personalizados: PNG, JPG o WebP, hasta 10 MB; se recomienda PNG transparente. Los archivos solo se usan en la vista previa local y no cambian la plantilla guardada.

## Integración

Cargar `futin-card-data.js`, `futin-card.js` y `futin-card.css`. Usar `FutinCard.render(player, options)` para la composición; `FutinCard.bronze` conserva compatibilidad. Inicio, Mi equipo, galería de Jugadores y apertura de sobres usan este componente. El modo carrera utiliza `FutinCard.mini` en el frente y un reverso propio con información de carrera; ver `CARTAS-CARRERA.md`.

```js
element.innerHTML = FutinCard.render({
  name: 'Jugador FUTIN', rating: 62, position: 'DEL', countryCode: 'CO',
  portrait: 'assets/jugadores/ejemplo.png',
  clubCrest: FutinCardData.crests[0].src,
  cardStats: { RIT: 68, PAS: 56, TIR: 61, REG: 62, DEF: 31, FIS: 58 }
}, { type: 'bronze', special: false });
```

## Recursos

Banderas: [flag-icons](https://github.com/lipis/flag-icons), versión 7.3.2, licencia MIT incluida en `assets/flags/LICENSE`. Nombres traducidos por `Intl.DisplayNames` del navegador. Las piezas y máscaras de carta se encuentran en `assets/cards/bronze/`; `generacion.json` y `ajuste-bronce-calido.json` conservan la procedencia de las imágenes.
