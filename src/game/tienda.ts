import {escapeHtml} from './dom';
import type {CatalogPlayer} from '../domain/game';
interface Pack {name: string; image: string; tier: string; count: number; special: number}
import {eventElement} from './dom';
(() => {
  'use strict';
  const shop = document.querySelector<HTMLElement>('.shop-page')!;
  if (!shop) return;
  const wallet = window.FutinWallet;
  const packTypes: Record<string, Pack> = {
    bronze:{name:'Sobre Bronce',image:'SobreBronce.png',tier:'BRONCE',count:4,special:1},
    silver:{name:'Sobre Plata',image:'SobrePlata.png',tier:'PLATA',count:4,special:1},
    gold:{name:'Sobre Oro',image:'SobreOro.png',tier:'ORO',count:4,special:1},
    elite:{name:'Sobre Élite',image:'SobreElite.png',tier:'ÉLITE',count:4,special:4},
    special:{name:'Sobre Especial',image:'SobreEspecial.png',tier:'ESPECIAL',count:4,special:4},
    'gold-jumbo':{name:'Sobre Oro Jumbo',image:'SobreOroJumbo.png',tier:'ORO',count:8,special:2},
    'elite-jumbo':{name:'Sobre Élite Jumbo',image:'SobreEliteJumbo.png',tier:'ÉLITE',count:8,special:8},
  };
  const escape = escapeHtml;
  const shelf = document.querySelector<HTMLElement>('[data-owned-packs]')!;
  const reveal = document.querySelector<HTMLDialogElement>('[data-pack-reveal]')!;
  const names: Record<string, string> = {BRONCE:'bronze',PLATA:'silver',ORO:'gold','ÉLITE':'elite',ESPECIAL:'special'};
  let lastPurchase: HTMLElement | null = null;
  const purchaseDialog = document.querySelector<HTMLDialogElement>('[data-pack-purchase]')!;
  function refresh() {
    const state = wallet.get();
    const owned = Object.entries(packTypes).filter(([id]) => Number(state.packs[id]) > 0);
    const total = owned.reduce((sum,[id]) => sum + state.packs[id],0);
    document.querySelector<HTMLElement>('[data-owned-total]')!.textContent = String(`${total} ${total === 1 ? 'SOBRE' : 'SOBRES'}`);
    shelf.innerHTML = owned.length ? owned.map(([id,pack]) => `<article class="owned-pack"><img src="${pack.image}" alt="${pack.name}"/><div><h3>${pack.name}</h3><p>${state.packs[id]} ${state.packs[id] === 1 ? 'disponible' : 'disponibles'} · ${pack.count} jugadores</p><button class="button button-neon" type="button" data-open-pack="${id}">Abrir sobre <span data-ui-icon="arrow"></span></button></div></article>`).join('') : '<div class="club-empty"><h3>Tu próximo fichaje te espera</h3><p>Los sobres que compres aparecerán aquí, listos para abrir.</p></div>';
    shelf.querySelectorAll<HTMLElement>('[data-ui-icon]').forEach(node => { node.innerHTML = window.FutinIcons.icon(node.dataset.uiIcon); });
  }
  function generatePlayers(pack: Pack) {
    const pool = window.FutinPlayers.catalog.filter(player => player.rarity === pack.tier);
    return Array.from({length:pack.count},(_,index) => {
      const player = structuredClone(pool[Math.floor(Math.random() * pool.length)]);
      const special = index < pack.special;
      return {...player,zone:'club' as const,slot:-1,id:crypto.randomUUID(),baseId:player.id,cardDesign:pack.tier === 'ESPECIAL' ? 'special-tier' : `${names[pack.tier]}-${special ? 'special' : 'normal'}`,special};
    });
  }
  function buy(card: HTMLElement | null) {
    if (!card) return;
    lastPurchase = card;
    const pack = packTypes[card.dataset.pack!]; const price = Number(card.dataset.priceGems);
    purchaseDialog.querySelector<HTMLElement>('[data-purchase-name]')!.textContent = String(pack.name);
    purchaseDialog.querySelector<HTMLImageElement>('[data-purchase-image]')!.src = pack.image;
    purchaseDialog.querySelector<HTMLElement>('[data-purchase-price]')!.textContent = String(wallet.format(price));
    purchaseDialog.querySelector<HTMLElement>('[data-purchase-content]')!.textContent = String(`${pack.count} jugadores · ${pack.special} ${pack.special === 1 ? 'carta especial' : 'cartas especiales'}${pack.count > pack.special ? ` y ${pack.count - pack.special} comunes` : ''}`);
    purchaseDialog.querySelector<HTMLButtonElement>('[data-purchase-confirm]')!.disabled = wallet.get().balance < price;
    purchaseDialog.querySelector<HTMLElement>('[data-purchase-note]')!.textContent = String(wallet.get().balance < price ? `Te faltan ${wallet.format(price - wallet.get().balance)} monedas.` : `Saldo después de comprar: ${wallet.format(wallet.get().balance - price)} monedas.`);
    purchaseDialog.showModal();
  }
  shop.addEventListener('click',event => {
    const button = eventElement(event).closest<HTMLElement>('.buy-gems-button');
    if (button) buy(button.closest<HTMLElement>('[data-pack]'));
    const open = eventElement(event).closest<HTMLButtonElement>('[data-open-pack]');
    if (!open) return;
    open.disabled = true;
    try {
      const pack = packTypes[open.dataset.openPack!]; const players = generatePlayers(pack);
      const before = window.FutinSeasonPass.getState().totalXp;
      wallet.openPack(open.dataset.openPack!,players,pack.name);
      const gained = window.FutinSeasonPass.getState().totalXp - before;
      reveal.querySelector<HTMLElement>('[data-reveal-title]')!.textContent = String(pack.name);
      reveal.querySelector<HTMLElement>('[data-reveal-players]')!.innerHTML = players.map(player => `<article class="pack-result png-pack-result"><span class="result-quality">${player.special ? 'ESPECIAL' : 'COMÚN'}</span>${window.FutinCard.render(player)}<p>${escape(player.country)} · ${escape(player.club)}</p></article>`).join('');
      reveal.querySelector<HTMLElement>('[data-reveal-note]')!.textContent = String(`${players.length} jugadores añadidos a tu club${gained ? ` · +${gained} XP del pase` : ''}.`);
      reveal.showModal(); refresh();
    } catch(error) { window.FutinToast?.((error instanceof Error ? error.message : String(error)),true); open.disabled = false; }
  });
  purchaseDialog.querySelector<HTMLElement>('[data-purchase-confirm]')!.addEventListener('click',() => {
    if (!lastPurchase) return;
    try {
      const pack = packTypes[lastPurchase.dataset.pack!];
      wallet.buyPack(lastPurchase.dataset.pack!,Number(lastPurchase.dataset.priceGems),pack.name);
      purchaseDialog.close(); window.FutinToast?.(`${pack.name} comprado. Ya puedes abrirlo en Mis sobres.`); refresh();
    } catch(error) { window.FutinToast?.((error instanceof Error ? error.message : String(error)),true); }
  });
  document.querySelectorAll<HTMLElement>('[data-shop-close]').forEach(button => button.addEventListener('click',() => button.closest<HTMLDialogElement>('dialog')?.close()));
  window.addEventListener('futin:walletchange',refresh); refresh();
})();



export {};
