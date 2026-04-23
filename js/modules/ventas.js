// ============================================================
// MÓDULO: VENTAS — Gestión de Comprobantes (Versión Profesional)
// ============================================================

const VentasModule = {

  // ─── ESTADO LISTA ───
  fechaInicio:  '',
  fechaFin:     '',
  tipoFilter:   'todos',
  searchTerm:   '',
  currentPage:  1,
  itemsPerPage: 15,

  // ─── ESTADO COMPROBANTE ───
  currentItems:    [],
  selectedCliente: null,
  tipoComprobante: 'NOTA DE VENTA',
  serieActual:     'NV03',
  metodoPago:      'EFECTIVO',
  montoPago:       0,
  descGlobal:      0,
  modoVista:       'comprobante',
  _searchResults:  null, // 'lista' | 'comprobante'

  // ─────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────
  render() {
    App.setTabs2('Gestión de Ventas', 'VENTAS');
    return this.modoVista === 'comprobante' ? this.renderComprobante() : this.renderLista();
  },

  _fechaLocal() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },

  // ─────────────────────────────────────────────────────────
  // LISTA DE VENTAS
  // ─────────────────────────────────────────────────────────
  renderLista() {
    var hoy   = this._fechaLocal();
    if (!this.fechaInicio) this.fechaInicio = hoy.slice(0,8) + '01';
    if (!this.fechaFin)    this.fechaFin    = hoy;

    var filtered    = this.getFiltered();
    var totalVentas = filtered.reduce(function(s,v){ return s+v.total; }, 0);
    var totalPages  = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    var paged       = filtered.slice((this.currentPage-1)*this.itemsPerPage, this.currentPage*this.itemsPerPage);
    var self        = this;

    // KPIs
    var kpis = [
      { icon:'fa-file-invoice', bg:'#eff6ff', color:'#2563eb', val:filtered.length,                                    label:'Comprobantes' },
      { icon:'fa-check-circle', bg:'#f0fdf4', color:'#16a34a', val:filtered.filter(function(v){return v.estado==='ACEPTADO';}).length, label:'Aceptados SUNAT' },
      { icon:'fa-clock',        bg:'#fffbeb', color:'#d97706', val:filtered.filter(function(v){return v.estado==='NO_ENVIADO';}).length, label:'Por Enviar' },
      { icon:'fa-ban',          bg:'#fef2f2', color:'#dc2626', val:filtered.filter(function(v){return v.estado==='ANULADO';}).length, label:'Anulados' },
      { icon:'fa-dollar-sign',  bg:'#f0fdf4', color:'#16a34a', val:'S/ '+totalVentas.toFixed(2),                        label:'Total Periodo' },
      { icon:'fa-receipt',      bg:'#fdf4ff', color:'#7c3aed', val:'S/ '+(totalVentas/1.18).toFixed(2),                 label:'Subtotal (sin IGV)' },
    ];

    return '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-title"><i class="fas fa-file-invoice-dollar" style="color:var(--accent);margin-right:8px;"></i>Gestión de Ventas</h2>' +
        '<p class="text-muted text-sm">' + filtered.length + ' comprobantes · Total: <strong style="color:var(--success);">S/ ' + totalVentas.toFixed(2) + '</strong></p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-outline" onclick="VentasModule.exportarVentas()"><i class="fas fa-file-download"></i> Exportar</button>' +
        '<button class="btn btn-success" style="padding:10px 24px;font-size:15px;" onclick="VentasModule.nuevaVenta()"><i class="fas fa-plus"></i> Nuevo Comprobante</button>' +
      '</div>' +
    '</div>' +

    // KPIs
    '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">' +
      kpis.map(function(k) {
        return '<div class="stat-card">' +
          '<div class="stat-icon" style="background:'+k.bg+';color:'+k.color+'"><i class="fas '+k.icon+'"></i></div>' +
          '<div class="stat-info"><div class="stat-value">'+k.val+'</div><div class="stat-label">'+k.label+'</div></div>' +
        '</div>';
      }).join('') +
    '</div>' +

    '<div class="card">' +
      '<div class="card-body" style="padding-bottom:0;">' +
        '<div class="filter-row mb-3" style="flex-wrap:wrap;gap:10px;">' +
          '<div class="filter-group"><label>DESDE</label>' +
            '<input type="date" class="filter-input" value="'+this.fechaInicio+'" onchange="VentasModule.fechaInicio=this.value;App.renderPage()"/>' +
          '</div>' +
          '<div class="filter-group"><label>HASTA</label>' +
            '<input type="date" class="filter-input" value="'+this.fechaFin+'" onchange="VentasModule.fechaFin=this.value;App.renderPage()"/>' +
          '</div>' +
          '<div class="filter-group"><label>TIPO</label>' +
            '<select class="filter-select" onchange="VentasModule.tipoFilter=this.value;VentasModule.currentPage=1;App.renderPage()">' +
              '<option value="todos" '+(this.tipoFilter==='todos'?'selected':'')+'>Todos</option>' +
              '<option value="N. VENTA" '+(this.tipoFilter==='N. VENTA'?'selected':'')+'>Nota de Venta</option>' +
              '<option value="BOL" '+(this.tipoFilter==='BOL'?'selected':'')+'>Boleta</option>' +
              '<option value="FAC" '+(this.tipoFilter==='FAC'?'selected':'')+'>Factura</option>' +
            '</select>' +
          '</div>' +
          '<div class="search-bar" style="flex:1;min-width:200px;align-self:flex-end;">' +
            '<i class="fas fa-search"></i>' +
            '<input type="text" placeholder="Buscar comprobante, cliente..." value="'+this.searchTerm+'" ' +
              'oninput="VentasModule.searchTerm=this.value;App.renderPage()"/>' +
          '</div>' +
          '<button class="btn btn-outline btn-sm" style="align-self:flex-end;" onclick="VentasModule.limpiarFiltros()">' +
            '<i class="fas fa-times"></i> Limpiar</button>' +
        '</div>' +
      '</div>' +

      '<div class="table-wrapper">' +
        '<table class="data-table">' +
          '<thead><tr>' +
            '<th>Fecha</th><th>Hora</th><th>Comprobante</th><th>Cliente</th>' +
            '<th>Método Pago</th><th>Total</th><th>Estado</th><th>Acciones</th>' +
          '</tr></thead>' +
          '<tbody>' +
          (paged.length === 0 ?
            '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-file-invoice"></i>' +
            '<p>No hay ventas en este periodo</p>' +
            '<button class="btn btn-success btn-sm" onclick="VentasModule.nuevaVenta()" style="margin-top:12px;">' +
            '<i class="fas fa-plus"></i> Crear Primer Comprobante</button></div></td></tr>' :
            paged.map(function(v) {
              var cli = DB.clientes.find(function(c){ return c.id === v.cliente_id; });
              var tipoLabel = v.tipo === 'BOL' ? 'BOLETA' : v.tipo === 'FAC' ? 'FACTURA' : 'N. VENTA';
              var tipoColor = v.tipo === 'BOL' ? '#2563eb' : v.tipo === 'FAC' ? '#7c3aed' : '#ea580c';
              var estBg = v.estado==='ACEPTADO'?'#dcfce7':v.estado==='ANULADO'?'#fee2e2':'#fef3c7';
              var estClr = v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706';
              var estLabel = v.estado==='ACEPTADO'?'✓ Aceptado':v.estado==='ANULADO'?'✗ Anulado':'⏳ Por enviar';
              return '<tr>' +
                '<td><strong>'+self.formatFecha(v.fecha)+'</strong></td>' +
                '<td class="text-muted text-sm">'+v.hora+'</td>' +
                '<td>' +
                  '<span style="color:'+tipoColor+';font-weight:800;font-size:11px;background:'+tipoColor+'18;padding:2px 8px;border-radius:4px;margin-right:4px;">'+tipoLabel+'</span>' +
                  '<span style="font-weight:700;color:'+tipoColor+';">'+v.serie+'-'+v.numero+'</span>' +
                '</td>' +
                '<td>' +
                  '<div style="font-weight:700;font-size:13px;">'+(cli?cli.nombre:'N/A')+'</div>' +
                  '<div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div>' +
                '</td>' +
                '<td><span style="font-size:12px;font-weight:600;">'+v.metodo_pago+'</span></td>' +
                '<td><strong style="font-size:15px;">S/ '+v.total.toFixed(2)+'</strong></td>' +
                '<td><span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+estBg+';color:'+estClr+';">'+estLabel+'</span></td>' +
                '<td>' +
                  '<div class="action-menu-wrapper">' +
                    '<button class="action-menu-btn" onclick="VentasModule.toggleMenu('+v.id+')"><i class="fas fa-ellipsis-v"></i></button>' +
                    '<div class="action-menu hidden" id="menu-venta-'+v.id+'">' +
                      '<button class="action-menu-item" onclick="VentasModule.verDetalle('+v.id+')"><i class="fas fa-eye"></i> Ver detalle</button>' +
                      '<button class="action-menu-item" onclick="VentasModule.imprimir('+v.id+')"><i class="fas fa-print"></i> Imprimir</button>' +
                      (v.estado !== 'ACEPTADO' && v.estado !== 'ANULADO' ?
                        '<button class="action-menu-item" onclick="VentasModule.enviarSunat('+v.id+')"><i class="fas fa-paper-plane"></i> Enviar SUNAT</button>' : '') +
                      (v.estado !== 'ANULADO' ?
                        '<div style="border-top:1px solid var(--gray-200);margin:4px 0;"></div>' +
                        '<button class="action-menu-item danger" onclick="VentasModule.anular('+v.id+')"><i class="fas fa-ban"></i> Anular</button>' : '') +
                    '</div>' +
                  '</div>' +
                '</td>' +
              '</tr>';
            }).join('')
          ) +
          '</tbody>' +
        '</table>' +
      '</div>' +

      // Paginación
      '<div class="pagination">' +
        '<span class="text-sm text-muted">' +
          Math.min((this.currentPage-1)*this.itemsPerPage+1, filtered.length) + '–' +
          Math.min(this.currentPage*this.itemsPerPage, filtered.length) + ' de ' + filtered.length +
        '</span>' +
        '<button class="pagination-btn" onclick="VentasModule.currentPage=1;App.renderPage()" '+(this.currentPage===1?'disabled':'')+'><i class="fas fa-angle-double-left"></i></button>' +
        '<button class="pagination-btn" onclick="VentasModule.currentPage--;App.renderPage()" '+(this.currentPage===1?'disabled':'')+'><i class="fas fa-chevron-left"></i></button>' +
        '<button class="pagination-btn" onclick="VentasModule.currentPage++;App.renderPage()" '+(this.currentPage===totalPages?'disabled':'')+'><i class="fas fa-chevron-right"></i></button>' +
        '<button class="pagination-btn" onclick="VentasModule.currentPage='+totalPages+';App.renderPage()" '+(this.currentPage===totalPages?'disabled':'')+'><i class="fas fa-angle-double-right"></i></button>' +
      '</div>' +
    '</div>';
  },

  // ─────────────────────────────────────────────────────────
  // NUEVO COMPROBANTE — FORMULARIO PROFESIONAL
  // ─────────────────────────────────────────────────────────
  // Alias para compatibilidad con links existentes
  nuevoComprobante() { this.nuevaVenta(); },

  nuevaVenta() {
    this.currentItems = [];
    // Asegurar que "Público en General" exista en DB
    var publico = DB.clientes.find(function(c){ return c.doc === '00000000'; });
    if (!publico) {
      publico = {
        id: 0, doc: '00000000', nombre: 'PÚBLICO EN GENERAL',
        tipo: 'DNI', tipo_cliente: 'cliente', telefono: '', email: '', direccion: ''
      };
      DB.clientes.unshift(publico);
    }
    this.selectedCliente = publico;
    this.tipoComprobante = 'NOTA DE VENTA';
    this.serieActual     = 'NV03';
    this.metodoPago      = 'EFECTIVO';
    this.montoPago       = 0;
    this.descGlobal      = 0;
    this.modoVista       = 'comprobante';
    App.renderPage();
  },

  renderComprobante() {
    var self     = this;
    var total    = this.getTotal();
    var subtotal = total / 1.18;
    var igv      = total - subtotal;
    var vuelto   = Math.max(0, this.montoPago - total);
    var hoy      = this._fechaLocal();
    var serie    = this.serieActual;
    var nextNum  = DB._sequences[serie] ? String(DB._sequences[serie]).padStart(8,'0') : '00000001';
    var cli      = this.selectedCliente;
    var usuario  = DB.usuarioActual;

    // ── Tipo comprobante ──
    var tipos = [
      { key:'NV03', label:'NOTA DE VENTA',      color:'#ea580c', nombre:'NOTA DE VENTA' },
      { key:'BV03', label:'BOLETA ELECTRÓNICA',  color:'#2563eb', nombre:'BOLETA DE VENTA ELECTRONICA' },
      { key:'FC01', label:'FACTURA ELECTRÓNICA', color:'#7c3aed', nombre:'FACTURA ELECTRONICA' },
    ];
    var tiposBtns = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
    tipos.forEach(function(t) {
      var activo = self.serieActual === t.key;
      tiposBtns +=
        '<button onclick="VentasModule.cambiarTipo(\''+t.key+'\',\''+t.nombre+'\')" ' +
        'style="padding:14px;border-radius:8px;border:2.5px solid '+(activo?t.color:'var(--gray-200)')+';'+
        'background:'+(activo?t.color+'20':'transparent')+';color:'+(activo?t.color:'var(--gray-500)')+';'+
        'font-size:13px;font-weight:900;cursor:pointer;transition:all 0.15s;">' +
        t.label + '</button>';
    });
    tiposBtns += '</div>';

    // ── Area de ítems ──
    var itemsArea = '';
    // Productos recientes (últimos 8 productos usados en ventas, o los primeros 8 del catálogo)
    var productosRecientes = (function() {
      var usados = {};
      DB.ventas.slice(0, 20).forEach(function(v) {
        v.items.forEach(function(it) { usados[it.prod_id] = true; });
      });
      var recientes = DB.productos.filter(function(p){ return usados[p.id]; }).slice(0, 8);
      if (recientes.length < 4) {
        DB.productos.forEach(function(p){ if (!usados[p.id] && recientes.length < 8) recientes.push(p); });
      }
      return recientes;
    })();

    if (this.currentItems.length === 0 && !this._searchResults) {
      var recHTML = productosRecientes.length === 0
        ? '<div style="text-align:center;padding:40px;color:var(--gray-400);"><i class="fas fa-barcode" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.2;"></i><p style="font-size:14px;font-weight:700;">Escanea o busca un producto</p></div>'
        : '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">'+
          productosRecientes.map(function(p) {
            var imgH = p.imagen
              ? '<img src="'+p.imagen+'" style="width:70px;height:70px;object-fit:cover;border-radius:10px;margin-bottom:8px;border:2px solid var(--gray-200);display:block;mx:auto;" alt=""/>'
              : '<div style="width:70px;height:70px;border-radius:10px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;margin-bottom:8px;border:2px dashed var(--gray-300);"><i class="fas fa-image" style="font-size:22px;color:var(--gray-300);"></i></div>';
            var sClr = p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
            var sTxt = p.stock===0?'Sin stock':'Stock: '+p.stock;
            return '<div onclick="VentasModule.agregarDesdeResultados('+p.id+')" '+
              'style="display:flex;flex-direction:column;align-items:center;text-align:center;'+
              'padding:14px 10px;border-radius:12px;border:2px solid var(--gray-200);'+
              'background:white;cursor:pointer;transition:all 0.15s;'+
              (p.stock===0?'opacity:0.5;':'')+'">'+
              imgH+
              '<div style="font-size:13px;font-weight:800;color:var(--gray-900);margin-bottom:4px;'+
                'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">'+p.nombre+'</div>'+
              '<div style="font-size:15px;font-weight:900;color:var(--accent);margin-bottom:3px;">S/ '+p.precio_venta.toFixed(2)+'</div>'+
              '<div style="font-size:11px;font-weight:700;color:'+sClr+';">'+sTxt+'</div>'+
              (p.stock>0
                ? '<div style="margin-top:8px;padding:5px 14px;background:var(--accent);color:white;border-radius:6px;font-size:12px;font-weight:700;"><i class="fas fa-plus" style="margin-right:4px;"></i>Agregar</div>'
                : '')+
            '</div>';
          }).join('')+
          '</div>';

      itemsArea =
        '<div style="padding:14px 16px;">'+
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">'+
            '<i class="fas fa-star" style="color:#f59e0b;font-size:14px;"></i>'+
            '<span style="font-size:12px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;">'+
              'Productos Recientes'+
            '</span>'+
            '<span style="font-size:11px;color:var(--gray-400);margin-left:4px;">— Clic para agregar al ticket</span>'+
          '</div>'+
          recHTML+
          '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--gray-100);text-align:center;">'+
            '<p style="font-size:12px;color:var(--gray-400);">'+
              '<i class="fas fa-barcode" style="margin-right:5px;"></i>'+
              'También puedes escanear el código de barras o usar el buscador de abajo'+
            '</p>'+
          '</div>'+
        '</div>';
    } else if (this._searchResults && this._searchResults.length > 0) {
      itemsArea =
        '<div style="padding:10px 14px;">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
            '<span style="font-size:12px;font-weight:800;color:var(--gray-500);">'+
              '<i class="fas fa-search" style="margin-right:5px;color:var(--accent);"></i>'+
              this._searchResults.length+' resultados encontrados'+
            '</span>'+
            '<button onclick="VentasModule._searchResults=null;App.renderPage();" '+
              'style="background:var(--gray-100);color:var(--gray-600);border:none;border-radius:6px;'+
              'padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">'+
              '<i class="fas fa-times"></i> Cerrar búsqueda</button>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">'+
          self._searchResults.map(function(p) {
            var imgH = p.imagen
              ? '<img src="'+p.imagen+'" style="width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0;border:2px solid var(--gray-200);" alt=""/>'
              : '<div style="width:56px;height:56px;border-radius:8px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px dashed var(--gray-300);"><i class="fas fa-image" style="font-size:18px;color:var(--gray-300);"></i></div>';
            var sClr = p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
            return '<div onclick="VentasModule.agregarDesdeResultados('+p.id+')" '+
              'style="display:flex;gap:10px;align-items:center;padding:10px;border-radius:10px;'+
              'border:1.5px solid var(--gray-200);background:white;cursor:pointer;transition:all 0.15s;'+
              'box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
              imgH+
              '<div style="flex:1;min-width:0;">'+
                '<div style="font-size:13px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p.nombre+'</div>'+
                '<div style="font-size:11px;color:var(--gray-400);margin-bottom:4px;">'+p.codigo+' · '+p.unidad+'</div>'+
                '<div style="display:flex;justify-content:space-between;">'+
                  '<span style="font-size:15px;font-weight:900;color:var(--accent);">S/ '+p.precio_venta.toFixed(2)+'</span>'+
                  '<span style="font-size:11px;font-weight:700;color:'+sClr+';">'+
                    (p.stock===0?'Sin stock':'✓ '+p.stock)+
                  '</span>'+
                '</div>'+
              '</div>'+
            '</div>';
          }).join('')+
          '</div>'+
          (self.currentItems.length > 0 ?
            '<div style="border-top:1px solid var(--gray-200);margin-top:12px;padding-top:12px;">'+
              '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">EN EL TICKET</div>'+
              self._renderItemsList()+
            '</div>' : ''
          )+
        '</div>';
    } else if (this._searchResults && this._searchResults.length === 0) {
      itemsArea =
        '<div style="text-align:center;padding:40px 20px;color:var(--gray-400);">'+
          '<i class="fas fa-search" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.3;"></i>'+
          '<p style="font-size:14px;font-weight:700;">Sin resultados</p>'+
          '<p style="font-size:12px;opacity:0.6;">Intenta con otro nombre o código</p>'+
          '<button onclick="VentasModule._searchResults=null;App.renderPage();" style="margin-top:10px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">Limpiar búsqueda</button>'+
        '</div>';
    } else {
      itemsArea = '<div style="padding:8px 12px;">' + self._renderItemsList() + '</div>';
    }

    // ── Métodos de pago (para la barra inferior) ──
    var metodos = [
      {val:'EFECTIVO',     icon:'fa-money-bill-wave', color:'#16a34a', label:'Efectivo'},
      {val:'TARJETA',      icon:'fa-credit-card',     color:'#2563eb', label:'Tarjeta'},
      {val:'YAPE',         icon:'fa-mobile-alt',      color:'#7c3aed', label:'Yape/Plin'},
      {val:'TRANSFERENCIA',icon:'fa-university',      color:'#0ea5e9', label:'Transferencia'},
    ];
    var metodoBtnsBar = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">';
    metodos.forEach(function(m) {
      var activo = self.metodoPago === m.val;
      metodoBtnsBar +=
        '<button onclick="VentasModule.metodoPago=\''+m.val+'\';App.renderPage();" '+
        'style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;'+
        'border:2px solid '+(activo?m.color:'var(--gray-200)')+';'+
        'background:'+(activo?m.color+'20':'white')+';cursor:pointer;transition:all 0.15s;">'+
        '<div style="width:32px;height:32px;border-radius:7px;background:'+(activo?m.color:'var(--gray-100)')+
          ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
          '<i class="fas '+m.icon+'" style="font-size:15px;color:'+(activo?'white':m.color)+';"></i>'+
        '</div>'+
        '<span style="font-size:13px;font-weight:800;color:'+(activo?m.color:'var(--gray-600)')+';">'+m.label+'</span>'+
        (activo?'<i class="fas fa-check-circle" style="margin-left:auto;color:'+m.color+';font-size:15px;"></i>':'')+
        '</button>';
    });
    metodoBtnsBar += '</div>';

    // Billetes rápidos
    var vueltoClr = vuelto >= 0 ? '#16a34a' : '#dc2626';
    var vueltoBg  = vuelto >= 0 ? '#f0fdf4'  : '#fef2f2';

    return (
      // ── TOPBAR ──
      '<div style="display:flex;align-items:center;justify-content:space-between;'+
        'padding:13px 18px;background:var(--gray-50);border-radius:12px;'+
        'border:1.5px solid var(--gray-200);margin-bottom:16px;">'+
        '<div style="display:flex;align-items:center;gap:12px;">'+
          '<button onclick="VentasModule.modoVista=\'lista\';App.renderPage();" '+
            'style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);'+
            'border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;">'+
            '<i class="fas fa-arrow-left" style="margin-right:6px;"></i>Regresar'+
          '</button>'+
          '<div style="width:2px;height:26px;background:var(--gray-200);"></div>'+
          '<div>'+
            '<div style="font-size:18px;font-weight:900;color:var(--gray-900);">Nuevo Comprobante</div>'+
            '<div style="font-size:11px;color:var(--gray-400);">'+
              serie+' · N° '+nextNum+' · '+hoy+(usuario?' · <strong>'+usuario.usuario+'</strong>':'')+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;">'+
          '<button onclick="VentasModule.limpiarLista()" '+
            'style="background:white;color:var(--gray-600);border:1.5px solid var(--gray-200);'+
            'border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;">'+
            '<i class="fas fa-eraser" style="margin-right:5px;"></i>Limpiar Lista'+
          '</button>'+
          '<button onclick="VentasModule.vistaPrevia()" '+
            'style="background:white;color:var(--gray-600);border:1.5px solid var(--gray-200);'+
            'border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;">'+
            '<i class="fas fa-eye" style="margin-right:5px;"></i>Vista Previa'+
          '</button>'+
          '<button onclick="VentasModule.procesar()" '+
            'style="background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;'+
            'border-radius:8px;padding:8px 26px;font-weight:900;cursor:pointer;font-size:15px;'+
            'box-shadow:0 4px 12px rgba(22,163,74,0.3);">'+
            '<i class="fas fa-check" style="margin-right:6px;"></i>PROCESAR'+
          '</button>'+
        '</div>'+
      '</div>'+

      // ── CUERPO: columna única ──
      '<div style="display:flex;flex-direction:column;gap:14px;">'+

        // Card: Tipo + Datos encabezado
        '<div class="card">'+
          '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">'+
            '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">'+
              '<i class="fas fa-file-invoice" style="color:var(--accent);margin-right:5px;"></i>Tipo de Comprobante'+
            '</div>'+
            tiposBtns+
          '</div>'+
          '<div style="padding:14px 20px;">'+
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;">'+
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">SERIE</div>'+
                '<div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;color:var(--accent);">'+serie+'</div></div>'+
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">NÚMERO</div>'+
                '<div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;color:var(--gray-700);">'+nextNum+'</div></div>'+
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">VENTANILLA</div>'+
                '<div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:700;color:var(--gray-600);">'+
                  '<i class="fas fa-desktop" style="margin-right:4px;color:var(--gray-400);"></i>CAJA 01</div></div>'+
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">USUARIO</div>'+
                '<div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:700;color:var(--gray-600);">'+
                  '<i class="fas fa-user" style="margin-right:4px;color:var(--accent);"></i>'+(usuario?usuario.usuario:'N/A')+'</div></div>'+
            '</div>'+
            '<div style="margin-bottom:14px;">'+
              '<div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">CLIENTE <span style="color:#dc2626;">*</span></div>'+
              '<div style="display:flex;gap:8px;">'+
                '<input class="form-control" id="cliSearch" type="text" '+
                  'placeholder="Ingresa DNI/RUC y presiona Enter para buscar..." '+
                  'value="'+(cli?cli.doc+' — '+cli.nombre:'')+'" '+
                  'onkeydown="VentasModule.buscarCliente(event)" style="flex:1;font-size:14px;padding:10px 12px;"/>'+
                '<button class="btn btn-outline" onclick="VentasModule.seleccionarCliente()" style="padding:10px 14px;" title="Buscar">'+
                  '<i class="fas fa-search"></i></button>'+
              '</div>'+
            '</div>'+
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">'+
              '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">FECHA</div>'+
                '<input class="form-control" type="date" id="fechaEmision" value="'+hoy+'" style="font-size:13px;"/></div>'+
              '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">MONEDA</div>'+
                '<select class="form-control" style="font-size:13px;"><option>SOLES</option><option>DÓLARES</option></select></div>'+
              '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">T. CAMBIO</div>'+
                '<input class="form-control" type="number" step="0.001" value="'+DB.empresa.tipoCambio+'" style="font-size:13px;"/></div>'+
              '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">DCTO. GLOBAL %</div>'+
                '<input class="form-control" type="number" step="0.01" min="0" max="100" id="descGlobalComp" value="'+self.descGlobal+'" oninput="VentasModule.setDescGlobal(this.value)" style="font-size:13px;"/></div>'+
            '</div>'+
          '</div>'+
        '</div>'+

        // Card: Productos
        '<div class="card">'+
          '<div style="padding:12px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">'+
            '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">'+
              '<i class="fas fa-boxes" style="color:var(--accent);margin-right:5px;"></i>Productos / Servicios '+
              '<span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:4px;">'+self.currentItems.length+'</span>'+
            '</div>'+
          '</div>'+
          '<div style="min-height:420px;">'+itemsArea+'</div>'+
          // Buscador de productos
          '<div style="padding:14px 20px;border-top:2px solid var(--gray-200);background:var(--gray-50);">'+
            '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">'+
              '<i class="fas fa-search" style="margin-right:5px;"></i>Buscar Producto'+
            '</div>'+
            '<div style="display:flex;gap:8px;">'+
              '<div style="flex:1;position:relative;">'+
                '<i class="fas fa-barcode" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:17px;"></i>'+
                '<input type="text" id="prodBuscadorComp" placeholder="Nombre, código o escanea con lector de barras..." '+
                  'style="width:100%;padding:12px 12px 12px 42px;border:2px solid var(--gray-200);border-radius:10px;font-size:14px;background:white;outline:none;box-sizing:border-box;" '+
                  'oninput="VentasModule.filtroBuscadorLive(this.value)" '+
                  'onkeydown="VentasModule.buscadorKeydown(event)"/>'+
              '</div>'+
              '<button onclick="VentasModule.abrirBuscadorProducto()" '+
                'style="padding:0 20px;background:var(--accent);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-size:13px;white-space:nowrap;">'+
                '<i class="fas fa-search" style="margin-right:5px;"></i>Buscar'+
              '</button>'+
            '</div>'+
          '</div>'+
        '</div>'+

        // ── SECCIÓN INFERIOR: Método de pago + Cobro + Resumen ──
        '<div class="card">'+
          '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">'+
            '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">'+
              '<i class="fas fa-credit-card" style="color:var(--accent);margin-right:5px;"></i>Método de Pago y Cobro'+
            '</div>'+
          '</div>'+
          '<div style="padding:20px;display:grid;grid-template-columns:1fr 400px;gap:24px;">'+

            // IZQUIERDA: métodos + monto + billetes + vuelto
            '<div>'+
              metodoBtnsBar+
              '<div style="margin-bottom:14px;">'+
                '<div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">MONTO RECIBIDO (S/)</div>'+
                '<input class="form-control" type="number" step="0.01" id="montoPagoComp" '+
                  'value="'+(self.montoPago>0?self.montoPago.toFixed(2):'')+'" placeholder="0.00" '+
                  'style="font-size:32px;text-align:center;font-weight:900;padding:16px;border:3px solid var(--gray-200);border-radius:12px;" '+
                  'oninput="VentasModule.montoPago=parseFloat(this.value)||0;VentasModule.updateVuelto()"/>'+
              '</div>'+
              '<div style="margin-bottom:14px;">'+
                '<div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">BILLETES RÁPIDOS</div>'+
                '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">'+
                [10,20,50,100,200].map(function(b){
                  return '<button onclick="document.getElementById(\'montoPagoComp\').value='+b+';VentasModule.montoPago='+b+';VentasModule.updateVuelto();" '+
                    'style="padding:12px 4px;border:2px solid var(--gray-200);border-radius:10px;'+
                    'background:white;font-size:15px;font-weight:800;cursor:pointer;color:var(--gray-700);">'+b+'</button>';
                }).join('')+
                '<button onclick="var t=VentasModule.getTotal();document.getElementById(\'montoPagoComp\').value=t.toFixed(2);VentasModule.montoPago=t;VentasModule.updateVuelto();" '+
                  'style="padding:12px 4px;border:2px solid var(--accent);border-radius:10px;background:#eff6ff;font-size:14px;font-weight:900;cursor:pointer;color:var(--accent);">Exacto</button>'+
                '</div>'+
              '</div>'+
              '<div id="vueltoDisplay" style="padding:18px;border-radius:12px;text-align:center;'+
                'background:'+vueltoBg+';color:'+vueltoClr+';font-weight:900;font-size:22px;'+
                'border:2px solid '+(vuelto>=0?'#86efac':'#fca5a5')+';">'+
                (vuelto>=0
                  ? '<i class="fas fa-check-circle" style="margin-right:8px;"></i>Vuelto: S/ '+vuelto.toFixed(2)
                  : '<i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>Falta: S/ '+Math.abs(vuelto).toFixed(2))+
              '</div>'+
            '</div>'+

            // DERECHA: Resumen GRANDE + botones
            '<div style="display:flex;flex-direction:column;gap:14px;">'+
              '<div style="background:var(--gray-50);border:2px solid var(--gray-200);border-radius:14px;padding:22px;flex:1;">'+
                '<div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;margin-bottom:18px;">RESUMEN DEL COMPROBANTE</div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'+
                  '<span style="font-size:17px;color:var(--gray-500);font-weight:600;">Subtotal (sin IGV):</span>'+
                  '<span style="font-size:22px;font-weight:900;color:var(--gray-800);">S/ '+subtotal.toFixed(2)+'</span>'+
                '</div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:18px;border-bottom:2px solid var(--gray-200);">'+
                  '<span style="font-size:17px;color:var(--gray-500);font-weight:600;">IGV (18%):</span>'+
                  '<span style="font-size:22px;font-weight:900;color:var(--gray-800);">S/ '+igv.toFixed(2)+'</span>'+
                '</div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center;'+
                  'padding:20px 22px;background:linear-gradient(135deg,#1e3a5f,#2563eb);'+
                  'border-radius:12px;color:white;">'+
                  '<span style="font-size:24px;font-weight:900;">TOTAL</span>'+
                  '<span style="font-size:40px;font-weight:900;letter-spacing:-1px;">S/ '+total.toFixed(2)+'</span>'+
                '</div>'+
              '</div>'+
              '<button onclick="VentasModule.procesar()" '+
                'style="width:100%;padding:20px;background:linear-gradient(135deg,#15803d,#16a34a);'+
                'color:white;border:none;border-radius:14px;font-size:19px;font-weight:900;cursor:pointer;'+
                'box-shadow:0 5px 18px rgba(22,163,74,0.45);'+
                'display:flex;align-items:center;justify-content:center;gap:10px;">'+
                '<i class="fas fa-check-circle" style="font-size:22px;"></i>PROCESAR VENTA'+
              '</button>'+
              '<button onclick="VentasModule.vistaPrevia()" '+
                'style="width:100%;padding:14px;background:var(--gray-100);color:var(--gray-600);border:none;'+
                'border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;'+
                'display:flex;align-items:center;justify-content:center;gap:8px;">'+
                '<i class="fas fa-eye"></i>Vista Previa del Ticket'+
              '</button>'+
            '</div>'+

          '</div>'+
        '</div>'+ // fin card inferior


      '</div>'  // fin columna única
    );
  },


  // ─────────────────────────────────────────────────────────
  // RENDER ITEMS LIST (reusable)
  // ─────────────────────────────────────────────────────────
  _renderItemsList() {
    var self = this;
    return this.currentItems.map(function(item, i) {
      var imgH = item.imagen
        ? '<img src="'+item.imagen+'" style="width:80px;height:80px;object-fit:cover;border-radius:12px;flex-shrink:0;border:2px solid var(--gray-200);box-shadow:0 3px 8px rgba(0,0,0,0.12);" alt=""/>'
        : '<div style="width:80px;height:80px;border-radius:12px;background:var(--gray-100);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;border:2px dashed var(--gray-300);"><i class="fas fa-image" style="font-size:24px;color:var(--gray-300);margin-bottom:3px;"></i><span style="font-size:9px;color:var(--gray-400);font-weight:700;">SIN FOTO</span></div>';
      var dctoAmt = item.precio * item.qty * (item.dcto||0) / 100;
      var hasDcto = (item.dcto||0) > 0;
      return (
        '<div style="display:flex;align-items:center;gap:12px;'+
          'background:white;border:1.5px solid var(--gray-200);border-radius:12px;'+
          'padding:12px 14px;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">' +
          // Número
          '<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;background:var(--accent);'+
            'display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;">'+(i+1)+'</div>' +
          // Imagen
          imgH +
          // Nombre + codigo
          '<div style="flex:1;min-width:0;">' +
            '<input type="text" value="'+item.nombre.replace(/"/g,'&quot;')+'" onchange="VentasModule.updateNombre('+i+',this.value)" ' +
              'style="width:100%;font-size:16px;font-weight:800;color:var(--gray-900);border:none;'+
              'border-bottom:2px solid var(--gray-200);padding:2px 0;background:transparent;outline:none;margin-bottom:5px;box-sizing:border-box;"/>' +
            '<div style="display:flex;gap:5px;">' +
              '<span style="background:var(--gray-100);color:var(--gray-600);font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;">'+item.codigo+'</span>' +
              '<span style="background:#eff6ff;color:#2563eb;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;">'+item.unidad+'</span>' +
            '</div>' +
          '</div>' +
          // Separador
          '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
          // Cantidad
          '<div style="text-align:center;flex-shrink:0;">' +
            '<div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">CANTIDAD</div>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<button onclick="VentasModule.updateQty('+i+','+(item.qty-1)+')" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-size:17px;font-weight:900;cursor:pointer;color:var(--gray-600);display:flex;align-items:center;justify-content:center;">−</button>' +
              '<input type="number" min="1" value="'+item.qty+'" onchange="VentasModule.updateQty('+i+',this.value)" style="width:48px;height:30px;border:1.5px solid var(--accent);border-radius:6px;text-align:center;font-weight:900;font-size:15px;color:var(--accent);"/>' +
              '<button onclick="VentasModule.updateQty('+i+','+(item.qty+1)+')" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-size:17px;font-weight:900;cursor:pointer;color:var(--gray-600);display:flex;align-items:center;justify-content:center;">+</button>' +
            '</div>' +
          '</div>' +
          // Separador
          '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
          // Precio
          '<div style="text-align:center;flex-shrink:0;min-width:100px;">' +
            '<div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">P. UNITARIO</div>' +
            '<div style="display:flex;align-items:center;gap:3px;">' +
              '<span style="font-size:12px;font-weight:700;color:var(--gray-400);">S/</span>' +
              '<input type="number" min="0" step="0.01" value="'+item.precio.toFixed(2)+'" onchange="VentasModule.updatePrecio('+i+',this.value)" style="width:75px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;padding:0 6px;font-size:15px;font-weight:800;color:var(--gray-800);text-align:center;"/>' +
            '</div>' +
          '</div>' +
          // Separador
          '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
          // Descuento
          '<div style="text-align:center;flex-shrink:0;min-width:90px;">' +
            '<div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">DESCUENTO</div>' +
            '<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px;">' +
              '<input type="number" min="0" max="100" step="0.01" value="'+(item.dcto||0)+'" onchange="VentasModule.updateDcto('+i+',this.value)" style="width:55px;height:30px;border:1.5px solid '+(hasDcto?'#16a34a':'var(--gray-200)')+';border-radius:6px;padding:0 4px;font-size:14px;font-weight:800;color:'+(hasDcto?'#16a34a':'var(--gray-700)')+';background:'+(hasDcto?'#f0fdf4':'white')+';text-align:center;"/>' +
              '<span style="font-size:13px;font-weight:700;color:var(--gray-400);">%</span>' +
            '</div>' +
            '<div style="font-size:11px;font-weight:700;color:'+(hasDcto?'#16a34a':'var(--gray-300)')+';">− S/ '+dctoAmt.toFixed(2)+'</div>' +
          '</div>' +
          // Separador
          '<div style="width:1px;height:70px;background:var(--gray-200);flex-shrink:0;"></div>' +
          // Total
          '<div style="text-align:center;flex-shrink:0;min-width:100px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:8px 10px;">' +
            '<div style="font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:5px;">TOTAL</div>' +
            '<div style="font-size:20px;font-weight:900;color:var(--accent);">S/ '+item.total.toFixed(2)+'</div>' +
            (hasDcto?'<div style="font-size:10px;color:#16a34a;font-weight:700;">Ahorro S/ '+dctoAmt.toFixed(2)+'</div>':'') +
          '</div>' +
          // Eliminar
          '<button onclick="VentasModule.removeItem('+i+')" style="width:36px;height:36px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas fa-trash"></i></button>' +
        '</div>'
      );
    }).join('');
  },

  // ─────────────────────────────────────────────────────────
  // HELPERS DEL COMPROBANTE
  // ─────────────────────────────────────────────────────────
  cambiarTipo(serie, nombre) {
    this.serieActual     = serie;
    this.tipoComprobante = nombre;
    App.renderPage();
  },

  setDescGlobal(val) {
    this.descGlobal = Math.min(100, Math.max(0, parseFloat(val)||0));
    // Aplicar descuento global a todos los items
    var self = this;
    this.currentItems.forEach(function(item) {
      item.dcto  = self.descGlobal;
      item.total = item.qty * item.precio * (1 - self.descGlobal/100);
    });
    this.updateVuelto();
  },

  updateVuelto() {
    var total  = this.getTotal();
    var vuelto = Math.max(0, this.montoPago - total);
    var el     = document.getElementById('vueltoDisplay');
    if (el) {
      if (this.montoPago > 0 && this.montoPago < total) {
        el.style.background = '#fef2f2'; el.style.color = '#dc2626';
        el.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Falta: S/ '+Math.abs(vuelto-(this.montoPago-total)).toFixed(2);
      } else {
        el.style.background = '#f0fdf4'; el.style.color = '#16a34a';
        el.innerHTML = '<i class="fas fa-check-circle"></i> Vuelto: S/ '+vuelto.toFixed(2);
      }
    }
  },

  updateQty(idx, val) {
    var qty = Math.max(1, parseInt(val)||1);
    this.currentItems[idx].qty   = qty;
    this.currentItems[idx].total = qty * this.currentItems[idx].precio * (1-(this.currentItems[idx].dcto||0)/100);
    App.renderPage();
  },

  updateDcto(idx, val) {
    var dcto = Math.min(100, Math.max(0, parseFloat(val)||0));
    this.currentItems[idx].dcto  = dcto;
    this.currentItems[idx].total = this.currentItems[idx].qty * this.currentItems[idx].precio * (1-dcto/100);
    App.renderPage();
  },

  updateNombre(idx, val) {
    if (!val || !val.trim()) return;
    this.currentItems[idx].nombre = val.trim();
    // No re-render to keep focus
  },

  updatePrecio(idx, val) {
    var precio = Math.max(0, parseFloat(val)||0);
    if (precio === 0) return;
    this.currentItems[idx].precio = precio;
    this.currentItems[idx].total  = this.currentItems[idx].qty * precio * (1-(this.currentItems[idx].dcto||0)/100);
    App.renderPage();
  },

  removeItem(idx) {
    this.currentItems.splice(idx,1);
    App.renderPage();
  },

  limpiarLista() {
    if (!this.currentItems.length || confirm('¿Limpiar todos los productos del ticket?')) {
      this.currentItems = [];
      this.descGlobal   = 0;
      App.renderPage();
    }
  },

  getTotal() {
    var dcto = this.descGlobal || 0;
    return this.currentItems.reduce(function(s,i){ return s+i.total; }, 0);
  },

  // ─────────────────────────────────────────────────────────
  // BUSCADOR LIVE DE PRODUCTOS (en el comprobante)
  // ─────────────────────────────────────────────────────────
  filtroBuscadorLive(term) {
    if (!term || term.length < 2) {
      if (this._searchResults !== null) {
        this._searchResults = null;
        App.renderPage();
        setTimeout(function(){
          var inp = document.getElementById('prodBuscadorComp');
          if (inp) { inp.focus(); }
        }, 30);
      }
      return;
    }
    var found = DB.productos.filter(function(p) {
      return p.nombre.toLowerCase().indexOf(term.toLowerCase()) >= 0 ||
             p.codigo.toLowerCase().indexOf(term.toLowerCase()) >= 0 ||
             (p.barcode && p.barcode.indexOf(term) >= 0);
    });
    this._searchResults = found;
    App.renderPage();
    setTimeout(function() {
      var inp = document.getElementById('prodBuscadorComp');
      if (inp) { inp.value = term; inp.focus(); try { inp.setSelectionRange(term.length, term.length); } catch(e) {} }
    }, 30);
  },

  agregarDesdeResultados(id) {
    this._searchResults = null;
    this.agregarProducto(id);
  },

  buscadorKeydown(e) {
    if (e.key === 'Enter') {
      var term = e.target.value.trim();
      if (!term) return;
      var exacto = DB.productos.find(function(p) {
        return p.codigo === term || (p.barcode && p.barcode === term);
      });
      if (exacto) {
        this._searchResults = null;
        this.agregarProducto(exacto.id);
        e.target.value = '';
        setTimeout(function(){ var inp=document.getElementById('prodBuscadorComp'); if(inp) inp.value=''; }, 50);
      } else {
        this.filtroBuscadorLive(term);
      }
    }
    if (e.key === 'Escape') {
      e.target.value = '';
      this._searchResults = null;
      App.renderPage();
      setTimeout(function(){ var inp=document.getElementById('prodBuscadorComp'); if(inp) { inp.value=''; inp.focus(); } }, 30);
    }
  },

  // ─────────────────────────────────────────────────────────
  // MODAL BUSCADOR COMPLETO
  // ─────────────────────────────────────────────────────────
  abrirBuscadorProducto(termInicial) {
    termInicial = termInicial || '';
    App.showModal('Buscar Producto',
      '<div class="search-bar mb-3" style="width:100%;">' +
        '<i class="fas fa-barcode"></i>' +
        '<input type="text" id="modalProdSearch" placeholder="Nombre, código o código de barras..." ' +
          'value="'+termInicial+'" oninput="VentasModule.filtrarProductosBusqueda(this.value)" autofocus/>' +
      '</div>' +
      '<div id="prodResultados" style="max-height:400px;overflow-y:auto;">' +
        this.renderProductosSearch(DB.productos, termInicial) +
      '</div>', []
    );
    document.getElementById('modalBox').style.maxWidth = '640px';
    setTimeout(function() {
      var inp = document.getElementById('modalProdSearch');
      if (inp) { inp.focus(); if (termInicial) inp.dispatchEvent(new Event('input')); }
    }, 100);
  },

  renderProductosSearch(prods, term) {
    var filtered = term
      ? prods.filter(function(p) {
          return p.nombre.toLowerCase().indexOf(term.toLowerCase()) >= 0 ||
                 p.codigo.toLowerCase().indexOf(term.toLowerCase()) >= 0;
        })
      : prods;
    if (!filtered.length) return '<div class="empty-state"><i class="fas fa-search"></i><p>Sin resultados</p></div>';
    return '<table class="data-table">' +
      '<thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th></th></tr></thead>' +
      '<tbody>' +
      filtered.map(function(p) {
        var imgHTML = p.imagen
          ? '<img src="'+p.imagen+'" style="width:40px;height:40px;object-fit:cover;border-radius:6px;" alt=""/>'
          : '<div style="width:40px;height:40px;border-radius:6px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:var(--gray-300);"></i></div>';
        return '<tr>' +
          '<td>' +
            '<div style="display:flex;align-items:center;gap:10px;">' + imgHTML +
              '<div>' +
                '<div style="font-weight:700;">' + p.nombre + '</div>' +
                '<div style="font-size:11px;color:var(--gray-400);">' + p.codigo + ' · ' + p.unidad + '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><strong>S/ '+p.precio_venta.toFixed(2)+'</strong></td>' +
          '<td>' + (p.stock>0 ?
            '<span style="color:#16a34a;font-weight:700;">'+p.stock+'</span>' :
            '<span style="color:#dc2626;font-weight:700;">Sin stock</span>') + '</td>' +
          '<td>' +
            '<button class="btn btn-primary btn-sm" onclick="VentasModule.agregarProducto('+p.id+')">' +
              '<i class="fas fa-plus"></i> Agregar' +
            '</button>' +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
  },

  filtrarProductosBusqueda(term) {
    var el = document.getElementById('prodResultados');
    if (el) el.innerHTML = this.renderProductosSearch(DB.productos, term);
  },

  agregarProducto(id) {
    var p = DB.productos.find(function(x){ return x.id===id; });
    if (!p) return;
    if (p.stock === 0) { App.toast('Producto sin stock', 'error'); return; }
    var existing = this.currentItems.findIndex(function(x){ return x.prod_id===id; });
    if (existing >= 0) {
      if (this.currentItems[existing].qty >= p.stock) { App.toast('Stock insuficiente', 'warning'); return; }
      this.currentItems[existing].qty++;
      this.currentItems[existing].total = this.currentItems[existing].qty * this.currentItems[existing].precio * (1-(this.currentItems[existing].dcto||0)/100);
    } else {
      this.currentItems.push({
        prod_id:p.id, codigo:p.codigo, nombre:p.nombre, imagen:p.imagen||'',
        unidad:p.unidad, precio:p.precio_venta, qty:1, dcto:this.descGlobal||0,
        total:p.precio_venta*(1-(this.descGlobal||0)/100)
      });
    }
    this._searchResults = null;
    App.toast(p.nombre + ' agregado ✓', 'success');
    App.closeModal();
    App.renderPage();
    // Limpiar buscador live
    setTimeout(function() {
      var inp = document.getElementById('prodBuscadorComp');
      var res = document.getElementById('liveResults');
      if (inp) inp.value = '';
      if (res) res.innerHTML = '';
    }, 50);
  },

  // ─────────────────────────────────────────────────────────
  // CLIENTE
  // ─────────────────────────────────────────────────────────
  seleccionarCliente() {
    App.showModal('Seleccionar Cliente',
      '<div class="search-bar mb-3" style="width:100%;">' +
        '<i class="fas fa-search"></i>' +
        '<input type="text" placeholder="Buscar por nombre o documento..." autofocus ' +
          'oninput="VentasModule.filtrarClientesBusqueda(this.value)"/>' +
      '</div>' +
      '<div id="clienteResultados" style="max-height:360px;overflow-y:auto;">' +
        this.renderClientesBusqueda(DB.clientes.filter(function(c){ return c.tipo_cliente==='cliente' || c.doc==='00000000'; })) +
      '</div>', []
    );
    document.getElementById('modalBox').style.maxWidth = '540px';
  },

  renderClientesBusqueda(clientes) {
    if (!clientes.length) return '<div class="empty-state"><i class="fas fa-user"></i><p>Sin resultados</p></div>';
    return '<table class="data-table"><thead><tr><th>Documento</th><th>Nombre</th><th></th></tr></thead><tbody>' +
      clientes.map(function(c) {
        return '<tr>' +
          '<td class="text-sm">' + c.tipo + ': ' + c.doc + '</td>' +
          '<td style="font-weight:700;">' + c.nombre + '</td>' +
          '<td><button class="btn btn-primary btn-sm" onclick="VentasModule.setCliente('+c.id+')">Seleccionar</button></td>' +
        '</tr>';
      }).join('') +
    '</tbody></table>';
  },

  filtrarClientesBusqueda(term) {
    var found = DB.clientes.filter(function(c) {
      return c.tipo_cliente==='cliente' && (
        c.nombre.toLowerCase().indexOf(term.toLowerCase()) >= 0 || c.doc.indexOf(term) >= 0);
    });
    var el = document.getElementById('clienteResultados');
    if (el) el.innerHTML = this.renderClientesBusqueda(found);
  },

  setCliente(id) {
    this.selectedCliente = DB.clientes.find(function(x){ return x.id===id; });
    App.closeModal();
    var inp = document.getElementById('cliSearch');
    if (inp && this.selectedCliente) inp.value = this.selectedCliente.doc + ' — ' + this.selectedCliente.nombre;
    App.toast('Cliente: ' + this.selectedCliente.nombre, 'info');
  },

  buscarCliente(event) {
    if (event.key !== 'Enter') return;
    var val   = event.target.value.trim();
    var found = DB.clientes.find(function(c){ return c.doc === val; });
    if (found) {
      this.selectedCliente = found;
      event.target.value   = found.doc + ' — ' + found.nombre;
      App.toast('Cliente: ' + found.nombre, 'info');
    } else {
      App.toast('No encontrado. Usa el botón para buscar o registra el cliente.', 'warning');
    }
  },

  // ─────────────────────────────────────────────────────────
  // PROCESAR VENTA
  // ─────────────────────────────────────────────────────────
  procesar() {
    if (!this.currentItems.length) { App.toast('Agrega al menos un producto', 'error'); return; }
    if (!this.selectedCliente) {
      var pub = DB.clientes.find(function(c){ return c.doc === '00000000'; });
      if (pub) { this.selectedCliente = pub; }
      else { App.toast('Selecciona un cliente', 'error'); return; }
    }
    var total = this.getTotal();
    if (this.metodoPago === 'EFECTIVO' && this.montoPago > 0 && this.montoPago < total) {
      App.toast('Monto insuficiente — faltan S/ ' + (total-this.montoPago).toFixed(2), 'error'); return;
    }
    var monto = this.montoPago > 0 ? this.montoPago : total;

    var ahora  = new Date();
    var fecha  = ahora.getFullYear()+'-'+String(ahora.getMonth()+1).padStart(2,'0')+'-'+String(ahora.getDate()).padStart(2,'0');
    var hora   = ahora.toTimeString().slice(0,8);
    var serie  = this.serieActual;
    var numero = DB.nextNumber(serie);
    var tipoCorto = serie.startsWith('BV') ? 'BOL' : serie.startsWith('FC') ? 'FAC' : 'N. VENTA';

    var venta = {
      id:               Date.now(),
      fecha:            fecha, hora: hora,
      serie:            serie, numero: numero,
      tipo:             tipoCorto,
      cliente_id:       this.selectedCliente.id,
      items:            this.currentItems.map(function(i) {
        return { prod_id:i.prod_id, nombre:i.nombre, qty:i.qty, precio:i.precio, total:i.total };
      }),
      subtotal:         total / 1.18,
      igv:              total - (total/1.18),
      total:            total,
      tc:               DB.empresa.tipoCambio || 3.467,
      moneda:           'SOLES',
      estado:           'NO_ENVIADO',
      tipo_comprobante: this.tipoComprobante,
      metodo_pago:      this.metodoPago,
      monto_pago:       monto,
      vuelto:           Math.max(0, monto - total)
    };

    // Descontar stock
    this.currentItems.forEach(function(item) {
      var pi = DB.productos.findIndex(function(p){ return p.id === item.prod_id; });
      if (pi >= 0) DB.productos[pi].stock = Math.max(0, DB.productos[pi].stock - item.qty);
    });

    DB.ventas.unshift(venta);
Storage.guardarVentas();
Storage.guardarProductos();
Storage.guardarSequences();
SupabaseDB.guardarVenta(venta);

    App.toast('✅ ' + serie + '-' + numero + ' procesado — Vuelto: S/ ' + venta.vuelto.toFixed(2), 'success');
    if (venta.tipo === 'BOL' || venta.tipo === 'FAC') {
      this.imprimirComprobante(venta);
    }

    // Reset
    this.currentItems    = [];
    this.montoPago       = 0;
    this.descGlobal      = 0;
    this.modoVista       = 'lista';
    App.renderPage();
  },

  // ─────────────────────────────────────────────────────────
  // VISTA PREVIA
  // ─────────────────────────────────────────────────────────
  vistaPrevia() {
    var total = this.getTotal();
    var serie = this.serieActual;
    var next  = DB._sequences[serie] ? String(DB._sequences[serie]).padStart(8,'0') : '00000001';
    App.showModal('👁️ Vista Previa del Comprobante',
      '<div style="font-family:monospace;font-size:13px;max-width:320px;margin:0 auto;">' +
        '<div style="text-align:center;font-weight:800;font-size:15px;">'+DB.empresa.nombre+'</div>' +
        '<div style="text-align:center;">RUC: '+DB.empresa.ruc+'</div>' +
        '<div style="text-align:center;font-size:11px;">'+DB.empresa.direccion+'</div>' +
        '<hr style="border:1px dashed var(--gray-300);"/>' +
        '<div style="text-align:center;font-weight:800;">'+this.tipoComprobante+'</div>' +
        '<div style="text-align:center;font-weight:800;">'+serie+' - '+next+'</div>' +
        '<hr style="border:1px dashed var(--gray-300);"/>' +
        '<div>Cliente: <strong>'+(this.selectedCliente?this.selectedCliente.nombre:'N/A')+'</strong></div>' +
        '<hr style="border:1px dashed var(--gray-300);"/>' +
        (this.currentItems.length === 0 ? '<div style="text-align:center;color:var(--gray-400);">Sin productos</div>' :
          this.currentItems.map(function(i) {
            return '<div style="display:flex;justify-content:space-between;">' +
              '<span>'+i.nombre+' ×'+i.qty+'</span><span>S/'+i.total.toFixed(2)+'</span></div>';
          }).join('')) +
        '<hr style="border:1px dashed var(--gray-300);"/>' +
        '<div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>S/'+(total/1.18).toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;"><span>IGV 18%:</span><span>S/'+(total-total/1.18).toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid #000;padding-top:4px;margin-top:4px;">' +
          '<span>TOTAL:</span><span>S/'+total.toFixed(2)+'</span></div>' +
      '</div>',
      [{ text:'✅ Procesar y Imprimir', cls:'btn-success', cb: function(){ App.closeModal(); VentasModule.procesar(); } }]
    );
    document.getElementById('modalBox').style.maxWidth = '400px';
  },

  // ─────────────────────────────────────────────────────────
  // IMPRIMIR TICKET
  // ─────────────────────────────────────────────────────────
  imprimirComprobante(venta) {
    var cli = DB.clientes.find(function(c){ return c.id === venta.cliente_id; });
    var w   = window.open('','_blank','width=380,height=650');
    if (!w) { App.toast('Activa ventanas emergentes para imprimir', 'warning'); return; }
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+venta.serie+'-'+venta.numero+'</title>' +
      '<style>body{font-family:"Courier New",monospace;font-size:12px;max-width:300px;margin:0 auto;padding:12px;}' +
      '.c{text-align:center;}.b{font-weight:bold;}.big{font-size:16px;}.xl{font-size:22px;}' +
      'hr{border:none;border-top:1px dashed #000;margin:8px 0;}' +
      'table{width:100%;border-collapse:collapse;}th{border-bottom:1px solid #000;padding:3px 0;font-size:11px;}' +
      'td{font-size:11px;padding:2px 0;}.r{text-align:right;}' +
      '.total-box{border:2px solid #000;padding:8px;text-align:center;margin:8px 0;border-radius:4px;}</style>' +
      '</head><body>' +
      '<div class="c b" style="font-size:14px;">'+DB.empresa.nombre+'</div>' +
      '<div class="c">RUC: '+DB.empresa.ruc+'</div>' +
      '<div class="c" style="font-size:10px;">'+DB.empresa.direccion+'</div>' +
      '<hr/>' +
      '<div class="c b big">'+venta.tipo_comprobante+'</div>' +
      '<div class="c b">'+venta.serie+' - '+venta.numero+'</div>' +
      '<hr/>' +
      '<div>Fecha: <b>'+venta.fecha+' '+venta.hora+'</b></div>' +
      '<div>Cliente: <b>'+(cli?cli.nombre:'PÚBLICO EN GENERAL')+'</b></div>' +
      (cli && cli.doc !== '00000000' ? '<div>'+cli.tipo+': '+cli.doc+'</div>' : '') +
      '<hr/>' +
      '<table><thead><tr><th style="text-align:left;">Producto</th><th>Cant</th><th class="r">P.Unit</th><th class="r">Total</th></tr></thead><tbody>' +
      venta.items.map(function(i) {
        return '<tr><td>'+i.nombre+'</td><td style="text-align:center;">'+i.qty+'</td>' +
          '<td class="r">S/'+i.precio.toFixed(2)+'</td><td class="r">S/'+i.total.toFixed(2)+'</td></tr>';
      }).join('') +
      '</tbody></table><hr/>' +
      '<div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>S/ '+venta.subtotal.toFixed(2)+'</span></div>' +
      '<div style="display:flex;justify-content:space-between;"><span>IGV (18%):</span><span>S/ '+venta.igv.toFixed(2)+'</span></div>' +
      '<div class="total-box"><div class="b">TOTAL A PAGAR</div><div class="xl b">S/ '+venta.total.toFixed(2)+'</div></div>' +
      '<hr/>' +
      '<div style="display:flex;justify-content:space-between;"><span>Método:</span><span><b>'+venta.metodo_pago+'</b></span></div>' +
      '<div style="display:flex;justify-content:space-between;"><span>Recibido:</span><span>S/ '+venta.monto_pago.toFixed(2)+'</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-weight:bold;"><span>VUELTO:</span><span>S/ '+venta.vuelto.toFixed(2)+'</span></div>' +
      '<hr/><div class="c b" style="font-size:14px;">¡GRACIAS POR SU COMPRA!</div>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(function(){ w.print(); }, 250);
  },

  // ─────────────────────────────────────────────────────────
  // VER DETALLE DE VENTA
  // ─────────────────────────────────────────────────────────
  verDetalle(id) {
    var v = DB.ventas.find(function(x){ return Number(x.id)===Number(id); });
    if (!v) return;
    var cli = DB.clientes.find(function(c){ return c.id===v.cliente_id; });
    var estBg  = v.estado==='ACEPTADO'?'#dcfce7':v.estado==='ANULADO'?'#fee2e2':'#fef3c7';
    var estClr = v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706';

    App.showModal('Detalle: '+v.serie+'-'+v.numero,
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<div>' +
          '<div style="font-size:18px;font-weight:900;">'+v.tipo_comprobante+'</div>' +
          '<div style="font-size:14px;color:var(--accent);font-weight:700;">'+v.serie+' — '+v.numero+'</div>' +
          '<div style="font-size:12px;color:var(--gray-500);">'+v.fecha+' '+v.hora+'</div>' +
        '</div>' +
        '<span style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:800;background:'+estBg+';color:'+estClr+';">'+v.estado+'</span>' +
      '</div>' +
      '<div style="background:var(--gray-50);padding:12px;border-radius:8px;margin-bottom:14px;">' +
        '<div style="font-size:13px;font-weight:800;color:var(--gray-700);">'+(cli?cli.nombre:'N/A')+'</div>' +
        '<div style="font-size:12px;color:var(--gray-500);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div>' +
      '</div>' +
      '<table class="data-table"><thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead><tbody>' +
      v.items.map(function(i) {
        return '<tr><td>'+i.nombre+'</td><td>'+i.qty+'</td><td>S/ '+i.precio.toFixed(2)+'</td><td><strong>S/ '+i.total.toFixed(2)+'</strong></td></tr>';
      }).join('') +
      '</tbody></table>' +
      '<div style="margin-top:14px;border-top:1px solid var(--gray-200);padding-top:14px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">' +
          '<span>Subtotal (sin IGV):</span><span>S/ '+v.subtotal.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;">' +
          '<span>IGV 18%:</span><span>S/ '+v.igv.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;' +
          'background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:12px;border-radius:10px;">' +
          '<span>TOTAL:</span><span>S/ '+v.total.toFixed(2)+'</span></div>' +
        '<div style="margin-top:10px;font-size:13px;color:var(--gray-600);">' +
          '<div>Método de pago: <strong>'+v.metodo_pago+'</strong></div>' +
          '<div>Monto recibido: <strong>S/ '+v.monto_pago.toFixed(2)+'</strong></div>' +
          '<div style="color:#16a34a;font-weight:700;">Vuelto: S/ '+v.vuelto.toFixed(2)+'</div>' +
        '</div>' +
      '</div>',
      [
        { text:'🖨️ Imprimir', cls:'btn-primary', cb: function(){ VentasModule.imprimirComprobante(v); App.closeModal(); } },
        { text:'📩 Enviar SUNAT', cls:'btn-outline', cb: function(){ App.closeModal(); VentasModule.enviarSunat(v.id); } },
      ]
    );
    document.getElementById('modalBox').style.maxWidth = '560px';
  },

  // ─────────────────────────────────────────────────────────
  // ACCIONES DE LISTA
  // ─────────────────────────────────────────────────────────
  imprimir(id) {
    var v = DB.ventas.find(function(x){ return Number(x.id)===Number(id); });
    if (v) this.imprimirComprobante(v);
  },

  enviarSunat(id) {
    var self = this;
    App.toast('Enviando a SUNAT...', 'info');
    setTimeout(function() {
      var i = DB.ventas.findIndex(function(x){ return Number(x.id)===Number(id); });
      if (i >= 0) { DB.ventas[i].estado = 'ACEPTADO'; Storage.guardarVentas(); }
      App.toast('✅ Comprobante aceptado por SUNAT', 'success');
      App.renderPage();
    }, 1500);
  },

  anular(id) {
    if (confirm('¿Anular este comprobante?\nEsta acción no se puede deshacer.')) {
      var i = DB.ventas.findIndex(function(x){ return Number(x.id)===Number(id); });
      if (i >= 0) {
        DB.ventas[i].estado = 'ANULADO';
        // Devolver stock
        var venta = DB.ventas[i];
        venta.items.forEach(function(item) {
          var pi = DB.productos.findIndex(function(p){ return p.id===item.prod_id; });
          if (pi >= 0) DB.productos[pi].stock += item.qty;
        });
        Storage.guardarVentas();
        Storage.guardarProductos();
      }
      App.toast('Comprobante anulado', 'warning');
      App.renderPage();
    }
  },

  exportarVentas() {
    var filtered = this.getFiltered();
    var header   = 'Fecha,Hora,Serie,Numero,Tipo,Cliente,Total,Estado,Metodo Pago\n';
    var rows     = filtered.map(function(v) {
      var cli = DB.clientes.find(function(c){ return c.id===v.cliente_id; });
      return v.fecha+','+v.hora+','+v.serie+','+v.numero+','+v.tipo+
        ',"'+(cli?cli.nombre:'')+'",'+ v.total.toFixed(2)+','+v.estado+','+v.metodo_pago;
    }).join('\n');
    var a  = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+header+rows], { type:'text/csv;charset=utf-8;' }));
    a.download = 'ventas_jumila_'+this._fechaLocal()+'.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast(filtered.length+' ventas exportadas', 'success');
  },

  getFiltered() {
    var self = this;
    return DB.ventas.filter(function(v) {
      var matchTipo   = self.tipoFilter === 'todos' || v.tipo === self.tipoFilter;
      var matchSearch = !self.searchTerm || v.numero.indexOf(self.searchTerm) >= 0 ||
        v.serie.indexOf(self.searchTerm) >= 0 ||
        (DB.clientes.find(function(c){ return c.id===v.cliente_id; }) || {}).nombre
          .toLowerCase().indexOf(self.searchTerm.toLowerCase()) >= 0;
      var matchFecha = (!self.fechaInicio || v.fecha >= self.fechaInicio) &&
                       (!self.fechaFin    || v.fecha <= self.fechaFin);
      return matchTipo && matchSearch && matchFecha;
    });
  },

  limpiarFiltros() {
    this.searchTerm  = '';
    this.tipoFilter  = 'todos';
    this.fechaInicio = '';
    this.fechaFin    = '';
    this.currentPage = 1;
    App.renderPage();
  },

  formatFecha(f) {
    if (!f) return '';
    var parts = f.split('-');
    return parts[2]+'/'+parts[1]+'/'+parts[0];
  },

  toggleMenu(id) {
    document.querySelectorAll('.action-menu').forEach(function(m) {
      if (m.id !== 'menu-venta-'+id) m.classList.add('hidden');
    });
    var el = document.getElementById('menu-venta-'+id);
    if (el) el.classList.toggle('hidden');
  }
};
