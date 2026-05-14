// ============================================================
// MÓDULO: COTIZACIONES / PROFORMAS — Versión Profesional v2
// ============================================================

if (!DB.cotizaciones) DB.cotizaciones = [];
if (!DB._cotSeq) DB._cotSeq = 1;

const CotizacionesModule = {

  // ── Estado ──
  _filtroEstado: 'todos',
  _busqueda: '',
  _pagina: 1,
  _porPagina: 10,
  currentItems: [],
  clienteSeleccionado: null,
  _descuentoGlobal: 0,
  _editandoId: null,
  _notasTemp: '',

  // ── Helpers ──
  _fechaHoy() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _fechaVenc() {
    var d = new Date();
    d.setDate(d.getDate()+30);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _getTotal() {
    var sub = this.currentItems.reduce(function(s,i){ return s+i.total; }, 0);
    var dcto = sub * (this._descuentoGlobal||0) / 100;
    return sub - dcto;
  },
  _getSubtotal() {
    return this.currentItems.reduce(function(s,i){ return s+i.total; }, 0);
  },
  _estaVencida(c) {
    return c.vencimiento < this._fechaHoy() && c.estado === 'PENDIENTE';
  },
  _filtrados() {
    var self = this;
    var q = this._busqueda.toLowerCase();
    return (DB.cotizaciones||[]).filter(function(c) {
      var matchEstado = self._filtroEstado === 'todos' ||
        (self._filtroEstado === 'VENCIDA' ? self._estaVencida(c) : c.estado === self._filtroEstado);
      var cli = (DB.clientes||[]).find(function(x){ return x.id === c.cliente_id; });
      var matchBusq = !q ||
        (c.numero||'').toLowerCase().includes(q) ||
        (c.cliente_nombre||'').toLowerCase().includes(q) ||
        ((cli&&cli.nombre)||'').toLowerCase().includes(q);
      return matchEstado && matchBusq;
    });
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Cotizaciones / Proformas', 'VENTAS');
    var self = this;
    var todos = DB.cotizaciones||[];
    var pendientes  = todos.filter(function(c){ return c.estado==='PENDIENTE' && !self._estaVencida(c); }).length;
    var aprobadas   = todos.filter(function(c){ return c.estado==='APROBADA'; }).length;
    var rechazadas  = todos.filter(function(c){ return c.estado==='RECHAZADA'; }).length;
    var vencidas    = todos.filter(function(c){ return self._estaVencida(c); }).length;
    var convertidas = todos.filter(function(c){ return c.estado==='CONVERTIDA'; }).length;
    var totalMonto  = todos.filter(function(c){ return c.estado!=='RECHAZADA'; }).reduce(function(s,c){ return s+c.total; }, 0);

    var filtrados = this._filtrados();
    var totalPags = Math.ceil(filtrados.length / this._porPagina) || 1;
    if (this._pagina > totalPags) this._pagina = 1;
    var inicio = (this._pagina-1) * this._porPagina;
    var pagina = filtrados.slice(inicio, inicio + this._porPagina);

    // ── STATS ──
    var statsBar =
      '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {l:'Total',      v:todos.length,  c:'#2563eb', bg:'#eff6ff', i:'fa-file-alt'},
        {l:'Pendientes', v:pendientes,    c:'#d97706', bg:'#fffbeb', i:'fa-clock'},
        {l:'Aprobadas',  v:aprobadas,     c:'#16a34a', bg:'#f0fdf4', i:'fa-check-circle'},
        {l:'Rechazadas', v:rechazadas,    c:'#dc2626', bg:'#fef2f2', i:'fa-times-circle'},
        {l:'Vencidas',   v:vencidas,      c:'#7c3aed', bg:'#f5f3ff', i:'fa-exclamation-circle'},
        {l:'Monto Total',v:'S/ '+totalMonto.toFixed(2), c:'#0891b2', bg:'#ecfeff', i:'fa-dollar-sign'},
      ].map(function(k){
        return '<div style="padding:12px 14px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:9px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">' +
            '<i class="fas '+k.i+'"></i></div>' +
          '<div><div style="font-size:16px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+k.l+'</div></div>' +
        '</div>';
      }).join('') +
      '</div>';

    // ── FILTROS ──
    var filtrosBtns =
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
      [
        {v:'todos',      l:'Todos',      cnt:todos.length,    c:'#2563eb'},
        {v:'PENDIENTE',  l:'Pendientes', cnt:pendientes,      c:'#d97706'},
        {v:'APROBADA',   l:'Aprobadas',  cnt:aprobadas,       c:'#16a34a'},
        {v:'RECHAZADA',  l:'Rechazadas', cnt:rechazadas,      c:'#dc2626'},
        {v:'VENCIDA',    l:'Vencidas',   cnt:vencidas,        c:'#7c3aed'},
        {v:'CONVERTIDA', l:'Convertidas',cnt:convertidas,     c:'#0891b2'},
      ].map(function(f){
        var act = self._filtroEstado === f.v;
        return '<button onclick="CotizacionesModule._filtroEstado=\''+f.v+'\';CotizacionesModule._pagina=1;App.renderPage();" ' +
          'style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid '+(act?f.c:'var(--gray-200)')+';background:'+(act?f.c:'white')+';color:'+(act?'white':f.c)+';">' +
          f.l+' <span style="opacity:0.8;">('+f.cnt+')</span></button>';
      }).join('') +
      '</div>';

    // ── TABLA ──
    var filas = '';
    if (pagina.length === 0) {
      filas = '<tr><td colspan="8" style="text-align:center;padding:60px;color:var(--gray-400);">' +
        '<i class="fas fa-file-alt" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<div style="font-size:14px;font-weight:700;">No hay cotizaciones</div>' +
        '<button onclick="CotizacionesModule.nueva()" style="margin-top:12px;padding:9px 20px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
          '<i class="fas fa-plus" style="margin-right:5px;"></i>Nueva Cotización</button>' +
        '</td></tr>';
    } else {
      pagina.forEach(function(c) {
        var cli = (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; });
        var vencida = self._estaVencida(c);
        var estadoLabel = vencida ? 'VENCIDA' : c.estado;
        var estColors = {
          PENDIENTE:  {bg:'#fffbeb', c:'#d97706', dot:'#d97706'},
          APROBADA:   {bg:'#f0fdf4', c:'#16a34a', dot:'#16a34a'},
          RECHAZADA:  {bg:'#fef2f2', c:'#dc2626', dot:'#dc2626'},
          VENCIDA:    {bg:'#f5f3ff', c:'#7c3aed', dot:'#7c3aed'},
          CONVERTIDA: {bg:'#ecfeff', c:'#0891b2', dot:'#0891b2'},
        };
        var ec = estColors[estadoLabel] || estColors.PENDIENTE;
        var nombreCli = cli ? cli.nombre : (c.cliente_nombre||'N/A');

        filas +=
          '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:12px 16px;">' +
            '<div style="font-size:13px;font-weight:800;color:var(--accent);">'+c.numero+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+c.fecha+'</div>' +
          '</td>' +
          '<td style="padding:12px 8px;">' +
            '<div style="font-size:12px;font-weight:700;color:var(--gray-800);">'+nombreCli.substring(0,25)+'</div>' +
            (cli?'<div style="font-size:10px;color:var(--gray-400);">'+cli.tipo+': '+cli.doc+'</div>':'') +
          '</td>' +
          '<td style="padding:12px 8px;">' +
            '<div style="font-size:12px;font-weight:700;color:'+(c.vencimiento<self._fechaHoy()?'#dc2626':'var(--gray-700)')+';">'+c.vencimiento+'</div>' +
          '</td>' +
          '<td style="padding:12px 8px;text-align:center;">' +
            '<span style="background:var(--gray-100);color:var(--gray-600);font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;">' +
              (c.items?c.items.length:0)+' prod.</span>' +
          '</td>' +
          '<td style="padding:12px 8px;">' +
            '<div style="font-size:14px;font-weight:900;color:var(--gray-800);">S/ '+c.total.toFixed(2)+'</div>' +
            (c.descuento>0?'<div style="font-size:10px;color:#16a34a;">Dcto: '+c.descuento+'%</div>':'') +
          '</td>' +
          '<td style="padding:12px 8px;">' +
            '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+ec.bg+';color:'+ec.c+';">' +
              '<span style="width:6px;height:6px;border-radius:50%;background:'+ec.dot+';display:inline-block;"></span>'+estadoLabel+'</span>' +
          '</td>' +
          '<td style="padding:12px 8px;">' +
            '<div style="font-size:11px;color:var(--gray-500);">'+(c.cajero||'—')+'</div>' +
          '</td>' +
          '<td style="padding:12px 16px;">' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
              '<button onclick="CotizacionesModule.ver('+c.id+')" title="Ver" style="width:30px;height:30px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:12px;"><i class="fas fa-eye"></i></button>' +
              '<button onclick="CotizacionesModule.imprimir('+c.id+')" title="Imprimir" style="width:30px;height:30px;border-radius:7px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:12px;"><i class="fas fa-print"></i></button>' +
              '<button onclick="CotizacionesModule.whatsapp('+c.id+')" title="WhatsApp" style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:12px;"><i class="fab fa-whatsapp"></i></button>' +
              (c.estado==='PENDIENTE' && !vencida ?
                '<button onclick="CotizacionesModule.cambiarEstado('+c.id+',\'APROBADA\')" title="Aprobar" style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:12px;"><i class="fas fa-check"></i></button>' +
                '<button onclick="CotizacionesModule.cambiarEstado('+c.id+',\'RECHAZADA\')" title="Rechazar" style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:12px;"><i class="fas fa-times"></i></button>' : '') +
              (c.estado==='APROBADA' ?
                '<button onclick="CotizacionesModule.convertirVenta('+c.id+')" title="Convertir a venta" style="padding:0 10px;height:30px;border-radius:7px;border:none;background:var(--accent);color:white;cursor:pointer;font-size:11px;font-weight:700;"><i class="fas fa-file-invoice" style="margin-right:4px;"></i>Facturar</button>' : '') +
              '<button onclick="CotizacionesModule.eliminar('+c.id+')" title="Eliminar" style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:12px;"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</td>' +
          '</tr>';
      });
    }

    // ── PAGINACIÓN ──
    var paginacion = '';
    if (totalPags > 1) {
      paginacion = '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--gray-200);">' +
        '<span style="font-size:12px;color:var(--gray-400);">'+
          (filtrados.length===0?0:inicio+1)+'–'+Math.min(filtrados.length,inicio+this._porPagina)+' de '+filtrados.length+' cotizaciones'+
        '</span>' +
        '<div style="display:flex;gap:4px;">' +
          '<button onclick="CotizacionesModule._pagina=1;App.renderPage();" '+(this._pagina===1?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">«</button>' +
          '<button onclick="CotizacionesModule._pagina--;App.renderPage();" '+(this._pagina===1?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">‹</button>' +
          (function(){
            var btns='', desde=Math.max(1,CotizacionesModule._pagina-2), hasta=Math.min(totalPags,desde+4);
            for(var i=desde;i<=hasta;i++){
              var act=i===CotizacionesModule._pagina;
              btns+='<button onclick="CotizacionesModule._pagina='+i+';App.renderPage();" style="padding:5px 9px;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';border-radius:6px;background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-700)')+';cursor:pointer;font-size:12px;font-weight:'+(act?'700':'400')+';">'+i+'</button>';
            }
            return btns;
          })() +
          '<button onclick="CotizacionesModule._pagina++;App.renderPage();" '+(this._pagina===totalPags?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">›</button>' +
          '<button onclick="CotizacionesModule._pagina='+totalPags+';App.renderPage();" '+(this._pagina===totalPags?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">»</button>' +
        '</div>' +
      '</div>';
    }

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-file-alt" style="color:var(--accent);margin-right:8px;"></i>Cotizaciones / Proformas</h2>' +
          '<p class="text-muted text-sm">'+todos.length+' cotizaciones · Total: S/ '+totalMonto.toFixed(2)+'</p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-outline" onclick="CotizacionesModule.exportar()"><i class="fas fa-file-csv"></i> Exportar</button>' +
          '<button class="btn btn-primary" onclick="CotizacionesModule.nueva()"><i class="fas fa-plus"></i> Nueva Cotización</button>' +
        '</div>' +
      '</div>' +
      statsBar +
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          filtrosBtns +
          '<div style="display:flex;gap:10px;">' +
            '<div style="position:relative;flex:1;">' +
              '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>' +
              '<input type="text" value="'+this._busqueda+'" placeholder="Buscar por número, cliente..." ' +
                'oninput="CotizacionesModule._busqueda=this.value;CotizacionesModule._pagina=1;App.renderPage();" ' +
                'style="width:100%;padding:8px 10px 8px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
              '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">N° Cotización</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cliente</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Vencimiento</th>' +
              '<th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Productos</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cajero</th>' +
              '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
            '</tr></thead>' +
            '<tbody>'+filas+'</tbody>' +
          '</table>' +
        '</div>' +
        paginacion +
      '</div>'
    );
  },

  // ──────────────────────────────────────────────────────
  // NUEVA COTIZACIÓN
  // ──────────────────────────────────────────────────────
  nueva() {
    this.currentItems = [];
    this._descuentoGlobal = 0;
    this._editandoId = null;
    this._notasTemp = '';
    var pub = (DB.clientes||[]).find(function(c){ return c.doc==='00000000'; });
    this.clienteSeleccionado = pub || (DB.clientes||[])[0];
    this._abrirFormulario('Nueva Cotización');
  },

  _abrirFormulario(titulo) {
    App.showModal(titulo, this._formHTML(), [
      {text:'<i class="fas fa-save"></i> Guardar Cotización', cls:'btn-primary', cb: function(){ CotizacionesModule._guardar(); }}
    ]);
    document.getElementById('modalBox').style.maxWidth = '780px';
  },

  _formHTML() {
    var self = this;
    var subtotal = this._getSubtotal();
    var dcto = subtotal * (this._descuentoGlobal||0) / 100;
    var total = subtotal - dcto;

    var itemsHTML = '';
    if (this.currentItems.length === 0) {
      itemsHTML = '<div style="text-align:center;padding:28px;color:var(--gray-400);background:var(--gray-50);border-radius:10px;">' +
        '<i class="fas fa-box-open" style="font-size:32px;display:block;margin-bottom:10px;opacity:0.3;"></i>' +
        '<div style="font-size:13px;font-weight:700;">Sin productos</div>' +
        '<div style="font-size:11px;margin-top:4px;">Usa el buscador para agregar</div>' +
      '</div>';
    } else {
      itemsHTML = '<div style="border:1.5px solid var(--gray-200);border-radius:10px;overflow:hidden;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="background:var(--gray-50);">' +
          '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Producto</th>' +
          '<th style="padding:8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cant.</th>' +
          '<th style="padding:8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">P.Unit</th>' +
          '<th style="padding:8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Dcto%</th>' +
          '<th style="padding:8px;text-align:right;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
          '<th style="padding:8px;"></th>' +
        '</tr></thead><tbody>' +
        this.currentItems.map(function(item, i) {
          return '<tr style="border-top:1px solid var(--gray-100);">' +
            '<td style="padding:10px 12px;">' +
              '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+item.nombre+'</div>' +
              '<div style="font-size:10px;color:var(--gray-400);">S/ '+item.precio.toFixed(2)+' c/u</div>' +
            '</td>' +
            '<td style="padding:8px;text-align:center;">' +
              '<input type="number" min="1" value="'+item.qty+'" style="width:55px;padding:5px;border:1.5px solid var(--gray-200);border-radius:6px;text-align:center;font-size:13px;font-weight:700;" ' +
                'onchange="CotizacionesModule._updItem('+i+',\'qty\',this.value)"/>' +
            '</td>' +
            '<td style="padding:8px;text-align:center;">' +
              '<input type="number" min="0" step="0.01" value="'+item.precio.toFixed(2)+'" style="width:70px;padding:5px;border:1.5px solid var(--gray-200);border-radius:6px;text-align:center;font-size:13px;font-weight:700;" ' +
                'onchange="CotizacionesModule._updItem('+i+',\'precio\',this.value)"/>' +
            '</td>' +
            '<td style="padding:8px;text-align:center;">' +
              '<input type="number" min="0" max="100" value="'+(item.dcto||0)+'" style="width:55px;padding:5px;border:1.5px solid '+(item.dcto>0?'#16a34a':'var(--gray-200)')+';border-radius:6px;text-align:center;font-size:13px;font-weight:700;color:'+(item.dcto>0?'#16a34a':'var(--gray-700)')+';" ' +
                'onchange="CotizacionesModule._updItem('+i+',\'dcto\',this.value)"/>' +
            '</td>' +
            '<td style="padding:8px;text-align:right;font-size:14px;font-weight:900;color:var(--accent);">S/ '+item.total.toFixed(2)+'</td>' +
            '<td style="padding:8px;text-align:center;">' +
              '<button onclick="CotizacionesModule._remove('+i+')" style="width:26px;height:26px;border-radius:5px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:11px;">' +
                '<i class="fas fa-times"></i></button>' +
            '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }

    return (
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        // Cliente
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Cliente <span style="color:red;">*</span></label>' +
          '<div style="display:flex;gap:8px;">' +
            '<select class="form-control" id="cot_cli" style="flex:1;" onchange="CotizacionesModule._onClienteChange(this.value)">' +
              (DB.clientes||[]).filter(function(c){ return c.tipo_cliente==='cliente'||c.doc==='00000000'; }).map(function(c){
                return '<option value="'+c.id+'"'+(CotizacionesModule.clienteSeleccionado&&CotizacionesModule.clienteSeleccionado.id===c.id?' selected':'')+'>'+c.nombre+'</option>';
              }).join('') +
            '</select>' +
          '</div>' +
        '</div>' +
        // Fecha vencimiento
        '<div class="form-group">' +
          '<label class="form-label">Válida hasta <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="cot_venc" type="date" value="'+this._fechaVenc()+'"/>' +
        '</div>' +
        // Descuento global
        '<div class="form-group">' +
          '<label class="form-label">Descuento Global (%)</label>' +
          '<input class="form-control" id="cot_dcto" type="number" min="0" max="100" value="'+(this._descuentoGlobal||0)+'" ' +
            'oninput="CotizacionesModule._descuentoGlobal=parseFloat(this.value)||0;CotizacionesModule._refrendarForm();" ' +
            'placeholder="0"/>' +
        '</div>' +
        // Notas
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Condiciones / Notas</label>' +
          '<input class="form-control" id="cot_notas" placeholder="Ej: Precio válido 30 días, incluye delivery, etc." value="'+(this._notasTemp||'')+'" oninput="CotizacionesModule._notasTemp=this.value"/>' +
        '</div>' +
      '</div>' +

      // Buscador de productos
      '<div style="margin-bottom:12px;">' +
        '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">' +
          '<i class="fas fa-boxes" style="color:var(--accent);margin-right:5px;"></i>Productos' +
          '<span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:6px;">'+this.currentItems.length+'</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
          '<div style="flex:1;position:relative;">' +
            '<i class="fas fa-barcode" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:15px;"></i>' +
            '<input type="text" id="cotProdBuscador" placeholder="Buscar producto por nombre o código..." ' +
              'oninput="CotizacionesModule._buscarProducto(this.value)" ' +
              'style="width:100%;padding:10px 10px 10px 38px;border:2px solid var(--gray-200);border-radius:10px;font-size:13px;outline:none;box-sizing:border-box;" ' +
              'onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--gray-200)\'"/>' +
          '</div>' +
          '<button onclick="CotizacionesModule._abrirBuscadorModal()" style="padding:0 16px;background:var(--accent);color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;">' +
            '<i class="fas fa-search" style="margin-right:5px;"></i>Buscar</button>' +
        '</div>' +
        '<div id="cotProdResultados"></div>' +
        itemsHTML +
      '</div>' +

      // Totales
      '<div style="background:var(--gray-50);border-radius:10px;padding:14px 18px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">' +
          '<span style="color:var(--gray-500);">Subtotal:</span>' +
          '<span style="font-weight:700;">S/ '+subtotal.toFixed(2)+'</span>' +
        '</div>' +
        (dcto>0?'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">' +
          '<span style="color:#16a34a;">Descuento ('+(this._descuentoGlobal||0)+'%):</span>' +
          '<span style="font-weight:700;color:#16a34a;">- S/ '+dcto.toFixed(2)+'</span>' +
        '</div>':'') +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(135deg,#1e3a5f,var(--accent));border-radius:10px;color:white;">' +
          '<span style="font-size:16px;font-weight:900;">TOTAL:</span>' +
          '<span style="font-size:24px;font-weight:900;">S/ '+total.toFixed(2)+'</span>' +
        '</div>' +
      '</div>'
    );
  },

  _onClienteChange(id) {
    this.clienteSeleccionado = (DB.clientes||[]).find(function(c){ return c.id===parseInt(id); });
  },

  _buscarProducto(term) {
    if (!term || term.length < 2) {
      var el = document.getElementById('cotProdResultados');
      if (el) el.innerHTML = '';
      return;
    }
    var found = (DB.productos||[]).filter(function(p){
      return (p.nombre||'').toLowerCase().includes(term.toLowerCase()) ||
             (p.codigo||'').toLowerCase().includes(term.toLowerCase());
    }).slice(0, 6);
    var el = document.getElementById('cotProdResultados');
    if (!el) return;
    if (found.length === 0) {
      el.innerHTML = '<div style="padding:10px;color:var(--gray-400);font-size:12px;text-align:center;">Sin resultados</div>';
      return;
    }
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">' +
      found.map(function(p){
        var agot = (p.stock||0)===0;
        return '<div onclick="'+(agot?'App.toast(\'Sin stock\',\'error\')':'CotizacionesModule._agregarProducto('+p.id+')')+'" ' +
          'style="padding:10px;border-radius:8px;border:1.5px solid var(--gray-200);background:white;cursor:'+(agot?'not-allowed':'pointer')+';opacity:'+(agot?'0.5':'1')+'" ' +
          'onmouseover="if(!'+agot+')this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--gray-200)\'">' +
          '<div style="font-size:12px;font-weight:700;margin-bottom:3px;">'+p.nombre+'</div>' +
          '<div style="font-size:13px;font-weight:900;color:var(--accent);">S/ '+p.precio_venta.toFixed(2)+'</div>' +
          '<div style="font-size:10px;color:'+(agot?'#dc2626':'#16a34a')+';">'+(agot?'Sin stock':'Stock: '+p.stock)+'</div>' +
          '</div>';
      }).join('') +
    '</div>';
  },

  _abrirBuscadorModal() {
    App.showModal('🔍 Buscar Producto',
      '<div style="position:relative;margin-bottom:12px;">' +
        '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);"></i>' +
        '<input type="text" autofocus placeholder="Nombre o código..." ' +
          'oninput="CotizacionesModule._filtrarModalProds(this.value)" ' +
          'style="width:100%;padding:10px 10px 10px 34px;border:2px solid var(--accent);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
      '</div>' +
      '<div id="modalProdsCot" style="max-height:380px;overflow-y:auto;">' +
        this._buildProdTable(DB.productos||[]) +
      '</div>', []
    );
    document.getElementById('modalBox').style.maxWidth = '600px';
  },

  _buildProdTable(prods) {
    if (!prods.length) return '<div style="text-align:center;padding:24px;color:var(--gray-400);">Sin resultados</div>';
    return '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="background:var(--gray-50);"><th style="padding:8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);">Producto</th>' +
      '<th style="padding:8px;font-size:11px;font-weight:800;color:var(--gray-500);">Precio</th>' +
      '<th style="padding:8px;font-size:11px;font-weight:800;color:var(--gray-500);">Stock</th>' +
      '<th style="padding:8px;"></th></tr></thead><tbody>' +
      prods.map(function(p){
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:8px;"><div style="font-size:13px;font-weight:700;">'+p.nombre+'</div><div style="font-size:11px;color:var(--gray-400);">'+p.codigo+'</div></td>' +
          '<td style="padding:8px;font-size:14px;font-weight:800;color:var(--accent);">S/ '+p.precio_venta.toFixed(2)+'</td>' +
          '<td style="padding:8px;">'+(p.stock>0?'<span style="color:#16a34a;font-weight:700;">'+p.stock+' uds</span>':'<span style="color:#dc2626;font-weight:700;">Agotado</span>')+'</td>' +
          '<td style="padding:8px;"><button onclick="CotizacionesModule._agregarProducto('+p.id+')" style="padding:5px 12px;background:var(--accent);color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:3px;"></i>Agregar</button></td>' +
        '</tr>';
      }).join('') +
    '</tbody></table>';
  },

  _filtrarModalProds(term) {
    var el = document.getElementById('modalProdsCot');
    if (!el) return;
    var found = !term ? (DB.productos||[]) : (DB.productos||[]).filter(function(p){
      return (p.nombre||'').toLowerCase().includes(term.toLowerCase()) || (p.codigo||'').toLowerCase().includes(term.toLowerCase());
    });
    el.innerHTML = CotizacionesModule._buildProdTable(found);
  },

  _agregarProducto(id) {
    var p = (DB.productos||[]).find(function(x){ return x.id===id; });
    if (!p) return;
    var ex = this.currentItems.findIndex(function(x){ return x.prod_id===id; });
    if (ex >= 0) {
      this.currentItems[ex].qty++;
      this.currentItems[ex].total = this.currentItems[ex].qty * this.currentItems[ex].precio * (1-(this.currentItems[ex].dcto||0)/100);
    } else {
      this.currentItems.push({prod_id:p.id, nombre:p.nombre, precio:p.precio_venta, qty:1, dcto:0, total:p.precio_venta});
    }
    App.toast(p.nombre+' agregado ✓','success');
    // Refrescar form
    var mb = document.getElementById('modalBody');
    if (mb) mb.innerHTML = this._formHTML();
    // Cerrar modal del buscador si está abierto
    // no cerrar modal principal
  },

  _updItem(idx, campo, val) {
    if (campo === 'qty') this.currentItems[idx].qty = Math.max(1, parseInt(val)||1);
    if (campo === 'precio') this.currentItems[idx].precio = Math.max(0, parseFloat(val)||0);
    if (campo === 'dcto') this.currentItems[idx].dcto = Math.min(100, Math.max(0, parseFloat(val)||0));
    var item = this.currentItems[idx];
    item.total = item.qty * item.precio * (1-(item.dcto||0)/100);
    this._refrendarForm();
  },

  _remove(idx) {
    this.currentItems.splice(idx, 1);
    this._refrendarForm();
  },

  _refrendarForm() {
    var mb = document.getElementById('modalBody');
    if (mb) mb.innerHTML = this._formHTML();
  },

  // ──────────────────────────────────────────────────────
  // GUARDAR
  // ──────────────────────────────────────────────────────
  _guardar() {
    if (!this.currentItems.length) { App.toast('Agrega al menos un producto','error'); return; }
    var cliId = parseInt(document.getElementById('cot_cli')?.value);
    var cli = (DB.clientes||[]).find(function(c){ return c.id===cliId; });
    if (!cli) { App.toast('Selecciona un cliente','error'); return; }

    var subtotal = this._getSubtotal();
    var dcto = this._descuentoGlobal || 0;
    var total = subtotal - subtotal*dcto/100;

    if (this._editandoId) {
      // Editar existente
      var idx = (DB.cotizaciones||[]).findIndex(function(x){ return x.id===CotizacionesModule._editandoId; });
      if (idx >= 0) {
        DB.cotizaciones[idx] = Object.assign(DB.cotizaciones[idx], {
          vencimiento: document.getElementById('cot_venc')?.value||'',
          cliente_id: cliId, cliente_nombre: cli.nombre,
          items: JSON.parse(JSON.stringify(this.currentItems)),
          subtotal, descuento: dcto, total,
          notas: document.getElementById('cot_notas')?.value||''
        });
        SupabaseDB.guardarCotizacion(DB.cotizaciones[idx]);
        App.toast('✅ Cotización actualizada','success');
      }
    } else {
      // Nueva
      var newId = Date.now();
      var numero = 'COT-'+String(DB._cotSeq).padStart(3,'0');
      DB._cotSeq++;
      try { localStorage.setItem('erp_cotseq', DB._cotSeq); } catch(e) {}
      var cot = {
        id: newId, numero,
        fecha: this._fechaHoy(),
        vencimiento: document.getElementById('cot_venc')?.value||this._fechaVenc(),
        cliente_id: cliId, cliente_nombre: cli.nombre,
        items: JSON.parse(JSON.stringify(this.currentItems)),
        subtotal, descuento: dcto, total,
        estado: 'PENDIENTE',
        notas: document.getElementById('cot_notas')?.value||'',
        cajero: DB.usuarioActual?.usuario||'—'
      };
      if (!DB.cotizaciones) DB.cotizaciones = [];
      DB.cotizaciones.unshift(cot);
      SupabaseDB.guardarCotizacion(cot);
      App.toast('✅ Cotización '+numero+' creada','success');
    }
    App.closeModal();
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // VER DETALLE
  // ──────────────────────────────────────────────────────
  ver(id) {
    var c = (DB.cotizaciones||[]).find(function(x){ return x.id===id; });
    if (!c) return;
    var cli = (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; });
    var self = this;
    var vencida = this._estaVencida(c);
    var estadoLabel = vencida ? 'VENCIDA' : c.estado;
    var estColors = {
      PENDIENTE:{bg:'#fffbeb',c:'#d97706'}, APROBADA:{bg:'#f0fdf4',c:'#16a34a'},
      RECHAZADA:{bg:'#fef2f2',c:'#dc2626'}, VENCIDA:{bg:'#f5f3ff',c:'#7c3aed'},
      CONVERTIDA:{bg:'#ecfeff',c:'#0891b2'}
    };
    var ec = estColors[estadoLabel]||estColors.PENDIENTE;

    var itemsHtml = (c.items||[]).map(function(i){
      return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:9px 8px;font-size:13px;font-weight:700;">'+i.nombre+'</td>' +
        '<td style="padding:9px 8px;text-align:center;font-size:13px;font-weight:700;">'+i.qty+'</td>' +
        '<td style="padding:9px 8px;text-align:right;font-size:13px;">S/ '+i.precio.toFixed(2)+'</td>' +
        '<td style="padding:9px 8px;text-align:center;font-size:12px;color:'+(i.dcto>0?'#16a34a':'var(--gray-400)')+';">'+(i.dcto>0?i.dcto+'%':'—')+'</td>' +
        '<td style="padding:9px 8px;text-align:right;font-size:14px;font-weight:900;color:var(--accent);">S/ '+i.total.toFixed(2)+'</td>' +
      '</tr>';
    }).join('');

    var html =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">' +
        '<div>' +
          '<div style="font-size:20px;font-weight:900;color:var(--accent);">'+c.numero+'</div>' +
          '<div style="font-size:12px;color:var(--gray-400);">Emitida: '+c.fecha+' · Cajero: '+(c.cajero||'—')+'</div>' +
        '</div>' +
        '<span style="padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;background:'+ec.bg+';color:'+ec.c+';">'+estadoLabel+'</span>' +
      '</div>' +
      '<div style="background:var(--gray-50);border-radius:10px;padding:12px 16px;margin-bottom:14px;">' +
        '<div style="font-size:13px;font-weight:800;color:var(--gray-800);">'+(cli?cli.nombre:(c.cliente_nombre||'N/A'))+'</div>' +
        '<div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div>' +
        '<div style="font-size:11px;color:'+(c.vencimiento<self._fechaHoy()?'#dc2626':'#16a34a')+';margin-top:4px;">Válida hasta: <strong>'+c.vencimiento+'</strong></div>' +
      '</div>' +
      '<div style="border:1px solid var(--gray-200);border-radius:10px;overflow:hidden;margin-bottom:14px;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);">' +
            '<th style="padding:8px;text-align:left;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Producto</th>' +
            '<th style="padding:8px;text-align:center;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Cant</th>' +
            '<th style="padding:8px;text-align:right;font-size:11px;color:var(--gray-500);text-transform:uppercase;">P.Unit</th>' +
            '<th style="padding:8px;text-align:center;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Dcto</th>' +
            '<th style="padding:8px;text-align:right;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
          '</tr></thead><tbody>'+itemsHtml+'</tbody>' +
        '</table>' +
      '</div>' +
      '<div style="padding:12px 16px;background:var(--gray-50);border-radius:10px;margin-bottom:12px;">' +
        (c.descuento>0?'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;"><span>Subtotal:</span><span>S/ '+(c.subtotal||c.total).toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;color:#16a34a;margin-bottom:8px;"><span>Descuento ('+c.descuento+'%):</span><span>- S/ '+((c.subtotal||c.total)*c.descuento/100).toFixed(2)+'</span></div>':'') +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(135deg,#1e3a5f,var(--accent));border-radius:10px;color:white;">' +
          '<span style="font-size:16px;font-weight:900;">TOTAL:</span>' +
          '<span style="font-size:24px;font-weight:900;">S/ '+c.total.toFixed(2)+'</span>' +
        '</div>' +
      '</div>' +
      (c.notas?'<div style="padding:10px 14px;background:#fffbeb;border-radius:8px;font-size:12px;color:#92400e;">' +
        '<i class="fas fa-sticky-note" style="margin-right:6px;"></i><strong>Notas:</strong> '+c.notas+'</div>':'');

    var btns = [
      {text:'<i class="fas fa-print"></i> Imprimir', cls:'btn-primary', cb:function(){App.closeModal();CotizacionesModule.imprimir(id);}},
      {text:'<i class="fab fa-whatsapp"></i> WhatsApp', cls:'btn-outline', cb:function(){CotizacionesModule.whatsapp(id);}},
    ];
    if (c.estado==='PENDIENTE' && !vencida) {
      btns.push({text:'<i class="fas fa-check"></i> Aprobar', cls:'btn-success', cb:function(){App.closeModal();CotizacionesModule.cambiarEstado(id,'APROBADA');}});
      btns.push({text:'<i class="fas fa-times"></i> Rechazar', cls:'btn-danger', cb:function(){App.closeModal();CotizacionesModule.cambiarEstado(id,'RECHAZADA');}});
    }
    if (c.estado==='APROBADA') {
      btns.push({text:'<i class="fas fa-file-invoice"></i> Facturar', cls:'btn-primary', cb:function(){App.closeModal();CotizacionesModule.convertirVenta(id);}});
    }

    App.showModal('📄 '+c.numero, html, btns);
    document.getElementById('modalBox').style.maxWidth = '560px';
  },

  // ──────────────────────────────────────────────────────
  // IMPRIMIR
  // ──────────────────────────────────────────────────────
  imprimir(id) {
    var c = (DB.cotizaciones||[]).find(function(x){ return x.id===id; });
    if (!c) return;
    var cli = (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; });
    var w = window.open('','_blank','width=680,height=820');
    if (!w) { App.toast('Activa ventanas emergentes para imprimir','warning'); return; }
    var dctoMonto = (c.subtotal||c.total) * (c.descuento||0) / 100;
    var itemsHtml = (c.items||[]).map(function(i){
      return '<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">'+i.nombre+'</td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #f0f0f0;">'+i.qty+'</td>' +
        '<td style="padding:8px;text-align:right;border-bottom:1px solid #f0f0f0;">S/ '+i.precio.toFixed(2)+'</td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #f0f0f0;color:'+(i.dcto>0?'#16a34a':'#999')+';">'+(i.dcto>0?i.dcto+'%':'—')+'</td>' +
        '<td style="padding:8px;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f0;">S/ '+i.total.toFixed(2)+'</td></tr>';
    }).join('');

    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+c.numero+'</title>' +
      '<style>' +
        'body{font-family:Arial,sans-serif;font-size:13px;max-width:680px;margin:0 auto;padding:24px;color:#1a1a2e;}' +
        '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1e3a5f;}' +
        '.empresa-nombre{font-size:22px;font-weight:900;color:#1e3a5f;}' +
        '.cot-badge{background:#1e3a5f;color:white;padding:8px 20px;border-radius:8px;font-size:16px;font-weight:900;}' +
        '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}' +
        '.info-box{background:#f8faff;border-radius:8px;padding:12px 16px;border-left:3px solid #1e3a5f;}' +
        '.info-label{font-size:10px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}' +
        '.info-value{font-size:13px;font-weight:700;color:#1a1a2e;}' +
        'table{width:100%;border-collapse:collapse;}' +
        'thead tr{background:#1e3a5f;color:white;}' +
        'th{padding:10px 8px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;}' +
        '.total-row{background:#f8faff;font-weight:800;}' +
        '.grand-total{background:#1e3a5f;color:white;font-size:15px;}' +
        '.footer{margin-top:24px;text-align:center;color:#666;font-size:11px;border-top:1px dashed #ccc;padding-top:12px;}' +
        '.validity{background:#fff8e1;border:1px solid #ffc107;border-radius:6px;padding:10px 14px;margin-top:16px;font-size:12px;}' +
        '@media print{body{padding:12px;}}' +
      '</style></head><body>' +
      '<div class="header">' +
        '<div>' +
          (DB.empresa.logo?'<img src="'+DB.empresa.logo+'" style="max-height:55px;margin-bottom:6px;display:block;" onerror="this.style.display=\'none\'">':'')+
          '<div class="empresa-nombre">'+DB.empresa.nombre+'</div>' +
          '<div style="font-size:12px;color:#666;">RUC: '+DB.empresa.ruc+'</div>' +
          '<div style="font-size:12px;color:#666;">'+DB.empresa.direccion+'</div>' +
          (DB.empresa.telefono?'<div style="font-size:12px;color:#666;">Tel: '+DB.empresa.telefono+'</div>':'')+
        '</div>' +
        '<div style="text-align:right;">' +
          '<div class="cot-badge">COTIZACIÓN</div>' +
          '<div style="font-size:18px;font-weight:900;color:#1e3a5f;margin-top:6px;">'+c.numero+'</div>' +
          '<div style="font-size:12px;color:#666;margin-top:2px;">Fecha: '+c.fecha+'</div>' +
        '</div>' +
      '</div>' +
      '<div class="info-grid">' +
        '<div class="info-box">' +
          '<div class="info-label">Cliente</div>' +
          '<div class="info-value">'+(cli?cli.nombre:(c.cliente_nombre||'PÚBLICO EN GENERAL'))+'</div>' +
          (cli&&cli.doc!=='00000000'?'<div style="font-size:11px;color:#666;margin-top:3px;">'+cli.tipo+': '+cli.doc+'</div>':'')+
          (cli&&cli.telefono?'<div style="font-size:11px;color:#666;">Tel: '+cli.telefono+'</div>':'')+
        '</div>' +
        '<div class="info-box">' +
          '<div class="info-label">Datos de la Cotización</div>' +
          '<div style="font-size:12px;margin-bottom:3px;"><strong>Emisión:</strong> '+c.fecha+'</div>' +
          '<div style="font-size:12px;margin-bottom:3px;"><strong>Válida hasta:</strong> <span style="color:'+(c.vencimiento<new Date().toISOString().split('T')[0]?'#dc2626':'#16a34a')+';">'+c.vencimiento+'</span></div>' +
          '<div style="font-size:12px;"><strong>Cajero:</strong> '+(c.cajero||'—')+'</div>' +
        '</div>' +
      '</div>' +
      '<table style="margin-bottom:16px;">' +
        '<thead><tr><th>Producto / Servicio</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">P. Unit.</th><th style="text-align:center;">Dcto.</th><th style="text-align:right;">Total</th></tr></thead>' +
        '<tbody>'+itemsHtml+'</tbody>' +
        '<tfoot>' +
          (c.descuento>0?'<tr class="total-row"><td colspan="4" style="padding:8px;text-align:right;">Subtotal:</td><td style="padding:8px;text-align:right;font-weight:700;">S/ '+(c.subtotal||c.total).toFixed(2)+'</td></tr>' +
          '<tr class="total-row"><td colspan="4" style="padding:8px;text-align:right;color:#16a34a;">Descuento ('+c.descuento+'%):</td><td style="padding:8px;text-align:right;color:#16a34a;font-weight:700;">- S/ '+dctoMonto.toFixed(2)+'</td></tr>':'') +
          '<tr class="grand-total"><td colspan="4" style="padding:12px;text-align:right;">TOTAL:</td><td style="padding:12px;text-align:right;font-size:16px;font-weight:900;">S/ '+c.total.toFixed(2)+'</td></tr>' +
        '</tfoot>' +
      '</table>' +
      (c.notas?'<div class="validity"><strong>📋 Condiciones:</strong> '+c.notas+'</div>':'')+
      '<div class="footer">' +
        'Esta cotización es válida hasta el <strong>'+c.vencimiento+'</strong><br/>' +
        DB.empresa.nombre+' · RUC: '+DB.empresa.ruc+' · '+DB.empresa.direccion+
        (DB.empresa.whatsapp?'<br/>WhatsApp: +51'+DB.empresa.whatsapp:'')+
        '<br/><br/>⚠️ Esta cotización no constituye comprobante de pago' +
      '</div>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(function(){ w.print(); }, 300);
  },

  // ──────────────────────────────────────────────────────
  // WHATSAPP
  // ──────────────────────────────────────────────────────
  whatsapp(id) {
    var c = (DB.cotizaciones||[]).find(function(x){ return x.id===id; });
    if (!c) return;
    var cli = (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; });
    var items = (c.items||[]).map(function(i){
      return '• '+i.nombre+' x'+i.qty+' = S/ '+i.total.toFixed(2);
    }).join('\n');
    var msg = '🏪 *'+DB.empresa.nombre+'*\n\n' +
      '📋 *COTIZACIÓN '+c.numero+'*\n' +
      '📅 Válida hasta: '+c.vencimiento+'\n\n' +
      '*Detalle:*\n'+items+'\n\n' +
      (c.descuento>0?'🏷️ Descuento: '+c.descuento+'%\n':'') +
      '*💰 TOTAL: S/ '+c.total.toFixed(2)+'*\n\n' +
      (c.notas?'📝 '+c.notas+'\n\n':'')+
      '¡Gracias por su preferencia! 🙏';
    var tel = cli&&cli.telefono ? '51'+cli.telefono.replace(/\D/g,'') : '';
    window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(msg),'_blank');
  },

  // ──────────────────────────────────────────────────────
  // CAMBIAR ESTADO
  // ──────────────────────────────────────────────────────
  cambiarEstado(id, estado) {
    var i = (DB.cotizaciones||[]).findIndex(function(x){ return x.id===id; });
    if (i >= 0) {
      DB.cotizaciones[i].estado = estado;
      SupabaseDB.guardarCotizacion(DB.cotizaciones[i]);
      App.toast('Cotización '+estado.toLowerCase(),'success');
      App.renderPage();
    }
  },

  // ──────────────────────────────────────────────────────
  // CONVERTIR A VENTA
  // ──────────────────────────────────────────────────────
  convertirVenta(id) {
    var c = (DB.cotizaciones||[]).find(function(x){ return x.id===id; });
    if (!c) return;
    VentasModule.currentItems = (c.items||[]).map(function(i){
      return {prod_id:i.prod_id||0, codigo:'', nombre:i.nombre, imagen:'', unidad:'UND',
        precio:i.precio, qty:i.qty, dcto:i.dcto||0, total:i.total};
    });
    VentasModule.selectedCliente = (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; });
    VentasModule.tipoComprobante = 'NOTA DE VENTA';
    VentasModule.serieActual = 'NV03';
    var idx = (DB.cotizaciones||[]).findIndex(function(x){ return x.id===id; });
    if (idx >= 0) {
      DB.cotizaciones[idx].estado = 'CONVERTIDA';
      SupabaseDB.guardarCotizacion(DB.cotizaciones[idx]);
    }
    App.toast('✅ Cotización convertida a venta','success');
    App.navigate('ventas');
    setTimeout(function(){
      VentasModule.modoVista = 'comprobante';
      App.renderPage();
    }, 100);
  },

  // ──────────────────────────────────────────────────────
  // ELIMINAR
  // ──────────────────────────────────────────────────────
  eliminar(id) {
    var c = (DB.cotizaciones||[]).find(function(x){ return x.id===id; });
    if (!c) return;
    App.showModal('🗑️ Eliminar Cotización',
      '<div style="text-align:center;padding:10px;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
          '<i class="fas fa-trash" style="font-size:26px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">¿Eliminar '+c.numero+'?</div>' +
        '<div style="font-size:13px;color:var(--gray-500);">Esta acción no se puede deshacer.</div>' +
      '</div>',
      [{text:'🗑️ Sí, eliminar', cls:'btn-danger', cb:function(){
        var i = (DB.cotizaciones||[]).findIndex(function(x){ return x.id===id; });
        if (i >= 0) DB.cotizaciones.splice(i, 1);
        SupabaseDB.eliminarCotizacion(id);
        App.toast('Cotización eliminada','warning');
        App.closeModal();
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '360px';
  },

  // ──────────────────────────────────────────────────────
  // EXPORTAR CSV
  // ──────────────────────────────────────────────────────
  exportar() {
    var header = 'Número,Fecha,Vencimiento,Cliente,Total,Descuento%,Estado,Cajero\n';
    var rows = (DB.cotizaciones||[]).map(function(c){
      return c.numero+','+c.fecha+','+c.vencimiento+',"'+(c.cliente_nombre||'N/A')+'",'+c.total.toFixed(2)+','+(c.descuento||0)+','+c.estado+','+(c.cajero||'');
    }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8;'}));
    a.download = 'cotizaciones_'+this._fechaHoy()+'.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast((DB.cotizaciones||[]).length+' cotizaciones exportadas','success');
  }
};

// ============================================================
// MÓDULO: NOTAS DE CRÉDITO / DÉBITO
// ============================================================

if (!DB.notasCredito) DB.notasCredito = [];

const NotasCreditoModule = {
  render() {
    App.setTabs2('Notas de Crédito / Débito', 'VENTAS');
    var creditos = (DB.notasCredito||[]).filter(function(n){ return n.tipo==='CREDITO'; }).length;
    var debitos  = (DB.notasCredito||[]).filter(function(n){ return n.tipo==='DEBITO';  }).length;
    var total    = (DB.notasCredito||[]).reduce(function(s,n){ return s+n.monto; }, 0);

    var filas = (DB.notasCredito||[]).length === 0 ?
      '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--gray-400);"><i class="fas fa-file-invoice" style="font-size:36px;display:block;margin-bottom:10px;opacity:0.3;"></i><div>Sin notas registradas</div></td></tr>' :
      (DB.notasCredito||[]).map(function(n){
        var cli = (DB.clientes||[]).find(function(x){ return x.id===n.cliente_id; });
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:11px 14px;">' +
            '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(n.tipo==='CREDITO'?'#f0fdf4':'#fef2f2')+';color:'+(n.tipo==='CREDITO'?'#16a34a':'#dc2626')+';">'+n.tipo+'</span>' +
          '</td>' +
          '<td style="padding:11px 8px;"><strong style="color:var(--accent);">'+n.numero+'</strong></td>' +
          '<td style="padding:11px 8px;font-size:12px;color:var(--gray-600);">'+n.fecha+'</td>' +
          '<td style="padding:11px 8px;font-size:12px;color:var(--gray-500);">'+n.venta_ref+'</td>' +
          '<td style="padding:11px 8px;font-size:13px;font-weight:700;">'+(cli?cli.nombre:'N/A')+'</td>' +
          '<td style="padding:11px 8px;font-size:12px;color:var(--gray-600);">'+n.motivo+'</td>' +
          '<td style="padding:11px 8px;font-size:14px;font-weight:900;color:var(--gray-800);">S/ '+n.monto.toFixed(2)+'</td>' +
          '<td style="padding:11px 8px;"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;background:#f0fdf4;color:#16a34a;">EMITIDA</span></td>' +
          '<td style="padding:11px 14px;"><button onclick="NotasCreditoModule.imprimir('+n.id+')" style="width:30px;height:30px;border-radius:7px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:12px;"><i class="fas fa-print"></i></button></td>' +
        '</tr>';
      }).join('');

    return (
      '<div class="page-header">' +
        '<div><h2 class="page-title"><i class="fas fa-file-invoice" style="color:var(--accent);margin-right:8px;"></i>Notas de Crédito / Débito</h2></div>' +
        '<div class="page-actions"><button class="btn btn-primary" onclick="NotasCreditoModule.nueva()"><i class="fas fa-plus"></i> Nueva Nota</button></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">' +
        '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:9px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;"><i class="fas fa-file-invoice"></i></div>' +
          '<div><div style="font-size:18px;font-weight:900;color:#16a34a;">'+creditos+'</div><div style="font-size:11px;color:var(--gray-400);">Notas de Crédito</div></div>' +
        '</div>' +
        '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:9px;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;"><i class="fas fa-file-invoice"></i></div>' +
          '<div><div style="font-size:18px;font-weight:900;color:#dc2626;">'+debitos+'</div><div style="font-size:11px;color:var(--gray-400);">Notas de Débito</div></div>' +
        '</div>' +
        '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:9px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;"><i class="fas fa-dollar-sign"></i></div>' +
          '<div><div style="font-size:18px;font-weight:900;color:#2563eb;">S/ '+total.toFixed(2)+'</div><div style="font-size:11px;color:var(--gray-400);">Monto Total</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
              '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Tipo</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Número</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Fecha</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Ref. Venta</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cliente</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Motivo</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Monto</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
              '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
            '</tr></thead>' +
            '<tbody>'+filas+'</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    );
  },

  nueva() {
    App.showModal('Nueva Nota de Crédito / Débito',
      '<div class="form-grid">' +
        '<div class="form-group"><label class="form-label">Tipo *</label>' +
          '<select class="form-control" id="nc_tipo"><option value="CREDITO">NOTA DE CRÉDITO</option><option value="DEBITO">NOTA DE DÉBITO</option></select></div>' +
        '<div class="form-group"><label class="form-label">Comprobante de Referencia</label>' +
          '<select class="form-control" id="nc_ref">' +
            (DB.ventas||[]).slice(0,50).map(function(v){ return '<option value="'+v.serie+'-'+v.numero+'">'+v.serie+'-'+v.numero+'</option>'; }).join('') +
          '</select></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Cliente *</label>' +
          '<select class="form-control" id="nc_cli">' +
            (DB.clientes||[]).filter(function(c){ return c.tipo_cliente==='cliente'; }).map(function(c){ return '<option value="'+c.id+'">'+c.nombre+'</option>'; }).join('') +
          '</select></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Motivo *</label>' +
          '<select class="form-control" id="nc_motivo">' +
            ['ANULACION','DEVOLUCION','DESCUENTO','AJUSTE DE PRECIO','ERROR EN COMPROBANTE','DIFERENCIA DE CAMBIO'].map(function(m){ return '<option>'+m+'</option>'; }).join('') +
          '</select></div>' +
        '<div class="form-group"><label class="form-label">Monto (S/) *</label>' +
          '<input class="form-control" id="nc_monto" type="number" step="0.01" min="0.01" placeholder="0.00" style="font-size:22px;text-align:center;font-weight:900;"/></div>' +
        '<div class="form-group"><label class="form-label">Fecha</label>' +
          '<input class="form-control" id="nc_fecha" type="date" value="'+new Date().toISOString().split('T')[0]+'"/></div>' +
      '</div>',
      [{text:'✅ Emitir Nota', cls:'btn-primary', cb:function(){
        var tipo = document.getElementById('nc_tipo')?.value;
        var monto = parseFloat(document.getElementById('nc_monto')?.value)||0;
        if (!monto) { App.toast('Ingresa el monto','error'); return; }
        var seq = (DB.notasCredito||[]).length + 1;
        var prefix = tipo==='CREDITO'?'NC01':'ND01';
        if (!DB.notasCredito) DB.notasCredito = [];
        DB.notasCredito.push({
          id:Date.now(), tipo,
          numero:prefix+'-'+String(seq).padStart(3,'0'),
          fecha:document.getElementById('nc_fecha')?.value,
          venta_ref:document.getElementById('nc_ref')?.value||'',
          cliente_id:parseInt(document.getElementById('nc_cli')?.value),
          motivo:document.getElementById('nc_motivo')?.value,
          monto, estado:'EMITIDA'
        });
        App.toast('Nota de '+tipo.toLowerCase()+' emitida','success');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '520px';
  },

  imprimir(id) { App.toast('Función de impresión próximamente','info'); }
};
