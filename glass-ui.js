// Presentation-only controls. Existing inputs and their events remain the source of truth.
import {esc,today,monthDays,monthLabel,ruDate,dateObj,addDays} from './core.js';

const svg=(path,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const I={left:svg('<path d="m15 6-6 6 6 6"/>'),right:svg('<path d="m9 6 6 6-6 6"/>'),down:svg('<path d="m8 10 4 4 4-4"/>','chevron-down'),calendar:svg('<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16"/>'),check:svg('<path d="m5 12 4 4L19 6"/>'),light:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'),dark:svg('<path d="M21 12.8A9 9 0 0 1 11.2 3 9 9 0 1 0 21 12.8Z"/>'),system:svg('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8m-4-3v3M12 4v14"/>')};
const pad=n=>String(n).padStart(2,'0');
const monthAt=(year,index)=>`${String(year).padStart(4,'0')}-${pad(index+1)}`;
const monthNames=Array.from({length:12},(_,m)=>new Date(Date.UTC(2026,m,1)).toLocaleDateString('ru-RU',{month:'long',timeZone:'UTC'}));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let active=null,controlCount=0;
const rails=new Map(),railLayouts=new WeakMap();

export function closeGlassPopover(focus=true){
  if(!active)return;
  const {panel,anchor}=active;active=null;
  anchor?.setAttribute('aria-expanded','false');
  if(typeof panel.hidePopover==='function'){try{panel.hidePopover();}catch{}}
  panel.remove();
  if(focus&&anchor?.isConnected)anchor.focus({preventScroll:true});
}
function placePanel(){
  if(!active)return;
  const {panel,anchor,side}=active;
  if(!anchor.isConnected){closeGlassPopover(false);return;}
  const a=anchor.getBoundingClientRect(),p=panel.getBoundingClientRect();
  const viewport=window.visualViewport;
  const w=viewport?.width||innerWidth,h=viewport?.height||innerHeight;
  const ox=viewport?.offsetLeft||0,oy=viewport?.offsetTop||0;
  let x=side==='left'?a.left-p.width-9:a.left,y=side==='left'?a.top:a.bottom+10;
  if(y+p.height>oy+h-12)y=Math.max(oy+12,a.top-p.height-10);
  panel.style.left=`${Math.max(ox+12,Math.min(x,ox+w-p.width-12))}px`;
  panel.style.top=`${Math.max(oy+12,Math.min(y,oy+h-p.height-12))}px`;
}
function createPanel(anchor,cls,label,role='dialog',side='below'){
  closeGlassPopover(false);
  const panel=document.createElement('div');
  panel.id='glassPopover';panel.className=`glass-popover ${cls}`;
  panel.setAttribute('role',role);panel.setAttribute('aria-label',label);
  panel.setAttribute('popover','manual');
  (anchor.closest('dialog[open]')||document.body).append(panel);
  anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-controls',panel.id);
  active={panel,anchor,side};
  if(typeof panel.showPopover==='function')panel.showPopover();
  else panel.removeAttribute('popover');
  return panel;
}
function focusFirst(panel){(panel.querySelector('[aria-pressed="true"],[aria-selected="true"]')||panel.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});}
function commitInput(input,value){
  const key=input.id;closeGlassPopover(false);input.value=value;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  requestAnimationFrame(()=>document.querySelector(`[data-control-for="${CSS.escape(key)}"]`)?.focus({preventScroll:true}));
}
function openCalendar(input,anchor){
  const monthOnly=input.type==='month';
  const initial=input.value||(monthOnly?today().slice(0,7):today());
  let year=Number(initial.slice(0,4)),month=Number(initial.slice(5,7))-1;
  let mode=monthOnly?'months':'days';
  let focusDate=monthOnly?`${initial}-01`:initial;
  const panel=createPanel(anchor,'glass-calendar',monthOnly?'Выбрать месяц табеля':'Выбрать дату');
  const allowed=v=>(!input.min||v>=input.min)&&(!input.max||v<=input.max);
  const select=v=>{if(allowed(v))commitInput(input,v);};
  function draw(){
    let heading=mode==='days'?monthLabel(monthAt(year,month)):mode==='years'?`${year-5}–${year+6}`:String(year);
    let grid='';
    if(mode==='days'){
      const m=monthAt(year,month),offset=(dateObj(m+'-01').getUTCDay()+6)%7;
      grid='<div class="calendar-weekdays" aria-hidden="true">'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<span>${x}</span>`).join('')+'</div><div class="calendar-grid">'+Array.from({length:offset},()=>'<span></span>').join('')+monthDays(m).map(d=>`<button type="button" data-date-value="${d}" aria-label="${ruDate(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}" aria-pressed="${d===input.value}" data-today="${d===today()}" data-offday="${dateObj(d).getUTCDay()===0}" ${allowed(d)?'':'disabled'}>${Number(d.slice(-2))}</button>`).join('')+'</div>';
    }else if(mode==='months'){
      grid='<div class="calendar-grid month-grid">'+monthNames.map((n,m)=>`<button type="button" data-month-value="${m}" aria-label="${n} ${year}" aria-pressed="${monthAt(year,m)===input.value.slice(0,7)}">${n}</button>`).join('')+'</div>';
    }else{
      grid='<div class="calendar-grid year-grid">'+Array.from({length:12},(_,i)=>year-5+i).map(y=>`<button type="button" data-year-value="${y}" aria-pressed="${y===Number(input.value.slice(0,4))}" ${y<1||y>9999?'disabled':''}>${y}</button>`).join('')+'</div>';
    }
    panel.innerHTML=`<div class="calendar-nav"><button type="button" class="icon-btn" data-cal-prev aria-label="${mode==='days'?'Предыдущий месяц':mode==='months'?'Предыдущий год':'Предыдущие годы'}">${I.left}</button><button type="button" class="calendar-heading" data-cal-heading aria-label="${mode==='days'?'Выбрать месяц и год':'Выбрать год'}">${heading}</button><button type="button" class="icon-btn" data-cal-next aria-label="${mode==='days'?'Следующий месяц':mode==='months'?'Следующий год':'Следующие годы'}">${I.right}</button></div>${grid}<p class="calendar-note">${monthOnly?'Выберите месяц для табеля':'Розовым отмечены воскресенья'}</p><div class="calendar-footer"><button type="button" data-cal-today>${monthOnly?'Этот месяц':'Сегодня'}</button><button type="button" data-cal-close>Закрыть</button></div>`;
    placePanel();
  }
  function shift(dir){
    if(mode==='days'){month+=dir;if(month<0){month=11;year--;}if(month>11){month=0;year++;}}
    else year+=dir*(mode==='years'?12:1);
    year=Math.max(1,Math.min(year,9999));draw();
  }
  panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.hasAttribute('data-date-value'))select(b.dataset.dateValue);
    else if(b.hasAttribute('data-month-value')){month=Number(b.dataset.monthValue);if(monthOnly)select(monthAt(year,month));else{mode='days';draw();focusFirst(panel);}}
    else if(b.hasAttribute('data-year-value')){year=Number(b.dataset.yearValue);mode='months';draw();focusFirst(panel);}
    else if(b.hasAttribute('data-cal-prev')||b.hasAttribute('data-cal-next')){const prev=b.hasAttribute('data-cal-prev');shift(prev?-1:1);panel.querySelector(prev?'[data-cal-prev]':'[data-cal-next]')?.focus({preventScroll:true});}
    else if(b.hasAttribute('data-cal-heading')){mode=mode==='days'?'months':mode==='months'?'years':'months';draw();focusFirst(panel);}
    else if(b.hasAttribute('data-cal-today'))select(monthOnly?today().slice(0,7):today());
    else if(b.hasAttribute('data-cal-close'))closeGlassPopover();
  });
  panel.addEventListener('keydown',e=>{
    const b=e.target.closest('button[data-date-value],button[data-month-value],button[data-year-value]');
    if(!b)return;
    const steps=mode==='days'?7:3,delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-steps,ArrowDown:steps}[e.key];
    if(delta!==undefined){
      e.preventDefault();
      if(mode==='days'){
        focusDate=addDays(b.dataset.dateValue,delta);year=Number(focusDate.slice(0,4));month=Number(focusDate.slice(5,7))-1;
        draw();panel.querySelector(`[data-date-value="${focusDate}"]`)?.focus({preventScroll:true});
      }else{
        const buttons=[...panel.querySelectorAll('.calendar-grid button')],i=buttons.indexOf(b),next=Math.max(0,Math.min(buttons.length-1,i+delta));buttons[next]?.focus({preventScroll:true});
      }
    }else if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();shift(e.key==='PageUp'?-1:1);focusFirst(panel);}
  });
  draw();focusFirst(panel);
}
function enhanceDate(input){
  if(input.dataset.glassReady)return;input.dataset.glassReady='yes';
  input.classList.add('glass-native');input.tabIndex=-1;input.setAttribute('aria-hidden','true');
  const b=document.createElement('button');b.type='button';b.className='glass-control';b.dataset.controlFor=input.id;
  b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');
  const update=()=>{const value=input.value,text=value?(input.type==='month'?monthLabel(value):ruDate(value,{day:'numeric',month:'short',year:'numeric'})):'Выбрать дату';b.innerHTML=`${I.calendar}<span>${esc(text)}</span>${I.down}`;b.setAttribute('aria-label',`${input.getAttribute('aria-label')||'Выбрать дату'}: ${text}`);};
  b.addEventListener('click',()=>{if(active?.anchor===b)closeGlassPopover();else openCalendar(input,b);});
  input.addEventListener('change',update);input.after(b);update();
}
function enhanceSelect(select){
  if(select.dataset.glassReady)return;select.dataset.glassReady='yes';
  select.id||=`glass-select-${++controlCount}`;select.classList.add('glass-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const label=select.labels?.[0]?.textContent.trim()||select.getAttribute('aria-label')||'Выбрать';
  const b=document.createElement('button');b.type='button';b.className='glass-control select-control';b.dataset.controlFor=select.id;
  b.setAttribute('aria-haspopup','listbox');b.setAttribute('aria-expanded','false');
  const update=()=>{b.innerHTML=`<span>${esc(select.selectedOptions[0]?.textContent||label)}</span>${I.down}`;b.setAttribute('aria-label',`${label}: ${select.selectedOptions[0]?.textContent||''}`);};
  b.addEventListener('click',()=>{
    if(active?.anchor===b){closeGlassPopover();return;}
    const p=createPanel(b,'glass-menu',label,'listbox');
    p.innerHTML=[...select.options].map((o,i)=>`<button type="button" role="option" data-option-index="${i}" aria-selected="${o.selected}" ${o.disabled?'disabled':''}>${esc(o.textContent)}${o.selected?I.check:''}</button>`).join('');
    p.addEventListener('click',e=>{const option=e.target.closest('[data-option-index]');if(!option||option.disabled)return;commitInput(select,select.options[Number(option.dataset.optionIndex)].value);update();});
    p.addEventListener('keydown',e=>{
      const options=[...p.querySelectorAll('[role=option]:not(:disabled)')],i=options.indexOf(document.activeElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1)));options[n]?.focus();}
    });
    placePanel();focusFirst(p);
  });
  select.addEventListener('change',update);select.after(b);update();
}
function enhanceNumber(input){
  if(input.dataset.glassNumber)return;input.dataset.glassNumber='yes';
  const wrapper=document.createElement('div');wrapper.className='number-stepper';input.before(wrapper);wrapper.append(input);
  const label=input.getAttribute('aria-label')||input.labels?.[0]?.textContent.trim()||'Значение';
  for(const delta of [-1,1]){
    const b=document.createElement('button');b.type='button';b.textContent=delta<0?'−':'+';
    b.setAttribute('aria-label',`${delta<0?'Уменьшить':'Увеличить'}: ${label}`);
    b.addEventListener('click',()=>{
      const min=input.min===''?0:Number(input.min),max=input.max===''?999:Number(input.max),step=Number(input.step)||1;
      input.value=String(Math.max(min,Math.min(max,(Number(input.value)||0)+delta*step)));
      input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    if(delta<0)wrapper.prepend(b);else wrapper.append(b);
  }
  if(input.dataset.hours){
    const range=document.createElement('input');range.type='range';range.min=input.min||'0';range.max=input.max||'24';range.step=input.step||'1';range.className='hours-range';range.dataset.rangeFor=input.id;
    range.setAttribute('aria-label',`${label}: ползунок`);
    range.addEventListener('input',()=>{input.value=range.value;input.dispatchEvent(new Event('input',{bubbles:true}));});
    wrapper.after(range);
  }
}
function syncNumbers(){
  document.querySelectorAll('.number-stepper input').forEach(input=>{
    const w=input.parentElement,buttons=w.querySelectorAll('button'),value=Number(input.value)||0;
    buttons[0].disabled=value<=Number(input.min||0);buttons[1].disabled=input.max!==''&&value>=Number(input.max);
    const range=w.parentElement.querySelector('.hours-range');if(range){range.value=String(value);range.style.setProperty('--range-fill',`${100*value/Number(range.max)}%`);w.parentElement.classList.toggle('has-hours',value>0);}
  });
}
export function openThemeMenu(anchor,value,onChange){
  if(active?.anchor===anchor){closeGlassPopover();return;}
  const p=createPanel(anchor,'glass-theme','Оформление','dialog','left');
  const names={light:'Светлая тема',dark:'Тёмная тема',system:'Как в системе'};
  p.innerHTML=['light','dark','system'].filter(t=>t!==value).map(t=>`<button type="button" data-theme-choice="${t}" aria-label="${names[t]}" title="${names[t]}">${I[t]}</button>`).join('');
  p.addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;closeGlassPopover(false);onChange(b.dataset.themeChoice);requestAnimationFrame(()=>document.querySelector('[data-action=theme]')?.focus({preventScroll:true}));});
  placePanel();focusFirst(p);
}
function mountRail(container,selector,key){
  if(!container)return;if(container.dataset.glassRail){railLayouts.get(container)?.();return;}container.dataset.glassRail='yes';
  const buttons=[...container.querySelectorAll(selector)];
  const selected=buttons.find(b=>b.matches('[aria-pressed=true],.selected'));
  const thumb=document.createElement('span');thumb.className='glass-thumb';thumb.setAttribute('aria-hidden','true');container.prepend(thumb);
  const bounds=b=>{const c=container.getBoundingClientRect(),r=b.getBoundingClientRect();return{x:r.left-c.left-container.clientLeft,y:r.top-c.top-container.clientTop,w:r.width,h:r.height};};
  const move=(r,remember=false)=>{thumb.style.width=`${r.w}px`;thumb.style.height=`${r.h}px`;thumb.style.transform=`translate(${r.x}px,${r.y}px)`;thumb.style.opacity='1';if(remember)rails.set(key,r);};
  if(selected){const target=bounds(selected),previous=rails.get(key);if(previous&&!reduced()){move({...target,x:previous.x});requestAnimationFrame(()=>{if(container.isConnected)move(target,true);});}else move(target,true);}else thumb.style.opacity='0';
  railLayouts.set(container,()=>{if(selected)move(bounds(selected),true);});
  let drag=null,suppress=false;
  const closest=x=>buttons.reduce((best,b)=>{const r=b.getBoundingClientRect(),distance=Math.abs(x-r.left-r.width/2);return !best||distance<best.distance?{button:b,distance}:best;},null)?.button;
  container.addEventListener('pointerdown',e=>{if(e.button!==0||!e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};});
  container.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(!drag.moved&&Math.abs(e.clientY-drag.y)>Math.abs(e.clientX-drag.x)&&Math.abs(e.clientY-drag.y)>8){drag=null;return;}
    if(Math.abs(e.clientX-drag.x)>7){drag.moved=true;container.classList.add('is-dragging');if(!container.hasPointerCapture(e.pointerId))container.setPointerCapture(e.pointerId);const b=closest(e.clientX);if(b)move(bounds(b));}
  });
  container.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;container.classList.remove('is-dragging');if(moved){e.preventDefault();suppress=true;const b=closest(e.clientX);b?.click();setTimeout(()=>suppress=false,300);}});
  container.addEventListener('pointercancel',()=>{drag=null;container.classList.remove('is-dragging');if(selected)move(bounds(selected));});
  container.addEventListener('click',e=>{if(suppress&&e.isTrusted){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
  container.addEventListener('keydown',e=>{const i=buttons.indexOf(e.target);if(i<0)return;const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();const b=buttons[Math.max(0,Math.min(buttons.length-1,i+d))];b.click();requestAnimationFrame(()=>{const now=document.querySelector(`[data-rail-key="${key}"]`);now?.querySelector('[aria-pressed=true],.selected')?.focus({preventScroll:true});});});
  container.dataset.railKey=key;
}
export function mountGlassUI(root=document){
  root.querySelectorAll('input[type=date],input[type=month]').forEach(enhanceDate);
  root.querySelectorAll('select').forEach(enhanceSelect);
  root.querySelectorAll('input[type=number]').forEach(enhanceNumber);
  mountRail(root.querySelector('.view-tabs'),'button','views');
  mountRail(root.querySelector('.week-strip'),'.week-day','days');
  mountRail(root.querySelector('.theme-options'),'button','themes');
  syncNumbers();
}
document.addEventListener('input',()=>requestAnimationFrame(syncNumbers));
document.addEventListener('pointerdown',e=>{if(active&&!active.panel.contains(e.target)&&!active.anchor.contains(e.target))closeGlassPopover(false);},{capture:true});
document.addEventListener('keydown',e=>{
  if(!active)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeGlassPopover();return;}
  if(e.key==='Tab'){
    const list=[...active.panel.querySelectorAll('button:not(:disabled),[tabindex="0"]')];
    if(!list.length)return;
    const first=list[0],last=list.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
},{capture:true});
window.addEventListener('resize',()=>{closeGlassPopover(false);rails.clear();mountGlassUI();});
window.addEventListener('scroll',e=>{if(active&&!active.panel.contains(e.target))placePanel();},{capture:true,passive:true});
window.visualViewport?.addEventListener('resize',placePanel);
window.visualViewport?.addEventListener('scroll',placePanel);
