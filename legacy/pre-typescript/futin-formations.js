(() => {
  'use strict';
  const catalog = {
    '4-3-3': [['EI','DEL','ED'],['MC','MCO','MC'],['LI','DFC','DFC','LD'],['POR']],
    '4-3-3 defensivo': [['EI','DEL','ED'],['MC','MCD','MC'],['LI','DFC','DFC','LD'],['POR']],
    '4-4-2': [['DEL','DEL'],['MI','MC','MC','MD'],['LI','DFC','DFC','LD'],['POR']],
    '4-4-1-1': [['DEL'],['MCO'],['MI','MC','MC','MD'],['LI','DFC','DFC','LD'],['POR']],
    '4-2-3-1': [['DEL'],['MI','MCO','MD'],['MCD','MCD'],['LI','DFC','DFC','LD'],['POR']],
    '4-2-2-2': [['DEL','DEL'],['MCO','MCO'],['MCD','MCD'],['LI','DFC','DFC','LD'],['POR']],
    '4-1-2-1-2': [['DEL','DEL'],['MCO'],['MC','MC'],['MCD'],['LI','DFC','DFC','LD'],['POR']],
    '4-1-4-1': [['DEL'],['MI','MC','MC','MD'],['MCD'],['LI','DFC','DFC','LD'],['POR']],
    '4-3-2-1': [['DEL'],['MCO','MCO'],['MC','MCD','MC'],['LI','DFC','DFC','LD'],['POR']],
    '4-2-4': [['EI','DEL','DEL','ED'],['MC','MC'],['LI','DFC','DFC','LD'],['POR']],
    '3-5-2': [['DEL','DEL'],['MI','MC','MCO','MC','MD'],['DFC','DFC','DFC'],['POR']],
    '3-4-3': [['EI','DEL','ED'],['MI','MC','MC','MD'],['DFC','DFC','DFC'],['POR']],
    '3-4-2-1': [['DEL'],['MCO','MCO'],['MI','MC','MC','MD'],['DFC','DFC','DFC'],['POR']],
    '5-3-2': [['DEL','DEL'],['MC','MCD','MC'],['CAI','DFC','DFC','DFC','CAD'],['POR']],
    '5-2-3': [['EI','DEL','ED'],['MC','MC'],['CAI','DFC','DFC','DFC','CAD'],['POR']],
    '5-4-1': [['DEL'],['MI','MC','MC','MD'],['CAI','DFC','DFC','DFC','CAD'],['POR']]
  };
  // Tactical chips use DC; player cards keep their own original position.
  Object.values(catalog).forEach(rows => rows.forEach(roles => roles.forEach((role,index) => { if (role === 'DEL') roles[index] = 'DC'; })));
  const names = Object.keys(catalog);
  function icon(name) {
    const rows = catalog[name] || catalog['4-3-3'];
    return `<svg viewBox="0 0 64 80" aria-hidden="true"><rect x="3" y="3" width="58" height="74" rx="5"/><path d="M3 40h58M22 3v12h20V3M22 77V65h20v12"/><circle class="formation-center" cx="32" cy="40" r="8"/>${rows.map((roles,row) => roles.map((_,col)=>`<circle class="formation-dot" cx="${6+(col+1)*52/(roles.length+1)}" cy="${10+row*60/(rows.length-1)}" r="2.7"/>`).join('')).join('')}</svg>`;
  }
  function mount(select) {
    const value = select.value;
    select.replaceChildren(...names.map(name=>new Option(name,name)));
    select.value = names.includes(value) ? value : names[0];
    const rail = document.createElement('div');
    rail.className = 'formation-carousel';
    rail.setAttribute('role','group');
    rail.setAttribute('aria-label','Formaciones tácticas');
    rail.innerHTML = names.map(name=>`<button type="button" data-formation-choice="${name}" aria-pressed="false" aria-label="Usar formación ${name}">${icon(name)}<span>${name}</span></button>`).join('');
    const anchor = select.id === 'formationSelect' ? document.querySelector('.formation-panel .drag-hint') : select.closest('.career-lineup-panel')?.querySelector('.drag-hint');
    if (anchor) anchor.before(rail); else select.closest('label')?.after(rail);
    function sync() {
      rail.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.formationChoice === select.value)));
    }
    rail.addEventListener('click',event=>{
      const button = event.target.closest('[data-formation-choice]');
      if (!button) return;
      select.value = button.dataset.formationChoice;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      sync();
    });
    select.addEventListener('change',sync);
    window.addEventListener('futin:formationchange',sync);
    sync();
  }
  window.FutinFormations = Object.freeze({catalog,names,icon,rows:name=>(catalog[name] || catalog['4-3-3']).map(row=>row.length)});
  document.querySelectorAll('#formationSelect,[data-career-formation]').forEach(mount);
})();
