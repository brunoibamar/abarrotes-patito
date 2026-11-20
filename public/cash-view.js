import { money, dateKey, weekStart, expectedCash } from './domain.js';

export function cashView(state, { esc, icon, sectionHead }) {
  const sales = state.sales.filter(s=>!s.refunded);
  const today = sales.filter(s=>s.day===dateKey());
  const todayTotal = today.reduce((sum,s)=>sum+s.amount,0);
  const weekTotal = sales.reduce((sum,s)=>sum+s.amount,0);
  const monday = new Date(weekStart()+'T12:00:00');
  const last = state.closures.at(-1);

  const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((label,i)=>{
    const d=new Date(monday);d.setDate(d.getDate()+i);
    const day=dateKey(d),current=day===dateKey(),future=day>dateKey();
    const amount=sales.filter(s=>s.day===day).reduce((sum,s)=>sum+s.amount,0);
    return `<div class="day-card ${current?'today':''}"><span>${label} ${d.getDate()}</span><strong>${future?'—':money(amount)}</strong>${current?'<small>HOY</small>':''}</div>`;
  }).join('');

  const movements=state.movements.length ? [...state.movements].reverse().map(m=>
    `<div class="movement"><span>${esc(m.reason)}<small class="muted" style="display:block;margin-top:5px">${new Date(m.time).toLocaleString('es-MX',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></span><strong>${m.amount<0?'−':'+'}${money(Math.abs(m.amount))}</strong></div>`
  ).join('') : '<p class="empty-row">Aún no hay movimientos.<br>Agrega el dinero inicial para comenzar.</p>';

  const corrections=state.sales.length ? [...state.sales].reverse().map(s=>
    `<tr><td>${esc(s.day)}<small>${new Date(s.time).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</small></td><td>${s.lines.map(l=>`${esc(l.name)}${l.detail?`<small>${esc(l.detail)}</small>`:''} × ${l.qty}`).join('<br>')}</td><td>${money(s.amount)}</td><td>${s.refunded?'Devuelta':`<button class="table-action" data-action="refund" data-id="${s.id}">Devolver compra</button>`}</td></tr>`
  ).join('') : '<tr><td colspan="4" class="empty-row">Todavía no hay ventas. Haz una compra de prueba en “Vender”.</td></tr>';

  return sectionHead('TODO EN UN SOLO LUGAR','Caja','Lo vendido hoy, tu semana y el dinero del cajón.',`<button class="primary" data-action="close-day">${icon('check')} Cerrar caja</button>`)+`
    <div class="summary-grid">
      <div class="panel stat feature"><label>Efectivo esperado en caja</label><strong>${money(expectedCash(state))}</strong><small>Incluye dinero para cambio, pagos y retiros</small></div>
      <div class="panel stat"><label>Vendido hoy</label><strong>${money(todayTotal)}</strong><small>${today.length} ${today.length===1?'venta completada':'ventas completadas'}</small></div>
      <div class="panel stat"><label>Vendido en la semana</label><strong>${money(weekTotal)}</strong><small>Total de ventas, no ganancia</small></div>
    </div>
    <section class="panel cash-week" aria-label="Ventas de esta semana"><h2>Ventas de esta semana</h2><p class="cash-week-subtitle">De lunes a domingo, un día a la vez.</p><div class="week-grid">${days}</div><p class="cash-retention">Al comenzar el lunes se eliminan las ventas de la semana anterior. El inventario y el efectivo se conservan.</p></section>
    <div class="two-column">
      <section class="panel"><h2>Movimientos de caja</h2>${movements}</section>
      <section class="panel"><h2>Dinero para cambio y otros gastos</h2><p class="muted">Anota el dinero que pones para dar cambio y los gastos que pagas desde el cajón.</p><div class="stack"><button class="secondary full" data-action="cash-in">${icon('plus')} Poner dinero para dar cambio</button><button class="secondary full" data-action="cash-out">${icon('down')} Pagar otro gasto</button></div><div class="notice">¿Vas a pagar mercancía? Hazlo en Proveedores al registrar lo que llegó. El pago se descuenta de caja una sola vez.</div><h2>Último cierre</h2>${last?`<p class="muted">${esc(last.day)} · Contado: ${money(last.counted)}<br>Diferencia: ${money(last.difference)}</p>`:'<p class="muted">Todavía no se ha cerrado la caja.</p>'}<p class="cash-base">Dinero al último inicio o cierre: <strong>${money(state.cashBase)}</strong></p></section>
    </div>
    <details class="panel cash-corrections"><summary>Corregir una venta de esta semana</summary><div class="cash-corrections-body"><p class="muted">Puedes devolver una compra completa y regresar todos sus productos al inventario.</p><div class="table-wrap"><table><thead><tr><th>Día y hora</th><th>Compra</th><th>Importe</th><th>Acción</th></tr></thead><tbody>${corrections}</tbody></table></div></div></details>`;
}
