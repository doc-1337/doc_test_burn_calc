 'use strict';
const $=id=>document.getElementById(id);
// Adult nine-rule regional subdivisions; coefficients sum to 100% TBSA.
const regions=[];
const add=(id,name,max,side,x,y,w,h)=>regions.push({id,name,max,side,x,y,w,h});
for(const side of ['front','back']){
 const f=side==='front',label=f?'передня':'задня';
 add('head_'+side,`Голова та шия — ${label} поверхня`,4.5,side,80,12,40,40);
 add('trunk_upper_'+side,`Тулуб — ${label} верхня половина`,9,side,68,58,64,48);
 add('trunk_lower_'+side,`Тулуб — ${label} нижня половина`,9,side,68,106,64,48);
 for(const [prefix,word,x] of [['r','Права',34],['l','Ліва',138]]){
  add(`${prefix}_upperarm_${side}`,`${word} рука — плече, ${label}`,2,side,x,65,28,40);
  add(`${prefix}_forearm_${side}`,`${word} рука — передпліччя, ${label}`,1.5,side,x,106,28,39);
  add(`${prefix}_hand_${side}`,`${word} кисть — ${label}`,1,side,x+3,146,22,23);
 }
 for(const [prefix,word,x] of [['r','Права',75],['l','Ліва',105]]){
  add(`${prefix}_thigh_${side}`,`${word} нога — стегно, ${label}`,4.5,side,x,169,24,54);
  add(`${prefix}_shin_${side}`,`${word} нога — гомілка, ${label}`,3,side,x,224,24,51);
  add(`${prefix}_foot_${side}`,`${word} стопа — ${label}`,1.5,side,x,276,24,22);
 }
}
add('per','Промежина',1,'front',96,155,8,12);
const grades=[['i','I — еритема'],['ii','II — поверхневий частковошаровий'],['iiia','IIIА — глибокий частковошаровий'],['iiib','IIIБ — повношаровий'],['iv','IV — глибші тканини']];
const groupFor=r=>{
 if(r.id.startsWith('head'))return 'Голова та шия';
 if(r.id.startsWith('trunk'))return 'Тулуб';
 if(r.id.includes('upperarm')||r.id.includes('forearm')||r.id.includes('hand'))return 'Верхні кінцівки';
 if(r.id.includes('thigh')||r.id.includes('shin')||r.id.includes('foot'))return 'Нижні кінцівки';
 return 'Промежина';
};
const groupNames=['Голова та шия','Тулуб','Верхні кінцівки','Нижні кінцівки','Промежина'];
$('regions').innerHTML=groupNames.map((name,idx)=>{
 const subset=regions.filter(r=>groupFor(r)===name);
 return `<details class="anatomy-block" ${idx===0?'open':''}><summary><span>${name}</span><span class="group-total" id="group-${idx}">0,0% TBSA</span></summary><div class="block-contents">${subset.map(r=>`<details class="region" id="row-${r.id}"><summary><span>${r.name}</span><span class="segment-result" id="result-${r.id}">0 / ${r.max}% TBSA</span></summary><p class="muted">Вкажіть % площі цієї ділянки для кожного ступеня (разом ≤100%).</p><div class="gradegrid">${grades.map(([id,title])=>`<label>${title}<input id="grade-${r.id}-${id}" type="number" min="0" max="100" step="1" value="0"></label>`).join('')}</div><small id="sum-${r.id}"></small></details>`).join('')}</div></details>`;
}).join('');
function num(id){let v=$(id).value.trim();return v===''?NaN:Number(v)}
function fmt(v){return Math.round(v).toLocaleString('uk-UA')}
function band(v){return v<0?'—':v.toFixed(1)}
const flags=['airway','smoke','face','circ','chemical','trauma','comorb','infection'];
function update(){
const age=num('age'),weight=num('weight'),hours=num('hours'),factor=num('factor');
let tbsa=0,full=0,invalid=false,any=false,byGrade={i:0,ii:0,iiia:0,iiib:0,iv:0};
for(const r of regions){let total=0,affected=0;for(const [id] of grades){const v=num(`grade-${r.id}-${id}`);if(!Number.isFinite(v)||v<0||v>100)invalid=true;total+=v;const pct=r.max*v/100;byGrade[id]+=pct;if(id!=='i')affected+=pct;if(id==='iiib'||id==='iv')full+=pct;}if(total>100.00001)invalid=true;tbsa+=affected;any ||= affected>0;$('sum-'+r.id).textContent=`Разом: ${total.toFixed(0)}% ділянки${total>100?' — ПЕРЕВИЩЕННЯ!':''}`;$('result-'+r.id).textContent=`${affected.toFixed(1)} / ${r.max}% TBSA`;}
groupNames.forEach((name,idx)=>{const group=regions.filter(r=>groupFor(r)===name);let sum=0;group.forEach(r=>grades.forEach(([id])=>{if(id!=='i')sum+=r.max*num(`grade-${r.id}-${id}`)/100}));$('group-'+idx).textContent=`${sum.toFixed(1).replace('.',',')}% TBSA`});
if(![age,weight,hours,factor].every(Number.isFinite)||age<18||age>120||weight<=0||weight>350||hours<0||hours>24||invalid||tbsa>100){$('results').innerHTML='<p class="error">Помилка введення: перевірте вік, масу, час та відсотки ділянок (0–100%).</p>';$('advice').textContent='';$('monitor').textContent='';$('triage').textContent='';return}
const inh=$('inh').checked,baux=age+tbsa+(inh?17:0),volume=factor*weight*tbsa;
let absi=(age<=20?1:age<=40?2:age<=60?3:age<=80?4:5)+(tbsa<=10?1:tbsa<=20?2:tbsa<=30?3:tbsa<=40?4:tbsa<=50?5:tbsa<=60?6:tbsa<=70?7:tbsa<=80?8:tbsa<=90?9:10)+Number($('sex').value)+(inh?1:0)+(full>0?1:0);
$('results').innerHTML=`<div class="stats"><article><span>TBSA (частково- та повношарові)</span><strong>${band(tbsa)}%</strong></article><article><span>IIIБ–IV (повношарові та глибші)</span><strong>${band(full)}%</strong></article><article><span>Revised Baux, бал</span><strong>${band(baux)}</strong></article><article><span>ABSI, бал</span><strong>${absi}</strong></article><article><span>Стартовий розрахунок 24 год</span><strong>${fmt(volume)} мл</strong></article><article><span>Перші 8 год / наступні 16 год</span><strong>${fmt(volume/2)} / ${fmt(volume/2)} мл</strong></article></div><p><b>За ступенями (% загальної площі тіла):</b> I: ${band(byGrade.i)}%; II: ${band(byGrade.ii)}%; IIIА: ${band(byGrade.iiia)}%; IIIБ: ${band(byGrade.iiib)}%; IV: ${band(byGrade.iv)}%.</p><p class="muted">ABSI та Revised Baux — прогностичні шкали, не діагноз і не індивідуальний відсоток летальності. ${tbsa<20?'При TBSA <20% ця формула зазвичай не застосовується для стартової ресусцитації дорослих.':'Розрахунок потрібно титрувати за клінічною відповіддю.'}</p>`;
const u=$('urine').value.trim(),urine=u===''?NaN:Number(u),target=weight*.5;
$('monitor').innerHTML=`<p><b>Орієнтир діурезу для дорослих:</b> ≥${band(target)} мл/год (0,5 мл/кг/год).</p>`+(Number.isFinite(urine)&&urine>=0?`<p class="${urine<target?'warn':'ok'}">Поточний діурез ${band(urine)} мл/год (${band(urine/weight)} мл/кг/год). ${urine<target?'Нижче орієнтира — потрібна клінічна оцінка перфузії та причин, не автоматичне збільшення інфузії.':'Не нижче базового орієнтира; оцінюйте в динаміці.'}</p>`:'<p class="muted">Введіть погодинний діурез для порівняння.</p>');
const checked=id=>$(id).checked;
const red=checked('airway')||checked('circ')||checked('trauma')||checked('infection');
const specialist=tbsa>=10||full>0||inh||checked('face')||checked('chemical')||checked('smoke');
const major=tbsa>=20;
const status=red?'Невідкладна оцінка / потенційно критичний стан':major?'Великий опік — високий ризик системних ускладнень':specialist?'Показана консультація спеціалізованого центру':'Оцінити клінічні обставини та спостереження';
const reasons=[];
if(tbsa>=20)reasons.push('TBSA ≥20%');
if(tbsa>=10)reasons.push('TBSA ≥10%');
if(full>0)reasons.push('повношаровий опік');
if(inh)reasons.push('підтверджена інгаляційна травма');
for(const [id,label] of [['airway','загроза дихальним шляхам'],['smoke','вплив диму'],['face','критична локалізація'],['circ','циркулярний опік'],['chemical','хімічний/електричний механізм'],['trauma','супутня травма'],['comorb','супутні захворювання'],['infection','ознаки інфекції']])if(checked(id))reasons.push(label);
$('triage').innerHTML=`<div class="triage-panel"><strong>${status}</strong><p>${reasons.length?'Фактори: '+reasons.join('; ')+'.':'Позначених додаткових факторів немає.'}</p><p class="muted">Це алгоритм клінічного сортування, а не числова оцінка ризику опікової хвороби.</p></div>`;
let advice=[];
if(tbsa>=20)advice.push('Великий опік: термінова спеціалізована оцінка, інфузійна ресусцитація з моніторингом та консультація опікового центру.');
if(tbsa>=10)advice.push('Розглянути консультацію опікового центру: частковошарові опіки ≥10% TBSA є критерієм негайної консультації з розглядом переведення.');
if(full>0)advice.push('Будь-який повношаровий опік потребує негайної консультації опікового центру.');
if(checked('airway'))advice.push('Негайно залучити фахівця з ведення дихальних шляхів; не відкладати оцінку до розвитку обструкції.');
if(checked('smoke'))advice.push('Розглянути отруєння CO та ціанідами за обставинами; пульсоксиметрія не виключає CO-отруєння.');
if(checked('circ'))advice.push('Терміново перевірити дистальну перфузію і вентиляцію; питання есхаротомії вирішує підготовлений фахівець.');
if(checked('chemical'))advice.push('При хімічному ураженні: припинити контакт, видалити забруднений одяг, провести відповідну деконтамінацію; при електротравмі оцінити ЕКГ та супутні ушкодження.');
if(checked('infection'))advice.push('Ознаки інфекції/сепсису потребують невідкладної клінічної оцінки; не трактувати лихоманку окремо як доказ інфекції.');
if(checked('comorb'))advice.push('Супутні хвороби можуть змінювати поріг госпіталізації та обсяг моніторингу.');
if(inh)advice.push('Інгаляційне ураження: невідкладна оцінка дихальних шляхів, оксигенації, CO-отруєння та потреби у спеціалізованій допомозі.');
if(tbsa>0)advice.push('Оцінити локалізацію (обличчя, кисті, стопи, геніталії, промежина, суглоби), циркулярні опіки, хімічні та електричні механізми.');
advice.push('Контроль болю, профілактика гіпотермії, правцевий статус, стерильне сухе покриття; антибіотики системно не призначаються рутинно лише для профілактики інфекції.');
advice.push('Якщо є травматична кровотеча, шок може мати змішану етіологію: не пояснюйте гіпотензію лише опіком.');
$('advice').innerHTML='<ul>'+advice.map(a=>`<li>${a}</li>`).join('')+'</ul>';
}
$('clearRegions').addEventListener('click',()=>{regions.forEach(r=>grades.forEach(([id])=>$('grade-'+r.id+'-'+id).value=0));update()});
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',update));

