import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, sell, refund, receiveStock, receiveDelivery, editProduct, editSupplier, migrateState, expectedCash, trimWeek, dateKey } from '../public/domain.js';
const now = new Date('2026-11-19T12:00:00');
test('una venta descuenta existencias y suma solo el importe vendido a caja',()=>{
  const s=initialState();const r=sell(s,[{id:'cola',qty:2}],10000,now,'venta-1');
  assert.equal(r.change,5600);assert.equal(expectedCash(r.state),4400);assert.equal(r.state.products[0].stock,22);assert.equal(s.products[0].stock,24);
});
test('no se permite cobrar con dinero insuficiente ni vender más de lo disponible',()=>{
  const s=initialState();assert.throws(()=>sell(s,[{id:'cola',qty:1}],2000,now));assert.throws(()=>sell(s,[{id:'cola',qty:25}],100000,now));assert.equal(s.sales.length,0);
});
test('el cobro por peso redondea a centavos',()=>{
  const r=sell(initialState(),[{id:'eggkg',qty:0.555}],5000,now);assert.equal(r.sale.amount,2331);assert.equal(r.state.products.find(p=>p.id==='eggkg').stock,7.445);
});
test('no permite una fracción de un producto vendido por pieza',()=>assert.throws(()=>sell(initialState(),[{id:'cig',qty:0.5}],10000,now)));
test('recibir cajetillas suma cigarros; el pago al proveedor se descuenta una sola vez',()=>{
  const s=initialState();s.cashBase=50000;const r=receiveStock(s,{productId:'cig',count:3,packs:true,cost:20000,fromCash:true},now);
  assert.equal(r.products.find(p=>p.id==='cig').stock,100);assert.equal(expectedCash(r),30000);assert.equal(r.purchases.length,1);assert.equal(r.movements.length,1);
});
test('una recepción sin pago desde caja no cambia el efectivo',()=>{
  const r=receiveStock(initialState(),{productId:'cola',count:1,packs:true,cost:30000,fromCash:false},now);assert.equal(expectedCash(r),0);assert.equal(r.products[0].stock,48);
});
test('devolver revierte inventario y caja, y no permite repetir la devolución',()=>{
  const sold=sell(initialState(),[{id:'cig',qty:2}],2000,now,'cig-1').state;const r=refund(sold,'cig-1',now);assert.equal(r.products.find(p=>p.id==='cig').stock,40);assert.equal(expectedCash(r),0);assert.throws(()=>refund(r,'cig-1',now));
});
test('cambio de semana elimina ventas previas y conserva inventario y caja',()=>{
  const s=sell(initialState(),[{id:'cola',qty:1}],2200,now).state;const next=trimWeek(s,new Date('2026-11-23T12:00:00'));
  assert.equal(next.sales.length,0);assert.equal(next.products[0].stock,23);assert.equal(expectedCash(next),2200);
});
test('agrupa líneas repetidas para no exceder existencias',()=>assert.throws(()=>sell(initialState(),[{id:'cola',qty:20},{id:'cola',qty:10}],100000,now)));
test('una misma confirmación no puede cobrarse dos veces',()=>{
  const r=sell(initialState(),[{id:'cola',qty:1}],2200,now,'same').state;assert.throws(()=>sell(r,[{id:'cola',qty:1}],2200,now,'same'));
});
test('no recibe mercancía pagada desde caja si no hay efectivo suficiente',()=>assert.throws(()=>receiveStock(initialState(),{productId:'cig',count:1,packs:true,cost:10000,fromCash:true},now)));
test('la fecha local no depende de la conversión UTC',()=>assert.equal(dateKey(now),'2026-11-19'));

