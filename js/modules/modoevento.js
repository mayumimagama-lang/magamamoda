// ============================================================
// MÓDULO: MODO EVENTO — Control de Precios por Evento
// ============================================================

// ── Estado global del Modo Evento ──
if (!DB.modoEvento)         DB.modoEvento         = false;
if (!DB.modoEventoConfig)   DB.modoEventoConfig   = {
  nombre:       '',
  descripcion:  '',
  fechaInicio:  '',
  fechaFin:     '',
  horaInicio:   '',
  horaFin:      '',
  tipo:         'mayorista',   // 'mayorista' | 'porcentaje'
  porcentaje:   0,
  listaId:      null,
};
if (!DB.modoEventoHistorial) DB.modoEventoHistorial = [];
if (!DB.modoEventoStats)     DB.modoEventoStats     = {
  ventasEvento: 0,
  totalEvento:  0,
  fechaActivado: null,
  activaciones:  0,
};

const ModoEventoModule = {

  _fechaHoy() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _horaAhora() { return new Date().toTimeString().slice(0,5); },
  _ahora()     { return new Date().toLocaleString('es-PE'); },

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Modo Evento','PRECIOS');
    var self   = this;
    var activo = DB.modoEvento;
    var cfg    = DB.modoEventoConfig;
    var stats  = DB.modoEventoStats;

    // ── HERO: Toggle principal ──
    var hero = '<div style="background:linear-gradient(135deg,'+(activo?'#065f46,#16a34a':'#1e293b,#374151')+');border-radius:20px;padding:32px;margin-bottom:22px;position:relative;overflow:hidden;">' +

      // Decorativos
      '<div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>' +
      '<div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.03);"></div>' +

      // Badge estado
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:14px;height:14px;border-radius:50%;background:'+(activo?'#4ade80':'#6b7280')+';box-shadow:'+(activo?'0 0 12px rgba(74,222,128,0.7)':'none')+';"></div>' +
          '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">'+(activo?'MODO EVENTO ACTIVO':'MODO EVENTO INACTIVO')+'</span>' +
        '</div>' +
        (activo ? '<span style="padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;background:rgba(74,222,128,0.2);color:#4ade80;border:1px solid rgba(74,222,128,0.3);">EN CURSO</span>' :
          '<span style="padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);">DETENIDO</span>') +
      '</div>' +

      // Título + descripción
      '<div style="margin-bottom:24px;">' +
        '<h2 style="font-size:28px;font-weight:900;color:white;margin:0 0 6px;">' +
          (cfg.nombre ? cfg.nombre : 'Sin evento configurado') +
        '</h2>' +
        '<p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">' +
          (cfg.descripcion || 'Configura un evento para activar precios especiales desde la primera unidad') +
        '</p>' +
      '</div>' +

      // Botón ON/OFF grande
      '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
        '<button onclick="ModoEventoModule.toggleEvento()" ' +
          'style="padding:14px 32px;border-radius:14px;border:none;font-size:16px;font-weight:900;cursor:pointer;transition:all 0.2s;' +
          'background:'+(activo?'#dc2626':'#16a34a')+';color:white;' +
          'box-shadow:0 4px 16px rgba('+(activo?'220,38,38':'22,163,74')+',0.4);">' +
          '<i class="fas '+(activo?'fa-stop-circle':'fa-play-circle')+'" style="margin-right:8px;font-size:18px;"></i>' +
          (activo ? 'DESACTIVAR EVENTO' : 'ACTIVAR EVENTO') +
        '</button>' +
        (activo ? '<div style="font-size:12px;color:rgba(255,255,255,0.6);">' +
          '<div><i class="fas fa-clock" style="margin-right:5px;"></i>Activado: '+(stats.fechaActivado||'—')+'</div>' +
          '<div style="margin-top:3px;"><i class="fas fa-shopping-cart" style="margin-right:5px;"></i>'+stats.ventasEvento+' ventas · S/ '+(stats.totalEvento||0).toFixed(2)+' recaudado</div>' +
        '</div>' : '') +
      '</div>' +
    '</div>';

    // ── KPIs ──
    var hoy   = this._fechaHoy();
    var vEvento = DB.modoEventoHistorial.length;
    var vHoy    = (DB.ventas||[]).filter(function(v){return v.fecha===hoy;}).length;
    var tHoy    = (DB.ventas||[]).filter(function(v){return v.fecha===hoy;}).reduce(function(s,v){return s+v.total;},0);

    var kpis = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {l:'Tipo de Precio',  v:cfg.tipo==='mayorista'?'Mayorista':(cfg.tipo==='porcentaje'?'-'+cfg.porcentaje+'%':'Lista'),  c:activo?'#16a34a':'#6b7280', bg:activo?'#f0fdf4':'#f3f4f6', i:'fa-tags'},
        {l:'Activaciones',    v:stats.activaciones||0,   c:'#2563eb', bg:'#eff6ff', i:'fa-bolt'},
        {l:'Ventas en Evento', v:stats.ventasEvento||0,  c:'#7c3aed', bg:'#f5f3ff', i:'fa-shopping-cart'},
        {l:'Recaudado',       v:'S/ '+(stats.totalEvento||0).toFixed(2), c:'#d97706', bg:'#fffbeb', i:'fa-dollar-sign'},
      ].map(function(k){
        return '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:12px;">' +
          '<div style="width:38px;height:38px;border-radius:10px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas '+k.i+'"></i></div>' +
          '<div><div style="font-size:18px;font-weight:900;color:'+k.c+';">'+k.v+'</div><div style="font-size:11px;color:var(--gray-400);">'+k.l+'</div></div>' +
        '</div>';
      }).join('')+'</div>';

    // ── CONFIGURACIÓN ──
    var tiposLabel = {mayorista:'Precio mayorista desde 1 unidad', porcentaje:'Descuento % personalizado'};
    var configCard = '<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:800;"><i class="fas fa-cogs" style="color:var(--accent);margin-right:8px;"></i>Configuración del Evento</div>' +
          '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">Define cómo funciona el evento y qué precios aplica</div>' +
        '</div>' +
        '<button onclick="ModoEventoModule.editarConfig()" style="padding:8px 16px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
          '<i class="fas fa-edit" style="margin-right:5px;"></i>Editar</button>' +
      '</div>' +
      '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">' +
        [
          {l:'Nombre del Evento',  v:cfg.nombre||'—',           i:'fa-calendar-star', c:'#2563eb'},
          {l:'Descripción',        v:cfg.descripcion||'—',      i:'fa-align-left',    c:'#7c3aed'},
          {l:'Tipo de Precio',     v:tiposLabel[cfg.tipo]||cfg.tipo||'—', i:'fa-tags', c:'#16a34a'},
          {l:'Descuento (%)',      v:cfg.tipo==='porcentaje'?(cfg.porcentaje+'%'):'—', i:'fa-percent', c:'#d97706'},
          {l:'Fecha Inicio',       v:cfg.fechaInicio||'—',      i:'fa-calendar',      c:'#2563eb'},
          {l:'Fecha Fin',          v:cfg.fechaFin||'—',         i:'fa-calendar-check',c:'#16a34a'},
        ].map(function(f){
          return '<div style="padding:12px;background:var(--gray-50);border-radius:10px;border:1px solid var(--gray-200);">' +
            '<div style="font-size:10px;font-weight:800;color:'+f.c+';text-transform:uppercase;margin-bottom:4px;"><i class="fas '+f.i+'" style="margin-right:4px;"></i>'+f.l+'</div>' +
            '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+f.v+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

    // ── CÓMO FUNCIONA ──
    var infoCard = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +

      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:13px;font-weight:800;"><i class="fas fa-info-circle" style="color:#2563eb;margin-right:6px;"></i>¿Cómo funciona?</div>' +
        '</div>' +
        '<div style="padding:16px 20px;">' +
          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            [
              {n:'1', t:'Configura el evento', d:'Define el nombre, tipo de precio y fechas del evento.', c:'#2563eb'},
              {n:'2', t:'Activa el modo',      d:'Presiona ACTIVAR EVENTO. El POS cambia los precios al instante.', c:'#16a34a'},
              {n:'3', t:'Vende normalmente',   d:'El cajero vende desde 1 unidad al precio mayorista automáticamente.', c:'#7c3aed'},
              {n:'4', t:'Desactiva al terminar', d:'Al apagar, los precios vuelven a su estado normal.', c:'#d97706'},
            ].map(function(s){
              return '<div style="display:flex;align-items:flex-start;gap:12px;">' +
                '<div style="width:26px;height:26px;border-radius:50%;background:'+s.c+';color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0;">'+s.n+'</div>' +
                '<div><div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+s.t+'</div>' +
                '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">'+s.d+'</div></div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:13px;font-weight:800;"><i class="fas fa-shield-alt" style="color:#16a34a;margin-right:6px;"></i>Lo que NO cambia</div>' +
        '</div>' +
        '<div style="padding:16px 20px;">' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            [
              {t:'Precios en base de datos', d:'Los precios originales nunca se modifican'},
              {t:'Listas de precios',        d:'Las listas configuradas no se alteran'},
              {t:'Tickets emitidos',         d:'Las ventas ya hechas mantienen su precio'},
              {t:'Stock e inventario',       d:'El descuento no afecta movimientos de stock'},
              {t:'Datos de clientes',        d:'Ningún dato de cliente se modifica'},
              {t:'Al desactivar',            d:'Todo vuelve automáticamente a la normalidad'},
            ].map(function(s){
              return '<div style="display:flex;align-items:flex-start;gap:10px;">' +
                '<i class="fas fa-check-circle" style="color:#16a34a;margin-top:2px;flex-shrink:0;"></i>' +
                '<div><div style="font-size:12px;font-weight:700;color:var(--gray-800);">'+s.t+'</div>' +
                '<div style="font-size:11px;color:var(--gray-400);">'+s.d+'</div></div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // ── HISTORIAL ──
    var historial = DB.modoEventoHistorial || [];
    var histCard = '<div class="card">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:13px;font-weight:800;"><i class="fas fa-history" style="color:#7c3aed;margin-right:6px;"></i>Historial de Eventos</div>' +
        (historial.length>0 ? '<button onclick="ModoEventoModule.limpiarHistorial()" style="padding:5px 12px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fas fa-trash" style="margin-right:4px;"></i>Limpiar</button>' : '') +
      '</div>' +
      '<div style="padding:16px 20px;">' +
        (historial.length===0 ?
          '<div style="text-align:center;padding:32px;color:var(--gray-400);">' +
            '<i class="fas fa-history" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
            '<div style="font-size:13px;font-weight:700;">Sin historial aún</div>' +
            '<div style="font-size:11px;margin-top:4px;">Los eventos activados aparecerán aquí</div>' +
          '</div>' :
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            historial.slice(0,8).map(function(h){
              var isAct = h.accion==='ACTIVADO';
              return '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--gray-50);border-radius:10px;border-left:3px solid '+(isAct?'#16a34a':'#dc2626')+'">' +
                '<div style="width:32px;height:32px;border-radius:8px;background:'+(isAct?'#f0fdf4':'#fef2f2')+';color:'+(isAct?'#16a34a':'#dc2626')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                  '<i class="fas '+(isAct?'fa-play-circle':'fa-stop-circle')+'"></i>' +
                '</div>' +
                '<div style="flex:1;">' +
                  '<div style="font-size:12px;font-weight:800;color:var(--gray-800);">'+(isAct?'Evento ACTIVADO':'Evento DESACTIVADO')+'</div>' +
                  '<div style="font-size:10px;color:var(--gray-400);">'+h.fecha+' · '+h.usuario+'</div>' +
                  (h.evento ? '<div style="font-size:11px;color:var(--gray-500);margin-top:1px;">📌 '+h.evento+'</div>' : '') +
                '</div>' +
                (h.ventas!=null ? '<div style="text-align:right;font-size:11px;color:var(--gray-500);">'+h.ventas+' ventas<br>S/ '+( h.total||0).toFixed(2)+'</div>' : '') +
              '</div>';
            }).join('') +
          '</div>'
        ) +
      '</div>' +
    '</div>';

    return '<div class="page-header"><div>' +
      '<h2 class="page-title"><i class="fas fa-bolt" style="color:'+(activo?'#16a34a':'var(--accent)')+';margin-right:8px;"></i>Modo Evento</h2>' +
      '<p class="text-muted text-sm">Activa precios mayoristas desde la primera unidad para eventos especiales</p>' +
    '</div><div class="page-actions">' +
      '<button onclick="ModoEventoModule.editarConfig()" style="padding:9px 18px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;">' +
        '<i class="fas fa-cogs" style="margin-right:6px;color:#7c3aed;"></i>Configurar</button>' +
      '<button onclick="ModoEventoModule.toggleEvento()" style="padding:9px 22px;background:'+(activo?'#dc2626':'#16a34a')+';color:white;border:none;border-radius:9px;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 2px 10px rgba('+(activo?'220,38,38':'22,163,74')+',0.3);">' +
        '<i class="fas '+(activo?'fa-stop-circle':'fa-play-circle')+'" style="margin-right:6px;"></i>' +
        (activo?'DESACTIVAR':'ACTIVAR EVENTO') +
      '</button>' +
    '</div></div>' +
    hero + kpis + configCard + infoCard + histCard;
  },

  // ──────────────────────────────────────────────────────
  // TOGGLE PRINCIPAL
  // ──────────────────────────────────────────────────────
  toggleEvento() {
    if (!DB.modoEvento) {
      // Activar
      if (!DB.modoEventoConfig.nombre) {
        App.showModal('⚠️ Configura primero el evento',
          '<div style="text-align:center;padding:16px;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size:42px;color:#d97706;display:block;margin-bottom:12px;"></i>' +
            '<div style="font-size:15px;font-weight:700;margin-bottom:8px;">Evento sin configurar</div>' +
            '<div style="font-size:13px;color:var(--gray-500);">Define el nombre y tipo de precio antes de activar el evento.</div>' +
          '</div>',
          [{text:'⚙️ Configurar ahora',cls:'btn-primary',cb:function(){App.closeModal();ModoEventoModule.editarConfig();}}]
        );
        document.getElementById('modalBox').style.maxWidth='380px';
        return;
      }
      this._confirmarActivar();
    } else {
      this._confirmarDesactivar();
    }
  },

  _confirmarActivar() {
    var cfg = DB.modoEventoConfig;
    var tipoLabel = cfg.tipo==='mayorista'?'Precio mayorista desde 1 unidad':'-'+cfg.porcentaje+'% descuento';
    App.showModal('⚡ Activar Modo Evento',
      '<div style="background:linear-gradient(135deg,#065f46,#16a34a);border-radius:14px;padding:20px;margin-bottom:16px;text-align:center;color:white;">' +
        '<i class="fas fa-bolt" style="font-size:36px;display:block;margin-bottom:10px;"></i>' +
        '<div style="font-size:18px;font-weight:900;margin-bottom:4px;">'+cfg.nombre+'</div>' +
        '<div style="font-size:12px;opacity:0.8;">'+cfg.descripcion+'</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">' +
        '<div style="padding:12px;background:#f0fdf4;border-radius:10px;text-align:center;">' +
          '<div style="font-size:10px;font-weight:800;color:#16a34a;text-transform:uppercase;margin-bottom:3px;">Tipo de Precio</div>' +
          '<div style="font-size:13px;font-weight:700;">'+tipoLabel+'</div>' +
        '</div>' +
        '<div style="padding:12px;background:#eff6ff;border-radius:10px;text-align:center;">' +
          '<div style="font-size:10px;font-weight:800;color:#2563eb;text-transform:uppercase;margin-bottom:3px;">Productos afectados</div>' +
          '<div style="font-size:13px;font-weight:700;">'+(DB.productos||[]).length+' productos</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:#fffbeb;border-radius:10px;padding:12px;border:1px solid #fde68a;font-size:12px;color:#92400e;">' +
        '<i class="fas fa-info-circle" style="margin-right:6px;"></i>' +
        'Al activar, el POS aplicará automáticamente precios especiales desde la primera unidad vendida.' +
      '</div>',
      [{text:'⚡ Sí, activar evento',cls:'btn-success',cb:function(){
        ModoEventoModule._activar(); App.closeModal();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='420px';
  },

  _activar() {
    DB.modoEvento = true;
    if (!DB.modoEventoStats) DB.modoEventoStats = {ventasEvento:0,totalEvento:0,activaciones:0};
    DB.modoEventoStats.fechaActivado = this._ahora();
    DB.modoEventoStats.activaciones  = (DB.modoEventoStats.activaciones||0) + 1;
    DB.modoEventoStats.ventasEvento  = 0;
    DB.modoEventoStats.totalEvento   = 0;

    if (!DB.modoEventoHistorial) DB.modoEventoHistorial = [];
    DB.modoEventoHistorial.unshift({
      accion:  'ACTIVADO',
      fecha:   this._ahora(),
      usuario: DB.usuarioActual?.usuario || '—',
      evento:  DB.modoEventoConfig.nombre,
    });

    // Guardar en localStorage
    try { localStorage.setItem('erp_jumila_modo_evento', JSON.stringify({activo:true,config:DB.modoEventoConfig})); } catch(e){}

    App.toast('⚡ Modo Evento ACTIVADO — Precios mayoristas desde 1 unidad','success',4000);
    App.renderPage();
  },

  _confirmarDesactivar() {
    var stats = DB.modoEventoStats;
    App.showModal('🛑 Desactivar Modo Evento',
      '<div style="text-align:center;padding:10px;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
          '<i class="fas fa-stop-circle" style="font-size:28px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">¿Desactivar el evento?</div>' +
        '<div style="font-size:13px;color:var(--gray-500);margin-bottom:16px;">Los precios volverán a la normalidad inmediatamente.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<div style="padding:12px;background:#f0fdf4;border-radius:10px;text-align:center;">' +
            '<div style="font-size:22px;font-weight:900;color:#16a34a;">'+(stats.ventasEvento||0)+'</div>' +
            '<div style="font-size:11px;color:var(--gray-500);">Ventas en el evento</div>' +
          '</div>' +
          '<div style="padding:12px;background:#eff6ff;border-radius:10px;text-align:center;">' +
            '<div style="font-size:22px;font-weight:900;color:#2563eb;">S/ '+(stats.totalEvento||0).toFixed(2)+'</div>' +
            '<div style="font-size:11px;color:var(--gray-500);">Total recaudado</div>' +
          '</div>' +
        '</div>' +
      '</div>',
      [{text:'🛑 Desactivar',cls:'btn-danger',cb:function(){
        ModoEventoModule._desactivar(); App.closeModal();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='380px';
  },

  _desactivar() {
    var stats = DB.modoEventoStats;
    DB.modoEventoHistorial.unshift({
      accion:  'DESACTIVADO',
      fecha:   this._ahora(),
      usuario: DB.usuarioActual?.usuario || '—',
      evento:  DB.modoEventoConfig.nombre,
      ventas:  stats.ventasEvento||0,
      total:   stats.totalEvento||0,
    });
    DB.modoEvento = false;
    try { localStorage.setItem('erp_jumila_modo_evento', JSON.stringify({activo:false})); } catch(e){}
    App.toast('🛑 Modo Evento DESACTIVADO — Precios normales restaurados','warning',4000);
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // CONFIGURAR EVENTO
  // ──────────────────────────────────────────────────────
  editarConfig() {
    var cfg = DB.modoEventoConfig;
    App.showModal('⚙️ Configurar Evento',
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre del Evento *</label>' +
          '<input class="form-control" id="me_nombre" value="'+(cfg.nombre||'')+'" placeholder="Ej: Feria de Ropa, Liquidación..." autofocus style="font-weight:700;font-size:15px;"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Descripción</label>' +
          '<input class="form-control" id="me_desc" value="'+(cfg.descripcion||'')+'" placeholder="Descripción breve del evento..."/></div>' +
        '<div class="form-group"><label class="form-label">Fecha Inicio</label>' +
          '<input class="form-control" id="me_fi" type="date" value="'+(cfg.fechaInicio||this._fechaHoy())+'"/></div>' +
        '<div class="form-group"><label class="form-label">Fecha Fin</label>' +
          '<input class="form-control" id="me_ff" type="date" value="'+(cfg.fechaFin||'')+'" placeholder="Opcional"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Tipo de Precio</label>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
            '<label id="lbl_may" onclick="ModoEventoModule._selTipo(\'mayorista\')" style="cursor:pointer;padding:14px;border:2px solid '+(cfg.tipo==='mayorista'||!cfg.tipo?'#16a34a':'var(--gray-200)')+';border-radius:12px;background:'+(cfg.tipo==='mayorista'||!cfg.tipo?'#f0fdf4':'white')+';display:flex;align-items:flex-start;gap:10px;">' +
              '<input type="radio" name="me_tipo" value="mayorista" '+(cfg.tipo==='mayorista'||!cfg.tipo?'checked':'')+' style="margin-top:3px;accent-color:#16a34a;"/>' +
              '<div><div style="font-size:13px;font-weight:800;color:#15803d;">Precio Mayorista</div>' +
                '<div style="font-size:11px;color:var(--gray-500);margin-top:2px;">Usa el campo precio_mayorista de cada producto desde 1 unidad</div></div>' +
            '</label>' +
            '<label id="lbl_pct" onclick="ModoEventoModule._selTipo(\'porcentaje\')" style="cursor:pointer;padding:14px;border:2px solid '+(cfg.tipo==='porcentaje'?'#7c3aed':'var(--gray-200)')+';border-radius:12px;background:'+(cfg.tipo==='porcentaje'?'#f5f3ff':'white')+';display:flex;align-items:flex-start;gap:10px;">' +
              '<input type="radio" name="me_tipo" value="porcentaje" '+(cfg.tipo==='porcentaje'?'checked':'')+' style="margin-top:3px;accent-color:#7c3aed;"/>' +
              '<div><div style="font-size:13px;font-weight:800;color:#7c3aed;">Descuento %</div>' +
                '<div style="font-size:11px;color:var(--gray-500);margin-top:2px;">Aplica un % de descuento sobre el precio normal desde 1 unidad</div></div>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="form-group" style="grid-column:1/-1" id="me_pctRow" '+(cfg.tipo!=='porcentaje'?'style="grid-column:1/-1;display:none"':'')+'>' +
          '<label class="form-label">Porcentaje de Descuento (%)</label>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<input class="form-control" id="me_pct" type="number" min="1" max="99" value="'+(cfg.porcentaje||10)+'" style="font-size:24px;font-weight:900;text-align:center;max-width:120px;"/>' +
            '<span style="font-size:24px;font-weight:900;color:var(--gray-400);">%</span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-top:8px;">' +
            [5,10,15,20,25,30].map(function(p){return '<button onclick="document.getElementById(\'me_pct\').value='+p+'" style="padding:5px 12px;background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">'+p+'%</button>';}).join('')+
          '</div>' +
        '</div>' +
      '</div>',
      [{text:'💾 Guardar Configuración',cls:'btn-primary',cb:function(){ModoEventoModule._guardarConfig();}}]
    );
    document.getElementById('modalBox').style.maxWidth='520px';
  },

  _selTipo(tipo) {
    var lM=document.getElementById('lbl_may'), lP=document.getElementById('lbl_pct');
    var pRow=document.getElementById('me_pctRow');
    if(tipo==='mayorista'){
      if(lM){lM.style.borderColor='#16a34a';lM.style.background='#f0fdf4';}
      if(lP){lP.style.borderColor='var(--gray-200)';lP.style.background='white';}
      if(pRow)pRow.style.display='none';
      var r=document.querySelector('input[name="me_tipo"][value="mayorista"]');if(r)r.checked=true;
    } else {
      if(lP){lP.style.borderColor='#7c3aed';lP.style.background='#f5f3ff';}
      if(lM){lM.style.borderColor='var(--gray-200)';lM.style.background='white';}
      if(pRow)pRow.style.display='';
      var r2=document.querySelector('input[name="me_tipo"][value="porcentaje"]');if(r2)r2.checked=true;
    }
  },

  _guardarConfig() {
    var nombre = (document.getElementById('me_nombre')?.value||'').trim();
    if (!nombre) { App.toast('El nombre del evento es obligatorio','error'); return; }
    var tipo = document.querySelector('input[name="me_tipo"]:checked')?.value || 'mayorista';
    var pct  = parseFloat(document.getElementById('me_pct')?.value)||10;
    DB.modoEventoConfig = {
      nombre,
      descripcion:  document.getElementById('me_desc')?.value||'',
      fechaInicio:  document.getElementById('me_fi')?.value||'',
      fechaFin:     document.getElementById('me_ff')?.value||'',
      tipo,
      porcentaje:   tipo==='porcentaje'?pct:0,
      listaId:      null,
    };
    App.toast('✅ Configuración guardada. Ya puedes activar el evento.','success');
    App.closeModal(); App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // LIMPIAR HISTORIAL
  // ──────────────────────────────────────────────────────
  limpiarHistorial() {
    App.showModal('🗑️ Limpiar Historial',
      '<div style="text-align:center;padding:10px;"><i class="fas fa-trash" style="font-size:36px;color:#dc2626;display:block;margin-bottom:12px;"></i><div style="font-size:14px;font-weight:700;">¿Borrar todo el historial?</div><div style="font-size:12px;color:var(--gray-500);margin-top:4px;">Esta acción no se puede deshacer.</div></div>',
      [{text:'🗑️ Sí, limpiar',cls:'btn-danger',cb:function(){
        DB.modoEventoHistorial=[];
        DB.modoEventoStats={ventasEvento:0,totalEvento:0,activaciones:0,fechaActivado:null};
        App.toast('Historial limpiado','warning'); App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='360px';
  },

  // ──────────────────────────────────────────────────────
  // LLAMADO DESDE POS: registrar venta de evento
  // ──────────────────────────────────────────────────────
  registrarVentaEvento(total) {
    if (!DB.modoEvento) return;
    if (!DB.modoEventoStats) DB.modoEventoStats = {ventasEvento:0,totalEvento:0,activaciones:0};
    DB.modoEventoStats.ventasEvento = (DB.modoEventoStats.ventasEvento||0) + 1;
    DB.modoEventoStats.totalEvento  = (DB.modoEventoStats.totalEvento||0)  + total;
  },

  // ──────────────────────────────────────────────────────
  // RESTAURAR ESTADO desde localStorage al iniciar
  // ──────────────────────────────────────────────────────
  restaurar() {
    try {
      var raw = localStorage.getItem('erp_jumila_modo_evento');
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s.activo && s.config) {
        DB.modoEvento       = true;
        DB.modoEventoConfig = s.config;
        console.log('[ModoEvento] Restaurado desde localStorage: ACTIVO');
      }
    } catch(e) {}
  },
};

// ── Auto-restaurar al cargar ──
ModoEventoModule.restaurar();