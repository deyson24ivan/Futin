(() => {
  'use strict';
  const artwork = (name,className='') => {
    const img=document.createElement('img');
    img.src=`assets/premium/${name}.png?v=10`;
    img.alt=''; img.className=className; img.decoding='async'; img.draggable=false;
    return img;
  };
  function replaceArt(selector,name) {
    document.querySelectorAll(selector).forEach(node=>{
      if(node.querySelector(`img[src="assets/premium/${name}.png?v=10"]`)) return;
      node.replaceChildren(artwork(name));
    });
  }
  replaceArt('.home-season-emblem','glory-crest');
  replaceArt('.home-goal-art','penalty-keyart');
  replaceArt('.home-guess-art','trivia-keyart');
  document.querySelectorAll('.home-trophy-art').forEach(node=>{
    if(node.tagName!=='IMG') node.replaceWith(artwork('legacy-trophy','home-trophy-art'));
  });
  document.querySelectorAll('.pass-overview-brand img').forEach(img=>{img.src='assets/premium/season-ticket.png?v=10';img.alt='Boleto VIP del pase de temporada FUTIN';});
  document.querySelectorAll('.picker-penalty .picker-art').forEach(img=>img.src='assets/premium/penalty-keyart.png?v=10');
  document.querySelectorAll('.picker-guess .picker-art').forEach(img=>img.src='assets/premium/trivia-keyart.png?v=10');
  document.querySelectorAll('.hero-pass,.hero-career,.hero-games').forEach(hero=>{
    hero.classList.add('premium-hero');
    if(hero.querySelector('.premium-hero-art')) return;
    const name=hero.classList.contains('hero-pass')?'glory-crest':hero.classList.contains('hero-career')?'legacy-trophy':null;
    if(name) hero.append(artwork(name,'premium-hero-art'));
    else {const img=document.createElement('img');img.src='assets/ui/controller-premium.svg?v=10';img.alt='';img.className='premium-hero-art';hero.append(img);}
  });
  document.querySelectorAll('.nav-link[href="minijuegos.html"] .nav-icon').forEach(node=>{
    if(node.closest('[data-react-shell]')) return;
    const img=document.createElement('img');img.src='assets/ui/controller-premium.svg?v=10';img.alt='';node.replaceChildren(img);
  });
  document.querySelectorAll('.season-card').forEach(card=>{
    if(!card.closest('[data-react-shell]')) card.append(artwork('glory-crest','sidebar-season-crest'));
  });
  const galleryHero=document.querySelector('.hero-players');
  if(galleryHero&&window.FutinCard&&!galleryHero.querySelector('.premium-card-fan')) {
    const fan=document.createElement('div');fan.className='premium-card-fan';fan.setAttribute('aria-hidden','true');
    fan.innerHTML=['silver','gold','elite'].map((type,index)=>`<span>${window.FutinCard.render({name:['FUTIN PLATA','FUTIN ORO','FUTIN ÉLITE'][index],rating:[79,86,92][index],position:'DEL',countryCode:'CO',club:'FUTIN City',stats:[86,84,80,48,79]},{type})}</span>`).join('');
    galleryHero.append(fan);
  }
  // Artwork never invents a second card identity: decorative cards also use
  // the same layered bases as the collection, shop and career modes.
  if(window.FutinCard) {
    const baseCard = (type,className) => {
      const slot=document.createElement('span');slot.className=className;slot.setAttribute('aria-hidden','true');
      slot.innerHTML=window.FutinCard.render({name:'FUTIN',rating:'',position:'',cardStats:Object.fromEntries(window.FutinCard.labels.map(label=>[label,'']))},{type,special:true});
      return slot;
    };
    document.querySelectorAll('[data-futin-pass-card]').forEach(node=>{
      if(!node.querySelector('.pass-base-icon')) node.replaceChildren(baseCard('gold','pass-base-icon'));
    });
    document.querySelectorAll('.picker-guess,.home-guess-art').forEach(node=>{
      if(!node.querySelector('.picker-base-card')) node.append(baseCard('elite','picker-base-card'));
    });
  }

  function renderAchievements() {
    const career=window.FutinCareer;
    const panel=document.querySelector('[data-career-view="matches"]');
    if(!career || !panel) return;
    let section=panel.querySelector('.premium-achievements');
    if(!section) {
      section=document.createElement('section');section.className='premium-achievements';
      section.setAttribute('aria-label','Logros de la temporada actual');
      section.innerHTML='<div class="section-heading"><div><p class="eyebrow">TU VITRINA · TEMPORADA ACTUAL</p><h2>UN LEGADO POR CONSTRUIR</h2></div></div><div class="achievement-grid"></div>';
      panel.append(section);
    }
    const state=career.getState();
    const fixtures=state.fixtures.filter(item=>item.homeId===state.selectedClubId||item.awayId===state.selectedClubId);
    const victories=fixtures.filter(item=>item.status==='played'&&(item.homeId===state.selectedClubId?item.homeGoals>item.awayGoals:item.awayGoals>item.homeGoals)).length;
    const complete=fixtures.length>0&&fixtures.every(item=>item.status==='played');
    const achievements=[
      {name:'Primera victoria',goal:'Gana tu primer partido de liga',earned:victories>0},
      {name:'Cinco triunfos',goal:'Suma cinco victorias en la temporada',earned:victories>=5},
      {name:'Campeón de liga',goal:'Termina la temporada en el primer puesto',earned:complete&&career.getStandings()[0]?.teamId===state.selectedClubId}
    ];
    section.querySelector('.achievement-grid').innerHTML=achievements.map((item,index)=>`<article class="achievement-tile ${item.earned?'is-earned':'is-locked'}"><img src="assets/premium/legacy-trophy.png?v=10" alt="" loading="lazy" decoding="async"/><div><span class="achievement-status">${item.earned?'CONSEGUIDO':'OBJETIVO '+String(index+1).padStart(2,'0')}</span><h3>${item.name}</h3><p>${item.goal}</p></div></article>`).join('');
  }
  window.FutinPremium=Object.freeze({renderAchievements});
  renderAchievements();
})();

