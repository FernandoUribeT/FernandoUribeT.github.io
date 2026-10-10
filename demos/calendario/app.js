(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logica.js'), root);
  else root.CalApp = factory(root.CalLogica, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (L, root) {
  'use strict';
  const S = {
    es: { months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'], days: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], types: {CP:'Cita a puerto',TL:'Despacho / vacío',TF:'Salida',ENTREGA:'Entrega'}, view:{month:'Mes',week:'Semana',day:'Día'}, today:'Hoy', create:'Agendar viaje', save:'Guardar viaje', cancel:'Cancelar', edit:'Editar', remove:'Eliminar viaje', reason:'Motivo de cancelación', client:'Cliente', cargo:'Tipo de carga', containers:'Contenedores (uno por línea)', ref:'Referencia', notes:'Notas', unit:'Unidad', driver:'Operador', line:'Línea', own:'Propia', subcontracted:'Subcontratada', provider:'Proveedor', date:'Fecha y hora', port:'Cita a puerto', local:'Flete local', long:'Flete foráneo', delivery:'Cita en Cedis', terminal:'Terminal', service:'Servicio', agent:'Agente aduanal', maneuver:'Maniobra', yard:'Patio', origin:'Origen', destination:'Destino', km:'Km de ruta', modality:'Modalidad', direct:'Directa', drop:'Drop', all:'Todos', types:'Tipos de evento', filters:'Filtros', count:'eventos visibles', colors:'Colores', global:'Predeterminado (Global)', availability:'Disponibilidad', tractor:'Tractores', trailer:'Remolques', free:'LIBRE', maintenance:'NO DISPONIBLE · EN MANTTO', onTrip:'NO DISPONIBLE · EN VIAJE', available:'Disponible desde', history:'Qué está pasando', reasonPast:'Fecha no permitida', noChange:'No se realizaron cambios', required:'Completa cliente, carga y al menos un evento; revisa los campos marcados.', success:'Viaje guardado', cancelled:'Viaje cancelado; se retiraron todos sus eventos.', movePrompt:'¿A qué hora?', dependent:'eventos dependientes también cambiarán.', confirm:'Confirmar movimiento', notesSaved:'Notas guardadas', daySummary:'Resumen del día', noEvents:'Sin eventos', month:'Mes', hour:'Hora', warning:'Aviso de mantenimiento preventivo', close:'Cerrar' },
    en: { months: ['January','February','March','April','May','June','July','August','September','October','November','December'], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], types: {CP:'Port appointment',TL:'Dispatch / empties',TF:'Departure',ENTREGA:'Delivery'}, view:{month:'Month',week:'Week',day:'Day'} }
  };
  const TYPES = ['CP','TL','TF','ENTREGA'];
  const pad = n => String(n).padStart(2,'0');
  const dateObj = day => new Date(Number(day.slice(0,4)), Number(day.slice(5,7))-1, Number(day.slice(8,10)));
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  function viewRange(view, selected) {
    if (view === 'day') return {start:selected,end:selected,days:1};
    const d = dateObj(selected);
    if (view === 'week') { d.setDate(d.getDate() - ((d.getDay()+6)%7));
 const start=dayKey(d);
 d.setDate(d.getDate()+6);
 return {start,end:dayKey(d),days:7};
 }
    d.setDate(1);
 d.setDate(d.getDate()-((d.getDay()+6)%7));
 const start=dayKey(d);
 d.setDate(d.getDate()+41);
 return {start,end:dayKey(d),days:42};
  }
  function shiftMonth(day, amount) {
    const d = dateObj(day);
    const preferredDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + amount);
    const finalDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(preferredDay, finalDay));
    return dayKey(d);
  }
  function pointerReleaseTarget(doc, event) {
    return doc && typeof doc.elementFromPoint === 'function'
      ? (doc.elementFromPoint(event.clientX, event.clientY) || event.target)
      : event.target;
  }
  function hourSlots() {
    return Array.from({ length: 24 }, (_, hour) => pad(hour));
  }

  function dayFromButton(button) {
    return button && button.dataset ? button.dataset.dayOpen : undefined;
  }

  function newTripDraft(day, trips) {
    const draft = L.newTripForDay(day, trips);
    return Object.assign({}, draft, { tl: null, tf: null });
  }

  function isExistingTrip(trip, trips) {
    return trips.includes(trip);
  }

  function optionMarkup(values, selected, emptyLabel) {
    const items = (values || []).map(item => typeof item === 'string'
      ? { value: item, label: item }
      : item);
    if (emptyLabel !== undefined) items.unshift({ value: '', label: emptyLabel });
    if (selected && !items.some(item => item.value === selected)) {
      items.push({ value: selected, label: selected });
    }
    return items.map(item => `<option value="${esc(item.value)}" ${item.value === selected ? 'selected' : ''}>${esc(item.label)}</option>`).join('');
  }
  function haulValues(section) {
    return section || {};
  }

  function monthCells(year, month, trips, filters, types) {
    const first=new Date(year,month,1);
 first.setDate(first.getDate()-((first.getDay()+6)%7));
    const events=L.filterEvents(L.allEvents(trips,'es'),filters,types);
    return Array.from({length:42},(_,i)=>{ const d=new Date(first);
 d.setDate(d.getDate()+i);
 const day=dayKey(d);
 return {day,events:events.filter(e=>e.day===day)};
 });
  }
  const esc = L.escapeHtml;
  function tripCardMarkup(trip, type) {
    const e=L.tripEvents(trip,'es').find(x=>x.type===type);
 const section=trip[{CP:'cp',TL:'tl',TF:'tf',ENTREGA:'delivery'}[type]]||{};
    const fields={CP:[['Fecha',section.datetime],['Servicio',section.service],['Terminal',section.terminal],['Agente aduanal',section.customsAgent],['Maniobra',section.maniobra?'Sí':'No']],TL:[['Fecha',section.datetime],['Patio',section.yard],['Unidad',section.unit],['Operador',section.driver],['Línea',section.line==='subcontracted'?section.provider:'Propia']],TF:[['Salida',section.datetime],['Unidad',section.unit],['Operador',section.driver],['Línea',section.line==='subcontracted'?section.provider:'Propia'],['Entrega',trip.delivery&&trip.delivery.datetime],['Modalidad',trip.delivery&&trip.delivery.modality],['Ruta',`${section.origin||''} → ${section.destination||''}`]],ENTREGA:[['Destino',section.destination],['Fecha de entrega',section.datetime],['Modalidad',section.modality],['Ruta',trip.tf&&`${trip.tf.origin} → ${trip.tf.destination}`],['Contenedores',trip.cargo&&trip.cargo.containers&&trip.cargo.containers.join(', ')]]};
    const actor = type === 'TL' ? (trip.tl || {}) : type === 'CP' ? (trip.tl || trip.tf || {}) : (trip.tf || {});
    const destination = (trip.delivery && trip.delivery.destination) || (trip.tf && trip.tf.destination) || '';
    const route = trip.tf && trip.tf.origin ? `${trip.tf.origin} → ${trip.tf.destination || destination}` : destination;
    const commonFields = [['Destino', destination], ['Ruta', route], ['Unidad', actor.unit], ['Operador', actor.driver]];
    const rows=[...commonFields,...(fields[type]||[])].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'—')}</dd></div>`).join('');
    const title=(e&&e.title)||S.es.types[type];
    return `<article class="trip-card" data-folio="${esc(trip.folio)}"><header class="trip-card-head" data-type="${esc(type)}"><div><strong>${esc(title)} · ${esc(trip.client)}</strong><span class="folio">Folio ${esc(trip.folio)}</span></div></header><dl class="trip-fields">${rows}</dl><label class="notes-label" for="trip-notes">Notas</label><div class="notes-preview">${L.linkify(trip.notes||'')}</div><textarea id="trip-notes" data-notes>${esc(trip.notes||'')}</textarea><div class="dialog-actions"><button data-action="save-notes">Guardar notas</button><button data-action="edit-trip">Editar</button><button class="danger" data-action="cancel-trip">Eliminar</button></div></article>`;
  }
  function init(doc, opts) {
    const D=doc||document, Lg=(opts&&opts.logic)||L, data=(opts&&opts.data)||root.CalDatos;
    const strings=S[(opts&&opts.lang)||'es']||S.es;
    const today=dayKey(new Date());
 let selected=today, view='month', trips=data.sampleTrips(today), units=data.sampleUnits(), maint=data.sampleMaintenances(today);
    const filters={clients:[],units:[],drivers:[]}, visibleTypes=new Set(TYPES), palette=readPalette();
    const $=id=>D.getElementById(id), rootEl=$('calendar-app');
    if(!rootEl)return null;
    function readPalette(){try{return JSON.parse(localStorage.getItem('demo-cal-palette')||'{"tenant":{},"clients":{}}');
}catch(_){return {tenant:{},clients:{}};
}}
    function persist(){try{localStorage.setItem('demo-cal-palette',JSON.stringify(palette));
}catch(_){}}
    const el=(tag,attrs={},html='')=>{const n=D.createElement(tag);
Object.keys(attrs).forEach(k=>n.setAttribute(k,attrs[k]));
n.innerHTML=html;
return n;
};
    function log(message,kind='ok'){const box=$('log');
const row=el('div',{class:`li ${kind}`,role:'status'},`<b>${kind==='no'?'Regla aplicada':'Acción'}</b>${esc(message)}`);
box.prepend(row);
while(box.children.length>6)box.lastChild.remove();
}
    function events(){return Lg.allEvents(trips,'es');
}
    function filtered(){return Lg.filterEvents(events(),filters,[...visibleTypes]);
}
    function color(e){return Lg.resolveColor(e.type,e.client,palette);
}
    function eventButton(e){const c=color(e);
return `<button class="ev" type="button" data-event="${e.folio}:${e.type}" data-type="${e.type}" style="--event-color:${c};--event-text:${Lg.readableTextColor(c)}" aria-label="${esc(strings.types[e.type])}, ${esc(e.title)}, folio ${e.folio}, ${esc(e.client)}">${esc(e.datetime.slice(11,16))} · ${esc(e.title)}</button>`;
}
    function cell(day, extra=''){const d=dateObj(day), ev=filtered().filter(e=>e.day===day);
return `<section class="day ${day===today?'today':''} ${day<today?'past':''} ${extra}" data-day="${day}"><button class="day-number" data-day-open="${day}" aria-label="Abrir ${day}">${d.getDate()}</button>${ev.map(eventButton).join('')||'<span class="empty-day">—</span>'}</section>`;
}
    function renderCalendar(){const nav=$('calendar-nav'), grid=$('calendar-grid'), d=dateObj(selected), range=viewRange(view,selected);
$('view-title').textContent=view==='month'?`${strings.months[d.getMonth()]} ${d.getFullYear()}`:view==='week'?`${range.start} — ${range.end}`:selected;
      D.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
      if(view==='month'){nav.innerHTML=strings.days.map(x=>`<span>${x}</span>`).join('');
grid.className='calendar-grid month-grid';
grid.innerHTML=monthCells(d.getFullYear(),d.getMonth(),trips,filters,[...visibleTypes]).map(c=>cell(c.day,c.day.slice(5,7)!==`${pad(d.getMonth()+1)}`?'out':'')).join('');
}
      else {nav.innerHTML='';
const dates=Array.from({length:range.days},(_,i)=>Lg.addDays(range.start,i));
grid.className='calendar-grid time-grid';
grid.innerHTML=dates.map(day=>`<div class="time-day"><h3>${day}</h3>${hourSlots().map(hour=>`<div class="hour-slot" data-slot="${day}T${hour}:00"><span>${hour}:00</span>${filtered().filter(e=>e.day===day&&e.datetime.slice(11,13)===hour).map(eventButton).join('')}</div>`).join('')}</div>`).join('');
}
      $('event-count').textContent=`${filtered().length} / ${events().length} ${strings.count}`;
    }
    function populateFilters(){[['filter-client','clients','client'],['filter-unit','units','unit'],['filter-driver','drivers','driver']].forEach(([id,key,label])=>{const vals=[...new Set(events().map(e=>e[label]).filter(Boolean))].sort();
$(id).multiple=true;
$(id).size=3;
$(id).innerHTML=vals.map(v=>`<option>${esc(v)}</option>`).join('');
$(id).onchange=()=>{filters[key]=Array.from($(id).selectedOptions).map(o=>o.value);
renderCalendar();
renderFilterChips();
};
});
}
    function renderFilterChips(){const labels={clients:'Cliente',units:'Unidad',drivers:'Operador'};
$('filter-chips').innerHTML=Object.entries(filters).flatMap(([k,values])=>values.map(v=>`<button class="filter-chip" data-remove-filter="${k}" data-value="${esc(v)}">${labels[k]}: ${esc(v)} ×</button>`)).join('');
}
    function renderColors(){const type=$('color-type').value, client=$('color-client').value, current=client&&type!=='ENTREGA'&&palette.clients[client]&&palette.clients[client][type]||palette.tenant[type]||Lg.DEFAULT_COLORS[type];
$('color-input').value=current;
}
    function renderAvailability(){const rows=units.map(u=>{const status=Lg.unitStatus(u,trips,maint,today);
const warning=Lg.serviceWarning(u,Math.max(0,...trips.filter(t=>t.status!=='cancelled'&&t.tf&&t.tf.unit===u.eco).map(t=>Number(t.tf.distanceKm)||0)));
return `<tr><th>${esc(u.eco)} · ${esc(u.plate)}</th><td>${u.kind==='tractor'?strings.tractor:strings.trailer}</td><td class="${status.status==='free'?'free':'unavailable'}">${status.status==='free'?strings.free:status.reason==='maintenance'?strings.maintenance:strings.onTrip}</td><td>${status.availableOn?`${strings.available} ${status.availableOn}`:'—'}</td><td>${warning?`${strings.warning}: ${warning.level==='soon'?warning.remainingKm+' km restantes':warning.overKm+' km vencidos'}`:'—'}</td></tr>`;
}).join('');
$('availability-body').innerHTML=rows;
}
    function dayClick(day){const c=Lg.classifyDay(day,trips,new Date().toISOString().slice(0,16));
if(c==='past_empty'){log(strings.reasonPast,'no');
return;
}if(c==='open_empty'){openForm(newTripDraft(day,trips));
return;
}openSummary(day);
}
    function openSummary(day){const summary=Lg.daySummary(day,trips,'es');
const counts=TYPES.map(t=>`${strings.types[t]}: ${summary.counts[t]}`).join(' · ');
showDialog(`<h2>${strings.daySummary} · ${day}</h2><p>${esc(counts)}</p>${summary.events.length?summary.events.map(e=>`<button class="summary-event" data-event="${e.folio}:${e.type}">${esc(e.datetime.slice(11,16))} · ${esc(e.title)} · Folio ${e.folio}</button>`).join(''):`<p>${strings.noEvents}</p>`}${day>=today?`<button data-action="new-from-day" data-day="${day}">${strings.create}</button>`:''}`);
}
    function showDialog(markup){const dlg=$('dialog');
dlg.innerHTML=`<div class="dialog-backdrop"><section class="dialog" role="dialog" aria-modal="true" tabindex="-1">${markup}<button class="dialog-close" data-action="close" aria-label="${strings.close}">×</button></section></div>`;
dlg.hidden=false;
dlg.querySelector('.dialog').focus();
}
    function closeDialog(){const dlg=$('dialog');
dlg.hidden=true;
dlg.innerHTML='';
}
    function openCard(folio,type){const t=trips.find(x=>x.folio===Number(folio));
if(t)showDialog(tripCardMarkup(t,type));
}
    function formMarkup(t){const sec=(name,o)=>`<fieldset><legend>${name}</legend><label>${strings.date}<input name="${o}.datetime" type="datetime-local" value="${esc(t[o]&&t[o].datetime||'')}"></label>${o==='cp'?`<label>${strings.service}<select name="cp.service">${optionMarkup([{value:'import',label:'Importación'},{value:'export',label:'Exportación'},{value:'empty_return',label:'Devolución de vacío'}],t.cp&&t.cp.service)}</select></label><label>${strings.terminal}<select name="cp.terminal">${optionMarkup(data.CATALOG.terminals,t.cp&&t.cp.terminal)}</select></label><label>${strings.agent}<select name="cp.customsAgent">${optionMarkup(data.CATALOG.customsAgents,t.cp&&t.cp.customsAgent)}</select></label><label><input name="cp.maniobra" type="checkbox" ${t.cp&&t.cp.maniobra?'checked':''}> ${strings.maneuver}</label>`:o==='tl'?haulFields('tl',t.tl):o==='tf'?`${haulFields('tf',t.tf)}<label>${strings.origin}<input name="tf.origin" value="${esc(t.tf&&t.tf.origin||'')}"></label><label>${strings.destination}<input name="tf.destination" value="${esc(t.tf&&t.tf.destination||'')}"></label><label>${strings.km}<input name="tf.distanceKm" type="number" min="0" value="${esc(t.tf&&t.tf.distanceKm||0)}"></label>`:`<label>${strings.destination}<input name="delivery.destination" value="${esc(t.delivery&&t.delivery.destination||'')}"></label><label>${strings.modality}<select name="delivery.modality">${optionMarkup([{value:'direct',label:strings.direct},{value:'drop',label:strings.drop}],t.delivery&&t.delivery.modality)}</select></label>`}</fieldset>`;
      function haulFields(k,s={}){s=haulValues(s);return `<label>${strings.line}<select name="${k}.line">${optionMarkup([{value:'own',label:strings.own},{value:'subcontracted',label:strings.subcontracted}],s.line||'own')}</select></label><label>${strings.provider}<select name="${k}.provider">${optionMarkup(data.CATALOG.providers,s.provider,'—')}</select></label><label>${strings.unit}<input name="${k}.unit" value="${esc(s.unit||'')}"></label><label>${strings.driver}<select name="${k}.driver">${optionMarkup(data.CATALOG.drivers,s.driver,'—')}</select></label>${k==='tl'?`<label>${strings.yard}<select name="tl.yard">${optionMarkup(data.CATALOG.yards,t.tl&&t.tl.yard)}</select></label>`:''}`;
}
      return `<h2>${isExistingTrip(t,trips)?'Editar viaje':'Nuevo viaje'}</h2><form data-trip-form data-folio="${esc(t.folio||'')}"><fieldset><legend>Referencia</legend><label>${strings.ref}<input name="reference" value="${esc(t.reference||'')}"></label><label>${strings.client}<select name="client" required><option value="">—</option>${data.CATALOG.clients.map(x=>`<option ${x===t.client?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>${strings.cargo}<select name="cargo" required><option value="containerized" ${t.cargo&&t.cargo.type==='containerized'?'selected':''}>Contenedorizada</option><option value="loose" ${t.cargo&&t.cargo.type==='loose'?'selected':''}>Carga suelta</option></select></label><label>${strings.containers}<textarea name="containers">${esc(t.cargo&&t.cargo.containers&&t.cargo.containers.join('\n')||'')}</textarea></label></fieldset>${sec(strings.port,'cp')}${sec(strings.local,'tl')}${sec(strings.long,'tf')}${sec(strings.delivery,'delivery')}<p class="form-error" aria-live="polite"></p><div class="dialog-actions"><button type="submit">${strings.save}</button><button type="button" data-action="close">${strings.cancel}</button></div></form>`;
    }
    function openForm(t){showDialog(formMarkup(t));
}
    function formToTrip(form,old){const v=Object.fromEntries(new FormData(form).entries());
const get=k=>v[k]||'';
const build=(k,extra={})=>get(`${k}.datetime`)?Object.assign({datetime:get(`${k}.datetime`)},extra):null;
const haul=(k,extra={})=>get(`${k}.datetime`)?Object.assign({datetime:get(`${k}.datetime`),line:get(`${k}.line`),provider:get(`${k}.provider`),unit:get(`${k}.unit`),driver:get(`${k}.driver`)},extra):null;
const containers=(get('containers').split('\n').map(x=>x.trim()).filter(Boolean));
return Object.assign({},old,{reference:get('reference'),client:get('client'),cargo:get('cargo')==='loose'?{type:'loose',containers:[]}:{type:'containerized',containers},cp:build('cp',{service:get('cp.service'),terminal:get('cp.terminal'),customsAgent:get('cp.customsAgent'),maniobra:form.elements['cp.maniobra'].checked}),tl:haul('tl',{yard:get('tl.yard')}),tf:haul('tf',{origin:get('tf.origin'),destination:get('tf.destination'),distanceKm:Number(get('tf.distanceKm'))}),delivery:build('delivery',{destination:get('delivery.destination'),modality:get('delivery.modality')}),notes:old.notes||''});
}
    function saveTrip(form){const old=trips.find(t=>t.folio===Number(form.dataset.folio))||{folio:L.nextFolio(trips),status:'active',notes:''};
const next=formToTrip(form,old);
const errors=Lg.validateTrip(next,trips);
if(errors.length){form.querySelector('.form-error').textContent=`${strings.required} ${errors.join(', ')}`;
return;
}if(!next.cp&&!next.tl&&!next.tf){form.querySelector('.form-error').textContent=strings.required;
return;
}if(old.folio&&trips.includes(old))trips=trips.map(t=>t.folio===old.folio?next:t);
else trips=trips.concat(next);
closeDialog();
renderCalendar();
renderAvailability();
populateFilters();
log(strings.success);
const unit=units.find(u=>u.eco===(next.tf&&next.tf.unit));
const warn=unit&&Lg.serviceWarning(unit,next.tf.distanceKm);
if(warn)showDialog(`<h2>${strings.warning}</h2><p>${warn.level==='soon'?`La unidad quedará a ${warn.remainingKm} km del servicio preventivo.`:`La ruta excede el servicio preventivo por ${warn.overKm} km.`}</p><button data-action="close">${strings.close}</button>`);
}
    function changeColor(){const t=$('color-type').value,c=$('color-client').value,value=$('color-input').value;
if(c&&t!=='ENTREGA'){palette.clients[c]=palette.clients[c]||{};
palette.clients[c][t]=value;
}else palette.tenant[t]=value;
persist();
renderCalendar();
log(`Color actualizado: ${c||strings.global} · ${strings.types[t]}.`);
}
    function openMove(ref, day, time){const [folio,type]=ref.split(':');
const trip=trips.find(t=>t.folio===Number(folio));
const section=trip&&trip[{CP:'cp',TL:'tl',TF:'tf',ENTREGA:'delivery'}[type]];
if(!section)return;
const old=section.datetime;
if(view==='month'){if(day<today){log(`Movimiento rechazado: past_day`,'no');
return;
}showDialog(`<h2>${strings.movePrompt}</h2><label>${strings.hour}<input id="move-time" type="time" value="${old.slice(11,16)}"></label><button data-action="confirm-move" data-event="${ref}" data-day="${day}">${strings.confirm}</button>`);
return;
}const proposed=`${day}T${time||old.slice(11,16)}`;
const checked=Lg.evaluateMove(trips,{folio:Number(folio),type},proposed,Lg.fromDate(new Date()));
if(!checked.ok){log(`Movimiento rechazado: ${checked.reason}`,'no');
return;
}confirmMove(ref,proposed);
}
    function confirmMove(ref,dt){const [folio,type]=ref.split(':');
const result=Lg.evaluateMove(trips,{folio:Number(folio),type},dt,Lg.fromDate(new Date()));
if(!result.ok){closeDialog();
log(`Movimiento rechazado: ${result.reason}`,'no');
return;
}if(result.dependents&&!window.confirm(`${result.dependents} ${strings.dependent} ${strings.confirm}?`)){closeDialog();
return;
}trips=Lg.applyMove(trips,result.changes);
closeDialog();
renderCalendar();
renderAvailability();
log(`${strings.confirm}: ${result.changes.length} evento(s).`);
}
    rootEl.addEventListener('click',e=>{const chip=e.target.closest('[data-remove-filter]');
if(chip){const key=chip.dataset.removeFilter;
filters[key]=filters[key].filter(x=>x!==chip.dataset.value);
const ids={clients:'filter-client',units:'filter-unit',drivers:'filter-driver'};
Array.from($(ids[key]).options).forEach(o=>{o.selected=filters[key].includes(o.value);
});
renderFilterChips();
renderCalendar();
return;
}const event=e.target.closest('[data-event]');
if(event&&!e.target.closest('[data-action="confirm-move"]')){const [f,t]=event.dataset.event.split(':');
openCard(f,t);
return;
}const action=e.target.closest('[data-action]');
if(action){const a=action.dataset.action;
if(a==='close')closeDialog();
if(a==='new-from-day'){closeDialog();
openForm(Lg.newTripForDay(action.dataset.day,trips));
}if(a==='edit-trip'){const card=e.target.closest('.trip-card');
const t=trips.find(x=>x.folio===Number(card.dataset.folio));
if(t)openForm(t);
}if(a==='save-notes'){const card=e.target.closest('.trip-card'),t=trips.find(x=>x.folio===Number(card.dataset.folio));
t.notes=card.querySelector('[data-notes]').value;
log(strings.notesSaved);
closeDialog();
}if(a==='cancel-trip'){const card=e.target.closest('.trip-card'),folio=Number(card.dataset.folio);
showDialog(`<h2>${strings.remove}</h2><label>${strings.reason}<textarea id="cancel-reason" required></textarea></label><button data-action="confirm-cancel" data-folio="${folio}">${strings.remove}</button>`);
}if(a==='confirm-cancel'){const r=Lg.cancelTrip(trips,Number(action.dataset.folio),$('cancel-reason').value);
if(r.ok){trips=r.trips;
closeDialog();
renderCalendar();
renderAvailability();
log(strings.cancelled);
}else log(strings.reason,'no');
}if(a==='confirm-move'){const [f,t]=action.dataset.event.split(':');
confirmMove(`${f}:${t}`,`${action.dataset.day}T${$('move-time').value}`);
}return;
}
      const day=e.target.closest('[data-day-open]');
if(day)dayClick(dayFromButton(day));
});
    rootEl.addEventListener('submit',e=>{if(e.target.matches('[data-trip-form]')){e.preventDefault();
saveTrip(e.target);
}});
    $('prev').onclick=()=>{if(view==='month')selected=shiftMonth(selected,-1);
else {const d=dateObj(selected);
d.setDate(d.getDate()-(view==='week'?7:1));
selected=dayKey(d);
}
renderCalendar();
};
$('next').onclick=()=>{const d=dateObj(selected);
if(view==='month')selected=shiftMonth(selected,1);
else {d.setDate(d.getDate()+(view==='week'?7:1));
selected=dayKey(d);
}
renderCalendar();
};
$('today').onclick=()=>{selected=today;
renderCalendar();
};
D.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;
renderCalendar();
});
$('new-trip').onclick=()=>openForm(newTripDraft(selected,trips));
$('types').onchange=e=>{if(e.target.matches('[data-type-toggle]')){e.target.checked?visibleTypes.add(e.target.value):visibleTypes.delete(e.target.value);
renderCalendar();
}};
    $('color-type').onchange=renderColors;