test('una entrega mezcla tamaños, cajas y piezas y cobra el total una sola vez',()=>{
  const s=initialState();s.cashBase=100000;
  const next=receiveDelivery(s,{supplier:'Coca-Cola',items:[{productId:'cola300',boxes:3,pieces:2},{productId:'cola',boxes:1,pieces:5},{productId:'cola3l',pieces:3}],cost:50000,fromCash:true},now,'entrega-1');
  assert.equal(next.products.find(p=>p.id==='cola300').stock,98);
  assert.equal(next.products.find(p=>p.id==='cola').stock,53);
  assert.equal(next.products.find(p=>p.id==='cola3l').stock,11);
  assert.equal(expectedCash(next),50000);assert.equal(next.movements.length,1);assert.equal(next.purchases.length,1);assert.equal(next.purchases[0].lines.length,3);
  assert.throws(()=>receiveDelivery(next,{supplier:'Coca-Cola',items:[{productId:'cola',pieces:1}],cost:0},now,'entrega-1'));
});
test('si un renglón de entrega es incorrecto no cambia ningún producto ni la caja',()=>{
  const s=initialState(),before=structuredClone(s);
  assert.throws(()=>receiveDelivery(s,{supplier:'Coca-Cola',items:[{productId:'cola',boxes:2},{productId:'cola300',pieces:1.5}],cost:20000},now));
  assert.deepEqual(s,before);
  assert.throws(()=>receiveDelivery(s,{supplier:'Coca-Cola',items:[{productId:'ham',kilos:1}],cost:10000},now));
});
test('entrega de queso y jamón conserva los kilos decimales y no modifica caja al no registrar pago',()=>{
  const s=initialState();
  const next=receiveDelivery(s,{supplier:'Proveedor por confirmar',items:[{productId:'ham',kilos:2.375},{productId:'cheese',kilos:1.5},{productId:'milk',boxes:1,pieces:3}],cost:65000,payment:'unrecorded'},now);
  assert.equal(next.products.find(p=>p.id==='ham').stock,7.375);assert.equal(next.products.find(p=>p.id==='cheese').stock,5.5);assert.equal(next.products.find(p=>p.id==='milk').stock,27);assert.equal(expectedCash(next),0);
});
test('250 gramos de jamón se cobran como 0.250 kg',()=>{
  const next=sell(initialState(),[{id:'ham',qty:0.250}],5000,now);
  assert.equal(next.sale.amount,3500);assert.equal(next.change,1500);assert.equal(next.state.products.find(p=>p.id==='ham').stock,4.75);
});
test('editar un producto actualiza presentación, proveedor, código y piezas por caja',()=>{
  const s=initialState(),old=s.products[0];
  const next=editProduct(s,old.id,{...old,name:'Refresco',detail:'600 ml retornable',supplier:'Abarrotes',code:'nuevo600',pack:12});
  const p=next.products.find(p=>p.id===old.id);
  assert.equal(p.name,'Refresco');assert.equal(p.supplier,'Abarrotes');assert.equal(p.pack,12);assert.equal(p.code,'nuevo600');assert.equal(p.stock,24);assert.equal(s.products[0].name,'Coca-Cola');
});
test('no acepta códigos repetidos ni cambio de unidad con inventario o ventas',()=>{
  const s=initialState(),p=s.products[0];
  assert.throws(()=>editProduct(s,p.id,{...p,code:s.products[1].code}));
  assert.throws(()=>editProduct(s,p.id,{...p,unit:'kg',pack:1}));
  const sold=sell(s,[{id:p.id,qty:24}],100000,now).state;
  assert.throws(()=>editProduct(sold,p.id,{...sold.products[0],unit:'kg',pack:1}));
});
test('una presentación nueva aparece vinculada a su proveedor, con existencia cero',()=>{
  const s=initialState(),template=s.products[0];
  const next=editProduct(s,'',{...template,name:'Refresco',detail:'2 litros',stock:0,code:'nuevo2l',pack:8});
  const p=next.products.at(-1);assert.notEqual(p.id,template.id);assert.equal(p.supplier,'Coca-Cola');assert.equal(p.stock,0);
  const received=receiveDelivery(next,{supplier:'Coca-Cola',items:[{productId:p.id,boxes:2,pieces:1}],cost:0},now);
  assert.equal(received.products.at(-1).stock,17);
});
test('la actualización del catálogo conserva precios, existencias y ventas previas y no duplica productos',()=>{
  const s=initialState();delete s.catalogRevision;
  s.products=s.products.slice(0,9);s.products[0].stock=7;s.products[0].price=2300;s.suppliers=s.suppliers.slice(0,4);
  const next=migrateState(s);assert.equal(next.products[0].stock,7);assert.equal(next.products[0].price,2300);assert.ok(next.products.some(p=>p.id==='ham'));assert.equal(next.suppliers.length,5);
  assert.deepEqual(migrateState(next),next);assert.equal(next.products.length,16);
});
test('el precio y presentación de una venta completada se conservan al editar el catálogo',()=>{
  const sold=sell(initialState(),[{id:'cola',qty:1}],5000,now).state;
  const edited=editProduct(sold,'cola',{...sold.products[0],name:'Refresco nuevo',detail:'600 ml nueva etiqueta',price:2500});
  assert.equal(edited.sales[0].lines[0].name,'Coca-Cola');assert.equal(edited.sales[0].lines[0].detail,'600 ml · botella');assert.equal(edited.sales[0].amount,2200);
});

