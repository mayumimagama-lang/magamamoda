// ============================================================
// MÓDULO: TICKETS — MAGAMA Tienda de Ropa
// Diseño profesional con QR, colores y mensajes editables
// ============================================================

const TicketsModule = {

  tabActiva:      'config',
  searchTerm:     '',
  tipoFilter:     'todos',
  estadoFilter:   'todos',
  fechaInicio:    '',
  fechaFin:       '',
  currentPage:    1,
  itemsPerPage:   15,
  ticketEditando: null,
  cfg:            null,

  _getCfg() {
    if (!this.cfg) {
      var saved = localStorage.getItem('magama_ticket_cfg');
      this.cfg = saved ? JSON.parse(saved) : {
        logo:           '',
        nombre:         'MAGAMA',
        slogan:         'Tienda de Ropa Variada',
        ruc:            '20123456789',
        direccion:      'JR. 2 DE MAYO 708 HUANUCO',
        telefono:       '987 654 321',
        email:          'magama@gmail.com',
        web:            '@MAGAMA',
        mensaje1:       '\u00a1Gracias por tu compra!',
        mensaje2:       'Tu estilo es nuestra pasi\u00f3n \ud83d\udc57\u2728',
        mensaje3:       'S\u00edguenos en redes sociales @MAGAMA',
        colorHeader:    '#1a1a2e',
        colorAcento:    '#e94560',
        colorTotal:     '#0f3460',
        mostrarLogo:    true,
        mostrarSlogan:  true,
        mostrarRuc:     true,
        mostrarDir:     true,
        mostrarTel:     true,
        mostrarEmail:   false,
        mostrarWeb:     true,
        mostrarIGV:     true,
        mostrarQR:      true,
        mostrarFirma:   false,
      };
    }
    return this.cfg;
  },

  _saveCfg() {
    localStorage.setItem('magama_ticket_cfg', JSON.stringify(this.cfg));
    DB.empresa.nombre    = this.cfg.nombre;
    DB.empresa.ruc       = this.cfg.ruc;
    DB.empresa.direccion = this.cfg.direccion;
    Storage.guardarEmpresa();
    App.toast('\u2705 Dise\u00f1o del ticket guardado', 'success');
  },

  _fechaLocal() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },

  render() {
    App.setTabs2('Tickets', 'TICKETS');
    this._getCfg();
    if (this.ticketEditando !== null) return this.renderEditarTicket();
    if (this.tabActiva === 'config')  return this.renderConfig();
    return this.renderLista();
  },

  _tabHeader() {
    var tabs = [
      { key:'config', icon:'fa-paint-brush', label:'Diseñar Ticket' },
    ];
    return '<div style="display:flex;gap:4px;margin-bottom:20px;background:var(--gray-100);padding:5px;border-radius:12px;width:fit-content;">' +
      tabs.map(function(t) {
        var a = TicketsModule.tabActiva === t.key;
        return '<button onclick="TicketsModule.tabActiva=\''+t.key+'\';App.renderPage();" ' +
          'style="padding:10px 24px;border-radius:9px;border:none;cursor:pointer;font-size:14px;font-weight:800;transition:all 0.15s;' +
          'background:'+(a?'white':'transparent')+';color:'+(a?'var(--accent)':'var(--gray-500)')+';' +
          'box-shadow:'+(a?'0 2px 8px rgba(0,0,0,0.12)':'none')+';">' +
          '<i class="fas '+t.icon+'" style="margin-right:7px;"></i>'+t.label+'</button>';
      }).join('') + '</div>';
  },

  renderLista() {
    var self     = this;
    var hoy      = this._fechaLocal();
    if (!this.fechaInicio) this.fechaInicio = hoy.slice(0,8)+'01';
    if (!this.fechaFin)    this.fechaFin    = hoy;
    var filtered = this.getFiltered();
    var totalPgs = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    var paged    = filtered.slice((this.currentPage-1)*this.itemsPerPage, this.currentPage*this.itemsPerPage);
    var totalVtas= filtered.reduce(function(s,v){ return s+v.total; }, 0);
    var kpis = [
      { icon:'fa-ticket-alt',   bg:'#eff6ff', clr:'#2563eb', val: filtered.length, label:'Total' },
      { icon:'fa-check-circle', bg:'#f0fdf4', clr:'#16a34a', val: filtered.filter(function(v){ return v.estado==='ACEPTADO'; }).length,   label:'Aceptados' },
      { icon:'fa-clock',        bg:'#fffbeb', clr:'#d97706', val: filtered.filter(function(v){ return v.estado==='NO_ENVIADO'; }).length, label:'Por enviar' },
      { icon:'fa-ban',          bg:'#fef2f2', clr:'#dc2626', val: filtered.filter(function(v){ return v.estado==='ANULADO'; }).length,    label:'Anulados' },
      { icon:'fa-dollar-sign',  bg:'#f0fdf4', clr:'#16a34a', val: 'S/ '+totalVtas.toFixed(2), label:'Total Periodo' },
    ];
    return (
      '<div class="page-header"><div>' +
        '<h2 class="page-title"><i class="fas fa-ticket-alt" style="color:var(--accent);margin-right:8px;"></i>Tickets MAGAMA</h2>' +
        '<p class="text-muted text-sm">'+filtered.length+' tickets &middot; <strong style="color:var(--success);">S/ '+totalVtas.toFixed(2)+'</strong></p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-outline" onclick="TicketsModule.exportarCSV()"><i class="fas fa-file-download"></i> Exportar</button>' +
        '<button class="btn btn-success" onclick="VentasModule.nuevaVenta();App.navigate(\'ventas\');"><i class="fas fa-plus"></i> Nuevo Ticket</button>' +
      '</div></div>' +
      this._tabHeader() +
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
        kpis.map(function(k) {
          return '<div class="stat-card"><div class="stat-icon" style="background:'+k.bg+';color:'+k.clr+'"><i class="fas '+k.icon+'"></i></div>' +
            '<div class="stat-info"><div class="stat-value">'+k.val+'</div><div class="stat-label">'+k.label+'</div></div></div>';
        }).join('') +
      '</div>' +
      '<div class="card">' +
        '<div class="card-body" style="padding-bottom:0;">' +
          '<div class="filter-row mb-3" style="flex-wrap:wrap;gap:10px;">' +
            '<div class="filter-group"><label>DESDE</label><input type="date" class="filter-input" value="'+this.fechaInicio+'" onchange="TicketsModule.fechaInicio=this.value;App.renderPage()"/></div>' +
            '<div class="filter-group"><label>HASTA</label><input type="date" class="filter-input" value="'+this.fechaFin+'" onchange="TicketsModule.fechaFin=this.value;App.renderPage()"/></div>' +
            '<div class="filter-group"><label>TIPO</label>' +
              '<select class="filter-select" onchange="TicketsModule.tipoFilter=this.value;TicketsModule.currentPage=1;App.renderPage()">' +
                '<option value="todos" '+(this.tipoFilter==='todos'?'selected':'')+'>Todos</option>' +
                '<option value="N. VENTA" '+(this.tipoFilter==='N. VENTA'?'selected':'')+'>Nota de Venta</option>' +
                '<option value="BOL" '+(this.tipoFilter==='BOL'?'selected':'')+'>Boleta</option>' +
                '<option value="FAC" '+(this.tipoFilter==='FAC'?'selected':'')+'>Factura</option>' +
              '</select></div>' +
            '<div class="filter-group"><label>ESTADO</label>' +
              '<select class="filter-select" onchange="TicketsModule.estadoFilter=this.value;TicketsModule.currentPage=1;App.renderPage()">' +
                '<option value="todos" '+(this.estadoFilter==='todos'?'selected':'')+'>Todos</option>' +
                '<option value="NO_ENVIADO" '+(this.estadoFilter==='NO_ENVIADO'?'selected':'')+'>Por enviar</option>' +
                '<option value="ACEPTADO" '+(this.estadoFilter==='ACEPTADO'?'selected':'')+'>Aceptados</option>' +
                '<option value="ANULADO" '+(this.estadoFilter==='ANULADO'?'selected':'')+'>Anulados</option>' +
              '</select></div>' +
            '<div class="search-bar" style="flex:1;min-width:200px;align-self:flex-end;"><i class="fas fa-search"></i>' +
              '<input type="text" placeholder="Buscar N\u00b0, cliente, producto..." value="'+this.searchTerm+'" oninput="TicketsModule.searchTerm=this.value;App.renderPage()"/></div>' +
            '<button class="btn btn-outline btn-sm" style="align-self:flex-end;" onclick="TicketsModule.limpiarFiltros()"><i class="fas fa-times"></i> Limpiar</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrapper"><table class="data-table">' +
          '<thead><tr><th>Fecha</th><th>Comprobante</th><th>Cliente</th><th>Productos</th><th>M\u00e9todo</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>' +
          '<tbody>' +
          (paged.length===0
            ? '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No hay tickets en este periodo</p></div></td></tr>'
            : paged.map(function(v) {
                var cli   = DB.clientes.find(function(c){ return c.id===v.cliente_id; });
                var tClr  = v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
                var eBg   = v.estado==='ACEPTADO'?'#dcfce7':v.estado==='ANULADO'?'#fee2e2':'#fef3c7';
                var eClr  = v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706';
                var eLbl  = v.estado==='ACEPTADO'?'\u2713 Aceptado':v.estado==='ANULADO'?'\u2717 Anulado':'\u23f3 Por enviar';
                var prod  = v.items.slice(0,2).map(function(i){ return i.nombre; }).join(', ')+(v.items.length>2?' +'+(v.items.length-2)+' m\u00e1s':'');
                return '<tr>' +
                  '<td><strong>'+self.formatFecha(v.fecha)+'</strong><div style="font-size:11px;color:var(--gray-400);">'+v.hora+'</div></td>' +
                  '<td><span style="color:'+tClr+';font-weight:800;font-size:11px;background:'+tClr+'18;padding:2px 7px;border-radius:4px;margin-right:4px;">'+v.tipo+'</span><span style="font-weight:700;color:'+tClr+';">'+v.serie+'-'+v.numero+'</span></td>' +
                  '<td><div style="font-weight:700;font-size:13px;">'+(cli?cli.nombre:'N/A')+'</div><div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div></td>' +
                  '<td><div style="font-size:12px;">'+prod+'</div><div style="font-size:11px;color:var(--gray-400);">'+v.items.length+' producto(s)</div></td>' +
                  '<td><span style="font-size:12px;font-weight:600;">'+v.metodo_pago+'</span></td>' +
                  '<td><strong style="font-size:16px;color:var(--accent);">S/ '+v.total.toFixed(2)+'</strong></td>' +
                  '<td><span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+eBg+';color:'+eClr+';">'+eLbl+'</span></td>' +
                  '<td><div class="action-menu-wrapper">' +
                    '<button class="action-menu-btn" onclick="TicketsModule.toggleMenu('+v.id+')"><i class="fas fa-ellipsis-v"></i></button>' +
                    '<div class="action-menu hidden" id="menu-ticket-'+v.id+'">' +
                      '<button class="action-menu-item" onclick="TicketsModule.verDetalle('+v.id+')"><i class="fas fa-eye"></i> Ver detalle</button>' +
                      (v.estado!=='ANULADO'?'<button class="action-menu-item" onclick="TicketsModule.editarTicket('+v.id+')"><i class="fas fa-edit"></i> Editar ticket</button>':'') +
                      '<button class="action-menu-item" onclick="TicketsModule.imprimirTicket('+v.id+')"><i class="fas fa-print"></i> Imprimir</button>' +
                      (v.estado==='NO_ENVIADO'?'<button class="action-menu-item" onclick="TicketsModule.enviarSunat('+v.id+')"><i class="fas fa-paper-plane"></i> Enviar SUNAT</button>':'') +
                      (v.estado!=='ANULADO'?'<div style="border-top:1px solid var(--gray-200);margin:4px 0;"></div><button class="action-menu-item danger" onclick="TicketsModule.anularTicket('+v.id+')"><i class="fas fa-ban"></i> Anular</button>':'') +
                    '</div></div></td>' +
                '</tr>';
              }).join('')
          ) +
          '</tbody></table></div>' +
        '<div class="pagination">' +
          '<span class="text-sm text-muted">'+Math.min((this.currentPage-1)*this.itemsPerPage+1,filtered.length)+'&ndash;'+Math.min(this.currentPage*this.itemsPerPage,filtered.length)+' de '+filtered.length+'</span>' +
          '<button class="pagination-btn" onclick="TicketsModule.currentPage=1;App.renderPage()" '+(this.currentPage===1?'disabled':'')+'><i class="fas fa-angle-double-left"></i></button>' +
          '<button class="pagination-btn" onclick="TicketsModule.currentPage--;App.renderPage()" '+(this.currentPage===1?'disabled':'')+'><i class="fas fa-chevron-left"></i></button>' +
          '<button class="pagination-btn" onclick="TicketsModule.currentPage++;App.renderPage()" '+(this.currentPage===totalPgs?'disabled':'')+'><i class="fas fa-chevron-right"></i></button>' +
          '<button class="pagination-btn" onclick="TicketsModule.currentPage='+totalPgs+';App.renderPage()" '+(this.currentPage===totalPgs?'disabled':'')+'><i class="fas fa-angle-double-right"></i></button>' +
        '</div>' +
      '</div>'
    );
  },

  renderConfig() {
    var cfg = this._getCfg();
    var preview = this._generarTicketHTML(cfg, null);
    var inp = function(id, label, valor, tipo) {
      tipo = tipo||'text';
      return '<div style="margin-bottom:11px;"><label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:4px;">'+label+'</label>' +
        '<input type="'+tipo+'" id="tc_'+id+'" value="'+(valor||'')+'" oninput="TicketsModule._previewLive()" ' +
        'style="width:100%;padding:9px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:14px;background:var(--gray-50);box-sizing:border-box;"/></div>';
    };
    var tog = function(id, label, valor) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--gray-100);">' +
        '<span style="font-size:14px;font-weight:600;color:var(--gray-700);">'+label+'</span>' +
        '<label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">' +
          '<input type="checkbox" id="tc_'+id+'" '+(valor?'checked':'')+' onchange="TicketsModule._previewLive()" style="opacity:0;width:0;height:0;"/>' +
          '<span style="position:absolute;inset:0;border-radius:24px;transition:0.3s;background:'+(valor?'var(--accent)':'var(--gray-300)')+';">' +
            '<span style="position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;left:'+(valor?'23px':'3px')+';transition:0.3s;"></span>' +
          '</span></label></div>';
    };
    return (
      '<div class="page-header"><div>' +
        '<h2 class="page-title"><i class="fas fa-paint-brush" style="color:var(--accent);margin-right:8px;"></i>Dise\u00f1ar Ticket MAGAMA</h2>' +
        '<p class="text-muted text-sm">Personaliza el ticket que se imprime al cliente</p>' +
      '</div><div class="page-actions">' +
        '<button class="btn btn-outline" onclick="TicketsModule._imprimirEjemplo()"><i class="fas fa-print"></i> Imprimir ejemplo</button>' +
        '<button class="btn btn-success" onclick="TicketsModule._guardarConfig()"><i class="fas fa-save"></i> Guardar dise\u00f1o</button>' +
      '</div></div>' +
      this._tabHeader() +
      '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;">' +

          '<div class="card"><div style="padding:12px 18px;border-bottom:1px solid var(--gray-200);font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-image" style="color:var(--accent);margin-right:5px;"></i>Logo</div>' +
          '<div style="padding:16px 18px;display:flex;align-items:center;gap:16px;">' +
            '<div id="tc_logo_wrap" onclick="document.getElementById(\'tc_logo_file\').click()" style="width:90px;height:90px;border-radius:12px;border:2px dashed var(--gray-300);display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;background:var(--gray-50);flex-shrink:0;" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--gray-300)\'">' +
              (cfg.logo?'<img src="'+cfg.logo+'" style="width:100%;height:100%;object-fit:contain;"/>':'<div style="text-align:center;color:var(--gray-400);pointer-events:none;"><i class="fas fa-tshirt" style="font-size:28px;display:block;margin-bottom:4px;opacity:0.4;"></i><span style="font-size:10px;font-weight:700;">LOGO</span></div>') +
            '</div>' +
            '<div style="flex:1;">' +
              '<input type="file" id="tc_logo_file" accept="image/*" style="display:none;" onchange="TicketsModule._subirLogo(this)"/>' +
              '<button onclick="document.getElementById(\'tc_logo_file\').click()" class="btn btn-primary" style="width:100%;margin-bottom:7px;"><i class="fas fa-upload"></i> Subir Logo</button>' +
              (cfg.logo?'<button onclick="TicketsModule._quitarLogo()" class="btn btn-outline" style="width:100%;color:var(--danger);border-color:var(--danger);margin-bottom:7px;"><i class="fas fa-trash"></i> Quitar</button>':'') +
              '<p style="font-size:10px;color:var(--gray-400);">PNG transparente \u00b7 M\u00e1x 2MB</p>' +
            '</div></div></div>' +

          '<div class="card"><div style="padding:12px 18px;border-bottom:1px solid var(--gray-200);font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-store" style="color:var(--accent);margin-right:5px;"></i>Datos de la Tienda</div>' +
          '<div style="padding:16px 18px;">' +
            inp('nombre',   'Nombre *',          cfg.nombre,   'text') +
            inp('slogan',   'Slogan',             cfg.slogan,   'text') +
            inp('ruc',      'RUC',                cfg.ruc,      'text') +
            inp('direccion','Direcci\u00f3n',     cfg.direccion,'text') +
            inp('telefono', 'Tel\u00e9fono/WhatsApp', cfg.telefono, 'text') +
            inp('email',    'Email',              cfg.email,    'email') +
            inp('web',      'Web / Instagram',   cfg.web,      'text') +
          '</div></div>' +

          '<div class="card"><div style="padding:12px 18px;border-bottom:1px solid var(--gray-200);font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-heart" style="color:#e94560;margin-right:5px;"></i>Mensajes al Cliente</div>' +
          '<div style="padding:16px 18px;">' +
            inp('mensaje1', 'Mensaje principal',        cfg.mensaje1, 'text') +
            inp('mensaje2', 'Segundo mensaje',          cfg.mensaje2, 'text') +
            inp('mensaje3', 'Mensaje redes / info',     cfg.mensaje3, 'text') +
          '</div></div>' +

          '<div class="card"><div style="padding:12px 18px;border-bottom:1px solid var(--gray-200);font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-palette" style="color:var(--accent);margin-right:5px;"></i>Colores</div>' +
          '<div style="padding:16px 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' +
            [['colorHeader','Encabezado',cfg.colorHeader],['colorAcento','Acento',cfg.colorAcento],['colorTotal','Total',cfg.colorTotal]].map(function(c){
              return '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">'+c[1]+'</label>' +
                '<div style="display:flex;align-items:center;gap:7px;">' +
                  '<input type="color" id="tc_'+c[0]+'" value="'+c[2]+'" oninput="TicketsModule._previewLive()" style="width:40px;height:38px;border:none;border-radius:7px;cursor:pointer;"/>' +
                  '<span id="tc_'+c[0]+'_val" style="font-size:11px;font-weight:700;color:var(--gray-600);">'+c[2]+'</span>' +
                '</div></div>';
            }).join('') +
          '</div></div>' +

          '<div class="card"><div style="padding:12px 18px;border-bottom:1px solid var(--gray-200);font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-eye" style="color:var(--accent);margin-right:5px;"></i>\u00bfQu\u00e9 mostrar?</div>' +
          '<div style="padding:4px 18px;">' +
            tog('mostrarLogo',   'Mostrar logo',          cfg.mostrarLogo) +
            tog('mostrarSlogan', 'Mostrar slogan',         cfg.mostrarSlogan) +
            tog('mostrarRuc',    'Mostrar RUC',            cfg.mostrarRuc) +
            tog('mostrarDir',    'Mostrar direcci\u00f3n',cfg.mostrarDir) +
            tog('mostrarTel',    'Mostrar tel\u00e9fono',  cfg.mostrarTel) +
            tog('mostrarEmail',  'Mostrar email',          cfg.mostrarEmail) +
            tog('mostrarWeb',    'Mostrar web/Instagram',  cfg.mostrarWeb) +
            tog('mostrarIGV',    'Mostrar desglose IGV',   cfg.mostrarIGV) +
            tog('mostrarQR',     'Mostrar c\u00f3digo QR', cfg.mostrarQR) +
            tog('mostrarFirma',  'L\u00ednea de firma',    cfg.mostrarFirma) +
          '</div></div>' +

        '</div>' +
        '<div style="position:sticky;top:80px;"><div class="card">' +
          '<div style="padding:12px 16px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
            '<span style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-eye" style="color:var(--accent);margin-right:5px;"></i>Vista Previa</span>' +
          '</div>' +
          '<div id="tc_preview_container" style="padding:12px;overflow-y:auto;max-height:640px;background:#d0d0d0;">'+preview+'</div>' +
          '<div style="padding:10px 14px;border-top:1px solid var(--gray-200);display:flex;gap:8px;">' +
            '<button onclick="TicketsModule._guardarConfig()" style="flex:1;padding:10px;background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:4px;"></i>Guardar</button>' +
            '<button onclick="TicketsModule._imprimirEjemplo()" style="flex:1;padding:10px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-print" style="margin-right:4px;"></i>Imprimir</button>' +
          '</div>' +
        '</div></div>' +
      '</div>'
    );
  },

  _generarTicketHTML(cfg, venta) {
    var numero   = venta ? (venta.serie+'-'+venta.numero) : 'NV03-00000001';
    var fecha    = venta ? venta.fecha     : this._fechaLocal();
    var hora     = venta ? venta.hora      : '10:30:00';
    var cliente  = venta ? (DB.clientes.find(function(c){ return c.id===venta.cliente_id; })||{nombre:'PÚBLICO EN GENERAL'}).nombre : 'PÚBLICO EN GENERAL';
    var metodo   = venta ? venta.metodo_pago : 'EFECTIVO';
    var recibido = venta ? venta.monto_pago  : 100.00;
    var vuelto   = venta ? venta.vuelto      : 22.50;
    var total    = venta ? venta.total       : 77.50;
    var subtotal = venta ? (venta.subtotal||total/1.18) : total/1.18;
    var igv      = venta ? (venta.igv||(total-subtotal)) : total-subtotal;
    var tipoFull = venta ? (venta.tipo_comprobante||venta.tipo||'NOTA DE VENTA') : 'NOTA DE VENTA';
    var items    = venta ? venta.items : [
      { nombre:'POLO ALGODÓN', qty:2, precio:18.00, total:36.00 },
      { nombre:'JEAN SLIM',    qty:1, precio:45.00, total:45.00 },
    ];
    var sep = '<div style="border-top:1px dashed #000;margin:7px 0;"></div>';
    var qrData = encodeURIComponent(numero+' '+cfg.nombre+' S/'+total.toFixed(2));
    var qrUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=90x90&bgcolor=ffffff&color=000000&data='+qrData;

    return (
      '<div style="width:270px;margin:0 auto;font-family:\'Courier New\',monospace;font-size:12px;background:white;padding:14px 12px;box-sizing:border-box;box-shadow:0 4px 16px rgba(0,0,0,0.18);color:#000;">' +

        // ENCABEZADO
        '<div style="text-align:center;margin-bottom:6px;">' +
          (cfg.mostrarLogo && cfg.logo
            ? '<img src="'+cfg.logo+'" style="max-width:70px;max-height:60px;object-fit:contain;display:block;margin:0 auto 6px;" alt="logo"/>'
            : '') +
          '<div style="font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">'+cfg.nombre+'</div>' +
          (cfg.mostrarRuc    ? '<div style="font-size:11px;">RUC: '+cfg.ruc+'</div>'            : '') +
          (cfg.mostrarDir    ? '<div style="font-size:11px;">'+cfg.direccion+'</div>'            : '') +
          (cfg.mostrarTel && cfg.telefono  ? '<div style="font-size:11px;">'+cfg.telefono+'</div>'  : '') +
          (cfg.mostrarEmail && cfg.email   ? '<div style="font-size:11px;">'+cfg.email+'</div>'     : '') +
          (cfg.mostrarWeb && cfg.web       ? '<div style="font-size:11px;">'+cfg.web+'</div>'       : '') +
        '</div>' +

        sep +

        // TIPO Y NÚMERO
        '<div style="text-align:center;margin-bottom:4px;">' +
          '<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">'+tipoFull+'</div>' +
'<div style="font-size:12px;font-weight:600;color:#888;">'+numero+'</div>' +
        '</div>' +

        sep +

        // FECHA Y CLIENTE
        '<div style="margin-bottom:4px;">' +
          '<div style="font-size:11px;">Fecha: <strong>'+fecha+' '+hora+'</strong></div>' +
          '<div style="font-size:11px;">Cliente: <strong>'+cliente+'</strong></div>' +
        '</div>' +

        sep +

        // CABECERA TABLA
        '<div style="display:grid;grid-template-columns:1fr 36px 54px 54px;font-size:10px;font-weight:700;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:3px;">' +
          '<span>Producto</span><span style="text-align:center;">Cant</span><span style="text-align:right;">P.Unit</span><span style="text-align:right;">Total</span>' +
        '</div>' +

        // ITEMS
        items.map(function(item) {
          return '<div style="display:grid;grid-template-columns:1fr 36px 54px 54px;font-size:11px;margin-bottom:2px;align-items:start;">' +
            '<span style="overflow:hidden;word-break:break-word;">'+item.nombre+'</span>' +
            '<span style="text-align:center;">'+item.qty+'</span>' +
            '<span style="text-align:right;">S/'+item.precio.toFixed(2)+'</span>' +
            '<span style="text-align:right;font-weight:700;">S/'+item.total.toFixed(2)+'</span>' +
          '</div>';
        }).join('') +

        sep +

        // SUBTOTAL E IGV
        (cfg.mostrarIGV
          ? '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;"><span>Subtotal:</span><span>S/ '+subtotal.toFixed(2)+'</span></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;"><span>IGV (18%):</span><span>S/ '+igv.toFixed(2)+'</span></div>'
          : '') +

        // TOTAL
        '<div style="border:2px solid #000;padding:7px;text-align:center;margin:6px 0;border-radius:3px;">' +
          '<div style="font-size:11px;font-weight:700;">TOTAL A PAGAR</div>' +
          '<div style="font-size:26px;font-weight:900;letter-spacing:1px;">S/ '+total.toFixed(2)+'</div>' +
        '</div>' +

        sep +

        // PAGO
        '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;"><span>Método:</span><span style="font-weight:800;">'+metodo+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;"><span>Recibido:</span><span>S/ '+recibido.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;"><span>VUELTO:</span><span>S/ '+vuelto.toFixed(2)+'</span></div>' +

        sep +

        // QR
        (cfg.mostrarQR
          ? '<div style="text-align:center;margin:6px 0;">' +
              '<img src="'+qrUrl+'" style="width:75px;height:75px;" alt="QR" onerror="this.style.display=\'none\'"/>' +
              '<div style="font-size:9px;color:#000;margin-top:2px;">'+numero+'</div>' +
            '</div>' + sep
          : '') +

        // MENSAJES
        '<div style="text-align:center;margin-top:4px;">' +
          (cfg.mensaje1 ? '<div style="font-size:13px;font-weight:900;">'+cfg.mensaje1+'</div>'          : '') +
          (cfg.mensaje2 ? '<div style="font-size:11px;margin-top:2px;">'+cfg.mensaje2+'</div>'           : '') +
          (cfg.mensaje3 ? '<div style="font-size:10px;color:#000;margin-top:2px;">'+cfg.mensaje3+'</div>': '') +
        '</div>' +

        // FIRMA
        (cfg.mostrarFirma
          ? sep + '<div style="text-align:center;padding-top:18px;"><div style="border-top:1px solid #333;width:120px;margin:0 auto;font-size:9px;padding-top:3px;">Firma del cliente</div></div>'
          : '') +

        sep +
        '<div style="text-align:center;font-size:9px;color:#000;">'+cfg.nombre+' &mdash; '+fecha+'</div>' +

      '</div>'
    );
  },

  _previewLive() {
    var cfg = this._getCfg();
    var get = function(id){ return document.getElementById('tc_'+id); };
    ['nombre','slogan','ruc','direccion','telefono','email','web','mensaje1','mensaje2','mensaje3'].forEach(function(k){ var el=get(k); if(el) cfg[k]=el.value; });
    ['mostrarLogo','mostrarSlogan','mostrarRuc','mostrarDir','mostrarTel','mostrarEmail','mostrarWeb','mostrarIGV','mostrarQR','mostrarFirma'].forEach(function(k){ var el=get(k); if(el) cfg[k]=el.checked; });
    ['colorHeader','colorAcento','colorTotal'].forEach(function(k){ var el=get(k); if(el){ cfg[k]=el.value; var v=document.getElementById('tc_'+k+'_val'); if(v) v.textContent=el.value; }});
    var c=document.getElementById('tc_preview_container');
    if(c) c.innerHTML=TicketsModule._generarTicketHTML(cfg,null);
  },

  _subirLogo(input) {
    var file=input.files[0]; if(!file) return;
    if(file.size>2*1024*1024){ App.toast('Imagen supera 2MB','error'); return; }
    var reader=new FileReader();
    reader.onload=function(e){
      TicketsModule.cfg.logo=e.target.result;
      var wrap=document.getElementById('tc_logo_wrap');
      if(wrap) wrap.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:contain;"/>';
      TicketsModule._previewLive();
      App.toast('Logo cargado \u2713','success');
    };
    reader.readAsDataURL(file);
  },

  _quitarLogo() {
    this.cfg.logo='';
    var wrap=document.getElementById('tc_logo_wrap');
    if(wrap) wrap.innerHTML='<div style="text-align:center;color:var(--gray-400);pointer-events:none;"><i class="fas fa-tshirt" style="font-size:28px;display:block;margin-bottom:4px;opacity:0.4;"></i><span style="font-size:10px;font-weight:700;">LOGO</span></div>';
    this._previewLive();
  },

  _guardarConfig(){ this._previewLive(); this._saveCfg(); },

  _imprimirEjemplo(){
    this._previewLive();
    this._abrirVentanaImpresion(this._generarTicketHTML(this.cfg, null));
  },

  _abrirVentanaImpresion(html) {
    var w=window.open('','_blank','width=380,height=700');
    if(!w){ App.toast('Activa las ventanas emergentes','warning'); return; }
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket MAGAMA</title>' +
      '<style>' +
      'body{margin:0;padding:0;background:white;color:#000 !important;}' +
      '*{color:#000 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '@media screen{body{padding:16px;background:#e5e5e5;display:flex;justify-content:center;}}' +
      '@media print{' +
        'body{margin:0;padding:0;background:white;}' +
        '@page{margin:0;size:80mm auto;}' +
        '*{color:#000 !important;font-weight:bolder !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '}' +
      '</style>' +
      '</head><body>'+html+'</body></html>');
    w.document.close();
    setTimeout(function(){ w.focus(); w.print(); }, 600);
  },

  editarTicket(id){ this.ticketEditando=id; App.renderPage(); },

  renderEditarTicket() {
    var id=this.ticketEditando;
    var v=DB.ventas.find(function(x){ return x.id===id; });
    if(!v){ this.ticketEditando=null; return this.renderLista(); }
    var cli=DB.clientes.find(function(c){ return c.id===v.cliente_id; });
    var tClr=v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
    var itemsHTML=v.items.map(function(item,i){
      var prod=DB.productos.find(function(p){ return p.id===item.prod_id; });
      var img=(prod&&prod.imagen)
        ? '<img src="'+prod.imagen+'" style="width:52px;height:52px;object-fit:cover;border-radius:7px;flex-shrink:0;border:2px solid var(--gray-200);" alt=""/>'
        : '<div style="width:52px;height:52px;border-radius:7px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px dashed var(--gray-300);"><i class="fas fa-tshirt" style="font-size:16px;color:var(--gray-300);"></i></div>';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:white;border:1.5px solid var(--gray-200);border-radius:10px;margin-bottom:8px;box-shadow:0 2px 4px rgba(0,0,0,0.04);">' +
        '<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);color:white;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+(i+1)+'</div>' +
        img +
        '<div style="flex:1;min-width:0;">' +
          '<input type="text" value="'+item.nombre.replace(/"/g,'&quot;')+'" onchange="TicketsModule._editItem('+id+','+i+',\'nombre\',this.value)" style="width:100%;font-size:14px;font-weight:800;border:none;border-bottom:2px solid var(--gray-200);padding:2px 0;background:transparent;outline:none;margin-bottom:2px;box-sizing:border-box;"/>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+(prod?prod.codigo:'')+'</div>' +
        '</div>' +
        '<div style="text-align:center;flex-shrink:0;"><div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">CANT</div>' +
          '<div style="display:flex;align-items:center;gap:2px;">' +
            '<button onclick="TicketsModule._editItem('+id+','+i+',\'qty\','+(item.qty-1)+')" style="width:24px;height:24px;border:1.5px solid var(--gray-200);border-radius:5px;background:var(--gray-50);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">-</button>' +
            '<input type="number" min="1" value="'+item.qty+'" onchange="TicketsModule._editItem('+id+','+i+',\'qty\',parseInt(this.value)||1)" style="width:40px;height:24px;border:1.5px solid var(--accent);border-radius:5px;text-align:center;font-weight:900;font-size:13px;color:var(--accent);"/>' +
            '<button onclick="TicketsModule._editItem('+id+','+i+',\'qty\','+(item.qty+1)+')" style="width:24px;height:24px;border:1.5px solid var(--gray-200);border-radius:5px;background:var(--gray-50);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">+</button>' +
          '</div></div>' +
        '<div style="text-align:center;flex-shrink:0;min-width:85px;"><div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">PRECIO</div>' +
          '<div style="display:flex;align-items:center;gap:2px;"><span style="font-size:10px;color:var(--gray-400);">S/</span>' +
            '<input type="number" min="0" step="0.01" value="'+item.precio.toFixed(2)+'" onchange="TicketsModule._editItem('+id+','+i+',\'precio\',parseFloat(this.value)||0)" style="width:65px;height:24px;border:1.5px solid var(--gray-200);border-radius:5px;padding:0 4px;font-size:12px;font-weight:800;text-align:center;"/>' +
          '</div></div>' +
        '<div style="text-align:center;flex-shrink:0;min-width:80px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:8px;padding:5px 8px;">' +
          '<div style="font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:1px;">TOTAL</div>' +
          '<div style="font-size:15px;font-weight:900;color:var(--accent);">S/ '+item.total.toFixed(2)+'</div>' +
        '</div>' +
        '<button onclick="TicketsModule._eliminarItemTicket('+id+','+i+')" style="width:30px;height:30px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-trash" style="font-size:11px;"></i></button>' +
      '</div>';
    }).join('');
    var total=v.items.reduce(function(s,i){ return s+i.total; },0);
    var subtotal=total/1.18, igv=total-subtotal;
    return (
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--gray-50);border-radius:10px;border:1.5px solid var(--gray-200);margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<button onclick="TicketsModule.ticketEditando=null;App.renderPage();" style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:7px;padding:7px 13px;font-weight:700;cursor:pointer;font-size:12px;"><i class="fas fa-arrow-left" style="margin-right:4px;"></i>Volver</button>' +
          '<div style="width:2px;height:22px;background:var(--gray-200);"></div>' +
          '<div><div style="font-size:15px;font-weight:900;">Editando: <span style="color:'+tClr+';">'+v.serie+'-'+v.numero+'</span></div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+v.fecha+' \u00b7 '+(cli?cli.nombre:'')+'</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:7px;">' +
          '<button onclick="TicketsModule.imprimirTicket('+id+')" style="background:var(--gray-100);color:var(--gray-600);border:none;border-radius:7px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:12px;"><i class="fas fa-print" style="margin-right:4px;"></i>Imprimir</button>' +
          '<button onclick="TicketsModule.guardarEdicion('+id+')" style="background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:8px;padding:8px 20px;font-weight:900;cursor:pointer;font-size:13px;box-shadow:0 3px 10px rgba(22,163,74,0.3);"><i class="fas fa-save" style="margin-right:4px;"></i>Guardar</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 320px;gap:12px;">' +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          '<div class="card"><div style="padding:11px 16px;border-bottom:1px solid var(--gray-200);font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:4px;"></i>Datos</div>' +
          '<div style="padding:11px 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">' +
            '<div><div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">TIPO</div><div style="padding:6px 9px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:6px;font-size:13px;font-weight:900;color:'+tClr+';">'+v.tipo+'</div></div>' +
            '<div><div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">N\u00daMERO</div><div style="padding:6px 9px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:6px;font-size:12px;font-weight:900;">'+v.serie+'-'+v.numero+'</div></div>' +
            '<div><div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">FECHA</div><input type="date" value="'+v.fecha+'" onchange="TicketsModule._editCampo('+id+',\'fecha\',this.value)" style="width:100%;padding:6px 7px;border:1.5px solid var(--gray-200);border-radius:6px;font-size:11px;box-sizing:border-box;"/></div>' +
            '<div><div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">CLIENTE</div><div style="padding:6px 9px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:6px;font-size:10px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(cli?cli.nombre:'N/A')+'</div></div>' +
          '</div></div>' +
          '<div class="card"><div style="padding:11px 16px;border-bottom:1px solid var(--gray-200);font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-tshirt" style="color:var(--accent);margin-right:4px;"></i>Prendas <span style="background:var(--accent);color:white;font-size:9px;padding:1px 6px;border-radius:9px;margin-left:3px;">'+v.items.length+'</span></div>' +
          '<div style="padding:8px;">'+itemsHTML+'</div></div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          '<div class="card"><div style="padding:11px 14px;border-bottom:1px solid var(--gray-200);font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-credit-card" style="color:var(--accent);margin-right:4px;"></i>M\u00e9todo de Pago</div>' +
          '<div style="padding:8px 12px;display:flex;flex-direction:column;gap:5px;">' +
          [{val:'EFECTIVO',icon:'fa-money-bill-wave',color:'#16a34a',label:'Efectivo'},
           {val:'TARJETA', icon:'fa-credit-card',    color:'#2563eb',label:'Tarjeta'},
           {val:'YAPE',    icon:'fa-mobile-alt',     color:'#7c3aed',label:'Yape/Plin'},
           {val:'TRANSFERENCIA',icon:'fa-university',color:'#0ea5e9',label:'Transferencia'}
          ].map(function(m){
            var a=v.metodo_pago===m.val;
            return '<button onclick="TicketsModule._editCampo('+id+',\'metodo_pago\',\''+m.val+'\')" ' +
              'style="display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:7px;' +
              'border:2px solid '+(a?m.color:'var(--gray-200)')+';background:'+(a?m.color+'15':'transparent')+';cursor:pointer;">' +
              '<div style="width:26px;height:26px;border-radius:6px;background:'+(a?m.color:'var(--gray-100)')+';display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas '+m.icon+'" style="font-size:12px;color:'+(a?'white':m.color)+';"></i></div>' +
              '<span style="font-size:12px;font-weight:800;color:'+(a?m.color:'var(--gray-600)')+';">'+m.label+'</span>' +
              (a?'<i class="fas fa-check-circle" style="margin-left:auto;color:'+m.color+';"></i>':'') +
            '</button>';
          }).join('') +
          '</div></div>' +
          '<div class="card"><div style="padding:11px 14px;border-bottom:1px solid var(--gray-200);font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas fa-receipt" style="color:var(--accent);margin-right:4px;"></i>Resumen</div>' +
          '<div style="padding:14px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:7px;"><span style="font-size:13px;color:var(--gray-500);">Subtotal:</span><span style="font-size:15px;font-weight:900;">S/ '+subtotal.toFixed(2)+'</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:2px solid var(--gray-200);"><span style="font-size:13px;color:var(--gray-500);">IGV (18%):</span><span style="font-size:15px;font-weight:900;">S/ '+igv.toFixed(2)+'</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:12px 14px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:9px;color:white;margin-bottom:10px;">' +
              '<span style="font-size:16px;font-weight:900;">TOTAL</span><span style="font-size:24px;font-weight:900;">S/ '+total.toFixed(2)+'</span>' +
            '</div>' +
            '<button onclick="TicketsModule.guardarEdicion('+id+')" style="width:100%;padding:11px;background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:9px;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 3px 10px rgba(22,163,74,0.4);display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:6px;">' +
              '<i class="fas fa-save" style="font-size:15px;"></i>GUARDAR CAMBIOS</button>' +
            '<button onclick="TicketsModule.imprimirTicket('+id+')" style="width:100%;padding:9px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;">' +
              '<i class="fas fa-print"></i>Imprimir</button>' +
          '</div></div>' +
        '</div>' +
      '</div>'
    );
  },

  _editItem(ventaId,idx,campo,valor){
    var v=DB.ventas.find(function(x){return x.id===ventaId;});
    if(!v||!v.items[idx]) return;
    v.items[idx][campo]=valor;
    v.items[idx].total=v.items[idx].qty*v.items[idx].precio;
    var total=v.items.reduce(function(s,i){return s+i.total;},0);
    v.total=total; v.subtotal=total/1.18; v.igv=total-v.subtotal;
    App.renderPage();
  },

  _eliminarItemTicket(ventaId,idx){
    var v=DB.ventas.find(function(x){return x.id===ventaId;});
    if(!v) return;
    if(v.items.length<=1){App.toast('El ticket debe tener al menos 1 producto','error');return;}
    if(!confirm('\u00bfEliminar este producto del ticket?')) return;
    v.items.splice(idx,1);
    var total=v.items.reduce(function(s,i){return s+i.total;},0);
    v.total=total; v.subtotal=total/1.18; v.igv=total-v.subtotal;
    App.renderPage();
  },

  _editCampo(ventaId,campo,valor){
    var v=DB.ventas.find(function(x){return x.id===ventaId;});
    if(!v) return; v[campo]=valor; App.renderPage();
  },

  guardarEdicion(id){
    Storage.guardarVentas();
    App.toast('\u2705 Ticket guardado','success');
    this.ticketEditando=null; App.renderPage();
  },

  verDetalle(id){
    var v=DB.ventas.find(function(x){return x.id===id;}); if(!v) return;
    var cli=DB.clientes.find(function(c){return c.id===v.cliente_id;});
    var tClr=v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
    var eBg=v.estado==='ACEPTADO'?'#dcfce7':v.estado==='ANULADO'?'#fee2e2':'#fef3c7';
    var eClr=v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706';
    App.showModal('\ud83c\udfab '+v.serie+'-'+v.numero,
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<div><div style="font-size:15px;font-weight:900;color:'+tClr+';">'+(v.tipo_comprobante||v.tipo)+'</div><div style="font-size:11px;color:var(--gray-400);">'+v.fecha+' '+v.hora+'</div></div>' +
        '<span style="padding:4px 11px;border-radius:20px;font-size:11px;font-weight:800;background:'+eBg+';color:'+eClr+';">'+v.estado+'</span>' +
      '</div>' +
      '<div style="background:var(--gray-50);padding:8px 12px;border-radius:7px;margin-bottom:11px;"><div style="font-weight:700;">'+(cli?cli.nombre:'N/A')+'</div><div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div></div>' +
      '<table class="data-table"><thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead><tbody>' +
      v.items.map(function(i){return '<tr><td>'+i.nombre+'</td><td>'+i.qty+'</td><td>S/ '+i.precio.toFixed(2)+'</td><td><strong>S/ '+i.total.toFixed(2)+'</strong></td></tr>';}).join('') +
      '</tbody></table>' +
      '<div style="margin-top:11px;border-top:1px solid var(--gray-200);padding-top:11px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>Subtotal:</span><span>S/ '+v.subtotal.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span>IGV 18%:</span><span>S/ '+v.igv.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:19px;font-weight:900;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:9px 13px;border-radius:8px;">' +
          '<span>TOTAL</span><span>S/ '+v.total.toFixed(2)+'</span></div>' +
        '<div style="margin-top:6px;font-size:11px;color:var(--gray-500);">M\u00e9todo: <strong>'+v.metodo_pago+'</strong> &middot; Pag\u00f3: <strong>S/ '+v.monto_pago.toFixed(2)+'</strong> &middot; Vuelto: <strong>S/ '+v.vuelto.toFixed(2)+'</strong></div>' +
      '</div>',
      [{text:'\u270f\ufe0f Editar',   cls:'btn-outline', cb:function(){App.closeModal();TicketsModule.editarTicket(id);}},
       {text:'\ud83d\udda8\ufe0f Imprimir', cls:'btn-primary', cb:function(){TicketsModule.imprimirTicket(id);App.closeModal();}}]
    );
    document.getElementById('modalBox').style.maxWidth='520px';
  },

  enviarSunat(id){
    App.toast('Enviando a SUNAT...','info');
    setTimeout(function(){
      var i=DB.ventas.findIndex(function(x){return x.id===id;});
      if(i>=0){DB.ventas[i].estado='ACEPTADO';Storage.guardarVentas();}
      App.toast('\u2705 Aceptado por SUNAT','success');App.renderPage();
    },1500);
  },

  anularTicket(id){
    if(!confirm('\u00bfAnular este ticket? Se devolver\u00e1 el stock.')) return;
    var i=DB.ventas.findIndex(function(x){return x.id===id;}); if(i<0) return;
    DB.ventas[i].estado='ANULADO';
    DB.ventas[i].items.forEach(function(item){
      var pi=DB.productos.findIndex(function(p){return p.id===item.prod_id;});
      if(pi>=0) DB.productos[pi].stock+=item.qty;
    });
    Storage.guardarVentas();Storage.guardarProductos();
    App.toast('Ticket anulado','warning');App.renderPage();
  },

  exportarCSV(){
    var f=this.getFiltered();
    var h='Fecha,Hora,Serie,Numero,Tipo,Cliente,Items,Total,Estado,Metodo\n';
    var r=f.map(function(v){
      var cli=DB.clientes.find(function(c){return c.id===v.cliente_id;});
      var items=v.items.map(function(i){return i.nombre+'x'+i.qty;}).join('|');
      return v.fecha+','+v.hora+','+v.serie+','+v.numero+','+v.tipo+',"'+(cli?cli.nombre:'')+'","'+items+'",'+v.total.toFixed(2)+','+v.estado+','+v.metodo_pago;
    }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+h+r],{type:'text/csv;charset=utf-8;'}));
    a.download='tickets_magama_'+(new Date().toISOString().slice(0,10))+'.csv';
    a.click(); URL.revokeObjectURL(a.href);
    App.toast(f.length+' tickets exportados','success');
  },

  getFiltered(){
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

  limpiarFiltros(){this.searchTerm='';this.tipoFilter='todos';this.estadoFilter='todos';this.fechaInicio='';this.fechaFin='';this.currentPage=1;App.renderPage();},
  formatFecha(f){if(!f)return '';var p=f.split('-');return p[2]+'/'+p[1]+'/'+p[0];},
  toggleMenu(id){document.querySelectorAll('.action-menu').forEach(function(m){if(m.id!=='menu-ticket-'+id)m.classList.add('hidden');});var el=document.getElementById('menu-ticket-'+id);if(el)el.classList.toggle('hidden');}
};
