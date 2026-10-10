import {eventElement} from './dom';
(() => {
  'use strict';
  const form = document.querySelector<HTMLFormElement>('[data-bronze-form]')!;
  const preview = document.querySelector<HTMLElement>('[data-bronze-preview]')!;
  if (!form || !preview) return;
  const data = window.FutinCardData;
  const field = <T extends HTMLInputElement | HTMLSelectElement = HTMLInputElement>(name: string): T => form.elements.namedItem(name) as T;
  const uploads = {portrait:'', crest:''};
  let selectedCrest = 'futin';
  const crestList = form.querySelector<HTMLElement>('[data-crest-options]')!;
  const countrySelect = field<HTMLSelectElement>('countryCode');
  data.types.forEach(type => field<HTMLSelectElement>('cardType').add(new Option(type.name,type.id)));
  function filterCountries() {
    const previous = countrySelect.value;
    const query = data.normalize(field('countrySearch').value);
    const matches = data.countries.filter(item => data.normalize(item.name).includes(query) || item.code.toLowerCase().includes(query));
    const current = data.country(previous);
    if (current && !matches.includes(current)) matches.unshift(current);
    countrySelect.replaceChildren(new Option('Sin bandera',''));
    matches.forEach(item => countrySelect.add(new Option(item.name,item.code)));
    countrySelect.value = previous;
  }
  function availableCrests() {
    return [...data.crests, ...(uploads.crest ? [{id:'custom',name:'Escudo personalizado',src:uploads.crest}] : [])];
  }
  function renderCrests() {
    const query = data.normalize(field('crestSearch').value);
    const matches = availableCrests().filter(item => data.normalize(item.name).includes(query));
    crestList.replaceChildren();
    const none = document.createElement('button');
    none.type = 'button'; none.className = 'bronze-crest-option'; none.dataset.crest = 'none';
    none.textContent = String('Sin escudo'); none.setAttribute('aria-pressed',String(selectedCrest === 'none')); crestList.append(none);
    matches.forEach(crest => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'bronze-crest-option'; button.dataset.crest = crest.id;
      button.setAttribute('aria-pressed',String(selectedCrest === crest.id));
      const image = document.createElement('img'); image.src = crest.src; image.alt = ''; image.draggable = false;
      const name = document.createElement('span'); name.textContent = String(crest.name);
      button.append(image,name); crestList.append(button);
    });
    form.querySelector<HTMLElement>('[data-crest-empty]')!.hidden = Boolean(matches.length);
  }
  function render() {
    const number = (name: string) => field(name).value === '' ? '' : Math.min(99,Math.max(1,Math.round(Number(field(name).value) || 1)));
    const type = data.types.find(item => item.id === field('cardType').value) || data.types[0];
    field('special').disabled = Boolean(type.alwaysSpecial);
    if (type.alwaysSpecial) field('special').checked = true;
    const special = field('special').checked;
    const crest = availableCrests().find(item => item.id === selectedCrest);
    preview.innerHTML = window.FutinCard.render({
      name:field('playerName').value, rating:number('rating'), position:field('position').value,
      cardStats:Object.fromEntries(window.FutinCard.labels.map(label => [label,number(label) || '--'])),
      countryCode:countrySelect.value, portrait:uploads.portrait, clubCrest:crest?.src || '',
    }, {type:type.id,special});
    document.querySelector<HTMLElement>('[data-card-editor-title]')!.textContent = String('TU CARTA ' + (type.id === 'other' ? 'PERSONALIZADA' : type.name.toLocaleUpperCase('es')));
    document.querySelector<HTMLElement>('[data-bronze-finish]')!.textContent = String(type.name.toLocaleUpperCase('es') + (type.alwaysSpecial ? '' : special ? ' ESPECIAL' : ' NORMAL') + ' · ' + (special ? 'REFLEJO ACTIVADO' : 'SIN EFECTOS'));
    const country = data.country(countrySelect.value);
    const thumbnail = form.querySelector<HTMLImageElement>('[data-country-preview]')!;
    thumbnail.hidden = !country;
    if (country) thumbnail.src = country.flag; else thumbnail.removeAttribute('src');
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    if ((eventElement(event) as HTMLInputElement).name === 'countrySearch') { filterCountries(); return; }
    if ((eventElement(event) as HTMLInputElement).name === 'crestSearch') { renderCrests(); return; }
    if ((eventElement(event) as HTMLInputElement).type !== 'file') render();
  });
  crestList.addEventListener('click', event => {
    const button = (eventElement(event) as HTMLInputElement).closest<HTMLElement>('[data-crest]'); if (!button) return;
    selectedCrest = button.dataset.crest!;
    crestList.querySelectorAll<HTMLElement>('[data-crest]').forEach(item => item.setAttribute('aria-pressed',String(item.dataset.crest === selectedCrest)));
    render();
  });
  form.addEventListener('change', event => {
    const kind = (eventElement(event) as HTMLInputElement).dataset.bronzeUpload;
    if (kind !== 'portrait' && kind !== 'crest') { render(); return; }
    const file = (eventElement(event) as HTMLInputElement).files?.[0];
    if (file && !['image/png','image/jpeg','image/webp'].includes(file.type)) {
      (eventElement(event) as HTMLInputElement).value = ''; window.FutinToast?.('Selecciona una imagen PNG, JPG o WebP.',true); return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      (eventElement(event) as HTMLInputElement).value = ''; window.FutinToast?.('La imagen debe pesar menos de 10 MB.',true); return;
    }
    if (uploads[kind]) URL.revokeObjectURL(uploads[kind]);
    uploads[kind] = file ? URL.createObjectURL(file) : '';
    if (kind === 'crest') { selectedCrest = file ? 'custom' : 'futin'; renderCrests(); }
    render();
  });
  form.querySelector<HTMLElement>('[data-bronze-reset]')!.addEventListener('click', () => {
    Object.values(uploads).filter(Boolean).forEach(url => URL.revokeObjectURL(url));
    uploads.portrait = uploads.crest = ''; selectedCrest = 'futin'; form.reset();
    filterCountries(); renderCrests(); render();
  });
  filterCountries(); renderCrests(); render();
})();



export {};
