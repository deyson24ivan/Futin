(() => {
  const cards = [
    { id: "bronze-normal", name: "Bronce", type: "Normal", finish: "MATE", className: "bronze normal" },
    { id: "bronze-special", name: "Bronce", type: "Especial", finish: "FOIL", className: "bronze special" },
    { id: "silver-normal", name: "Plata", type: "Normal", finish: "MATE", className: "silver normal" },
    { id: "silver-special", name: "Plata", type: "Especial", finish: "FOIL", className: "silver special" },
    { id: "gold-normal", name: "Oro", type: "Normal", finish: "MATE", className: "gold normal" },
    { id: "gold-special", name: "Oro", type: "Especial", finish: "FOIL", className: "gold special" },
    { id: "elite", name: "Élite", type: "Especial", finish: "ROJO", className: "elite special" },
    { id: "special", name: "Especial", type: "Especial", finish: "IRIDISCENTE", className: "special-tier special" },
  ];
  const grid = document.querySelector<HTMLElement>('#cardDesignGrid')!;
  if (!grid) return;
  grid.innerHTML = cards.map((card,index) => {
    const type = window.FutinCard.typeFor({cardDesign:card.id});
    const visual = window.FutinCard.render({}, {type,special:card.type !== 'Normal',empty:true});
    return `<article class="card-design-sample"><div class="sample-heading"><div><p>${card.type === 'Normal' ? 'ACABADO MATE' : `ACABADO ${card.finish}`}</p><h2>${card.name} <span>${card.type === 'Normal' ? 'normal' : card.id === 'special' ? '' : 'especial'}</span></h2></div><span class="sample-index">${String(index + 1).padStart(2,'0')}</span></div>${visual}</article>`;
  }).join('');
})();



export {};
