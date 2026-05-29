// ============================================================
// MÓDULO: CUPONES DE DESCUENTO — MAGAMA ERP
// Sistema profesional de cupones para fidelización de clientes
// ============================================================

const CuponesModule = {

  searchTerm:   '',
  estadoFilter: 'todos',
  currentPage:  1,
  itemsPerPage: 15,

  // ─────────────────────────────────────────────────────────
  // DATOS
  // ─────────────────────────────────────────────────────────
  _getCupones() {
    try { return JSON.parse(localStorage.getItem('magama_cupones') || '[]'); } catch(e){ return []; }
  },

  _saveCupones(cupones) {
    localStorage.setItem('magama_cupones', JSON.stringify(cupones));
  },

  _fechaLocal() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },

  _formatFecha(f) {
    if (!f) return '—';
    var p = f.split('-');
    return p[2]+'/'+p[1]+'/'+p[0];
  },

  _fechaMas(dias) {
    var d = new Date();
    d.setDate(d.getDate() + dias);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },

  _generarCodigo() {
    var chars   = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var cupones = this._getCupones();
    var codigo;
    do {
      var p1='', p2='';
      for(var i=0;i<4;i++) p1+=chars.charAt(Math.floor(Math.random()*chars.length));
      for(var j=0;j<4;j++) p2+=chars.charAt(Math.floor(Math.random()*chars.length));
      codigo = 'MAG-'+p1+'-'+p2;
    } while(cupones.find(function(c){ return c.codigo===codigo; }));
    return codigo;
  },

  // ─────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────
  render() {
    App.setTabs2('Cupones de Descuento', 'CUPONES');
    var self    = this;
    var cupones = this._getCupones();
    var hoy     = this._fechaLocal();

    // Auto-expirar
    var changed = false;
    cupones.forEach(function(c) {
      if (c.estado === 'ACTIVO' && c.fecha_expiracion && c.fecha_expiracion < hoy) {
        c.estado = 'EXPIRADO'; changed = true;
      }
    });
    if (changed) this._saveCupones(cupones);

    // Filtrar
    var filtered = cupones.filter(function(c) {
      var mE = self.estadoFilter === 'todos' || c.estado === self.estadoFilter;
      var q  = self.searchTerm.toLowerCase();
      var mS = !q || c.codigo.toLowerCase().includes(q) || (c.cliente_nombre||'').toLowerCase().includes(q) || (c.nota||'').toLowerCase().includes(q);
      return mE && mS;
    });

    var totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    var page       = Math.min(this.currentPage, totalPages);
    var paged      = filtered.slice((page-1)*this.itemsPerPage, page*this.itemsPerPage);

    var activos   = cupones.filter(function(c){ return c.estado==='ACTIVO';   }).length;
    var usados    = cupones.filter(function(c){ return c.estado==='USADO';    }).length;
    var expirados = cupones.filter(function(c){ return c.estado==='EXPIRADO'; }).length;
    var anulados  = cupones.filter(function(c){ return c.estado==='ANULADO';  }).length;
    var ahorroGen = cupones.filter(function(c){ return c.estado==='USADO'; })
                           .reduce(function(s,c){ return s + (c.ahorro_generado||0); }, 0);

    // ── STATS ──
    var statsBar = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {l:'Total Cupones', v:cupones.length,              c:'#2563eb',bg:'#eff6ff',i:'fa-ticket-alt',   f:'todos'},
        {l:'Activos',       v:activos,                     c:'#16a34a',bg:'#f0fdf4',i:'fa-check-circle', f:'ACTIVO'},
        {l:'Usados',        v:usados,                      c:'#7c3aed',bg:'#f5f3ff',i:'fa-shopping-bag', f:'USADO'},
        {l:'Expirados',     v:expirados,                   c:'#d97706',bg:'#fffbeb',i:'fa-clock',        f:'EXPIRADO'},
        {l:'Ahorro Cliente',v:'S/ '+ahorroGen.toFixed(2), c:'#ea580c',bg:'#fff7ed',i:'fa-gift',         f:'USADO'},
      ].map(function(k){
        return '<div onclick="CuponesModule.estadoFilter=\''+k.f+'\';CuponesModule.currentPage=1;App.renderPage();" style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid '+(self.estadoFilter===k.f?k.c:'var(--gray-200)')+';display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.borderColor=\''+k.c+'\'" onmouseout="this.style.borderColor=\''+(self.estadoFilter===k.f?k.c:'var(--gray-200)')+'\'">'+
          '<div style="width:38px;height:38px;border-radius:10px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas '+k.i+'"></i></div>'+
          '<div><div style="font-size:18px;font-weight:900;color:'+k.c+';">'+k.v+'</div><div style="font-size:10px;color:var(--gray-400);">'+k.l+'</div></div>'+
        '</div>';
      }).join('') + '</div>';

    // ── TABLA ──
    var filas = paged.length===0 ?
      '<tr><td colspan="7"><div style="text-align:center;padding:70px 20px;color:var(--gray-400);">'+
        '<div style="font-size:64px;margin-bottom:16px;">🎟️</div>'+
        '<div style="font-size:16px;font-weight:700;margin-bottom:8px;">'+
          (self.searchTerm||self.estadoFilter!=='todos' ? 'Sin resultados para esta búsqueda' : 'No hay cupones aún')+
        '</div>'+
        '<div style="font-size:13px;margin-bottom:20px;max-width:360px;margin-left:auto;margin-right:auto;">'+
          (self.searchTerm||self.estadoFilter!=='todos' ? 'Prueba con otros filtros.' : 'Crea tu primer cupón y empieza a atraer más clientes con descuentos exclusivos.')+
        '</div>'+
        (!self.searchTerm&&self.estadoFilter==='todos'?'<button onclick="CuponesModule.crearCupon()" style="padding:11px 26px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:7px;"></i>Crear Primer Cupón</button>':'')+
      '</div></td></tr>' :
      paged.map(function(c){
        var estColor = c.estado==='ACTIVO'?'#16a34a':c.estado==='USADO'?'#7c3aed':c.estado==='EXPIRADO'?'#d97706':'#dc2626';
        var estBg    = c.estado==='ACTIVO'?'#f0fdf4':c.estado==='USADO'?'#f5f3ff':c.estado==='EXPIRADO'?'#fffbeb':'#fef2f2';
        var estIcon  = c.estado==='ACTIVO'?'fa-check-circle':c.estado==='USADO'?'fa-check-double':c.estado==='EXPIRADO'?'fa-clock':'fa-ban';
        var venceClr = (c.fecha_expiracion && c.fecha_expiracion < hoy && c.estado==='ACTIVO') ? '#dc2626' : 'var(--gray-700)';

        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">'+
          '<td style="padding:13px 16px;">'+
            '<div style="font-family:monospace;font-size:15px;font-weight:900;color:var(--accent);letter-spacing:2px;">'+c.codigo+'</div>'+
            '<div style="font-size:10px;color:var(--gray-400);margin-top:3px;"><i class="fas fa-calendar-plus" style="margin-right:3px;"></i>'+self._formatFecha(c.fecha_creacion)+'</div>'+
            (c.nota?'<div style="font-size:10px;color:#d97706;margin-top:2px;"><i class="fas fa-tag" style="margin-right:3px;"></i>'+c.nota+'</div>':'')+
          '</td>'+
          '<td style="padding:13px 8px;">'+
            '<div style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;border:1px solid #fed7aa;">'+
              '<span style="font-size:18px;font-weight:900;color:#ea580c;">'+c.descuento+'%</span>'+
              '<span style="font-size:11px;color:#ea580c;font-weight:700;">OFF</span>'+
            '</div>'+
            '<div style="font-size:11px;color:var(--gray-400);margin-top:5px;">'+
              (c.min_compra>0?'<i class="fas fa-shopping-cart" style="margin-right:3px;"></i>Mín S/ '+c.min_compra.toFixed(2):'<i class="fas fa-infinity" style="margin-right:3px;"></i>Sin mínimo')+
            '</div>'+
          '</td>'+
          '<td style="padding:13px 8px;">'+
            (c.cliente_nombre?
              '<div style="font-size:13px;font-weight:700;">'+c.cliente_nombre+'</div>'+
              '<div style="font-size:11px;color:var(--gray-400);">Cliente asignado</div>' :
              '<span style="font-size:12px;color:var(--gray-400);font-style:italic;">Sin asignar</span>'
            )+
          '</td>'+
          '<td style="padding:13px 8px;">'+
            (c.fecha_expiracion?
              '<div style="font-size:13px;font-weight:700;color:'+venceClr+';">'+self._formatFecha(c.fecha_expiracion)+'</div>'+
              (c.fecha_expiracion < hoy && c.estado==='ACTIVO'?'<div style="font-size:10px;color:#dc2626;font-weight:700;">¡Vencido hoy!</div>':''):
              '<span style="font-size:12px;color:var(--gray-400);">Sin vencimiento</span>'
            )+
          '</td>'+
          '<td style="padding:13px 8px;">'+
            '<span style="padding:5px 13px;border-radius:20px;font-size:11px;font-weight:800;background:'+estBg+';color:'+estColor+';display:inline-flex;align-items:center;gap:5px;">'+
              '<i class="fas '+estIcon+'" style="font-size:9px;"></i>'+c.estado+
            '</span>'+
          '</td>'+
          '<td style="padding:13px 8px;font-size:12px;color:var(--gray-500);">'+
            (c.estado==='USADO'?
              '<div style="font-size:11px;font-weight:700;color:#7c3aed;">'+self._formatFecha(c.fecha_uso)+'</div>'+
              (c.venta_serie?'<div style="font-size:10px;color:var(--gray-400);">'+c.venta_serie+'-'+c.venta_numero+'</div>':''):
              '<span style="color:var(--gray-300);">—</span>'
            )+
          '</td>'+
          '<td style="padding:13px 16px;">'+
            '<div style="display:flex;gap:4px;">'+
              '<button onclick="CuponesModule.verDetalle(\''+c.id+'\')" title="Ver detalle" style="width:30px;height:30px;border-radius:7px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:12px;"><i class="fas fa-eye"></i></button>'+
              (c.estado==='ACTIVO'?
                '<button onclick="CuponesModule.enviarWA(\''+c.id+'\')" title="Enviar por WhatsApp" style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:13px;"><i class="fab fa-whatsapp"></i></button>'+
                '<button onclick="CuponesModule.imprimirCupon(\''+c.id+'\')" title="Imprimir" style="width:30px;height:30px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:12px;"><i class="fas fa-print"></i></button>'+
                '<button onclick="CuponesModule.anular(\''+c.id+'\')" title="Anular" style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:12px;"><i class="fas fa-ban"></i></button>'
                : ''
              )+
            '</div>'+
          '</td>'+
        '</tr>';
      }).join('');

    var paginacion = totalPages<=1?'':
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--gray-200);">'+
        '<span style="font-size:12px;color:var(--gray-400);">'+Math.min((page-1)*this.itemsPerPage+1,filtered.length)+'–'+Math.min(page*this.itemsPerPage,filtered.length)+' de '+filtered.length+' cupones</span>'+
        '<div style="display:flex;gap:4px;">'+
          '<button onclick="CuponesModule.currentPage=1;App.renderPage()" '+(page===1?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">«</button>'+
          '<button onclick="CuponesModule.currentPage--;App.renderPage()" '+(page===1?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">‹</button>'+
          '<button onclick="CuponesModule.currentPage++;App.renderPage()" '+(page===totalPages?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">›</button>'+
          '<button onclick="CuponesModule.currentPage='+totalPages+';App.renderPage()" '+(page===totalPages?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">»</button>'+
        '</div>'+
      '</div>';

    return '<div class="page-header"><div>'+
        '<h2 class="page-title"><i class="fas fa-ticket-alt" style="color:var(--accent);margin-right:8px;"></i>Cupones de Descuento</h2>'+
        '<p class="text-muted text-sm">Genera cupones únicos para fidelizar y atraer más clientes</p>'+
      '</div><div class="page-actions">'+
      '<button onclick="CuponesModule.abrirGeneradorCodigos()" style="padding:9px 16px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-barcode" style="margin-right:5px;color:#2563eb;"></i>Generador de Códigos</button>'+
        '<button onclick="CuponesModule.generarMasivo()" style="padding:9px 16px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-layer-group" style="margin-right:5px;color:#7c3aed;"></i>Generar Masivo</button>'+
        '<button onclick="CuponesModule.crearCupon()" style="padding:9px 20px;background:var(--accent);color:white;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nuevo Cupón</button>'+
      '</div></div>'+
      statsBar+
      '<div class="card">'+
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;gap:10px;align-items:center;flex-wrap:wrap;">'+
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
            [['todos','🎟️ Todos'],['ACTIVO','✅ Activos'],['USADO','🛍️ Usados'],['EXPIRADO','⏰ Expirados'],['ANULADO','🚫 Anulados']].map(function(e){
              var act = self.estadoFilter===e[0];
              return '<button onclick="CuponesModule.estadoFilter=\''+e[0]+'\';CuponesModule.currentPage=1;App.renderPage()" style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-600)')+';">'+e[1]+'</button>';
            }).join('')+
          '</div>'+
          '<div style="flex:1;min-width:200px;position:relative;">'+
            '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>'+
            '<input type="text" placeholder="Buscar código, cliente o nota..." value="'+this.searchTerm+'" oninput="CuponesModule.searchTerm=this.value;CuponesModule.currentPage=1;App.renderPage()" style="width:100%;padding:7px 10px 7px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;"/>'+
          '</div>'+
        '</div>'+
        '<div style="overflow-x:auto;">'+
          '<table style="width:100%;border-collapse:collapse;">'+
            '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">'+
              '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Código</th>'+
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Descuento</th>'+
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cliente</th>'+
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Vence</th>'+
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>'+
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Usado en</th>'+
              '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>'+
            '</tr></thead>'+
            '<tbody>'+filas+'</tbody>'+
          '</table>'+
        '</div>'+
        paginacion+
      '</div>';
  },

  // ─────────────────────────────────────────────────────────
  // CREAR CUPÓN
  // ─────────────────────────────────────────────────────────
  crearCupon() {
    var codigo   = this._generarCodigo();
    var vence30  = this._fechaMas(30);
    var hoy      = this._fechaLocal();
    var clientes = (DB.clientes||[]).filter(function(c){ return c.tipo_cliente==='cliente' && c.doc!=='00000000'; });

    App.showModal('🎟️ Nuevo Cupón de Descuento',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'+
        // Código
        '<div style="grid-column:1/-1;">'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Código del Cupón</label>'+
          '<div style="display:flex;gap:8px;align-items:center;">'+
            '<div id="cupon_disp" style="flex:1;padding:14px 18px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;font-family:monospace;font-size:22px;font-weight:900;color:white;letter-spacing:4px;text-align:center;">'+codigo+'</div>'+
            '<button onclick="CuponesModule._regen()" title="Generar nuevo código" style="width:48px;height:48px;border:2px solid var(--gray-200);border-radius:10px;background:white;cursor:pointer;font-size:16px;color:var(--gray-600);"><i class="fas fa-sync-alt"></i></button>'+
          '</div>'+
          '<input type="hidden" id="cupon_codigo" value="'+codigo+'"/>'+
        '</div>'+
        // Descuento
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Descuento</label>'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
            '<input type="number" id="cupon_dcto" value="20" min="1" max="100" style="flex:1;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:26px;font-weight:900;text-align:center;color:#ea580c;outline:none;"/>'+
            '<span style="font-size:30px;font-weight:900;color:#ea580c;">%</span>'+
          '</div>'+
          '<div style="display:flex;gap:4px;">'+
            [10,15,20,25,30,50].map(function(p){ return '<button onclick="document.getElementById(\'cupon_dcto\').value='+p+'" style="flex:1;padding:5px 0;background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">'+p+'%</button>'; }).join('')+
          '</div>'+
        '</div>'+
        // Mínimo
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Compra Mínima (S/)</label>'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
            '<span style="font-size:18px;font-weight:700;color:var(--gray-400);">S/</span>'+
            '<input type="number" id="cupon_min" value="50" min="0" step="0.01" style="flex:1;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:26px;font-weight:900;text-align:center;outline:none;"/>'+
          '</div>'+
          '<div style="display:flex;gap:4px;">'+
            [0,30,50,100,150].map(function(p){ return '<button onclick="document.getElementById(\'cupon_min\').value='+p+'" style="flex:1;padding:5px 0;background:var(--gray-50);color:var(--gray-600);border:1px solid var(--gray-200);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">'+(p===0?'Ninguno':'S/'+p)+'</button>'; }).join('')+
          '</div>'+
        '</div>'+
        // Vencimiento
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Vence el</label>'+
          '<input type="date" id="cupon_vence" value="'+vence30+'" min="'+hoy+'" style="width:100%;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:8px;"/>'+
          '<div style="display:flex;gap:4px;">'+
            [['7','7d'],['15','15d'],['30','1 mes'],['60','2 mes'],['90','3 mes']].map(function(d){
              var f = CuponesModule._fechaMas(parseInt(d[0]));
              return '<button onclick="document.getElementById(\'cupon_vence\').value=\''+f+'\'" style="flex:1;padding:5px 0;background:var(--gray-50);color:var(--gray-600);border:1px solid var(--gray-200);border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;">'+d[1]+'</button>';
            }).join('')+
          '</div>'+
        '</div>'+
        // Cliente
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Asignar a Cliente (opcional)</label>'+
          '<select id="cupon_cli" style="width:100%;padding:10px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:13px;background:white;outline:none;">'+
            '<option value="">— Cualquier cliente —</option>'+
            clientes.map(function(c){ return '<option value="'+c.id+'">'+c.nombre+' · '+c.doc+'</option>'; }).join('')+
          '</select>'+
        '</div>'+
        // Nota
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Nota / Campaña</label>'+
          '<input type="text" id="cupon_nota" placeholder="Ej: Promo mayo, Día de la Madre..." style="width:100%;padding:10px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>'+
        '</div>'+
      '</div>',
      [
        {text:'Cancelar',      cls:'btn-outline',  cb: function(){ App.closeModal(); }},
        {text:'🎟️ Crear Cupón',cls:'btn-success',  cb: function(){ CuponesModule._guardarCupon(); }}
      ]
    );
    document.getElementById('modalBox').style.maxWidth='560px';
  },

  _regen() {
    var nuevo = this._generarCodigo();
    var inp = document.getElementById('cupon_codigo');
    var disp = document.getElementById('cupon_disp');
    if(inp)  inp.value      = nuevo;
    if(disp) disp.textContent = nuevo;
  },

  _guardarCupon() {
    var codigo    = (document.getElementById('cupon_codigo')?.value||'').trim() || this._generarCodigo();
    var descuento = parseFloat(document.getElementById('cupon_dcto')?.value)||20;
    var minCompra = parseFloat(document.getElementById('cupon_min')?.value)||0;
    var vence     = document.getElementById('cupon_vence')?.value||'';
    var cliId     = document.getElementById('cupon_cli')?.value||'';
    var nota      = (document.getElementById('cupon_nota')?.value||'').trim();

    if(descuento<1||descuento>100){ App.toast('El descuento debe ser entre 1% y 100%','error'); return; }

    var cli = cliId ? (DB.clientes||[]).find(function(c){ return String(c.id)===String(cliId); }) : null;
    var cupones = this._getCupones();

    cupones.unshift({
      id:              String(Date.now()),
      codigo, descuento,
      min_compra:      minCompra,
      fecha_expiracion:vence,
      fecha_creacion:  this._fechaLocal(),
      cliente_id:      cli ? cli.id : null,
      cliente_nombre:  cli ? cli.nombre : '',
      nota,
      estado:          'ACTIVO',
      fecha_uso:       null,
      venta_id:        null,
      venta_serie:     null,
      venta_numero:    null,
      ahorro_generado: 0,
    });

    this._saveCupones(cupones);
    App.closeModal();
    App.toast('🎟️ Cupón '+codigo+' creado exitosamente','success');
    App.renderPage();
  },

  // ─────────────────────────────────────────────────────────
  // GENERAR MASIVO
  // ─────────────────────────────────────────────────────────
  generarMasivo() {
    var hoy = this._fechaLocal();
    App.showModal('⚡ Generar Cupones Masivos',
      '<div style="background:linear-gradient(135deg,#f0fdf4,#eff6ff);border-radius:12px;padding:16px;text-align:center;margin-bottom:16px;">'+
        '<i class="fas fa-layer-group" style="font-size:36px;color:#7c3aed;display:block;margin-bottom:8px;"></i>'+
        '<div style="font-size:15px;font-weight:800;color:var(--gray-800);">Generar múltiples cupones a la vez</div>'+
        '<div style="font-size:12px;color:var(--gray-500);">Ideal para campañas, repartir en tienda o eventos especiales</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'+
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Cantidad (máx 100)</label>'+
          '<input type="number" id="m_cant" value="10" min="1" max="100" style="width:100%;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:24px;font-weight:900;text-align:center;outline:none;box-sizing:border-box;"/>'+
        '</div>'+
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Descuento %</label>'+
          '<input type="number" id="m_dcto" value="20" min="1" max="100" style="width:100%;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:24px;font-weight:900;text-align:center;color:#ea580c;outline:none;box-sizing:border-box;"/>'+
        '</div>'+
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Compra mínima S/</label>'+
          '<input type="number" id="m_min" value="50" min="0" step="0.01" style="width:100%;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:24px;font-weight:900;text-align:center;outline:none;box-sizing:border-box;"/>'+
        '</div>'+
        '<div>'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Vence el</label>'+
          '<input type="date" id="m_vence" value="'+this._fechaMas(30)+'" min="'+hoy+'" style="width:100%;padding:12px;border:2px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>'+
        '</div>'+
        '<div style="grid-column:1/-1;">'+
          '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;">Nota / Campaña</label>'+
          '<input type="text" id="m_nota" placeholder="Ej: Campaña Día de la Madre, Promo Junio 2026..." style="width:100%;padding:10px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>'+
        '</div>'+
      '</div>',
      [
        {text:'Cancelar', cls:'btn-outline', cb:function(){ App.closeModal(); }},
        {text:'⚡ Generar Cupones', cls:'btn-success', cb:function(){
          var cant  = Math.min(100,Math.max(1,parseInt(document.getElementById('m_cant')?.value)||10));
          var dcto  = parseFloat(document.getElementById('m_dcto')?.value)||20;
          var min   = parseFloat(document.getElementById('m_min')?.value)||0;
          var vence = document.getElementById('m_vence')?.value||'';
          var nota  = (document.getElementById('m_nota')?.value||'').trim();
          if(dcto<1||dcto>100){ App.toast('Descuento entre 1 y 100%','error'); return; }
          var cupones = CuponesModule._getCupones();
          var hoy2    = CuponesModule._fechaLocal();
          for(var k=0;k<cant;k++){
            cupones.unshift({
              id: String(Date.now()+k),
              codigo: CuponesModule._generarCodigo(),
              descuento: dcto, min_compra: min,
              fecha_expiracion: vence, fecha_creacion: hoy2,
              cliente_id: null, cliente_nombre: '', nota,
              estado: 'ACTIVO', fecha_uso: null,
              venta_id: null, venta_serie: null, venta_numero: null, ahorro_generado: 0,
            });
          }
          CuponesModule._saveCupones(cupones);
          App.closeModal();
          App.toast('⚡ '+cant+' cupones generados exitosamente','success');
          App.renderPage();
        }}
      ]
    );
    document.getElementById('modalBox').style.maxWidth='500px';
  },

  // ─────────────────────────────────────────────────────────
  // VER DETALLE
  // ─────────────────────────────────────────────────────────
  verDetalle(id) {
    var cupones = this._getCupones();
    var c = cupones.find(function(x){ return x.id===id; });
    if(!c) return;
    var cli      = c.cliente_id ? (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; }) : null;
    var estColor = c.estado==='ACTIVO'?'#16a34a':c.estado==='USADO'?'#7c3aed':c.estado==='EXPIRADO'?'#d97706':'#dc2626';
    var telPre   = cli&&cli.telefono ? cli.telefono.replace(/\D/g,'') : '';

    App.showModal('🎟️ Detalle del Cupón',
      // Vista del cupón físico
      '<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:16px;padding:24px;text-align:center;color:white;margin-bottom:16px;position:relative;overflow:hidden;">'+
        '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>'+
        '<div style="position:absolute;bottom:-30px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>'+
        '<div style="font-size:11px;font-weight:700;opacity:0.7;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;">'+(DB.empresa?.nombre||'MAGAMA')+'</div>'+
        '<div style="font-size:12px;font-weight:700;opacity:0.8;letter-spacing:1px;margin-bottom:10px;">CUPÓN DE DESCUENTO</div>'+
        '<div style="font-family:monospace;font-size:22px;font-weight:900;letter-spacing:4px;background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:8px;display:inline-block;margin-bottom:12px;">'+c.codigo+'</div>'+
        '<div style="font-size:56px;font-weight:900;line-height:1;margin-bottom:4px;">'+c.descuento+'%</div>'+
        '<div style="font-size:16px;opacity:0.9;font-weight:700;">DE DESCUENTO</div>'+
        (c.min_compra>0?'<div style="font-size:12px;opacity:0.7;margin-top:6px;">En compras mayores a S/ '+c.min_compra.toFixed(2)+'</div>':'')+
        (c.fecha_expiracion?'<div style="font-size:11px;opacity:0.65;margin-top:4px;">Válido hasta: '+this._formatFecha(c.fecha_expiracion)+'</div>':'')+
      '</div>'+
      // Info
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">'+
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Estado</div><div style="font-size:13px;font-weight:800;color:'+estColor+';">'+c.estado+'</div></div>'+
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Creado</div><div style="font-size:13px;font-weight:700;">'+this._formatFecha(c.fecha_creacion)+'</div></div>'+
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Cliente</div><div style="font-size:12px;font-weight:700;">'+(cli?cli.nombre:'Sin asignar')+'</div></div>'+
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Vencimiento</div><div style="font-size:12px;font-weight:700;">'+(c.fecha_expiracion?this._formatFecha(c.fecha_expiracion):'Sin vencimiento')+'</div></div>'+
      '</div>'+
      (c.nota?'<div style="padding:10px 14px;background:#fffbeb;border-radius:8px;font-size:12px;color:#92400e;margin-bottom:12px;"><i class="fas fa-tag" style="margin-right:6px;"></i>'+c.nota+'</div>':'')+
      (c.estado==='USADO'?
        '<div style="padding:12px;background:#f5f3ff;border-radius:10px;font-size:12px;color:#7c3aed;margin-bottom:12px;">'+
          '<i class="fas fa-check-double" style="margin-right:6px;"></i>Usado el '+this._formatFecha(c.fecha_uso)+(c.venta_serie?' · '+c.venta_serie+'-'+c.venta_numero:'')+
        '</div>':''
      )+
      // WhatsApp rápido
      (c.estado==='ACTIVO'?
        '<div style="padding:12px 14px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;">'+
          '<div style="display:flex;align-items:center;gap:7px;margin-bottom:9px;"><i class="fab fa-whatsapp" style="font-size:16px;color:#16a34a;"></i><span style="font-size:11px;font-weight:800;color:#15803d;text-transform:uppercase;">Enviar por WhatsApp</span></div>'+
          '<div style="display:flex;align-items:center;gap:7px;">'+
            '<span style="padding:8px 10px;background:#dcfce7;border:2px solid #bbf7d0;border-radius:8px;font-size:13px;font-weight:800;color:#16a34a;white-space:nowrap;">+51</span>'+
            '<input type="tel" id="wa_det_tel" placeholder="987 654 321" maxlength="9" value="'+telPre+'" oninput="this.value=this.value.replace(/\\D/g,\'\')" style="flex:1;padding:8px 12px;border:2px solid #bbf7d0;border-radius:8px;font-size:15px;font-weight:700;outline:none;"/>'+
            '<button onclick="CuponesModule._enviarDesdeDetalle(\''+c.id+'\')" style="padding:8px 14px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;"><i class="fab fa-whatsapp" style="margin-right:4px;"></i>Enviar</button>'+
          '</div>'+
        '</div>':''
      ),
      [
        (c.estado==='ACTIVO'?{text:'🖨️ Imprimir', cls:'btn-primary', cb:function(){CuponesModule.imprimirCupon(c.id);}}:null),
        (c.estado==='ACTIVO'?{text:'🚫 Anular',   cls:'btn-danger',  cb:function(){App.closeModal();CuponesModule.anular(c.id);}}:null),
        {text:'Cerrar', cls:'btn-outline', cb:function(){App.closeModal();}},
      ].filter(Boolean)
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  _enviarDesdeDetalle(id) {
    var el  = document.getElementById('wa_det_tel');
    var num = el ? el.value.replace(/\D/g,'') : '';
    if(!num||num.length!==9){ App.toast('Ingresa los 9 dígitos del WhatsApp','error'); return; }
    var cupones = this._getCupones();
    var c = cupones.find(function(x){ return x.id===id; });
    if(!c) return;
    App.closeModal();
    this._abrirWACupon('51'+num, c);
  },

  // ─────────────────────────────────────────────────────────
  // ENVIAR POR WHATSAPP
  // ─────────────────────────────────────────────────────────
  enviarWA(id) {
    var cupones = this._getCupones();
    var c = cupones.find(function(x){ return x.id===id; });
    if(!c) return;
    var cli    = c.cliente_id ? (DB.clientes||[]).find(function(x){ return x.id===c.cliente_id; }) : null;
    var telPre = cli&&cli.telefono ? cli.telefono.replace(/\D/g,'') : '';

    App.showModal('📱 Enviar Cupón por WhatsApp',
      '<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:14px;padding:18px;text-align:center;margin-bottom:16px;color:white;">'+
        '<div style="font-family:monospace;font-size:20px;font-weight:900;letter-spacing:4px;margin-bottom:6px;">'+c.codigo+'</div>'+
        '<div style="font-size:40px;font-weight:900;line-height:1;">'+c.descuento+'%</div>'+
        '<div style="font-size:13px;opacity:0.85;">DE DESCUENTO</div>'+
        (c.min_compra>0?'<div style="font-size:11px;opacity:0.7;margin-top:5px;">Compras ≥ S/ '+c.min_compra.toFixed(2)+'</div>':'')+
      '</div>'+
      '<label style="display:block;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">WhatsApp del cliente</label>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
        '<span style="padding:10px 12px;background:#dcfce7;border:2px solid #bbf7d0;border-radius:8px;font-size:14px;font-weight:800;color:#16a34a;">+51</span>'+
        '<input type="tel" id="wa_c_num" placeholder="987 654 321" maxlength="9" value="'+telPre+'" oninput="this.value=this.value.replace(/\\D/g,\'\')" style="flex:1;padding:10px 13px;border:2px solid var(--gray-200);border-radius:8px;font-size:16px;font-weight:700;outline:none;"/>'+
      '</div>'+
      '<p style="font-size:10px;color:var(--gray-400);">9 dígitos sin el +51. Ej: 987654321</p>',
      [
        {text:'Cancelar', cls:'btn-outline', cb:function(){App.closeModal();}},
        {text:'<i class="fab fa-whatsapp" style="margin-right:5px;"></i>Enviar Cupón', cls:'btn-success', cb:function(){
          var el  = document.getElementById('wa_c_num');
          var num = el ? el.value.replace(/\D/g,'') : '';
          if(!num||num.length!==9){ App.toast('Ingresa los 9 dígitos','error'); return; }
          App.closeModal();
          CuponesModule._abrirWACupon('51'+num, c);
        }}
      ]
    );
    document.getElementById('modalBox').style.maxWidth='420px';
    setTimeout(function(){ var el=document.getElementById('wa_c_num'); if(el) el.focus(); },200);
  },

  _abrirWACupon(numero, c) {
    var empresa = DB.empresa || {};
    var msg =
      '\uD83C\uDF89 *\u00A1CUP\u00D3N DE DESCUENTO EXCLUSIVO!*\n'+
      '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'+
      '\uD83C\uDFEA *'+(empresa.nombre||'MAGAMA')+'*\n\n'+
      '\uD83C\uDFAB Tu c\u00F3digo especial:\n'+
      '`'+c.codigo+'`\n\n'+
      '\uD83D\uDCA5 *'+c.descuento+'% DE DESCUENTO*\n'+
      (c.min_compra>0?'\uD83D\uDED2 En compras mayores a *S/ '+c.min_compra.toFixed(2)+'*\n':'')+
      (c.fecha_expiracion?'\uD83D\uDCC5 V\u00E1lido hasta: *'+this._formatFecha(c.fecha_expiracion)+'*\n':'')+
      '\u2705 V\u00E1lido por *una sola compra*\n\n'+
      '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'+
      (empresa.direccion?'\uD83D\uDCCD '+empresa.direccion+'\n':'')+
      (empresa.telefono?'\uD83D\uDCDE '+empresa.telefono+'\n':'')+
      '\n\uD83D\uDECD\uFE0F \u00A1No dejes pasar esta oportunidad!\n'+
      '\uD83D\uDC4B\u2728 Te esperamos en tienda';

    window.open('https://wa.me/'+numero+'?text='+encodeURIComponent(msg),'_blank');
    App.toast('\u2705 Abriendo WhatsApp con el cup\u00F3n...','success');
  },

  // ─────────────────────────────────────────────────────────
  // IMPRIMIR CUPÓN
  // ─────────────────────────────────────────────────────────
  imprimirCupon(id) {
    var cupones = this._getCupones();
    var c = cupones.find(function(x){ return x.id===id; });
    if(!c) return;
    var empresa = DB.empresa || {};
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=130x130&bgcolor=ffffff&color=1e3a5f&data='+encodeURIComponent(c.codigo);

    var w = window.open('','_blank','width=440,height=650');
    if(!w){ App.toast('Activa las ventanas emergentes para imprimir','warning'); return; }
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cupón '+c.codigo+'</title>'+
      '<style>'+
      '*{box-sizing:border-box;margin:0;padding:0;}'+
      'body{background:#e5e7eb;display:flex;justify-content:center;align-items:flex-start;padding:24px;font-family:Arial,Helvetica,sans-serif;min-height:100vh;}'+
      '.cupon{width:360px;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.18);background:white;}'+
      '.header{background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:white;padding:24px 20px;text-align:center;position:relative;overflow:hidden;}'+
      '.header::before{content:\'\';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08);}'+
      '.header::after{content:\'\';position:absolute;bottom:-40px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06);}'+
      '.empresa{font-size:13px;font-weight:700;opacity:0.8;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}'+
      '.titulo{font-size:11px;opacity:0.7;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;}'+
      '.descuento{font-size:72px;font-weight:900;line-height:1;margin-bottom:4px;}'+
      '.off{font-size:20px;font-weight:700;opacity:0.9;letter-spacing:2px;}'+
      '.cond{font-size:11px;opacity:0.7;margin-top:8px;}'+
      '.separador{display:flex;align-items:center;margin:0;}'+
      '.circ{width:20px;height:20px;border-radius:50%;background:#e5e7eb;flex-shrink:0;}'+
      '.linea{flex:1;border-top:2px dashed #d1d5db;margin:0 -1px;}'+
      '.body{padding:20px;}'+
      '.codigo-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;text-align:center;margin-bottom:8px;}'+
      '.codigo-box{background:#f0f9ff;border:2px dashed #2563eb;border-radius:10px;padding:14px;text-align:center;margin-bottom:14px;}'+
      '.codigo-box span{font-family:monospace;font-size:24px;font-weight:900;color:#1e3a5f;letter-spacing:4px;}'+
      '.qr-wrap{text-align:center;margin-bottom:14px;}'+
      '.condiciones{list-style:none;font-size:12px;color:#4b5563;line-height:1.8;}'+
      '.condiciones li::before{content:"✓ ";color:#16a34a;font-weight:700;}'+
      '.footer{background:#1e3a5f;color:white;padding:14px 20px;text-align:center;font-size:11px;opacity:0.9;line-height:1.6;}'+
      '@media print{body{background:white;padding:0;}.cupon{box-shadow:none;border-radius:0;}@page{margin:0;size:100mm auto;}}'+
      '</style></head><body>'+
      '<div class="cupon">'+
        '<div class="header">'+
          (empresa.logo?'<img src="'+empresa.logo+'" style="max-height:44px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" alt=""><br>':'')+
          '<div class="empresa">'+(empresa.nombre||'MAGAMA')+'</div>'+
          '<div class="titulo">Cupón de Descuento</div>'+
          '<div class="descuento">'+c.descuento+'%</div>'+
          '<div class="off">DE DESCUENTO</div>'+
          (c.min_compra>0?'<div class="cond">En compras mayores a S/ '+c.min_compra.toFixed(2)+'</div>':'')+
          (c.fecha_expiracion?'<div class="cond">Válido hasta: '+this._formatFecha(c.fecha_expiracion)+'</div>':'')+
        '</div>'+
        '<div class="separador"><div class="circ" style="margin-left:-10px;"></div><div class="linea"></div><div class="circ" style="margin-right:-10px;"></div></div>'+
        '<div class="body">'+
          '<div class="codigo-label">Tu código exclusivo</div>'+
          '<div class="codigo-box"><span>'+c.codigo+'</span></div>'+
          '<div class="qr-wrap"><img src="'+qrUrl+'" width="120" height="120" alt="QR"></div>'+
          '<ul class="condiciones">'+
            (c.min_compra>0?'<li>Válido en compras ≥ S/ '+c.min_compra.toFixed(2)+'</li>':'')+
            '<li>Válido por una sola compra</li>'+
            (c.fecha_expiracion?'<li>Válido hasta: '+this._formatFecha(c.fecha_expiracion)+'</li>':'')+
            '<li>Canjeable en tienda física</li>'+
            '<li>No acumulable con otras ofertas</li>'+
          '</ul>'+
        '</div>'+
        '<div class="footer">'+
          (empresa.direccion?empresa.direccion+'<br>':'')+
          (empresa.telefono?'📞 '+empresa.telefono:'')+''+
        '</div>'+
      '</div>'+
    '</body></html>');
    w.document.close();
    setTimeout(function(){ w.focus(); w.print(); }, 700);
    App.toast('🖨️ Abriendo cupón para imprimir...','success');
  },

  // ─────────────────────────────────────────────────────────
  // ANULAR
  // ─────────────────────────────────────────────────────────
  anular(id) {
    var cupones = this._getCupones();
    var c = cupones.find(function(x){ return x.id===id; });
    if(!c) return;
    App.showModal('🚫 Anular Cupón',
      '<div style="text-align:center;padding:10px;">'+
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><i class="fas fa-ban" style="font-size:26px;color:#dc2626;"></i></div>'+
        '<div style="font-size:16px;font-weight:800;margin-bottom:8px;">¿Anular este cupón?</div>'+
        '<div style="font-family:monospace;font-size:20px;font-weight:900;color:var(--accent);background:#eff6ff;padding:10px 16px;border-radius:8px;display:inline-block;letter-spacing:3px;margin-bottom:12px;">'+c.codigo+'</div>'+
        '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">El cupón quedará inactivo y no podrá ser canjeado.</div>'+
      '</div>',
      [{text:'🚫 Sí, anular', cls:'btn-danger', cb:function(){
        var cupones2 = CuponesModule._getCupones();
        var i = cupones2.findIndex(function(x){ return x.id===id; });
        if(i>=0) cupones2[i].estado = 'ANULADO';
        CuponesModule._saveCupones(cupones2);
        App.toast('Cupón anulado','warning');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='380px';
  },

  // ─────────────────────────────────────────────────────────
  // API PÚBLICA — Validar y Usar (para POS y Ventas)
  // ─────────────────────────────────────────────────────────

  /**
   * Valida un cupón por código.
   * @param {string} codigo
   * @param {number} montoCompra (opcional)
   * @returns {{ valido:boolean, cupon?:object, msg:string }}
   */
  validarCupon(codigo, montoCompra) {
    if(!codigo) return { valido:false, msg:'Ingresa un código de cupón' };
    var hoy     = this._fechaLocal();
    var cupones = this._getCupones();
    var c = cupones.find(function(x){ return x.codigo.toUpperCase()===(codigo||'').toUpperCase().trim(); });

    if(!c)                                                   return { valido:false, msg:'Cupón no encontrado' };
    if(c.estado==='USADO')                                   return { valido:false, msg:'Este cupón ya fue utilizado' };
    if(c.estado==='ANULADO')                                 return { valido:false, msg:'Este cupón fue anulado' };
    if(c.estado==='EXPIRADO')                                return { valido:false, msg:'Este cupón ha expirado' };
    if(c.fecha_expiracion && c.fecha_expiracion < hoy)       return { valido:false, msg:'Este cupón ha expirado' };
    if(montoCompra!==undefined && c.min_compra>0 && montoCompra<c.min_compra) {
      return { valido:false, msg:'Compra mínima requerida: S/ '+c.min_compra.toFixed(2) };
    }

    return { valido:true, cupon:c, descuento:c.descuento, msg:'\u2705 Cupón válido — '+c.descuento+'% de descuento' };
  },

  /**
   * Marca un cupón como USADO al procesar una venta.
   * @param {string} cuponId
   * @param {string|number} ventaId
   * @param {string} ventaSerie
   * @param {string} ventaNumero
   * @param {number} ahorroGenerado
   */
  usarCupon(cuponId, ventaId, ventaSerie, ventaNumero, ahorroGenerado) {
    var cupones = this._getCupones();
    var i = cupones.findIndex(function(x){ return x.id===cuponId; });
    if(i<0) return;
    cupones[i].estado          = 'USADO';
    cupones[i].fecha_uso       = this._fechaLocal();
    cupones[i].venta_id        = ventaId;
    cupones[i].venta_serie     = ventaSerie;
    cupones[i].venta_numero    = ventaNumero;
    cupones[i].ahorro_generado = ahorroGenerado||0;
    this._saveCupones(cupones);
  },

  // ─────────────────────────────────────────────────────────
  // GENERADOR DE CÓDIGOS DE BARRA
  // ─────────────────────────────────────────────────────────
  _bcTipo: 'CODE128',
  _bcError: false,

  abrirGeneradorCodigos() {
    var self = this;
    var empresa = DB.empresa || {};
    var tipos = [
      {val:'CODE128',icon:'fa-barcode',  label:'CODE 128', desc:'Universal'},
      {val:'CODE39', icon:'fa-barcode',  label:'CODE 39',  desc:'Alfanum.'},
      {val:'EAN13',  icon:'fa-barcode',  label:'EAN-13',   desc:'13 dígitos'},
      {val:'EAN8',   icon:'fa-barcode',  label:'EAN-8',    desc:'8 dígitos'},
      {val:'UPC',    icon:'fa-barcode',  label:'UPC-A',    desc:'12 dígitos'},
      {val:'QR',     icon:'fa-qrcode',   label:'QR Code',  desc:'2D'},
    ];

    App.showModal('📊 Generador Profesional de Códigos de Barra',
      '<div style="display:grid;grid-template-columns:300px 1fr;gap:0;min-height:520px;">'+

      // ── PANEL IZQUIERDO ──
      '<div style="padding:16px;border-right:2px solid var(--gray-200);background:var(--gray-50);overflow-y:auto;">'+

        '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"><i class="fas fa-th" style="color:var(--accent);margin-right:5px;"></i>Tipo de Código</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:14px;">'+
          tipos.map(function(t){
            return '<button id="bc_btn_'+t.val+'" onclick="CuponesModule._setTipoBC(\''+t.val+'\')" '+
              'style="padding:8px 4px;border-radius:8px;border:2px solid var(--gray-200);background:white;cursor:pointer;text-align:center;transition:all 0.15s;">'+
              '<i class="fas '+t.icon+'" style="display:block;font-size:15px;margin-bottom:3px;color:var(--gray-400);"></i>'+
              '<div style="font-size:10px;font-weight:800;color:var(--gray-700);">'+t.label+'</div>'+
              '<div style="font-size:9px;color:var(--gray-400);">'+t.desc+'</div>'+
            '</button>';
          }).join('')+
        '</div>'+

        '<div style="margin-bottom:12px;">'+
          '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">Valor del Código</div>'+
          '<input type="text" id="bc_valor" value="MAGAMA-001" oninput="CuponesModule._actualizarBarcode()" '+
          'style="width:100%;padding:10px 12px;border:2px solid var(--accent);border-radius:8px;font-size:14px;font-weight:700;outline:none;box-sizing:border-box;font-family:monospace;"/>'+
          '<div id="bc_hint" style="font-size:10px;margin-top:4px;color:var(--gray-400);font-style:italic;">CODE 128 acepta cualquier texto o número</div>'+
        '</div>'+

        '<hr style="border:1px solid var(--gray-200);margin:12px 0;"/>'+

        '<div style="font-size:10px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;"><i class="fas fa-palette" style="margin-right:5px;"></i>Apariencia</div>'+

        '<div style="margin-bottom:10px;">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'+
            '<span style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;">Ancho de línea</span>'+
            '<span id="bc_lineW_val" style="font-size:10px;font-weight:800;color:var(--accent);">2px</span>'+
          '</div>'+
          '<input type="range" id="bc_lineW" min="1" max="4" value="2" step="0.5" oninput="document.getElementById(\'bc_lineW_val\').textContent=this.value+\'px\';CuponesModule._actualizarBarcode()" style="width:100%;accent-color:var(--accent);">'+
        '</div>'+

        '<div style="margin-bottom:10px;">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'+
            '<span style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;">Alto</span>'+
            '<span id="bc_h_val" style="font-size:10px;font-weight:800;color:var(--accent);">80px</span>'+
          '</div>'+
          '<input type="range" id="bc_h" min="30" max="200" value="80" oninput="document.getElementById(\'bc_h_val\').textContent=this.value+\'px\';CuponesModule._actualizarBarcode()" style="width:100%;accent-color:var(--accent);">'+
        '</div>'+

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'+
          '<div>'+
            '<div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:4px;">Color barras</div>'+
            '<input type="color" id="bc_color" value="#000000" oninput="CuponesModule._actualizarBarcode()" style="width:100%;height:34px;border:2px solid var(--gray-200);border-radius:6px;cursor:pointer;padding:2px;">'+
          '</div>'+
          '<div>'+
            '<div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:4px;">Color fondo</div>'+
            '<input type="color" id="bc_bg" value="#ffffff" oninput="CuponesModule._actualizarBarcode()" style="width:100%;height:34px;border:2px solid var(--gray-200);border-radius:6px;cursor:pointer;padding:2px;">'+
          '</div>'+
        '</div>'+

        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">'+
          '<span style="font-size:11px;font-weight:700;color:var(--gray-600);">Mostrar texto bajo barras</span>'+
          '<input type="checkbox" id="bc_showTxt" checked onchange="CuponesModule._actualizarBarcode()" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);">'+
        '</div>'+

        '<hr style="border:1px solid var(--gray-200);margin:12px 0;"/>'+

        '<div style="font-size:10px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;"><i class="fas fa-tag" style="margin-right:5px;"></i>Etiqueta</div>'+

        '<div style="margin-bottom:7px;">'+
          '<div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:4px;">Empresa</div>'+
          '<input type="text" id="bc_empresa" value="'+(empresa.nombre||'MAGAMA')+'" oninput="CuponesModule._actualizarBarcode()" style="width:100%;padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">'+
        '</div>'+
        '<div style="margin-bottom:7px;">'+
          '<div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:4px;">Producto</div>'+
          '<input type="text" id="bc_producto" placeholder="Nombre del producto..." oninput="CuponesModule._actualizarBarcode()" style="width:100%;padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">'+
        '</div>'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:4px;">Precio (S/)</div>'+
          '<input type="number" id="bc_precio" placeholder="0.00" min="0" step="0.01" oninput="CuponesModule._actualizarBarcode()" style="width:100%;padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;">'+
        '</div>'+

        '<hr style="border:1px solid var(--gray-200);margin:12px 0;"/>'+

        '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:7px;"><i class="fas fa-bolt" style="color:#d97706;margin-right:5px;"></i>Cargar desde producto</div>'+
        '<select id="bc_prod_sel" onchange="CuponesModule._cargarProductoBC(this.value)" style="width:100%;padding:8px 10px;border:1.5px solid var(--gray-200);border-radius:7px;font-size:12px;background:white;outline:none;">'+
          '<option value="">— Seleccionar producto —</option>'+
          (DB.productos||[]).map(function(p){ return '<option value="'+p.id+'">'+p.nombre+' · '+p.codigo+'</option>'; }).join('')+
        '</select>'+

      '</div>'+

      // ── PANEL DERECHO ──
      '<div style="padding:20px;display:flex;flex-direction:column;align-items:center;">'+

        '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;"><i class="fas fa-eye" style="margin-right:5px;color:var(--accent);"></i>Vista Previa en Tiempo Real</div>'+

        '<div id="bc_preview_area" style="width:100%;min-height:220px;border:2px dashed var(--gray-200);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:white;margin-bottom:14px;box-sizing:border-box;position:relative;">'+
          '<canvas id="bc_canvas" style="max-width:100%;"></canvas>'+
          '<div id="bc_qr_img" style="display:none;"></div>'+
          '<div id="bc_label_preview" style="text-align:center;margin-top:8px;"></div>'+
          '<div id="bc_error_msg" style="color:#dc2626;font-size:12px;font-weight:700;display:none;text-align:center;padding:20px;">'+
            '<i class="fas fa-exclamation-triangle" style="font-size:24px;display:block;margin-bottom:8px;"></i>'+
            '<span id="bc_error_text">Valor inválido</span>'+
          '</div>'+
        '</div>'+

        '<div id="bc_status" style="margin-bottom:12px;font-size:12px;font-weight:700;min-height:20px;"></div>'+

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;margin-bottom:8px;">'+
          '<button onclick="CuponesModule._descargarBarcodePN()" style="padding:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;"><i class="fas fa-download" style="margin-right:5px;"></i>Descargar PNG</button>'+
          '<button onclick="CuponesModule._imprimirBarcode()" style="padding:12px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;"><i class="fas fa-print" style="margin-right:5px;"></i>Imprimir</button>'+
        '</div>'+
        '<button onclick="CuponesModule._copiarCodigoBC()" style="width:100%;padding:11px;background:white;color:var(--gray-700);border:2px solid var(--gray-200);border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;margin-bottom:14px;">'+
          '<i class="fas fa-copy" style="margin-right:5px;"></i>Copiar texto al portapapeles'+
        '</button>'+

        '<hr style="width:100%;border:1px solid var(--gray-200);margin-bottom:14px;"/>'+

        '<div style="width:100%;background:var(--gray-50);border-radius:12px;padding:14px;">'+
          '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:5px;"></i>Guía de formatos</div>'+
          '<div style="font-size:11px;color:var(--gray-600);line-height:1.8;">'+
            '<span style="font-weight:800;color:var(--gray-800);">CODE 128:</span> Cualquier texto · máx recomendado: 20 chars<br>'+
            '<span style="font-weight:800;color:var(--gray-800);">CODE 39:</span> A-Z, 0-9, - . $ / + % espacio<br>'+
            '<span style="font-weight:800;color:var(--gray-800);">EAN-13:</span> Exactamente 12 dígitos<br>'+
            '<span style="font-weight:800;color:var(--gray-800);">EAN-8:</span> Exactamente 7 dígitos<br>'+
            '<span style="font-weight:800;color:var(--gray-800);">UPC-A:</span> Exactamente 11 dígitos<br>'+
            '<span style="font-weight:800;color:var(--gray-800);">QR Code:</span> Texto, URL, datos (hasta 4,296 chars)'+
          '</div>'+
        '</div>'+

      '</div>'+
      '</div>',
      [{text:'Cerrar', cls:'btn-outline', cb:function(){ App.closeModal(); }}]
    );
    document.getElementById('modalBox').style.maxWidth = '900px';
    this._bcTipo = 'CODE128';
    this._bcError = false;
    setTimeout(function(){
      CuponesModule._setTipoBC('CODE128');
      CuponesModule._actualizarBarcode();
    }, 200);
  },

  _setTipoBC(tipo) {
    this._bcTipo = tipo;
    var hints = {
      'CODE128': 'Acepta cualquier texto o números — el más usado',
      'CODE39':  'Solo mayúsculas A-Z, números 0-9 y - . $ / + %',
      'EAN13':   'Exactamente 12 dígitos (el 13° se calcula automáticamente)',
      'EAN8':    'Exactamente 7 dígitos (el 8° se calcula automáticamente)',
      'UPC':     'Exactamente 11 dígitos (el 12° se calcula automáticamente)',
      'QR':      'Cualquier texto, URL o datos — ideal para links',
    };
    var defaults = {
      'CODE128': 'MAGAMA-001', 'CODE39': 'MAGAMA001',
      'EAN13': '590123412345', 'EAN8': '5901234',
      'UPC': '01234567890', 'QR': 'https://magamamoda.com',
    };
    ['CODE128','CODE39','EAN13','EAN8','UPC','QR'].forEach(function(t) {
      var btn = document.getElementById('bc_btn_'+t);
      if(!btn) return;
      var active = t===tipo;
      btn.style.borderColor = active ? 'var(--accent)' : 'var(--gray-200)';
      btn.style.background  = active ? '#eff6ff'       : 'white';
      btn.querySelector('i').style.color = active ? 'var(--accent)' : 'var(--gray-400)';
      btn.querySelector('div').style.color = active ? 'var(--accent)' : 'var(--gray-700)';
    });
    var hintEl = document.getElementById('bc_hint');
    if(hintEl) hintEl.textContent = hints[tipo] || '';
    var valEl = document.getElementById('bc_valor');
    var prevDefaults = Object.values({'CODE128':'MAGAMA-001','CODE39':'MAGAMA001','EAN13':'590123412345','EAN8':'5901234','UPC':'01234567890','QR':'https://magamamoda.com'});
    if(valEl && (!valEl.value || prevDefaults.includes(valEl.value))) valEl.value = defaults[tipo];
    this._actualizarBarcode();
  },

  _actualizarBarcode() {
    var tipo    = this._bcTipo || 'CODE128';
    var valor   = (document.getElementById('bc_valor')?.value || '').trim();
    var lineW   = parseFloat(document.getElementById('bc_lineW')?.value || 2);
    var alto    = parseInt(document.getElementById('bc_h')?.value || 80);
    var color   = document.getElementById('bc_color')?.value  || '#000000';
    var bg      = document.getElementById('bc_bg')?.value     || '#ffffff';
    var showTxt = document.getElementById('bc_showTxt')?.checked !== false;
    var empresa = document.getElementById('bc_empresa')?.value || '';
    var producto= document.getElementById('bc_producto')?.value|| '';
    var precio  = document.getElementById('bc_precio')?.value  || '';
    var canvas  = document.getElementById('bc_canvas');
    var qrDiv   = document.getElementById('bc_qr_img');
    var errDiv  = document.getElementById('bc_error_msg');
    var errTxt  = document.getElementById('bc_error_text');
    var statusDiv = document.getElementById('bc_status');
    var labelDiv  = document.getElementById('bc_label_preview');
    if(!canvas) return;

    // Label
    if(labelDiv) {
      var lh = '';
      if(empresa) lh += '<div style="font-size:11px;font-weight:700;color:var(--gray-500);">'+empresa+'</div>';
      if(producto)lh += '<div style="font-size:13px;font-weight:800;color:var(--gray-800);">'+producto+'</div>';
      if(precio)  lh += '<div style="font-size:15px;font-weight:900;color:var(--accent);">S/ '+parseFloat(precio||0).toFixed(2)+'</div>';
      labelDiv.innerHTML = lh;
    }

    if(tipo === 'QR') {
      canvas.style.display = 'none';
      if(qrDiv){
        qrDiv.style.display = 'block';
        var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(valor||'MAGAMA')+'&bgcolor='+bg.replace('#','')+'&color='+color.replace('#','');
        qrDiv.innerHTML = '<img src="'+qrUrl+'" width="180" height="180" style="border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">';
      }
      if(errDiv) errDiv.style.display='none';
      if(statusDiv) statusDiv.innerHTML='<i class="fas fa-check-circle" style="color:#16a34a;margin-right:5px;"></i><span style="color:#16a34a;">QR generado — listo para usar</span>';
      this._bcError = false;
      return;
    }

    if(qrDiv) qrDiv.style.display='none';
    canvas.style.display='block';
    if(!valor){
      if(errDiv){errDiv.style.display='flex';}
      if(errTxt) errTxt.textContent='Ingresa un valor para el código';
      if(statusDiv) statusDiv.innerHTML='';
      this._bcError=true; return;
    }
    try {
      JsBarcode(canvas, valor, {
        format: tipo, width: lineW, height: alto,
        displayValue: showTxt, lineColor: color,
        background: bg, margin: 10, fontSize: 14,
      });
      if(errDiv) errDiv.style.display='none';
      if(statusDiv) statusDiv.innerHTML='<i class="fas fa-check-circle" style="color:#16a34a;margin-right:5px;"></i><span style="color:#16a34a;">Código válido — listo para descargar</span>';
      this._bcError=false;
    } catch(e) {
      if(errDiv) errDiv.style.display='flex';
      if(errTxt) errTxt.textContent = e.message || 'Valor inválido para este tipo';
      if(statusDiv) statusDiv.innerHTML='';
      this._bcError=true;
    }
  },

  _descargarBarcodePN() {
    var tipo  = this._bcTipo || 'CODE128';
    var valor = (document.getElementById('bc_valor')?.value||'').trim();
    var empresa = document.getElementById('bc_empresa')?.value||'';
    var producto= document.getElementById('bc_producto')?.value||'';
    var precio  = document.getElementById('bc_precio')?.value||'';
    var color = document.getElementById('bc_color')?.value||'#000000';
    var bg    = document.getElementById('bc_bg')?.value||'#ffffff';

    if(tipo==='QR'){
      var a=document.createElement('a');
      a.href='https://api.qrserver.com/v1/create-qr-code/?size=400x400&data='+encodeURIComponent(valor)+'&bgcolor='+bg.replace('#','')+'&color='+color.replace('#','');
      a.download='qr_'+valor.slice(0,20)+'.png'; a.target='_blank'; a.click();
      App.toast('✅ Descargando QR PNG...','success'); return;
    }
    if(this._bcError){App.toast('Corrige el valor antes de descargar','error');return;}
    var srcCanvas = document.getElementById('bc_canvas');
    if(!srcCanvas) return;
    var labelH = (empresa||producto||precio)?64:0;
    var fc=document.createElement('canvas');
    fc.width=srcCanvas.width; fc.height=srcCanvas.height+labelH+10;
    var ctx=fc.getContext('2d');
    ctx.fillStyle=bg; ctx.fillRect(0,0,fc.width,fc.height);
    ctx.drawImage(srcCanvas,0,0);
    if(labelH>0){
      var y=srcCanvas.height+18; ctx.textAlign='center';
      if(empresa){ ctx.font='bold 11px Arial';ctx.fillStyle='#6b7280';ctx.fillText(empresa,fc.width/2,y);y+=15; }
      if(producto){ctx.font='bold 14px Arial';ctx.fillStyle='#1e293b';ctx.fillText(producto,fc.width/2,y);y+=18;}
      if(precio)  {ctx.font='bold 16px Arial';ctx.fillStyle='#2563eb';ctx.fillText('S/ '+parseFloat(precio).toFixed(2),fc.width/2,y);}
    }
    var a2=document.createElement('a');
    a2.href=fc.toDataURL('image/png');
    a2.download='barcode_'+(valor.slice(0,20).replace(/[^a-zA-Z0-9]/g,'_'))+'.png'; a2.click();
    App.toast('✅ PNG descargado correctamente','success');
  },

  _imprimirBarcode() {
    var tipo  = this._bcTipo||'CODE128';
    var valor = (document.getElementById('bc_valor')?.value||'').trim();
    var empresa = document.getElementById('bc_empresa')?.value||'';
    var producto= document.getElementById('bc_producto')?.value||'';
    var precio  = document.getElementById('bc_precio')?.value||'';
    var color = document.getElementById('bc_color')?.value||'#000000';
    var bg    = document.getElementById('bc_bg')?.value||'#ffffff';
    if(this._bcError&&tipo!=='QR'){App.toast('Corrige el valor antes de imprimir','error');return;}
    var w=window.open('','_blank','width=420,height=520');
    if(!w){App.toast('Activa ventanas emergentes para imprimir','warning');return;}
    var imgSrc='';
    if(tipo==='QR'){
      imgSrc='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='+encodeURIComponent(valor)+'&bgcolor='+bg.replace('#','')+'&color='+color.replace('#','');
    } else {
      var c=document.getElementById('bc_canvas'); if(c) imgSrc=c.toDataURL('image/png');
    }
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8">'+
      '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;background:white;text-align:center;}'+
      'img{max-width:100%;border-radius:6px;}.wrap{border:2px solid #e2e8f0;border-radius:12px;padding:20px;display:inline-block;}'+
      '.emp{font-size:11px;color:#6b7280;font-weight:700;margin-top:10px;}.prod{font-size:14px;color:#1e293b;font-weight:800;margin:3px 0;}.prec{font-size:18px;color:#2563eb;font-weight:900;}'+
      '@media print{body{padding:0;}@page{margin:5mm;size:100mm auto;}}</style></head><body>'+
      '<div class="wrap">'+
      '<img src="'+imgSrc+'" alt="Código">'+
      (empresa?'<div class="emp">'+empresa+'</div>':'')+
      (producto?'<div class="prod">'+producto+'</div>':'')+
      (precio?'<div class="prec">S/ '+parseFloat(precio||0).toFixed(2)+'</div>':'')+
      '</div>'+
      '<script>setTimeout(function(){window.print();},500);<\/script>'+
    '</body></html>');
    w.document.close();
    App.toast('🖨️ Abriendo impresión...','success');
  },

  _copiarCodigoBC() {
    var v=document.getElementById('bc_valor')?.value||'';
    if(!v){App.toast('No hay código para copiar','error');return;}
    navigator.clipboard.writeText(v).then(function(){
      App.toast('✅ "'+v+'" copiado al portapapeles','success');
    }).catch(function(){ App.toast('No se pudo copiar automáticamente','warning'); });
  },

  _cargarProductoBC(id) {
    if(!id) return;
    var p=(DB.productos||[]).find(function(x){return String(x.id)===String(id);});
    if(!p) return;
    var vEl=document.getElementById('bc_valor');
    var prEl=document.getElementById('bc_producto');
    var pcEl=document.getElementById('bc_precio');
    if(vEl)  vEl.value  = p.codigo || String(p.id);
    if(prEl) prEl.value = p.nombre || '';
    if(pcEl) pcEl.value = p.precio_venta ? p.precio_venta.toFixed(2) : '';
    this._actualizarBarcode();
    App.toast('✅ Producto "'+p.nombre+'" cargado','success');
  },
};