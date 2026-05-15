// ============================================================
// MÓDULO: AGENDA / RECORDATORIOS — Versión Profesional v3
// ============================================================

if (!DB.agenda) DB.agenda = [];
if (!DB._agendaSeq) DB._agendaSeq = 1;

const AgendaModule = {

  // ── Estado ──
  vistaActual:  'lista',
  mesActual:    new Date().getMonth(),
  anoActual:    new Date().getFullYear(),
  tipoFiltro:   'todos',
  _busqueda:    '',
  _filtroDia:   '',

  // ── Helpers ──
  _hoy() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _manana() {
    var d = new Date(); d.setDate(d.getDate()+1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _formatFecha(f) {
    if (!f) return '';
    var p = f.split('-');
    var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return p[2]+' '+meses[parseInt(p[1])-1]+' '+p[0];
  },
  _diasFaltantes(fecha) {
    var hoy = new Date(this._hoy());
    var evt  = new Date(fecha);
    var diff = Math.round((evt - hoy) / 86400000);
    if (diff < 0)  return { label: Math.abs(diff)+' días vencido', color: '#dc2626', bg: '#fef2f2' };
    if (diff === 0) return { label: 'Hoy',                         color: '#7c3aed', bg: '#f5f3ff' };
    if (diff === 1) return { label: 'Mañana',                      color: '#d97706', bg: '#fffbeb' };
    if (diff <= 7)  return { label: 'En '+diff+' días',            color: '#d97706', bg: '#fffbeb' };
    return { label: 'En '+diff+' días',                            color: '#16a34a', bg: '#f0fdf4' };
  },

  _tipoConfig(t) {
    var map = {
      pago:         { icon:'fa-money-bill-wave',  color:'#16a34a', bg:'#f0fdf4', border:'#86efac',  label:'Pago',         emoji:'💰' },
      reunion:      { icon:'fa-handshake',         color:'#2563eb', bg:'#eff6ff', border:'#93c5fd',  label:'Reunión',      emoji:'🤝' },
      vencimiento:  { icon:'fa-clock',             color:'#dc2626', bg:'#fef2f2', border:'#fca5a5',  label:'Vencimiento',  emoji:'⏰' },
      recordatorio: { icon:'fa-bell',              color:'#d97706', bg:'#fffbeb', border:'#fde68a',  label:'Recordatorio', emoji:'📝' },
      tarea:        { icon:'fa-tasks',             color:'#7c3aed', bg:'#f5f3ff', border:'#c4b5fd',  label:'Tarea',        emoji:'✅' },
      llamada:      { icon:'fa-phone',             color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc',  label:'Llamada',      emoji:'📞' },
    };
    return map[t] || { icon:'fa-calendar', color:'#6b7280', bg:'#f3f4f6', border:'#e5e7eb', label:t, emoji:'📅' };
  },

  _prioConfig(p) {
    var map = {
      alta:  { label:'Alta',  color:'#dc2626', bg:'#fef2f2', dot:'🔴' },
      media: { label:'Media', color:'#d97706', bg:'#fffbeb', dot:'🟡' },
      baja:  { label:'Baja',  color:'#16a34a', bg:'#f0fdf4', dot:'🟢' },
    };
    return map[p] || map.media;
  },

  _filtrados() {
    var self = this;
    var hoy = this._hoy();
    var q = this._busqueda.toLowerCase();
    return (DB.agenda||[]).filter(function(a) {
      var matchTipo  = self.tipoFiltro === 'todos' ||
        (self.tipoFiltro === 'vencidos'   ? (!a.completado && a.fecha < hoy) :
         self.tipoFiltro === 'hoy'        ? (a.fecha === hoy && !a.completado) :
         self.tipoFiltro === 'completados'? a.completado :
         a.tipo === self.tipoFiltro && !a.completado);
      var matchBusq  = !q || (a.titulo||'').toLowerCase().includes(q) || (a.descripcion||'').toLowerCase().includes(q);
      var matchDia   = !self._filtroDia || a.fecha === self._filtroDia;
      return matchTipo && matchBusq && matchDia;
    }).sort(function(a,b){
      if (a.completado !== b.completado) return a.completado ? 1 : -1;
      return (a.fecha+a.hora).localeCompare(b.fecha+b.hora);
    });
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Agenda / Recordatorios', 'GESTIÓN');
    var self = this;
    var hoy = this._hoy();
    var todos = DB.agenda||[];

    var pendientes  = todos.filter(function(a){ return !a.completado && a.fecha >= hoy; }).length;
    var vencidos    = todos.filter(function(a){ return !a.completado && a.fecha < hoy; }).length;
    var completados = todos.filter(function(a){ return a.completado; }).length;
    var deHoy       = todos.filter(function(a){ return a.fecha === hoy && !a.completado; }).length;
    var deMañana    = todos.filter(function(a){ return a.fecha === self._manana() && !a.completado; }).length;

    // ── STATS ──
    var statsBar =
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {l:'Total',      v:todos.length, c:'#2563eb',bg:'#eff6ff',i:'fa-calendar-alt',  click:'todos'},
        {l:'Pendientes', v:pendientes,   c:'#d97706',bg:'#fffbeb',i:'fa-hourglass-half',click:'todos'},
        {l:'Vencidos',   v:vencidos,     c:'#dc2626',bg:'#fef2f2',i:'fa-exclamation-circle',click:'vencidos'},
        {l:'Hoy',        v:deHoy,        c:'#7c3aed',bg:'#f5f3ff',i:'fa-star',           click:'hoy'},
        {l:'Completados',v:completados,  c:'#16a34a',bg:'#f0fdf4',i:'fa-check-circle',   click:'completados'},
      ].map(function(k){
        return '<div onclick="AgendaModule.tipoFiltro=\''+k.click+'\';AgendaModule._filtroDia=\'\';App.renderPage();" ' +
          'style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid '+(self.tipoFiltro===k.click?k.c:'var(--gray-200)')+';' +
          'display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.15s;" ' +
          'onmouseover="this.style.borderColor=\''+k.c+'\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.08)\'" ' +
          'onmouseout="this.style.borderColor=\''+(self.tipoFiltro===k.click?k.c:'var(--gray-200)')+'\';this.style.boxShadow=\'none\'">' +
          '<div style="width:38px;height:38px;border-radius:10px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">' +
            '<i class="fas '+k.i+'"></i></div>' +
          '<div><div style="font-size:20px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+k.l+'</div></div>' +
          (k.l==='Vencidos'&&vencidos>0?'<div style="width:8px;height:8px;border-radius:50%;background:#dc2626;margin-left:auto;box-shadow:0 0 6px rgba(220,38,38,0.6);"></div>':'')+
        '</div>';
      }).join('') +
      '</div>';

    // ── ALERTA VENCIDOS ──
    var alertaVenc = '';
    if (vencidos > 0) {
      var vencidosList = todos.filter(function(a){ return !a.completado && a.fecha < hoy; }).slice(0,3);
      alertaVenc =
        '<div style="background:linear-gradient(135deg,#fef2f2,#fff5f5);border:1.5px solid #fca5a5;border-radius:12px;padding:14px 18px;margin-bottom:20px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:10px;height:10px;border-radius:50%;background:#dc2626;box-shadow:0 0 8px rgba(220,38,38,0.7);flex-shrink:0;"></div>' +
              '<span style="font-size:13px;font-weight:800;color:#dc2626;">'+vencidos+' evento'+(vencidos>1?'s':'')+' vencido'+(vencidos>1?'s':'')+' sin atender</span>' +
            '</div>' +
            '<button onclick="AgendaModule.tipoFiltro=\'vencidos\';AgendaModule._filtroDia=\'\';App.renderPage();" ' +
              'style="font-size:11px;font-weight:700;color:#dc2626;background:white;border:1.5px solid #fca5a5;border-radius:6px;padding:4px 12px;cursor:pointer;">Ver todos</button>' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">' +
          vencidosList.map(function(a){
            var tc = self._tipoConfig(a.tipo);
            return '<div style="display:flex;align-items:center;gap:7px;background:white;border:1px solid #fca5a5;border-radius:8px;padding:6px 10px;font-size:12px;">' +
              '<span>'+tc.emoji+'</span>' +
              '<span style="font-weight:700;color:var(--gray-800);">'+a.titulo.substring(0,30)+'</span>' +
              '<span style="color:#dc2626;font-size:10px;">'+a.fecha+'</span>' +
              '<button onclick="AgendaModule.completar('+a.id+')" style="width:22px;height:22px;border-radius:5px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:10px;"><i class="fas fa-check"></i></button>' +
            '</div>';
          }).join('') +
          (vencidos>3?'<div style="display:flex;align-items:center;color:#dc2626;font-size:11px;font-weight:700;padding:6px 10px;">+'+( vencidos-3)+' más...</div>':'') +
          '</div>' +
        '</div>';
    }

    // ── VISTA ──
    var contenido = this.vistaActual === 'calendario'
      ? this._renderCalendario()
      : this._renderLista();

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-calendar-alt" style="color:var(--accent);margin-right:8px;"></i>Agenda / Recordatorios</h2>' +
          '<p class="text-muted text-sm">'+todos.length+' eventos · '+pendientes+' pendientes'+( deMañana>0?' · <span style="color:#d97706;font-weight:700;">'+deMañana+' mañana</span>':'')+'</p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<div style="display:flex;background:var(--gray-100);border-radius:9px;padding:3px;">' +
            '<button onclick="AgendaModule.vistaActual=\'lista\';App.renderPage();" ' +
              'style="padding:7px 16px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer;' +
              'background:'+(this.vistaActual==='lista'?'white':'transparent')+';' +
              'color:'+(this.vistaActual==='lista'?'var(--accent)':'var(--gray-500)')+';' +
              'box-shadow:'+(this.vistaActual==='lista'?'0 2px 6px rgba(0,0,0,0.1)':'none')+'">' +
              '<i class="fas fa-list" style="margin-right:5px;"></i>Lista</button>' +
            '<button onclick="AgendaModule.vistaActual=\'calendario\';App.renderPage();" ' +
              'style="padding:7px 16px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer;' +
              'background:'+(this.vistaActual==='calendario'?'white':'transparent')+';' +
              'color:'+(this.vistaActual==='calendario'?'var(--accent)':'var(--gray-500)')+';' +
              'box-shadow:'+(this.vistaActual==='calendario'?'0 2px 6px rgba(0,0,0,0.1)':'none')+'">' +
              '<i class="fas fa-calendar" style="margin-right:5px;"></i>Calendario</button>' +
          '</div>' +
          '<button onclick="AgendaModule.nuevo()" style="padding:9px 20px;background:var(--accent);color:white;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-plus" style="margin-right:5px;"></i>Nuevo Evento</button>' +
        '</div>' +
      '</div>' +
      statsBar +
      alertaVenc +
      contenido
    );
  },

  // ──────────────────────────────────────────────────────
  // VISTA LISTA
  // ──────────────────────────────────────────────────────
  _renderLista() {
    var self = this;
    var hoy  = this._hoy();
    var filtrados = this._filtrados();

    // ── FILTROS TIPO ──
    var tiposBtns =
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
      [
        {v:'todos',       l:'Todos',        c:'#2563eb'},
        {v:'hoy',         l:'Hoy',          c:'#7c3aed'},
        {v:'pago',        l:'💰 Pagos',      c:'#16a34a'},
        {v:'reunion',     l:'🤝 Reuniones',  c:'#2563eb'},
        {v:'vencimiento', l:'⏰ Vencimientos',c:'#dc2626'},
        {v:'recordatorio',l:'📝 Recordatorios',c:'#d97706'},
        {v:'tarea',       l:'✅ Tareas',     c:'#7c3aed'},
        {v:'llamada',     l:'📞 Llamadas',   c:'#0891b2'},
        {v:'completados', l:'✓ Completados', c:'#16a34a'},
        {v:'vencidos',    l:'⚠ Vencidos',   c:'#dc2626'},
      ].map(function(f){
        var act = self.tipoFiltro === f.v;
        return '<button onclick="AgendaModule.tipoFiltro=\''+f.v+'\';AgendaModule._filtroDia=\'\';App.renderPage();" ' +
          'style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;' +
          'border:1.5px solid '+(act?f.c:'var(--gray-200)')+';background:'+(act?f.c:'white')+';color:'+(act?'white':f.c)+';">'+f.l+'</button>';
      }).join('') +
      '</div>';

    var filas = '';
    if (filtrados.length === 0) {
      filas =
        '<div style="text-align:center;padding:60px 20px;">' +
          '<div style="width:80px;height:80px;border-radius:50%;background:var(--gray-50);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
            '<i class="fas fa-calendar-check" style="font-size:32px;color:var(--gray-300);"></i>' +
          '</div>' +
          '<div style="font-size:16px;font-weight:800;color:var(--gray-600);margin-bottom:6px;">Sin eventos</div>' +
          '<div style="font-size:13px;color:var(--gray-400);">No hay eventos en esta categoría</div>' +
          '<button onclick="AgendaModule.nuevo()" style="margin-top:14px;padding:9px 20px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-plus" style="margin-right:5px;"></i>Agregar evento</button>' +
        '</div>';
    } else {
      // Agrupar por fecha
      var porFecha = {};
      filtrados.forEach(function(a) {
        if (!porFecha[a.fecha]) porFecha[a.fecha] = [];
        porFecha[a.fecha].push(a);
      });

      Object.keys(porFecha).sort().forEach(function(fecha) {
        var esHoy    = fecha === hoy;
        var esMana   = fecha === self._manana();
        var vencida  = fecha < hoy;
        var labelFecha = esHoy ? '🌟 Hoy — '+self._formatFecha(fecha) :
                         esMana? '⏰ Mañana — '+self._formatFecha(fecha) :
                         vencida? '⚠️ Vencido — '+self._formatFecha(fecha) :
                         '📅 '+self._formatFecha(fecha);

        filas +=
          '<div style="margin-bottom:20px;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="height:1px;flex:1;background:var(--gray-200);"></div>' +
            '<span style="font-size:11px;font-weight:800;padding:4px 14px;border-radius:20px;white-space:nowrap;' +
              'background:'+(esHoy?'#f5f3ff':esMana?'#fffbeb':vencida?'#fef2f2':'var(--gray-100)')+';' +
              'color:'+(esHoy?'#7c3aed':esMana?'#d97706':vencida?'#dc2626':'var(--gray-600)')+';">'+labelFecha+'</span>' +
            '<div style="height:1px;flex:1;background:var(--gray-200);"></div>' +
          '</div>';

        porFecha[fecha].forEach(function(a) {
          var tc   = self._tipoConfig(a.tipo);
          var pc   = self._prioConfig(a.prioridad||'media');
          var dias = self._diasFaltantes(a.fecha);

          filas +=
            '<div onclick="AgendaModule.ver('+a.id+')" ' +
              'style="display:flex;align-items:flex-start;gap:14px;padding:16px 18px;background:white;border:1.5px solid '+(a.completado?'var(--gray-100)':'var(--gray-200)')+';border-radius:12px;margin-bottom:8px;cursor:pointer;opacity:'+(a.completado?'0.6':'1')+';transition:all 0.15s;"' +
              'onmouseover="this.style.borderColor=\''+tc.color+'\';this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-1px)\'"' +
              'onmouseout="this.style.borderColor=\''+(a.completado?'var(--gray-100)':'var(--gray-200)')+'\';this.style.boxShadow=\'none\';this.style.transform=\'none\'">' +

              // Icono tipo
              '<div style="width:44px;height:44px;border-radius:12px;background:'+tc.bg+';border:1.5px solid '+tc.border+';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">'+tc.emoji+'</div>' +

              // Contenido
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
                  (a.completado?'<span style="text-decoration:line-through;":"")'+
                  '<div style="font-size:14px;font-weight:800;color:var(--gray-'+(a.completado?'400':'900')+');">'+a.titulo+'</div>' :
                  '<div style="font-size:14px;font-weight:800;color:var(--gray-900);">'+a.titulo+'</div>') +
                  '<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;background:'+tc.bg+';color:'+tc.color+';">'+tc.label+'</span>' +
                  '<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;background:'+pc.bg+';color:'+pc.color+';">'+pc.dot+' '+pc.label+'</span>' +
                '</div>' +
                (a.descripcion?'<div style="font-size:12px;color:var(--gray-400);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:500px;">'+a.descripcion+'</div>':'') +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                  '<span style="font-size:11px;font-weight:700;color:var(--gray-500);"><i class="fas fa-clock" style="margin-right:4px;"></i>'+a.hora+'</span>' +
                  (!a.completado?'<span style="font-size:11px;font-weight:800;padding:2px 8px;border-radius:8px;background:'+dias.bg+';color:'+dias.color+';">'+dias.label+'</span>':'<span style="font-size:11px;font-weight:700;color:#16a34a;"><i class="fas fa-check" style="margin-right:4px;"></i>Completado</span>') +
                '</div>' +
              '</div>' +

              // Acciones
              '<div style="display:flex;gap:4px;flex-shrink:0;" onclick="event.stopPropagation();">' +
                (!a.completado?
                  '<button onclick="AgendaModule.completar('+a.id+')" title="Completar" style="width:32px;height:32px;border-radius:8px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:13px;"><i class="fas fa-check"></i></button>' : '') +
                '<button onclick="AgendaModule.editar('+a.id+')" title="Editar" style="width:32px;height:32px;border-radius:8px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:13px;"><i class="fas fa-edit"></i></button>' +
                '<button onclick="AgendaModule.eliminar('+a.id+')" title="Eliminar" style="width:32px;height:32px;border-radius:8px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:13px;"><i class="fas fa-trash"></i></button>' +
              '</div>' +
            '</div>';
        });

        filas += '</div>';
      });
    }

    return (
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          tiposBtns +
          '<div style="display:flex;gap:8px;">' +
            '<div style="flex:1;position:relative;">' +
              '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>' +
              '<input type="text" placeholder="Buscar evento..." value="'+this._busqueda+'" ' +
                'oninput="AgendaModule._busqueda=this.value;App.renderPage();" ' +
                'style="width:100%;padding:8px 10px 8px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
            '</div>' +
            (this._filtroDia?'<button onclick="AgendaModule._filtroDia=\'\';App.renderPage();" style="padding:8px 14px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-times" style="margin-right:4px;"></i>'+this._filtroDia+'</button>':'') +
          '</div>' +
        '</div>' +
        '<div style="padding:16px 20px;">'+filas+'</div>' +
      '</div>'
    );
  },

  // ──────────────────────────────────────────────────────
  // VISTA CALENDARIO
  // ──────────────────────────────────────────────────────
  _renderCalendario() {
    var self = this;
    var hoy  = this._hoy();
    var diasEnMes = new Date(this.anoActual, this.mesActual+1, 0).getDate();
    var primerDia = new Date(this.anoActual, this.mesActual, 1).getDay();
    var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var diasSem = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    var celdas = '';

    // Celdas vacías del inicio
    for (var i = 0; i < primerDia; i++) {
      celdas += '<div style="background:var(--gray-50);border-radius:10px;min-height:90px;border:1.5px solid transparent;"></div>';
    }

    // Días del mes
    for (var d = 1; d <= diasEnMes; d++) {
      var fechaStr = this.anoActual+'-'+String(this.mesActual+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var eventosDelDia = (DB.agenda||[]).filter(function(a){ return a.fecha === fechaStr; });
      var pendientesDelDia = eventosDelDia.filter(function(a){ return !a.completado; });
      var esHoy = fechaStr === hoy;
      var esVencido = fechaStr < hoy && pendientesDelDia.length > 0;
      var esFiltrado = this._filtroDia === fechaStr;

      celdas +=
        '<div onclick="AgendaModule._filtroDia=\''+(esFiltrado?'':fechaStr)+'\';AgendaModule.vistaActual=\'lista\';App.renderPage();" ' +
          'style="background:'+(esHoy?'linear-gradient(135deg,#eff6ff,#dbeafe)':esVencido?'#fef2f2':esFiltrado?'#f5f3ff':'white')+';' +
          'border-radius:10px;min-height:90px;border:1.5px solid '+(esHoy?'var(--accent)':esVencido?'#fca5a5':esFiltrado?'#7c3aed':'var(--gray-200)')+';' +
          'padding:8px;cursor:pointer;transition:all 0.15s;position:relative;" ' +
          'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.1)\'" ' +
          'onmouseout="this.style.borderColor=\''+(esHoy?'var(--accent)':esVencido?'#fca5a5':esFiltrado?'#7c3aed':'var(--gray-200)')+'\';this.style.boxShadow=\'none\'">' +

          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
            '<span style="font-size:15px;font-weight:900;color:'+(esHoy?'var(--accent)':esVencido?'#dc2626':'var(--gray-700)')+';">'+d+'</span>' +
            (esHoy?'<span style="font-size:9px;font-weight:800;background:var(--accent);color:white;padding:1px 6px;border-radius:8px;">HOY</span>':'') +
          '</div>' +

          (pendientesDelDia.length > 0 ?
            pendientesDelDia.slice(0,2).map(function(a){
              var tc = self._tipoConfig(a.tipo);
              return '<div style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:'+tc.bg+';color:'+tc.color+';">'+tc.emoji+' '+a.titulo.substring(0,14)+'</div>';
            }).join('') +
            (pendientesDelDia.length > 2 ? '<div style="font-size:9px;color:var(--gray-400);font-weight:700;padding-left:2px;">+'+( pendientesDelDia.length-2)+' más</div>' : '')
          : '') +

          (eventosDelDia.length > 0 ?
            '<div style="position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:'+(esVencido?'#dc2626':esHoy?'var(--accent)':'#16a34a')+';">'+'</div>'
          : '') +
        '</div>';
    }

    // Mini resumen de eventos próximos al lado
    var proximos = (DB.agenda||[]).filter(function(a){
      return !a.completado && a.fecha >= hoy &&
        a.fecha >= (self.anoActual+'-'+String(self.mesActual+1).padStart(2,'0')+'-01') &&
        a.fecha <= (self.anoActual+'-'+String(self.mesActual+1).padStart(2,'0')+'-'+String(diasEnMes).padStart(2,'0'));
    }).sort(function(a,b){ return a.fecha.localeCompare(b.fecha); }).slice(0,8);

    var proximosList = proximos.length === 0 ?
      '<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:12px;"><i class="fas fa-check-circle" style="font-size:24px;display:block;margin-bottom:8px;"></i>Sin eventos este mes</div>' :
      proximos.map(function(a){
        var tc   = self._tipoConfig(a.tipo);
        var dias = self._diasFaltantes(a.fecha);
        return '<div onclick="AgendaModule.ver('+a.id+')" style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:8px;border:1px solid var(--gray-100);margin-bottom:6px;cursor:pointer;background:white;" ' +
          'onmouseover="this.style.borderColor=\''+tc.color+'\'" onmouseout="this.style.borderColor=\'var(--gray-100)\'">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:'+tc.bg+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">'+tc.emoji+'</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:700;color:var(--gray-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+a.titulo+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+self._formatFecha(a.fecha)+' · '+a.hora+'</div>' +
          '</div>' +
          '<span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px;background:'+dias.bg+';color:'+dias.color+';white-space:nowrap;">'+dias.label+'</span>' +
        '</div>';
      }).join('');

    return (
      '<div style="display:grid;grid-template-columns:1fr 280px;gap:16px;">' +
        '<div class="card">' +
          '<div style="padding:16px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<button onclick="AgendaModule.mesActual--;if(AgendaModule.mesActual<0){AgendaModule.mesActual=11;AgendaModule.anoActual--;}App.renderPage();" ' +
                'style="width:34px;height:34px;border-radius:8px;border:1.5px solid var(--gray-200);background:white;cursor:pointer;font-size:13px;color:var(--gray-600);">' +
                '<i class="fas fa-chevron-left"></i></button>' +
              '<div style="font-size:18px;font-weight:900;color:var(--gray-800);min-width:180px;text-align:center;">'+meses[this.mesActual]+' '+this.anoActual+'</div>' +
              '<button onclick="AgendaModule.mesActual++;if(AgendaModule.mesActual>11){AgendaModule.mesActual=0;AgendaModule.anoActual++;}App.renderPage();" ' +
                'style="width:34px;height:34px;border-radius:8px;border:1.5px solid var(--gray-200);background:white;cursor:pointer;font-size:13px;color:var(--gray-600);">' +
                '<i class="fas fa-chevron-right"></i></button>' +
            '</div>' +
            '<button onclick="AgendaModule.mesActual=new Date().getMonth();AgendaModule.anoActual=new Date().getFullYear();App.renderPage();" ' +
              'style="padding:7px 14px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Hoy</button>' +
          '</div>' +
          '<div style="padding:16px 20px;">' +
            '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:8px;">' +
              diasSem.map(function(d){
                return '<div style="text-align:center;font-size:11px;font-weight:800;color:var(--gray-400);padding:6px 0;">'+d+'</div>';
              }).join('') +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">'+celdas+'</div>' +
          '</div>' +
        '</div>' +

        // Panel lateral
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div class="card">' +
            '<div style="padding:14px 16px;border-bottom:1px solid var(--gray-200);">' +
              '<div style="font-size:12px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;">' +
                '<i class="fas fa-list" style="color:var(--accent);margin-right:5px;"></i>Próximos del mes' +
              '</div>' +
            '</div>' +
            '<div style="padding:12px 14px;">'+proximosList+'</div>' +
          '</div>' +
          '<button onclick="AgendaModule.nuevo()" style="width:100%;padding:14px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-plus" style="margin-right:6px;"></i>Nuevo Evento</button>' +
        '</div>' +
      '</div>'
    );
  },

  // ──────────────────────────────────────────────────────
  // VER DETALLE
  // ──────────────────────────────────────────────────────
  ver(id) {
    var a = (DB.agenda||[]).find(function(x){ return x.id===id; });
    if (!a) return;
    var tc   = this._tipoConfig(a.tipo);
    var pc   = this._prioConfig(a.prioridad||'media');
    var dias = this._diasFaltantes(a.fecha);

    var html =
      '<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;">' +
        '<div style="width:60px;height:60px;border-radius:16px;background:'+tc.bg+';border:2px solid '+tc.border+';display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">'+tc.emoji+'</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:20px;font-weight:900;color:var(--gray-900);margin-bottom:6px;"'+(a.completado?' style="text-decoration:line-through;opacity:0.6;"':'')+'>'+a.titulo+'</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+tc.bg+';color:'+tc.color+';">'+tc.emoji+' '+tc.label+'</span>' +
            '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+pc.bg+';color:'+pc.color+';">'+pc.dot+' Prioridad '+pc.label+'</span>' +
            (!a.completado?'<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+dias.bg+';color:'+dias.color+';">'+dias.label+'</span>':'<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:#f0fdf4;color:#16a34a;"><i class="fas fa-check" style="margin-right:4px;"></i>Completado</span>') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">' +
        '<div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:4px;"><i class="fas fa-calendar" style="margin-right:4px;"></i>Fecha</div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--gray-800);">'+this._formatFecha(a.fecha)+'</div>' +
        '</div>' +
        '<div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:4px;"><i class="fas fa-clock" style="margin-right:4px;"></i>Hora</div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--gray-800);">'+a.hora+'</div>' +
        '</div>' +
      '</div>' +

      (a.descripcion?
        '<div style="background:var(--gray-50);border-radius:10px;padding:14px 16px;margin-bottom:16px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-sticky-note" style="margin-right:4px;color:#d97706;"></i>Descripción / Notas</div>' +
          '<div style="font-size:13px;color:var(--gray-700);line-height:1.6;">'+a.descripcion+'</div>' +
        '</div>' : '') +

      (a.completado&&a.fechaCompletado?
        '<div style="background:#f0fdf4;border-radius:10px;padding:12px 16px;border:1px solid #86efac;">' +
          '<div style="font-size:12px;color:#16a34a;font-weight:700;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>Completado el '+a.fechaCompletado+'</div>' +
        '</div>' : '');

    var btns = [];
    if (!a.completado) {
      btns.push({text:'<i class="fas fa-check"></i> Completar', cls:'btn-success', cb:function(){ App.closeModal(); AgendaModule.completar(id); }});
    }
    btns.push({text:'<i class="fas fa-edit"></i> Editar', cls:'btn-primary', cb:function(){ App.closeModal(); AgendaModule.editar(id); }});
    btns.push({text:'<i class="fas fa-trash"></i> Eliminar', cls:'btn-danger', cb:function(){ App.closeModal(); AgendaModule.eliminar(id); }});

    App.showModal('📅 Detalle del Evento', html, btns);
    document.getElementById('modalBox').style.maxWidth = '500px';
  },

  // ──────────────────────────────────────────────────────
  // FORMULARIO NUEVO / EDITAR
  // ──────────────────────────────────────────────────────
  nuevo(fechaPre) {
    this._abrirFormulario({}, fechaPre||'');
  },

  editar(id) {
    var a = (DB.agenda||[]).find(function(x){ return x.id===id; });
    if (a) this._abrirFormulario(a, '');
  },

  _abrirFormulario(a, fechaPre) {
    var hoy = this._hoy();
    var esEditar = !!a.id;

    var html =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

      // Título
      '<div class="form-group" style="grid-column:1/-1">' +
        '<label class="form-label">Título <span style="color:red;">*</span></label>' +
        '<input class="form-control" id="ag_titulo" placeholder="Ej: Reunión con proveedor, pago de luz..." value="'+(a.titulo||'')+'" style="font-size:15px;font-weight:700;"/>' +
      '</div>' +

      // Tipo
      '<div class="form-group">' +
        '<label class="form-label">Tipo de Evento</label>' +
        '<select class="form-control" id="ag_tipo">' +
          ['recordatorio','pago','reunion','vencimiento','tarea','llamada'].map(function(t){
            var tc = AgendaModule._tipoConfig(t);
            return '<option value="'+t+'"'+(( a.tipo||'recordatorio')===t?' selected':'')+'>'+tc.emoji+' '+tc.label+'</option>';
          }).join('') +
        '</select>' +
      '</div>' +

      // Prioridad
      '<div class="form-group">' +
        '<label class="form-label">Prioridad</label>' +
        '<select class="form-control" id="ag_prio">' +
          '<option value="alta"'+(( a.prioridad||'media')==='alta'?' selected':'')+'>🔴 Alta</option>' +
          '<option value="media"'+(( a.prioridad||'media')==='media'?' selected':'')+'>🟡 Media</option>' +
          '<option value="baja"'+(( a.prioridad||'media')==='baja'?' selected':'')+'>🟢 Baja</option>' +
        '</select>' +
      '</div>' +

      // Fecha
      '<div class="form-group">' +
        '<label class="form-label">Fecha <span style="color:red;">*</span></label>' +
        '<input class="form-control" id="ag_fecha" type="date" value="'+(a.fecha||fechaPre||hoy)+'"/>' +
      '</div>' +

      // Hora
      '<div class="form-group">' +
        '<label class="form-label">Hora</label>' +
        '<input class="form-control" id="ag_hora" type="time" value="'+(a.hora||'09:00')+'"/>' +
      '</div>' +

      // Descripción
      '<div class="form-group" style="grid-column:1/-1">' +
        '<label class="form-label">Descripción / Notas</label>' +
        '<textarea class="form-control" id="ag_desc" rows="3" placeholder="Detalles, montos, personas involucradas...">'+(a.descripcion||'')+'</textarea>' +
      '</div>' +

      '</div>';

    App.showModal(
      esEditar ? '✏️ Editar Evento' : '📅 Nuevo Evento',
      html,
      [{text:'<i class="fas fa-save"></i> '+(esEditar?'Guardar Cambios':'Crear Evento'), cls:'btn-primary', cb:function(){ AgendaModule._guardar(a.id||null); }}]
    );
    document.getElementById('modalBox').style.maxWidth = '560px';
  },

  _guardar(id) {
    var titulo = (document.getElementById('ag_titulo')?.value||'').trim();
    if (!titulo) { App.toast('Ingresa un título','error'); return; }

    var datos = {
      titulo,
      tipo:        document.getElementById('ag_tipo')?.value||'recordatorio',
      prioridad:   document.getElementById('ag_prio')?.value||'media',
      fecha:       document.getElementById('ag_fecha')?.value||this._hoy(),
      hora:        document.getElementById('ag_hora')?.value||'09:00',
      descripcion: document.getElementById('ag_desc')?.value||'',
      completado:  false,
    };

    if (id) {
      var idx = (DB.agenda||[]).findIndex(function(x){ return x.id===id; });
      if (idx >= 0) {
        datos.completado = DB.agenda[idx].completado;
        datos.fechaCompletado = DB.agenda[idx].fechaCompletado;
        DB.agenda[idx] = Object.assign(DB.agenda[idx], datos);
        App.toast('✅ Evento actualizado','success');
      }
    } else {
      if (!DB.agenda) DB.agenda = [];
      var newId = DB.agenda.length ? Math.max.apply(null, DB.agenda.map(function(x){ return x.id; })) + 1 : 1;
      DB.agenda.push(Object.assign({id: newId}, datos));
      App.toast('✅ Evento agendado','success');
    }
    var eventoGuardado = id ? DB.agenda.find(function(x){ return x.id===id; }) : DB.agenda[DB.agenda.length-1];
    if (eventoGuardado) SupabaseDB.guardarAgenda(eventoGuardado);
    App.closeModal();
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // COMPLETAR
  // ──────────────────────────────────────────────────────
  completar(id) {
    var i = (DB.agenda||[]).findIndex(function(x){ return x.id===id; });
    if (i >= 0) {
      DB.agenda[i].completado = true;
      DB.agenda[i].fechaCompletado = this._hoy();
      SupabaseDB.guardarAgenda(DB.agenda[i]);
      App.toast('✅ Evento completado — ¡Bien hecho!','success');
      App.renderPage();
    }
  },

  // ──────────────────────────────────────────────────────
  // ELIMINAR
  // ──────────────────────────────────────────────────────
  eliminar(id) {
    var a = (DB.agenda||[]).find(function(x){ return x.id===id; });
    if (!a) return;
    var tc = this._tipoConfig(a.tipo);

    App.showModal('🗑️ Eliminar Evento',
      '<div style="text-align:center;padding:10px;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
          '<i class="fas fa-trash" style="font-size:26px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">¿Eliminar este evento?</div>' +
        '<div style="display:flex;align-items:center;gap:10px;justify-content:center;padding:12px;background:var(--gray-50);border-radius:10px;margin-bottom:10px;">' +
          '<span style="font-size:24px;">'+tc.emoji+'</span>' +
          '<div style="text-align:left;"><div style="font-size:14px;font-weight:700;">'+a.titulo+'</div>' +
          '<div style="font-size:12px;color:var(--gray-400);">'+this._formatFecha(a.fecha)+' · '+a.hora+'</div></div>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--gray-400);">Esta acción no se puede deshacer.</div>' +
      '</div>',
      [{text:'🗑️ Sí, eliminar', cls:'btn-danger', cb:function(){
        var i = (DB.agenda||[]).findIndex(function(x){ return x.id===id; });
        if (i >= 0) DB.agenda.splice(i, 1);
        SupabaseDB.eliminarAgenda(id);
        App.toast('Evento eliminado','warning');
        App.closeModal();
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '380px';
  },
};
