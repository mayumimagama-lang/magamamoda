// ============================================================
// MÓDULO: TICKETS — Lista + Configuración profesional
// ============================================================

const CuentaCorrienteModule = {

  // ── Estado ──
  tabActiva:      'lista',
  searchTerm:     '',
  tipoFilter:     'todos',
  estadoFilter:   'todos',
  fechaInicio:    '',
  fechaFin:       '',
  currentPage:    1,
  itemsPerPage:   15,
  ticketEditando: null,

  // ── Config ticket (se carga de localStorage) ──
  cfg: null,

  _getCfg() {
    if (!this.cfg) {
      var saved = localStorage.getItem('erp_jumila_ticket_cfg');
      this.cfg = saved ? JSON.parse(saved) : {
        logo:           '',
        nombre:         DB.empresa.nombre,
        ruc:            DB.empresa.ruc,
        direccion:      DB.empresa.direccion,
        telefono:       '',
        email:          '',
        web:            '',
        mensaje:        '¡Gracias por su preferencia!',
        mensaje2:       'Vuelva pronto',
        tamano:         '80mm',
        mostrarLogo:    true,
        mostrarRuc:     true,
        mostrarDir:     true,
        mostrarTel:     true,
        mostrarEmail:   false,
        mostrarWeb:     false,
        mostrarBarcode: false,
        mostrarIGV:     true,
        fuenteSize:     '12',
        colorHeader:    '#1e3a5f',
        colorTotal:     '#2563eb',
      };
    }
    return this.cfg;
  },

  _saveCfg() {
    localStorage.setItem('erp_jumila_ticket_cfg', JSON.stringify(this.cfg));
    DB.empresa.nombre    = this.cfg.nombre;
    DB.empresa.ruc       = this.cfg.ruc;
    DB.empresa.direccion = this.cfg.direccion;
    Storage.guardarEmpresa();
  },

  // ─────────────────────────────────────────
  render() {
    App.setTabs2('Tickets', 'TICKETS');
    this._getCfg();
    if (this.ticketEditando !== null) return this.renderEditarTicket();
    if (this.tabActiva === 'config') return this.renderConfig();
    return this.renderLista();
  },

  _fechaLocal() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },

  // ─────────────────────────────────────────
  // HEADER DE PESTAÑAS
  // ─────────────────────────────────────────
  _tabHeader() {
    var tabs = [
      { key:'lista',  icon:'fa-ticket-alt', label:'Lista de Tickets' },
      { key:'config', icon:'fa-cog',        label:'Configurar Ticket' },
    ];
    return '<div style="display:flex;gap:4px;margin-bottom:16px;background:var(--gray-100);padding:5px;border-radius:12px;width:fit-content;">' +
      tabs.map(function(t) {
        var activo = CuentaCorrienteModule.tabActiva === t.key;
        return '<button onclick="CuentaCorrienteModule.tabActiva=\''+t.key+'\';App.renderPage();" ' +
          'style="padding:10px 22px;border-radius:9px;border:none;cursor:pointer;font-size:14px;font-weight:800;' +
          'transition:all 0.15s;background:'+(activo?'white':'transparent')+';' +
          'color:'+(activo?'var(--accent)':'var(--gray-500)')+';' +
          'box-shadow:'+(activo?'0 2px 8px rgba(0,0,0,0.12)':'none')+';">' +
          '<i class="fas '+t.icon+'" style="margin-right:7px;"></i>'+t.label +
        '</button>';
      }).join('') +
    '</div>';
  },

  // ─────────────────────────────────────────
  // LISTA DE TICKETS
  // ─────────────────────────────────────────
  renderLista() {
    var self     = this;
    var hoy      = this._fechaLocal();
    if (!this.fechaInicio) this.fechaInicio = hoy.slice(0,8)+'01';
    if (!this.fechaFin)    this.fechaFin    = hoy;
    var filtered = this.getFiltered();
    var totalPgs = Math.max(1, Math.ceil(filtered.length/this.itemsPerPage));
    var paged    = filtered.slice((this.currentPage-1)*this.itemsPerPage, this.currentPage*this.itemsPerPage);
    var totalVtas= filtered.reduce(function(s,v){return s+v.total;},0);

    var kpis = [
      {icon:'fa-ticket-alt',   bg:'#eff6ff',clr:'#2563eb',val:filtered.length,                                                          label:'Total Tickets'},
      {icon:'fa-check-circle', bg:'#f0fdf4',clr:'#16a34a',val:filtered.filter(function(v){return v.estado==='ACEPTADO';}).length,        label:'Aceptados'},
      {icon:'fa-clock',        bg:'#fffbeb',clr:'#d97706',val:filtered.filter(function(v){return v.estado==='NO_ENVIADO';}).length,      label:'Por enviar'},
      {icon:'fa-ban',          bg:'#fef2f2',clr:'#dc2626',val:filtered.filter(function(v){return v.estado==='ANULADO';}).length,         label:'Anulados'},
      {icon:'fa-dollar-sign',  bg:'#f0fdf4',clr:'#16a34a',val:'S/ '+totalVtas.toFixed(2),                                               label:'Total Periodo'},
    ];

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-ticket-alt" style="color:var(--accent);margin-right:8px;"></i>Tickets / Comprobantes</h2>' +
          '<p class="text-muted text-sm">'+filtered.length+' tickets · <strong style="color:var(--success);">S/ '+totalVtas.toFixed(2)+'</strong></p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-outline" onclick="CuentaCorrienteModule.exportarCSV()"><i class="fas fa-file-download"></i> Exportar</button>' +
          '<button class="btn btn-success" onclick="VentasModule.nuevaVenta();App.navigate(\'ventas\');"><i class="fas fa-plus"></i> Nuevo Ticket</button>' +
        '</div>' +
      '</div>' +
      this._tabHeader() +
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
      kpis.map(function(k){
        return '<div class="stat-card">' +
          '<div class="stat-icon" style="background:'+k.bg+';color:'+k.clr+'"><i class="fas '+k.icon+'"></i></div>' +
          '<div class="stat-info"><div class="stat-value">'+k.val+'</div><div class="stat-label">'+k.label+'</div></div>' +
        '</div>';
      }).join('') +
      '</div>' +
      '<div class="card">' +
        '<div class="card-body" style="padding-bottom:0;">' +
          '<div class="filter-row mb-3" style="flex-wrap:wrap;gap:10px;">' +
            '<div class="filter-group"><label>DESDE</label><input type="date" class="filter-input" value="'+this.fechaInicio+'" onchange="CuentaCorrienteModule.fechaInicio=this.value;App.renderPage()"/></div>' +
            '<div class="filter-group"><label>HASTA</label><input type="date" class="filter-input" value="'+this.fechaFin+'" onchange="CuentaCorrienteModule.fechaFin=this.value;App.renderPage()"/></div>' +
            '<div class="filter-group"><label>TIPO</label>' +
              '<select class="filter-select" onchange="CuentaCorrienteModule.tipoFilter=this.value;CuentaCorrienteModule.currentPage=1;App.renderPage()">' +
                '<option value="todos" '+(this.tipoFilter==='todos'?'selected':'')+'>Todos</option>' +
                '<option value="N. VENTA" '+(this.tipoFilter==='N. VENTA'?'selected':'')+'>Nota de Venta</option>' +
                '<option value="BOL" '+(this.tipoFilter==='BOL'?'selected':'')+'>Boleta</option>' +
                '<option value="FAC" '+(this.tipoFilter==='FAC'?'selected':'')+'>Factura</option>' +
              '</select></div>' +
            '<div class="filter-group"><label>ESTADO</label>' +
              '<select class="filter-select" onchange="CuentaCorrienteModule.estadoFilter=this.value;CuentaCorrienteModule.currentPage=1;App.renderPage()">' +
                '<option value="todos" '+(this.estadoFilter==='todos'?'selected':'')+'>Todos</option>' +
                '<option value="NO_ENVIADO" '+(this.estadoFilter==='NO_ENVIADO'?'selected':'')+'>Por enviar</option>' +
                '<option value="ACEPTADO" '+(this.estadoFilter==='ACEPTADO'?'selected':'')+'>Aceptados</option>' +
                '<option value="ANULADO" '+(this.estadoFilter==='ANULADO'?'selected':'')+'>Anulados</option>' +
              '</select></div>' +
            '<div class="search-bar" style="flex:1;min-width:200px;align-self:flex-end;">' +
              '<i class="fas fa-search"></i>' +
              '<input type="text" placeholder="Buscar por N°, cliente, producto..." value="'+this.searchTerm+'" ' +
                'oninput="CuentaCorrienteModule.searchTerm=this.value;App.renderPage()"/></div>' +
            '<button class="btn btn-outline btn-sm" style="align-self:flex-end;" onclick="CuentaCorrienteModule.limpiarFiltros()"><i class="fas fa-times"></i> Limpiar</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrapper">' +
          '<table class="data-table">' +
            '<thead><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Productos</th><th>Método</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>' +
            '<tbody>' +
            (paged.length===0
              ? '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No hay tickets en este periodo</p></div></td></tr>'
              : paged.map(function(v){
                  var cli  = DB.clientes.find(function(c){return c.id===v.cliente_id;});
                  var tClr = v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
                  var eBg  = v.estado==='ACEPTADO'?'#dcfce7':v.estado==='ANULADO'?'#fee2e2':'#fef3c7';
                  var eClr = v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706';
                  var eLabel = v.estado==='ACEPTADO'?'✓ Aceptado':v.estado==='ANULADO'?'✗ Anulado':'⏳ Por enviar';
                  var prod = v.items.slice(0,2).map(function(i){return i.nombre;}).join(', ')+(v.items.length>2?' +'+(v.items.length-2)+' más':'');
                  return '<tr>' +
                    '<td><strong>'+self.formatFecha(v.fecha)+'</strong><div style="font-size:11px;color:var(--gray-400);">'+v.hora+'</div></td>' +
                    '<td><span style="color:'+tClr+';font-weight:800;font-size:11px;background:'+tClr+'18;padding:2px 7px;border-radius:4px;margin-right:4px;">'+v.tipo+'</span><span style="font-weight:700;color:'+tClr+';">'+v.serie+'-'+v.numero+'</span></td>' +
                    '<td><div style="font-weight:700;font-size:13px;">'+(cli?cli.nombre:'N/A')+'</div><div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div></td>' +
                    '<td><div style="font-size:12px;">'+prod+'</div><div style="font-size:11px;color:var(--gray-400);">'+v.items.length+' producto(s)</div></td>' +
                    '<td><span style="font-size:12px;font-weight:600;">'+v.metodo_pago+'</span></td>' +
                    '<td><strong style="font-size:16px;">S/ '+v.total.toFixed(2)+'</strong></td>' +
                    '<td><span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+eBg+';color:'+eClr+';">'+eLabel+'</span></td>' +
                    '<td>' +
                      '<div class="action-menu-wrapper">' +
                        '<button class="action-menu-btn" onclick="CuentaCorrienteModule.toggleMenu('+v.id+')"><i class="fas fa-ellipsis-v"></i></button>' +
                        '<div class="action-menu hidden" id="menu-ticket-'+v.id+'">' +
                          '<button class="action-menu-item" onclick="CuentaCorrienteModule.verDetalle('+v.id+')"><i class="fas fa-eye"></i> Ver detalle</button>' +
                          (v.estado!=='ANULADO'?'<button class="action-menu-item" onclick="CuentaCorrienteModule.editarTicket('+v.id+')"><i class="fas fa-edit"></i> Editar ticket</button>':'') +
                          '<button class="action-menu-item" onclick="CuentaCorrienteModule.imprimirTicket('+v.id+')"><i class="fas fa-print"></i> Imprimir</button>' +
                          (v.estado==='NO_ENVIADO'?'<button class="action-menu-item" onclick="CuentaCorrienteModule.enviarSunat('+v.id+')"><i class="fas fa-paper-plane"></i> Enviar SUNAT</button>':'') +
                          (v.estado!=='ANULADO'?'<div style="border-top:1px solid var(--gray-200);margin:4px 0;"></div><button class="action-menu-item danger" onclick="CuentaCorrienteModule.anularTicket('+v.id+')"><i class="fas fa-ban"></i> Anular</button>':'') +
                        '</div>' +
                      '</div>' +
                    '</td>' +
                  '</tr>';
                }).join('')
            ) +
            '</tbody></table>' +
        '</div>' +
        '<div class="pagination">' +
          '<span class="text-sm text-muted">'+Math.min((this.currentPage-1)*this.itemsPerPage+1,filtered.length)+'–'+Math.min(this.currentPage*this.itemsPerPage,filtered.length)+' de '+filtered.length+'</span>' +
          '<button class="pagination-btn" onclick="CuentaCorrienteModule.currentPage=1;App.renderPage()" '+(this.currentPage===1?'disabled':'')+'><i class="fas fa-angle-double-left"></i></button>' +
          '<button class="pagination-btn" onclick="CuentaCorrienteModule.currentPage--;App.renderPage()" '+(this.currentPage===1?'disabled':'')+'><i class="fas fa-chevron-left"></i></button>' +
          '<button class="pagination-btn" onclick="CuentaCorrienteModule.currentPage++;App.renderPage()" '+(this.currentPage===totalPgs?'disabled':'')+'><i class="fas fa-chevron-right"></i></button>' +
          '<button class="pagination-btn" onclick="CuentaCorrienteModule.currentPage='+totalPgs+';App.renderPage()" '+(this.currentPage===totalPgs?'disabled':'')+'><i class="fas fa-angle-double-right"></i></button>' +
        '</div>' +
      '</div>'
    );
  },

  // ─────────────────────────────────────────
  // CONFIGURACIÓN DEL TICKET
  // ─────────────────────────────────────────
  renderConfig() {
    var cfg  = this._getCfg();
    var preview = this._generarPreview(cfg);

    var campo = function(id, label, valor, tipo, placeholder) {
      tipo = tipo || 'text';
      return '<div style="margin-bottom:14px;">' +
        '<label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">'+label+'</label>' +
        '<input type="'+tipo+'" id="cfg_'+id+'" value="'+(valor||'')+'" placeholder="'+(placeholder||'')+'" ' +
          'onchange="CuentaCorrienteModule._actualizarCfg()" ' +
          'style="width:100%;padding:10px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:14px;' +
          'background:var(--gray-50);color:var(--gray-900);box-sizing:border-box;outline:none;"/>' +
      '</div>';
    };

    var toggle = function(id, label, valor) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100);">' +
        '<span style="font-size:14px;font-weight:600;color:var(--gray-700);">'+label+'</span>' +
        '<label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">' +
          '<input type="checkbox" id="cfg_'+id+'" '+(valor?'checked':'')+' onchange="CuentaCorrienteModule._actualizarCfg()" ' +
            'style="opacity:0;width:0;height:0;"/>' +
          '<span style="position:absolute;inset:0;border-radius:24px;transition:0.3s;background:'+(valor?'var(--accent)':'var(--gray-300)')+';">' +
            '<span style="position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;' +
              'left:'+(valor?'23px':'3px')+';transition:0.3s;"></span>' +
          '</span>' +
        '</label>' +
      '</div>';
    };

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-ticket-alt" style="color:var(--accent);margin-right:8px;"></i>Tickets / Comprobantes</h2>' +
          '<p class="text-muted text-sm">Personaliza el diseño y la información de tus tickets de venta</p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-success" onclick="CuentaCorrienteModule.guardarConfig()">' +
            '<i class="fas fa-save"></i> Guardar Configuración' +
          '</button>' +
        '</div>' +
      '</div>' +
      this._tabHeader() +
      '<div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;">' +

          // Logo
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-image" style="color:var(--accent);margin-right:5px;"></i>Logo de la Empresa</div></div>' +
            '<div style="padding:18px 20px;display:flex;align-items:center;gap:20px;">' +
              '<div id="logoPreviewWrap" onclick="document.getElementById(\'cfg_logo_file\').click()" ' +
                'style="width:120px;height:120px;border-radius:12px;border:2px dashed var(--gray-300);' +
                'display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;' +
                'background:var(--gray-50);flex-shrink:0;transition:border-color 0.2s;" ' +
                'onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--gray-300)\'">' +
                (cfg.logo
                  ? '<img src="'+cfg.logo+'" style="width:100%;height:100%;object-fit:contain;" alt="logo"/>'
                  : '<div style="text-align:center;color:var(--gray-400);pointer-events:none;"><i class="fas fa-building" style="font-size:36px;display:block;margin-bottom:8px;opacity:0.4;"></i><span style="font-size:12px;font-weight:700;">Tu Logo</span></div>'
                ) +
              '</div>' +
              '<div style="flex:1;">' +
                '<input type="file" id="cfg_logo_file" accept="image/*" style="display:none;" onchange="CuentaCorrienteModule._subirLogo(this)"/>' +
                '<button onclick="document.getElementById(\'cfg_logo_file\').click()" class="btn btn-primary" style="width:100%;margin-bottom:8px;"><i class="fas fa-upload"></i> Subir Logo</button>' +
                (cfg.logo ? '<button onclick="CuentaCorrienteModule._quitarLogo()" class="btn btn-outline" style="width:100%;margin-bottom:8px;color:var(--danger);border-color:var(--danger);"><i class="fas fa-trash"></i> Quitar Logo</button>' : '') +
                '<p style="font-size:11px;color:var(--gray-400);line-height:1.5;">PNG, JPG o WebP · Máx. 2 MB<br/>Recomendado: fondo transparente (PNG), 300×300 px</p>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Información empresa
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-store" style="color:var(--accent);margin-right:5px;"></i>Información de la Empresa</div></div>' +
            '<div style="padding:18px 20px;">' +
              campo('nombre',   'Nombre de la empresa *', cfg.nombre,    'text',  'JUMILA IMPORTACIONES') +
              campo('ruc',      'RUC *',                   cfg.ruc,       'text',  '20123456789') +
              campo('direccion','Dirección',                cfg.direccion, 'text',  'Jr. Ejemplo 123, Huánuco') +
              campo('telefono', 'Teléfono / Celular',       cfg.telefono,  'text',  '062-512345 / 987654321') +
              campo('email',    'Correo electrónico',       cfg.email,     'email', 'ventas@jumila.com') +
              campo('web',      'Sitio web',                cfg.web,       'text',  'www.jumila.com') +
            '</div>' +
          '</div>' +

          // Mensajes
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-comment" style="color:var(--accent);margin-right:5px;"></i>Mensajes y Pie de Ticket</div></div>' +
            '<div style="padding:18px 20px;">' +
              campo('mensaje',  'Mensaje de agradecimiento', cfg.mensaje,  'text', '¡Gracias por su preferencia!') +
              campo('mensaje2', 'Segundo mensaje (opcional)', cfg.mensaje2, 'text', 'Vuelva pronto') +
            '</div>' +
          '</div>' +

          // Formato
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-ruler" style="color:var(--accent);margin-right:5px;"></i>Formato del Ticket</div></div>' +
            '<div style="padding:18px 20px;">' +
              '<div style="margin-bottom:16px;">' +
                '<label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">TAMAÑO DE PAPEL</label>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
                [{val:'58mm',icon:'fa-mobile-alt',label:'58 mm',sub:'Ticket pequeño'},
                 {val:'80mm',icon:'fa-receipt',   label:'80 mm',sub:'Ticket estándar'},
                 {val:'A4',  icon:'fa-file-alt',  label:'A4',   sub:'Hoja completa'}
                ].map(function(t){
                  var a = cfg.tamano===t.val;
                  return '<button onclick="CuentaCorrienteModule.cfg.tamano=\''+t.val+'\';CuentaCorrienteModule._actualizarPreview();" ' +
                    'style="padding:12px 8px;border-radius:10px;border:2px solid '+(a?'var(--accent)':'var(--gray-200)')+';' +
                    'background:'+(a?'#eff6ff':'white')+';cursor:pointer;text-align:center;">' +
                    '<i class="fas '+t.icon+'" style="font-size:22px;color:'+(a?'var(--accent)':'var(--gray-400)')+';display:block;margin-bottom:5px;"></i>' +
                    '<div style="font-size:13px;font-weight:800;color:'+(a?'var(--accent)':'var(--gray-700)')+'">'+t.label+'</div>' +
                    '<div style="font-size:11px;color:var(--gray-400);">'+t.sub+'</div>' +
                  '</button>';
                }).join('') +
                '</div>' +
              '</div>' +
              '<div style="margin-bottom:16px;">' +
                '<label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">TAMAÑO DE FUENTE</label>' +
                '<div style="display:flex;gap:8px;">' +
                [{val:'11',label:'Pequeño'},{val:'12',label:'Normal'},{val:'13',label:'Grande'},{val:'14',label:'Muy grande'}
                ].map(function(f){
                  var a = cfg.fuenteSize===f.val;
                  return '<button onclick="CuentaCorrienteModule.cfg.fuenteSize=\''+f.val+'\';CuentaCorrienteModule._actualizarPreview();" ' +
                    'style="flex:1;padding:10px;border-radius:8px;border:2px solid '+(a?'var(--accent)':'var(--gray-200)')+';' +
                    'background:'+(a?'#eff6ff':'white')+';cursor:pointer;font-size:12px;font-weight:700;color:'+(a?'var(--accent)':'var(--gray-600)')+';">'+f.label+'</button>';
                }).join('') +
                '</div>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
                '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">COLOR ENCABEZADO</label>' +
                  '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<input type="color" id="cfg_colorHeader" value="'+cfg.colorHeader+'" onchange="CuentaCorrienteModule._actualizarCfg()" style="width:44px;height:44px;border:none;border-radius:8px;cursor:pointer;"/>' +
                    '<span id="cfg_colorHeader_val" style="font-size:13px;font-weight:700;color:var(--gray-600);">'+cfg.colorHeader+'</span>' +
                  '</div></div>' +
                '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">COLOR TOTAL</label>' +
                  '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<input type="color" id="cfg_colorTotal" value="'+cfg.colorTotal+'" onchange="CuentaCorrienteModule._actualizarCfg()" style="width:44px;height:44px;border:none;border-radius:8px;cursor:pointer;"/>' +
                    '<span id="cfg_colorTotal_val" style="font-size:13px;font-weight:700;color:var(--gray-600);">'+cfg.colorTotal+'</span>' +
                  '</div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Qué mostrar
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-eye" style="color:var(--accent);margin-right:5px;"></i>¿Qué mostrar en el ticket?</div></div>' +
            '<div style="padding:12px 20px;">' +
              toggle('mostrarLogo',    'Mostrar logo',             cfg.mostrarLogo) +
              toggle('mostrarRuc',     'Mostrar RUC',              cfg.mostrarRuc) +
              toggle('mostrarDir',     'Mostrar dirección',        cfg.mostrarDir) +
              toggle('mostrarTel',     'Mostrar teléfono',         cfg.mostrarTel) +
              toggle('mostrarEmail',   'Mostrar email',            cfg.mostrarEmail) +
              toggle('mostrarWeb',     'Mostrar sitio web',        cfg.mostrarWeb) +
              toggle('mostrarIGV',     'Mostrar desglose IGV',     cfg.mostrarIGV) +
              toggle('mostrarBarcode', 'Mostrar código de barras', cfg.mostrarBarcode) +
            '</div>' +
          '</div>' +

        '</div>' + // fin col izquierda

        // Preview
        '<div style="position:sticky;top:80px;">' +
          '<div class="card">' +
            '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
              '<div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-eye" style="color:var(--accent);margin-right:5px;"></i>Vista Previa del Ticket</div>' +
              '<span style="font-size:11px;background:var(--accent);color:white;padding:2px 10px;border-radius:10px;">'+cfg.tamano+'</span>' +
            '</div>' +
            '<div id="ticketPreviewContainer" style="padding:16px;overflow-y:auto;max-height:700px;">'+preview+'</div>' +
            '<div style="padding:12px 18px;border-top:1px solid var(--gray-200);display:flex;gap:8px;">' +
              '<button onclick="CuentaCorrienteModule.guardarConfig()" style="flex:1;padding:12px;background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:6px;"></i>Guardar</button>' +
              '<button onclick="CuentaCorrienteModule._imprimirPreview()" style="flex:1;padding:12px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;"><i class="fas fa-print" style="margin-right:6px;"></i>Imprimir prueba</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>'
    );
  },

  // ─────────────────────────────────────────
  // GENERAR PREVIEW HTML DEL TICKET
  // ─────────────────────────────────────────
  _generarPreview(cfg) {
    var ancho = cfg.tamano==='58mm'?'200px':cfg.tamano==='A4'?'340px':'260px';
    var fs    = parseInt(cfg.fuenteSize)||12;
    var hClr  = cfg.colorHeader||'#1e3a5f';
    var tClr  = cfg.colorTotal||'#2563eb';
    return (
      '<div style="max-width:'+ancho+';margin:0 auto;font-family:\'Courier New\',monospace;font-size:'+fs+'px;' +
        'background:white;border:1px solid var(--gray-200);border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.12);">' +
        '<div style="background:'+hClr+';padding:16px 12px;text-align:center;color:white;">' +
          (cfg.mostrarLogo && cfg.logo ? '<img src="'+cfg.logo+'" style="max-width:80px;max-height:60px;object-fit:contain;display:block;margin:0 auto 8px;" alt="logo"/>' : '') +
          '<div style="font-size:'+(fs+3)+'px;font-weight:900;letter-spacing:0.5px;">'+cfg.nombre+'</div>' +
          (cfg.mostrarRuc   ? '<div style="font-size:'+(fs-1)+'px;opacity:0.85;margin-top:2px;">RUC: '+cfg.ruc+'</div>' : '') +
          (cfg.mostrarDir   ? '<div style="font-size:'+(fs-1)+'px;opacity:0.8;margin-top:2px;">'+cfg.direccion+'</div>' : '') +
          (cfg.mostrarTel   && cfg.telefono ? '<div style="font-size:'+(fs-1)+'px;opacity:0.8;margin-top:2px;">Tel: '+cfg.telefono+'</div>' : '') +
          (cfg.mostrarEmail && cfg.email    ? '<div style="font-size:'+(fs-1)+'px;opacity:0.8;margin-top:2px;">'+cfg.email+'</div>' : '') +
          (cfg.mostrarWeb   && cfg.web      ? '<div style="font-size:'+(fs-1)+'px;opacity:0.8;margin-top:2px;">'+cfg.web+'</div>' : '') +
        '</div>' +
        '<div style="text-align:center;padding:10px;background:#f8fafc;border-bottom:1px dashed #ccc;">' +
          '<div style="font-size:'+(fs+2)+'px;font-weight:900;color:'+hClr+';">NOTA DE VENTA</div>' +
          '<div style="font-size:'+(fs+1)+'px;font-weight:700;color:'+hClr+';">NV03 - 00000001</div>' +
        '</div>' +
        '<div style="padding:10px 12px;">' +
          '<div style="font-size:'+(fs-1)+'px;margin-bottom:2px;"><strong>Fecha:</strong> '+this._fechaLocal()+'</div>' +
          '<div style="font-size:'+(fs-1)+'px;margin-bottom:6px;"><strong>Cliente:</strong> PÚBLICO EN GENERAL</div>' +
          '<div style="border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;padding:6px 0;margin-bottom:6px;">' +
            '<table style="width:100%;border-collapse:collapse;font-size:'+(fs-1)+'px;">' +
              '<tr style="font-weight:700;"><td>Producto</td><td style="text-align:center;">Cant</td><td style="text-align:right;">Total</td></tr>' +
              '<tr><td>Producto Ejemplo</td><td style="text-align:center;">2</td><td style="text-align:right;">S/20.00</td></tr>' +
              '<tr><td>Otro Producto</td><td style="text-align:center;">1</td><td style="text-align:right;">S/15.00</td></tr>' +
            '</table>' +
          '</div>' +
          (cfg.mostrarIGV
            ? '<div style="display:flex;justify-content:space-between;font-size:'+(fs-1)+'px;margin-bottom:2px;"><span>Subtotal:</span><span>S/ 29.66</span></div>' +
              '<div style="display:flex;justify-content:space-between;font-size:'+(fs-1)+'px;margin-bottom:6px;"><span>IGV (18%):</span><span>S/ 5.34</span></div>'
            : ''
          ) +
          '<div style="display:flex;justify-content:space-between;background:'+tClr+';color:white;padding:8px 10px;border-radius:6px;margin-bottom:6px;">' +
            '<span style="font-size:'+(fs+1)+'px;font-weight:900;">TOTAL:</span>' +
            '<span style="font-size:'+(fs+3)+'px;font-weight:900;">S/ 35.00</span>' +
          '</div>' +
          '<div style="font-size:'+(fs-1)+'px;margin-bottom:2px;"><strong>Pagó:</strong> S/ 50.00 | <strong>Vuelto:</strong> S/ 15.00</div>' +
        '</div>' +
        '<div style="text-align:center;padding:10px 12px;border-top:1px dashed #ccc;background:#f8fafc;">' +
          '<div style="font-size:'+(fs+1)+'px;font-weight:900;color:'+hClr+';">'+cfg.mensaje+'</div>' +
          (cfg.mensaje2 ? '<div style="font-size:'+(fs-1)+'px;color:#666;margin-top:3px;">'+cfg.mensaje2+'</div>' : '') +
          (cfg.mostrarBarcode ? '<div style="margin-top:8px;"><i class="fas fa-barcode" style="font-size:32px;color:#333;"></i></div>' : '') +
        '</div>' +
      '</div>'
    );
  },

  // ─────────────────────────────────────────
  // HANDLERS CONFIG
  // ─────────────────────────────────────────
  _actualizarCfg() {
    var cfg = this.cfg;
    var get = function(id){ return document.getElementById('cfg_'+id); };
    ['nombre','ruc','direccion','telefono','email','web','mensaje','mensaje2'].forEach(function(k){ var el=get(k); if(el) cfg[k]=el.value; });
    ['mostrarLogo','mostrarRuc','mostrarDir','mostrarTel','mostrarEmail','mostrarWeb','mostrarIGV','mostrarBarcode'].forEach(function(k){ var el=get(k); if(el) cfg[k]=el.checked; });
    var hEl=get('colorHeader'); if(hEl){ cfg.colorHeader=hEl.value; var sv=document.getElementById('cfg_colorHeader_val'); if(sv)sv.textContent=hEl.value; }
    var tEl=get('colorTotal');  if(tEl){ cfg.colorTotal=tEl.value;  var sv2=document.getElementById('cfg_colorTotal_val'); if(sv2)sv2.textContent=tEl.value; }
    this._actualizarPreview();
  },

  _actualizarPreview() {
    var container = document.getElementById('ticketPreviewContainer');
    if (container) container.innerHTML = this._generarPreview(this.cfg);
  },

  _subirLogo(input) {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { App.toast('Imagen supera 2MB','error'); return; }
    var reader = new FileReader();
    var self   = this;
    reader.onload = function(e) {
      self.cfg.logo = e.target.result;
      var wrap = document.getElementById('logoPreviewWrap');
      if (wrap) wrap.innerHTML = '<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:contain;" alt="logo"/>';
      self._actualizarPreview();
      App.toast('Logo cargado ✓','success');
    };
    reader.readAsDataURL(file);
  },

  _quitarLogo() {
    this.cfg.logo = '';
    var wrap = document.getElementById('logoPreviewWrap');
    if (wrap) wrap.innerHTML = '<div style="text-align:center;color:var(--gray-400);pointer-events:none;"><i class="fas fa-building" style="font-size:36px;display:block;margin-bottom:8px;opacity:0.4;"></i><span style="font-size:12px;font-weight:700;">Tu Logo</span></div>';
    this._actualizarPreview();
  },

  guardarConfig() {
    this._actualizarCfg();
    this._saveCfg();
    App.toast('✅ Configuración del ticket guardada','success');
  },

  _imprimirPreview() {
    this._actualizarCfg();
    var preview = this._generarPreview(this.cfg);
    var w = window.open('','_blank','width=400,height=650');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vista Previa Ticket</title>' +
      '<style>body{font-family:Arial;background:#f0f0f0;display:flex;justify-content:center;padding:20px;}</style>' +
      '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>' +
      '</head><body>'+preview+'</body></html>');
    w.document.close();
    setTimeout(function(){ w.print(); },600);
  },

  // ─────────────────────────────────────────
  // EDITAR TICKET
  // ─────────────────────────────────────────
  editarTicket(id) { this.ticketEditando=id; App.renderPage(); },

  renderEditarTicket() {
    var id  = this.ticketEditando;
    var v   = DB.ventas.find(function(x){return x.id===id;});
    if (!v) { this.ticketEditando=null; return this.renderLista(); }
    var cli = DB.clientes.find(function(c){return c.id===v.cliente_id;});
    var tClr= v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';

    var itemsHTML = v.items.map(function(item, i) {
      var prod = DB.productos.find(function(p){return p.id===item.prod_id;});
      var imgH = (prod&&prod.imagen)
        ? '<img src="'+prod.imagen+'" style="width:60px;height:60px;object-fit:cover;border-radius:10px;flex-shrink:0;border:2px solid var(--gray-200);" alt=""/>'
        : '<div style="width:60px;height:60px;border-radius:10px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px dashed var(--gray-300);"><i class="fas fa-image" style="font-size:20px;color:var(--gray-300);"></i></div>';
      return (
        '<div style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:white;border:1.5px solid var(--gray-200);border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">' +
          '<div style="width:28px;height:28px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;flex-shrink:0;">'+(i+1)+'</div>' +
          imgH +
          '<div style="flex:1;min-width:0;">' +
            '<input type="text" value="'+item.nombre.replace(/"/g,'&quot;')+'" ' +
              'onchange="CuentaCorrienteModule._editItem('+id+','+i+',\'nombre\',this.value)" ' +
              'style="width:100%;font-size:16px;font-weight:800;border:none;border-bottom:2px solid var(--gray-200);padding:2px 0;background:transparent;outline:none;margin-bottom:5px;box-sizing:border-box;"/>' +
            '<div style="font-size:12px;color:var(--gray-400);">'+(prod?prod.codigo:'')+'</div>' +
          '</div>' +
          '<div style="text-align:center;flex-shrink:0;">' +
            '<div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">CANTIDAD</div>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<button onclick="CuentaCorrienteModule._editItem('+id+','+i+',\'qty\','+(item.qty-1)+')" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-size:17px;cursor:pointer;color:var(--gray-600);display:flex;align-items:center;justify-content:center;font-weight:900;">−</button>' +
              '<input type="number" min="1" value="'+item.qty+'" onchange="CuentaCorrienteModule._editItem('+id+','+i+',\'qty\',parseInt(this.value)||1)" style="width:50px;height:30px;border:1.5px solid var(--accent);border-radius:6px;text-align:center;font-weight:900;font-size:15px;color:var(--accent);"/>' +
              '<button onclick="CuentaCorrienteModule._editItem('+id+','+i+',\'qty\','+(item.qty+1)+')" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-size:17px;cursor:pointer;color:var(--gray-600);display:flex;align-items:center;justify-content:center;font-weight:900;">+</button>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:center;flex-shrink:0;min-width:110px;">' +
            '<div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">PRECIO (S/)</div>' +
            '<div style="display:flex;align-items:center;gap:3px;">' +
              '<span style="font-size:12px;font-weight:700;color:var(--gray-400);">S/</span>' +
              '<input type="number" min="0" step="0.01" value="'+item.precio.toFixed(2)+'" onchange="CuentaCorrienteModule._editItem('+id+','+i+',\'precio\',parseFloat(this.value)||0)" style="width:80px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;padding:0 6px;font-size:15px;font-weight:800;text-align:center;"/>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:center;flex-shrink:0;min-width:100px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:8px 12px;">' +
            '<div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:4px;">TOTAL</div>' +
            '<div style="font-size:20px;font-weight:900;color:var(--accent);">S/ '+item.total.toFixed(2)+'</div>' +
          '</div>' +
          '<button onclick="CuentaCorrienteModule._eliminarItemTicket('+id+','+i+')" style="width:36px;height:36px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas fa-trash"></i></button>' +
        '</div>'
      );
    }).join('');

    var total   = v.items.reduce(function(s,i){return s+i.total;},0);
    var subtotal= total/1.18, igv=total-subtotal;

    return (
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:var(--gray-50);border-radius:12px;border:1.5px solid var(--gray-200);margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<button onclick="CuentaCorrienteModule.ticketEditando=null;App.renderPage();" style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;"><i class="fas fa-arrow-left" style="margin-right:6px;"></i>Volver a Tickets</button>' +
          '<div style="width:2px;height:26px;background:var(--gray-200);"></div>' +
          '<div>' +
            '<div style="font-size:17px;font-weight:900;">Editando: <span style="color:'+tClr+';">'+v.serie+'-'+v.numero+'</span></div>' +
            '<div style="font-size:12px;color:var(--gray-400);">'+v.fecha+' · '+(cli?cli.nombre:'')+'</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="CuentaCorrienteModule.guardarEdicion('+id+')" style="background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:8px;padding:10px 24px;font-weight:900;cursor:pointer;font-size:15px;box-shadow:0 4px 12px rgba(22,163,74,0.3);"><i class="fas fa-save" style="margin-right:7px;"></i>GUARDAR CAMBIOS</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 360px;gap:16px;">' +
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:5px;"></i>Datos del Comprobante</div></div>' +
            '<div style="padding:14px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">' +
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">TIPO</div><div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;color:'+tClr+';">'+v.tipo+'</div></div>' +
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">SERIE - NÚMERO</div><div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;">'+v.serie+'-'+v.numero+'</div></div>' +
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">FECHA</div><input type="date" value="'+v.fecha+'" onchange="CuentaCorrienteModule._editCampo('+id+',\'fecha\',this.value)" style="width:100%;padding:8px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;"/></div>' +
              '<div><div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">CLIENTE</div><div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(cli?cli.nombre:'N/A')+'</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);"><div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-boxes" style="color:var(--accent);margin-right:5px;"></i>Productos <span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:5px;">'+v.items.length+'</span></div></div>' +
            '<div style="padding:12px;">'+itemsHTML+'</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="card">' +
            '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);"><div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-credit-card" style="color:var(--accent);margin-right:5px;"></i>Método de Pago</div></div>' +
            '<div style="padding:12px 18px;display:flex;flex-direction:column;gap:8px;">' +
            [{val:'EFECTIVO',icon:'fa-money-bill-wave',color:'#16a34a',label:'Efectivo'},
             {val:'TARJETA', icon:'fa-credit-card',    color:'#2563eb',label:'Tarjeta'},
             {val:'YAPE',    icon:'fa-mobile-alt',     color:'#7c3aed',label:'Yape/Plin'},
             {val:'TRANSFERENCIA',icon:'fa-university',color:'#0ea5e9',label:'Transferencia'}
            ].map(function(m){
              var activo=v.metodo_pago===m.val;
              return '<button onclick="CuentaCorrienteModule._editCampo('+id+',\'metodo_pago\',\''+m.val+'\')" ' +
                'style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;' +
                'border:2px solid '+(activo?m.color:'var(--gray-200)')+';background:'+(activo?m.color+'20':'transparent')+';cursor:pointer;">' +
                '<div style="width:32px;height:32px;border-radius:7px;background:'+(activo?m.color:'var(--gray-100)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                  '<i class="fas '+m.icon+'" style="font-size:15px;color:'+(activo?'white':m.color)+';"></i></div>' +
                '<span style="font-size:13px;font-weight:800;color:'+(activo?m.color:'var(--gray-600)')+';">'+m.label+'</span>' +
                (activo?'<i class="fas fa-check-circle" style="margin-left:auto;color:'+m.color+';"></i>':'') +
              '</button>';
            }).join('') +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);"><div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-receipt" style="color:var(--accent);margin-right:5px;"></i>Resumen</div></div>' +
            '<div style="padding:18px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:15px;color:var(--gray-500);">Subtotal:</span><span style="font-size:18px;font-weight:900;color:var(--gray-800);">S/ '+subtotal.toFixed(2)+'</span></div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:2px solid var(--gray-200);"><span style="font-size:15px;color:var(--gray-500);">IGV (18%):</span><span style="font-size:18px;font-weight:900;color:var(--gray-800);">S/ '+igv.toFixed(2)+'</span></div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;color:white;margin-bottom:14px;">' +
                '<span style="font-size:20px;font-weight:900;">TOTAL</span><span style="font-size:32px;font-weight:900;">S/ '+total.toFixed(2)+'</span>' +
              '</div>' +
              '<button onclick="CuentaCorrienteModule.guardarEdicion('+id+')" style="width:100%;padding:15px;background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:12px;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.4);display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">' +
                '<i class="fas fa-save" style="font-size:18px;"></i> GUARDAR CAMBIOS</button>' +
              '<button onclick="CuentaCorrienteModule.imprimirTicket('+id+')" style="width:100%;padding:11px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
                '<i class="fas fa-print"></i> Imprimir Ticket</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  },

  // ─────────────────────────────────────────
  // EDICIÓN INLINE
  // ─────────────────────────────────────────
  _editItem(ventaId, idx, campo, valor) {
    var v=DB.ventas.find(function(x){return x.id===ventaId;});
    if(!v||!v.items[idx]) return;
    v.items[idx][campo]=valor;
    v.items[idx].total=v.items[idx].qty*v.items[idx].precio;
    var total=v.items.reduce(function(s,i){return s+i.total;},0);
    v.total=total; v.subtotal=total/1.18; v.igv=total-v.subtotal;
    App.renderPage();
  },

  _eliminarItemTicket(ventaId, idx) {
    var v=DB.ventas.find(function(x){return x.id===ventaId;});
    if(!v) return;
    if(v.items.length<=1){App.toast('El ticket debe tener al menos 1 producto','error');return;}
    if(!confirm('¿Eliminar este producto del ticket?')) return;
    v.items.splice(idx,1);
    var total=v.items.reduce(function(s,i){return s+i.total;},0);
    v.total=total; v.subtotal=total/1.18; v.igv=total-v.subtotal;
    App.renderPage();
  },

  _editCampo(ventaId, campo, valor) {
    var v=DB.ventas.find(function(x){return x.id===ventaId;});
    if(!v) return;
    v[campo]=valor;
    App.renderPage();
  },

  guardarEdicion(id) {
    Storage.guardarVentas();
    App.toast('✅ Ticket guardado correctamente','success');
    this.ticketEditando=null;
    App.renderPage();
  },

  // ─────────────────────────────────────────
  // ACCIONES LISTA
  // ─────────────────────────────────────────
  verDetalle(id) {
    var v=DB.ventas.find(function(x){return x.id===id;}); if(!v) return;
    var cli=DB.clientes.find(function(c){return c.id===v.cliente_id;});
    var tClr=v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
    var eBg=v.estado==='ACEPTADO'?'#dcfce7':v.estado==='ANULADO'?'#fee2e2':'#fef3c7';
    var eClr=v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706';
    App.showModal('🎫 '+v.serie+'-'+v.numero,
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
        '<div><div style="font-size:17px;font-weight:900;color:'+tClr+';">'+v.tipo_comprobante+'</div><div style="font-size:12px;color:var(--gray-400);">'+v.fecha+' '+v.hora+'</div></div>' +
        '<span style="padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;background:'+eBg+';color:'+eClr+';">'+v.estado+'</span>' +
      '</div>' +
      '<div style="background:var(--gray-50);padding:10px 14px;border-radius:8px;margin-bottom:14px;">' +
        '<div style="font-weight:700;">'+(cli?cli.nombre:'N/A')+'</div>' +
        '<div style="font-size:12px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div>' +
      '</div>' +
      '<table class="data-table"><thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead><tbody>' +
      v.items.map(function(i){return '<tr><td>'+i.nombre+'</td><td>'+i.qty+'</td><td>S/ '+i.precio.toFixed(2)+'</td><td><strong>S/ '+i.total.toFixed(2)+'</strong></td></tr>';}).join('') +
      '</tbody></table>' +
      '<div style="margin-top:14px;border-top:1px solid var(--gray-200);padding-top:14px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;"><span>Subtotal:</span><span>S/ '+v.subtotal.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px;"><span>IGV 18%:</span><span>S/ '+v.igv.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:22px;font-weight:900;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:12px 16px;border-radius:10px;">' +
          '<span>TOTAL</span><span>S/ '+v.total.toFixed(2)+'</span></div>' +
        '<div style="margin-top:8px;font-size:12px;color:var(--gray-500);">Método: <strong>'+v.metodo_pago+'</strong> · Pagó: <strong>S/ '+v.monto_pago.toFixed(2)+'</strong> · Vuelto: <strong>S/ '+v.vuelto.toFixed(2)+'</strong></div>' +
      '</div>',
      [{text:'✏️ Editar',   cls:'btn-outline', cb:function(){App.closeModal();CuentaCorrienteModule.editarTicket(id);}},
       {text:'🖨️ Imprimir', cls:'btn-primary',  cb:function(){CuentaCorrienteModule.imprimirTicket(id);App.closeModal();}}]
    );
    document.getElementById('modalBox').style.maxWidth='560px';
  },

  imprimirTicket(id) {
    var v=DB.ventas.find(function(x){return x.id===id;});
    if(!v) return;
    if(typeof VentasModule!=='undefined') VentasModule.imprimirComprobante(v);
  },

  enviarSunat(id) {
    App.toast('Enviando a SUNAT...','info');
    setTimeout(function(){
      var i=DB.ventas.findIndex(function(x){return x.id===id;});
      if(i>=0){DB.ventas[i].estado='ACEPTADO';Storage.guardarVentas();}
      App.toast('✅ Aceptado por SUNAT','success');App.renderPage();
    },1500);
  },

  anularTicket(id) {
    if(!confirm('¿Anular este ticket? Se devolverá el stock.')) return;
    var i=DB.ventas.findIndex(function(x){return x.id===id;});
    if(i<0) return;
    DB.ventas[i].estado='ANULADO';
    DB.ventas[i].items.forEach(function(item){
      var pi=DB.productos.findIndex(function(p){return p.id===item.prod_id;});
      if(pi>=0) DB.productos[pi].stock+=item.qty;
    });
    Storage.guardarVentas();Storage.guardarProductos();
    App.toast('Ticket anulado','warning');App.renderPage();
  },

  exportarCSV() {
    var f=this.getFiltered();
    var h='Fecha,Hora,Serie,Numero,Tipo,Cliente,Items,Total,Estado,Metodo\n';
    var r=f.map(function(v){
      var cli=DB.clientes.find(function(c){return c.id===v.cliente_id;});
      var items=v.items.map(function(i){return i.nombre+'x'+i.qty;}).join('|');
      return v.fecha+','+v.hora+','+v.serie+','+v.numero+','+v.tipo+',"'+(cli?cli.nombre:'')+'","'+items+'",'+v.total.toFixed(2)+','+v.estado+','+v.metodo_pago;
    }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+h+r],{type:'text/csv;charset=utf-8;'}));
    a.download='tickets_jumila_'+(new Date().toISOString().slice(0,10))+'.csv';
    a.click();URL.revokeObjectURL(a.href);
    App.toast(f.length+' tickets exportados','success');
  },

  getFiltered() {
    var self=this;
    return DB.ventas.filter(function(v){
      var mT=self.tipoFilter==='todos'||v.tipo===self.tipoFilter;
      var mE=self.estadoFilter==='todos'||v.estado===self.estadoFilter;
      var mF=(!self.fechaInicio||v.fecha>=self.fechaInicio)&&(!self.fechaFin||v.fecha<=self.fechaFin);
      var mS=!self.searchTerm||v.numero.indexOf(self.searchTerm)>=0||v.serie.indexOf(self.searchTerm)>=0||
        (DB.clientes.find(function(c){return c.id===v.cliente_id;})||{nombre:''}).nombre.toLowerCase().indexOf(self.searchTerm.toLowerCase())>=0||
        v.items.some(function(i){return i.nombre.toLowerCase().indexOf(self.searchTerm.toLowerCase())>=0;});
      return mT&&mE&&mF&&mS;
    });
  },

  limpiarFiltros(){ this.searchTerm='';this.tipoFilter='todos';this.estadoFilter='todos';this.fechaInicio='';this.fechaFin='';this.currentPage=1;App.renderPage(); },
  formatFecha(f){ if(!f)return '';var p=f.split('-');return p[2]+'/'+p[1]+'/'+p[0]; },
  toggleMenu(id){ document.querySelectorAll('.action-menu').forEach(function(m){if(m.id!=='menu-ticket-'+id)m.classList.add('hidden');});var el=document.getElementById('menu-ticket-'+id);if(el)el.classList.toggle('hidden'); }
};
