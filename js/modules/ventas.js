// ============================================================
// MÓDULO: VENTAS — Versión Profesional v2
// ============================================================

const VentasModule = {

  // ─── ESTADO LISTA ───
  fechaInicio:  '',
  fechaFin:     '',
  tipoFilter:   'todos',
  searchTerm:   '',
  currentPage:  1,
  itemsPerPage: 15,
  _filtroRapido: '',

  // ─── ESTADO COMPROBANTE ───
  currentItems:    [],
  selectedCliente: null,
  tipoComprobante: 'NOTA DE VENTA',
  serieActual:     'NVA1',
  metodoPago:      'EFECTIVO',
  montoPago:       0,
  descGlobal:      0,
  modoVista:       'lista',
  _searchResults:  null,
  _subMetodoCombinado: 'YAPE+EFECTIVO',
  mayoristaModo:   false,
  _montoCombinadoA: 0,
  _montoCombinadoB: 0,

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────
  render() {
    App.setTabs2('Gestión de Ventas','VENTAS');
    return this.modoVista === 'comprobante' ? this.renderComprobante() : this.renderLista();
  },

  _fechaLocal() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _fechaMes() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';
  },
  _fechaSemana() {
    var d = new Date();
    d.setDate(d.getDate()-6);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  formatFecha(f) {
    if (!f) return '';
    var p = f.split('-');
    return p[2]+'/'+p[1]+'/'+p[0];
  },

  // ─────────────────────────────────────────────────────────
  // LISTA DE VENTAS
  // ─────────────────────────────────────────────────────────
  renderLista() {
    var hoy  = this._fechaLocal();
    var self = this;

    // Aplicar filtro rápido
    if (this._filtroRapido === 'hoy')    { this.fechaInicio=hoy;              this.fechaFin=hoy; }
    if (this._filtroRapido === 'semana') { this.fechaInicio=this._fechaSemana(); this.fechaFin=hoy; }
    if (this._filtroRapido === 'mes')    { this.fechaInicio=this._fechaMes();  this.fechaFin=hoy; }
    if (!this.fechaInicio) this.fechaInicio = this._fechaMes();
    if (!this.fechaFin)    this.fechaFin    = hoy;

    var filtered   = this.getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length/this.itemsPerPage));
    var page       = Math.min(this.currentPage, totalPages);
    var paged      = filtered.slice((page-1)*this.itemsPerPage, page*this.itemsPerPage);

    // Stats de hoy
    var vHoy      = (DB.ventas||[]).filter(function(v){return v.fecha===hoy && v.estado!=='ANULADO';});
    var tHoy      = vHoy.reduce(function(s,v){return s+v.total;},0);
    var tFiltered = filtered.reduce(function(s,v){return s+v.total;},0);
    var tAcep     = filtered.filter(function(v){return v.estado==='ACEPTADO';}).reduce(function(s,v){return s+v.total;},0);

    // ── STATS BAR ──
    var statsBar = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {l:'Ventas Hoy',      v:vHoy.length,                   sub:'S/ '+tHoy.toFixed(2),              c:'#2563eb',bg:'#eff6ff',i:'fa-calendar-day'},
        {l:'En Período',      v:filtered.length,                sub:filtered.length+' comprobantes',    c:'#16a34a',bg:'#f0fdf4',i:'fa-file-invoice'},
        {l:'Anulados', v:filtered.filter(function(v){return v.estado==='ANULADO';}).length, sub:'comprobantes anulados', c:'#dc2626',bg:'#fef2f2',i:'fa-ban'},
        {l:'Aceptados SUNAT', v:filtered.filter(function(v){return v.estado==='ACEPTADO';}).length, sub:'S/ '+tAcep.toFixed(2), c:'#16a34a',bg:'#f0fdf4',i:'fa-check-circle'},
        {l:'Por Enviar',      v:filtered.filter(function(v){return v.estado==='NO_ENVIADO';}).length, sub:'pendientes SUNAT', c:'#d97706',bg:'#fffbeb',i:'fa-clock'},
      ].map(function(k){
        return '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:12px;">' +
          '<div style="width:38px;height:38px;border-radius:10px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas '+k.i+'"></i></div>' +
          '<div><div style="font-size:17px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+k.l+'</div>' +
          '<div style="font-size:10px;color:var(--gray-500);">'+k.sub+'</div></div>' +
        '</div>';
      }).join('')+'</div>';

    // ── FILTROS RÁPIDOS ──
    var filtrosRapidos = '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' +
      [['','Todo el período'],['hoy','Hoy'],['semana','Última semana'],['mes','Este mes']].map(function(f){
        var act = self._filtroRapido===f[0];
        return '<button onclick="VentasModule._filtroRapido=\''+f[0]+'\';VentasModule.currentPage=1;App.renderPage()" ' +
          'style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-600)')+';">'+f[1]+'</button>';
      }).join('')+'</div>';

    // ── TABLA ──
    var filas = paged.length===0 ?
      '<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--gray-400);">' +
        '<i class="fas fa-file-invoice" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<div style="font-size:14px;font-weight:700;">No hay ventas en este período</div>' +
        '<button onclick="VentasModule.nuevaVenta()" style="margin-top:12px;padding:9px 20px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Crear primer comprobante</button>' +
      '</td></tr>' :
      paged.map(function(v){
        var cli = (DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
        var cliNombre = cli ? cli.nombre : (v.cliente_nombre||'N/A');
        var cliDoc = cli ? (cli.tipo+': '+cli.doc) : (v.cliente_doc||'');
        var tipoColor = v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
        var tipoLabel = v.tipo==='BOL'?'BOLETA':v.tipo==='FAC'?'FACTURA':'N. VENTA';
        var estMap = {
          ACEPTADO: {bg:'#f0fdf4',c:'#16a34a',l:'✓ Aceptado'},
          ANULADO:  {bg:'#fef2f2',c:'#dc2626',l:'✗ Anulado'},
          NO_ENVIADO:{bg:'#fffbeb',c:'#d97706',l:'⏳ Por enviar'},
        };
        var est = estMap[v.estado] || estMap.NO_ENVIADO;
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:11px 14px;">' +
            '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+self.formatFecha(v.fecha)+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+v.hora+'</div>' +
          '</td>' +
          '<td style="padding:11px 8px;">' +
            '<span style="display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;background:'+tipoColor+'18;color:'+tipoColor+';margin-bottom:3px;">'+tipoLabel+'</span>' +
            '<div style="font-size:13px;font-weight:800;color:'+tipoColor+';">'+v.serie+'-'+v.numero+'</div>' +
          '</td>' +
          '<td style="padding:11px 8px;">' +
            '<div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">'+cliNombre+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+cliDoc+'</div>' +
          '</td>' +
          '<td style="padding:11px 8px;">' +
            '<div style="font-size:12px;color:var(--gray-600);max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+v.metodo_pago+'</div>' +
          '</td>' +
          '<td style="padding:11px 8px;">' +
            '<div style="font-size:15px;font-weight:900;color:var(--gray-800);">S/ '+v.total.toFixed(2)+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+( v.items?v.items.length:0)+' productos</div>' +
          '</td>' +
          '<td style="padding:11px 8px;">' +
            '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+est.bg+';color:'+est.c+';">'+est.l+'</span>' +
          '</td>' +
          '<td style="padding:11px 14px;">' +
            '<div style="display:flex;gap:4px;">' +
              '<button onclick="VentasModule.verDetalle('+v.id+')" title="Ver detalle" style="width:30px;height:30px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:12px;"><i class="fas fa-eye"></i></button>' +
              '<button onclick="VentasModule.imprimir('+v.id+')" title="Imprimir" style="width:30px;height:30px;border-radius:7px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:12px;"><i class="fas fa-print"></i></button>' +
              (v.estado!=='ACEPTADO'&&v.estado!=='ANULADO' ?
                '<button onclick="VentasModule.enviarSunat('+v.id+')" title="Enviar SUNAT" style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:12px;"><i class="fas fa-paper-plane"></i></button>' : '') +
              (v.estado!=='ANULADO' ?
                '<button onclick="VentasModule.anular('+v.id+')" title="Anular" style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:12px;"><i class="fas fa-ban"></i></button>' : '') +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');

    // ── PAGINACIÓN ──
    var paginacion = totalPages<=1 ? '' :
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--gray-200);">' +
        '<span style="font-size:12px;color:var(--gray-400);">'+
          Math.min((page-1)*this.itemsPerPage+1,filtered.length)+'–'+
          Math.min(page*this.itemsPerPage,filtered.length)+' de '+filtered.length+' comprobantes'+
        '</span>' +
        '<div style="display:flex;gap:4px;">' +
          '<button onclick="VentasModule.currentPage=1;App.renderPage()" '+(page===1?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">«</button>' +
          '<button onclick="VentasModule.currentPage--;App.renderPage()" '+(page===1?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">‹</button>' +
          (function(){
            var btns='', desde=Math.max(1,page-2), hasta=Math.min(totalPages,desde+4);
            for(var i=desde;i<=hasta;i++){
              var act=i===page;
              btns+='<button onclick="VentasModule.currentPage='+i+';App.renderPage()" style="padding:6px 10px;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';border-radius:7px;background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-700)')+';cursor:pointer;font-size:12px;font-weight:'+(act?'700':'400')+';">'+i+'</button>';
            }
            return btns;
          })() +
          '<button onclick="VentasModule.currentPage++;App.renderPage()" '+(page===totalPages?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">›</button>' +
          '<button onclick="VentasModule.currentPage='+totalPages+';App.renderPage()" '+(page===totalPages?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">»</button>' +
        '</div>' +
      '</div>';

    return '<div class="page-header"><div>' +
        '<h2 class="page-title"><i class="fas fa-file-invoice-dollar" style="color:var(--accent);margin-right:8px;"></i>Gestión de Ventas</h2>' +
        '<p class="text-muted text-sm">Comprobantes, facturas y notas de venta</p>' +
      '</div><div class="page-actions">' +
        '<button onclick="VentasModule.exportarVentas()" style="padding:9px 16px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-file-csv" style="margin-right:5px;color:#16a34a;"></i>Exportar</button>' +
        '<button onclick="VentasModule.nuevaVenta()" style="padding:9px 20px;background:var(--accent);color:white;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nuevo Comprobante</button>' +
      '</div></div>' +
      statsBar +
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          filtrosRapidos +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
            '<div style="display:flex;gap:6px;align-items:center;">' +
              '<label style="font-size:11px;font-weight:700;color:var(--gray-500);">DESDE</label>' +
              '<input type="date" value="'+this.fechaInicio+'" onchange="VentasModule._filtroRapido=\'\';VentasModule.fechaInicio=this.value;VentasModule.currentPage=1;App.renderPage()" style="padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;"/>' +
            '</div>' +
            '<div style="display:flex;gap:6px;align-items:center;">' +
              '<label style="font-size:11px;font-weight:700;color:var(--gray-500);">HASTA</label>' +
              '<input type="date" value="'+this.fechaFin+'" onchange="VentasModule._filtroRapido=\'\';VentasModule.fechaFin=this.value;VentasModule.currentPage=1;App.renderPage()" style="padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;"/>' +
            '</div>' +
            '<select onchange="VentasModule.tipoFilter=this.value;VentasModule.currentPage=1;App.renderPage()" style="padding:7px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;background:white;cursor:pointer;">' +
              '<option value="todos"'+(this.tipoFilter==='todos'?' selected':'')+'>Todos los tipos</option>' +
              '<option value="N. VENTA"'+(this.tipoFilter==='N. VENTA'?' selected':'')+'>Nota de Venta</option>' +
              '<option value="BOL"'+(this.tipoFilter==='BOL'?' selected':'')+'>Boleta</option>' +
              '<option value="FAC"'+(this.tipoFilter==='FAC'?' selected':'')+'>Factura</option>' +
              '<option value="ANULADO"'+(this.tipoFilter==='ANULADO'?' selected':'')+'>Anulados</option>' +
            '</select>' +
            '<div style="position:relative;flex:1;min-width:200px;">' +
              '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>' +
              '<input type="text" placeholder="Buscar comprobante, cliente..." value="'+this.searchTerm+'" ' +
                'oninput="VentasModule.searchTerm=this.value;VentasModule.currentPage=1;App.renderPage()" ' +
                'style="width:100%;padding:7px 10px 7px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;"/>' +
            '</div>' +
            (this.searchTerm||this.tipoFilter!=='todos' ?
              '<button onclick="VentasModule.limpiarFiltros()" style="padding:7px 14px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-times" style="margin-right:4px;"></i>Limpiar</button>' : '') +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
              '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Fecha</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Comprobante</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cliente</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Método</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
              '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
            '</tr></thead>' +
            '<tbody>'+filas+'</tbody>' +
          '</table>' +
        '</div>' +
        paginacion +
      '</div>';
  },

  // ─────────────────────────────────────────────────────────
  // NUEVO COMPROBANTE
  // ─────────────────────────────────────────────────────────
  nuevoComprobante() { this.nuevaVenta(); },

  nuevaVenta() {
    this.currentItems   = [];
    this._searchResults = null;
    var pub = (DB.clientes||[]).find(function(c){return c.doc==='00000000';});
    if (!pub) {
      pub = {id:0,doc:'00000000',nombre:'PÚBLICO EN GENERAL',tipo:'DNI',tipo_cliente:'cliente',telefono:'',email:'',direccion:''};
      DB.clientes.unshift(pub);
    }
    this.selectedCliente = pub;
    this.tipoComprobante = 'NOTA DE VENTA';
    this.serieActual     = 'NVA1';
    this.metodoPago      = 'EFECTIVO';
    this.montoPago       = 0;
    this.descGlobal      = 0;
    this.mayoristaModo   = false;
    this._convertingFromId = null;
    this._montoCombinadoA = 0;
    this._montoCombinadoB = 0;
    this.modoVista       = 'comprobante';
    App.renderPage();
  },

  // ─────────────────────────────────────────────────────────
  // RENDER COMPROBANTE (sin cambios funcionales, mejora visual)
  // ─────────────────────────────────────────────────────────
  renderComprobante() {
    var self     = this;
    var total    = this.getTotal();
    var vuelto   = Math.max(0, this.montoPago - total);
    var hoy      = this._fechaLocal();
    var serie    = this.serieActual;
    var nextNum  = DB._sequences && DB._sequences[serie] ? String(DB._sequences[serie]).padStart(8,'0') : '00000001';
    var cli      = this.selectedCliente;
    var usuario  = DB.usuarioActual;

    var tipos = [
  {key:'NVA1',label:'NOTA DE VENTA',      color:'#ea580c',nombre:'NOTA DE VENTA'},
  {key:'B0A1',label:'BOLETA ELECTRÓNICA',  color:'#2563eb',nombre:'BOLETA DE VENTA ELECTRONICA'},
  {key:'F0A1',label:'FACTURA ELECTRÓNICA', color:'#7c3aed',nombre:'FACTURA ELECTRONICA'},
];
    var tiposBtns = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
    tipos.forEach(function(t){
      var act = self.serieActual===t.key;
      tiposBtns += '<button onclick="VentasModule.cambiarTipo(\''+t.key+'\',\''+t.nombre+'\')" ' +
        'style="padding:14px;border-radius:10px;border:2px solid '+(act?t.color:'var(--gray-200)')+';' +
        'background:'+(act?t.color+'18':'white')+';color:'+(act?t.color:'var(--gray-500)')+';' +
        'font-size:13px;font-weight:900;cursor:pointer;transition:all 0.15s;">'+t.label+'</button>';
    });
    tiposBtns += '</div>';

    // Productos recientes
    var productosRecientes = (function(){
      var usados={};
      (DB.ventas||[]).slice(0,20).forEach(function(v){(v.items||[]).forEach(function(it){usados[it.prod_id]=true;});});
      var rec=(DB.productos||[]).filter(function(p){return usados[p.id];}).slice(0,8);
      if(rec.length<4)(DB.productos||[]).forEach(function(p){if(!usados[p.id]&&rec.length<8)rec.push(p);});
      return rec;
    })();

    var itemsArea = '';
    if(this.currentItems.length===0 && !this._searchResults){
      itemsArea = '<div style="padding:14px 16px;">' +
        '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;"><i class="fas fa-star" style="color:#f59e0b;margin-right:5px;"></i>Productos Recientes — Clic para agregar</div>' +
        (productosRecientes.length===0 ?
          '<div style="text-align:center;padding:40px;color:var(--gray-400);"><i class="fas fa-barcode" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.2;"></i><p>Escanea o busca un producto</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' +
            productosRecientes.map(function(p){
              var sClr=p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
              return '<div onclick="VentasModule.agregarDesdeResultados('+p.id+')" ' +
                'style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px;border-radius:12px;border:2px solid var(--gray-200);background:white;cursor:pointer;transition:all 0.15s;'+(p.stock===0?'opacity:0.5;':'')+'" ' +
                'onmouseover="if('+p.stock+'>0){this.style.borderColor=\'var(--accent)\';this.style.background=\'#f8faff\';}" ' +
                'onmouseout="this.style.borderColor=\'var(--gray-200)\';this.style.background=\'white\';">' +
                (p.imagen?'<img src="'+p.imagen+'" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display=\'none\'">':'<div style="width:60px;height:60px;border-radius:8px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;margin-bottom:8px;"><i class="fas fa-image" style="font-size:20px;color:var(--gray-300);"></i></div>')+
                '<div style="font-size:12px;font-weight:800;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">'+p.nombre+'</div>' +
                '<div style="font-size:14px;font-weight:900;color:var(--accent);margin-bottom:3px;">S/ '+p.precio_venta.toFixed(2)+'</div>' +
                '<div style="font-size:10px;font-weight:700;color:'+sClr+';">'+(p.stock===0?'Sin stock':'Stock: '+p.stock)+'</div>' +
                (p.stock>0?'<div style="margin-top:6px;padding:4px 12px;background:var(--accent);color:white;border-radius:6px;font-size:11px;font-weight:700;"><i class="fas fa-plus" style="margin-right:3px;"></i>Agregar</div>':'')+
              '</div>';
            }).join('')+
          '</div>'
        ) +
      '</div>';
    } else if(this._searchResults){
      itemsArea = '<div style="padding:10px 14px;">'+self._buildSearchHTML(self._searchResults)+'</div>';
    }

    var metodos=[
      {val:'EFECTIVO',icon:'fa-money-bill-wave',c:'#16a34a',l:'Efectivo'},
      {val:'TARJETA', icon:'fa-credit-card',    c:'#2563eb',l:'Tarjeta'},
      {val:'YAPE',    icon:'fa-mobile-alt',      c:'#7c3aed',l:'Yape/Plin'},
      {val:'COMBINADO',icon:'fa-layer-group',    c:'#0891b2',l:'Combinado'},
    ];
    var metodoBtns='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">';
    metodos.forEach(function(m){
      var act=self.metodoPago===m.val;
      metodoBtns+='<button onclick="VentasModule.metodoPago=\''+m.val+'\';App.renderPage();" ' +
        'style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;border:2px solid '+(act?m.c:'var(--gray-200)')+';background:'+(act?m.c+'18':'white')+';cursor:pointer;transition:all 0.15s;">' +
        '<div style="width:30px;height:30px;border-radius:7px;background:'+(act?m.c:'var(--gray-100)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<i class="fas '+m.icon+'" style="color:'+(act?'white':m.c)+';font-size:13px;"></i></div>' +
        '<span style="font-size:12px;font-weight:800;color:'+(act?m.c:'var(--gray-600)')+';">'+m.l+'</span>' +
        (act?'<i class="fas fa-check-circle" style="margin-left:auto;color:'+m.c+';font-size:13px;"></i>':'')+
      '</button>';
    });
    metodoBtns+='</div>';

    var combinadoSection = self.metodoPago==='COMBINADO' ?
      '<div style="margin-bottom:14px;background:var(--gray-50);border:2px solid var(--gray-200);border-radius:12px;padding:16px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
          '<button onclick="VentasModule._subMetodoCombinado=\'YAPE+EFECTIVO\';App.renderPage();" style="padding:10px;border-radius:8px;cursor:pointer;font-weight:800;font-size:12px;border:2px solid '+(self._subMetodoCombinado==='YAPE+EFECTIVO'?'#7c3aed':'var(--gray-200)')+';background:'+(self._subMetodoCombinado==='YAPE+EFECTIVO'?'#f5f3ff':'white')+';color:'+(self._subMetodoCombinado==='YAPE+EFECTIVO'?'#7c3aed':'var(--gray-600)')+'"><i class="fas fa-mobile-alt" style="margin-right:5px;"></i>Yape + Efectivo</button>' +
          '<button onclick="VentasModule._subMetodoCombinado=\'TARJETA+EFECTIVO\';App.renderPage();" style="padding:10px;border-radius:8px;cursor:pointer;font-weight:800;font-size:12px;border:2px solid '+(self._subMetodoCombinado==='TARJETA+EFECTIVO'?'#2563eb':'var(--gray-200)')+';background:'+(self._subMetodoCombinado==='TARJETA+EFECTIVO'?'#eff6ff':'white')+';color:'+(self._subMetodoCombinado==='TARJETA+EFECTIVO'?'#2563eb':'var(--gray-600)')+'"><i class="fas fa-credit-card" style="margin-right:5px;"></i>Tarjeta + Efectivo</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">'+(self._subMetodoCombinado==='YAPE+EFECTIVO'?'Yape/Plin':'Tarjeta')+'</div>' +
            '<input class="form-control" type="number" step="0.01" id="montoCompA" value="'+(self._montoCombinadoA>0?self._montoCombinadoA.toFixed(2):'')+'" placeholder="0.00" style="font-size:24px;text-align:center;font-weight:900;padding:12px;border:2px solid '+(self._subMetodoCombinado==='YAPE+EFECTIVO'?'#7c3aed':'#2563eb')+';border-radius:10px;" oninput="VentasModule._montoCombinadoA=parseFloat(this.value)||0;VentasModule.updateVuelto();"/></div>' +
          '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">Efectivo</div>' +
            '<input class="form-control" type="number" step="0.01" id="montoCompB" value="'+(self._montoCombinadoB>0?self._montoCombinadoB.toFixed(2):'')+'" placeholder="0.00" style="font-size:24px;text-align:center;font-weight:900;padding:12px;border:2px solid #16a34a;border-radius:10px;" oninput="VentasModule._montoCombinadoB=parseFloat(this.value)||0;VentasModule.updateVuelto();"/></div>' +
        '</div>' +
      '</div>' : '';

    var vueltoClr = vuelto>=0?'#16a34a':'#dc2626';
    var vueltoBg  = vuelto>=0?'#f0fdf4':'#fef2f2';

    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:var(--gray-50);border-radius:12px;border:1.5px solid var(--gray-200);margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<button onclick="VentasModule.modoVista=\'lista\';App.renderPage();" style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;"><i class="fas fa-arrow-left" style="margin-right:6px;"></i>Regresar</button>' +
        '<div style="width:2px;height:26px;background:var(--gray-200);"></div>' +
        '<div><div style="font-size:18px;font-weight:900;color:var(--gray-900);">Nuevo Comprobante</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+serie+' · N° '+nextNum+' · '+hoy+(usuario?' · <strong>'+usuario.usuario+'</strong>':'')+'</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button onclick="VentasModule.limpiarLista()" style="background:white;color:var(--gray-600);border:1.5px solid var(--gray-200);border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;"><i class="fas fa-eraser" style="margin-right:5px;"></i>Limpiar</button>' +
        '<button onclick="VentasModule.vistaPrevia()" style="background:white;color:var(--gray-600);border:1.5px solid var(--gray-200);border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;"><i class="fas fa-eye" style="margin-right:5px;"></i>Vista Previa</button>' +
        '<button onclick="VentasModule.procesar()" style="background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:8px;padding:8px 26px;font-weight:900;cursor:pointer;font-size:15px;box-shadow:0 4px 12px rgba(22,163,74,0.3);"><i class="fas fa-check" style="margin-right:6px;"></i>PROCESAR</button>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:14px;">' +

      // Tipo + datos
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;"><i class="fas fa-file-invoice" style="color:var(--accent);margin-right:5px;"></i>Tipo de Comprobante</div>' +
          tiposBtns +
        '</div>' +
        '<div style="padding:14px 20px;">' +
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;">' +
            '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">SERIE</div>' +
              '<div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;color:var(--accent);">'+serie+'</div></div>' +
            '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">NÚMERO</div>' +
              '<div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;">'+nextNum+'</div></div>' +
            '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">FECHA</div>' +
              '<input class="form-control" type="date" id="fechaEmision" value="'+hoy+'" style="font-size:13px;"/></div>' +
            '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">DCTO. GLOBAL %</div>' +
              '<input class="form-control" type="number" step="0.01" min="0" max="100" id="descGlobalComp" value="'+self.descGlobal+'" oninput="VentasModule.setDescGlobal(this.value)" style="font-size:13px;"/></div>' +
          '</div>' +
          '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">CLIENTE <span style="color:#dc2626;">*</span></div>' +
            '<div style="display:flex;gap:8px;">' +
              '<input class="form-control" id="cliSearch" type="text" placeholder="Ingresa DNI/RUC — se busca automáticamente..." value="'+(cli?cli.doc+' — '+cli.nombre:'')+'" onkeydown="VentasModule.buscarCliente(event)" oninput="VentasModule._onClienteInput(this.value)" style="flex:1;font-size:14px;padding:10px 12px;"/>' +
              '<button class="btn btn-outline" onclick="VentasModule.seleccionarCliente()" style="padding:10px 14px;" title="Buscar"><i class="fas fa-search"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Productos
      '<div class="card">' +
        '<div style="padding:12px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">' +
            '<i class="fas fa-boxes" style="color:var(--accent);margin-right:5px;"></i>Productos / Servicios ' +
            '<span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:4px;">'+self.currentItems.length+'</span>' +
          '</div>' +
        '</div>' +
        '<div id="searchResultsWrapper">'+itemsArea+'</div>' +
        '<div id="ticketItemsWrapper">' +
          (self.currentItems.length>0 ?
            '<div style="padding:8px 14px;border-top:1px solid var(--gray-200);">' +
              '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">EN EL TICKET</div>' +
              self._renderItemsList() +
            '</div>' : '') +
        '</div>' +
        '<div style="padding:14px 20px;border-top:2px solid var(--gray-200);background:var(--gray-50);">' +
          '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-search" style="margin-right:5px;"></i>Buscar Producto</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<div style="flex:1;position:relative;">' +
              '<i class="fas fa-barcode" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:17px;"></i>' +
              '<input type="text" id="prodBuscadorComp" placeholder="Nombre, código o escanea con lector..." style="width:100%;padding:12px 12px 12px 42px;border:2px solid var(--gray-200);border-radius:10px;font-size:14px;background:white;outline:none;box-sizing:border-box;" oninput="VentasModule.filtroBuscadorLive(this.value)" onkeydown="VentasModule.buscadorKeydown(event)"/>' +
            '</div>' +
            '<button onclick="VentasModule.abrirBuscadorProducto()" style="padding:0 20px;background:var(--accent);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-size:13px;"><i class="fas fa-search" style="margin-right:5px;"></i>Buscar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Pago + Cobro
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-credit-card" style="color:var(--accent);margin-right:5px;"></i>Método de Pago y Cobro</div>' +
        '</div>' +
        '<div style="padding:20px;display:grid;grid-template-columns:1fr 400px;gap:24px;">' +
          '<div>' +
            metodoBtns + combinadoSection +
            '<div style="margin-bottom:14px;">' +
              '<div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">MONTO RECIBIDO (S/)</div>' +
              '<input class="form-control" type="number" step="0.01" id="montoPagoComp" value="'+(self.montoPago>0?self.montoPago.toFixed(2):'')+'" placeholder="0.00" style="font-size:32px;text-align:center;font-weight:900;padding:16px;border:3px solid var(--gray-200);border-radius:12px;" oninput="VentasModule.montoPago=parseFloat(this.value)||0;VentasModule.updateVuelto()"/>' +
            '</div>' +
            '<div style="margin-bottom:14px;">' +
              '<div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">BILLETES RÁPIDOS</div>' +
              '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">' +
                [10,20,50,100,200].map(function(b){
                  return '<button onclick="document.getElementById(\'montoPagoComp\').value='+b+';VentasModule.montoPago='+b+';VentasModule.updateVuelto();" style="padding:12px 4px;border:2px solid var(--gray-200);border-radius:10px;background:white;font-size:15px;font-weight:800;cursor:pointer;color:var(--gray-700);">'+b+'</button>';
                }).join('') +
                '<button onclick="var t=VentasModule.getTotal();document.getElementById(\'montoPagoComp\').value=t.toFixed(2);VentasModule.montoPago=t;VentasModule.updateVuelto();" style="padding:12px 4px;border:2px solid var(--accent);border-radius:10px;background:#eff6ff;font-size:14px;font-weight:900;cursor:pointer;color:var(--accent);">Exacto</button>' +
              '</div>' +
            '</div>' +
            '<div id="vueltoDisplay" style="padding:18px;border-radius:12px;text-align:center;background:'+vueltoBg+';color:'+vueltoClr+';font-weight:900;font-size:22px;border:2px solid '+(vuelto>=0?'#86efac':'#fca5a5')+';">' +
              (vuelto>=0?'<i class="fas fa-check-circle" style="margin-right:8px;"></i>Vuelto: S/ '+vuelto.toFixed(2):'<i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>Falta: S/ '+Math.abs(vuelto).toFixed(2)) +
            '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:14px;">' +
            '<div style="background:var(--gray-50);border:2px solid var(--gray-200);border-radius:14px;padding:22px;flex:1;">' +
              '<div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:18px;">RESUMEN DEL COMPROBANTE</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><span style="font-size:17px;color:var(--gray-500);">Subtotal:</span><span style="font-size:22px;font-weight:900;color:var(--gray-800);">S/ '+total.toFixed(2)+'</span></div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:18px;border-bottom:2px solid var(--gray-200);"><span style="font-size:17px;color:var(--gray-500);">IGV (Exonerado):</span><span style="font-size:22px;font-weight:900;color:var(--gray-800);">S/ 0.00</span></div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 22px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;color:white;"><span style="font-size:24px;font-weight:900;">TOTAL</span><span style="font-size:40px;font-weight:900;letter-spacing:-1px;">S/ '+total.toFixed(2)+'</span></div>' +
            '</div>' +
            '<button onclick="VentasModule.procesar()" style="width:100%;padding:20px;background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:14px;font-size:19px;font-weight:900;cursor:pointer;box-shadow:0 5px 18px rgba(22,163,74,0.45);display:flex;align-items:center;justify-content:center;gap:10px;"><i class="fas fa-check-circle" style="font-size:22px;"></i>PROCESAR VENTA</button>' +
            '<button onclick="VentasModule.vistaPrevia()" style="width:100%;padding:14px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;"><i class="fas fa-eye"></i>Vista Previa del Ticket</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // ─────────────────────────────────────────────────────────
  // RENDER ITEMS LIST
  // ─────────────────────────────────────────────────────────
  _renderItemsList() {
    var self = this;
    return this.currentItems.map(function(item,i){
      var imgH = item.imagen
        ? '<img src="'+item.imagen+'" style="width:80px;height:80px;object-fit:cover;border-radius:12px;flex-shrink:0;border:2px solid var(--gray-200);transition:transform 0.2s ease,box-shadow 0.2s ease;cursor:zoom-in;" onmouseover="this.style.transform=\'scale(2.5)\';this.style.boxShadow=\'0 8px 30px rgba(0,0,0,0.4)\';this.style.zIndex=\'999\';this.style.position=\'relative\';" onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'none\';this.style.zIndex=\'1\';" alt=""/>'
        : '<div style="width:80px;height:80px;border-radius:12px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px dashed var(--gray-300);"><i class="fas fa-image" style="font-size:24px;color:var(--gray-300);"></i></div>';
      var dctoAmt = item.precio*item.qty*(item.dcto||0)/100;
      var hasDcto = (item.dcto||0)>0;
      return '<div style="display:flex;align-items:center;gap:12px;background:white;border:1.5px solid var(--gray-200);border-radius:12px;padding:12px 14px;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">' +
        '<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;">'+(i+1)+'</div>' +
        imgH +
        '<div style="flex:1;min-width:0;">' +
          '<input type="text" value="'+item.nombre.replace(/"/g,'&quot;')+'" onchange="VentasModule.updateNombre('+i+',this.value)" style="width:100%;font-size:16px;font-weight:800;color:var(--gray-900);border:none;border-bottom:2px solid var(--gray-200);padding:2px 0;background:transparent;outline:none;margin-bottom:5px;box-sizing:border-box;"/>' +
          '<div style="display:flex;gap:5px;">' +
            '<span style="background:var(--gray-100);color:var(--gray-600);font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;">'+item.codigo+'</span>' +
            '<span style="background:#eff6ff;color:#2563eb;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;">'+item.unidad+'</span>' +
          '</div>' +
        '</div>' +
        '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
        '<div style="text-align:center;flex-shrink:0;">' +
          '<div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">CANTIDAD</div>' +
          '<div style="display:flex;align-items:center;gap:4px;">' +
            '<button onclick="VentasModule.updateQty('+i+','+(item.qty-1)+')" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-size:17px;font-weight:900;cursor:pointer;color:var(--gray-600);">−</button>' +
            '<input type="number" min="1" value="'+item.qty+'" onchange="VentasModule.updateQty('+i+',this.value)" style="width:48px;height:30px;border:1.5px solid var(--accent);border-radius:6px;text-align:center;font-weight:900;font-size:15px;color:var(--accent);"/>' +
            '<button onclick="VentasModule.updateQty('+i+','+(item.qty+1)+')" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-size:17px;font-weight:900;cursor:pointer;color:var(--gray-600);">+</button>' +
          '</div>' +
        '</div>' +
        '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
        '<div style="text-align:center;flex-shrink:0;min-width:100px;">' +
          '<div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">P. UNITARIO</div>' +
          '<div style="display:flex;align-items:center;gap:3px;">' +
            '<span style="font-size:12px;font-weight:700;color:var(--gray-400);">S/</span>' +
            '<input type="number" min="0" step="0.01" value="'+item.precio.toFixed(2)+'" onchange="VentasModule.updatePrecio('+i+',this.value)" style="width:75px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;padding:0 6px;font-size:15px;font-weight:800;color:var(--gray-800);text-align:center;"/>' +
          '</div>' +
        '</div>' +
        '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
        '<div style="text-align:center;flex-shrink:0;min-width:90px;">' +
          '<div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">DESCUENTO</div>' +
          '<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px;">' +
            '<input type="number" min="0" max="100" step="0.01" value="'+(item.dcto||0)+'" onchange="VentasModule.updateDcto('+i+',this.value)" style="width:55px;height:30px;border:1.5px solid '+(hasDcto?'#16a34a':'var(--gray-200)')+';border-radius:6px;padding:0 4px;font-size:14px;font-weight:800;color:'+(hasDcto?'#16a34a':'var(--gray-700)')+';background:'+(hasDcto?'#f0fdf4':'white')+';text-align:center;"/>' +
            '<span style="font-size:13px;font-weight:700;color:var(--gray-400);">%</span>' +
          '</div>' +
          '<div style="font-size:11px;font-weight:700;color:'+(hasDcto?'#16a34a':'var(--gray-300)')+';">− S/ '+dctoAmt.toFixed(2)+'</div>' +
        '</div>' +
        '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
        '<div style="text-align:center;flex-shrink:0;min-width:100px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:8px 10px;">' +
          '<div style="font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:5px;">TOTAL</div>' +
          '<div style="font-size:20px;font-weight:900;color:var(--accent);">S/ '+item.total.toFixed(2)+'</div>' +
          (hasDcto?'<div style="font-size:10px;color:#16a34a;font-weight:700;">Ahorro S/ '+dctoAmt.toFixed(2)+'</div>':'')+
        '</div>' +
        '<button onclick="VentasModule.removeItem('+i+')" style="width:36px;height:36px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas fa-trash"></i></button>' +
      '</div>';
    }).join('');
  },

  // ─────────────────────────────────────────────────────────
  // HELPERS DEL COMPROBANTE
  // ─────────────────────────────────────────────────────────
  cambiarTipo(serie, nombre) { this.serieActual=serie; this.tipoComprobante=nombre; App.renderPage(); },

  setDescGlobal(val) {
    this.descGlobal = Math.min(100,Math.max(0,parseFloat(val)||0));
    var self=this;
    this.currentItems.forEach(function(item){item.dcto=self.descGlobal;item.total=item.qty*item.precio*(1-self.descGlobal/100);});
    this.updateVuelto();
  },

  updateVuelto() {
    var total=this.getTotal(), el=document.getElementById('vueltoDisplay');
    if(!el)return;
    if(this.metodoPago==='COMBINADO'){
      var suma=(this._montoCombinadoA||0)+(this._montoCombinadoB||0), diff=suma-total;
      if(suma<=0){el.style.background='#fef3c7';el.style.color='#d97706';el.innerHTML='<i class="fas fa-info-circle"></i> Ingresa los montos';}
      else if(diff<-0.005){el.style.background='#fef2f2';el.style.color='#dc2626';el.style.borderColor='#fca5a5';el.innerHTML='<i class="fas fa-exclamation-triangle"></i> Falta: S/ '+Math.abs(diff).toFixed(2);}
      else{el.style.background='#f0fdf4';el.style.color='#16a34a';el.style.borderColor='#86efac';el.innerHTML='<i class="fas fa-check-circle"></i> Vuelto: S/ '+Math.max(0,diff).toFixed(2);}
    } else {
      if(this.montoPago>0&&this.montoPago<total){el.style.background='#fef2f2';el.style.color='#dc2626';el.innerHTML='<i class="fas fa-exclamation-triangle"></i> Falta: S/ '+(total-this.montoPago).toFixed(2);}
      else{el.style.background='#f0fdf4';el.style.color='#16a34a';el.innerHTML='<i class="fas fa-check-circle"></i> Vuelto: S/ '+Math.max(0,this.montoPago-total).toFixed(2);}
    }
  },

  updateQty(idx,val) {
    var qty=Math.max(1,parseInt(val)||1);
    this.currentItems[idx].qty=qty;
    this.currentItems[idx].total=qty*this.currentItems[idx].precio*(1-(this.currentItems[idx].dcto||0)/100);
    this._checkMayorista(); App.renderPage();
  },
  updateDcto(idx,val) {
    var dcto=Math.min(100,Math.max(0,parseFloat(val)||0));
    this.currentItems[idx].dcto=dcto;
    this.currentItems[idx].total=this.currentItems[idx].qty*this.currentItems[idx].precio*(1-dcto/100);
    App.renderPage();
  },
  updateNombre(idx,val) { if(val&&val.trim()) this.currentItems[idx].nombre=val.trim(); },
  updatePrecio(idx,val) {
    var precio=Math.max(0,parseFloat(val)||0); if(!precio)return;
    this.currentItems[idx].precio=precio;
    this.currentItems[idx].total=this.currentItems[idx].qty*precio*(1-(this.currentItems[idx].dcto||0)/100);
    App.renderPage();
  },
  removeItem(idx) { this.currentItems.splice(idx,1); this._checkMayorista(); App.renderPage(); },
  limpiarLista() {
    if(!this.currentItems.length||confirm('¿Limpiar todos los productos del ticket?')){
      this.currentItems=[]; this.descGlobal=0; this.mayoristaModo=false; App.renderPage();
    }
  },
  getTotal() { return this.currentItems.reduce(function(s,i){return s+i.total;},0); },

  _getTotalQty() { return this.currentItems.reduce(function(s,i){return s+i.qty;},0); },

  _checkMayorista() {
    var totalQty=this._getTotalQty(), debe=totalQty>=3, cambio=debe!==this.mayoristaModo;
    this.mayoristaModo=debe;
    this.currentItems.forEach(function(item){
      var p=(DB.productos||[]).find(function(x){return x.id===item.prod_id;}); if(!p)return;
      item.precio=debe?(p.precio_mayorista||p.precio_venta):p.precio_venta;
      item.total=item.qty*item.precio*(1-(item.dcto||0)/100);
    });
    if(cambio){if(debe)App.toast('🏷️ Precio mayorista aplicado automáticamente','info');else App.toast('↩️ Precio unitario restaurado','info');}
  },

  // ─────────────────────────────────────────────────────────
  // BUSCADOR LIVE
  // ─────────────────────────────────────────────────────────
  filtroBuscadorLive(term) {
    var self=this;
    if(!term||term.length<2){
      if(this._searchResults!==null){this._searchResults=null;App.renderPage();}return;
    }
    var found=(DB.productos||[]).filter(function(p){
      return (p.nombre||'').toLowerCase().includes(term.toLowerCase())||
             (p.codigo||'').toLowerCase().includes(term.toLowerCase())||
             (p.barcode&&p.barcode.includes(term));
    });
    this._searchResults=found;
    var wrapper=document.getElementById('searchResultsWrapper');
    if(wrapper){
      wrapper.innerHTML='<div style="padding:10px 14px;">'+self._buildSearchHTML(found)+'</div>';
      var tw=document.getElementById('ticketItemsWrapper');
      if(tw) tw.innerHTML=self.currentItems.length>0?'<div style="padding:8px 14px;border-top:1px solid var(--gray-200);"><div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">EN EL TICKET</div>'+self._renderItemsList()+'</div>':'';
      setTimeout(function(){var inp=document.getElementById('prodBuscadorComp');if(inp){inp.focus();try{inp.setSelectionRange(term.length,term.length);}catch(e){}}},10);
    }
  },

  _buildSearchHTML(results) {
    var self=this;
    if(!results||results.length===0){
      return '<div style="text-align:center;padding:40px;color:var(--gray-400);">' +
        '<i class="fas fa-search" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<p style="font-size:14px;font-weight:700;">Sin resultados</p>' +
        '<button onclick="VentasModule._searchResults=null;App.renderPage();" style="margin-top:10px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">Limpiar búsqueda</button>' +
      '</div>';
    }
    var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<span style="font-size:12px;font-weight:800;color:var(--gray-500);"><i class="fas fa-search" style="margin-right:5px;color:var(--accent);"></i>'+results.length+' resultados</span>' +
      '<button onclick="VentasModule._searchResults=null;App.renderPage();" style="background:var(--gray-100);color:var(--gray-600);border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fas fa-times"></i> Cerrar</button>' +
    '</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
    results.slice(0,6).forEach(function(p){
      var sClr=p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
      html+='<div onclick="VentasModule.agregarDesdeResultados('+p.id+')" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px;border-radius:12px;border:2px solid var(--gray-200);background:white;cursor:pointer;'+(p.stock===0?'opacity:0.5;':'')+'" onmouseover="if('+p.stock+'>0){this.style.borderColor=\'var(--accent)\';}" onmouseout="this.style.borderColor=\'var(--gray-200)\';">' +
        (p.imagen?'<img src="'+p.imagen+'" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display=\'none\'">':'<div style="width:60px;height:60px;border-radius:8px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;margin-bottom:8px;"><i class="fas fa-image" style="font-size:20px;color:var(--gray-300);"></i></div>')+
        '<div style="font-size:12px;font-weight:800;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">'+p.nombre+'</div>' +
        '<div style="font-size:14px;font-weight:900;color:var(--accent);margin-bottom:3px;">S/ '+p.precio_venta.toFixed(2)+'</div>' +
        '<div style="font-size:10px;font-weight:700;color:'+sClr+';">'+(p.stock===0?'Sin stock':'Stock: '+p.stock)+'</div>' +
        (p.stock>0?'<div style="margin-top:6px;padding:4px 12px;background:var(--accent);color:white;border-radius:6px;font-size:11px;font-weight:700;"><i class="fas fa-plus" style="margin-right:3px;"></i>Agregar</div>':'')+
      '</div>';
    });
    html+='</div>';
    if(results.length>6) html+='<div style="margin-top:10px;text-align:center;font-size:12px;color:var(--gray-400);">Mostrando 6 de '+results.length+' — refina la búsqueda</div>';
    return html;
  },

  agregarDesdeResultados(id) { this._searchResults=null; this.agregarProducto(id); },

  buscadorKeydown(e) {
    if(e.key==='Enter'){
      var term=e.target.value.trim(); if(!term)return;
      var exacto=(DB.productos||[]).find(function(p){return p.codigo===term||(p.barcode&&p.barcode===term);});
      if(exacto){this._searchResults=null;this.agregarProducto(exacto.id);e.target.value='';setTimeout(function(){var inp=document.getElementById('prodBuscadorComp');if(inp)inp.value='';},50);}
      else this.filtroBuscadorLive(term);
    }
    if(e.key==='Escape'){e.target.value='';this._searchResults=null;App.renderPage();}
  },

  abrirBuscadorProducto(termInicial) {
    termInicial=termInicial||'';
    App.showModal('🔍 Buscar Producto',
      '<div style="position:relative;margin-bottom:12px;">' +
        '<i class="fas fa-barcode" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:16px;"></i>' +
        '<input type="text" id="modalProdSearch" placeholder="Nombre, código o código de barras..." value="'+termInicial+'" oninput="VentasModule.filtrarProductosBusqueda(this.value)" autofocus style="width:100%;padding:10px 10px 10px 36px;border:2px solid var(--accent);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
      '</div>' +
      '<div id="prodResultados" style="max-height:400px;overflow-y:auto;">'+this.renderProductosSearch(DB.productos||[],termInicial)+'</div>',
      []
    );
    document.getElementById('modalBox').style.maxWidth='640px';
    setTimeout(function(){var inp=document.getElementById('modalProdSearch');if(inp){inp.focus();if(termInicial)inp.dispatchEvent(new Event('input'));}},100);
  },

  renderProductosSearch(prods,term) {
    var filtered=term?prods.filter(function(p){return (p.nombre||'').toLowerCase().includes(term.toLowerCase())||(p.codigo||'').toLowerCase().includes(term.toLowerCase());}):prods;
    if(!filtered.length) return '<div style="text-align:center;padding:32px;color:var(--gray-400);"><i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.3;"></i>Sin resultados</div>';
    return '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="background:var(--gray-50);"><th style="padding:8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);">Producto</th><th style="padding:8px;font-size:11px;font-weight:800;color:var(--gray-500);">Precio</th><th style="padding:8px;font-size:11px;font-weight:800;color:var(--gray-500);">Stock</th><th style="padding:8px;"></th></tr></thead><tbody>' +
      filtered.map(function(p){
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:8px;"><div style="display:flex;align-items:center;gap:10px;">' +
            (p.imagen?'<img src="'+p.imagen+'" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" alt=""/>':'<div style="width:36px;height:36px;border-radius:6px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:var(--gray-300);font-size:12px;"></i></div>')+
            '<div><div style="font-size:13px;font-weight:700;">'+p.nombre+'</div><div style="font-size:11px;color:var(--gray-400);">'+p.codigo+' · '+p.unidad+'</div></div>' +
          '</div></td>' +
          '<td style="padding:8px;font-size:14px;font-weight:800;color:var(--accent);">S/ '+p.precio_venta.toFixed(2)+'</td>' +
          '<td style="padding:8px;">'+(p.stock>0?'<span style="color:#16a34a;font-weight:700;">'+p.stock+' uds</span>':'<span style="color:#dc2626;font-weight:700;">Sin stock</span>')+'</td>' +
          '<td style="padding:8px;"><button onclick="VentasModule.agregarProducto('+p.id+')" style="padding:6px 14px;background:var(--accent);color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Agregar</button></td>' +
        '</tr>';
      }).join('')+'</tbody></table>';
  },

  filtrarProductosBusqueda(term) {
    var el=document.getElementById('prodResultados');
    if(el) el.innerHTML=this.renderProductosSearch(DB.productos||[],term);
  },

  agregarProducto(id) {
    var p=(DB.productos||[]).find(function(x){return x.id===id;});
    if(!p){return;}
    if((p.stock||0)===0){App.toast('Producto sin stock','error');return;}
    var ex=this.currentItems.findIndex(function(x){return x.prod_id===id;});
    if(ex>=0){
      if(this.currentItems[ex].qty>=(p.stock||0)){App.toast('Stock insuficiente','warning');return;}
      this.currentItems[ex].qty++;
      this.currentItems[ex].total=this.currentItems[ex].qty*this.currentItems[ex].precio*(1-(this.currentItems[ex].dcto||0)/100);
    } else {
      this.currentItems.push({prod_id:p.id,codigo:p.codigo,nombre:p.nombre,imagen:p.imagen||'',unidad:p.unidad||'UND',precio:p.precio_venta,qty:1,dcto:this.descGlobal||0,total:p.precio_venta*(1-(this.descGlobal||0)/100)});
    }
    this._searchResults=null; this._checkMayorista();
    App.toast(p.nombre+' agregado ✓','success'); App.closeModal(); App.renderPage();
    setTimeout(function(){var inp=document.getElementById('prodBuscadorComp');if(inp)inp.value='';},50);
  },

  // ─────────────────────────────────────────────────────────
  // CLIENTE
  // ─────────────────────────────────────────────────────────
  seleccionarCliente() {
    App.showModal('👤 Seleccionar Cliente',
      '<div style="position:relative;margin-bottom:12px;">' +
        '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);"></i>' +
        '<input type="text" placeholder="Buscar por nombre o documento..." autofocus ' +
          'style="width:100%;padding:9px 10px 9px 34px;border:2px solid var(--accent);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;" ' +
          'oninput="VentasModule.filtrarClientesBusqueda(this.value)"/>' +
      '</div>' +
      '<div id="clienteResultados" style="max-height:360px;overflow-y:auto;">' +
        this.renderClientesBusqueda((DB.clientes||[]).filter(function(c){return c.tipo_cliente==='cliente'||c.doc==='00000000';})) +
      '</div>',[]
    );
    document.getElementById('modalBox').style.maxWidth='540px';
  },

  renderClientesBusqueda(clientes) {
    if(!clientes.length) return '<div style="text-align:center;padding:24px;color:var(--gray-400);">Sin resultados</div>';
    return clientes.map(function(c){
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--gray-100);cursor:pointer;transition:background 0.1s;" onclick="VentasModule.setCliente('+c.id+')" onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<div style="width:34px;height:34px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;">'+(c.nombre[0]||'?').toUpperCase()+'</div>' +
        '<div style="flex:1;"><div style="font-size:13px;font-weight:700;">'+c.nombre+'</div><div style="font-size:11px;color:var(--gray-400);">'+c.tipo+': '+c.doc+'</div></div>' +
        '<i class="fas fa-chevron-right" style="color:var(--gray-300);font-size:12px;"></i>' +
      '</div>';
    }).join('');
  },

  filtrarClientesBusqueda(term) {
    var found=(DB.clientes||[]).filter(function(c){return(c.tipo_cliente==='cliente'||c.doc==='00000000')&&((c.nombre||'').toLowerCase().includes(term.toLowerCase())||(c.doc||'').includes(term));});
    var el=document.getElementById('clienteResultados');
    if(el) el.innerHTML=this.renderClientesBusqueda(found);
  },

  setCliente(id) {
    this.selectedCliente=(DB.clientes||[]).find(function(x){return x.id===id;});
    App.closeModal();
    var inp=document.getElementById('cliSearch');
    if(inp&&this.selectedCliente) inp.value=this.selectedCliente.doc+' — '+this.selectedCliente.nombre;
    App.toast('Cliente: '+this.selectedCliente.nombre,'info');
  },

  buscarCliente(event) { if(event.key!=='Enter')return; this._buscarClientePorDoc(event.target.value.trim()); },
  _onClienteInput(val) { var d=val.replace(/\D/g,''); if(d.length===8||d.length===11) this._buscarClientePorDoc(d); },

  _buscarClientePorDoc(val) {
    if(!val)return;
    var found=(DB.clientes||[]).find(function(c){return c.doc===val;});
    if(found){
      this.selectedCliente=found;
      var inp=document.getElementById('cliSearch');
      if(inp) inp.value=found.doc+' — '+found.nombre;
      App.toast('✅ Cliente: '+found.nombre,'success'); return;
    }
    var digits=val.replace(/\D/g,'');
    if(digits.length===8||digits.length===11) this._consultarAPICliente(digits);
    else App.toast('No encontrado. Usa el buscador.','warning');
  },

  async _consultarAPICliente(doc) {
    var inp=document.getElementById('cliSearch'), tipo=doc.length===11?'RUC':'DNI';
    if(inp) inp.value='🔍 Consultando '+tipo+'...';
    try {
      var ep=doc.length===11?'https://apiperu.dev/api/ruc':'https://apiperu.dev/api/dni';
      var res=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':'Bearer 2568cd05aaa32855bded783fdb2a9a7ef984e2d136aaeaf2d59091dc48ef68cb'},body:JSON.stringify(doc.length===11?{ruc:doc}:{dni:doc})});
      var data=await res.json();
      if(data.success){
        var nombre=doc.length===11?(data.data.nombre_o_razon_social||''):(data.data.nombre_completo||'');
        var ct={id:Date.now(),doc,tipo,nombre,direccion:data.data?.direccion||'',telefono:'',email:'',tipo_cliente:'cliente'};
        DB.clientes.push(ct); this.selectedCliente=ct;
        if(inp) inp.value=doc+' — '+nombre;
        App.toast('✅ '+nombre,'success');
      } else { if(inp) inp.value=''; App.toast('No se encontró el '+tipo+'. Ingresa datos manualmente.','warning'); }
    } catch(e){ if(inp) inp.value=''; App.toast('Error de conexión','error'); }
  },

  // ─────────────────────────────────────────────────────────
  // PROCESAR VENTA
  // ─────────────────────────────────────────────────────────
  procesar() {
    if(!this.currentItems.length){App.toast('Agrega al menos un producto','error');return;}
    if(!this.selectedCliente){
      var pub=(DB.clientes||[]).find(function(c){return c.doc==='00000000';});
      if(pub) this.selectedCliente=pub;
      else{App.toast('Selecciona un cliente','error');return;}
    }
    var total=this.getTotal();
    if(this.metodoPago==='EFECTIVO'&&this.montoPago>0&&this.montoPago<total){App.toast('Monto insuficiente — faltan S/ '+(total-this.montoPago).toFixed(2),'error');return;}
    var monto, metodoFinal;
    if(this.metodoPago==='COMBINADO'){
      var mA=this._montoCombinadoA||0, mB=this._montoCombinadoB||0;
      if(mA<=0&&mB<=0){App.toast('Ingresa los montos del pago combinado','error');return;}
      monto=mA+mB;
      if(monto<total-0.005){App.toast('Monto insuficiente. Faltan S/ '+(total-monto).toFixed(2),'error');return;}
      var tipoA=this._subMetodoCombinado==='YAPE+EFECTIVO'?'YAPE':'TARJETA';
      metodoFinal=tipoA+'(S/'+mA.toFixed(2)+') + EFECTIVO(S/'+mB.toFixed(2)+')';
    } else {
      monto=this.montoPago>0?this.montoPago:total;
      metodoFinal=this.metodoPago;
    }
    var ahora=new Date();
    var fecha=ahora.getFullYear()+'-'+String(ahora.getMonth()+1).padStart(2,'0')+'-'+String(ahora.getDate()).padStart(2,'0');
    var hora=ahora.toTimeString().slice(0,8);
    var serie=this.serieActual, numero=DB.nextNumber(serie);
    var tipoCorto=serie==='B0A1'?'BOL':serie==='F0A1'?'FAC':'N. VENTA';

    var venta={
      id:Date.now(), fecha, hora, serie, numero, tipo:tipoCorto,
      cliente_id:this.selectedCliente.id,
      items:this.currentItems.map(function(i){return{prod_id:i.prod_id,nombre:i.nombre,qty:i.qty,precio:i.precio,total:i.total};}),
      subtotal:total, igv:0, total,
      tc:DB.empresa.tipoCambio||3.467, moneda:'SOLES', estado:'NO_ENVIADO',
      tipo_comprobante:this.tipoComprobante,
      metodo_pago:metodoFinal, monto_pago:monto, vuelto:Math.max(0,monto-total),
      cajero:DB.usuarioActual?.usuario||'—'
    };

    // Si viene de "Convertir a Nuevo CPE": anula la Nota de Venta original (devuelve su stock) para no duplicar
    if(this._convertingFromId){
      var _oid=this._convertingFromId; this._convertingFromId=null;
      var _oi=(DB.ventas||[]).findIndex(function(x){return Number(x.id)===Number(_oid);});
      if(_oi>=0 && DB.ventas[_oi].estado!=='ANULADO'){
        DB.ventas[_oi].estado='ANULADO';
        (DB.ventas[_oi].items||[]).forEach(function(item){
          var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
          if(pi>=0) DB.productos[pi].stock=(DB.productos[pi].stock||0)+item.qty;
        });
        SupabaseDB.actualizarVenta(DB.ventas[_oi]);
        (DB.ventas[_oi].items||[]).forEach(function(item){
          var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
          if(pi>=0) SupabaseDB.actualizarProducto(DB.productos[pi]);
        });
        App.toast('↩️ Nota de Venta original anulada (convertida a '+serie+'-'+numero+')','info');
      }
    }

    this.currentItems.forEach(function(item){
      var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
      if(pi>=0) DB.productos[pi].stock=Math.max(0,(DB.productos[pi].stock||0)-item.qty);
    });

    DB.ventas.unshift(venta);
    Storage.guardarVentas();
    Storage.guardarProductos();
    Storage.guardarSequences && Storage.guardarSequences();
    SupabaseDB.guardarVenta(venta);

    App.toast('✅ '+serie+'-'+numero+' procesado — Vuelto: S/ '+venta.vuelto.toFixed(2),'success');
    venta.items.forEach(function(item){
    var p=(DB.productos||[]).find(function(x){return x.id===item.prod_id;});
    if(!p)return;
    if(p.stock===0) App.toast('❌ '+p.nombre+' se agotó','error');
    else if(p.stock<=5) App.toast('⚠️ '+p.nombre+' solo quedan '+p.stock+' uds','warning');
});
    this._montoCombinadoA=0; this._montoCombinadoB=0; this.mayoristaModo=false;
    this.modoVista='lista'; App.renderPage();
    this.verDetalle(venta.id);
  },

  // ─────────────────────────────────────────────────────────
  // VISTA PREVIA
  // ─────────────────────────────────────────────────────────
  vistaPrevia() {
    var total=this.getTotal(), serie=this.serieActual;
    var next=DB._sequences&&DB._sequences[serie]?String(DB._sequences[serie]).padStart(8,'0'):'00000001';
    App.showModal('👁️ Vista Previa',
      '<div style="font-family:monospace;font-size:13px;max-width:320px;margin:0 auto;">' +
        '<div style="text-align:center;font-weight:800;font-size:15px;">'+DB.empresa.nombre+'</div>' +
        '<div style="text-align:center;">RUC: '+DB.empresa.ruc+'</div>' +
        '<hr style="border:1px dashed #ccc;"/>' +
        '<div style="text-align:center;font-weight:800;">'+this.tipoComprobante+'</div>' +
        '<div style="text-align:center;font-weight:800;">'+serie+' - '+next+'</div>' +
        '<hr style="border:1px dashed #ccc;"/>' +
        '<div>Cliente: <strong>'+(this.selectedCliente?this.selectedCliente.nombre:'N/A')+'</strong></div>' +
        '<hr style="border:1px dashed #ccc;"/>' +
        (this.currentItems.length===0?'<div style="text-align:center;color:var(--gray-400);">Sin productos</div>':
          this.currentItems.map(function(i){return '<div style="display:flex;justify-content:space-between;"><span>'+i.nombre+' ×'+i.qty+'</span><span>S/'+i.total.toFixed(2)+'</span></div>';}).join(''))+
        '<hr style="border:1px dashed #ccc;"/>' +
        '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;"><span>TOTAL:</span><span>S/'+total.toFixed(2)+'</span></div>' +
      '</div>',
      [{text:'✅ Procesar y Continuar',cls:'btn-success',cb:function(){App.closeModal();VentasModule.procesar();}}]
    );
    document.getElementById('modalBox').style.maxWidth='400px';
  },

  // ─────────────────────────────────────────────────────────
  // VER DETALLE
  // ─────────────────────────────────────────────────────────
  verDetalle(id) {
    var v=(DB.ventas||[]).find(function(x){return Number(x.id)===Number(id);});
    if(!v)return;
    var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
    var tipoColor=v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
    var estMap={ACEPTADO:{bg:'#f0fdf4',c:'#16a34a'},ANULADO:{bg:'#fef2f2',c:'#dc2626'},NO_ENVIADO:{bg:'#fffbeb',c:'#d97706'}};
    var est=estMap[v.estado]||estMap.NO_ENVIADO;

    var itemsHtml=(v.items||[]).map(function(i){
      return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:9px 8px;font-size:13px;font-weight:700;">'+i.nombre+'</td>' +
        '<td style="padding:9px 8px;text-align:center;font-size:13px;font-weight:700;">'+i.qty+'</td>' +
        '<td style="padding:9px 8px;text-align:right;font-size:13px;">S/ '+i.precio.toFixed(2)+'</td>' +
        '<td style="padding:9px 8px;text-align:right;font-size:14px;font-weight:900;color:var(--accent);">S/ '+i.total.toFixed(2)+'</td>' +
      '</tr>';
    }).join('');

    App.showModal('📄 '+v.serie+'-'+v.numero,
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">' +
        '<div>' +
          '<div style="font-size:11px;font-weight:800;color:'+tipoColor+';text-transform:uppercase;margin-bottom:3px;">'+v.tipo_comprobante+'</div>' +
          '<div style="font-size:20px;font-weight:900;color:'+tipoColor+';">'+v.serie+' — '+v.numero+'</div>' +
          '<div style="font-size:12px;color:var(--gray-400);">'+v.fecha+' '+v.hora+(v.cajero?' · @'+v.cajero:'')+'</div>' +
        '</div>' +
        '<span style="padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;background:'+est.bg+';color:'+est.c+';">'+v.estado+'</span>' +
      '</div>' +
      '<div style="background:var(--gray-50);border-radius:10px;padding:12px;margin-bottom:14px;">' +
        '<div style="font-size:13px;font-weight:800;">'+(cli?cli.nombre:'N/A')+'</div>' +
        '<div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div>' +
      '</div>' +
      '<div style="border:1px solid var(--gray-200);border-radius:10px;overflow:hidden;margin-bottom:14px;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);">' +
            '<th style="padding:8px;text-align:left;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Producto</th>' +
            '<th style="padding:8px;text-align:center;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Cant</th>' +
            '<th style="padding:8px;text-align:right;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Precio</th>' +
            '<th style="padding:8px;text-align:right;font-size:11px;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
          '</tr></thead><tbody>'+itemsHtml+'</tbody>' +
        '</table>' +
      '</div>' +
      '<div style="padding:14px 16px;background:linear-gradient(135deg,#1e3a5f,var(--accent));border-radius:12px;color:white;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<span style="font-size:16px;font-weight:900;">TOTAL:</span>' +
        '<span style="font-size:24px;font-weight:900;">S/ '+v.total.toFixed(2)+'</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Método de Pago</div><div style="font-size:12px;font-weight:700;">'+v.metodo_pago+'</div></div>' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Monto Recibido</div><div style="font-size:12px;font-weight:700;">S/ '+( v.monto_pago||v.total).toFixed(2)+'</div></div>' +
        '<div style="padding:10px;background:#f0fdf4;border-radius:8px;"><div style="font-size:10px;font-weight:800;color:#16a34a;text-transform:uppercase;margin-bottom:3px;">Vuelto</div><div style="font-size:14px;font-weight:900;color:#16a34a;">S/ '+(v.vuelto||0).toFixed(2)+'</div></div>' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Productos</div><div style="font-size:12px;font-weight:700;">'+(v.items?v.items.length:0)+' ítem(s)</div></div>' +
      '</div>' +
      '<div style="margin-top:14px;padding:12px 14px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;">' +
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:9px;">' +
          '<i class="fab fa-whatsapp" style="font-size:17px;color:#16a34a;"></i>' +
          '<span style="font-size:11px;font-weight:800;color:#15803d;text-transform:uppercase;">Enviar comprobante por WhatsApp</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:7px;">' +
          '<span style="padding:8px 10px;background:#dcfce7;border:2px solid #bbf7d0;border-radius:8px;font-size:13px;font-weight:800;color:#16a34a;white-space:nowrap;">+51</span>' +
          '<input type="tel" id="wa_tel_detalle" placeholder="987 654 321" maxlength="9" ' +
            'value="'+(cli&&cli.telefono?cli.telefono.replace(/\D/g,''):'')+'" ' +
            'oninput="this.value=this.value.replace(/\\D/g,\'\')" ' +
            'style="flex:1;padding:8px 12px;border:2px solid #bbf7d0;border-radius:8px;font-size:15px;font-weight:700;outline:none;letter-spacing:1px;"/>' +
          '<button onclick="VentasModule._enviarWADetalle('+v.id+')" ' +
            'style="padding:8px 16px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;">' +
            '<i class="fab fa-whatsapp" style="margin-right:4px;"></i>Enviar' +
          '</button>' +
        '</div>' +
        '<p style="font-size:10px;color:var(--gray-400);margin:5px 0 0;">' +
          (cli&&cli.telefono?'✅ Número del cliente pre-cargado.':'9 dígitos sin el +51. Ej: 987654321') +
        '</p>' +
      '</div>' +
      VentasModule._panelAcciones(v),
      [ {text:'Cerrar',cls:'btn-outline',cb:function(){App.closeModal();}} ]
    );
    document.getElementById('modalBox').style.maxWidth='560px';
  },

  // ─────────────────────────────────────────────────────────
  // IMPRIMIR
  // ─────────────────────────────────────────────────────────
  imprimirComprobante(venta) {
    if(typeof TicketsModule!=='undefined'&&TicketsModule._getCfg){
      TicketsModule._getCfg(); TicketsModule._abrirVentanaImpresion(TicketsModule._generarTicketHTML(TicketsModule.cfg,venta));
    } else {
      // Fallback básico
      var cli=(DB.clientes||[]).find(function(c){return c.id===venta.cliente_id;});
      var w=window.open('','_blank','width=380,height=600');
      if(!w){App.toast('Activa ventanas emergentes para imprimir','warning');return;}
      var itemsHtml=(venta.items||[]).map(function(i){return '<tr><td>'+i.nombre+'</td><td style="text-align:center;">'+i.qty+'</td><td style="text-align:right;">S/'+i.precio.toFixed(2)+'</td><td style="text-align:right;font-weight:700;">S/'+i.total.toFixed(2)+'</td></tr>';}).join('');
      w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Courier New,monospace;font-size:12px;max-width:300px;margin:0 auto;padding:12px;}.center{text-align:center;}hr{border:1px dashed #000;margin:8px 0;}table{width:100%;border-collapse:collapse;}td{font-size:11px;padding:3px 0;}.total{border:2px solid #000;padding:8px;text-align:center;margin:8px 0;}</style></head><body>'+
        '<div class="center" style="font-weight:bold;font-size:14px;">'+DB.empresa.nombre+'</div>'+
        '<div class="center">RUC: '+DB.empresa.ruc+'</div>'+
        '<div class="center" style="font-size:11px;">'+DB.empresa.direccion+'</div>'+
        '<hr/><div class="center" style="font-weight:800;">'+venta.tipo_comprobante+'</div>'+
        '<div class="center" style="font-weight:800;">'+venta.serie+' - '+venta.numero+'</div><hr/>'+
        '<div>Fecha: <b>'+venta.fecha+' '+venta.hora+'</b></div>'+
        '<div>Cliente: <b>'+(cli?cli.nombre:'PÚBLICO EN GENERAL')+'</b></div><hr/>'+
        '<table><thead><tr><th style="text-align:left;">Producto</th><th>Cant</th><th style="text-align:right;">P.U.</th><th style="text-align:right;">Total</th></tr></thead><tbody>'+itemsHtml+'</tbody></table><hr/>'+
        '<div class="total"><div style="font-weight:800;">TOTAL A PAGAR</div><div style="font-size:20px;font-weight:900;">S/ '+venta.total.toFixed(2)+'</div></div><hr/>'+
        '<div style="display:flex;justify-content:space-between;"><span>Método:</span><span>'+venta.metodo_pago+'</span></div>'+
        '<div style="display:flex;justify-content:space-between;font-weight:700;"><span>Vuelto:</span><span>S/ '+(venta.vuelto||0).toFixed(2)+'</span></div><hr/>'+
        '<div class="center" style="font-weight:bold;">¡GRACIAS POR SU COMPRA!</div>'+
      '</body></html>');
      w.document.close(); setTimeout(function(){w.print();},250);
    }
  },

  imprimir(id) {
    var v=(DB.ventas||[]).find(function(x){return Number(x.id)===Number(id);}); if(v) this.imprimirComprobante(v);
  },

  // ─────────────────────────────────────────────────────────
  // ENVIAR SUNAT
  // ─────────────────────────────────────────────────────────
  _numeroALetras(num) {
    var entero  = Math.floor(num);
    var decimal = Math.round((num - entero) * 100);
    var unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
                    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
    var decenas  = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
    var centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
                    'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
    function convertir(n) {
      if(n===0)   return '';
      if(n===100) return 'CIEN';
      if(n<20)    return unidades[n];
      if(n<100){  var d=Math.floor(n/10),u=n%10; return decenas[d]+(u?' Y '+unidades[u]:''); }
      var c=Math.floor(n/100),r=n%100; return centenas[c]+(r?' '+convertir(r):'');
    }
    var miles=Math.floor(entero/1000), resto=entero%1000, resultado='';
    if(miles===1)    resultado='MIL';
    else if(miles>1) resultado=convertir(miles)+' MIL';
    if(resto>0) resultado+=(resultado?' ':'')+convertir(resto);
    if(!resultado)   resultado='CERO';
    return resultado+' CON '+String(decimal).padStart(2,'0')+'/100 SOLES';
  },

  _buildApiSunatPayload(venta) {
    var cli = (DB.clientes||[]).find(function(c){return c.id===venta.cliente_id;});
    var numDocCli = '00000000', nombreCli = '---', schemeIdCli = '1';
    if(cli && cli.doc !== '00000000'){
      numDocCli   = cli.doc;
      nombreCli   = cli.nombre || '---';
      schemeIdCli = cli.tipo==='RUC'?'6':'1';
    }
    var tipoDoc    = venta.serie.startsWith('B') ? '03' : '01';
    var correlativo = String(parseInt(venta.numero,10)||1).padStart(8,'0');
    var serieNum   = venta.serie + '-' + correlativo;
    var fileName   = (DB.empresa.ruc||'10472430080')+'-'+tipoDoc+'-'+venta.serie+'-'+correlativo;
    var fecha      = venta.fecha;
    var hora       = (venta.hora||'00:00:00').slice(0,8);
    var totalPagar = venta.total;

    var invoiceLines = venta.items.map(function(item, idx){
      return {
        'cbc:ID':                  {'_text': idx+1},
        'cbc:InvoicedQuantity':    {'_attributes':{'unitCode':'NIU'},'_text':item.qty},
        'cbc:LineExtensionAmount': {'_attributes':{'currencyID':'PEN'},'_text':item.total},
        'cac:PricingReference': {
          'cac:AlternativeConditionPrice': {
            'cbc:PriceAmount':   {'_attributes':{'currencyID':'PEN'},'_text':item.precio},
            'cbc:PriceTypeCode': {'_text':'01'}
          }
        },
        'cac:TaxTotal': {
          'cbc:TaxAmount': {'_attributes':{'currencyID':'PEN'},'_text':0},
          'cac:TaxSubtotal': [{
            'cbc:TaxableAmount': {'_attributes':{'currencyID':'PEN'},'_text':item.total},
            'cbc:TaxAmount':     {'_attributes':{'currencyID':'PEN'},'_text':0},
            'cac:TaxCategory': {
              'cbc:Percent':                {'_text':0},
              'cbc:TaxExemptionReasonCode': {'_text':'20'},
              'cac:TaxScheme': {
                'cbc:ID':          {'_text':'9997'},
                'cbc:Name':        {'_text':'EXO'},
                'cbc:TaxTypeCode': {'_text':'VAT'}
              }
            }
          }]
        },
        'cac:Item':  {'cbc:Description':{'_text':item.nombre}},
        'cac:Price': {'cbc:PriceAmount':{'_attributes':{'currencyID':'PEN'},'_text':item.precio}}
      };
    });

    return {
      personaId:    '6a07684fa58ab9002977930b',
      personaToken: 'PRD_hijNQEDhfCDVz79A5al6tInLAh5ABPJ9kQJol6jmj5Xo6V1N21HnleBuEx96JOZ7',
      fileName:     fileName,
      documentBody: {
        'cbc:UBLVersionID':    {'_text':'2.1'},
        'cbc:CustomizationID': {'_text':'2.0'},
        'cbc:ID':              {'_text':serieNum},
        'cbc:IssueDate':       {'_text':fecha},
        'cbc:IssueTime':       {'_text':hora},
        'cbc:InvoiceTypeCode': {'_attributes':{'listID':'0101'},'_text':tipoDoc},
        'cbc:Note': [{'_text':VentasModule._numeroALetras(totalPagar),'_attributes':{'languageLocaleID':'1000'}}],
        'cbc:DocumentCurrencyCode': {'_text':'PEN'},
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cac:PartyIdentification': {
              'cbc:ID': {'_attributes':{'schemeID':'6'},'_text':DB.empresa.ruc||'10472430080'}
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': {'_text':DB.empresa.razonSocial||'TOLEDO HUAMAN MAYUMI VANESSA'},
              'cac:RegistrationAddress': {
                'cbc:AddressTypeCode': {'_text':'0000'},
                'cac:AddressLine': {'cbc:Line':{'_text':DB.empresa.direccion||'JR. 2 DE MAYO NRO. 708 HUANUCO HUANUCO HUANUCO'}}
              }
            }
          }
        },
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cac:PartyIdentification': {
              'cbc:ID': {'_attributes':{'schemeID':schemeIdCli},'_text':numDocCli}
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': {'_text':nombreCli}
            }
          }
        },
        'cac:TaxTotal': {
          'cbc:TaxAmount': {'_attributes':{'currencyID':'PEN'},'_text':0},
          'cac:TaxSubtotal': [{
            'cbc:TaxableAmount': {'_attributes':{'currencyID':'PEN'},'_text':totalPagar},
            'cbc:TaxAmount':     {'_attributes':{'currencyID':'PEN'},'_text':0},
            'cac:TaxCategory': {
              'cac:TaxScheme': {
                'cbc:ID':          {'_text':'9997'},
                'cbc:Name':        {'_text':'EXO'},
                'cbc:TaxTypeCode': {'_text':'VAT'}
              }
            }
          }]
        },
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {'_attributes':{'currencyID':'PEN'},'_text':totalPagar},
          'cbc:TaxInclusiveAmount':  {'_attributes':{'currencyID':'PEN'},'_text':totalPagar},
          'cbc:PayableAmount':       {'_attributes':{'currencyID':'PEN'},'_text':totalPagar}
        },
        'cac:InvoiceLine': invoiceLines
      }
    };
  },

  async enviarSunat(id) {
  var idx = (DB.ventas||[]).findIndex(function(x){ return Number(x.id)===Number(id); });
  if(idx < 0){ App.toast('Venta no encontrada','error'); return; }
  var venta = DB.ventas[idx];
  if(venta.tipo !== 'BOL' && venta.tipo !== 'FAC'){
    App.toast('Las notas de venta no se envían a SUNAT','warning'); return;
  }
  App.toast('⏳ Enviando a SUNAT...','info');
  try {
    var cli = (DB.clientes||[]).find(function(c){return c.id===venta.cliente_id;});
    var numDocCli='00000000', nombreCli='---', schemeIdCli='1';
    if(cli && cli.doc !== '00000000'){
      numDocCli=cli.doc; nombreCli=cli.nombre||'---';
      schemeIdCli=cli.tipo==='RUC'?'6':'1';
    }
    var tipoDoc = venta.serie.startsWith('B')?'03':'01';
    var correlativo = String(parseInt(venta.numero,10)||1).padStart(8,'0');
    var fileName = (DB.empresa.ruc||'10472430080')+'-'+tipoDoc+'-'+venta.serie+'-'+correlativo;
    var compactItems = JSON.stringify(venta.items.map(function(item){
      return {n:item.nombre, q:item.qty, p:item.precio, t:item.total};
    }));
    var gasUrl = 'https://script.google.com/macros/s/AKfycbzopc9-UZI3fNvav1c1_Tar52kRy_gom7grN5-q4MdlTOQ6SSvD_BH2CSmTmgW1j_EfXg/exec';
    var params = new URLSearchParams({
      accion:       'sunat_v2',
      personaId:    '6a07684fa58ab9002977930b',
      personaToken: 'PRD_hijNQEDhfCDVz79A5al6tInLAh5ABPJ9kQJol6jmj5Xo6V1N21HnleBuEx96JOZ7',
      fileName:     fileName,
      ruc:          DB.empresa.ruc||'10472430080',
      razonSocial:  DB.empresa.razonSocial||'TOLEDO HUAMAN MAYUMI VANESSA',
      direccion:    DB.empresa.direccion||'JR. 2 DE MAYO NRO. 708 HUANUCO HUANUCO HUANUCO',
      serie:        venta.serie,
      numero:       correlativo,
      fecha:        venta.fecha,
      hora:         (venta.hora||'00:00:00').slice(0,8),
      total:        venta.total,
      docCli:       numDocCli,
      nombreCli:    nombreCli,
      schemeCli:    schemeIdCli,
      items:        compactItems
    });
    var res = await fetch(gasUrl + '?' + params.toString());
    if(!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if(data.status === 'PENDIENTE' || data.status === 'ACEPTADO'){
      DB.ventas[idx].estado = 'ACEPTADO';
      DB.ventas[idx].sunat_documentId = data.documentId || '';
      Storage.guardarVentas();
      SupabaseDB.actualizarVenta(DB.ventas[idx]);
      App.toast('✅ Comprobante enviado y aceptado por SUNAT','success');
    } else if(data.status === 'RECHAZADO' || data.status === 'EXCEPCION'){
      var msg = (data.observations&&data.observations[0])||data.error||JSON.stringify(data);
      App.toast('⚠️ SUNAT rechazó: '+msg,'error');
      console.error('APISUNAT respuesta:', data);
    } else {
      App.toast('⚠️ Respuesta: '+JSON.stringify(data),'error');
      console.error('APISUNAT respuesta:', data);
    }
  } catch(e){
    App.toast('❌ Error de conexión con APISUNAT','error');
    console.error('APISUNAT error:', e);
  }
  App.renderPage();
},

  // ─────────────────────────────────────────────────────────
  // ANULAR — con modal profesional
  // ─────────────────────────────────────────────────────────
  anular(id) {
    var v=(DB.ventas||[]).find(function(x){return Number(x.id)===Number(id);});
    if(!v)return;
    var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
    App.showModal('🚫 Anular Comprobante',
      '<div style="text-align:center;padding:10px;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
          '<i class="fas fa-ban" style="font-size:28px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">¿Anular comprobante?</div>' +
        '<div style="font-size:14px;color:var(--accent);font-weight:700;margin-bottom:4px;">'+v.serie+'-'+v.numero+'</div>' +
        '<div style="font-size:13px;color:var(--gray-500);margin-bottom:12px;">'+(cli?cli.nombre:'N/A')+' · S/ '+v.total.toFixed(2)+'</div>' +
        '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">' +
          '<i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>' +
          'Esta acción no se puede deshacer. Se devolverá el stock de '+(v.items?v.items.length:0)+' producto(s).' +
        '</div>' +
      '</div>',
      [{text:'🚫 Sí, anular',cls:'btn-danger',cb:function(){
        var i=(DB.ventas||[]).findIndex(function(x){return Number(x.id)===Number(id);});
        if(i>=0){
          DB.ventas[i].estado='ANULADO';
          (DB.ventas[i].items||[]).forEach(function(item){
            var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
            if(pi>=0) DB.productos[pi].stock=(DB.productos[pi].stock||0)+item.qty;
          });
          Storage.guardarVentas(); Storage.guardarProductos();
         (DB.ventas[i].items||[]).forEach(function(item){
         var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
        if(pi>=0) SupabaseDB.actualizarProducto(DB.productos[pi]);
      });
          SupabaseDB.actualizarVenta(DB.ventas[i]);
        }
        App.toast('Comprobante anulado y stock devuelto','warning');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='400px';
  },

  // ─────────────────────────────────────────────────────────
  // EXPORTAR
  // ─────────────────────────────────────────────────────────
  exportarVentas() {
    var filtered = this.getFiltered();
    if (!filtered.length) { App.toast('No hay ventas para exportar', 'warning'); return; }
    var self = this;
    var wb = XLSX.utils.book_new();

    // ── HOJA 1: DETALLE DE VENTAS ──
    var detalle = [
      ['REPORTE DE VENTAS — MAGAMA SHOP'],
      ['RUC: ' + (DB.empresa.ruc||'10472430080') + '   |   Generado: ' + new Date().toLocaleString('es-PE') + '   |   Total registros: ' + filtered.length],
      [],
      ['Fecha','Hora','Comprobante','Tipo','Cliente','Doc. Cliente','Método de Pago','Total (S/)','Estado SUNAT','Cajero']
    ];
    var tipoLabel = {'BOL':'Boleta Electrónica','FAC':'Factura Electrónica','N. VENTA':'Nota de Venta'};
    var estadoLabel = {'ACEPTADO':'✓ Aceptado','NO_ENVIADO':'⏳ Por enviar','ANULADO':'✗ Anulado'};
    filtered.forEach(function(v) {
      var cli = (DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
      detalle.push([
        v.fecha, v.hora,
        v.serie + '-' + v.numero,
        tipoLabel[v.tipo] || v.tipo,
        (cli ? cli.nombre : '') || 'PÚBLICO EN GENERAL',
        (cli ? cli.doc : '') || '00000000',
        v.metodo_pago,
        parseFloat(v.total.toFixed(2)),
        estadoLabel[v.estado] || v.estado,
        v.cajero || ''
      ]);
    });
    // Fila total
    detalle.push([]);
    detalle.push(['','','','','','','TOTAL GENERAL',
      filtered.filter(function(v){return v.estado!=='ANULADO';}).reduce(function(s,v){return s+v.total;},0).toFixed(2)*1,
      '','']);

    var ws1 = XLSX.utils.aoa_to_sheet(detalle);
    // Column widths
    ws1['!cols'] = [{wch:12},{wch:10},{wch:16},{wch:22},{wch:28},{wch:14},{wch:26},{wch:12},{wch:14},{wch:16}];
    // Merge title rows
    ws1['!merges'] = [{s:{r:0,c:0},e:{r:0,c:9}},{s:{r:1,c:0},e:{r:1,c:9}}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Detalle de Ventas');

    // ── HOJA 2: RESUMEN EJECUTIVO ──
    var validas = filtered.filter(function(v){return v.estado!=='ANULADO';});
    var anuladas = filtered.filter(function(v){return v.estado==='ANULADO';});
    var aceptadas = filtered.filter(function(v){return v.estado==='ACEPTADO';});
    var porEnviar = filtered.filter(function(v){return v.estado==='NO_ENVIADO';});
    var totalMonto = validas.reduce(function(s,v){return s+v.total;},0);

    // Ventas por día
    var byDay = {};
    validas.forEach(function(v){
      if(!byDay[v.fecha]) byDay[v.fecha]={count:0,total:0};
      byDay[v.fecha].count++; byDay[v.fecha].total+=v.total;
    });
    var dayRows = Object.keys(byDay).sort().reverse().map(function(f){
      return [f, byDay[f].count, parseFloat(byDay[f].total.toFixed(2))];
    });

    // Ventas por método
    var byPago = {};
    validas.forEach(function(v){
      var m = v.metodo_pago.includes('YAPE')&&v.metodo_pago.includes('EFECTIVO')?'COMBINADO (YAPE+EFECTIVO)':v.metodo_pago;
      if(!byPago[m]) byPago[m]={count:0,total:0};
      byPago[m].count++; byPago[m].total+=v.total;
    });

    var resumen = [
      ['RESUMEN EJECUTIVO — MAGAMA SHOP'],
      [],
      ['INDICADORES CLAVE',''],
      ['Total de Ventas (sin anulados)', validas.length],
      ['Monto Total (S/)', parseFloat(totalMonto.toFixed(2))],
      ['Boletas Electrónicas', filtered.filter(function(v){return v.tipo==='BOL'&&v.estado!=='ANULADO';}).length],
      ['Facturas Electrónicas', filtered.filter(function(v){return v.tipo==='FAC'&&v.estado!=='ANULADO';}).length],
      ['Notas de Venta', filtered.filter(function(v){return v.tipo==='N. VENTA'&&v.estado!=='ANULADO';}).length],
      ['Comprobantes Anulados', anuladas.length],
      ['Aceptados por SUNAT', aceptadas.length],
      ['Pendientes de enviar SUNAT', porEnviar.length],
      [],
      ['VENTAS POR DÍA','',''],
      ['Fecha','# Ventas','Monto (S/)']
    ].concat(dayRows).concat([
      [],
      ['VENTAS POR MÉTODO DE PAGO','','',''],
      ['Método','# Ventas','Monto (S/)','% del Total']
    ]).concat(Object.keys(byPago).sort(function(a,b){return byPago[b].total-byPago[a].total;}).map(function(m){
      return [m, byPago[m].count, parseFloat(byPago[m].total.toFixed(2)),
              parseFloat((byPago[m].total/totalMonto*100).toFixed(1))+'%'];
    }));

    var ws2 = XLSX.utils.aoa_to_sheet(resumen);
    ws2['!cols'] = [{wch:30},{wch:14},{wch:16},{wch:12}];
    ws2['!merges'] = [{s:{r:0,c:0},e:{r:0,c:3}}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Ejecutivo');

    // ── HOJA 3: REGISTRO CONTABLE ──
    var contable = [
      ['REGISTRO DE VENTAS PARA CONTABILIDAD — MAGAMA SHOP   |   RUC: ' + (DB.empresa.ruc||'10472430080')],
      ['Período: ' + self.fechaInicio + ' al ' + self.fechaFin + '   |   IGV: Exonerado (Operación Onerosa - Código 20)'],
      [],
      ['N°','Fecha','Serie-Número','Tipo Comprobante','RUC/DNI Cliente','Razón Social','Op. Exonerada (S/)','IGV (S/)','Total (S/)','Estado']
    ];
    validas.forEach(function(v, idx) {
      var cli = (DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
      contable.push([
        idx+1, v.fecha,
        v.serie+'-'+v.numero,
        tipoLabel[v.tipo]||v.tipo,
        (cli?cli.doc:'')||'00000000',
        (cli?cli.nombre:'')||'PÚBLICO EN GENERAL',
        parseFloat(v.total.toFixed(2)),
        0,
        parseFloat(v.total.toFixed(2)),
        v.estado==='ACEPTADO'?'ACEPTADO':'PENDIENTE'
      ]);
    });
    contable.push([]);
    contable.push(['','','','','','TOTALES',
      parseFloat(totalMonto.toFixed(2)), 0, parseFloat(totalMonto.toFixed(2)),'']);

    var ws3 = XLSX.utils.aoa_to_sheet(contable);
    ws3['!cols'] = [{wch:5},{wch:12},{wch:16},{wch:26},{wch:14},{wch:28},{wch:18},{wch:10},{wch:14},{wch:12}];
    ws3['!merges'] = [{s:{r:0,c:0},e:{r:0,c:9}},{s:{r:1,c:0},e:{r:1,c:9}}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Registro Contable');

    // Descargar
    XLSX.writeFile(wb, 'Ventas_MAGAMA_' + self._fechaLocal() + '.xlsx');
    App.toast('✅ Excel exportado con ' + filtered.length + ' registros en 3 hojas', 'success');
  },

  // ─────────────────────────────────────────────────────────
  // FILTRADO
  // ─────────────────────────────────────────────────────────
  getFiltered() {
    var self=this;
    return (DB.ventas||[]).filter(function(v){
      var matchTipo   = self.tipoFilter==='todos'||(self.tipoFilter==='ANULADO'?v.estado==='ANULADO':v.tipo===self.tipoFilter&&v.estado!=='ANULADO');
      var q           = (self.searchTerm||'').toLowerCase();
      var cli         = (DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
      var matchSearch = !q||
        (v.numero||'').includes(q)||(v.serie||'').includes(q)||
        ((cli&&cli.nombre)||'').toLowerCase().includes(q)||
        ((cli&&cli.doc)||'').includes(q);
      var matchFecha  = (!self.fechaInicio||v.fecha>=self.fechaInicio)&&(!self.fechaFin||v.fecha<=self.fechaFin);
      return matchTipo&&matchSearch&&matchFecha;
    });
  },

  limpiarFiltros() {
    this.searchTerm=''; this.tipoFilter='todos'; this.fechaInicio=''; this.fechaFin='';
    this.currentPage=1; this._filtroRapido=''; App.renderPage();
  },

  _enviarWADetalle(id) {
    var el  = document.getElementById('wa_tel_detalle');
    var num = el ? el.value.replace(/\D/g,'') : '';
    if (!num || num.length !== 9) { App.toast('Ingresa los 9 dígitos del WhatsApp', 'error'); return; }
    var v = (DB.ventas||[]).find(function(x){ return Number(x.id)===Number(id); });
    if (!v) return;
    App.closeModal();
    if (typeof TicketsModule !== 'undefined' && TicketsModule._abrirWhatsApp) {
      TicketsModule._abrirWhatsApp('51'+num, v);
      var cfg     = TicketsModule._getCfg();
      var waAdmin = (cfg.whatsappAdmin || (DB.empresa&&DB.empresa.whatsapp) || '').replace(/\D/g,'');
      if (waAdmin) setTimeout(function(){ TicketsModule._abrirWhatsApp('51'+waAdmin, v); }, 1200);
    } else {
      var msg = '\ud83e\uddfe *'+DB.empresa.nombre+'*\n'+v.tipo+': '+v.serie+'-'+v.numero+'\nTotal: S/ '+v.total.toFixed(2)+'\n\u00a1Gracias por su compra!';
      window.open('https://wa.me/51'+num+'?text='+encodeURIComponent(msg), '_blank');
    }
    App.toast('\u2705 Abriendo WhatsApp...', 'success');
  },

  // ─────────────────────────────────────────────────────────
  // PANEL DE ACCIONES DEL COMPROBANTE (completo)
  // ─────────────────────────────────────────────────────────
  _panelAcciones(v) {
    var esBolFac      = (v.tipo==='BOL'||v.tipo==='FAC');
    var aceptadoSunat = (v.estado==='ACEPTADO' && v.sunat_documentId);
    var noAnulado     = (v.estado!=='ANULADO');

    function btn(label, icon, color, onclick) {
      return '<button onclick="'+onclick+'" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;border:none;border-radius:9px;background:'+color+';color:white;font-size:13px;font-weight:700;cursor:pointer;width:100%;box-sizing:border-box;">' +
        '<i class="'+icon+'"></i>'+label+'</button>';
    }

    var AZUL='#2563eb', VERDE='#16a34a', MORADO='#7c3aed', GRIS='#64748b', ROJO='#dc2626', TEAL='#0891b2';
    var b = [];

    b.push(btn('Enviar por correo','fas fa-envelope',AZUL,"VentasModule._enviarCorreo("+v.id+")"));
    b.push(btn('Enviar por WhatsApp','fab fa-whatsapp',VERDE,"VentasModule._enviarWADetalle("+v.id+")"));
    b.push(btn('Visualizar PDF','fas fa-file-pdf',AZUL,"VentasModule.imprimir("+v.id+");App.closeModal();"));
    b.push(btn('Imprimir','fas fa-print',AZUL,"VentasModule.imprimir("+v.id+");App.closeModal();"));
    b.push(btn('Descargar PDF','fas fa-download',AZUL,"VentasModule.imprimir("+v.id+");App.closeModal();"));
    b.push(btn('Guía de Remisión','fas fa-truck',GRIS,"App.toast('Guías de Remisión — próximamente','info')"));
    b.push(btn('Nota de Crédito','fas fa-file-invoice',MORADO,"App.closeModal();App.navigate('notascredito');"));
    b.push(btn('Nota de Débito','fas fa-file-invoice-dollar',MORADO,"App.closeModal();App.navigate('notascredito');"));
    if (aceptadoSunat) {
      b.push(btn('Descargar XML','fas fa-code',GRIS,"VentasModule._descargarSunat("+v.id+",'xml')"));
      b.push(btn('Descargar CDR','fas fa-file-contract',GRIS,"VentasModule._descargarSunat("+v.id+",'cdr')"));
    }
    if (esBolFac && v.estado!=='ACEPTADO' && noAnulado) {
      b.push(btn('Enviar a SUNAT','fas fa-paper-plane',VERDE,"App.closeModal();VentasModule.enviarSunat("+v.id+");"));
    }
    b.push(btn('Nuevo','fas fa-plus-circle',VERDE,"App.closeModal();VentasModule.nuevaVenta();"));
    if (noAnulado) b.push(btn('Anular','fas fa-ban',ROJO,"App.closeModal();VentasModule.anular("+v.id+");"));
    b.push(btn('Listado','fas fa-list',TEAL,"App.closeModal();VentasModule.modoVista='lista';App.renderPage();"));
    b.push(btn('Convertir a Nuevo CPE','fas fa-exchange-alt',AZUL,"VentasModule.convertirCPE("+v.id+")"));

    return '<div style="margin-top:16px;padding-top:14px;border-top:2px solid var(--gray-200);">' +
      '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;"><i class="fas fa-bolt" style="color:var(--accent);margin-right:5px;"></i>Acciones del Comprobante</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' + b.join('') + '</div>' +
    '</div>';
  },

  _enviarCorreo(id) {
    var v=(DB.ventas||[]).find(function(x){return Number(x.id)===Number(id);}); if(!v)return;
    var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
    var para=(cli&&cli.email)?cli.email:'';
    var asunto=(DB.empresa.nombre||'MAGAMA')+' — '+v.serie+'-'+v.numero;
    var cuerpo='Hola'+(cli&&cli.nombre?' '+cli.nombre:'')+',\n\n'+
      'Le compartimos el detalle de su comprobante:\n\n'+
      v.tipo_comprobante+': '+v.serie+'-'+v.numero+'\n'+
      'Fecha: '+v.fecha+' '+v.hora+'\n'+
      'Total: S/ '+v.total.toFixed(2)+'\n\n'+
      '¡Gracias por su compra!\n'+(DB.empresa.nombre||'MAGAMA');
    window.location.href='mailto:'+encodeURIComponent(para)+'?subject='+encodeURIComponent(asunto)+'&body='+encodeURIComponent(cuerpo);
    App.toast('📧 Abriendo tu correo...','info');
  },

  _descargarSunat(id, tipo) {
    App.toast('La descarga de '+(tipo||'').toUpperCase()+' desde SUNAT necesita un paso extra en el proxy. Te lo armo aparte cuando quieras.','info');
  },

  convertirCPE(id) {
    var v=(DB.ventas||[]).find(function(x){return Number(x.id)===Number(id);}); if(!v)return;
    App.closeModal();
    this.nuevaVenta();
    this.currentItems=(v.items||[]).map(function(it){
      var p=(DB.productos||[]).find(function(x){return x.id===it.prod_id;});
      return {prod_id:it.prod_id,codigo:p?p.codigo:'',nombre:it.nombre,imagen:p?(p.imagen||''):'',unidad:p?(p.unidad||'UND'):'UND',precio:it.precio,qty:it.qty,dcto:0,total:it.total};
    });
    var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
    if(cli) this.selectedCliente=cli;
    this._convertingFromId = id;
    App.toast('📋 Productos copiados. Elige BOLETA o FACTURA arriba y procesa — la Nota de Venta original se anulará sola para no duplicar.','info');
    App.renderPage();
  },

  toggleMenu(id) {
    document.querySelectorAll('.action-menu').forEach(function(m){if(m.id!=='menu-venta-'+id)m.classList.add('hidden');});
    var el=document.getElementById('menu-venta-'+id); if(el) el.classList.toggle('hidden');
  }
};