$('color-client').onchange=renderColors;
$('color-input').onchange=changeColor;
$('availability-tab').onclick=()=>{$('availability').hidden=false;
$('calendar-section').hidden=true;
};
$('calendar-tab').onclick=()=>{$('availability').hidden=true;
$('calendar-section').hidden=false;
};
$('clear-filters').onclick=()=>{Object.keys(filters).forEach(k=>filters[k]=[]);
['filter-client','filter-unit','filter-driver'].forEach(id=>Array.from($(id).options).forEach(o=>o.selected=false));
renderFilterChips();
renderCalendar();
};
    let drag=null;
rootEl.addEventListener('pointerdown',e=>{const b=e.target.closest('.ev');
if(b)drag={ref:b.dataset.event,x:e.clientX,y:e.clientY,active:false};
});
rootEl.addEventListener('pointermove',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8)drag.active=true;
});
rootEl.addEventListener('pointerup',e=>{if(!drag)return;
const d=drag;
drag=null;
if(!d.active)return;
const releaseTarget=pointerReleaseTarget(D,e);
const target=releaseTarget.closest('[data-day]');
const slot=releaseTarget.closest('[data-slot]');
if(target)openMove(d.ref,target.dataset.day);
else if(slot)openMove(d.ref,slot.dataset.slot.slice(0,10),slot.dataset.slot.slice(11,16));
});
rootEl.addEventListener('pointercancel',()=>{drag=null;
});
    populateFilters();
renderFilterChips();
renderColors();
renderCalendar();
renderAvailability();
if (D.addEventListener) D.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('dialog').hidden) closeDialog();
    });
    return {get trips(){return trips;
},renderCalendar,dayClick,openForm};
  }
  return Object.freeze({init,dayFromButton,hourSlots,monthCells,newTripDraft,isExistingTrip,optionMarkup,haulValues,viewRange,shiftMonth,pointerReleaseTarget,tripCardMarkup});
});
