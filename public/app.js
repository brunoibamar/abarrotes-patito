import { initialState, migrateState, CATEGORIES, money, dateKey, weekStart, total, lineTotal, expectedCash, sell, refund, trimWeek } from './domain.js';
import { createInventoryUI } from './inventory-ui.js';
import { initEffects, animateView, animateCatalog, animateModal, animateCart, productAdded } from './effects.js';
import { cashView } from './cash-view.js';

const $ = (s, root = document) => root.querySelector(s);
const main = $('#main'), modal = $('#modal');
const KEY = 'patito-demo-v1';
let state, cart = [], category = 'Todos', query = '', view = 'vender', toastTimer, saleToken, storageReady = false;
const inventoryUI = createInventoryUI({ main, modal, getState:()=>state, getCart:()=>cart, commit, render, showModal, toast, esc:s=>esc(s), icon, art, sectionHead,
  onDelivery:()=>{view='recepcion';render();window.scrollTo(0,0);},
  onSuppliers:()=>{view='proveedores';render();window.scrollTo(0,0);}
});
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const paths = {
  bag:'M6 7h12l2 14H4L6 7Zm3 0V5a3 3 0 0 1 6 0v2',
  chart:'M4 20h17M7 16v-5m5 5V5m5 11v-8',
  cash:'M3 5h18v14H3zM3 9h18M7 14h3m7-1v3',
  box:'m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v11M7 5l9 4',
  truck:'M2 5h12v12H2zM14 9h4l4 4v4h-8M6 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  scan:'M3 7V3h4m10 0h4v4M3 17v4h4m10 0h4v-4M7 7v10m3-10v10m4-10v10m3-10v10',
  check:'m5 12 4 4L20 5', clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6',
  plus:'M12 5v14M5 12h14', down:'M12 3v14m-5-5 5 5 5-5M4 20h16', info:'M12 10v6m0-10v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z'
};
function icon(name, size=24) { return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ? `<path d="${paths[name]}"/>` : ''}</svg>`; }
function art(name) {
  const content = {
    milk:'<path d="m37 30 12-17h27l10 17v74H37Z" fill="#fcfdfb" stroke="#a6bdce" stroke-width="2"/><path d="M37 30h49l-10-17H49Z" fill="#bad9ec"/><path d="M37 54h49v37H37Z" fill="#78aace"/><path d="M59 61q-15 19 0 21 15-2 0-21" fill="#fff"/><text x="61" y="99" text-anchor="middle" font-size="8" fill="#537b9a" font-family="sans-serif">LECHE</text>',
    yogurt:'<path d="m32 44 7 53q21 12 42 0l7-53" fill="#fbfaf7" stroke="#dbb6bf" stroke-width="2"/><ellipse cx="60" cy="43" rx="30" ry="8" fill="#de7591"/><path d="M35 61h50l-4 30H39Z" fill="#f3bed0"/><path d="M59 68q-15-8-13 7 10 20 18 3 10-13-5-10" fill="#d65a78"/><path d="m55 67 5-6 5 7" fill="#75a174"/>',
    cheese:'<path d="m23 61 44-30 32 40v27l-76-9Z" fill="#f5d775"/><path d="m23 61 76 10v27l-76-9Z" fill="#e9bd4e"/><path d="m23 61 44-30 32 40Z" fill="#ffeaa1"/><ellipse cx="57" cy="51" rx="7" ry="4" fill="#e5c064"/><ellipse cx="78" cy="63" rx="6" ry="3" fill="#e5c064"/><circle cx="39" cy="76" r="5" fill="#d6a331"/><circle cx="73" cy="84" r="5" fill="#d6a331"/>',
    ham:'<ellipse cx="60" cy="89" rx="42" ry="9" fill="#d9b4b3"/><path d="M23 75q0-32 36-36 35 3 38 36v12q-37 14-74 0Z" fill="#ce7b83"/><ellipse cx="60" cy="72" rx="37" ry="25" fill="#f1b7b8" stroke="#c76e7e" stroke-width="3"/><path d="M30 78q30-32 60 0" fill="none" stroke="#f8d2cc" stroke-width="3"/><circle cx="46" cy="66" r="2" fill="#d69299"/><circle cx="70" cy="62" r="2" fill="#d69299"/><circle cx="67" cy="81" r="2" fill="#d69299"/>',
    box:'<path d="m22 41 38-18 38 18v47L60 108 22 88Z" fill="#d4b68b"/><path d="m22 41 38 19 38-19M60 60v48" fill="none" stroke="#a28159" stroke-width="3"/><path d="m44 31 38 19v19l-13 6V56L31 37Z" fill="#f3ddb7"/>',
    cola:'<path d="M50 12h20v12l5 10v65q0 8-8 8H53q-8 0-8-8V34l5-10Z" fill="#48251f"/><rect x="50" y="8" width="20" height="9" rx="3" fill="#d84d45"/><rect x="45" y="48" width="30" height="31" rx="2" fill="#e9534e"/><path d="M49 66q11-12 22-7" stroke="white" stroke-width="3" fill="none"/><path d="M51 33v12" stroke="#97665a" stroke-width="3" stroke-linecap="round"/>',
    chips:'<path d="m30 20 7 3 8-3 7 3 8-3 8 3 8-3 13 3-5 77-8-3-8 3-8-3-8 3-8-3-8 3-11-3Z" fill="#edbb35"/><path d="m30 20 7 3 8-3 7 3 8-3 8 3 8-3 13 3-1 10H29Z" fill="#f5d572"/><ellipse cx="58" cy="53" rx="24" ry="15" fill="#d74e3f"/><text x="58" y="57" text-anchor="middle" font-size="12" font-family="sans-serif" font-weight="bold" fill="white">PAPAS</text><ellipse cx="53" cy="79" rx="13" ry="8" fill="#ffdf7c" transform="rotate(-18 53 79)"/><ellipse cx="68" cy="86" rx="12" ry="7" fill="#ffe49a" transform="rotate(18 68 86)"/>',
    beer:'<path d="M51 12h18v27l9 15v45q0 8-8 8H50q-8 0-8-8V54l9-15Z" fill="#b48032"/><path d="M51 25h18v13H51Z" fill="#e9c984"/><rect x="50" y="8" width="20" height="8" rx="2" fill="#d9b25b"/><rect x="42" y="59" width="36" height="30" rx="3" fill="#fbf1d2"/><path d="M48 78h24M52 68h16" stroke="#786337" stroke-width="3"/><path d="M49 51v8" stroke="#e3b65e" stroke-width="3"/>',
    cookies:'<g transform="rotate(-12 60 60)"><rect x="24" y="34" width="72" height="53" rx="4" fill="#7560ac"/><path d="M24 39h72M24 82h72" stroke="#a28ecb" stroke-width="5"/><circle cx="47" cy="61" r="17" fill="#5b352e"/><circle cx="47" cy="61" r="12" fill="#7c4c3c"/><path d="M40 55h3m8 0h3m-12 11h3m5-4h3" stroke="#3c2927" stroke-width="3"/><text x="72" y="59" text-anchor="middle" fill="white" font-family="sans-serif" font-size="8" font-weight="bold">CHOCO</text><text x="73" y="71" text-anchor="middle" fill="#e9dff8" font-family="sans-serif" font-size="7">galletas</text></g>',
    egg:'<ellipse cx="57" cy="100" rx="35" ry="5" fill="#d3c1a2" opacity=".4"/><path d="M36 91q-18-5-13-25c3-14 11-29 20-26s16 21 16 33q0 21-23 18" fill="#e5c5a1"/><path d="M63 96q-24 0-23-24c1-17 10-43 23-43s22 26 23 43q1 24-23 24" fill="#f7e7cd"/><path d="M54 42q-8 10-9 26" fill="none" stroke="#fff9ea" stroke-width="4" stroke-linecap="round"/>',
    cig:'<g transform="rotate(-30 60 60)"><rect x="22" y="48" width="78" height="12" rx="3" fill="#fafaf7" stroke="#d2d6d5"/><path d="M22 51q0-3 3-3h22v12H25q-3 0-3-3" fill="#ce9a5d"/><path d="M32 49v10m6-10v10" stroke="#b9824a"/><rect x="25" y="69" width="78" height="12" rx="3" fill="#fafaf7" stroke="#d2d6d5"/><path d="M25 72q0-3 3-3h22v12H28q-3 0-3-3" fill="#ce9a5d"/></g>',
    water:'<path d="M51 17h18v10l8 12v59q0 9-9 9H52q-9 0-9-9V39l8-12Z" fill="#b7dfed"/><rect x="50" y="10" width="20" height="10" rx="3" fill="#71a5d1"/><rect x="43" y="52" width="34" height="30" rx="3" fill="#6fa9d5"/><path d="M46 70q8-8 15 0t13 0" stroke="white" stroke-width="3" fill="none"/><path d="M49 38v11" stroke="#ebf9ff" stroke-width="3" stroke-linecap="round"/>',
    bread:'<path d="M22 78q0-38 38-39 39 1 39 39c0 25-77 25-77 0" fill="#c99558"/><path d="M26 70q6-26 34-27 29 1 35 27" fill="#edc28a"/><path d="M33 75q9-26 27-30M47 88q2-30 15-43M67 91q5-27-2-46M84 84q1-23-17-38M27 71q33-10 67 0M28 81q32-8 66 0" stroke="#a96e3c" stroke-width="3" fill="none"/>'
  };
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content[name] || content.egg}</svg>`;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : initialState();
    if (data.version !== 1 || !Array.isArray(data.products) || !Array.isArray(data.sales)) throw Error('Datos no válidos');
    state = trimWeek(migrateState(data));
    localStorage.setItem(KEY, JSON.stringify(state));
    storageReady = true;
  } catch {
    state = initialState();
    $('#storage-error').hidden = false;
    $('#storage-error').textContent = 'No se pudo abrir el almacenamiento. No registres operaciones; los datos guardados no se reemplazaron.';
  }
}
function commit(next) {
  if (!storageReady) { toast('El almacenamiento no está disponible. No se guardó la operación.'); return false; }
  try { localStorage.setItem(KEY, JSON.stringify(next)); state = next; $('#storage-error').hidden = true; return true; }
  catch { $('#storage-error').hidden = false; return false; }
}
function rollover() { if (state.sales.some(s => s.day < weekStart())) commit(trimWeek(state)); }
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800); }
function showModal(title, subtitle, body) {
  modal.innerHTML = `<div class="modal-top"><h2 id="modal-title">${title}</h2><button class="close-modal" aria-label="Cerrar ventana" data-action="close">×</button></div>${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}${body}`;
  if (!modal.open) modal.showModal();
  animateModal(modal);
}
function error(message) { const el = $('#form-error', modal); if(el) el.textContent = message; else toast(message); }
function sectionHead(eyebrow, title, subtitle, action='') { return `<div class="view-heading"><div><p class="section-eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`; }
function renderNav() {
  const nav = [['vender','bag','Vender'],['caja','cash','Caja'],['productos','box','Productos'],['proveedores','truck','Proveedores']];
  $('#navigation').innerHTML = nav.map(([id, i, label]) => `<button class="nav-button ${(view===id||(id==='proveedores'&&view==='recepcion'))?'active':''}" data-view="${id}" ${(view===id||(id==='proveedores'&&view==='recepcion'))?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`).join('') + `<div class="sidebar-foot">${icon('shield')}Datos en<br>esta tablet</div>`;
}
function render() {
  rollover();
  renderNav();
  if (view==='vender') renderSell();
  if (view==='caja') renderCash();
  if (view==='productos') inventoryUI.products();
  if (view==='proveedores') inventoryUI.suppliers();
  if (view==='recepcion') inventoryUI.delivery();
  animateView(main);
}
function renderSell() {
  main.innerHTML = `<div class="selling"><section class="catalog"><p class="section-eyebrow">UNA VENTA A LA VEZ</p><h1>¿Qué vamos a vender?</h1><p class="subtitle">Escanea un producto o toca su imagen.</p><label class="search-box">${icon('search')}<span class="visually-hidden">Buscar por nombre o código de barras</span><input id="search" placeholder="Buscar producto o escanear código" value="${esc(query)}" autocomplete="off"><span class="scan-icon">${icon('scan')}</span></label><div class="chips" aria-label="Categorías">${['Todos',...CATEGORIES].map(c=>`<button class="chip ${category===c?'active':''}" data-category="${c}" aria-pressed="${category===c}">${c}</button>`).join('')}</div><div id="product-grid" class="product-grid"></div><div class="catalog-foot">${icon('check',18)} Puedes vender sin conexión a internet.</div></section><aside class="cart" aria-label="Compra actual"><div class="cart-heading"><h2>${icon('bag')} Esta compra</h2><span class="count-badge" id="cart-count"></span></div><div class="cart-body" id="cart-body"></div><div class="cart-footer"><div class="total-line"><span>Total a cobrar</span><strong id="cart-total"></strong></div><button class="primary full pay-button" data-action="pay" id="pay">${icon('cash')} Cobrar</button><p class="cash-only">${icon('shield',16)} Pago en efectivo</p><button class="clear-cart" data-action="clear" id="clear">Cancelar esta compra</button></div></aside></div>`;
  renderGrid(); renderCart();
}
function normalize(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function renderGrid() {
  const filtered = state.products.filter(p => (category==='Todos' || p.category===category) && normalize(p.name+' '+p.detail+' '+p.code).includes(normalize(query)));
  $('#product-grid').innerHTML = filtered.length ? filtered.map(p => `<button class="product" data-product="${p.id}" ${p.stock<=0?'disabled':''} aria-label="Agregar ${esc(p.name)}, ${esc(p.detail)}, ${money(p.price)} por ${p.unit}"><div class="product-art ${p.color}">${art(p.art)}${p.stock<=5?`<span class="stock-pill">${p.stock<=0?'Agotado':`Quedan ${p.stock}${p.unit==='kg'?' kg':''}`}</span>`:''}</div><div class="product-copy"><span class="product-name">${esc(p.name)}</span><span class="product-detail">${esc(p.detail)}</span><div class="product-bottom"><span class="price">${money(p.price)}${p.unit==='kg'?'<small> / kg</small>':''}</span><span class="add-dot" aria-hidden="true">+</span></div></div></button>`).join('') : '<div class="panel empty-row" style="grid-column:1/-1">No encontramos ese producto.<br>Prueba con otro nombre.</div>';
  animateCatalog($('#product-grid'));
}
function renderCart(changedId) {
  $('#cart-count').textContent = `${cart.length} ${cart.length===1?'producto':'productos'}`;
  $('#cart-body').innerHTML = cart.length ? cart.map(l => {
    const p = state.products.find(p=>p.id===l.id);
    return `<div class="cart-line" data-line-id="${p.id}"><div class="line-top"><span>${esc(p.name)}<small class="cart-variant">${esc(p.detail)}</small></span><span class="line-price">${money(lineTotal(p,l.qty))}</span></div><div class="line-bottom"><div class="qty-controls">${p.unit==='kg'?`<button data-action="weight" data-id="${p.id}" aria-label="Cambiar peso de ${esc(p.name)}">✎</button><span>${l.qty.toLocaleString('es-MX')} kg</span>`:`<button data-action="decrease" data-id="${p.id}" aria-label="Quitar una unidad de ${esc(p.name)}">−</button><span>${l.qty}</span><button data-action="increase" data-id="${p.id}" aria-label="Agregar una unidad de ${esc(p.name)}">+</button>`}</div><button class="remove" data-action="remove" data-id="${p.id}">Quitar</button></div></div>`;
  }).join('') : `<div class="cart-empty"><div class="empty-icon">${icon('bag')}</div><strong>Todo listo para comenzar</strong><p>Escanea un producto<br>o elígelo de la pantalla.</p></div>`;
  $('#cart-total').textContent = money(total(cart,state.products));
  $('#pay').disabled = !cart.length; $('#clear').disabled = !cart.length;
  if(changedId)animateCart(main,changedId);
}
function addProduct(id) {
  rollover();
  const p = state.products.find(p=>p.id===id);
  if(p.unit==='kg') { weightModal(p); return; }
  const line = cart.find(l=>l.id===id);
  if ((line?.qty||0)+1 > p.stock) { toast(`Solo quedan ${p.stock} de ${p.name}.`); return; }
  if(line) line.qty++; else cart.push({id,qty:1});
  renderCart(id); productAdded(main,id); toast(`${p.name} agregado`);
}
function scan(code) {
  const p = state.products.find(p=>p.code && p.code===code.trim());
  if(!p) { toast('Este código no está registrado. Busca el producto por nombre.'); return; }
  if(view!=='vender') { view='vender'; query=''; render(); }
  addProduct(p.id); query=''; $('#search').value=''; renderGrid();
}
function weightModal(p) {
  const line = cart.find(l=>l.id===p.id);
  showModal('Pesar y agregar', `${esc(p.name)} · ${money(p.price)} por kilo`, `<form id="weight-form"><label class="field"><span>¿Tu báscula muestra gramos o kilos?</span><select name="weightUnit"><option value="g">Gramos · ejemplo: 250</option><option value="kg">Kilos · ejemplo: 0.250</option></select></label><label class="field"><span>Peso que marca la báscula</span><input name="weight" type="number" inputmode="decimal" value="${line?Math.round(line.qty*1000):''}" required></label><div class="notice">Pesa el producto y escribe la lectura. En esta demo la báscula no está conectada a la tablet.</div><div id="weight-cost" class="pay-total" aria-live="polite"></div><div id="form-error" class="form-error" role="alert"></div><button class="primary full" type="submit">Agregar a la compra</button></form>`);
  const input = $('[name=weight]',modal),unit=$('[name=weightUnit]',modal);
  function kilos(){return Math.round(Number(input.value)*(unit.value==='g'?1:1000))/1000;}
  function update(){const grams=unit.value==='g';input.min=grams?'1':'0.001';input.max=String(p.stock*(grams?1000:1));input.step=grams?'1':'0.001';input.placeholder=grams?'Ejemplo: 250':'Ejemplo: 0.250';$('#weight-cost').innerHTML=`<span>${input.value?`${Number(input.value).toLocaleString('es-MX')} ${grams?'gramos':'kilos'}`:'Importe por este peso'}</span><strong>${money(lineTotal(p,kilos()||0))}</strong>`;}
  input.addEventListener('input',update);
  unit.onchange=()=>{if(input.value)input.value=unit.value==='g'?Math.round(Number(input.value)*1000):Number(input.value)/1000;update();};update();
  $('#weight-form').onsubmit = event => { event.preventDefault(); const qty = kilos(); if(!Number.isFinite(qty)||qty<=0||qty>p.stock) return error('Revisa el peso y la existencia disponible.'); if(line) line.qty=qty; else cart.push({id:p.id,qty}); modal.close(); renderCart(); toast('Peso agregado a la compra'); };
}
function payModal() {
  if(!cart.length) return;
  const amount = total(cart,state.products); saleToken = crypto.randomUUID();
  showModal('Cobrar en efectivo', 'Escribe cuánto dinero te entregó el cliente.', `<div class="pay-total"><span>Total de esta compra</span><strong>${money(amount)}</strong></div><form id="pay-form"><label class="field"><span>Dinero recibido</span><input id="received" class="money-input" name="received" type="text" inputmode="decimal" autocomplete="off" placeholder="$0.00" required></label><div class="quick-cash"><button type="button" data-cash="${amount}">Exacto</button>${[5000,10000,20000].map(c=>`<button type="button" data-cash="${c}">${money(c).replace('.00','')}</button>`).join('')}</div><div class="keypad">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button type="button" data-key="${k}" aria-label="${k==='⌫'?'Borrar último dígito':k}">${k}</button>`).join('')}</div><div class="change-line" aria-live="polite"><span id="change-label">Cambio por entregar</span><strong id="change">$0.00</strong></div><div id="form-error" class="form-error" role="alert"></div><button class="primary full" id="confirm-pay" type="submit" disabled>Confirmar cobro</button></form>`);
  $('#received').addEventListener('input',updateChange);
  $('#pay-form').onsubmit = event => { event.preventDefault();
    try {
      rollover(); const received = parseMoney($('#received').value); const result = sell(state,cart,received,new Date(),saleToken);
      if(!commit(result.state)) return;
      cart=[]; render();
      showModal('Venta guardada', '', `<div class="success"><div class="success-mark">${icon('check')}</div><h2>¡Listo, cobro registrado!</h2><p>Recibiste ${money(received)} por una compra de ${money(result.sale.amount)}.</p><div class="big-change"><span>Entrega de cambio</span><strong>${money(result.change)}</strong></div><button class="primary full" data-action="new-sale">Nueva venta</button></div>`);
    } catch(e) { error(e.message); }
  };
}
function parseMoney(s) { const normalized = String(s).replace(',','.').trim(); return /^\d+(\.\d{0,2})?$/.test(normalized) ? Math.round(Number(normalized)*100) : NaN; }
function updateChange() {
  const received = parseMoney($('#received').value), amount = total(cart,state.products), valid = Number.isInteger(received);
  $('#change-label').textContent = valid && received<amount ? 'Falta por recibir' : 'Cambio por entregar';
  $('#change').textContent = money(valid?Math.abs(received-amount):0);
  $('#change').style.color = valid && received<amount ? '#a13e31':'';
  $('#confirm-pay').disabled = !valid||received<amount;
}
function renderCash() {
  main.innerHTML = cashView(state, { esc, icon, sectionHead });
}
function cashModal(out=false) {
  showModal(out?'Pagar otro gasto':'Poner dinero para dar cambio',out?'Anota qué pagaste y cuánto salió del cajón.':'Ejemplo: si pones $200 de tu bolsa para dar cambio, anota $200 aquí. No cuenta como venta.',`<form id="cash-form"><label class="field"><span>Importe en pesos</span><input name="amount" inputmode="decimal" placeholder="0.00" required></label><label class="field"><span>Motivo</span><input name="reason" maxlength="80" placeholder="${out?'Ejemplo: compra de bolsas':'Ejemplo: fondo para dar cambio'}" required></label><div id="form-error" class="form-error" role="alert"></div><button class="primary full">Guardar ${out?'retiro':'entrada'}</button></form>`);
  $('#cash-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.currentTarget),amount=parseMoney(data.get('amount')),reason=data.get('reason').trim();if(!Number.isInteger(amount)||amount<=0||!reason)return error('Escribe un importe mayor a cero y el motivo.');if(out&&amount>expectedCash(state))return error('El retiro supera el efectivo registrado en caja.');if(commit({...state,movements:[...state.movements,{amount:out?-amount:amount,reason,time:new Date().toISOString()}]})){modal.close();render();toast('Movimiento guardado');}};
}
function closeDayModal() {
  const expected=expectedCash(state);
  showModal('Cerrar caja','Cuenta el efectivo que tienes y escribe la cantidad.',`<div class="pay-total"><span>Debería haber</span><strong>${money(expected)}</strong></div><form id="close-form"><label class="field"><span>Efectivo contado, en pesos</span><input name="counted" inputmode="decimal" required placeholder="0.00"></label><div id="difference" class="notice">Las ventas de hoy seguirán visibles. El dinero contado será el nuevo saldo de caja.</div><div id="form-error" class="form-error" role="alert"></div><button class="primary full">Guardar cierre de caja</button></form>`);
  $('[name=counted]',modal).oninput=e=>{const counted=parseMoney(e.target.value);$('#difference').textContent=Number.isInteger(counted)?`Diferencia: ${money(counted-expected)}. El saldo de caja quedará en ${money(counted)}.`:'Escribe una cantidad válida.';};
  $('#close-form').onsubmit=e=>{e.preventDefault();const counted=parseMoney(new FormData(e.currentTarget).get('counted'));if(!Number.isInteger(counted)||counted<0)return error('Revisa el efectivo contado.');if(commit({...state,cashBase:counted,movements:[],closures:[...state.closures.filter(c=>c.day>=weekStart()),{day:dateKey(),counted,expected,difference:counted-expected}]})){modal.close();render();toast('Cierre guardado. El efectivo contado se conserva en caja.');}};
}
function priceModal(id) {
  const p=state.products.find(p=>p.id===id);
  showModal('Cambiar precio',esc(p.name+' · '+p.detail),`<form id="price-form"><label class="field"><span>Precio de venta por ${p.unit}, en pesos</span><input name="price" inputmode="decimal" value="${(p.price/100).toFixed(2)}" required></label><div id="form-error" class="form-error" role="alert"></div><button class="primary full">Guardar nuevo precio</button></form>`);
  $('#price-form').onsubmit=e=>{e.preventDefault();const price=parseMoney(new FormData(e.currentTarget).get('price'));if(!Number.isInteger(price)||price<=0)return error('Escribe un precio mayor a cero.');if(cart.some(l=>l.id===id))return error('Termina o cancela la compra actual antes de cambiar este precio.');if(commit({...state,products:state.products.map(p=>p.id===id?{...p,price}:p)})){modal.close();render();toast('Precio actualizado');}};
}
function visitModal(index) {
  const supplier=state.suppliers[index];showModal('Día de visita',esc(supplier.name),`<form id="visit-form"><label class="field"><span>¿Cuándo viene este proveedor?</span><input name="visit" maxlength="80" value="${esc(supplier.visit)}" placeholder="Ejemplo: martes y viernes" required></label><div id="form-error" class="form-error" role="alert"></div><button class="primary full">Guardar visita</button></form>`);
  $('#visit-form').onsubmit=e=>{e.preventDefault();const visit=new FormData(e.currentTarget).get('visit').trim();if(!visit)return error('Escribe un día o “Por confirmar”.');if(commit({...state,suppliers:state.suppliers.map((s,i)=>i===index?{...s,visit}:s)})){modal.close();render();toast('Visita actualizada');}};
}
function refundModal(id) {
  const s=state.sales.find(s=>s.id===id);if(!s)return;
  showModal('Devolver esta compra','Confirma que todos los productos regresaron en condiciones para venderse.',`<ul class="receipt-list">${s.lines.map(l=>`<li>${esc(l.name)}<span>${l.qty} ${l.unit}</span></li>`).join('')}</ul><div class="pay-total"><span>Dinero que devolverás al cliente</span><strong>${money(s.amount)}</strong></div><div class="notice warning">Esta acción devuelve la compra completa y repone todos sus productos al inventario.</div><div id="form-error" class="form-error" role="alert"></div><div class="modal-actions"><button class="secondary" data-action="close">Volver</button><button class="danger" id="confirm-refund">Confirmar devolución</button></div>`);
  $('#confirm-refund').onclick=()=>{try{if(commit(refund(state,id))){modal.close();render();toast('Compra devuelta e inventario actualizado');}}catch(e){error(e.message);}};
}
function helpModal() {
  showModal('Vamos paso a paso','Esta es una demostración: puedes explorar sin usar dinero real.',`<ol class="help-list"><li><strong>Agrega productos.</strong> Toca su imagen o escanea su código.</li><li><strong>Revisa la compra.</strong> Usa + y − para cambiar cantidades.</li><li><strong>Toca “Cobrar”.</strong> Escribe cuánto te entregaron y confirma.</li><li><strong>Entrega el cambio.</strong> Aparecerá en grande al terminar.</li></ol><h2>Prueba un escaneo</h2><p class="muted">Los códigos de esta demo son ficticios. El lector debe escribir el código y terminar con Enter.</p>${state.products.filter(p=>p.code).slice(0,3).map(p=>`<div class="scan-example"><span>${esc(p.name)}<code>${p.code}</code></span><button class="table-action" data-scan="${p.code}">Simular lectura</button></div>`).join('')}<div class="notice warning">Se guarda en este navegador para probar. El respaldo automático fuera de la tablet y la aplicación final aún están pendientes.</div>`);
}

document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.view){view=button.dataset.view;render();window.scrollTo(0,0);return;}
  if(button.dataset.category){category=button.dataset.category;renderSell();return;}
  if(button.dataset.product){addProduct(button.dataset.product);return;}
  if(button.dataset.scan){modal.close();scan(button.dataset.scan);return;}
  if(button.dataset.cash){$('#received').value=(Number(button.dataset.cash)/100).toFixed(2);updateChange();return;}
  if(button.dataset.key){const input=$('#received'),key=button.dataset.key;if(key==='⌫')input.value=input.value.slice(0,-1);else if(key!=='.'||!input.value.includes('.'))input.value+=key;updateChange();return;}
  const action=button.dataset.action,id=button.dataset.id;
  if(action==='close')modal.close();
  if(action==='new-sale'){modal.close();$('#search')?.focus();}
  if(action==='pay')payModal();
  if(action==='increase')addProduct(id);
  if(action==='decrease'){const l=cart.find(l=>l.id===id);if(l.qty>1)l.qty--;else cart=cart.filter(l=>l.id!==id);renderCart();}
  if(action==='remove'){cart=cart.filter(l=>l.id!==id);renderCart();}
  if(action==='weight')weightModal(state.products.find(p=>p.id===id));
  if(action==='clear') {showModal('¿Cancelar esta compra?','Se quitarán los productos de la pantalla. El inventario no cambia.',`<div class="modal-actions"><button class="secondary" data-action="close">Seguir vendiendo</button><button class="danger" data-action="confirm-clear">Sí, cancelar</button></div>`);}
  if(action==='confirm-clear'){cart=[];modal.close();renderCart();toast('Compra cancelada');}
  if(action==='cash-in')cashModal();
  if(action==='cash-out')cashModal(true);
  if(action==='close-day')closeDayModal();
  if(action==='edit-product')inventoryUI.edit(id);
  if(action==='new-delivery-product')inventoryUI.addFromDelivery();
  if(action==='new-supplier')inventoryUI.supplierForm();
  if(action==='edit-supplier')inventoryUI.supplierForm(state.suppliers[Number(button.dataset.index)].name);
  if(action==='price')priceModal(id);
  if(action==='supplier-receive')inventoryUI.startDelivery(state.suppliers[Number(button.dataset.index)].name);
  if(action==='visit')visitModal(Number(button.dataset.index));
  if(action==='refund')refundModal(id);
});
main.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;renderGrid();}});
main.addEventListener('keydown',e=>{if(e.target.id==='search'&&e.key==='Enter'){e.preventDefault();scan(e.target.value);}});
let scannerBuffer='',lastKey=0;
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select')||modal.open||e.ctrlKey||e.metaKey||e.altKey)return;
  const now=Date.now();if(now-lastKey>120)scannerBuffer='';lastKey=now;
  if(e.key==='Enter'&&scannerBuffer.length>=6){e.preventDefault();scan(scannerBuffer);scannerBuffer='';}
  else if(e.key.length===1&&/\d/.test(e.key)){scannerBuffer+=e.key;}
});
$('#help').onclick=helpModal;
$('.brand').onclick=e=>{e.preventDefault();view='vender';render();window.scrollTo(0,0);};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){rollover();if(!modal.open)render();}});
window.addEventListener('storage',e=>{if(e.key===KEY){showModal('La demo cambió en otra ventana','Para evitar operaciones con datos anteriores, vuelve a cargar esta pantalla.',`<button class="primary full" id="reload">Volver a cargar</button>`);$('#reload').onclick=()=>location.reload();}});
initEffects();
load();
$('#date-label').textContent = new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
render();
if('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('./sw.js').catch(()=>toast('No se pudo preparar la copia sin conexión. Mantén el servidor abierto.'));
