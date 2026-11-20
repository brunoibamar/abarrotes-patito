export const CATEGORIES = ['Bebidas','Botanas','Galletas y pan','Sueltos','Lácteos y jamón'];
export const PRODUCT_TYPES = [
  {art:'box',label:'Otro producto',category:'Sueltos',unit:'pieza',color:'blue'},
  {art:'cola',label:'Refresco',category:'Bebidas',unit:'pieza',color:'rose'},
  {art:'water',label:'Agua',category:'Bebidas',unit:'pieza',color:'blue'},
  {art:'milk',label:'Leche',category:'Lácteos y jamón',unit:'pieza',color:'blue'},
  {art:'yogurt',label:'Yogur',category:'Lácteos y jamón',unit:'pieza',color:'rose'},
  {art:'cheese',label:'Queso',category:'Lácteos y jamón',unit:'kg',color:'yellow'},
  {art:'ham',label:'Jamón',category:'Lácteos y jamón',unit:'kg',color:'rose'},
  {art:'egg',label:'Huevo',category:'Sueltos',unit:'pieza',color:'sand'},
  {art:'bread',label:'Pan',category:'Galletas y pan',unit:'pieza',color:'sand'},
  {art:'cookies',label:'Galletas',category:'Galletas y pan',unit:'pieza',color:'lavender'},
  {art:'chips',label:'Papas y botanas',category:'Botanas',unit:'pieza',color:'yellow'},
  {art:'beer',label:'Cerveza',category:'Bebidas',unit:'pieza',color:'sand'},
  {art:'cig',label:'Cigarro suelto',category:'Sueltos',unit:'pieza',color:'blue'}
];
export const CONTAINERS = {ninguno:'Sin envase para contar',caja:'Cajas',paquete:'Paquetes','cartón':'Cartones',cajetilla:'Cajetillas'};
export const money = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n / 100);
export function dateKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function weekStart(d = new Date()) { const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()); start.setDate(start.getDate() - (start.getDay()+6)%7); return dateKey(start); }
export function lineTotal(p, qty) { return Math.round(p.price * qty); }
export function total(cart, products) { return cart.reduce((sum, l) => sum + lineTotal(products.find(p => p.id === l.id), l.qty), 0); }
export function expectedCash(state) { return state.cashBase + state.movements.reduce((sum, m) => sum + m.amount, 0); }
export function trimWeek(state, now = new Date()) {
  const start = weekStart(now);
  return { ...state, sales: state.sales.filter(s => s.day >= start && s.day <= dateKey(now)) };
}
export function sell(state, cart, received, now = new Date(), id = crypto.randomUUID()) {
  if (state.sales.some(s => s.id === id)) throw Error('Esta venta ya se registró.');
  if (!cart.length) throw Error('Agrega un producto a la venta.');
  const counts = new Map();
  for (const l of cart) counts.set(l.id, (counts.get(l.id)||0)+l.qty);
  const lines = [];
  for (const [pid, qty] of counts) {
    const p = state.products.find(p => p.id === pid);
    if (!p || !Number.isFinite(qty) || qty <= 0 || (p.unit === 'pieza' && !Number.isInteger(qty))) throw Error('Revisa la cantidad del producto.');
    if (qty > p.stock + 0.000001) throw Error(`No hay suficiente existencia de ${p.name}.`);
    lines.push({ id: pid, name: p.name, detail:p.detail, qty, unit: p.unit, price: p.price, subtotal: lineTotal(p, qty) });
  }
  const amount = lines.reduce((sum, l) => sum + l.subtotal, 0);
  if (!Number.isInteger(received) || received < amount) throw Error('El dinero recibido no alcanza para pagar.');
  const sale = { id, day: dateKey(now), time: now.toISOString(), lines, amount, refunded: false };
  return {
    state: { ...state,
      products: state.products.map(p => ({ ...p, stock: Math.round((p.stock-(counts.get(p.id)||0))*1000)/1000 })),
      sales: [...state.sales, sale], movements: [...state.movements, { amount, reason: 'Venta', time: now.toISOString() }] },
    change: received - amount, sale
  };
}
export function refund(state, id, now = new Date()) {
  const sale = state.sales.find(s => s.id === id);
  if (!sale || sale.refunded) throw Error('Esta venta no se puede devolver otra vez.');
  if (expectedCash(state) < sale.amount) throw Error('No hay suficiente efectivo registrado para devolver esta venta.');
  return { ...state, sales: state.sales.map(s => s.id === id ? { ...s, refunded: true } : s),
    products: state.products.map(p => ({ ...p, stock: Math.round((p.stock+(sale.lines.find(l=>l.id===p.id)?.qty||0))*1000)/1000 })),
    movements: [...state.movements, { amount: -sale.amount, reason: 'Devolución', time: now.toISOString() }] };
}
export function deliveryLines(state, supplier, items) {
  if (!state.suppliers.some(s => s.name === supplier)) throw Error('Elige un proveedor registrado.');
  const seen = new Set();
  const lines = items.map(item => {
    const p = state.products.find(p => p.id === item.productId);
    if (!p || p.supplier !== supplier || seen.has(p.id)) throw Error('Revisa los productos de este proveedor.');
    seen.add(p.id);
    const boxes = item.boxes ?? 0, pieces = item.pieces ?? 0, kilos = item.kilos ?? 0, containers = item.containers ?? 0;
    if (![boxes,pieces,kilos,containers].every(n => Number.isFinite(n) && n >= 0)) throw Error('Las cantidades deben ser cero o mayores.');
    if (!Number.isSafeInteger(boxes) || !Number.isSafeInteger(pieces) || !Number.isSafeInteger(containers)) throw Error('Las cajas, cartones y piezas deben ser números enteros.');
    if (p.unit === 'kg' && (boxes || pieces)) throw Error('Este producto se recibe por kilo.');
    if (p.unit === 'pieza' && kilos) throw Error('Este producto se recibe por pieza o caja.');
    if (containers && (p.unit !== 'kg' || !p.container || p.container === 'ninguno')) throw Error('Revisa el envase de este producto.');
    if (containers && kilos <= 0) throw Error('Escribe el peso total de los cartones o paquetes. El inventario por kilo necesita el peso real.');
    if (boxes && (!Number.isSafeInteger(p.pack) || p.pack < 2)) throw Error('Configura cuántas piezas contiene la caja.');
    const qty = p.unit === 'kg' ? Math.round(kilos * 1000) / 1000 : boxes * p.pack + pieces;
    if (!Number.isFinite(qty) || qty > 1000000) throw Error('Revisa la cantidad: es demasiado grande.');
    return { productId:p.id, name:p.name, detail:p.detail, unit:p.unit, boxes, pieces, kilos, containers, container:p.container || 'caja', pack:p.pack, qty };
  }).filter(l => l.qty > 0);
  if (!lines.length) throw Error('Indica al menos un producto que haya llegado.');
  return lines;
}
export function receiveDelivery(state, { supplier, items, cost = 0, fromCash = false, payment = fromCash ? 'cash' : 'other' }, now = new Date(), id = crypto.randomUUID()) {
  if (state.purchases.some(p => p.id === id)) throw Error('Esta entrega ya se guardó.');
  const lines = deliveryLines(state, supplier, items);
  if (!Number.isSafeInteger(cost) || cost < 0) throw Error('Revisa el costo total de la entrega.');
  if (!['cash','other','unrecorded'].includes(payment) || fromCash !== (payment === 'cash')) throw Error('Revisa cómo se pagó esta entrega.');
  if (fromCash && cost > expectedCash(state)) throw Error('No alcanza el efectivo registrado en caja. Revisa el pago o registra el dinero que agregaste.');
  const quantities = new Map(lines.map(l => [l.productId,l.qty]));
  return { ...state,
    products: state.products.map(p => ({ ...p, stock: Math.round((p.stock + (quantities.get(p.id)||0))*1000)/1000 })),
    purchases: [...state.purchases.filter(x => x.day >= weekStart(now) || x.supplier !== supplier), { id, supplier, lines, cost, fromCash, payment, day:dateKey(now) }],
    movements: fromCash && cost ? [...state.movements, { amount:-cost, reason:`Pago a ${supplier}`, time:now.toISOString() }] : state.movements
  };
}
export function receiveStock(state, { productId, count, packs = false, cost = 0, fromCash = false }, now = new Date()) {
  const p = state.products.find(p => p.id === productId);
  if (!p || !Number.isFinite(count) || count <= 0) throw Error('Revisa la cantidad recibida.');
  return receiveDelivery(state, { supplier:p.supplier, items:[{productId, ...(p.unit==='kg'?{kilos:count}:packs?{boxes:count}:{pieces:count})}],cost,fromCash }, now);
}
export function editProduct(state, id, changes) {
  const old = state.products.find(p => p.id === id);
  if (id && !old) throw Error('No encontramos este producto.');
  const name = String(changes.name || '').trim(), detail = String(changes.detail || '').trim(), code = String(changes.code || '').trim();
  if (!name || !detail) throw Error('Escribe el nombre y el tamaño o presentación.');
  if (!CATEGORIES.includes(changes.category)) throw Error('Elige una categoría.');
  if (!state.suppliers.some(s => s.name === changes.supplier)) throw Error('Elige el proveedor que entrega este producto.');
  if (!['pieza','kg'].includes(changes.unit)) throw Error('Elige venta por pieza o por kilo.');
  if (!Number.isSafeInteger(changes.price) || changes.price <= 0) throw Error('El precio debe ser mayor a cero.');
  if (!Number.isFinite(changes.stock) || changes.stock < 0 || (changes.unit === 'pieza' && !Number.isSafeInteger(changes.stock))) throw Error('Revisa las existencias: las piezas deben ser enteras y no se admiten valores negativos.');
  if (!Number.isSafeInteger(changes.pack) || changes.pack < 1 || (changes.unit === 'kg' && changes.pack !== 1)) throw Error('Escribe cuántas piezas contiene la caja o cajetilla.');
  if (changes.container && !Object.hasOwn(CONTAINERS,changes.container)) throw Error('Elige cómo te entregan este producto.');
  if (changes.art && !PRODUCT_TYPES.some(type=>type.art===changes.art)) throw Error('Elige un dibujo de producto.');
  if (code && state.products.some(p => p.id !== id && p.code === code)) throw Error('Ese código de barras ya pertenece a otro producto.');
  if (state.products.some(p=>p.id!==id&&p.supplier===changes.supplier&&p.name.toLowerCase()===name.toLowerCase()&&p.detail.toLowerCase()===detail.toLowerCase())) throw Error('Ya existe ese producto y presentación para este proveedor.');
  if (old && old.unit !== changes.unit && (old.stock > 0 || state.sales.some(s=>s.lines.some(l=>l.id===id)))) throw Error('Este producto ya tiene existencias o ventas. Registra otro producto para venderlo con una unidad distinta.');
  const product = { ...(old||{art:'box',color:'blue'}), ...changes, id:old?.id || crypto.randomUUID(), name, detail, code, stock:Math.round(changes.stock*1000)/1000 };
  return { ...state, products:old?state.products.map(p=>p.id===id?product:p):[...state.products,product] };
}
export function editSupplier(state, originalName, changes) {
  const old = originalName ? state.suppliers.find(s=>s.name===originalName) : null;
  if(originalName && !old) throw Error('No encontramos este proveedor.');
  const name=String(changes.name||'').trim(),visit=String(changes.visit||'').trim()||'Por confirmar',note=String(changes.note||'').trim();
  if(!name || name.length>60) throw Error('Escribe el nombre del proveedor, de hasta 60 letras.');
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ').trim();
  if(state.suppliers.some(s=>s.name!==originalName&&normalize(s.name)===normalize(name))) throw Error('Ya existe un proveedor con ese nombre. Abre su tarjeta.');
  const supplier={...old,name,visit,note,initials:name.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(),color:old?.color||'green'};
  return {...state,
    suppliers:old?state.suppliers.map(s=>s.name===originalName?supplier:s):[...state.suppliers,supplier],
    products:old?state.products.map(p=>p.supplier===originalName?{...p,supplier:name}:p):state.products,
    purchases:old?state.purchases.map(p=>p.supplier===originalName?{...p,supplier:name}:p):state.purchases
  };
}
export function migrateState(state) {
  if ((state.catalogRevision||1) >= 3) return state;
  let next=state;
  if ((state.catalogRevision||1)<2) {
    const defaults = initialState();
    next={...state,products:[...state.products,...defaults.products.filter(p=>!state.products.some(old=>old.id===p.id))],suppliers:[...state.suppliers,...defaults.suppliers.filter(s=>!state.suppliers.some(old=>old.name===s.name||(s.name==='Proveedor por confirmar'&&old.name==='Lácteos y carnes frías')))]};
  }
  const placeholder=next.suppliers.find(s=>s.name==='Lácteos y carnes frías');
  if(placeholder&&!next.suppliers.some(s=>s.name==='Proveedor por confirmar')) next=editSupplier(next,placeholder.name,{...placeholder,name:'Proveedor por confirmar'});
  return {...next,catalogRevision:3,products:next.products.map(p=>({...p,container:p.container||(p.art==='egg'?'cartón':p.art==='cig'?'cajetilla':p.unit==='kg'?'ninguno':'caja')}))};
}
export function initialState() {
  return migrateState({ version: 1, catalogRevision:2, cashBase: 0, movements: [], sales: [], purchases: [], closures: [],
    suppliers: [ { name: 'Coca-Cola', initials: 'CC', color: 'red', visit: 'Martes y viernes', note: 'Refrescos y agua' }, { name: 'Bimbo', initials: 'B', color: 'blue', visit: 'Lunes, miércoles y sábado', note: 'Pan y galletas' }, { name: 'Sabritas', initials: 'S', color: 'yellow', visit: 'Jueves', note: 'Papas y botanas' }, { name: 'Abarrotes', initials: 'A', color: 'green', visit: 'Por confirmar', note: 'Huevo y otros productos' }, { name:'Lácteos y carnes frías', initials:'L', color:'blue', visit:'Por confirmar', note:'Leche, yogur, queso y jamón' } ],
    products: [
      { id:'cola', name:'Coca-Cola', detail:'600 ml · botella', category:'Bebidas', price:2200, stock:24, unit:'pieza', art:'cola', color:'rose', supplier:'Coca-Cola', code:'750100000001', pack:24 },
      { id:'chips', name:'Papas clásicas', detail:'45 g · bolsa', category:'Botanas', price:1800, stock:18, unit:'pieza', art:'chips', color:'yellow', supplier:'Sabritas', code:'750100000002', pack:10 },
      { id:'beer', name:'Cerveza', detail:'355 ml · botella', category:'Bebidas', price:2500, stock:30, unit:'pieza', art:'beer', color:'sand', supplier:'Abarrotes', code:'750100000003', pack:24 },
      { id:'cookies', name:'Galletas de chocolate', detail:'Paquete individual', category:'Galletas y pan', price:1700, stock:12, unit:'pieza', art:'cookies', color:'lavender', supplier:'Bimbo', code:'750100000004', pack:12 },
      { id:'egg', name:'Huevo por pieza', detail:'1 huevo', category:'Sueltos', price:400, stock:60, unit:'pieza', art:'egg', color:'sand', supplier:'Abarrotes', code:'', pack:30 },
      { id:'cig', name:'Cigarro suelto', detail:'Marca de ejemplo · 1 cigarro', category:'Sueltos', price:800, stock:40, unit:'pieza', art:'cig', color:'blue', supplier:'Abarrotes', code:'', pack:20 },
      { id:'water', name:'Agua natural', detail:'1 litro · botella', category:'Bebidas', price:1500, stock:16, unit:'pieza', art:'water', color:'blue', supplier:'Coca-Cola', code:'750100000007', pack:12 },
      { id:'bread', name:'Pan dulce', detail:'1 pieza', category:'Galletas y pan', price:1600, stock:8, unit:'pieza', art:'bread', color:'rose', supplier:'Bimbo', code:'', pack:6 },
      { id:'eggkg', name:'Huevo por kilo', detail:'Escribir peso de la báscula', category:'Sueltos', price:4200, stock:8, unit:'kg', art:'egg', color:'sand', supplier:'Abarrotes', code:'', pack:1 },
      { id:'cola300', name:'Coca-Cola', detail:'300 ml · botella', category:'Bebidas', price:1300, stock:24, unit:'pieza', art:'cola', color:'rose', supplier:'Coca-Cola', code:'750100000010', pack:24 },
      { id:'cola1l', name:'Coca-Cola', detail:'1 litro · botella', category:'Bebidas', price:2800, stock:12, unit:'pieza', art:'cola', color:'rose', supplier:'Coca-Cola', code:'750100000011', pack:12 },
      { id:'cola3l', name:'Coca-Cola', detail:'3 litros · botella', category:'Bebidas', price:5500, stock:8, unit:'pieza', art:'cola', color:'rose', supplier:'Coca-Cola', code:'750100000012', pack:6 },
      { id:'milk', name:'Leche entera', detail:'1 litro · cartón', category:'Lácteos y jamón', price:2900, stock:12, unit:'pieza', art:'milk', color:'blue', supplier:'Lácteos y carnes frías', code:'750100000013', pack:12 },
      { id:'yogurt', name:'Yogur de fresa', detail:'125 g · vasito', category:'Lácteos y jamón', price:1200, stock:12, unit:'pieza', art:'yogurt', color:'rose', supplier:'Lácteos y carnes frías', code:'750100000014', pack:12 },
      { id:'cheese', name:'Queso fresco', detail:'A granel · por kilo', category:'Lácteos y jamón', price:12000, stock:4, unit:'kg', art:'cheese', color:'yellow', supplier:'Lácteos y carnes frías', code:'', pack:1 },
      { id:'ham', name:'Jamón', detail:'Rebanado · por kilo', category:'Lácteos y jamón', price:14000, stock:5, unit:'kg', art:'ham', color:'rose', supplier:'Lácteos y carnes frías', code:'', pack:1 }
    ] });
}
