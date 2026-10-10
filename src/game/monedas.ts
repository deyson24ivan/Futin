import {escapeHtml} from './dom';
(() => {
  'use strict';
  const ledger = document.querySelector<HTMLElement>('[data-wallet-ledger]')!;
  if (!ledger) return;
  const escape = escapeHtml;
  function render() {
    const wallet = window.FutinWallet.get();
    document.querySelector<HTMLElement>('[data-wallet-earned]')!.textContent = String(window.FutinWallet.format(wallet.ledger.filter(row => row.amount > 0).reduce((sum,row) => sum + row.amount,0)));
    document.querySelector<HTMLElement>('[data-wallet-spent]')!.textContent = String(window.FutinWallet.format(wallet.ledger.filter(row => row.amount < 0).reduce((sum,row) => sum - row.amount,0)));
    ledger.innerHTML = wallet.ledger.length ? wallet.ledger.slice(0,12).map(row => `<div class="wallet-movement"><span class="movement-icon">${window.FutinIcons.icon(row.type === 'purchase' ? 'pack' : 'coins')}</span><div><strong>${escape(row.label)}</strong><small>${new Intl.DateTimeFormat('es-CO',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(row.date))}</small></div><b class="${row.amount < 0 ? 'is-expense' : 'is-income'}">${row.amount < 0 ? '−' : '+'}${window.FutinWallet.format(Math.abs(row.amount))}</b></div>`).join('') : `<div class="club-empty">${window.FutinIcons.icon('coins')}<h3>Tu primer movimiento está por llegar</h3><p>Juega un desafío o compra un sobre para verlo aquí.</p></div>`;
  }
  window.addEventListener('futin:walletchange',render); render();
})();



export {};
