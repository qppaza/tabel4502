export const REASONS = [
  {code:'Б',name:'Болезнь',color:'blue'},
  {code:'УП',name:'Уважительная причина по заявлению',color:'teal'},
  {code:'ПН',name:'Причина неизвестна',color:'rose'},
  {code:'СБ',name:'Спортивные сборы / соревнования',color:'amber'},
  {code:'ОМ',name:'Общественные мероприятия',color:'purple'},
  {code:'Ц',name:'Центр культурно-воспитательной работы',color:'cyan'},
  {code:'ПР',name:'Присутствовал, не участвовал по состоянию здоровья (физкультура)',color:'gray'},
];
export const CODES=REASONS.map(x=>x.code);
export const TYPES={lecture:'Лекция',seminar:'Семинар',practice:'Практическое',info:'Информационный час',curator:'Кураторский час',combined:'Инф. / кураторский час',credit:'Зачёт',other:'Занятие'};
export const LESSON_COLORS={lecture:'#85adff',seminar:'#c2a0ff',practice:'#6cdbc2',info:'#ed9cc5',curator:'#ed9cc5',combined:'#ed9cc5',credit:'#efb77d',other:'#b0bed8'};
export function lessonTiming(lesson,date,now=Date.now()){
  const time=String(lesson.time||'').trim().match(/^(\d{1,2})[.:](\d{2})(?:\s*[–—-]\s*(\d{1,2})[.:](\d{2}))?$/);
  if(!time||Number(time[1])>23||Number(time[2])>59||(time[3]!==undefined&&(Number(time[3])>23||Number(time[4])>59)))return {state:'unknown',progress:0,label:'Время не указано',detail:''};
  const at=(h,m)=>Date.parse(`${date}T${String(h).padStart(2,'0')}:${m}:00+03:00`);
  const start=at(time[1],time[2]);let end=time[3]===undefined?null:at(time[3],time[4]);
  if(end!==null&&end<=start)end+=86400000;
  const localDate=new Date(now+10800000).toISOString().slice(0,10);
  if(now<start)return {state:'upcoming',progress:0,label:'Предстоит',detail:localDate===date?`Через ${Math.ceil((start-now)/60000)} мин`:''};
  if(end===null)return {state:localDate>date?'past':'started',progress:0,label:localDate>date?'Прошло':'Началось',detail:'Окончание не указано'};
  if(now>=end)return {state:'past',progress:100,label:'Завершено',detail:''};
  return {state:'current',progress:Math.max(0,Math.min(100,(now-start)/(end-start)*100)),label:'Сейчас идёт',detail:`Ещё ${Math.ceil((end-now)/60000)} мин`};
}
export const emptyTotals=()=>Object.fromEntries(CODES.map(x=>[x,0]));
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
export function today(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Minsk',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts().map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
export const dateObj=d=>new Date(d+'T12:00:00Z');
export function addDays(d,n){let x=dateObj(d);x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
export const monday=d=>addDays(d,-((dateObj(d).getUTCDay()+6)%7));
export function daysInMonth(m){return new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate();}
export const monthDays=m=>Array.from({length:daysInMonth(m)},(_,i)=>`${m}-${String(i+1).padStart(2,'0')}`);
export const ruDate=(d,opts={day:'numeric',month:'long'})=>dateObj(d).toLocaleDateString('ru-RU',{...opts,timeZone:'UTC'});
export const monthLabel=m=>ruDate(m+'-01',{month:'long',year:'numeric'}).replace(' г.','');
export const fmt=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2});
export const sum=(t,includePR=true)=>CODES.reduce((s,c)=>s+(c==='ПР'&&!includePR?0:(Number(t[c])||0)),0);
export const compact=t=>CODES.filter(c=>t[c]>0).map(c=>`${c}/${fmt(t[c])}`).join(' · ');
export function makeGroup(name,scheduleGroup=''){return {name,scheduleGroup,students:[],marks:{},daily:{},reviewed:{},customLessons:{},lessonEdits:{}};}
export const ROSTER=["Белаус Д.И.", "Верескун Д.О.", "Волот А.А.", "Воропай С.А.", "Гесть М.В.", "Гневшева С.А.", "Горбач П.А.", "Евстратовский А.С.", "Жуковский Е.Н.", "Карабань Е.А.", "Карпович С.А.", "Карпович У.Н.", "Ковальчук И.А.", "Кортиков К.Е.", "Костюченко П.А.", "Кужовник Я.А.", "Лесько Т.А.", "Новикова В.С.", "Ослова А.Д.", "Плаксина Е.В.", "Подлипская А.Д.", "Рачек Т.В.", "Рожкова А.А.", "Савицкая В.Р.", "Сидляревич П.С.", "Сущ Д.Д.", "Тимофейчик В.Д.", "Фицева К.С.", "Худоешко Н.С.", "Цыблиенко Д.Н."];
export function newState(){const g=makeGroup('4502','4502');g.students=ROSTER.map((name,i)=>({id:`student-${String(i+1).padStart(2,'0')}`,name,archived:false}));return {schemaVersion:1,activeGroup:'4502',theme:'system',includePR:true,groups:{'4502':g},updatedAt:null};}
export function normalize(m){const raw=[m.subject,...(m.details||[])].join(' ').replace(/\s+/g,' ').trim();let subject=m.subject.replace(/^\d{1,2}[.:]\d{2}\s*/,'').split(/\s*т\.\s*\d/i)[0].replace(/(?:[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?)\s+[А-ЯЁ]\.\s*[А-ЯЁ]\..*$/,'').trim();let type=m.type;if(/информационный.*кураторский/i.test(raw))type='combined';else if(/кураторский/i.test(raw))type='curator';if(type==='info')subject='Информационный час';if(type==='curator')subject='Кураторский час';if(type==='combined')subject='Информационный и кураторский час';return{subject:subject||m.subject,type,raw,pe:/физкультур|физическ.*культур/i.test(raw)};}
export function lessonsFor(schedule,group,date){let result=[];const week=schedule?.weekDates?.indexOf(monday(date))??-1,day=(dateObj(date).getUTCDay()+6)%7;if(week>=0&&day<6){result=(schedule.days[day]?.lessons||[]).flatMap(l=>{const m=l.groups[group.scheduleGroup]?.[week];if(!m)return[];const n=normalize(m);return [{id:`s${l.num}`,num:l.num,time:l.time.replaceAll('.',':').replace('-', '–'),hours:['info','curator','combined'].includes(n.type)?0:2,...n}];});}
  result.push(...(group.customLessons[date]||[]));result=result.map(l=>({...l,...group.lessonEdits[date]?.[l.id]}));
  // A changed source must never orphan already recorded absences.
  for(const [id,records] of Object.entries(group.marks[date]||{})){if(!result.some(l=>l.id===id)){const r=Object.values(records)[0];if(r)result.push({id,num:r.num||'—',time:r.time||'',subject:r.subject,hours:r.hours,pe:r.pe,type:'other',retained:true});}}
  return result.sort((a,b)=>(Number(a.num)||99)-(Number(b.num)||99));
}
export function dayTotals(g,id,date){if(g.daily[date]?.[id])return {...emptyTotals(),...g.daily[date][id].hours};const totals=emptyTotals();for(const records of Object.values(g.marks[date]||{})){const r=records[id];if(r&&CODES.includes(r.code))totals[r.code]+=r.hours;}return totals;}
export function monthTotals(g,id,month){const t=emptyTotals();for(const date of monthDays(month)){const d=dayTotals(g,id,date);for(const c of CODES)t[c]+=d[c];}return t;}
export function groupTotals(g,month){const t=emptyTotals();for(const s of monthStudents(g,month)) {const a=monthTotals(g,s.id,month);for(const c of CODES)t[c]+=a[c];}return t;}
export function monthStudents(g,m){return g.students.filter(s=>!s.archived||monthDays(m).some(d=>g.daily[d]?.[s.id]||Object.values(g.marks[d]||{}).some(rs=>rs[s.id])));}
export function statusFor(g,date,lesson,id){if(g.daily[date]?.[id])return 'daily';return g.marks[date]?.[lesson]?.[id]?.code||'+';}
export function validSchedule(d){
 if(!d||!Array.isArray(d.weekDates)||!d.weekDates.length||!d.weekDates.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))return false;
 if(!Array.isArray(d.groups)||!d.groups.every(x=>typeof x==='string')||!Array.isArray(d.days)||d.days.length!==6)return false;
 return d.days.every(day=>Array.isArray(day.lessons)&&day.lessons.every(l=>typeof l.time==='string'&&l.groups&&d.groups.every(g=>Array.isArray(l.groups[g])&&l.groups[g].length===d.weekDates.length&&l.groups[g].every(m=>m===null||(m&&typeof m.subject==='string'&&Array.isArray(m.details)&&m.details.every(x=>typeof x==='string')&&typeof m.type==='string')))));
}
export function validateState(s){
  if(!s||s.schemaVersion!==1||!s.groups||typeof s.groups!=='object'||Array.isArray(s.groups)||!s.groups[s.activeGroup]||!['light','dark','system'].includes(s.theme)||typeof s.includePR!=='boolean')throw Error('Неизвестный формат резервной копии');
  if(Object.keys(s.groups).some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Некорректный идентификатор группы');
  for(const g of Object.values(s.groups)){
    if(typeof g.name!=='string'||typeof g.scheduleGroup!=='string'||!Array.isArray(g.students)||g.students.length>500)throw Error('Некорректный список группы');
    const ids=new Set();for(const p of g.students){if(!p||typeof p.id!=='string'||!p.id||['__proto__','constructor','prototype'].includes(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim())throw Error('Некорректные данные учащихся');ids.add(p.id);}
    for(const key of ['marks','daily','reviewed','customLessons','lessonEdits'])if(!g[key]||typeof g[key]!=='object'||Array.isArray(g[key]))throw Error('Неполная резервная копия');
    for(const [date,lessons] of Object.entries(g.marks)){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Некорректная дата');for(const rows of Object.values(lessons)){for(const [id,r] of Object.entries(rows))if(!ids.has(id)||!r||![...CODES,'+'].includes(r.code)||typeof r.hours!=='number'||!Number.isFinite(r.hours)||r.hours<0||r.hours>24||typeof r.subject!=='string')throw Error('Некорректная отметка');}}
    for(const [date,rows] of Object.entries(g.daily)){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Некорректная дата');for(const [id,r] of Object.entries(rows)){if(!ids.has(id)||!r?.hours||Object.keys(r.hours).some(c=>!CODES.includes(c))||Object.values(r.hours).some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>24)||sum(r.hours)>24)throw Error('Некорректные дневные часы');}}
    for(const list of Object.values(g.customLessons)){if(!Array.isArray(list)||list.some(l=>!l||typeof l.id!=='string'||typeof l.subject!=='string'||typeof l.hours!=='number'||l.hours<0||l.hours>12))throw Error('Некорректные занятия');}
    // Keep old backups compatible while retaining only supported student fields.
    g.students=g.students.map(p=>({id:p.id,name:p.name,archived:!!p.archived}));
  }return s;
}
export function printHTML(g,month,includePR){
 const dates=monthDays(month),students=monthStudents(g,month);const rows=students.map((s,i)=>{const t=monthTotals(g,s.id,month);return `<tr><td>${i+1}</td><td class="name">${esc(s.name)}${s.archived?' *':''}</td>${dates.map(d=>`<td>${CODES.filter(c=>dayTotals(g,s.id,d)[c]>0).map(c=>`<span class="entry">${c}/${fmt(dayTotals(g,s.id,d)[c])}</span>`).join('')}</td>`).join('')}${CODES.map(c=>`<td>${t[c]?fmt(t[c]):''}</td>`).join('')}<td><b>${fmt(sum(t,includePR))}</b></td><td></td></tr>`}).join('');
 const total=groupTotals(g,month);const cols=2+dates.length+CODES.length+2;
 return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Табель — ${esc(g.name)} — ${esc(month)}</title><style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font:9px Arial,sans-serif;color:#000;margin:16px}h1{font-size:15px;margin:0 0 6px;text-align:center}.meta{text-align:center;font-size:11px;margin-bottom:10px}.label{border:1px solid #333;padding:2px 5px;font-size:9px;float:right}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #444;text-align:center;padding:1px;overflow-wrap:anywhere;height:17px;line-height:1.05}th{font-size:7px;background:#f1f1f1;overflow-wrap:normal}.name{text-align:left;font-size:9px;padding-left:4px}.entry{display:block;font-size:7px;white-space:nowrap;line-height:1.1}thead{display:table-header-group}tr{break-inside:avoid}tfoot{font-weight:bold;display:table-row-group}.note{font-size:8px;line-height:1.3;margin-top:8px}.sign{margin-top:10px;display:flex;justify-content:space-between;font-size:10px}.printbtn{padding:12px 20px;cursor:pointer;margin-bottom:16px}@media print{body{margin:0}.printbtn{display:none}th{background:white}}@media screen{body{max-width:1300px;margin:24px auto;padding:10px}}</style></head><body><button class="printbtn" onclick="window.print()">Печать / сохранить в PDF</button><span class="label">ЧЕРНОВИК</span><h1>Табель учёта посещаемости</h1><div class="meta">Учебная группа ${esc(g.name)} · ${esc(monthLabel(month))} · Факультет права</div><table><colgroup><col style="width:2%"><col style="width:17%">${dates.map(()=>'<col>').join('')}${CODES.map(()=>'<col style="width:2.3%">').join('')}<col style="width:3.2%"><col style="width:5%"></colgroup><thead><tr><th rowspan="2">№</th><th rowspan="2">Фамилия, инициалы обучающегося</th><th colspan="${dates.length}">Дата, учёт посещаемости</th><th colspan="8">Пропущено часов</th><th rowspan="2">Ведущий<br>специалист,<br>подпись</th></tr><tr>${dates.map(d=>`<th>${Number(d.slice(-2))}</th>`).join('')}${CODES.map(c=>`<th>${c}</th>`).join('')}<th>Всего</th></tr></thead><tbody>${rows||`<tr><td colspan="${cols}">Список группы не заполнен</td></tr>`}</tbody><tfoot><tr><td colspan="${dates.length+2}" style="text-align:right;padding-right:5px">Итого по группе, часов</td>${CODES.map(c=>`<td>${fmt(total[c])}</td>`).join('')}<td>${fmt(sum(total,includePR))}</td><td></td></tr></tfoot></table><div class="note">1 пара = 2 академических часа (если продолжительность не изменена вручную). ${REASONS.map(r=>`${r.code} — ${esc(r.name.toLowerCase())}`).join('; ')}.<br>ПР ${includePR?'включён':'не включён'} в столбец «Всего». Пустая ячейка означает присутствие. В табель вносятся только пропуски и ПР. Документ подготовлен для сверки с бумажным журналом.${students.some(s=>s.archived)?' * Учащийся находится в архиве списка.':''}</div><div class="sign"><span>Староста __________________________</span><span>Дата составления: ${esc(ruDate(today(),{day:'2-digit',month:'2-digit',year:'numeric'}))}</span></div></body></html>`;
}

export function parseEntry(text){
 const t=emptyTotals();let input=text.trim().toUpperCase();if(!input)return t;
 const re=/(УП|ПН|СБ|ОМ|ПР|Б|Ц)\s*\/\s*(\d+)/g;let m,found=0;
 while((m=re.exec(input))){t[m[1]]+=Number(m[2]);found++;}
 if(!found||input.replace(re,'').replace(/[;,+·\s]/g,'')||sum(t)>24)throw Error('Формат: Б/8 или Б/4; ПН/2. Целые часы, в сумме не более 24.');return t;
}