test('un nuevo proveedor acepta leche sin imponer una categoría ni imagen de proveedor',()=>{
  const s=editSupplier(initialState(),'',{name:'Proveedor nuevo',visit:'Martes',note:'Trae productos variados'});
  const milk=s.products.find(p=>p.id==='milk');
  const linked=editProduct(s,'milk',{...milk,supplier:'Proveedor nuevo'});
  assert.equal(linked.products.find(p=>p.id==='milk').art,'milk');
  const received=receiveDelivery(linked,{supplier:'Proveedor nuevo',items:[{productId:'milk',boxes:1,pieces:2}],cost:0},now);
  assert.equal(received.products.find(p=>p.id==='milk').stock,26);
  assert.equal(received.suppliers.at(-1).visit,'Martes');
});
test('renombrar proveedor conserva la vinculación de productos y entregas',()=>{
  const s=receiveDelivery(initialState(),{supplier:'Coca-Cola',items:[{productId:'cola',pieces:1}],cost:2200},now);
  const changed=editSupplier(s,'Coca-Cola',{name:'Repartidor de bebidas',visit:'Viernes',note:'También entrega leche'});
  assert.ok(changed.products.filter(p=>['cola','cola300'].includes(p.id)).every(p=>p.supplier==='Repartidor de bebidas'));
  assert.equal(changed.purchases[0].supplier,'Repartidor de bebidas');assert.equal(changed.products.find(p=>p.id==='cola').stock,25);
});
test('rechaza proveedores duplicados incluso con diferencias de espacios, mayúsculas y acentos',()=>{
  const s=editSupplier(initialState(),'',{name:'Lala'});
  assert.throws(()=>editSupplier(s,'',{name:'  LÁLA  '}));assert.throws(()=>editSupplier(s,'',{name:'   '}));
});
test('cuatro cartones de huevo por kilo suman el peso real, sin inventar un peso por cartón',()=>{
  const s=initialState();
  const next=receiveDelivery(s,{supplier:'Abarrotes',items:[{productId:'eggkg',containers:4,kilos:12.650}],cost:0},now);
  assert.equal(next.products.find(p=>p.id==='eggkg').stock,20.650);
  assert.equal(next.products.find(p=>p.id==='egg').stock,60);
  assert.equal(next.purchases[0].lines[0].containers,4);assert.equal(next.purchases[0].lines[0].container,'cartón');
});
test('recibir cartones por kilo sin peso se rechaza sin modificar inventario',()=>{
  const s=initialState(),before=structuredClone(s);
  assert.throws(()=>receiveDelivery(s,{supplier:'Abarrotes',items:[{productId:'eggkg',containers:4}],cost:0},now));
  assert.throws(()=>receiveDelivery(s,{supplier:'Abarrotes',items:[{productId:'eggkg',containers:1.5,kilos:3}],cost:0},now));
  assert.deepEqual(s,before);
});
test('cartones de huevo por pieza usan el número de huevos configurado',()=>{
  const s=initialState();const next=receiveDelivery(s,{supplier:'Abarrotes',items:[{productId:'egg',boxes:4}],cost:0},now);
  assert.equal(next.products.find(p=>p.id==='egg').stock,180);assert.equal(next.purchases[0].lines[0].container,'cartón');
});
test('la migración de proveedores preserva las existencias y el historial de compras',()=>{
  const s=initialState();s.catalogRevision=2;
  s.suppliers=s.suppliers.map(p=>p.name==='Proveedor por confirmar'?{...p,name:'Lácteos y carnes frías'}:p);
  s.products=s.products.map(p=>p.supplier==='Proveedor por confirmar'?{...p,supplier:'Lácteos y carnes frías',stock:3}:p);
  s.purchases=[{id:'previa',supplier:'Lácteos y carnes frías',day:'2026-11-19',cost:1000}];
  const next=migrateState(s);
  assert.equal(next.products.find(p=>p.id==='milk').stock,3);assert.equal(next.products.find(p=>p.id==='milk').supplier,'Proveedor por confirmar');assert.equal(next.purchases[0].supplier,'Proveedor por confirmar');assert.equal(next.suppliers.length,5);assert.deepEqual(migrateState(next),next);
});
