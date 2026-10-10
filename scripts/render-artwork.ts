import {cardApi as card} from '../src/game/futin-card.ts';

// Use the actual card renderer for decorative cards too. No catalog, saved
// game, or browser storage is loaded by this build-time renderer.
export function artworkRenderer() {
  const image = (name: string, className = '') => `<img vite-ignore src="assets/premium/${name}.png?v=10" alt="" class="${className}" decoding="async" draggable="false" />`;
  const base = (type: string, className: string) => `<span class="${className}" aria-hidden="true">${card.render({
    name: 'FUTIN', rating: '', position: '',
    cardStats: Object.fromEntries(card.labels.map(label => [label, ''])),
  }, { type, special: true }).replace(/<img\b/g, '<img vite-ignore')}</span>`;

  // Controlled project templates, not arbitrary HTML. Balance the element's
  // own tag so replacing artwork never cuts off a nested div.
  function transform(html: string, match: (opening: string) => boolean, edit: (opening: string, content: string, close: string) => string) {
    const openings = /<([a-z][\w-]*)\b[^>]*>/gi;
    let found;
    while ((found = openings.exec(html))) {
      const opening = found[0];
      if (!match(opening)) continue;
      const tag = found[1];
      const start = found.index;
      const contentStart = openings.lastIndex;
      let closeStart = contentStart;
      let end = contentStart;
      if (!['img', 'input', 'br', 'hr', 'link', 'meta'].includes(tag)) {
        const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
        tokens.lastIndex = contentStart;
        let depth = 1, token;
        while ((token = tokens.exec(html))) {
          depth += token[0].startsWith('</') ? -1 : 1;
          if (depth === 0) { closeStart = token.index; end = tokens.lastIndex; break; }
        }
        if (depth !== 0) throw new Error(`No se pudo prerenderizar ${opening}`);
      }
      const replacement = edit(opening, html.slice(contentStart, closeStart), html.slice(closeStart, end));
      html = html.slice(0, start) + replacement + html.slice(end);
      openings.lastIndex = start + replacement.length;
    }
    return html;
  }
  const hasClass = (opening: string, name: string) => (opening.match(/\bclass="([^"]*)"/)?.[1] || '').split(/\s+/).includes(name);

  return (html: string) => {
    for (const [className, name] of [['home-season-emblem', 'glory-crest'], ['home-goal-art', 'penalty-keyart'], ['home-guess-art', 'trivia-keyart']]) {
      html = transform(html, o => hasClass(o, className), (o, _, c) => o + image(name) + (className === 'home-guess-art' ? base('elite', 'picker-base-card') : '') + c);
    }
    html = transform(html, o => hasClass(o, 'home-trophy-art'), () => image('legacy-trophy', 'home-trophy-art'));
    html = html.replace(/(<img\b[^>]*src=")assets\/ui\/season-badge\.svg("[^>]*>)/g, '$1assets/premium/season-ticket.png?v=10$2');
    for (const [hero, name] of [['hero-pass', 'glory-crest'], ['hero-career', 'legacy-trophy'], ['hero-games', null]]) {
      html = transform(html, o => hasClass(o, hero!), (o, content, close) => {
        if (!hasClass(o, 'premium-hero')) o = o.replace(/class="/, 'class="premium-hero ');
        if (!content.includes('class="premium-hero-art"')) content += name ? image(name, 'premium-hero-art') : '<img vite-ignore src="assets/ui/controller-premium.svg?v=10" alt="" class="premium-hero-art" />';
        return o + content + close;
      });
    }
    for (const [picker, name] of [['picker-penalty', 'penalty-keyart'], ['picker-guess', 'trivia-keyart']]) {
      html = transform(html, o => hasClass(o, picker), (o, content, c) => {
        content = content.replace(/(<img\b[^>]*src=")[^"]+("[^>]*class="picker-art"[^>]*>)/, `$1assets/premium/${name}.png?v=10$2`);
        if (picker === 'picker-guess' && !content.includes('class="picker-base-card"')) content += base('elite', 'picker-base-card');
        return o + content + c;
      });
    }
    html = transform(html, o => /\bdata-futin-pass-card\b/.test(o), (o, _, c) => o + base('gold', 'pass-base-icon') + c);
    // The controller fills saved data at startup. Its empty-slot fallback must
    // already have the current layout, rather than briefly showing old cards.
    html = transform(html, o => /\bdata-career-slot-card\b/.test(o), (o, _, c) => {
      const slotId = o.match(/data-career-slot-id="([^"]+)"/)?.[1];
      if (!slotId) throw new Error('Falta el identificador de la carrera');
      const index = slotId.split('-').pop()!.padStart(2, '0');
      return o + `<div class="save-slot-top"><span>ESPACIO ${index}</span><span class="save-empty-mark" aria-hidden="true">＋</span></div><div class="save-slot-art is-empty-art">${image('legacy-trophy')}<span>UNA NUEVA HISTORIA</span></div><h2>Tu próximo legado</h2><p>Dale un nombre a tu carrera y elige el club que llevarás a la cima.</p><button class="button button-secondary" type="button" data-slot-action="create" data-slot-id="${slotId}">NUEVA CARRERA <span>→</span></button>` + c;
    });
    html = transform(html, o => hasClass(o, 'hero-players'), (o, content, c) => {
      if (!content.includes('class="premium-card-fan"')) content += `<div class="premium-card-fan" aria-hidden="true">${['silver', 'gold', 'elite'].map((type, index) => `<span>${card.render({name: ['FUTIN PLATA', 'FUTIN ORO', 'FUTIN ÉLITE'][index], rating: [79, 86, 92][index], position: 'DEL', countryCode: 'CO', club: 'FUTIN City', stats: [86, 84, 80, 48, 79]}, {type}).replace(/<img\b/g, '<img vite-ignore')}</span>`).join('')}</div>`;
      return o + content + c;
    });
    // Runtime artwork uses these same URLs. Avoid Vite hashing only the HTML
    // version, which would make the fallback script replace a loaded image.
    return html.replace(/<img\b(?! vite-ignore)(?=[^>]*src="assets\/premium\/)/g, '<img vite-ignore');
  };
}
