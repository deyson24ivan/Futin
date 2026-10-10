import type {Profile, ClubNotification} from "../domain/club";
import type {Economy, Player, Movement, Roster} from "../domain/game";
import {readStored} from "./dom";

  const read = readStored;
  const emit = (name: string,detail?: unknown) => window.dispatchEvent(new CustomEvent(`futin:${name}`,{detail}));
  const integer = (value: unknown) => Number.isFinite(Number(value)) ? Math.max(0,Math.floor(Number(value))) : 0;
  const dictionary = <T>(value: Record<string,T> | undefined | null): Record<string,T> => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const format = (value: unknown) => new Intl.NumberFormat('es-CO').format(integer(value));
  function dayKey(at = Date.now()) { return new Date(at).toISOString().slice(0,10); }
  function nextReset(at = Date.now()) {
    const date = new Date(at);
    return Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate() + 1);
  }
  let currentDay = dayKey();
  function tick() {
    const nextDay = dayKey();
    if (nextDay !== currentDay) { currentDay = nextDay; emit('daychange',{date:nextDay}); }
    const seconds = Math.max(0,Math.ceil((nextReset() - Date.now()) / 1000));
    const label = [Math.floor(seconds / 3600),Math.floor(seconds / 60) % 60,seconds % 60].map(n => String(n).padStart(2,'0')).join(':');
    document.querySelectorAll<HTMLElement>('[data-daily-reset]').forEach(node => { node.textContent = String(label); });
  }
  export const clockApi = { dayKey, nextReset, tick };
  setInterval(tick,1000);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) tick(); });
  window.addEventListener('pageshow',tick);

  const profileKey = 'futin-profile-v1';
  const defaultProfile = { name:'Jugador 01', club:'FUTIN City', joinedAt:Date.now() };
  const profile = (): Profile => ({ ...defaultProfile,...read(profileKey,{}) });
  export const profileApi = {
    get:profile,
    save({name,club}: Pick<Profile,"name"|"club">) {
      const next = {...profile(),name:String(name || '').trim(),club:String(club || '').trim()};
      if (next.name.length < 2 || next.name.length > 28 || next.club.length < 2 || next.club.length > 32) throw new Error('Usa un nombre de 2 a 28 caracteres y un club de 2 a 32.');
      localStorage.setItem(profileKey,JSON.stringify(next));
      emit('profilechange',next);
      return next;
    },
  };
  const noticeKey = 'futin-notifications-v1';
  const notices = () => { const saved = read<ClubNotification[]>(noticeKey,[]); return Array.isArray(saved) ? saved : []; };
  export const notificationsApi = {
    list:notices,
    add({id = uid(),title,text,href = 'perfil.html',type = 'club'}: {id?: string; title: string; text: string; href?: string; type?: string}) {
      const list = notices();
      if (list.some(item => item.id === id)) return;
      list.unshift({id,title:String(title),text:String(text),href,type,date:Date.now(),read:false});
      try { localStorage.setItem(noticeKey,JSON.stringify(list.slice(0,60))); emit('notificationschange'); } catch { /* Rewards do not depend on the activity log. */ }
    },
    markRead(id?: string) {
      const list = notices().map(item => id === undefined || item.id === id ? {...item,read:true} : item);
      localStorage.setItem(noticeKey,JSON.stringify(list)); emit('notificationschange');
    },
  };

  const economyKey = 'futin-economy-v1';
  function economy(): Economy {
    const saved = read<Economy | null>(economyKey,null);
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) return {
      ...saved,balance:integer(saved.balance),packs:dictionary(saved.packs),ledger:Array.isArray(saved.ledger) ? saved.ledger : [],paid:dictionary(saved.paid),pendingCards:Array.isArray(saved.pendingCards) ? saved.pendingCards : [],
    };
    let oldBalance;
    try { oldBalance = localStorage.getItem('futin-gems'); } catch { /* New wallet. */ }
    return {balance:oldBalance === null || oldBalance === undefined ? 2450 : integer(oldBalance),packs:dictionary(read<Record<string,number>>('futin-unopened-packs',{})),ledger:[],paid:{},pendingCards:[]};
  }
  function commit(next: Economy) {
    localStorage.setItem(economyKey,JSON.stringify(next));
    // Keep legacy keys readable for saved clubs from earlier versions.
    try { localStorage.setItem('futin-gems',String(next.balance)); localStorage.setItem('futin-unopened-packs',JSON.stringify(next.packs)); } catch { /* The canonical wallet was saved. */ }
    emit('walletchange',next);
    return next;
  }
  function addMovement(next: Economy, {id,type,amount,label}: Omit<Movement,"date">) {
    next.ledger.unshift({id,type,amount,label,date:Date.now()}); next.ledger = next.ledger.slice(0,80);
  }
  function deliverCards() {
    const next = economy();
    if (!next.pendingCards.length) return;
    const roster = read<Roster>('futin-roster-v1',window.FutinPlayers.initialRoster());
    if (!Array.isArray(roster.players)) throw new Error('No se pudo leer tu colección.');
    const known = new Set(roster.players.map(player => player.id));
    let slot = roster.players.filter(player => player.zone === 'club').length;
    next.pendingCards.forEach(player => { if (!known.has(player.id)) roster.players.push({...player,zone:'club',slot:slot++}); });
    localStorage.setItem('futin-roster-v1',JSON.stringify(roster));
    const pending = next.pendingCards;
    pending.forEach(player => window.FutinSeasonPass?.awardPlayerUnlock(player,`${player.baseId}:${player.cardDesign}`));
    next.pendingCards = []; commit(next);
    emit('rosterchange',roster);
  }
  export const walletApi = {
    get:economy, format,
    credit(id: string,amount: number,label: string) {
      const next = economy();
      if (next.paid[id]) return {credited:false,amount:next.paid[id].amount};
      const value = integer(amount);
      next.balance += value; next.paid[id] = {amount:value,date:Date.now()};
      addMovement(next,{id,type:'reward',amount:value,label}); commit(next);
      if (value) window.FutinNotifications.add({id:`wallet:${id}`,title:'Recompensa recibida',text:`${label}: +${format(value)} monedas.`,href:'monedas.html',type:'coins'});
      return {credited:true,amount:value};
    },
    buyPack(type: string,cost: number,name: string) {
      const next = economy(); const price = integer(cost);
      if (!price || next.balance < price) throw new Error(`Te faltan ${format(price - next.balance)} monedas para este sobre.`);
      next.balance -= price; next.packs[type] = integer(next.packs[type]) + 1;
      addMovement(next,{id:uid(),type:'purchase',amount:-price,label:name}); commit(next);
      window.FutinNotifications.add({title:'Sobre comprado',text:`${name} está disponible en Mis sobres.`,href:'tienda.html#mis-sobres',type:'pack'});
      return next;
    },
    openPack(type: string,players: Player[],name: string) {
      const next = economy();
      if (!integer(next.packs[type])) throw new Error('No tienes este sobre para abrir.');
      next.packs[type] -= 1; next.pendingCards.push(...players); commit(next);
      deliverCards();
      window.FutinNotifications.add({title:'Jugadores incorporados',text:`${name}: ${players.length} cartas añadidas a tu club.`,href:'plantilla.html',type:'player'});
    },
    deliverCards,
  };
  window.addEventListener('storage',event => {
    if (event.key === economyKey) emit('walletchange',economy());
    if (event.key === profileKey) emit('profilechange',profile());
    if (event.key === noticeKey) emit('notificationschange');
  });

window.FutinClock = clockApi;
window.FutinProfile = profileApi;
window.FutinNotifications = notificationsApi;
window.FutinWallet = walletApi;
