(() => {
  'use strict';
  const shop = document.querySelector('.shop-page');
  if (!shop) return;
  const wallet = window.FutinWallet;
  const packTypes = {
    bronze:{name:'Sobre Bronce',image:'SobreBronce.png',tier:'BRONCE',count:4,special:1},
    silver:{name:'Sobre Plata',image:'SobrePlata.png',tier:'PLATA',count:4,special:1},
    gold:{name:'Sobre Oro',image:'SobreOro.png',tier:'ORO',count:4,special:1},
    elite:{name:'Sobre Élite',image:'SobreElite.png',tier:'ÉLITE',count:4,special:4},
    special:{name:'Sobre Especial',image:'SobreEspecial.png',tier:'ESPECIAL',count:4,special:4},
    'gold-jumbo':{name:'Sobre Oro Jumbo',image:'SobreOroJumbo.png',tier:'ORO',count:8,special:2},
    'elite-jumbo':{name:'Sobre Élite Jumbo',image:'SobreEliteJumbo.png',tier:'ÉLITE',count:8,special:8},
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shelf = document.querySelector('[data-owned-packs]');
  const reveal = document.querySelector('[data-pack-reveal]');
  const names = {BRONCE:'bronze',PLATA:'silver',ORO:'gold','ÉLITE':'elite',ESPECIAL:'special'};
  let lastPurchase = null;
  const purchaseDialog = document.querySelector('[data-pack-purchase]');
  function refresh() {
    const state = wallet.get();
    const owned = Object.entries(packTypes).filter(([id]) => Number(state.packs[id]) > 0);
    const total = owned.reduce((sum,[id]) => sum + state.packs[id],0);
    document.querySelector('[data-owned-total]').textContent = `${total} ${total === 1 ? 'SOBRE' : 'SOBRES'}`;
    shelf.innerHTML = owned.length ? owned.map(([id,pack]) => `<article class="owned-pack"><img src="${pack.image}" alt="${pack.name}"/><div><h3>${pack.name}</h3><p>${state.packs[id]} ${state.packs[id] === 1 ? 'disponible' : 'disponibles'} · ${pack.count} jugadores</p><button class="button button-neon" type="button" data-open-pack="${id}">Abrir sobre <span data-ui-icon="arrow"></span></button></div></article>`).join('') : '<div class="club-empty"><h3>Tu próximo fichaje te espera</h3><p>Los sobres que compres aparecerán aquí, listos para abrir.</p></div>';
    shelf.querySelectorAll('[data-ui-icon]').forEach(node => { node.innerHTML = window.FutinIcons.icon(node.dataset.uiIcon); });
  }
  function generatePlayers(pack) {
    const pool = window.FutinPlayers.catalog.filter(player => player.rarity === pack.tier);
    return Array.from({length:pack.count},(_,index) => {
      const player = structuredClone(pool[Math.floor(Math.random() * pool.length)]);
      const special = index < pack.special;
      return {...player,id:crypto.randomUUID(),baseId:player.id,cardDesign:pack.tier === 'ESPECIAL' ? 'special-tier' : `${names[pack.tier]}-${special ? 'special' : 'normal'}`,special};
    });
  }
  function buy(card) {
    lastPurchase = card;
    const pack = packTypes[card.dataset.pack]; const price = Number(card.dataset.priceGems);
    purchaseDialog.querySelector('[data-purchase-name]').textContent = pack.name;
    purchaseDialog.querySelector('[data-purchase-image]').src = pack.image;
    purchaseDialog.querySelector('[data-purchase-price]').textContent = wallet.format(price);
    purchaseDialog.querySelector('[data-purchase-content]').textContent = `${pack.count} jugadores · ${pack.special} ${pack.special === 1 ? 'carta especial' : 'cartas especiales'}${pack.count > pack.special ? ` y ${pack.count - pack.special} comunes` : ''}`;
    purchaseDialog.querySelector('[data-purchase-confirm]').disabled = wallet.get().balance < price;
    purchaseDialog.querySelector('[data-purchase-note]').textContent = wallet.get().balance < price ? `Te faltan ${wallet.format(price - wallet.get().balance)} monedas.` : `Saldo después de comprar: ${wallet.format(wallet.get().balance - price)} monedas.`;
    purchaseDialog.showModal();
  }
  shop.addEventListener('click',event => {
    const button = event.target.closest('.buy-gems-button');
    if (button) buy(button.closest('[data-pack]'));
    const open = event.target.closest('[data-open-pack]');
    if (!open) return;
    open.disabled = true;
    try {
      const pack = packTypes[open.dataset.openPack]; const players = generatePlayers(pack);
      const before = window.FutinSeasonPass.getState().totalXp;
      wallet.openPack(open.dataset.openPack,players,pack.name);
      const gained = window.FutinSeasonPass.getState().totalXp - before;
      reveal.querySelector('[data-reveal-title]').textContent = pack.name;
      reveal.querySelector('[data-reveal-players]').innerHTML = players.map(player => `<article class="pack-result png-pack-result"><span class="result-quality">${player.special ? 'ESPECIAL' : 'COMÚN'}</span>${window.FutinCard.render(player)}<p>${escape(player.country)} · ${escape(player.club)}</p></article>`).join('');
      reveal.querySelector('[data-reveal-note]').textContent = `${players.length} jugadores añadidos a tu club${gained ? ` · +${gained} XP del pase` : ''}.`;
      reveal.showModal(); refresh();
    } catch(error) { window.FutinToast(error.message,true); open.disabled = false; }
  });
  purchaseDialog.querySelector('[data-purchase-confirm]').addEventListener('click',() => {
    if (!lastPurchase) return;
    try {
      const pack = packTypes[lastPurchase.dataset.pack];
      wallet.buyPack(lastPurchase.dataset.pack,Number(lastPurchase.dataset.priceGems),pack.name);
      purchaseDialog.close(); window.FutinToast(`${pack.name} comprado. Ya puedes abrirlo en Mis sobres.`); refresh();
    } catch(error) { window.FutinToast(error.message,true); }
  });
  document.querySelectorAll('[data-shop-close]').forEach(button => button.addEventListener('click',() => button.closest('dialog').close()));
  window.addEventListener('futin:walletchange',refresh); refresh();
})();
