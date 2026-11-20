import { CATEGORIES, PRODUCT_TYPES, CONTAINERS, money, deliveryLines, receiveDelivery, editProduct, editSupplier } from './domain.js';

export function createInventoryUI({ main, modal, getState, getCart, commit, render, showModal, toast, esc, icon, art, sectionHead, onDelivery, onSuppliers }) {
  const $ = (selector, root = main) => root.querySelector(selector);
  const drafts = new Map();
  let activeSupplier = '';
  const nameOf = p => `${p.name} · ${p.detail}`;
  const sizeOf = p => { const match=p.detail.match(/^(\d+(?:\.\d+)?)\s*(ml|litro)/i); return match?Number(match[1])*(match[2].toLowerCase()==='ml'?1:1000):0; };
  const error = message => { $('#form-error', modal).textContent = message; };
  const parseMoney = value => /^\d+(\.\d{0,2})?$/.test(String(value).replace(',','.').trim()) ? Math.round(Number(String(value).replace(',','.'))*100) : NaN;

  function products() {
    const state = getState();
    main.innerHTML = sectionHead('CATÁLOGO DE LA TIENDA','Mis productos','Aquí cambias los datos y precios de cada presentación.') +
      `<div class="notice">${icon('truck')} ¿Llegó mercancía? Regístrala en <button class="inline-link" data-view="proveedores">Proveedores</button>. Aquí solo editas el catálogo y consultas existencias.</div>
      <section class="panel"><div class="table-wrap"><table><thead><tr><th>Producto y tamaño</th><th>Precio de venta</th><th>Existencias</th><th>Acciones</th></tr></thead><tbody>${state.products.map(p => `<tr><td><strong>${esc(p.name)}</strong><small>${esc(p.detail)} · ${esc(p.supplier)}</small></td><td>${money(p.price)} / ${p.unit}</td><td><span class="stock-num">${p.stock.toLocaleString('es-MX')}</span> ${p.unit==='kg'?'kg':'piezas'}</td><td><div class="table-buttons"><button class="table-action" data-action="edit-product" data-id="${p.id}" aria-label="Editar ${esc(nameOf(p))}">Editar</button><button class="table-action" data-action="price" data-id="${p.id}" aria-label="Precio de ${esc(nameOf(p))}">Precio</button></div></td></tr>`).join('')}</tbody></table></div></section>
      <div class="notice warning">${icon('info')} El huevo por pieza y por kilo conserva existencias separadas en esta demostración. La conversión se acordará con la tienda.</div>`;
  }

  function edit(id='', context={}) {
    const state = getState();
    const old = state.products.find(p=>p.id===id);
    if (old && getCart().some(l=>l.id===id)) { toast('Termina o cancela la compra actual antes de editar este producto.'); return; }
    const p = old || {name:'',detail:'',category:'Sueltos',supplier:context.supplier||state.suppliers[0].name,unit:'pieza',pack:1,container:'caja',code:'',price:0,stock:0,art:'box',color:'blue'};
    showModal(old?'Editar producto':'Producto no registrado',context.supplier?`Lo entrega ${esc(context.supplier)}. Guárdalo y después cuenta cuántos llegaron.`:'Cada tamaño se registra por separado: 225 ml, 300 ml, 600 ml…',`
      <form id="product-form">
        <div class="product-kind"><div class="product-kind-preview" id="kind-preview">${art(p.art)}</div><label class="field"><span>¿Qué producto es?</span><select name="art">${PRODUCT_TYPES.map(t=>`<option value="${t.art}" ${p.art===t.art?'selected':''}>${esc(t.label)}</option>`).join('')}</select></label></div>
        <label class="field"><span>Nombre del producto</span><input name="name" maxlength="60" value="${esc(p.name)}" placeholder="Ejemplo: Coca-Cola" required></label>
        <label class="field"><span>Tamaño o presentación</span><input name="detail" maxlength="80" value="${esc(p.detail)}" placeholder="Ejemplo: 600 ml · botella" required></label>
        <div class="form-pair" ${context.supplier?'hidden':''}><label class="field"><span>Categoría</span><select name="category">${CATEGORIES.map(c=>`<option ${p.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
        ${context.supplier?`<label class="field"><span>Lo entrega</span><input name="supplier" value="${esc(context.supplier)}" readonly></label>`:`<label class="field"><span>Lo entrega</span><select name="supplier">${state.suppliers.map(s=>`<option ${p.supplier===s.name?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`}</div>
        <label class="field"><span>Se vende por</span><select name="unit"><option value="pieza" ${p.unit==='pieza'?'selected':''}>Pieza</option><option value="kg" ${p.unit==='kg'?'selected':''}>Kilo · usar báscula</option></select></label>
        <label class="field"><span>¿Cómo te lo entregan?</span><select name="container">${Object.entries(CONTAINERS).map(([value,label])=>`<option value="${value}" ${(p.container||'caja')===value?'selected':''}>${label}</option>`).join('')}</select><small class="field-help" id="container-help"></small></label>
        <label class="field" id="pack-field"><span>Piezas dentro de cada caja, paquete o cajetilla</span><input name="pack" type="number" min="1" step="1" value="${p.pack}" inputmode="numeric" required><small class="field-help">Escribe 1 si no lo compras en cajas. Este dato permite contar las entregas.</small></label>
        <label class="field"><span>Código de barras (opcional)</span><input name="code" maxlength="40" value="${esc(p.code)}" placeholder="Escanea o escribe el código" autocomplete="off"></label>
        <label class="field"><span>Precio de venta, en pesos</span><input name="price" inputmode="decimal" value="${p.price?(p.price/100).toFixed(2):''}" placeholder="0.00" required><small id="price-unit" class="field-help"></small></label>
        ${old?`<details class="advanced-edit"><summary>Corregir existencias contadas</summary><p>Solo úsalo si contaste el producto y el número del sistema es incorrecto. Las entregas se registran en Proveedores.</p><label class="field"><span>Existencia real en tienda</span><input name="stock" type="number" min="0" step="${p.unit==='kg'?'0.001':'1'}" inputmode="decimal" value="${p.stock}" required></label></details>`:'<p class="muted">Después de crearlo aparecerá aquí mismo para que anotes la cantidad recibida.</p>'}
        <div id="form-error" class="form-error" role="alert"></div>
        <button class="primary full" type="submit">${old?'Guardar cambios':'Guardar y contar lo que llegó'}</button>
      </form>`);
    const form=$('#product-form',modal),unit=$('[name=unit]',form),pack=$('[name=pack]',form),container=$('[name=container]',form),kind=$('[name=art]',form);
    function updateUnit() {
      const kg=unit.value==='kg',noPack=container.value==='ninguno'; $('#pack-field',form).hidden=kg||noPack;
      pack.disabled=kg||noPack; $('#price-unit',form).textContent=kg?'Precio de un kilo completo. Al vender se calcula el peso indicado.':'Precio de una sola pieza.';
      $('#container-help',form).textContent=kg&&container.value!=='ninguno'?'Podrás contar los cartones o paquetes y escribir su peso total real. El sistema no supone cuánto pesa cada uno.':kg?'Al recibir se anotará el peso real en kilos.':'El contenido del envase se suma como piezas al inventario.';
      const stock=$('[name=stock]',form);if(stock)stock.step=kg?'0.001':'1';
    }
    unit.onchange=updateUnit;container.onchange=updateUnit;updateUnit();
    kind.onchange=()=>{
      const type=PRODUCT_TYPES.find(t=>t.art===kind.value);$('#kind-preview',form).innerHTML=art(type.art);
      if(!old){$('[name=category]',form).value=type.category;unit.value=type.unit;container.value=type.art==='egg'?'cartón':type.art==='cig'?'cajetilla':type.unit==='kg'?'ninguno':'caja';updateUnit();}
    };
    $('[name=code]',form).onkeydown=event=>{if(event.key==='Enter')event.preventDefault();};
    form.onsubmit=event=>{
      event.preventDefault();const data=new FormData(form);
      try {
        if(old && getCart().some(l=>l.id===id)) throw Error('Termina o cancela la compra actual antes de editar.');
        const next=editProduct(getState(),id,{
          name:data.get('name'),detail:data.get('detail'),category:data.get('category'),supplier:data.get('supplier'),unit:data.get('unit'),
          pack:data.get('unit')==='kg'||data.get('container')==='ninguno'?1:Number(data.get('pack')),container:data.get('container'),code:data.get('code'),price:parseMoney(data.get('price')),
          stock:old?Number(data.get('stock')):0,
          art:data.get('art'),color:PRODUCT_TYPES.find(t=>t.art===data.get('art')).color
        });
        if(commit(next)){
          modal.close();render();
          if(!old&&context.supplier){const created=next.products.at(-1);$(`#delivery-${created.id}`)?.querySelector('input')?.focus();}
          toast(old?'Cambios guardados. También se actualizaron en Proveedores.':'Producto creado. Ahora cuenta cuántos llegaron.');
        }
      } catch(e){error(e.message);}
    };
  }

  function suppliers() {
    const state=getState();
    main.innerHTML=sectionHead('CUANDO LLEGA MERCANCÍA','Mis proveedores','Elige quién llegó. Después cuenta cada producto y tamaño.',`<button class="primary" data-action="new-supplier">${icon('plus')} Nuevo proveedor</button>`)+
      `<div class="supplier-grid">${state.suppliers.map((s,i)=>{
        const products=state.products.filter(p=>p.supplier===s.name),last=state.purchases.filter(p=>p.supplier===s.name).at(-1);
        return `<article class="panel"><div class="supplier-top"><div class="supplier-logo ${s.color}">${esc(s.initials)}</div><div><h2>${esc(s.name)}</h2><p>${esc(s.note)}</p></div><button class="supplier-edit" data-action="edit-supplier" data-index="${i}" aria-label="Editar proveedor ${esc(s.name)}">Editar</button></div>
        <div class="supplier-product-pictures" aria-label="Tipos de productos que entrega">${[...new Set(products.map(p=>p.art))].slice(0,6).map(type=>`<div title="${esc(PRODUCT_TYPES.find(t=>t.art===type)?.label||'Producto')}">${art(type)}</div>`).join('')}</div>
        <div class="supplier-catalog">${products.slice(0,4).map(p=>`<span>${esc(p.name)} · ${esc(p.detail)}</span>`).join('')}${products.length>4?`<small>Y ${products.length-4} presentación más</small>`:''}</div>
        <div class="supplier-info"><span>Visita habitual</span><strong>${esc(s.visit)}</strong></div><div class="supplier-info"><span>Última entrega</span><strong>${last?`${esc(last.day)} · ${money(last.cost)}`:'Sin registrar'}</strong></div>
        <div class="supplier-actions"><button class="primary" data-action="supplier-receive" data-index="${i}" aria-label="Llegó ${esc(s.name)}">${icon('truck')} Llegó ${esc(s.name)}</button><button class="secondary" data-action="visit" data-index="${i}" aria-label="Cambiar visita de ${esc(s.name)}">Cambiar visita</button></div></article>`;
      }).join('')}</div><div class="notice">${icon('info')} Cada proveedor puede traer cualquier tipo de producto. La leche muestra un cartón de leche aunque la entregue un proveedor de refrescos.</div>`;
  }

  function startDelivery(supplier) {
    activeSupplier=supplier;
    if(!drafts.has(supplier)) drafts.set(supplier,{counts:{},cost:'',payment:''});
    onDelivery();
  }
  function addFromDelivery() { edit('',{supplier:activeSupplier}); }
  function supplierForm(originalName='') {
    const supplier=getState().suppliers.find(s=>s.name===originalName)||{name:'',visit:'',note:''};
    showModal(originalName?'Editar proveedor':'Nuevo proveedor','Escribe el nombre de quien te entrega la mercancía. Sus productos se agregan después.',`
      <form id="supplier-form"><label class="field"><span>Nombre del proveedor</span><input name="name" maxlength="60" placeholder="Ejemplo: Lala o proveedor de huevo" value="${esc(supplier.name)}" required></label>
      <label class="field"><span>¿Cuándo viene? (opcional)</span><input name="visit" maxlength="80" placeholder="Ejemplo: lunes y jueves" value="${esc(supplier.visit==='Por confirmar'?'':supplier.visit)}"></label>
      <label class="field"><span>Nota para reconocerlo (opcional)</span><input name="note" maxlength="120" placeholder="Ejemplo: trae leche y yogur" value="${esc(supplier.note)}"></label>
      <div id="form-error" class="form-error" role="alert"></div><button class="primary full">${originalName?'Guardar proveedor':'Guardar y agregar sus productos'}</button></form>`);
    $('#supplier-form',modal).onsubmit=event=>{
      event.preventDefault();const data=new FormData(event.currentTarget);
      try {
        const next=editSupplier(getState(),originalName,Object.fromEntries(data)),name=String(data.get('name')).trim();
        if(commit(next)){
          if(originalName&&drafts.has(originalName)){drafts.set(name,drafts.get(originalName));if(name!==originalName)drafts.delete(originalName);}
          if(activeSupplier===originalName)activeSupplier=name;
          modal.close();
          if(originalName){render();toast('Proveedor actualizado. Sus productos siguen vinculados.');}
          else {startDelivery(name);toast('Proveedor creado. Agrega el primer producto que llegó.');}
        }
      }catch(e){error(e.message);}
    };
  }
  function draftItems() {
    return Object.entries(drafts.get(activeSupplier).counts).map(([productId,quantities])=>({productId,...quantities}));
  }
  function delivery() {
    const state=getState(),draft=drafts.get(activeSupplier);
    const products=state.products.filter(p=>p.supplier===activeSupplier).sort((a,b)=>
      Number(b.name===activeSupplier)-Number(a.name===activeSupplier) || a.name.localeCompare(b.name,'es') || sizeOf(a)-sizeOf(b) || a.detail.localeCompare(b.detail,'es')
    );
    main.innerHTML=`<button class="back-button" id="back-suppliers">Volver a proveedores</button>`+
      sectionHead('RECIBIR UNA ENTREGA',`Llegó ${esc(activeSupplier)}`,'Cuenta lo que llegó. Deja en cero lo que no te entregaron.')+
      `<div class="delivery-layout"><section><div class="delivery-step"><span>1</span><h2>¿Qué productos llegaron?</h2></div>
      <p class="muted">Cada tamaño tiene su propio renglón. Puedes sumar cajas y piezas sueltas.</p>
      <div class="new-product-in-delivery"><div><strong>¿Trajo algo que no aparece aquí?</strong><span>Agrega el producto o el nuevo tamaño y sigue contando esta entrega.</span></div><button class="secondary" data-action="new-delivery-product">${icon('plus')} Producto no registrado</button></div>
      <div class="delivery-products" id="delivery-products">${products.map(p=>{
        const counts=draft.counts[p.id]||{},title=nameOf(p);
        const counter=(key,label,value,step='1')=>`<label class="delivery-counter"><span>${label}</span><div><button type="button" data-count-id="${p.id}" data-count-kind="${key}" data-delta="-1" aria-label="Quitar ${label} de ${esc(title)}">−</button><input aria-label="${label} de ${esc(title)}" data-count-id="${p.id}" data-count-kind="${key}" type="number" min="0" max="1000000" step="${step}" inputmode="${step==='1'?'numeric':'decimal'}" value="${value||0}"><button type="button" data-count-id="${p.id}" data-count-kind="${key}" data-delta="1" aria-label="Agregar ${label} de ${esc(title)}">+</button></div></label>`;
        const containerLabel=CONTAINERS[p.container]||'Cajas';
        return `<article class="delivery-product" id="delivery-${p.id}"><div class="delivery-product-heading"><div class="delivery-art ${p.color}">${art(p.art)}</div><div><h3>${esc(p.name)}</h3><strong>${esc(p.detail)}</strong><small>Hay ${p.stock.toLocaleString('es-MX')} ${p.unit==='kg'?'kg':'piezas'} en tienda</small></div></div><div class="delivery-counters">${p.unit==='kg'?`${p.container&&p.container!=='ninguno'?counter('containers',`${containerLabel} recibidos`,counts.containers):''}${counter('kilos','Peso total en kilos',counts.kilos,'0.001')}`:`${p.pack>1?counter('boxes',`${containerLabel} de ${p.pack} piezas`,counts.boxes):''}${counter('pieces','Piezas sueltas',counts.pieces)}`}</div>${p.art==='egg'?`<p class="field-help">${p.unit==='kg'?'Cuenta los cartones y pesa todo el huevo recibido, sin el empaque.':'Cada cartón suma las piezas que configuraste.'} Registra la misma mercancía una sola vez: por piezas o por kilos.</p>`:''}<div class="delivery-line-result" id="result-${p.id}" aria-live="polite"></div></article>`;
      }).join('')||'<div class="panel empty-row">Aún no hay productos de este proveedor.<br>Toca “Producto no registrado” para agregar el primero.</div>'}</div></section>
      <aside class="panel delivery-summary"><div class="delivery-step"><span>2</span><h2>Revisa la entrega</h2></div><div id="delivery-totals" class="delivery-totals" aria-live="polite"></div>
      <form id="delivery-payment"><label class="field"><span>¿Cuánto cuesta toda la entrega?</span><input name="cost" inputmode="decimal" placeholder="Total que dice el proveedor" value="${esc(draft.cost)}" required></label>
      <fieldset class="payment-options"><legend>¿Cómo se pagó?</legend>${[['cash','Con dinero de esta caja','Se descontará del efectivo.'],['other','Con otro dinero','El efectivo de caja no cambia.'],['unrecorded','Solo registrar lo que llegó','El pago no se registra; no crea una deuda.']].map(([value,title,note])=>`<label><input type="radio" name="payment" value="${value}" ${draft.payment===value?'checked':''} required><span><strong>${title}</strong><small>${note}</small></span></label>`).join('')}</fieldset>
      <div id="delivery-error" class="form-error" role="alert"></div><button type="submit" class="primary full" id="review-delivery">Revisar antes de guardar</button></form><p class="delivery-footnote">Al confirmar se actualizan todos los productos juntos.</p></aside></div>`;
    $('#back-suppliers').onclick=onSuppliers;
    const list=$('#delivery-products');
    list.onclick=event=>{
      const button=event.target.closest('button[data-delta]');if(!button)return;
      const id=button.dataset.countId,kind=button.dataset.countKind;
      const input=list.querySelector(`input[data-count-id="${id}"][data-count-kind="${kind}"]`);
      input.value=Math.max(0,(Number(input.value)||0)+Number(button.dataset.delta));
      updateCount(input);
    };
    list.oninput=event=>{if(event.target.matches('input[data-count-id]')) updateCount(event.target);};
    function updateCount(input) {
      const id=input.dataset.countId,kind=input.dataset.countKind;
      draft.counts[id]={...draft.counts[id],[kind]:input.value===''?0:Number(input.value)};
      updateSummary();
    }
    function updateSummary() {
      let types=0,pieces=0,kilos=0,invalid=false;
      for(const p of products){
        const counts=draft.counts[p.id]||{},boxes=counts.boxes??0,loose=counts.pieces??0,weight=counts.kilos??0,containers=counts.containers??0;
        const needsWeight=p.unit==='kg'&&containers>0&&weight<=0;
        const valid=p.unit==='kg'?Number.isFinite(weight)&&weight>=0&&Number.isSafeInteger(containers)&&containers>=0&&!needsWeight:Number.isSafeInteger(boxes)&&boxes>=0&&Number.isSafeInteger(loose)&&loose>=0;
        const qty=p.unit==='kg'?weight:boxes*p.pack+loose;
        const row=$(`#result-${p.id}`);invalid ||= !valid;
        row.textContent=needsWeight?`Falta escribir el peso total de los ${containers} ${(CONTAINERS[p.container]||'envases').toLowerCase()}.` : !valid?'Revisa la cantidad. No se admiten valores negativos ni fracciones de piezas.':qty>0?`${containers?`${containers} ${(CONTAINERS[p.container]||'envases').toLowerCase()} · `:''}Llegan ${qty.toLocaleString('es-MX')} ${p.unit==='kg'?'kg':'piezas'} · Quedarán ${(Math.round((p.stock+qty)*1000)/1000).toLocaleString('es-MX')} en tienda`:'No llegó en esta entrega';
        row.closest('.delivery-product').classList.toggle('has-delivery',valid&&qty>0);
        if(valid&&qty>0){types++;if(p.unit==='kg')kilos+=qty;else pieces+=qty;}
      }
      $('#delivery-totals').innerHTML=`<strong>${types}</strong><span>${types===1?'presentación recibida':'presentaciones recibidas'}</span><p>${pieces} piezas${kilos?` · ${kilos.toLocaleString('es-MX')} kg`:''} en total</p>`;
      $('#review-delivery').disabled=types===0||invalid;
    }
    const payment=$('#delivery-payment');
    payment.oninput=()=>{draft.cost=$('[name=cost]',payment).value;draft.payment=$('[name=payment]:checked',payment)?.value||'';};
    payment.onsubmit=event=>{
      event.preventDefault();draft.cost=$('[name=cost]',payment).value;draft.payment=$('[name=payment]:checked',payment)?.value||'';
      try {
        const cost=parseMoney(draft.cost);if(!Number.isSafeInteger(cost)||cost<0) throw Error('Escribe el costo total en pesos, por ejemplo 450.00.');
        if(!draft.payment) throw Error('Elige cómo se pagó la entrega.');
        const items=draftItems(),lines=deliveryLines(getState(),activeSupplier,items);
        reviewDelivery({supplier:activeSupplier,items,cost,fromCash:draft.payment==='cash',payment:draft.payment},lines);
      }catch(e){$('#delivery-error').textContent=e.message;}
    };
    updateSummary();
  }
  function reviewDelivery(payload,lines) {
    const id=crypto.randomUUID();
    showModal('¿Está bien lo que llegó?',esc(payload.supplier),`<ul class="receipt-list">${lines.map(l=>`<li><div><strong>${esc(l.name)}</strong><small class="field-help">${esc(l.detail)}</small>${l.containers?`<small class="field-help">${l.containers} ${(CONTAINERS[l.container]||'Envases').toLowerCase()} · peso total real</small>`:''}${l.boxes?`<small class="field-help">${l.boxes} ${(CONTAINERS[l.container]||'Cajas').toLowerCase()} × ${l.pack}${l.pieces?` + ${l.pieces} piezas`:''}</small>`:''}</div><strong>${l.qty.toLocaleString('es-MX')} ${l.unit==='kg'?'kg':'piezas'}</strong></li>`).join('')}</ul><div class="pay-total"><span>Costo de toda la entrega</span><strong>${money(payload.cost)}</strong></div><div class="notice">${payload.fromCash?`Se descontarán ${money(payload.cost)} de la caja, una sola vez.`:payload.payment==='other'?'Se pagó con otro dinero. La caja no cambia.':'Solo se registra la mercancía. No se registra pago ni deuda.'}</div><div id="form-error" class="form-error" role="alert"></div><div class="modal-actions"><button class="secondary" data-action="close">Corregir</button><button class="primary" id="confirm-delivery">Sí, guardar entrega</button></div>`);
    $('#confirm-delivery',modal).onclick=()=>{
      try {
        const next=receiveDelivery(getState(),payload,new Date(),id);
        if(commit(next)){
          drafts.delete(payload.supplier);modal.close();onSuppliers();
          showModal('Entrega guardada','El inventario ya está actualizado.',`<div class="success"><div class="success-mark">${icon('check')}</div><h2>¡Listo, mercancía recibida!</h2><p>${lines.length} presentaciones de ${esc(payload.supplier)}.</p><p>${payload.fromCash?`Se descontaron ${money(payload.cost)} de caja.`:'El efectivo de caja no cambió.'}</p><button class="primary full" data-action="close">Terminar</button></div>`);
        }
      }catch(e){error(e.message);}
    };
  }
  return { products, suppliers, edit, startDelivery, delivery, addFromDelivery, supplierForm };
}
