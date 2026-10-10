# Base de referencia: cinco grandes ligas

## Alcance

Temporada de referencia: **2026–27**, fútbol masculino. Premier League, LaLiga, Serie A, Bundesliga y Ligue 1. Se recopilan los equipos de las tablas de esa temporada y los jugadores incluidos en las plantillas de sus páginas de Wikipedia. Wikidata aporta las biografías disponibles.

Esto es una fotografía de las fuentes al descargar, **no una certificación de todos los jugadores inscritos oficialmente**. Puede haber fichajes pendientes de actualizar, jugadores sin artículo, posiciones genéricas y datos ausentes. El informe `manifest.json` contiene cantidades, incidencias y cobertura real. Las páginas de los clubes reflejan la plantilla vigente, no un registro histórico cerrado de toda la temporada.

## Archivos

- `big-five.json`: base completa, con ligas, clubes, jugadores y relaciones de plantilla.
- `players.json`: jugadores únicos. Un futbolista se identifica por su QID de Wikidata cuando existe.
- `players.csv`: tabla editable; una fila por relación jugador–club–estado. Un jugador cedido puede aparecer en su club propietario y en su club actual. No contar filas como jugadores únicos.
- `first-team.csv`: versión editable que incluye exclusivamente registros del primer equipo.
- `clubs.json` / `clubs.csv`: equipos y fuente de cada plantilla.
- `leagues.json`: ligas y fuentes de las listas de participantes.
- `registrations.json`: relaciones jugador–club con temporada, dorsal y estado.
- Un JSON y un CSV por liga.
- `manifest.json`: fecha, cantidades y campos pendientes.
- `.cache/`: respuestas comprimidas para reanudar sin volver a descargar.

### Estados de plantilla

- `first-team`: jugadores listados en el primer equipo.
- `loaned-out`: jugadores cedidos a otro club, separados de la plantilla disponible.
- `academy`: jugadores de academia/reservas que la fuente lista en la página del club. No supone una recopilación completa de sus categorías inferiores.
- `under-contract`: otros jugadores bajo contrato que la fuente separa del primer equipo.

### Datos y edición

`originalName` conserva el nombre de la fuente; `futinName` queda libre para el nombre del juego. `birthDate` permite recalcular la edad; `age` se calcula a la fecha indicada en `ageReferenceDate`. No se convierte un año de nacimiento incompleto en una fecha ficticia.

`birthYear` conserva el año conocido. Si Wikidata presenta fechas exactas incompatibles con el mismo rango de preferencia, `birthDateCandidates` conserva las alternativas para revisar y se registra la incidencia en `manifest.json`. Las fechas ausentes o contradictorias se complementan con la fecha explícita de la ficha biográfica de Wikipedia cuando existe. `birthDateSource` identifica la fuente, revisión y licencia de la fecha finalmente usada. Si no hay una fecha utilizable, `birthDate` y `age` quedan vacíos. Una fecha alternativa de Wikipedia no elimina la discrepancia original señalada.

`sportingNationality` procede de las banderas de la plantilla: representa su nacionalidad deportiva, que puede diferir de la ciudadanía. `citizenshipIds` conserva las ciudadanías de Wikidata cuando existen. Las posiciones básicas se convierten a `POR`, `DEF`, `MED`, `DEL`; `positionIds` conserva las posiciones detalladas disponibles en Wikidata.

Los CSV usan UTF-8 con BOM y separador coma. En Excel, importar como texto/CSV y elegir ese separador. `citizenships` y `detailedPositions` contienen listas con nombres legibles. En los clubes, los estadios y sedes son los registrados en Wikidata; no se certifica que correspondan exclusivamente a esta temporada.

La media, el potencial, valor y atributos de juego quedan en **null** en JSON y vacíos en CSV. No se presentan números inventados como estadísticas reales ni se importan valoraciones de EA. No se descargan retratos, banderas ni escudos. Estas exportaciones son una base para editar; todavía no sustituyen el catálogo ni las partidas guardadas de FUTIN.

## Repetir la recopilación

Desde la raíz del proyecto, con Node.js 20 o superior:

```powershell
node scripts/data/collect-big-five.mjs
```

La ejecución reutiliza las respuestas descargadas. Para una nueva fotografía de las fuentes:

```powershell
$env:FUTIN_REFERENCE_DATE = (Get-Date -Format 'yyyy-MM-dd')
node scripts/data/collect-big-five.mjs --refresh
```

Modificar la temporada requiere actualizar las cinco páginas de origen en el script. Un cambio de formato o un número inesperado de equipos detiene el proceso para evitar una base silenciosamente incompleta.

## Fuentes y licencia

Plantillas y nombres tomados de **Wikipedia en inglés y sus colaboradores**, con URL de artículo y revisión en cada club/relación. El conjunto derivado de esas tablas se entrega bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), conservando atribución e indicando la extracción y reorganización realizadas. Si se redistribuye una adaptación de este material, conservar la licencia y avisar de los cambios. Esta declaración se refiere a los datos derivados, no impone una licencia al código independiente del juego.

Biografías estructuradas de **Wikidata**, bajo [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), identificadas por QID y revisión. Los datos abiertos no conceden derechos sobre retratos, escudos, marcas ni una autorización general para explotar la identidad de personas reales.

Documentación de referencia:

- [Condiciones de Wikimedia, apartado 7](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use#7._Licensing_of_Content)
- [Acceso a los datos de Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access)
- [API de lectura y parseo de MediaWiki](https://www.mediawiki.org/wiki/API:Parsing_wikitext)
