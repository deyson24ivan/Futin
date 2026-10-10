/* One-time migration of native CSS/SVG colors, preserving raster artwork. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const write = (file,value) => fs.writeFileSync(path.join(root,file),value,'utf8');
function graphiteCoral(hex) {
  const digits = hex.slice(1);
  if (![3,4,6,8].includes(digits.length)) return hex;
  const expanded = digits.length < 5 ? [...digits].map(c=>c+c).join('') : digits;
  const rgb = [0,2,4].map(index=>parseInt(expanded.slice(index,index+2),16)/255);
  const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min;
  if (!delta) return hex;
  let hue=(max===rgb[0] ? (rgb[1]-rgb[2])/delta : max===rgb[1] ? (rgb[2]-rgb[0])/delta+2 : (rgb[0]-rgb[1])/delta+4)*60;
  hue=(hue+360)%360;
  if (hue < 175 || hue > 265) return hex;
  const saturation=max ? delta/max : 0;
  let mapped;
  if (max < .5 || saturation < .32) {
    const mean=Math.round((rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)*255);
    mapped=[mean,mean+1,Math.min(255,mean+6)];
  } else {
    const value=Math.round(max*255),low=Math.round(value*(1-Math.min(saturation,.7)));
    mapped=[value,low,Math.round(low+(value-low)*.23)];
  }
  return '#'+mapped.map(v=>v.toString(16).padStart(2,'0')).join('')+expanded.slice(6);
}
const vectors=['futin-mark.svg','futin-logo.svg','futin-coin.svg','assets/ui/controller-premium.svg','assets/ui/player-silhouette.svg'];
for (const file of vectors) write(file,read(file).replace(/#[\da-f]{3,8}\b/gi,graphiteCoral));
let css=read('futin-premium.css').replace(/#[\da-f]{3,8}\b/gi,graphiteCoral)
  .replaceAll('--premium-blue','--premium-accent').replaceAll('--premium-cyan','--premium-highlight');
css=css.replace(/--premium-accent:#[\da-f]+;/,'--premium-accent:#ff4d67;')
  .replace(/--premium-highlight:#[\da-f]+;/,'--premium-highlight:#ff8296;')
  .replace('--theme-page:#121318','--theme-page:#17181c');
css=css.replace(/html\[data-theme="dark"\] \{[\s\S]*?\n\}/,`html[data-theme="dark"] {
  --theme-page:#17181c; --theme-panel:#1f2127; --theme-panel-soft:#252830;
  --theme-control:#343740; --theme-line:#42454f; --theme-text:#f7f7fa;
  --theme-muted:#b9bbc5; --theme-soft:#a6a8b2; --theme-accent-text:#ff8296;
  --theme-selected-soft:#38252d; --theme-glaze-strong:#ff4d6708; --theme-glaze-soft:#ffffff03;
  --premium-gold-text:#edc77d; background:var(--theme-page);
}`);
css=css.replace(/\.bronze-type-elite \{[^}]+\}/,'.bronze-type-elite { --card-material-filter:sepia(.3) saturate(3.1) hue-rotate(325deg) brightness(.85); --bronze-ink:#fff3ed; }');
write('futin-premium.css',css);
for(const file of ['pase.html','minijuegos.html']) {
  let html=read(file);
  if(!html.includes('futin-card.css')) html=html.replace('<link rel="stylesheet" href="futin-premium.css','<link rel="stylesheet" href="futin-card.css?v=10" />\n<link rel="stylesheet" href="futin-premium.css');
  if(!html.includes('src="futin-card.js')) html=html.replace('<script src="futin-players.js" defer></script>','<script src="futin-players.js" defer></script><script src="futin-card-data.js" defer></script><script src="futin-card.js?v=10" defer></script>');
  write(file,html);
}
// Bust cached design files on every screen after this migration.
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.html'))) {
  let html=read(file);
  for(const name of ['futin-premium.css','futin-premium.js','home.js','plantilla.js','futin-formations.js','futin-card.js','futin-card.css','penalty-scene.js','adivina-jugador.js']) {
    const expression=new RegExp(name.replaceAll('.','\\.')+'(?:\\?v=\\d+)?','g');
    html=html.replace(expression,name+'?v=10');
  }
  html=html.replace('career-page.js?v=8','career-page.js?v=10');
  write(file,html);
}
console.log('Native palette, shared card dependencies and cache versions updated.');
