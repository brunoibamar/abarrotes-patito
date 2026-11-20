const motion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:true};
const ease = 'cubic-bezier(.2,.8,.2,1)';

function play(element, frames, options) {
  if (!element || motion.matches || !element.animate) return;
  // Cancela solo las animaciones de esta capa; nunca modifica datos ni retrasa acciones.
  element.getAnimations().filter(a=>a.id==='patito-feedback').forEach(a=>a.cancel());
  const animation=element.animate(frames,{duration:240,easing:ease,...options});
  animation.id='patito-feedback';
}

export function animateView(root) {
  if(motion.matches)return;
  play(root.firstElementChild,[{opacity:.92,translate:'0 5px'},{opacity:1,translate:'0 0'}]);
  root.querySelectorAll('.supplier-grid>.panel,.summary-grid>.panel').forEach((el,i)=>
    play(el,[{opacity:.9,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:280,delay:Math.min(i,5)*25,fill:'backwards'})
  );
}

export function animateCatalog(root) {
  if(motion.matches)return;
  root.querySelectorAll('.product').forEach((el,i)=>
    play(el,[{opacity:.9,translate:'0 6px'},{opacity:1,translate:'0 0'}],{duration:220,delay:Math.min(i,6)*16,fill:'backwards'})
  );
}

export function animateModal(modal) {
  play(modal,[{opacity:.85,translate:'0 9px',scale:'.985'},{opacity:1,translate:'0 0',scale:'1'}],{duration:210});
}

export function animateCart(root,productId) {
  if(motion.matches)return;
  const line=[...root.querySelectorAll('.cart-line')].find(el=>el.dataset.lineId===productId);
  play(line,[{backgroundColor:'#e3f1e6',translate:'3px 0'},{backgroundColor:'transparent',translate:'0 0'}],{duration:360});
  play(root.querySelector('.count-badge'),[{scale:'1.08'},{scale:'1'}],{duration:240});
  play(root.querySelector('#cart-total'),[{color:'#4d9061',scale:'1.025'},{color:'#234a3c',scale:'1'}],{duration:280});
}

export function productAdded(root,id) {
  const button=[...root.querySelectorAll('[data-product]')].find(el=>el.dataset.product===id);
  if(!button)return;
  button.classList.add('just-added');
  clearTimeout(button.feedbackTimeout);
  button.feedbackTimeout=setTimeout(()=>button.classList.remove('just-added'),650);
}

export function initEffects() {
  function wave(button,x,y) {
    if(!button||button.disabled||motion.matches)return;
    const rect=button.getBoundingClientRect();
    const dot=document.createElement('span');
    dot.className='button-wave';dot.setAttribute('aria-hidden','true');
    dot.style.setProperty('--wave-size',`${Math.max(rect.width,rect.height)*2.1}px`);
    dot.style.setProperty('--wave-x',`${x??rect.width/2}px`);
    dot.style.setProperty('--wave-y',`${y??rect.height/2}px`);
    button.querySelectorAll('.button-wave').forEach(el=>el.remove());
    button.append(dot);
    setTimeout(()=>dot.remove(),520);
  }
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const button=event.target.closest('button');if(!button)return;
    const rect=button.getBoundingClientRect();wave(button,event.clientX-rect.left,event.clientY-rect.top);
  },{capture:true,passive:true});
  document.addEventListener('click',event=>{
    if(event.detail===0)wave(event.target.closest('button'));
  },{capture:true,passive:true});
}
