(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logica.js'), root);
  else root.CalApp = factory(root.CalLogica, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (L, root) {
  'use strict';
  const S = {
    es: {
      months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'], days: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
      types: {CP:'Cita a puerto',TL:'Despacho / vacío',TF:'Salida',ENTREGA:'Entrega'}, view:{month:'Mes',week:'Semana',day:'Día'},
      today:'Hoy', openDay:'Abrir', create:'Agendar viaje', newTrip:'Nuevo viaje', editTrip:'Editar viaje', save:'Guardar viaje', saveNotes:'Guardar notas', folio:'Folio', cancel:'Cancelar', edit:'Editar', remove:'Eliminar viaje', cancelTrip:'Eliminar viaje', reason:'Motivo de cancelación',
      client:'Cliente', cargo:'Tipo de carga', containers:'Contenedores (uno por línea)', ref:'Referencia', reference:'Referencia', notes:'Notas', unit:'Unidad', driver:'Operador', line:'Línea', own:'Propia', subcontracted:'Subcontratada', provider:'Proveedor', date:'Fecha y hora', port:'Cita a puerto', local:'Flete local', long:'Flete foráneo', delivery:'Cita en Cedis', terminal:'Terminal', service:'Servicio', agent:'Agente aduanal', maneuver:'Maniobra', yard:'Patio', origin:'Origen', destination:'Destino', km:'Km de ruta', modality:'Modalidad', direct:'Directa', drop:'Drop',
      all:'Todos', allUnits:'Todas', typesHeading:'Tipos de evento', filters:'Filtros', count:'eventos visibles', colors:'Colores', global:'Predeterminado (Global)', availability:'Disponibilidad', tractor:'Tractores', trailer:'Remolques', free:'LIBRE', maintenance:'NO DISPONIBLE · EN MANTTO', onTrip:'NO DISPONIBLE · EN VIAJE', available:'Disponible desde', history:'Qué está pasando', reasonPast:'Fecha no permitida', noChange:'No se realizaron cambios', required:'Completa cliente, carga y al menos un evento; revisa los campos marcados.', success:'Viaje guardado', cancelled:'Viaje cancelado; se retiraron todos sus eventos.', movePrompt:'¿A qué hora?', dependentOne:'1 evento dependiente también cambiará. ¿Confirmar movimiento?', dependentMany:'{count} eventos dependientes también cambiarán. ¿Confirmar movimiento?', confirm:'Confirmar movimiento', moveCompleted:'Movimiento confirmado', eventsMoved:'eventos movidos', notesSaved:'Notas guardadas', daySummary:'Resumen del día', noEvents:'Sin eventos', month:'Mes', hour:'Hora', warning:'Aviso de mantenimiento preventivo', close:'Cerrar',
      action:'Acción', ruleApplied:'Regla aplicada', movementRejected:'Movimiento rechazado', colorUpdated:'Color actualizado', maintenanceSoon:'Servicio preventivo en {distance}.', maintenanceOverdue:'La ruta excede el servicio preventivo por {distance}.', distanceRemaining:'km restantes', distanceOverdue:'km vencidos', clearFilters:'Limpiar filtros', event:'Evento', color:'Color del evento',
      cargoOptions:{containerized:'Contenedorizada',loose:'Carga suelta'}, serviceOptions:{import:'Importación',export:'Exportación',empty_return:'Devolución de vacío'},
      fields:{destination:'Destino',route:'Ruta',unit:'Unidad',driver:'Operador',date:'Fecha',service:'Servicio',terminal:'Terminal',agent:'Agente aduanal',maneuver:'Maniobra',yes:'Sí',no:'No',yard:'Patio',line:'Línea',departure:'Salida',delivery:'Entrega',modality:'Modalidad',deliveryDate:'Fecha de entrega',containers:'Contenedores'},
      filterLabels:{clients:'Cliente',units:'Unidad',drivers:'Operador'},
      validation:{client_required:'falta cliente',cargo_required:'falta tipo de carga',no_event_section:'agrega al menos un evento',cp_datetime_required:'falta fecha de cita a puerto',tl_datetime_required:'falta fecha del flete local',tl_provider_required:'falta proveedor local',tl_unit_required:'falta unidad local',tl_driver_required:'falta operador local',tf_datetime_required:'falta fecha de salida',tf_provider_required:'falta proveedor foráneo',tf_unit_required:'falta unidad foránea',tf_driver_required:'falta operador foráneo',delivery_datetime_required:'falta fecha de entrega',departure_after_delivery:'la salida es posterior a la entrega',reference_duplicate:'la referencia ya existe'},
      moveReasons:{invalid_datetime:'fecha u hora inválida',event_not_found:'no se encontró el evento',past_day:'no se permiten fechas pasadas',past_hour:'no se permiten horas pasadas',tf_not_after_cp:'la salida debe ser posterior a la cita a puerto'}
    },
    en: {
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      types: {CP:'Port appointment',TL:'Dispatch / empties',TF:'Departure',ENTREGA:'Delivery'}, view:{month:'Month',week:'Week',day:'Day'},
      today:'Today', openDay:'Open', create:'Schedule trip', newTrip:'New trip', editTrip:'Edit trip', save:'Save trip', saveNotes:'Save notes', folio:'Folio', cancel:'Cancel', edit:'Edit', remove:'Delete trip', cancelTrip:'Cancel trip', reason:'Cancellation reason',
      client:'Client', cargo:'Cargo type', containers:'Containers (one per line)', ref:'Reference', reference:'Reference', notes:'Notes', unit:'Unit', driver:'Driver', line:'Line', own:'Owned', subcontracted:'Subcontracted', provider:'Provider', date:'Date and time', port:'Port appointment', local:'Local haul', long:'Long-haul departure', delivery:'Distribution center delivery', terminal:'Terminal', service:'Service', agent:'Customs agent', maneuver:'Maneuver', yard:'Yard', origin:'Origin', destination:'Destination', km:'Route distance (km)', modality:'Delivery mode', direct:'Direct', drop:'Drop',
      all:'All clients', allUnits:'All units', typesHeading:'Event types', filters:'Filters', count:'events visible', colors:'Colors', global:'Default (global)', availability:'Availability', tractor:'Tractors', trailer:'Trailers', free:'AVAILABLE', maintenance:'UNAVAILABLE · IN MAINTENANCE', onTrip:'UNAVAILABLE · ON A TRIP', available:'Available from', history:'Activity', reasonPast:'Date is not allowed', noChange:'No changes were made', required:'Complete the client, cargo type, and at least one event; check the highlighted fields.', success:'Trip saved', cancelled:'Trip cancelled; all of its events were removed.', movePrompt:'Choose a time', dependentOne:'1 dependent event will also move. Confirm the move?', dependentMany:'{count} dependent events will also move. Confirm the move?', confirm:'Confirm move', moveCompleted:'Move confirmed', eventsMoved:'events moved', notesSaved:'Notes saved', daySummary:'Day summary', noEvents:'No events', month:'Month', hour:'Time', warning:'Preventive maintenance warning', close:'Close',
      action:'Action', ruleApplied:'Rule applied', movementRejected:'Move rejected', colorUpdated:'Color updated', maintenanceSoon:'Preventive maintenance is due within {distance}.', maintenanceOverdue:'This route is {distance} past the preventive service interval.', distanceRemaining:'km remaining', distanceOverdue:'km overdue', clearFilters:'Clear filters', event:'Event', color:'Event color',
      cargoOptions:{containerized:'Containerized',loose:'Loose cargo'}, serviceOptions:{import:'Import',export:'Export',empty_return:'Empty return'},
      fields:{destination:'Destination',route:'Route',unit:'Unit',driver:'Driver',date:'Date',service:'Service',terminal:'Terminal',agent:'Customs agent',maneuver:'Maneuver',yes:'Yes',no:'No',yard:'Yard',line:'Line',departure:'Departure',delivery:'Delivery',modality:'Delivery mode',deliveryDate:'Delivery date',containers:'Containers'},
      filterLabels:{clients:'Client',units:'Unit',drivers:'Driver'},
      validation:{client_required:'client is required',cargo_required:'cargo type is required',no_event_section:'add at least one event',cp_datetime_required:'port appointment date and time are required',tl_datetime_required:'local haul date and time are required',tl_provider_required:'local haul provider is required',tl_unit_required:'local haul unit is required',tl_driver_required:'local haul driver is required',tf_datetime_required:'departure date and time are required',tf_provider_required:'long-haul provider is required',tf_unit_required:'long-haul unit is required',tf_driver_required:'long-haul driver is required',delivery_datetime_required:'delivery date and time are required',departure_after_delivery:'departure is after delivery',reference_duplicate:'reference already exists'},
      moveReasons:{invalid_datetime:'invalid date or time',event_not_found:'event was not found',past_day:'past dates are not allowed',past_hour:'past times are not allowed',tf_not_after_cp:'departure must be after the port appointment'}
    }
  };
  function stringsFor(lang) {
    return S[lang] || S.es;
  }
  function maintenanceMessage(warning, lang='es') {
    if (!warning) return '';
    const copy = stringsFor(lang);
    const soon = warning.level === 'soon';
    const amount = soon ? warning.remainingKm : warning.overKm;
    const distance = lang === 'en' ? `${amount} km` : `${amount} ${soon ? copy.distanceRemaining : copy.distanceOverdue}`;
    return (soon ? copy.maintenanceSoon : copy.maintenanceOverdue).replace('{distance}', distance);
  }
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

  function monthCells(year, month, trips, filters, types, lang='es') {
    const first=new Date(year,month,1);
 first.setDate(first.getDate()-((first.getDay()+6)%7));
    const events=L.filterEvents(L.allEvents(trips,lang),filters,types);
    return Array.from({length:42},(_,i)=>{ const d=new Date(first);
 d.setDate(d.getDate()+i);
 const day=dayKey(d);
 return {day,events:events.filter(e=>e.day===day)};
 });
  }
  const esc = L.escapeHtml;
  function tripCardMarkup(trip, type, lang='es') {
    const copy=stringsFor(lang), fieldsCopy=copy.fields;
    const e=L.tripEvents(trip,lang).find(x=>x.type===type);
 const section=trip[{CP:'cp',TL:'tl',TF:'tf',ENTREGA:'delivery'}[type]]||{};
    const service=copy.serviceOptions[section.service]||section.service;
    const deliveryMode=value=>value==='direct'?copy.direct:value==='drop'?copy.drop:value;
    const fields={CP:[[fieldsCopy.date,section.datetime],[fieldsCopy.service,service],[fieldsCopy.terminal,section.terminal],[fieldsCopy.agent,section.customsAgent],[fieldsCopy.maneuver,section.maniobra?fieldsCopy.yes:fieldsCopy.no]],TL:[[fieldsCopy.date,section.datetime],[fieldsCopy.yard,section.yard],[fieldsCopy.unit,section.unit],[fieldsCopy.driver,section.driver],[fieldsCopy.line,section.line==='subcontracted'?section.provider:copy.own]],TF:[[fieldsCopy.departure,section.datetime],[fieldsCopy.unit,section.unit],[fieldsCopy.driver,section.driver],[fieldsCopy.line,section.line==='subcontracted'?section.provider:copy.own],[fieldsCopy.delivery,trip.delivery&&trip.delivery.datetime],[fieldsCopy.modality,trip.delivery&&deliveryMode(trip.delivery.modality)],[fieldsCopy.route,`${section.origin||''} → ${section.destination||''}`]],ENTREGA:[[fieldsCopy.destination,section.destination],[fieldsCopy.deliveryDate,section.datetime],[fieldsCopy.modality,deliveryMode(section.modality)],[fieldsCopy.route,trip.tf&&`${trip.tf.origin} → ${trip.tf.destination}`],[fieldsCopy.containers,trip.cargo&&trip.cargo.containers&&trip.cargo.containers.join(', ')]]};
    const actor = type === 'TL' ? (trip.tl || {}) : type === 'CP' ? (trip.tl || trip.tf || {}) : (trip.tf || {});
    const destination = (trip.delivery && trip.delivery.destination) || (trip.tf && trip.tf.destination) || '';
    const route = trip.tf && trip.tf.origin ? `${trip.tf.origin} → ${trip.tf.destination || destination}` : destination;
    const commonFields = [[fieldsCopy.destination, destination], [fieldsCopy.route, route], [fieldsCopy.unit, actor.unit], [fieldsCopy.driver, actor.driver]];
    const rows=[...commonFields,...(fields[type]||[])].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'—')}</dd></div>`).join('');
    const title=(e&&e.title)||copy.types[type];
    return `<article class="trip-card" data-folio="${esc(trip.folio)}"><header class="trip-card-head" data-type="${esc(type)}"><div><strong>${esc(title)} · ${esc(trip.client)}</strong><span class="folio">${esc(copy.folio)} ${esc(trip.folio)}</span></div></header><dl class="trip-fields">${rows}</dl><label class="notes-label" for="trip-notes">${copy.notes}</label><div class="notes-preview">${L.linkify(trip.notes||'')}</div><textarea id="trip-notes" data-notes>${esc(trip.notes||'')}</textarea><div class="dialog-actions"><button data-action="save-notes">${copy.saveNotes}</button><button data-action="edit-trip">${copy.edit}</button><button class="danger" data-action="cancel-trip">${copy.cancelTrip}</button></div></article>`;
  }
  function init(doc, opts) {
    const D=doc||document, Lg=(opts&&opts.logic)||L, data=(opts&&opts.data)||root.CalDatos;
    const lang=(opts&&opts.lang)||'es', strings=stringsFor(lang);
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
const row=el('div',{class:`li ${kind}`,role:'status'},`<b>${kind==='no'?strings.ruleApplied:strings.action}</b>${esc(message)}`);
box.prepend(row);
while(box.children.length>6)box.lastChild.remove();
}
    function events(){return Lg.allEvents(trips,lang);
}
    function filtered(){return Lg.filterEvents(events(),filters,[...visibleTypes]);
}
    function color(e){return Lg.resolveColor(e.type,e.client,palette);
}
    function eventButton(e){const c=color(e);
return `<button class="ev" type="button" data-event="${e.folio}:${e.type}" data-type="${e.type}" style="--event-color:${c};--event-text:${Lg.readableTextColor(c)}" aria-label="${esc(strings.types[e.type])}, ${esc(e.title)}, folio ${e.folio}, ${esc(e.client)}">${esc(e.datetime.slice(11,16))} · ${esc(e.title)}</button>`;
}
    function cell(day, extra=''){const d=dateObj(day), ev=filtered().filter(e=>e.day===day);
return `<section class="day ${day===today?'today':''} ${day<today?'past':''} ${extra}" data-day="${day}"><button class="day-number" data-day-open="${day}" aria-label="${strings.openDay} ${day}">${d.getDate()}</button>${ev.map(eventButton).join('')||'<span class="empty-day">—</span>'}</section>`;
}
    function renderCalendar(){const nav=$('calendar-nav'), grid=$('calendar-grid'), d=dateObj(selected), range=viewRange(view,selected);
$('view-title').textContent=view==='month'?`${strings.months[d.getMonth()]} ${d.getFullYear()}`:view==='week'?`${range.start} — ${range.end}`:selected;
      D.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
      if(view==='month'){nav.innerHTML=strings.days.map(x=>`<span>${x}</span>`).join('');
grid.className='calendar-grid month-grid';
grid.innerHTML=monthCells(d.getFullYear(),d.getMonth(),trips,filters,[...visibleTypes],lang).map(c=>cell(c.day,c.day.slice(5,7)!==`${pad(d.getMonth()+1)}`?'out':'')).join('');
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
    function renderFilterChips(){const labels=strings.filterLabels;
$('filter-chips').innerHTML=Object.entries(filters).flatMap(([k,values])=>values.map(v=>`<button class="filter-chip" data-remove-filter="${k}" data-value="${esc(v)}">${labels[k]}: ${esc(v)} ×</button>`)).join('');
}
    function renderColors(){const type=$('color-type').value, clientControl=$('color-client');
if(type==='ENTREGA')clientControl.value='';
clientControl.disabled=type==='ENTREGA';
const client=clientControl.value, current=client&&palette.clients[client]&&palette.clients[client][type]||palette.tenant[type]||Lg.DEFAULT_COLORS[type];
$('color-input').value=current;
}
    function renderAvailability(){const rows=units.map(u=>{const status=Lg.unitStatus(u,trips,maint,today);
const warning=Lg.serviceWarning(u,Math.max(0,...trips.filter(t=>t.status!=='cancelled'&&t.tf&&t.tf.unit===u.eco).map(t=>Number(t.tf.distanceKm)||0)));
return `<tr><th>${esc(u.eco)} · ${esc(u.plate)}</th><td>${u.kind==='tractor'?strings.tractor:strings.trailer}</td><td class="${status.status==='free'?'free':'unavailable'}">${status.status==='free'?strings.free:status.reason==='maintenance'?strings.maintenance:strings.onTrip}</td><td>${status.availableOn?`${strings.available} ${status.availableOn}`:'—'}</td><td>${warning?`${strings.warning}: ${maintenanceMessage(warning,lang)}`:'—'}</td></tr>`;
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
    function openSummary(day){const summary=Lg.daySummary(day,trips,lang);
const counts=TYPES.map(t=>`${strings.types[t]}: ${summary.counts[t]}`).join(' · ');
showDialog(`<h2>${strings.daySummary} · ${day}</h2><p>${esc(counts)}</p>${summary.events.length?summary.events.map(e=>`<button class="summary-event" data-event="${e.folio}:${e.type}">${esc(e.datetime.slice(11,16))} · ${esc(e.title)} · ${esc(strings.folio)} ${e.folio}</button>`).join(''):`<p>${strings.noEvents}</p>`}${day>=today?`<button data-action="new-from-day" data-day="${day}">${strings.create}</button>`:''}`);
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
if(t)showDialog(tripCardMarkup(t,type,lang));
}
    function formMarkup(t){const services=Object.entries(strings.serviceOptions).map(([value,label])=>({value,label}));
const sec=(name,o)=>`<fieldset><legend>${name}</legend><label>${strings.date}<input name="${o}.datetime" type="datetime-local" value="${esc(t[o]&&t[o].datetime||'')}"></label>${o==='cp'?`<label>${strings.service}<select name="cp.service">${optionMarkup(services,t.cp&&t.cp.service)}</select></label><label>${strings.terminal}<select name="cp.terminal">${optionMarkup(data.CATALOG.terminals,t.cp&&t.cp.terminal)}</select></label><label>${strings.agent}<select name="cp.customsAgent">${optionMarkup(data.CATALOG.customsAgents,t.cp&&t.cp.customsAgent)}</select></label><label><input name="cp.maniobra" type="checkbox" ${t.cp&&t.cp.maniobra?'checked':''}> ${strings.maneuver}</label>`:o==='tl'?haulFields('tl',t.tl):o==='tf'?`${haulFields('tf',t.tf)}<label>${strings.origin}<input name="tf.origin" value="${esc(t.tf&&t.tf.origin||'')}"></label><label>${strings.destination}<input name="tf.destination" value="${esc(t.tf&&t.tf.destination||'')}"></label><label>${strings.km}<input name="tf.distanceKm" type="number" min="0" value="${esc(t.tf&&t.tf.distanceKm||0)}"></label>`:`<label>${strings.destination}<input name="delivery.destination" value="${esc(t.delivery&&t.delivery.destination||'')}"></label><label>${strings.modality}<select name="delivery.modality">${optionMarkup([{value:'direct',label:strings.direct},{value:'drop',label:strings.drop}],t.delivery&&t.delivery.modality)}</select></label>`}</fieldset>`;
      function haulFields(k,s={}){s=haulValues(s);return `<label>${strings.line}<select name="${k}.line">${optionMarkup([{value:'own',label:strings.own},{value:'subcontracted',label:strings.subcontracted}],s.line||'own')}</select></label><label>${strings.provider}<select name="${k}.provider">${optionMarkup(data.CATALOG.providers,s.provider,'—')}</select></label><label>${strings.unit}<input name="${k}.unit" value="${esc(s.unit||'')}"></label><label>${strings.driver}<select name="${k}.driver">${optionMarkup(data.CATALOG.drivers,s.driver,'—')}</select></label>${k==='tl'?`<label>${strings.yard}<select name="tl.yard">${optionMarkup(data.CATALOG.yards,t.tl&&t.tl.yard)}</select></label>`:''}`;
}
      return `<h2>${isExistingTrip(t,trips)?strings.editTrip:strings.newTrip}</h2><form data-trip-form data-folio="${esc(t.folio||'')}"><fieldset><legend>${strings.reference}</legend><label>${strings.ref}<input name="reference" value="${esc(t.reference||'')}"></label><label>${strings.client}<select name="client" required><option value="">—</option>${data.CATALOG.clients.map(x=>`<option ${x===t.client?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>${strings.cargo}<select name="cargo" required><option value="containerized" ${t.cargo&&t.cargo.type==='containerized'?'selected':''}>${strings.cargoOptions.containerized}</option><option value="loose" ${t.cargo&&t.cargo.type==='loose'?'selected':''}>${strings.cargoOptions.loose}</option></select></label><label>${strings.containers}<textarea name="containers">${esc(t.cargo&&t.cargo.containers&&t.cargo.containers.join('\n')||'')}</textarea></label></fieldset>${sec(strings.port,'cp')}${sec(strings.local,'tl')}${sec(strings.long,'tf')}${sec(strings.delivery,'delivery')}<p class="form-error" aria-live="polite"></p><div class="dialog-actions"><button type="submit">${strings.save}</button><button type="button" data-action="close">${strings.cancel}</button></div></form>`;
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
if(errors.length){form.querySelector('.form-error').textContent=`${strings.required} ${errors.map(code=>strings.validation[code]||strings.required).join(', ')}`;
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
if(warn)showDialog(`<h2>${strings.warning}</h2><p>${maintenanceMessage(warn,lang)}</p><button data-action="close">${strings.close}</button>`);
}
    function changeColor(){const t=$('color-type').value,clientControl=$('color-client'),c=t==='ENTREGA'?'':clientControl.value,value=$('color-input').value;
if(t==='ENTREGA'){clientControl.value='';clientControl.disabled=true;}
if(c&&t!=='ENTREGA'){palette.clients[c]=palette.clients[c]||{};
palette.clients[c][t]=value;
}else palette.tenant[t]=value;
persist();
renderCalendar();
log(`${strings.colorUpdated}: ${c||strings.global} · ${strings.types[t]}.`);
}
    function openMove(ref, day, time){const [folio,type]=ref.split(':');
const trip=trips.find(t=>t.folio===Number(folio));
const section=trip&&trip[{CP:'cp',TL:'tl',TF:'tf',ENTREGA:'delivery'}[type]];
if(!section)return;
const old=section.datetime;
if(view==='month'){if(day<today){log(`${strings.movementRejected}: ${strings.moveReasons.past_day}`,'no');
return;
}showDialog(`<h2>${strings.movePrompt}</h2><label>${strings.hour}<input id="move-time" type="time" value="${old.slice(11,16)}"></label><button data-action="confirm-move" data-event="${ref}" data-day="${day}">${strings.confirm}</button>`);
return;
}const proposed=`${day}T${time||old.slice(11,16)}`;
const checked=Lg.evaluateMove(trips,{folio:Number(folio),type},proposed,Lg.fromDate(new Date()));
if(!checked.ok){log(`${strings.movementRejected}: ${strings.moveReasons[checked.reason]||strings.reasonPast}`,'no');
return;
}confirmMove(ref,proposed);
}
    function confirmMove(ref,dt){const [folio,type]=ref.split(':');
const result=Lg.evaluateMove(trips,{folio:Number(folio),type},dt,Lg.fromDate(new Date()));
if(!result.ok){closeDialog();
log(`${strings.movementRejected}: ${strings.moveReasons[result.reason]||strings.reasonPast}`,'no');
return;
}if(result.dependents&&!window.confirm(result.dependents===1?strings.dependentOne:strings.dependentMany.replace('{count}',result.dependents))){closeDialog();
return;
}trips=Lg.applyMove(trips,result.changes);
closeDialog();
renderCalendar();
renderAvailability();
log(`${strings.moveCompleted}: ${result.changes.length} ${strings.eventsMoved}.`);
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
openForm(newTripDraft(action.dataset.day,trips));
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
  return Object.freeze({init,dayFromButton,hourSlots,monthCells,newTripDraft,isExistingTrip,optionMarkup,haulValues,viewRange,shiftMonth,pointerReleaseTarget,tripCardMarkup,stringsFor,maintenanceMessage});
});