$('print').onclick=()=>window.print();
$('save').onclick=()=>{let data={version:'0.8',savedAt:new Date().toISOString(),patient:{age:num('age'),weight:num('weight'),sex:$('sex').value,inhalation:$('inh').checked,hours:num('hours')},regions:regions.map(r=>({name:r.name,maximumTBSA:r.max,grades:Object.fromEntries(grades.map(([id])=>[id,num(`grade-${r.id}-${id}`)]))})),resuscitationFactor:num('factor'),flags:Object.fromEntries(flags.map(id=>[id,$(id).checked])),observations:observations.map(x=>({...x})),monitor:{urine:$('urine').value,sbp:$('sbp').value,hr:$('hr').value,lactate:$('lactate').value}};let a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='burn-calc-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('reset').onclick=()=>{observations=[];renderObservations();regions.forEach(r=>grades.forEach(([id])=>$(`grade-${r.id}-${id}`).value=0));['urine','sbp','hr','lactate'].forEach(id=>$(id).value='');flags.forEach(id=>$(id).checked=false);$('age').value=35;$('weight').value=70;$('hours').value=2;$('sex').value=0;$('factor').value=2;$('inh').checked=false;update()};
update();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// Observation intervals: non-overlapping, elapsed hours since burn; no patient identifiers.
let observations=[];
const obsNumber=id=>{const t=$(id).value.trim();return t===''?null:Number(t)};
const safeText=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderObservations(){
 const w=num('weight'),validW=Number.isFinite(w)&&w>0;
 const sum=key=>observations.reduce((a,r)=>a+r[key],0);
 const fluid=sum('fluid'),urine=sum('urine');
 $('obsSummary').innerHTML=`<div class="stats"><article><span>Записаних інтервалів</span><strong>${observations.length}</strong></article><article><span>Загалом інфузій (тільки записи)</span><strong>${fmt(fluid)} мл</strong></article><article><span>Загалом діурезу (тільки записи)</span><strong>${fmt(urine)} мл</strong></article></div>`;
 $('obsTable').querySelector('tbody').innerHTML=observations.map((r,i)=>`<tr><td>${r.start}–${r.end}</td><td>${fmt(r.fluid)}</td><td>${fmt(r.urine)}</td><td>${validW?(r.urine/((r.end-r.start)*w)).toFixed(2):'—'}</td><td>${r.sbp??'—'} / ${r.hr??'—'}</td><td>${r.lactate??'—'}</td><td><button class="secondary obsDelete" data-index="${i}" type="button">×</button></td></tr>`).join('');
 document.querySelectorAll('.obsDelete').forEach(b=>b.addEventListener('click',()=>{observations.splice(Number(b.dataset.index),1);renderObservations()}));
 const svg=$('obsChart');const pts=observations.map(r=>({x:(r.start+r.end)/2,y:validW?r.urine/((r.end-r.start)*w):0}));
 const maxY=Math.max(1.2,...pts.map(p=>p.y))*1.1;
 const x=t=>48+t/48*620,y=v=>198-v/maxY*165;
 let parts=[`<rect x="0" y="0" width="700" height="240" fill="#fff"/>`,`<line x1="48" y1="198" x2="668" y2="198" stroke="#8298a8"/>`,`<line x1="48" y1="30" x2="48" y2="198" stroke="#8298a8"/>`,`<line x1="48" y1="${y(.5)}" x2="668" y2="${y(.5)}" stroke="#c07737" stroke-dasharray="5 5"/>`,`<text x="53" y="${Math.max(18,y(.5)-7)}" font-size="12" fill="#9d591f">Орієнтир 0,5 мл/кг/год</text>`];
 for(const t of [0,8,16,24,32,40,48])parts.push(`<text x="${x(t)}" y="220" text-anchor="middle" font-size="11" fill="#58738a">${t}</text>`);
 if(pts.length>1)parts.push(`<polyline points="${pts.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')}" fill="none" stroke="#236b9c" stroke-width="2"/>`);
 pts.forEach(p=>parts.push(`<circle cx="${x(p.x)}" cy="${y(p.y)}" r="4" fill="#236b9c"><title>${p.x} год: ${p.y.toFixed(2)} мл/кг/год</title></circle>`));
 svg.innerHTML=parts.join('');
}
$('obsAdd').onclick=()=>{
 const start=obsNumber('obsStart'),end=obsNumber('obsEnd'),fluid=obsNumber('obsFluid'),urine=obsNumber('obsUrine');
 const sbp=obsNumber('obsSbp'),hr=obsNumber('obsHr'),lactate=obsNumber('obsLactate');
 const error=$('obsError');error.textContent='';
 if([start,end,fluid,urine].some(v=>v===null||!Number.isFinite(v))||start<0||end>48||end<=start||fluid<0||urine<0){error.textContent='Перевірте часовий інтервал (0–48 год) і невід’ємні об’єми.';return}
 if([sbp,hr,lactate].some(v=>v!==null&&(!Number.isFinite(v)||v<0))){error.textContent='Некоректні клінічні показники.';return}
 if(observations.some(r=>start<r.end&&end>r.start)){error.textContent='Інтервали не повинні перекриватися.';return}
 observations.push({start,end,fluid,urine,sbp,hr,lactate});observations.sort((a,b)=>a.start-b.start);
 $('obsStart').value=end;$('obsEnd').value=Math.min(48,end+1);renderObservations();
};
$('obsClear').onclick=()=>{observations=[];$('obsError').textContent='';renderObservations()};
function reportHtml(){
 const now=new Date().toLocaleString('uk-UA');const w=num('weight');
 const rows=observations.map(r=>`<tr><td>${r.start}–${r.end}</td><td>${r.fluid}</td><td>${r.urine}</td><td>${w>0?(r.urine/((r.end-r.start)*w)).toFixed(2):'—'}</td><td>${r.sbp??'—'}</td><td>${r.hr??'—'}</td><td>${r.lactate??'—'}</td></tr>`).join('');
 const regionsRows=regions.map(r=>({r,values:grades.map(([id])=>({id,val:num(`grade-${r.id}-${id}`)}))})).filter(({values})=>values.some(x=>x.val>0)).map(({r,values})=>`<tr><td>${safeText(r.name)}</td><td>${r.max}</td><td>${values.filter(x=>x.val>0).map(x=>`${safeText(x.id)}: ${x.val}%`).join('; ')}</td></tr>`).join('');
 return `<!doctype html><html lang="uk"><meta charset="utf-8"><title>Звіт BURN-CALC v0.8</title><style>body{font:14px/1.5 Arial;max-width:960px;margin:32px auto;color:#223}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #ccd;padding:6px;text-align:left}h1,h2{color:#245c82}.note{background:#f5f5f5;padding:12px}@media print{body{margin:0}}</style><h1>BURN-CALC v0.8 — клінічний протокол (прототип)</h1><p>Створено: ${safeText(now)}</p><p>Вік: ${num('age')} років; маса: ${w} кг; час від опіку: ${num('hours')} год.</p><h2>Площа опіків</h2><table><tr><th>Ділянка</th><th>Максимум TBSA, %</th><th>Ступені та частка ділянки</th></tr>${regionsRows}</table><h2>Розрахунки</h2>${$('results').innerHTML}<h2>Клінічний тріаж</h2>${$('triage').innerHTML}<h2>Рекомендації</h2>${$('advice').innerHTML}<h2>Спостереження</h2><table><tr><th>Години</th><th>Інфузія, мл</th><th>Діурез, мл</th><th>мл/кг/год</th><th>САТ</th><th>ЧСС</th><th>Лактат</th></tr>${rows}</table><p class="note">Навчальний прототип. Коефіцієнти малих сегментів наближені. Дані потребують перевірки лікарем; не використовувати як автономне призначення лікування.</p></html>`;
}
$('report').onclick=()=>{const blob=new Blob([reportHtml()],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='burn-calc-clinical-report.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)};
renderObservations();

$('weight').addEventListener('input',renderObservations);
