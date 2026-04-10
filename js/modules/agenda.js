// ============================================================
// MÓDULO: AGENDA / RECORDATORIOS
// ============================================================

if (!DB.agenda) DB.agenda = [
  { id:1, titulo:'Pago proveedor Distribuidora El Sol', tipo:'pago', fecha:'2026-04-10', hora:'09:00', descripcion:'FC01-00001210 pendiente de pago S/ 580.00', completado:false },
  { id:2, titulo:'Reunión con cliente A&A Motors', tipo:'reunion', fecha:'2026-04-08', hora:'14:00', descripcion:'Revisar cotización de productos', completado:false },
  { id:3, titulo:'Vencimiento crédito - ABAD TOLENTINO', tipo:'vencimiento', fecha:'2026-04-10', hora:'08:00', descripcion:'Saldo pendiente S/ 150.00', completado:false },
  { id:4, titulo:'Renovar licencia de funcionamiento', tipo:'recordatorio', fecha:'2026-04-20', hora:'10:00', descripcion:'Ir a municipalidad', completado:false },
  { id:5, titulo:'Inventario mensual', tipo:'recordatorio', fecha:'2026-04-30', hora:'08:00', descripcion:'Conteo físico de todos los productos', completado:false },
];

const AgendaModule = {
  vistaActual: 'lista', // 'lista' | 'calendario'
  mesActual: new Date().getMonth(),
  anoActual: new Date().getFullYear(),
  tipoFiltro: 'todos',

  render() {
    App.setTabs2('Agenda / Recordatorios', 'GESTIÓN');
    const hoy = new Date().toISOString().split('T')[0];
    const proximos = DB.agenda.filter(a=>!a.completado && a.fecha>=hoy).sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const vencidos = DB.agenda.filter(a=>!a.completado && a.fecha<hoy);

    return `
      <div class="page-header">
        <h2 class="page-title">Agenda / Recordatorios</h2>
        <div class="page-actions">
          <button class="btn btn-outline ${this.vistaActual==='lista'?'btn-primary':''}" onclick="AgendaModule.vistaActual='lista';App.renderPage()">
            <i class="fas fa-list"></i> Lista
          </button>
          <button class="btn btn-outline ${this.vistaActual==='calendario'?'btn-primary':''}" onclick="AgendaModule.vistaActual='calendario';App.renderPage()">
            <i class="fas fa-calendar-alt"></i> Calendario
          </button>
          <button class="btn btn-success" onclick="AgendaModule.nuevo()"><i class="fas fa-plus"></i> Nuevo Evento</button>
        </div>
      </div>

      <!-- Alertas de vencidos -->
      ${vencidos.length?`
        <div class="card mb-4" style="border-left:4px solid var(--danger);">
          <div class="card-header">
            <span class="card-title" style="color:var(--danger);"><i class="fas fa-exclamation-circle"></i> Eventos Vencidos (${vencidos.length})</span>
          </div>
          <div class="card-body" style="padding:0;">
            ${vencidos.map(a=>`
              <div class="flex-between" style="padding:12px 16px;border-bottom:1px solid var(--gray-100);">
                <div>
                  <span class="agenda-event ${a.tipo}" style="display:inline-block;font-size:11px;border-radius:4px;padding:2px 8px;background:#fef2f2;color:#dc2626;">${a.titulo}</span>
                  <div class="td-sub">${a.fecha} ${a.hora}</div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="AgendaModule.completar(${a.id})"><i class="fas fa-check"></i> Hecho</button>
              </div>`).join('')}
          </div>
        </div>`:''
      }

      ${this.vistaActual==='lista' ? this._renderLista(proximos) : this._renderCalendario()}
    `;
  },

  _renderLista(eventos) {
    const tipos = ['todos','pago','reunion','vencimiento','recordatorio'];
    return `
      <div class="card">
        <div class="card-header">
          <div class="tabs-nav" style="border:none;margin:0;">
            ${tipos.map(t=>`
              <button class="tab-btn ${this.tipoFiltro===t?'active':''}" onclick="AgendaModule.tipoFiltro='${t}';App.renderPage()">
                ${this._tipoLabel(t)}
              </button>`).join('')}
          </div>
        </div>
        <div class="card-body">
          ${(this.tipoFiltro==='todos'?eventos:eventos.filter(a=>a.tipo===this.tipoFiltro)).length===0?
            `<div class="empty-state"><i class="fas fa-calendar-check"></i><p>Sin eventos próximos</p></div>`:
            (this.tipoFiltro==='todos'?eventos:eventos.filter(a=>a.tipo===this.tipoFiltro)).map(a=>`
              <div style="display:flex;gap:16px;padding:16px;border:1.5px solid var(--gray-200);border-radius:var(--radius);margin-bottom:10px;background:white;align-items:flex-start;">
                <div style="width:52px;height:52px;border-radius:10px;background:${this._tipoBg(a.tipo)};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${this._tipoEmoji(a.tipo)}</div>
                <div style="flex:1;">
                  <div style="font-weight:800;font-size:14px;color:var(--gray-900);">${a.titulo}</div>
                  <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">${a.descripcion}</div>
                  <div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:12px;font-weight:700;color:${this._tipoColor(a.tipo)};"><i class="fas fa-calendar"></i> ${a.fecha} ${a.hora}</span>
                    <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${this._tipoBg(a.tipo)};color:${this._tipoColor(a.tipo)}">${a.tipo.toUpperCase()}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-success btn-sm" onclick="AgendaModule.completar(${a.id})" title="Marcar como hecho"><i class="fas fa-check"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="AgendaModule.eliminar(${a.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
              </div>`).join('')}
        </div>
      </div>
    `;
  },

  _renderCalendario() {
    const fecha=new Date(this.anoActual, this.mesActual, 1);
    const diasEnMes=new Date(this.anoActual, this.mesActual+1, 0).getDate();
    const primerDia=fecha.getDay();
    const hoy=new Date();
    const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    let celdas='';
    for (let i=0;i<primerDia;i++) celdas+=`<div class="agenda-day other-month"></div>`;
    for (let d=1;d<=diasEnMes;d++) {
      const fechaStr=`${this.anoActual}-${String(this.mesActual+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const eventos=DB.agenda.filter(a=>a.fecha===fechaStr&&!a.completado);
      const esHoy=d===hoy.getDate()&&this.mesActual===hoy.getMonth()&&this.anoActual===hoy.getFullYear();
      celdas+=`
        <div class="agenda-day ${esHoy?'today':''}" onclick="AgendaModule._diaClick('${fechaStr}')">
          <div class="agenda-day-num">${d}</div>
          ${eventos.map(e=>`<div class="agenda-event ${e.tipo}" title="${e.titulo}">${e.titulo.substring(0,15)}...</div>`).join('')}
        </div>`;
    }

    return `
      <div class="card">
        <div class="card-header">
          <button class="btn btn-outline btn-sm" onclick="AgendaModule.mesActual--;if(AgendaModule.mesActual<0){AgendaModule.mesActual=11;AgendaModule.anoActual--;}App.renderPage()"><i class="fas fa-chevron-left"></i></button>
          <span class="card-title">${meses[this.mesActual]} ${this.anoActual}</span>
          <button class="btn btn-outline btn-sm" onclick="AgendaModule.mesActual++;if(AgendaModule.mesActual>11){AgendaModule.mesActual=0;AgendaModule.anoActual++;}App.renderPage()"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="card-body">
          <div class="agenda-calendar">
            ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d=>`<div class="agenda-day-header">${d}</div>`).join('')}
            ${celdas}
          </div>
        </div>
      </div>`;
  },

  _tipoLabel(t) { return {todos:'Todos',pago:'💰 Pagos',reunion:'🤝 Reuniones',vencimiento:'⏰ Vencimientos',recordatorio:'📝 Recordatorios'}[t]||t; },
  _tipoBg(t) { return {pago:'#f0fdf4',reunion:'#eff6ff',vencimiento:'#fef2f2',recordatorio:'#fffbeb'}[t]||'#f3f4f6'; },
  _tipoColor(t) { return {pago:'#16a34a',reunion:'#2563eb',vencimiento:'#dc2626',recordatorio:'#d97706'}[t]||'#6b7280'; },
  _tipoEmoji(t) { return {pago:'💰',reunion:'🤝',vencimiento:'⏰',recordatorio:'📝'}[t]||'📅'; },

  _diaClick(fecha) {
    const eventos=DB.agenda.filter(a=>a.fecha===fecha);
    if (eventos.length) {
      App.showModal(`Eventos del ${fecha}`,
        eventos.map(e=>`<div style="padding:10px;border:1px solid var(--gray-200);border-radius:8px;margin-bottom:8px;">
          <div class="font-bold">${e.titulo}</div>
          <div class="text-sm text-muted">${e.hora} — ${e.tipo}</div>
          ${e.descripcion?`<div class="text-sm" style="margin-top:4px;">${e.descripcion}</div>`:''}
        </div>`).join(''),[]);
    } else {
      this.nuevo(fecha);
    }
  },

  nuevo(fechaPre='') {
    const hoy=new Date().toISOString().split('T')[0];
    App.showModal('Nuevo Evento / Recordatorio',`
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Título <span class="required">*</span></label>
          <input class="form-control" id="ag_titulo" placeholder="Ej: Reunión con proveedor"/>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-control" id="ag_tipo">
            <option value="recordatorio">📝 Recordatorio</option>
            <option value="pago">💰 Pago</option>
            <option value="reunion">🤝 Reunión</option>
            <option value="vencimiento">⏰ Vencimiento</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha <span class="required">*</span></label>
          <input class="form-control" id="ag_fecha" type="date" value="${fechaPre||hoy}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Hora</label>
          <input class="form-control" id="ag_hora" type="time" value="09:00"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Descripción / Notas</label>
          <textarea class="form-control" id="ag_desc" rows="2" placeholder="Detalles del evento..."></textarea>
        </div>
      </div>`,[
      { text:'Guardar Evento', cls:'btn-primary', cb:()=>{
        const titulo=document.getElementById('ag_titulo')?.value?.trim();
        if (!titulo) { App.toast('Ingrese un título','error'); return; }
        DB.agenda.push({
          id:DB.agenda.length+1,
          titulo, tipo:document.getElementById('ag_tipo')?.value||'recordatorio',
          fecha:document.getElementById('ag_fecha')?.value||hoy,
          hora:document.getElementById('ag_hora')?.value||'09:00',
          descripcion:document.getElementById('ag_desc')?.value||'',
          completado:false
        });
        App.toast('Evento agendado','success'); App.closeModal(); App.renderPage();
      }}
    ]);
  },

  completar(id) {
    const i=DB.agenda.findIndex(x=>x.id===id);
    if (i>=0) { DB.agenda[i].completado=true; App.toast('Evento marcado como completado ✓','success'); App.renderPage(); }
  },

  eliminar(id) {
    if (confirm('¿Eliminar este evento?')) {
      const i=DB.agenda.findIndex(x=>x.id===id);
      if (i>=0) DB.agenda.splice(i,1);
      App.renderPage();
    }
  }
};
