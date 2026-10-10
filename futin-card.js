(() => {
  'use strict';
  const root = 'assets/cards/bronze/';
  const labels = ['RIT', 'TIR', 'PAS', 'REG', 'DEF', 'FIS'];
  const displayLabels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  const materials = ['bronze','silver','gold','elite','special','other'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  // Only local assets, image uploads and HTTPS images may become layer sources.
  function imageSource(value) {
    const source = String(value || '').trim();
    if (!source || /[\u0000-\u001f\\]/.test(source)) return '';
    if (/^(?:https:\/\/|blob:|data:image\/(?:png|jpeg|webp);base64,)/i.test(source)) return escape(source);
    if (/^[a-z][a-z\d+.-]*:/i.test(source) || source.startsWith('//')) return '';
    return escape(source);
  }
  function isBronze(player) {
    return String(player?.cardDesign || '').startsWith('bronze-') || String(player?.rarity || '').toUpperCase() === 'BRONCE';
  }
  function valuesFor(player) {
    if (player.cardStats) return labels.map(label => player.cardStats[label] ?? '--');
    const [rit, tir, pas, def, fis] = player.stats || [];
    return [rit, tir, pas, Number.isFinite(rit) && Number.isFinite(pas) ? Math.round((rit + pas) / 2) : '--', def, fis].map(value => value ?? '--');
  }
  const layer = (file, className) => `<img class="${className}" src="${root}${file}.png${['base','nombre'].includes(file) ? '?v=3' : ''}" alt="" draggable="false" decoding="async" />`;
  function typeFor(player) {
    const design = String(player.cardDesign || '');
    const fromDesign = materials.find(type => design.startsWith(type));
    return fromDesign || ({BRONCE:'bronze',PLATA:'silver',ORO:'gold','ÉLITE':'elite',ESPECIAL:'special','ÍCONO':'special'}[String(player.rarity || '').toUpperCase()] || 'bronze');
  }
  // The same independent particle and reflection layers serve both card faces.
  const finish = () => `<span class="bronze-effects" aria-hidden="true"><span class="bronze-effects-content">${layer('efectos-especial', 'bronze-sparkles')}</span></span><span class="bronze-flash" aria-hidden="true"><span class="bronze-foil"></span></span>`;
  function render(player = {}, options = {}) {
    player = {...window.FutinPlayers?.catalog.find(item=>item.id===player.id),...player};
    const type = materials.includes(options.type) ? options.type : typeFor(player);
    const special = ['elite','special'].includes(type) || (options.special ?? (player.special === true || String(player.cardDesign || '').endsWith('-special')));
    const typeName = window.FutinCardData.types.find(item => item.id === type).name;
    const name = player.name || '';
    const portrait = imageSource(player.photo || player.portrait);
    const crest = imageSource(player.clubCrest || player.crest || (player.club === 'FUTIN City' ? window.FutinCardData.crests[0].src : ''));
    const country = window.FutinCardData.country(player.countryCode || player.country);
    const values = valuesFor(player);
    const nameSize = Math.min(5.4, 112 / Math.max(1, Array.from(name).length));
    return `<div class="bronze-card bronze-type-${type}${special ? ' bronze-card-special' : ''}" role="img" aria-label="${escape(name || `Base de carta ${typeName}`)}, ${special ? 'especial' : 'normal'}, valoración ${escape(player.rating ?? '--')}, posición ${escape(player.position || '--')}${country ? `, ${escape(country.name)}` : ''}. ${labels.map((label, index) => `${label} ${escape(values[index])}`).join(', ')}">
      ${layer('base', 'bronze-base')}
      <span class="card-speed-pattern" aria-hidden="true"></span>
      <div class="bronze-photo-slot">${portrait ? `<img class="bronze-portrait" src="${portrait}" alt="" draggable="false" />` : name ? '<img class="bronze-portrait card-placeholder" src="assets/ui/player-silhouette.svg?v=10" alt="" draggable="false"/>' : ''}</div>
      ${special ? finish() : ''}
      <div class="bronze-identity"><b class="bronze-rating">${escape(player.rating ?? '')}</b><span class="bronze-position">${escape(player.position || '')}</span>${country ? `<span class="bronze-nationality"><img src="${country.flag}" alt="" draggable="false" /></span>` : ''}${crest ? `<span class="bronze-crest"><img src="${crest}" alt="" draggable="false" /></span>` : ''}</div>
      <div class="bronze-name">${layer('nombre', 'bronze-banner')}<span style="--bronze-name-size:${nameSize}cqw">${escape(name)}</span></div>
      <div class="bronze-stats">${displayLabels.map((label, index) => `<div class="bronze-stat"><img class="bronze-stat-frame" src="${root}placa-estadistica.svg" alt="" draggable="false" /><span>${label}</span><div class="bronze-value"><b>${escape(values[index] === '--' && options.empty ? '' : values[index])}</b></div></div>`).join('')}</div>
    </div>`;
  }
  const bronze = (player, options = {}) => render(player, {...options,type:'bronze'});
  function baseTypeFor(player = {}) {
    const explicit = String(player.cardDesign || '').split('-')[0] || ({BRONCE:'bronze',PLATA:'silver',ORO:'gold','ÉLITE':'elite',ELITE:'elite'}[String(player.rarity || '').toUpperCase()]);
    if (['bronze','silver','gold','elite'].includes(explicit)) return explicit;
    const rating = Number(player.rating ?? player.overall) || 0;
    return rating >= 90 ? 'elite' : rating >= 80 ? 'gold' : rating >= 65 ? 'silver' : 'bronze';
  }
  function mini(player = {}) {
    const rating = Number(player.rating ?? player.overall) || 0;
    const type = baseTypeFor(player);
    const country = window.FutinCardData.country(player.countryCode || player.country);
    const portrait = imageSource(player.photo || player.portrait);
    const name = String(player.name || '');
    const nameSize = Math.min(5.4, 112 / Math.max(1,Array.from(name).length));
    return `<span class="bronze-card bronze-mini bronze-type-${type} bronze-card-special" role="img" aria-label="${escape(name)}, valoración ${rating}, posición ${escape(player.position || '--')}${country ? `, ${escape(country.name)}` : ''}">
      ${layer('base-half','bronze-base')}
      ${finish()}
      <span class="bronze-mini-content">
      <span class="bronze-photo-slot">${portrait ? `<img class="bronze-portrait" src="${portrait}" alt="" draggable="false" />` : '<img class="bronze-portrait card-placeholder" src="assets/ui/player-silhouette.svg?v=10" alt="" draggable="false"/>'}</span>
      <span class="bronze-identity"><b class="bronze-rating">${rating || '--'}</b><span class="bronze-position">${escape(player.position || '--')}</span>${country ? `<span class="bronze-nationality"><img src="${country.flag}" alt="" draggable="false" /></span>` : ''}</span>
      <span class="bronze-name">${layer('nombre','bronze-banner')}<span style="--bronze-name-size:${nameSize}cqw">${escape(name)}</span></span>
      </span>
    </span>`;
  }
  window.FutinCard = Object.freeze({render, bronze, mini, finish, isBronze, typeFor, baseTypeFor, labels, assets:root});
})();

