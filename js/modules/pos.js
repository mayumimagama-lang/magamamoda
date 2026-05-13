// ============================================================
// MÓDULO: PUNTO DE VENTA — Versión Profesional Completa v4
// ============================================================

const POSModule = {

  // ── Estado ──
  items:               [],
  categoriaActiva:     'todos',
  searchTerm:          '',
  clienteSeleccionado: null,
  tipoComp:            'NV',
  notaVenta:           '',
  ventasEnEspera:      [],
  favoritos:           [],
  _metodoCobro:        'EFECTIVO',
  _pagosDiv:           [],
  _pagosDivActivo:     false,
  _subMetodoCombinado: 'YAPE+EFECTIVO',
  mayoristaModo:       false,
  _vistaGrid:          true,
  _mostrarFavoritos:   false,

  // ── Helpers ──
  _fechaLocal() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _horaLocal() { return new Date().toTimeString().slice(0,8); },

  get categorias() {
    var cats = ['todos'];
    (DB.productos||[]).forEach(function(p){ if(cats.indexOf(p.categoria)===-1) cats.push(p.categoria); });
    return cats;
  },

  _emoji(cat) {
    var map = {POLO:'👕',TOP:'👚',BODY:'👙',CHOMPA:'🧥',PANTALON:'👖',FALDA:'👗',VESTIDO:'💃',
               CHALECO:'🦺',CASACA:'🧣',CAMISA:'👔',SHORT:'🩳',MEDIAS:'🧦',MORRAL:'👜',
               POLERA:'🧤',FAJA:'👟',Alimentos:'🥫',Bebidas:'🥤',General:'📦'};
    if (!cat) return '📦';
    for (var k in map) { if (cat.toUpperCase().includes(k)) return map[k]; }
    return '📦';
  },

  getTotal() { return this.items.reduce(function(s,i){return s+i.total;},0); },
  getSubtotal() { return this.items.reduce(function(s,i){return s+(i.qty*(i.precioCustom||i.precio));},0); },
  getDescuentoTotal() {
    return this.items.reduce(function(s,item){
      var p=item.precioCustom||item.precio, d=item.descuento||0;
      return s+(item.qty*p*d/100);
    },0);
  },

  _recalcItem(idx) {
    var item=this.items[idx], precio=item.precioCustom||item.precio, dcto=item.descuento||0;
    item.total = item.qty * precio * (1 - dcto/100);
  },

  getProductosFiltrados() {
    var self=this;
    return (DB.productos||[]).filter(function(p){
      var matchCat = self.categoriaActiva==='todos' || p.categoria===self.categoriaActiva;
      var q = self.searchTerm.toLowerCase();
      var matchSearch = !q || (p.nombre||'').toLowerCase().includes(q) || (p.codigo||'').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  },

  _statsHoy() {
    var hoy = this._fechaLocal();
    var vHoy = (DB.ventas||[]).filter(function(v){return v.fecha===hoy;});
    return {
      cnt:   vHoy.length,
      total: vHoy.reduce(function(s,v){return s+v.total;},0),
      items: vHoy.reduce(function(s,v){return s+(v.items||[]).reduce(function(ss,i){return ss+(i.qty||0);},0);},0)
    };
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Punto de Venta','POS');
    if (!this.clienteSeleccionado) {
      this.clienteSeleccionado = (DB.clientes||[]).find(function(c){return c.doc==='00000000';}) || (DB.clientes||[])[0];
    }

    var stats  = this._statsHoy();
    var total  = this.getTotal();
    var self   = this;
    var prods  = this.getProductosFiltrados();

    // ── BARRA SUPERIOR DE STATS ──
    var statsBar = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">' +
      [
        {l:'Ventas Hoy',   v:stats.cnt,            suf:'transacciones', c:'#2563eb',bg:'#eff6ff',i:'fa-receipt'},
        {l:'Total Hoy',    v:'S/ '+stats.total.toFixed(2), suf:'acumulado', c:'#16a34a',bg:'#f0fdf4',i:'fa-dollar-sign'},
        {l:'Uds Vendidas', v:stats.items,          suf:'unidades',       c:'#7c3aed',bg:'#f5f3ff',i:'fa-boxes'},
        {l:'En Carrito',   v:this.items.reduce(function(s,i){return s+i.qty;},0), suf:this.items.length+' productos', c:'#d97706',bg:'#fffbeb',i:'fa-shopping-cart'},
      ].map(function(s){
        return '<div style="padding:10px 14px;background:'+s.bg+';border-radius:10px;border:1px solid '+s.c+'22;display:flex;align-items:center;gap:10px;">' +
          '<div style="width:34px;height:34px;border-radius:9px;background:'+s.c+'18;color:'+s.c+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;"><i class="fas '+s.i+'"></i></div>' +
          '<div><div style="font-size:16px;font-weight:900;color:'+s.c+';">'+s.v+'</div><div style="font-size:10px;color:var(--gray-500);">'+s.l+'</div></div>' +
        '</div>';
      }).join('') +
    '</div>';

    // ── PANEL IZQUIERDO ──

    // Header POS
    var leftHeader = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 14px;background:white;border-radius:12px;border:1px solid var(--gray-200);box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<div style="width:38px;height:38px;background:linear-gradient(135deg,#b71c1c,#e53935);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:17px;">' +
          '<i class="fas fa-cash-register"></i></div>' +
        '<div><div style="font-size:13px;font-weight:900;color:var(--gray-900);">PUNTO DE VENTA</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+new Date().toLocaleString('es-PE')+'</div></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        (this.ventasEnEspera.length>0 ?
          '<button onclick="POSModule.verEnEspera()" style="padding:6px 12px;background:#fffbeb;color:#d97706;border:1.5px solid #fde68a;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-pause-circle" style="margin-right:4px;"></i>En espera ('+this.ventasEnEspera.length+')</button>' : '') +
        '<button onclick="POSModule._mostrarFavoritos=!POSModule._mostrarFavoritos;App.renderPage();" ' +
          'style="padding:6px 12px;background:'+(this._mostrarFavoritos?'#fef3c7':'white')+';color:'+(this._mostrarFavoritos?'#d97706':'var(--gray-500)')+';border:1.5px solid '+(this._mostrarFavoritos?'#fde68a':'var(--gray-200)')+';border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">' +
          '<i class="fas fa-star" style="margin-right:4px;"></i>Favoritos ('+this.favoritos.length+')</button>' +
        '<div style="display:flex;gap:3px;">' +
          '<button onclick="POSModule._vistaGrid=true;App.renderPage();" title="Vista cuadrícula" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px 0 0 6px;background:'+(this._vistaGrid?'var(--accent)':'white')+';color:'+(this._vistaGrid?'white':'var(--gray-400)')+';cursor:pointer;"><i class="fas fa-th"></i></button>' +
          '<button onclick="POSModule._vistaGrid=false;App.renderPage();" title="Vista lista" style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-left:none;border-radius:0 6px 6px 0;background:'+(!this._vistaGrid?'var(--accent)':'white')+';color:'+(!this._vistaGrid?'white':'var(--gray-400)')+';cursor:pointer;"><i class="fas fa-list"></i></button>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--gray-400);display:flex;align-items:center;gap:4px;">' +
          '<kbd style="padding:2px 5px;background:var(--gray-100);border:1px solid var(--gray-300);border-radius:3px;font-size:9px;">F1</kbd> Buscar' +
          '&nbsp;<kbd style="padding:2px 5px;background:var(--gray-100);border:1px solid var(--gray-300);border-radius:3px;font-size:9px;">F2</kbd> Cobrar' +
        '</div>' +
      '</div>' +
    '</div>';

    // Búsqueda
    var searchBar = '<div style="position:relative;margin-bottom:12px;">' +
      '<i class="fas fa-barcode" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:16px;"></i>' +
      '<input type="text" id="posSearch" value="'+this.searchTerm+'" autocomplete="off" ' +
        'placeholder="Escanear código de barras o buscar producto..." ' +
        'oninput="POSModule.buscar(this.value)" onkeydown="POSModule._onSearchKey(event)" ' +
        'style="width:100%;padding:10px 40px 10px 40px;border:2px solid var(--gray-200);border-radius:10px;font-size:13px;outline:none;box-sizing:border-box;transition:border-color 0.2s;" ' +
        'onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--gray-200)\'"/>' +
      (this.searchTerm ? '<button onclick="POSModule.buscar(\'\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:var(--gray-200);border:none;border-radius:5px;padding:3px 8px;cursor:pointer;color:var(--gray-500);"><i class="fas fa-times"></i></button>' : '') +
    '</div>';

    // Favoritos
    var favSection = '';
    if (this._mostrarFavoritos) {
      var favProds = (DB.productos||[]).filter(function(p){ return self.favoritos.indexOf(p.id) !== -1; });
      favSection = '<div style="margin-bottom:12px;padding:12px;background:#fffbeb;border-radius:12px;border:1.5px solid #fde68a;">' +
        '<div style="font-size:11px;font-weight:800;color:#d97706;margin-bottom:8px;"><i class="fas fa-star" style="margin-right:5px;"></i>FAVORITOS RÁPIDOS</div>' +
        (favProds.length===0 ?
          '<div style="font-size:12px;color:var(--gray-400);text-align:center;padding:8px;">Mantén presionado una tarjeta para agregar a favoritos</div>' :
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            favProds.map(function(p){
              return '<button onclick="POSModule.agregar('+p.id+')" style="padding:6px 12px;background:white;border:1.5px solid #fde68a;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">' +
                self._emoji(p.categoria)+' '+p.nombre.substring(0,15)+' <span style="color:#16a34a;">S/'+p.precio_venta.toFixed(2)+'</span>' +
              '</button>';
            }).join('')+
          '</div>'
        ) +
      '</div>';
    }

    // Categorías
    var catTabs = '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;scrollbar-width:thin;">';
    this.categorias.forEach(function(c){
      var cnt = c==='todos' ? (DB.productos||[]).length : (DB.productos||[]).filter(function(p){return p.categoria===c;}).length;
      var act = self.categoriaActiva===c;
      catTabs += '<button onclick="POSModule.setCategoria(\''+c+'\')" style="white-space:nowrap;padding:7px 14px;border-radius:20px;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-600)')+';font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;flex-shrink:0;">' +
        self._emoji(c)+' '+(c==='todos'?'TODOS':c.toUpperCase())+' <span style="opacity:0.7;">('+cnt+')</span></button>';
    });
    catTabs += '</div>';

    // Grid / Lista de productos
    var grid = '';
    if (this._vistaGrid) {
      grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;max-height:650px;overflow-y:auto;padding-right:4px;">';
      if (!prods.length) {
        grid += '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--gray-400);">' +
          '<i class="fas fa-search" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
          '<p style="font-size:14px;font-weight:700;">Sin resultados</p></div>';
      } else {
        prods.forEach(function(p){
          var agot = (p.stock||0)===0;
          var bajo = !agot && (p.stock||0)<=10;
          var pct  = agot?0:Math.min(100,((p.stock||0)/50)*100);
          var sClr = agot?'#dc2626':bajo?'#d97706':'#16a34a';
          var sTxt = agot?'AGOTADO':bajo?'Stock: '+p.stock:(p.stock||0)+' disp.';
          var isFav= self.favoritos.indexOf(p.id)!==-1;
          grid += '<div onclick="'+(agot?'App.toast(\'Agotado\',\'error\')':'POSModule.agregar('+p.id+')')+'" ' +
            'ondblclick="POSModule._toggleFav('+p.id+')" ' +
            'title="Doble clic para '+(isFav?'quitar de':'agregar a')+' favoritos" ' +
            'style="background:white;border-radius:12px;border:1.5px solid '+(agot?'#fca5a5':isFav?'#fde68a':'var(--gray-200)')+';padding:12px 10px;text-align:center;cursor:'+(agot?'not-allowed':'pointer')+';' +
            'transition:all 0.15s;opacity:'+(agot?'0.6':'1')+';position:relative;" ' +
            'onmouseover="if('+(agot?'false':'true')+'){this.style.borderColor=\'var(--accent)\';this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.1)\';}" ' +
            'onmouseout="this.style.borderColor=\''+(agot?'#fca5a5':isFav?'#fde68a':'var(--gray-200)')+'\';this.style.transform=\'none\';this.style.boxShadow=\'none\';">' +
            (isFav ? '<div style="position:absolute;top:5px;right:5px;font-size:10px;">⭐</div>' : '') +
            '<div style="font-size:28px;margin-bottom:5px;">'+self._emoji(p.categoria)+'</div>' +
            (p.imagen ? '<img src="'+p.imagen+'" style="width:50px;height:50px;object-fit:cover;border-radius:8px;margin-bottom:5px;" onerror="this.style.display=\'none\'">' : '') +
            '<div style="font-size:11px;font-weight:700;color:var(--gray-800);line-height:1.3;margin-bottom:4px;min-height:28px;display:flex;align-items:center;justify-content:center;">'+p.nombre+'</div>' +
            '<div style="font-size:14px;font-weight:900;color:var(--accent);margin-bottom:5px;">S/ '+p.precio_venta.toFixed(2)+'</div>' +
            '<div style="height:3px;background:var(--gray-200);border-radius:2px;margin-bottom:4px;"><div style="height:100%;width:'+pct+'%;background:'+sClr+';border-radius:2px;"></div></div>' +
            '<div style="font-size:9px;font-weight:700;color:'+sClr+';">'+sTxt+'</div>' +
          '</div>';
        });
      }
      grid += '</div>';
    } else {
      // Vista lista
      grid = '<div style="display:flex;flex-direction:column;gap:5px;max-height:650px;overflow-y:auto;">';
      if (!prods.length) {
        grid += '<div style="text-align:center;padding:40px;color:var(--gray-400);"><i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.3;"></i>Sin resultados</div>';
      } else {
        prods.forEach(function(p){
          var agot = (p.stock||0)===0;
          var bajo = !agot && (p.stock||0)<=10;
          var sClr = agot?'#dc2626':bajo?'#d97706':'#16a34a';
          grid += '<div onclick="'+(agot?'App.toast(\'Agotado\',\'error\')':'POSModule.agregar('+p.id+')')+'" ' +
            'style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:white;border-radius:10px;border:1.5px solid var(--gray-200);cursor:'+(agot?'not-allowed':'pointer')+';opacity:'+(agot?'0.6':'1')+';transition:all 0.15s;" ' +
            'onmouseover="if(!'+agot+'){this.style.borderColor=\'var(--accent)\';this.style.background=\'#f8faff\';}" ' +
            'onmouseout="this.style.borderColor=\'var(--gray-200)\';this.style.background=\'white\';">' +
            '<div style="font-size:22px;width:36px;text-align:center;flex-shrink:0;">'+self._emoji(p.categoria)+'</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+p.nombre+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);">'+p.codigo+' · '+p.categoria+'</div>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
              '<div style="font-size:14px;font-weight:900;color:var(--accent);">S/ '+p.precio_venta.toFixed(2)+'</div>' +
              '<div style="font-size:10px;font-weight:700;color:'+sClr+';">'+(agot?'AGOTADO':bajo?'Stock: '+p.stock:(p.stock||0)+' uds')+'</div>' +
            '</div>' +
            '<div style="width:30px;height:30px;border-radius:8px;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;">+</div>' +
          '</div>';
        });
      }
      grid += '</div>';
    }

    // ── PANEL DERECHO ──

    // Tipo comprobante
    var tipos = [
      {k:'NV', l:'Nota Venta', c:'#ea580c', i:'fa-file-alt'},
      {k:'BOL',l:'Boleta',     c:'#2563eb', i:'fa-file-invoice'},
      {k:'FAC',l:'Factura',    c:'#7c3aed', i:'fa-file-invoice-dollar'}
    ];
    var tiposBtns = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">' +
      tipos.map(function(t){
        var act = self.tipoComp===t.k;
        return '<button onclick="POSModule.tipoComp=\''+t.k+'\';App.renderPage();" style="padding:8px 4px;border-radius:10px;border:2px solid '+(act?t.c:'var(--gray-200)')+';background:'+(act?t.c+'18':'white')+';color:'+(act?t.c:'var(--gray-500)')+';font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;">' +
          '<i class="fas '+t.i+'" style="font-size:15px;"></i>'+t.l+'</button>';
      }).join('') +
    '</div>';

    // Cliente
    var clienteBox = '<div style="background:white;border-radius:10px;padding:8px 12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:#eff6ff;color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:9px;font-weight:800;color:var(--gray-400);text-transform:uppercase;">Cliente</div>' +
        '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(this.clienteSeleccionado?this.clienteSeleccionado.nombre:'PÚBLICO EN GENERAL')+'</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:3px;">' +
        '<div style="display:flex;gap:4px;">' +
          '<input type="text" id="posClienteDoc" placeholder="DNI/RUC..." oninput="POSModule._onDocInput(this.value)" ' +
            'style="width:90px;padding:4px 8px;border:1.5px solid var(--gray-200);border-radius:6px;font-size:11px;outline:none;"/>' +
          '<button onclick="POSModule.cambiarCliente()" style="padding:4px 8px;background:var(--accent);color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:700;"><i class="fas fa-search"></i></button>' +
        '</div>' +
        '<div id="posClienteStatus" style="font-size:10px;color:var(--gray-400);min-height:12px;"></div>' +
      '</div>' +
    '</div>';

    // Ticket header
    var tipoLabels = {NV:'NOTA DE VENTA',BOL:'BOLETA ELECTRÓNICA',FAC:'FACTURA ELECTRÓNICA'};
    var ticketHeader = '<div style="background:linear-gradient(135deg,#1e3a5f,var(--accent));color:white;padding:10px 14px;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:space-between;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<i class="fas fa-receipt"></i>' +
        '<span style="font-size:12px;font-weight:800;">'+tipoLabels[this.tipoComp]+'</span>' +
      '</div>' +
      '<span style="font-size:11px;opacity:0.8;">'+this.items.length+' ítem(s)</span>' +
    '</div>';

    // Items del carrito
    var ticketItems = '';
    if (this.items.length===0) {
      ticketItems = '<div style="text-align:center;padding:28px 16px;color:var(--gray-400);">' +
        '<i class="fas fa-shopping-basket" style="font-size:36px;display:block;margin-bottom:10px;opacity:0.3;"></i>' +
        '<p style="font-size:13px;font-weight:700;">Ticket vacío</p>' +
        '<p style="font-size:11px;opacity:0.7;">Toca un producto para agregar</p>' +
      '</div>';
    } else {
      this.items.forEach(function(item,i){
        var desc = item.descuento||0;
        var precio = item.precioCustom||item.precio;
        ticketItems += '<div style="padding:8px 10px;border-bottom:1px solid var(--gray-100);">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+item.nombre+'</div>' +
              '<div style="font-size:10px;color:var(--gray-400);">S/ '+precio.toFixed(2)+'/u'+(desc>0?' · <span style="color:#16a34a;font-weight:700;">-'+desc+'%</span>':'')+'</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<button onclick="POSModule.cambiarQty('+i+',-1)" style="width:26px;height:26px;border-radius:6px;border:1.5px solid var(--gray-200);background:white;font-size:14px;font-weight:900;cursor:pointer;color:var(--gray-600);">−</button>' +
              '<span onclick="POSModule.editarQty('+i+')" style="min-width:28px;text-align:center;font-size:13px;font-weight:900;cursor:pointer;text-decoration:underline dotted;">'+item.qty+'</span>' +
              '<button onclick="POSModule.cambiarQty('+i+',1)" style="width:26px;height:26px;border-radius:6px;border:1.5px solid var(--gray-200);background:white;font-size:14px;font-weight:900;cursor:pointer;color:var(--gray-600);">+</button>' +
            '</div>' +
            '<span style="min-width:64px;text-align:right;font-size:13px;font-weight:900;color:var(--gray-800);">S/ '+item.total.toFixed(2)+'</span>' +
            '<button onclick="POSModule.quitar('+i+')" style="width:24px;height:24px;border-radius:5px;border:none;background:#fef2f2;color:#dc2626;font-size:11px;cursor:pointer;"><i class="fas fa-times"></i></button>' +
          '</div>' +
          '<div style="display:flex;gap:4px;">' +
            '<button onclick="POSModule.descuentoItem('+i+')" style="flex:1;padding:3px;font-size:10px;border-radius:5px;border:1px solid var(--gray-200);background:'+(desc>0?'#eff6ff':'white')+';color:'+(desc>0?'var(--accent)':'var(--gray-500)')+';cursor:pointer;font-weight:700;">' +
              '<i class="fas fa-percent"></i> '+(desc>0?desc+'% Dto':'Descuento')+'</button>' +
            '<button onclick="POSModule.editarPrecio('+i+')" style="flex:1;padding:3px;font-size:10px;border-radius:5px;border:1px solid var(--gray-200);background:'+(item.precioCustom?'#f0fdf4':'white')+';color:'+(item.precioCustom?'#16a34a':'var(--gray-500)')+';cursor:pointer;font-weight:700;">' +
              '<i class="fas fa-tag"></i> '+(item.precioCustom?'S/'+item.precioCustom.toFixed(2):'Precio esp.')+'</button>' +
            '<button onclick="POSModule.notaItem('+i+')" style="flex:1;padding:3px;font-size:10px;border-radius:5px;border:1px solid var(--gray-200);background:'+(item.nota?'#fffbeb':'white')+';color:'+(item.nota?'#d97706':'var(--gray-500)')+';cursor:pointer;font-weight:700;">' +
              '<i class="fas fa-sticky-note"></i> '+(item.nota?'Nota':'Agregar nota')+'</button>' +
          '</div>' +
          (item.nota ? '<div style="font-size:10px;color:#92400e;background:#fffbeb;padding:3px 8px;border-radius:4px;margin-top:4px;">📝 '+item.nota+'</div>' : '') +
        '</div>';
      });
    }

    // Totales
    var dctoTotal = this.getDescuentoTotal();
    var igv = 0;
    var totalesBox = '<div style="padding:10px 14px;background:var(--gray-50);border-top:1.5px solid var(--gray-200);">' +
      (dctoTotal>0 ? '<div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;margin-bottom:4px;"><span><i class="fas fa-tag"></i> Descuento:</span><span style="font-weight:700;">− S/ '+dctoTotal.toFixed(2)+'</span></div>' : '') +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--gray-600);margin-bottom:3px;"><span>Subtotal:</span><span>S/ '+total.toFixed(2)+'</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--gray-500);margin-bottom:8px;"><span>IGV (Exonerado):</span><span>S/ 0.00</span></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:linear-gradient(135deg,#1e3a5f,var(--accent));border-radius:10px;color:white;">' +
        '<span style="font-size:15px;font-weight:900;">TOTAL:</span>' +
        '<span style="font-size:22px;font-weight:900;">S/ '+total.toFixed(2)+'</span>' +
      '</div>' +
    '</div>';

    // Nota del ticket
    var notaBox = this.notaVenta ?
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fffbeb;border-radius:6px;margin-bottom:8px;font-size:11px;color:#92400e;">' +
        '<i class="fas fa-sticky-note"></i><span style="flex:1;">'+this.notaVenta+'</span>' +
        '<button onclick="POSModule.notaVenta=\'\';App.renderPage();" style="background:none;border:none;color:#92400e;cursor:pointer;"><i class="fas fa-times"></i></button>' +
      '</div>' : '';

    // Acciones del carrito
    var accionesBtns = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:8px;">' +
      [
        {fn:'POSModule.limpiar()',         i:'fa-trash',        c:'#dc2626', l:'Limpiar'},
        {fn:'POSModule.descuentoGlobal()', i:'fa-percent',      c:'#7c3aed', l:'Descuento'},
        {fn:'POSModule.agregarNota()',      i:'fa-sticky-note',  c:'#d97706', l:'Nota'},
        {fn:'POSModule.holdSale()',         i:'fa-pause-circle', c:'#0891b2', l:'Espera'},
        {fn:'POSModule.abrirCalculadora()',i:'fa-calculator',   c:'#16a34a', l:'Calc.'},
      ].map(function(a){
        return '<button onclick="'+a.fn+'" style="padding:7px 3px;border-radius:8px;border:1.5px solid var(--gray-200);background:white;font-size:10px;font-weight:700;color:var(--gray-600);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;" ' +
          'onmouseover="this.style.borderColor=\''+a.c+'\';this.style.background=\''+a.c+'11\'" ' +
          'onmouseout="this.style.borderColor=\'var(--gray-200)\';this.style.background=\'white\'">' +
          '<i class="fas '+a.i+'" style="font-size:14px;color:'+a.c+';"></i>'+a.l+'</button>';
      }).join('')+
    '</div>';

    // Botón cobrar
    var cobrarBtn = '<button class="pos-cobrar-btn" onclick="POSModule.cobrar()" '+(this.items.length===0?'disabled':'')+' ' +
      'style="width:100%;padding:14px 20px;background:'+(this.items.length>0?'linear-gradient(135deg,#065f46,#16a34a)':'var(--gray-200)')+';color:'+(this.items.length>0?'white':'var(--gray-400)')+';border:none;border-radius:12px;font-size:16px;font-weight:900;cursor:'+(this.items.length>0?'pointer':'not-allowed')+';display:flex;align-items:center;justify-content:space-between;gap:12px;transition:all 0.2s;box-shadow:'+(this.items.length>0?'0 4px 12px rgba(22,163,74,0.3)':'none')+'">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<i class="fas fa-credit-card" style="font-size:18px;"></i>' +
        '<div style="text-align:left;">' +
          '<div style="font-size:11px;opacity:0.85;">COBRAR VENTA</div>' +
          '<div style="font-size:20px;font-weight:900;">S/ '+total.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:4px;font-size:11px;opacity:0.8;">' +
        '<kbd style="padding:2px 5px;background:rgba(255,255,255,0.2);border-radius:3px;font-size:10px;">F2</kbd>' +
        '<i class="fas fa-arrow-right" style="font-size:14px;"></i>' +
      '</div>' +
    '</button>';

    // HTML FINAL
    return statsBar +
      '<div style="display:grid;grid-template-columns:1fr 360px;gap:14px;height:calc(100vh - 240px);">' +
        // LEFT
        '<div style="overflow:hidden;display:flex;flex-direction:column;">' +
          leftHeader + searchBar + favSection + catTabs + grid +
        '</div>' +
        // RIGHT
        '<div style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;">' +
          tiposBtns + clienteBox +
          '<div style="flex:1;background:white;border-radius:12px;border:1.5px solid var(--gray-200);overflow:hidden;display:flex;flex-direction:column;min-height:200px;">' +
            ticketHeader +
            '<div style="flex:1;overflow-y:auto;">'+ticketItems+'</div>' +
            totalesBox +
          '</div>' +
          notaBox + accionesBtns + cobrarBtn +
        '</div>' +
      '</div>';
  },

  // ──────────────────────────────────────────────────────
  // FUNCIONES DE PRODUCTOS
  // ──────────────────────────────────────────────────────
  setCategoria(c) { this.categoriaActiva=c; this.searchTerm=''; App.renderPage(); },
  buscar(v)        { this.searchTerm=v; App.renderPage(); },

  _toggleFav(id) {
    var idx = this.favoritos.indexOf(id);
    if (idx===-1) { this.favoritos.push(id); App.toast('⭐ Agregado a favoritos','info'); }
    else          { this.favoritos.splice(idx,1); App.toast('Quitado de favoritos','warning'); }
    App.renderPage();
  },

  agregar(id, qty) {
    var p = (DB.productos||[]).find(function(x){return x.id===id;});
    if (!p||(p.stock||0)===0) { App.toast('Sin stock disponible','error'); return; }
    qty = qty||1;
    var idx = this.items.findIndex(function(x){return x.prod_id===id;});
    if (idx>=0) {
      if (this.items[idx].qty+qty > (p.stock||0)) { App.toast('Stock insuficiente (máx: '+p.stock+')','warning'); return; }
      this.items[idx].qty += qty;
      this._recalcItem(idx);
    } else {
      this.items.push({prod_id:id,nombre:p.nombre,precio:p.precio_venta,precioCustom:null,descuento:0,qty,total:p.precio_venta*qty,nota:''});
    }
    this._checkMayorista();
    App.renderPage();
    App.toast(p.nombre+' ×'+qty+' ✓','success');
  },

  cambiarQty(idx, delta) {
    var p = (DB.productos||[]).find(function(x){return x.id===POSModule.items[idx].prod_id;});
    var nq = this.items[idx].qty+delta;
    if (nq<=0) { this.quitar(idx); return; }
    if (p && nq>(p.stock||0)) { App.toast('Stock máx: '+p.stock,'warning'); return; }
    this.items[idx].qty=nq; this._recalcItem(idx); this._checkMayorista(); App.renderPage();
  },

  editarQty(idx) {
    var p = (DB.productos||[]).find(function(x){return x.id===POSModule.items[idx].prod_id;});
    App.showModal('✏️ Cantidad — '+this.items[idx].nombre,
      '<div style="text-align:center;">' +
        '<div style="font-size:12px;color:var(--gray-500);margin-bottom:10px;">'+(p?'Stock disponible: '+p.stock+' uds':'')+'</div>' +
        '<input id="qtyInput" type="number" min="1" value="'+this.items[idx].qty+'" autofocus style="width:120px;padding:14px;font-size:28px;font-weight:900;text-align:center;border:2px solid var(--accent);border-radius:10px;outline:none;"/>' +
      '</div>',
      [{text:'✅ Aplicar',cls:'btn-primary',cb:function(){
        var v=parseInt(document.getElementById('qtyInput')?.value)||0;
        if(v<1){App.toast('Cantidad inválida','error');return;}
        if(p&&v>p.stock){App.toast('Stock máx: '+p.stock,'warning');return;}
        POSModule.items[idx].qty=v; POSModule._recalcItem(idx); POSModule._checkMayorista();
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='280px';
  },

  editarPrecio(idx) {
    var item=this.items[idx];
    var actual=(item.precioCustom||item.precio).toFixed(2);
    App.showModal('💲 Precio Especial — '+item.nombre,
      '<div style="text-align:center;">' +
        '<div style="font-size:12px;color:var(--gray-500);margin-bottom:6px;">Precio original: S/ '+item.precio.toFixed(2)+'</div>' +
        '<input id="precioInput" type="number" step="0.01" value="'+actual+'" autofocus style="width:160px;padding:14px;font-size:28px;font-weight:900;text-align:center;border:2px solid var(--accent);border-radius:10px;outline:none;"/>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:8px;">Deja vacío o igual al original para restaurar</div>' +
      '</div>',
      [{text:'✅ Aplicar',cls:'btn-primary',cb:function(){
        var v=parseFloat(document.getElementById('precioInput')?.value)||0;
        if(v<=0){App.toast('Precio inválido','error');return;}
        POSModule.items[idx].precioCustom=(v===item.precio)?null:v;
        POSModule._recalcItem(idx); App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='300px';
  },

  descuentoItem(idx) {
    var item=this.items[idx];
    var pcts=[5,10,15,20,25,30,50];
    App.showModal('% Descuento — '+item.nombre,
      '<div style="text-align:center;margin-bottom:12px;">' +
        '<input id="dctoInput" type="number" min="0" max="100" value="'+(item.descuento||0)+'" autofocus style="width:130px;padding:14px;font-size:28px;font-weight:900;text-align:center;border:2px solid var(--accent);border-radius:10px;outline:none;"/>' +
        '<span style="font-size:20px;font-weight:900;margin-left:6px;">%</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">' +
        pcts.map(function(p){return '<button onclick="document.getElementById(\'dctoInput\').value='+p+'" style="padding:6px 12px;background:#eff6ff;color:var(--accent);border:1.5px solid #93c5fd;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">'+p+'%</button>';}).join('')+
      '</div>',
      [{text:'✅ Aplicar',cls:'btn-primary',cb:function(){
        var v=parseFloat(document.getElementById('dctoInput')?.value)||0;
        if(v<0||v>100){App.toast('Valor entre 0 y 100','error');return;}
        POSModule.items[idx].descuento=v; POSModule._recalcItem(idx);
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='320px';
  },

  notaItem(idx) {
    App.showModal('📝 Nota del Ítem',
      '<input class="form-control" id="notaItemInput" value="'+(this.items[idx].nota||'')+'" autofocus placeholder="Ej: Sin picante, talla M..."/>',
      [{text:'✅ Guardar',cls:'btn-primary',cb:function(){
        POSModule.items[idx].nota=(document.getElementById('notaItemInput')?.value||'').trim();
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='360px';
  },

  quitar(idx) { this.items.splice(idx,1); this._checkMayorista(); App.renderPage(); },

  limpiar() {
    if(!this.items.length)return;
    App.showModal('🗑️ Limpiar Ticket',
      '<div style="text-align:center;padding:10px;"><i class="fas fa-trash" style="font-size:36px;color:#dc2626;display:block;margin-bottom:12px;"></i><div style="font-size:15px;font-weight:700;">¿Limpiar todo el ticket?</div><div style="font-size:12px;color:var(--gray-500);margin-top:4px;">Se eliminarán '+this.items.length+' producto(s)</div></div>',
      [{text:'🗑️ Sí, limpiar',cls:'btn-danger',cb:function(){
        POSModule.items=[]; POSModule.notaVenta=''; POSModule.mayoristaModo=false;
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='340px';
  },

  // ──────────────────────────────────────────────────────
  // MAYORISTA
  // ──────────────────────────────────────────────────────
  _checkMayorista() {
    var totalQty = this.items.reduce(function(s,i){return s+i.qty;},0);
    var debe = (DB.modoEvento === true) || totalQty >= 3;
    var cambio = debe!==this.mayoristaModo;
    this.mayoristaModo=debe;
    this.items.forEach(function(item,i){
      if(item.precioCustom)return;
      var p=(DB.productos||[]).find(function(x){return x.id===item.prod_id;});
      if(!p)return;
      item.precio=debe?(p.precio_mayorista||p.precio_venta):p.precio_venta;
      POSModule._recalcItem(i);
    });
    if(cambio){
      if(debe) App.toast('🏷️ Precio mayorista aplicado ('+totalQty+' uds)','info');
      else App.toast('↩️ Precio unitario restaurado','info');
    }
  },

  // ──────────────────────────────────────────────────────
  // DESCUENTO GLOBAL
  // ──────────────────────────────────────────────────────
  descuentoGlobal() {
    if(!this.items.length){App.toast('Agrega productos primero','warning');return;}
    var pcts=[5,10,15,20,25,50];
    App.showModal('💰 Descuento Global al Ticket',
      '<div style="text-align:center;margin-bottom:14px;">' +
        '<input id="dctoGlobal" type="number" min="0" max="100" value="0" autofocus style="width:130px;padding:14px;font-size:28px;font-weight:900;text-align:center;border:2px solid var(--accent);border-radius:10px;outline:none;"/>' +
        '<span style="font-size:20px;font-weight:900;margin-left:6px;">%</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:12px;">' +
        pcts.map(function(p){return '<button onclick="document.getElementById(\'dctoGlobal\').value='+p+'" style="padding:7px 14px;background:#eff6ff;color:var(--accent);border:1.5px solid #93c5fd;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">'+p+'%</button>';}).join('')+
      '</div>' +
      '<div style="text-align:center;font-size:12px;color:var(--gray-500);">Se aplicará a todos los '+this.items.length+' productos del ticket</div>',
      [{text:'✅ Aplicar a todo',cls:'btn-success',cb:function(){
        var v=parseFloat(document.getElementById('dctoGlobal')?.value)||0;
        if(v<0||v>100){App.toast('Valor entre 0 y 100','error');return;}
        POSModule.items.forEach(function(item,i){POSModule.items[i].descuento=v;POSModule._recalcItem(i);});
        App.toast('Descuento '+v+'% aplicado a '+POSModule.items.length+' productos','success');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='360px';
  },

  // ──────────────────────────────────────────────────────
  // NOTA DEL TICKET
  // ──────────────────────────────────────────────────────
  agregarNota() {
    App.showModal('📝 Nota del Ticket',
      '<textarea class="form-control" id="notaTicket" rows="3" placeholder="Observaciones para este ticket..." style="resize:none;">'+this.notaVenta+'</textarea>',
      [{text:'✅ Guardar',cls:'btn-primary',cb:function(){
        POSModule.notaVenta=(document.getElementById('notaTicket')?.value||'').trim();
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='380px';
  },

  // ──────────────────────────────────────────────────────
  // CALCULADORA
  // ──────────────────────────────────────────────────────
  abrirCalculadora() {
    var display = '0';
    App.showModal('🔢 Calculadora',
      '<div style="background:#1e293b;border-radius:14px;padding:16px;">' +
        '<div id="calcDisplay" style="font-size:32px;font-weight:900;color:white;text-align:right;padding:8px 4px;margin-bottom:12px;min-height:50px;word-break:break-all;">0</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">' +
          [['C','←','%','÷'],['7','8','9','×'],['4','5','6','−'],['1','2','3','+'],['0','.','=','=']].map(function(row){
            return row.map(function(k){
              var isOp=['÷','×','−','+','='].includes(k);
              var isClear=k==='C';
              return '<button onclick="POSModule._calcKey(\''+k+'\')" style="padding:14px;border-radius:10px;border:none;font-size:16px;font-weight:800;cursor:pointer;background:'+(isClear?'#ef4444':isOp?'var(--accent)':'#334155')+';color:white;transition:all 0.1s;" ' +
                'onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">'+k+'</button>';
            }).join('');
          }).join('') +
        '</div>' +
      '</div>',
      []
    );
    document.getElementById('modalBox').style.maxWidth='280px';
    this._calcBuffer='0'; this._calcOp=''; this._calcPrev=0;
  },

  _calcBuffer:'0', _calcOp:'', _calcPrev:0,
  _calcKey(k) {
    var disp = document.getElementById('calcDisplay');
    if(!disp)return;
    if(k==='C'){this._calcBuffer='0';this._calcOp='';this._calcPrev=0;disp.textContent='0';return;}
    if(k==='←'){this._calcBuffer=this._calcBuffer.length>1?this._calcBuffer.slice(0,-1):'0';disp.textContent=this._calcBuffer;return;}
    if(['÷','×','−','+'].includes(k)){
      this._calcPrev=parseFloat(this._calcBuffer)||0;
      this._calcOp=k; this._calcBuffer='0'; disp.textContent='0'; return;
    }
    if(k==='='){
      var a=this._calcPrev, b=parseFloat(this._calcBuffer)||0, r=b;
      if(this._calcOp==='÷') r=b!==0?a/b:0;
      if(this._calcOp==='×') r=a*b;
      if(this._calcOp==='−') r=a-b;
      if(this._calcOp==='+') r=a+b;
      this._calcBuffer=String(parseFloat(r.toFixed(4)));
      this._calcOp=''; this._calcPrev=0; disp.textContent=this._calcBuffer; return;
    }
    if(k==='.'){if(!this._calcBuffer.includes('.'))this._calcBuffer+='.';disp.textContent=this._calcBuffer;return;}
    if(k==='%'){var val=parseFloat(this._calcBuffer)||0;this._calcBuffer=String(val/100);disp.textContent=this._calcBuffer;return;}
    if(this._calcBuffer==='0') this._calcBuffer=k; else this._calcBuffer+=k;
    disp.textContent=this._calcBuffer;
  },

  // ──────────────────────────────────────────────────────
  // HOLD / EN ESPERA
  // ──────────────────────────────────────────────────────
  holdSale() {
    if(!this.items.length)return;
    App.showModal('⏸️ Guardar en Espera',
      '<div class="form-group">' +
        '<label class="form-label">Nombre o referencia</label>' +
        '<input class="form-control" id="holdNombre" autofocus placeholder="Ej: Mesa 3, Cliente Juan..." value="Espera #'+(this.ventasEnEspera.length+1)+'"/>' +
      '</div>',
      [{text:'⏸️ Guardar',cls:'btn-primary',cb:function(){
        var n=(document.getElementById('holdNombre')?.value||'Espera #'+(POSModule.ventasEnEspera.length+1)).trim();
        POSModule.ventasEnEspera.push({nombre:n,items:JSON.parse(JSON.stringify(POSModule.items)),
          cliente:POSModule.clienteSeleccionado,tipoComp:POSModule.tipoComp,nota:POSModule.notaVenta,
          hora:new Date().toLocaleTimeString('es-PE')});
        POSModule.items=[]; POSModule.notaVenta=''; POSModule.mayoristaModo=false;
        App.toast('⏸️ Venta guardada: '+n,'info'); App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='380px';
  },

  verEnEspera() {
    if(!this.ventasEnEspera.length)return;
    var rows = this.ventasEnEspera.map(function(v,i){
      var total=v.items.reduce(function(s,it){return s+it.total;},0);
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--gray-50);border-radius:10px;margin-bottom:8px;">' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:800;">'+v.nombre+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+v.items.length+' productos · '+v.hora+'</div>' +
        '</div>' +
        '<strong style="color:var(--accent);font-size:14px;">S/ '+total.toFixed(2)+'</strong>' +
        '<button onclick="POSModule.recuperarEspera('+i+')" style="padding:6px 12px;background:#16a34a;color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-play" style="margin-right:4px;"></i>Retomar</button>' +
        '<button onclick="POSModule.eliminarEspera('+i+')" style="padding:6px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:7px;font-size:12px;cursor:pointer;"><i class="fas fa-trash"></i></button>' +
      '</div>';
    }).join('');
    App.showModal('⏸️ Ventas en Espera',rows,[]);
    document.getElementById('modalBox').style.maxWidth='500px';
  },

  recuperarEspera(idx) {
    var v=this.ventasEnEspera[idx];
    if(this.items.length>0){
      App.showModal('⚠️ Reemplazar Ticket',
        '<div style="text-align:center;padding:10px;"><div style="font-size:14px;font-weight:700;margin-bottom:6px;">¿Reemplazar el ticket actual?</div><div style="font-size:12px;color:var(--gray-500);">Se perderán los '+this.items.length+' productos actuales</div></div>',
        [{text:'Sí, retomar',cls:'btn-danger',cb:function(){
          POSModule._doRecuperarEspera(idx); App.closeModal();
        }},{text:'Cancelar',cls:'btn-outline',cb:function(){App.closeModal();}}]
      );
      return;
    }
    this._doRecuperarEspera(idx);
    App.closeModal();
  },

  _doRecuperarEspera(idx) {
    var v=this.ventasEnEspera[idx];
    this.items=JSON.parse(JSON.stringify(v.items));
    this.clienteSeleccionado=v.cliente;
    this.tipoComp=v.tipoComp;
    this.notaVenta=v.nota;
    this.ventasEnEspera.splice(idx,1);
    this._checkMayorista();
    App.renderPage();
    App.toast('✅ Venta retomada','success');
  },

  eliminarEspera(idx) {
    this.ventasEnEspera.splice(idx,1); App.closeModal(); App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // CLIENTE
  // ──────────────────────────────────────────────────────
  cambiarCliente() {
    var lista = (DB.clientes||[]).filter(function(c){return c.tipo_cliente==='cliente';});
    App.showModal('👤 Seleccionar Cliente',
      '<div style="position:relative;margin-bottom:12px;">' +
        '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);"></i>' +
        '<input type="text" autofocus placeholder="Buscar por nombre o documento..." ' +
          'style="width:100%;padding:9px 10px 9px 34px;border:2px solid var(--accent);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;" ' +
          'oninput="POSModule._filtrarClientes(this.value)"/>' +
      '</div>' +
      '<div id="cliRes" style="max-height:320px;overflow-y:auto;">'+this._rowsCliente(lista)+'</div>',
      []
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  _rowsCliente(list) {
    if(!list.length) return '<div style="text-align:center;padding:24px;color:var(--gray-400);">Sin resultados</div>';
    return list.map(function(c){
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--gray-100);cursor:pointer;transition:background 0.1s;" ' +
        'onclick="POSModule.setCliente('+c.id+')" ' +
        'onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<div style="width:34px;height:34px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;">'+(c.nombre[0]||'?').toUpperCase()+'</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:700;">'+c.nombre+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+c.tipo+': '+c.doc+'</div>' +
        '</div>' +
        '<i class="fas fa-chevron-right" style="color:var(--gray-300);font-size:12px;"></i>' +
      '</div>';
    }).join('');
  },

  setCliente(id) {
    this.clienteSeleccionado=(DB.clientes||[]).find(function(x){return x.id===id;});
    App.closeModal(); App.renderPage();
    App.toast('✅ Cliente: '+this.clienteSeleccionado.nombre,'info');
  },

  _onDocInput(val) {
    var d=val.replace(/\D/g,'');
    if(d.length===8||d.length===11) this._buscarClienteDoc(d);
  },

  _buscarClienteDoc(val) {
    var found=(DB.clientes||[]).find(function(c){return c.doc===val;});
    if(found){
      this.clienteSeleccionado=found;
      var s=document.getElementById('posClienteStatus');
      if(s){s.textContent='✅ '+found.nombre.substring(0,25);s.style.color='#16a34a';}
      App.renderPage(); return;
    }
    this._consultarAPI(val);
  },

  async _consultarAPI(doc) {
    var tipo=doc.length===11?'RUC':'DNI';
    var s=document.getElementById('posClienteStatus');
    if(s){s.textContent='🔍 Buscando '+tipo+'...';s.style.color='#2563eb';}
    try {
      var endpoint=doc.length===11?'https://apiperu.dev/api/ruc':'https://apiperu.dev/api/dni';
      var res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':'Bearer 2568cd05aaa32855bded783fdb2a9a7ef984e2d136aaeaf2d59091dc48ef68cb'},body:JSON.stringify(doc.length===11?{ruc:doc}:{dni:doc})});
      var data=await res.json();
      if(data.success){
        var nombre=doc.length===11?(data.data.nombre_o_razon_social||''):(data.data.nombre_completo||'');
        var ct={id:Date.now(),doc,tipo,nombre,direccion:data.data?.direccion||'',telefono:'',email:'',tipo_cliente:'cliente'};
        DB.clientes.push(ct); this.clienteSeleccionado=ct;
        if(s){s.textContent='✅ '+nombre.substring(0,25);s.style.color='#16a34a';}
        App.renderPage(); App.toast('✅ '+nombre,'success');
      } else {
        if(s){s.textContent='❌ No encontrado';s.style.color='#dc2626';}
        App.toast('No se encontró el '+tipo,'warning');
      }
    } catch(e){
      if(s){s.textContent='⚠ Sin conexión';s.style.color='#d97706';}
    }
  },

  // ──────────────────────────────────────────────────────
  // COBRAR — MODAL PROFESIONAL
  // ──────────────────────────────────────────────────────
  cobrar() {
    if(!this.items.length)return;
    var total=this.getTotal();
    this._pagosDivActivo=false;
    this._metodoCobro='EFECTIVO';

    var metodos=[
      {v:'EFECTIVO', i:'fa-money-bill-wave', c:'#16a34a', l:'Efectivo'},
      {v:'TARJETA',  i:'fa-credit-card',     c:'#2563eb', l:'Tarjeta'},
      {v:'YAPE',     i:'fa-mobile-alt',       c:'#7c3aed', l:'Yape/Plin'},
      {v:'COMBINADO',i:'fa-layer-group',       c:'#0891b2', l:'Combinado'},
    ];

    var mBtns='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">' +
      metodos.map(function(m){
        return '<button id="mpb_'+m.v+'" onclick="POSModule._selMetodo(\''+m.v+'\')" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 6px;border-radius:12px;border:2px solid var(--gray-200);background:white;cursor:pointer;transition:all 0.15s;">' +
          '<i class="fas '+m.i+'" style="font-size:22px;color:'+m.c+';"></i>' +
          '<span style="font-size:11px;font-weight:700;color:var(--gray-600);">'+m.l+'</span></button>';
      }).join('')+'</div>';

    var billetes=[total,10,20,50,100,200].filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
    var billetesHtml='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
      billetes.map(function(v){
        return '<button onclick="document.getElementById(\'montoPOS\').value=\''+v.toFixed(2)+'\';POSModule._calcVuelto();" ' +
          'style="flex:1;min-width:44px;padding:8px;background:#f8faff;border:1.5px solid #93c5fd;color:#2563eb;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
          (v===total?'Exacto':'S/'+v)+'</button>';
      }).join('')+'</div>';

    var numpad='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">' +
      [7,8,9,4,5,6,1,2,3,'00',0,'C'].map(function(n){
        var isC=n==='C';
        return '<button onclick="POSModule._numpad(\''+n+'\')" style="padding:12px;border-radius:9px;border:1.5px solid var(--gray-200);background:'+(isC?'#fef2f2':'white')+';color:'+(isC?'#dc2626':'var(--gray-800)')+';font-size:16px;font-weight:800;cursor:pointer;transition:all 0.1s;" ' +
          'onmouseover="this.style.background=\'var(--gray-100)\'" onmouseout="this.style.background=\''+(isC?'#fef2f2':'white')+'\'">'+
          (isC?'<i class="fas fa-backspace"></i>':n)+'</button>';
      }).join('')+'</div>';

    var html=
      '<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:14px;padding:18px;text-align:center;margin-bottom:16px;color:white;">' +
        '<div style="font-size:12px;opacity:0.8;font-weight:700;letter-spacing:1px;margin-bottom:4px;">TOTAL A COBRAR</div>' +
        '<div style="font-size:38px;font-weight:900;">S/ '+total.toFixed(2)+'</div>' +
        '<div style="font-size:11px;opacity:0.7;margin-top:2px;">'+this.items.length+' producto(s) · '+this.tipoComp+' · '+(this.clienteSeleccionado?this.clienteSeleccionado.nombre.substring(0,20):'Público General')+'</div>' +
      '</div>' +
      '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Método de Pago</div>' +
      mBtns +
      '<label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;font-size:13px;font-weight:600;">' +
        '<input type="checkbox" id="togglePagoDiv" onchange="POSModule._togglePagoDiv(this.checked,'+total+')" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;"/>' +
        'Pago dividido (varios métodos)' +
      '</label>' +
      '<div id="seccionEfectivo">' +
        '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">Monto Recibido</div>' +
        '<input id="montoPOS" type="number" step="0.01" value="'+total.toFixed(2)+'" oninput="POSModule._calcVuelto()" ' +
          'style="width:100%;padding:12px;font-size:26px;font-weight:900;text-align:center;border:2px solid var(--accent);border-radius:10px;margin-bottom:10px;outline:none;box-sizing:border-box;"/>' +
        billetesHtml + numpad +
        '<div id="vueltoBox" style="padding:12px;border-radius:10px;text-align:center;font-weight:800;font-size:16px;background:#f0fdf4;color:#16a34a;border:2px solid #86efac;">Vuelto: S/ 0.00</div>' +
      '</div>' +
      '<div id="seccionPagoDiv" style="display:none;">' +
        '<div id="pagosDivContainer"></div>' +
        '<button onclick="POSModule._agregarPagoDiv()" style="width:100%;padding:8px;border:1.5px dashed var(--gray-300);border-radius:8px;background:none;color:var(--gray-500);cursor:pointer;font-size:13px;font-weight:600;margin:8px 0;"><i class="fas fa-plus"></i> Agregar método</button>' +
        '<div id="resumenPagoDiv"></div>' +
      '</div>' +
      '<div id="seccionCombinado" style="display:none;">' +
        '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">Tipo de Combinación</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
          '<button id="comb_YAPE" onclick="POSModule._selSubCombinado(\'YAPE+EFECTIVO\','+total+')" style="padding:12px;border-radius:10px;border:2px solid #7c3aed;background:#f5f3ff;cursor:pointer;font-weight:800;font-size:13px;color:#7c3aed;"><i class="fas fa-mobile-alt" style="margin-right:6px;"></i>Yape + Efectivo</button>' +
          '<button id="comb_TARJETA" onclick="POSModule._selSubCombinado(\'TARJETA+EFECTIVO\','+total+')" style="padding:12px;border-radius:10px;border:2px solid var(--gray-200);background:white;cursor:pointer;font-weight:800;font-size:13px;color:var(--gray-600);"><i class="fas fa-credit-card" style="color:#2563eb;margin-right:6px;"></i>Tarjeta + Efectivo</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
          '<div><div id="labelCombA" style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">Yape/Plin</div>' +
            '<input id="montoCombinadoA" type="number" step="0.01" placeholder="0.00" style="width:100%;padding:12px;font-size:22px;font-weight:900;text-align:center;border:2px solid #7c3aed;border-radius:10px;outline:none;box-sizing:border-box;" oninput="POSModule._calcCombinado('+total+')"/></div>' +
          '<div><div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">Efectivo</div>' +
            '<input id="montoCombinadoB" type="number" step="0.01" placeholder="0.00" style="width:100%;padding:12px;font-size:22px;font-weight:900;text-align:center;border:2px solid #16a34a;border-radius:10px;outline:none;box-sizing:border-box;" oninput="POSModule._calcCombinado('+total+')"/></div>' +
        '</div>' +
        '<div id="vueltoBoxComb" style="padding:12px;border-radius:10px;text-align:center;font-weight:800;font-size:15px;background:#fef3c7;color:#d97706;border:2px solid #fde68a;"><i class="fas fa-info-circle"></i> Ingresa los montos</div>' +
      '</div>';

    App.showModal('💳 Cobrar Venta',html,[
      {text:'✅ Confirmar Cobro',cls:'btn-success',cb:function(){POSModule._confirmarCobro(total);}}
    ]);
    document.getElementById('modalBox').style.maxWidth='480px';
    setTimeout(function(){POSModule._selMetodo('EFECTIVO');POSModule._calcVuelto();},60);
  },

  _selMetodo(val) {
    var colors={EFECTIVO:'#16a34a',TARJETA:'#2563eb',YAPE:'#7c3aed',COMBINADO:'#0891b2'};
    ['EFECTIVO','TARJETA','YAPE','COMBINADO'].forEach(function(m){
      var btn=document.getElementById('mpb_'+m); if(!btn)return;
      if(m===val){btn.style.background=colors[m]+'18';btn.style.borderColor=colors[m];btn.style.transform='scale(1.04)';}
      else{btn.style.background='white';btn.style.borderColor='var(--gray-200)';btn.style.transform='none';}
    });
    this._metodoCobro=val;
    var sE=document.getElementById('seccionEfectivo');
    var sC=document.getElementById('seccionCombinado');
    if(sE) sE.style.display=val==='EFECTIVO'?'block':'none';
    if(sC) sC.style.display=val==='COMBINADO'?'block':'none';
    if(val==='COMBINADO') setTimeout(function(){POSModule._selSubCombinado(POSModule._subMetodoCombinado,POSModule.getTotal());},30);
    if(val!=='EFECTIVO'){var vb=document.getElementById('vueltoBox');if(vb){vb.style.background='#eff6ff';vb.style.color='#2563eb';vb.style.borderColor='#93c5fd';vb.innerHTML='<i class="fas fa-check-circle"></i> Pago exacto con '+val;}}
    else this._calcVuelto();
  },

  _togglePagoDiv(act,total) {
    this._pagosDivActivo=act;
    var sE=document.getElementById('seccionEfectivo');
    var sD=document.getElementById('seccionPagoDiv');
    var sC=document.getElementById('seccionCombinado');
    if(sE) sE.style.display=act?'none':'block';
    if(sD) sD.style.display=act?'block':'none';
    if(sC) sC.style.display='none';
    if(act){this._pagosDiv=[{metodo:'EFECTIVO',monto:parseFloat((total/2).toFixed(2))},{metodo:'YAPE',monto:parseFloat((total/2).toFixed(2))}];this._renderPagosDivUI(total);}
  },

  _agregarPagoDiv() { this._pagosDiv.push({metodo:'EFECTIVO',monto:0}); this._renderPagosDivUI(this.getTotal()); },

  _renderPagosDivUI(total) {
    var c=document.getElementById('pagosDivContainer'); if(!c)return;
    c.innerHTML=this._pagosDiv.map(function(p,i){
      return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">' +
        '<select style="flex:1;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;" onchange="POSModule._pagosDiv['+i+'].metodo=this.value">' +
          ['EFECTIVO','TARJETA','YAPE','TRANSFERENCIA'].map(function(m){return '<option value="'+m+'"'+(p.metodo===m?' selected':'')+'>'+m+'</option>';}).join('')+
        '</select>' +
        '<input type="number" step="0.01" value="'+p.monto.toFixed(2)+'" style="width:100px;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:14px;font-weight:700;text-align:center;" oninput="POSModule._pagosDiv['+i+'].monto=parseFloat(this.value)||0;POSModule._updateResumenDiv('+total+')"/>' +
        (i>0?'<button onclick="POSModule._pagosDiv.splice('+i+',1);POSModule._renderPagosDivUI('+total+')" style="padding:8px;border:none;background:#fef2f2;color:#dc2626;border-radius:6px;cursor:pointer;"><i class="fas fa-times"></i></button>':'<div style="width:32px;"></div>')+
      '</div>';
    }).join('');
    this._updateResumenDiv(total);
  },

  _updateResumenDiv(total) {
    var pagado=this._pagosDiv.reduce(function(s,p){return s+(p.monto||0);},0);
    var falta=total-pagado, vuelto=pagado-total;
    var r=document.getElementById('resumenPagoDiv'); if(!r)return;
    r.innerHTML='<div style="background:var(--gray-50);padding:12px;border-radius:8px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>Total:</span><strong>S/ '+total.toFixed(2)+'</strong></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>Ingresado:</span><strong style="color:var(--accent);">S/ '+pagado.toFixed(2)+'</strong></div>' +
      (falta>0.005?'<div style="background:#fef2f2;padding:8px;border-radius:6px;text-align:center;font-weight:800;color:#dc2626;">Falta: S/ '+falta.toFixed(2)+'</div>':
        '<div style="background:#f0fdf4;padding:8px;border-radius:6px;text-align:center;font-weight:800;color:#16a34a;">Vuelto: S/ '+Math.max(0,vuelto).toFixed(2)+'</div>')+
    '</div>';
  },

  _numpad(k) {
    var inp=document.getElementById('montoPOS'); if(!inp)return;
    if(k==='C') inp.value=inp.value.slice(0,-1)||'0';
    else if(inp.value==='0') inp.value=k;
    else inp.value+=k;
    this._calcVuelto();
  },

  _calcVuelto() {
    var total=this.getTotal(), monto=parseFloat(document.getElementById('montoPOS')?.value)||0;
    var vuelto=monto-total, vb=document.getElementById('vueltoBox'); if(!vb)return;
    if(vuelto<0){vb.style.background='#fef2f2';vb.style.color='#dc2626';vb.style.borderColor='#fca5a5';vb.innerHTML='<i class="fas fa-exclamation-triangle"></i> Falta: S/ '+Math.abs(vuelto).toFixed(2);}
    else{vb.style.background='#f0fdf4';vb.style.color='#16a34a';vb.style.borderColor='#86efac';vb.innerHTML='<i class="fas fa-check-circle"></i> Vuelto: S/ '+vuelto.toFixed(2);}
  },

  _selSubCombinado(tipo,total) {
    this._subMetodoCombinado=tipo;
    var lA=document.getElementById('labelCombA'),iA=document.getElementById('montoCombinadoA');
    var bY=document.getElementById('comb_YAPE'),bT=document.getElementById('comb_TARJETA');
    if(tipo==='YAPE+EFECTIVO'){
      if(lA)lA.textContent='Yape/Plin'; if(iA)iA.style.borderColor='#7c3aed';
      if(bY){bY.style.background='#f5f3ff';bY.style.borderColor='#7c3aed';bY.style.color='#7c3aed';}
      if(bT){bT.style.background='white';bT.style.borderColor='var(--gray-200)';bT.style.color='var(--gray-600)';}
    } else {
      if(lA)lA.textContent='Tarjeta'; if(iA)iA.style.borderColor='#2563eb';
      if(bT){bT.style.background='#eff6ff';bT.style.borderColor='#2563eb';bT.style.color='#2563eb';}
      if(bY){bY.style.background='white';bY.style.borderColor='var(--gray-200)';bY.style.color='var(--gray-600)';}
    }
    this._calcCombinado(total||this.getTotal());
  },

  _calcCombinado(total) {
    var a=parseFloat(document.getElementById('montoCombinadoA')?.value)||0;
    var b=parseFloat(document.getElementById('montoCombinadoB')?.value)||0;
    var suma=a+b, diff=suma-total, vb=document.getElementById('vueltoBoxComb'); if(!vb)return;
    if(a<=0&&b<=0){vb.style.background='#fef3c7';vb.style.color='#d97706';vb.style.borderColor='#fde68a';vb.innerHTML='<i class="fas fa-info-circle"></i> Ingresa los montos';}
    else if(diff<-0.005){vb.style.background='#fef2f2';vb.style.color='#dc2626';vb.style.borderColor='#fca5a5';vb.innerHTML='<i class="fas fa-exclamation-triangle"></i> Falta: S/ '+Math.abs(diff).toFixed(2);}
    else{vb.style.background='#f0fdf4';vb.style.color='#16a34a';vb.style.borderColor='#86efac';vb.innerHTML='<i class="fas fa-check-circle"></i> Vuelto: S/ '+Math.max(0,diff).toFixed(2);}
  },

  // ──────────────────────────────────────────────────────
  // CONFIRMAR COBRO
  // ──────────────────────────────────────────────────────
  _confirmarCobro(total) {
    var metodo, montoPagado, vuelto;

    if(this._pagosDivActivo){
      var pagado=this._pagosDiv.reduce(function(s,p){return s+(p.monto||0);},0);
      if(pagado<total-0.005){App.toast('Falta S/ '+(total-pagado).toFixed(2),'error');return;}
      metodo=this._pagosDiv.map(function(p){return p.metodo+'('+p.monto.toFixed(2)+')';}).join(' + ');
      montoPagado=pagado; vuelto=Math.max(0,pagado-total);
    } else if(this._metodoCobro==='COMBINADO'){
      var mA=parseFloat(document.getElementById('montoCombinadoA')?.value)||0;
      var mB=parseFloat(document.getElementById('montoCombinadoB')?.value)||0;
      if(mA<=0&&mB<=0){App.toast('Ingresa los montos','error');return;}
      montoPagado=mA+mB;
      if(montoPagado<total-0.005){App.toast('Falta S/ '+(total-montoPagado).toFixed(2),'error');return;}
      var tA=this._subMetodoCombinado==='YAPE+EFECTIVO'?'YAPE':'TARJETA';
      metodo=tA+'(S/'+mA.toFixed(2)+') + EFECTIVO(S/'+mB.toFixed(2)+')';
      vuelto=Math.max(0,montoPagado-total);
    } else {
      metodo=this._metodoCobro||'EFECTIVO';
      montoPagado=metodo==='EFECTIVO'?(parseFloat(document.getElementById('montoPOS')?.value)||total):total;
      if(metodo==='EFECTIVO'&&montoPagado<total-0.005){App.toast('Monto insuficiente','error');return;}
      vuelto=Math.max(0,montoPagado-total);
    }

    var serieMap={NV:'NV03',BOL:'BV03',FAC:'FC01'};
    var tipoMap={NV:'N. VENTA',BOL:'BOL',FAC:'FAC'};
    var tipoNomMap={NV:'NOTA DE VENTA',BOL:'BOLETA DE VENTA ELECTRONICA',FAC:'FACTURA ELECTRONICA'};
    var serie=serieMap[this.tipoComp]||'NV03';
    var numero=DB.nextNumber(serie);
    var fecha=this._fechaLocal(), hora=this._horaLocal();

    var venta={
      id:Date.now(), fecha, hora, serie, numero,
      tipo:tipoMap[this.tipoComp],
      cliente_id:this.clienteSeleccionado?this.clienteSeleccionado.id:1,
      items:this.items.map(function(i){return{prod_id:i.prod_id,nombre:i.nombre,qty:i.qty,precio:i.precioCustom||i.precio,total:i.total,nota:i.nota||''};}),
      subtotal:total,igv:0,total,
      tipo_comprobante:tipoNomMap[this.tipoComp],
      metodo_pago:metodo, monto_pago:montoPagado, vuelto,
      nota:this.notaVenta, estado:'NO_ENVIADO',
      cajero:DB.usuarioActual?.usuario||'—',
      cliente_nombre:this.clienteSeleccionado?.nombre||'PÚBLICO EN GENERAL',
      cliente_doc:this.clienteSeleccionado?.doc||'00000000'
     };

    var itemsCopy=JSON.parse(JSON.stringify(this.items));
    itemsCopy.forEach(function(item){
      var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
      if(pi>=0) DB.productos[pi].stock=Math.max(0,(DB.productos[pi].stock||0)-item.qty);
    });
    Storage.guardarProductos();
    itemsCopy.forEach(function(item){
    var pi=(DB.productos||[]).findIndex(function(p){return p.id===item.prod_id;});
    if(pi>=0) SupabaseDB.actualizarProducto(DB.productos[pi]);
    });
    SupabaseDB.guardarVenta(venta);
    DB.ventas.unshift(venta);
    Storage.guardarVentas();
    if(typeof KardexModule!=='undefined') KardexModule.registrar(itemsCopy,'SALIDA','Venta POS '+serie+'-'+numero);

    ModoEventoModule.registrarVentaEvento(total);
    App.closeModal();
    App.toast('✅ '+serie+'-'+numero+' · Vuelto: S/ '+vuelto.toFixed(2),'success');
    this._mostrarDetalleVenta(venta);
    this.items=[]; this.notaVenta=''; this.mayoristaModo=false;
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // DETALLE POST-VENTA
  // ──────────────────────────────────────────────────────
  _mostrarDetalleVenta(venta) {
    var cli=(DB.clientes||[]).find(function(c){return c.id===venta.cliente_id;});
    var tipoLabel={'N. VENTA':'NOTA DE VENTA',BOL:'BOLETA DE VENTA',FAC:'FACTURA ELECTRÓNICA'};
    var itemsHtml=venta.items.map(function(i){
      return '<tr><td style="padding:7px 4px;font-size:12px;">'+i.nombre+(i.nota?'<div style="font-size:10px;color:#d97706;">📝 '+i.nota+'</div>':'')+'</td>' +
        '<td style="text-align:center;padding:7px 4px;font-size:12px;font-weight:700;">'+i.qty+'</td>' +
        '<td style="text-align:right;padding:7px 4px;font-size:12px;">S/ '+i.precio.toFixed(2)+'</td>' +
        '<td style="text-align:right;padding:7px 4px;font-size:13px;font-weight:900;color:var(--accent);">S/ '+i.total.toFixed(2)+'</td></tr>';
    }).join('');

    App.showModal(tipoLabel[venta.tipo]||venta.tipo_comprobante,
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">' +
        '<div><div style="font-size:16px;font-weight:900;color:var(--accent);">'+venta.serie+' — '+venta.numero+'</div>' +
          '<div style="font-size:12px;color:var(--gray-400);">'+venta.fecha+' '+venta.hora+'</div></div>' +
        '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:#fffbeb;color:#d97706;border:1px solid #fde68a;">NO ENVIADO</span>' +
      '</div>' +
      '<div style="background:var(--gray-50);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;font-weight:700;">'+(cli?cli.nombre:'PÚBLICO GENERAL')+'</div>' +
      '<div style="border:1px solid var(--gray-200);border-radius:10px;overflow:hidden;margin-bottom:12px;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);">' +
            '<th style="padding:8px 4px;text-align:left;font-size:10px;color:var(--gray-500);text-transform:uppercase;">Producto</th>' +
            '<th style="padding:8px 4px;text-align:center;font-size:10px;color:var(--gray-500);text-transform:uppercase;">Cant</th>' +
            '<th style="padding:8px 4px;text-align:right;font-size:10px;color:var(--gray-500);text-transform:uppercase;">Precio</th>' +
            '<th style="padding:8px 4px;text-align:right;font-size:10px;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
          '</tr></thead><tbody>'+itemsHtml+'</tbody></table>' +
      '</div>' +
      '<div style="padding:12px 14px;background:linear-gradient(135deg,#1e3a5f,var(--accent));border-radius:10px;color:white;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<span style="font-size:16px;font-weight:900;">TOTAL:</span>' +
        '<span style="font-size:22px;font-weight:900;">S/ '+venta.total.toFixed(2)+'</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--gray-600);line-height:1.8;">' +
        '<div><b>Método:</b> '+venta.metodo_pago+'</div>' +
        '<div><b>Recibido:</b> S/ '+venta.monto_pago.toFixed(2)+'</div>' +
        '<div style="color:#16a34a;font-weight:700;"><b>Vuelto:</b> S/ '+venta.vuelto.toFixed(2)+'</div>' +
        (venta.nota?'<div><b>Nota:</b> '+venta.nota+'</div>':'') +
      '</div>',
      [
        {text:'<i class="fas fa-print"></i> Imprimir',cls:'btn-primary',cb:function(){App.closeModal();POSModule._imprimirTicket(venta);}},
        {text:'<i class="fas fa-share-alt"></i> WhatsApp',cls:'btn-outline',cb:function(){
          var cli2=(DB.clientes||[]).find(function(c){return c.id===venta.cliente_id;});
          if(cli2&&cli2.telefono){
            var msg=encodeURIComponent('*'+DB.empresa.nombre+'*\n'+venta.serie+'-'+venta.numero+'\nTotal: S/ '+venta.total.toFixed(2)+'\n¡Gracias por su compra!');
            window.open('https://wa.me/51'+cli2.telefono.replace(/\D/g,'')+'?text='+msg,'_blank');
          } else App.toast('El cliente no tiene teléfono registrado','warning');
        }},
      ]
    );
    document.getElementById('modalBox').style.maxWidth='520px';
  },

  // ──────────────────────────────────────────────────────
  // IMPRIMIR TICKET
  // ──────────────────────────────────────────────────────
  _imprimirTicket(venta) {
    var cli=(DB.clientes||[]).find(function(c){return c.id===venta.cliente_id;});
    var w=window.open('','_blank','width=380,height=650');
    if(!w){App.toast('Activa ventanas emergentes para imprimir','warning');return;}
    var itemsHtml=venta.items.map(function(i){
      return '<tr><td style="padding:3px 0;">'+i.nombre+(i.nota?'<br><small style="color:#666;">'+i.nota+'</small>':'')+'</td><td style="text-align:center;padding:3px 4px;">'+i.qty+'</td><td style="text-align:right;padding:3px 0;">S/'+i.precio.toFixed(2)+'</td><td style="text-align:right;padding:3px 0;font-weight:700;">S/'+i.total.toFixed(2)+'</td></tr>';
    }).join('');
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+venta.serie+'-'+venta.numero+'</title>' +
      '<style>body{font-family:"Courier New",monospace;font-size:12px;max-width:300px;margin:0 auto;padding:12px;}' +
      '.center{text-align:center;}.bold{font-weight:bold;}.big{font-size:15px;}.xl{font-size:22px;}' +
      'hr{border:none;border-top:1px dashed #000;margin:8px 0;}' +
      'table{width:100%;border-collapse:collapse;}th{border-bottom:1px solid #000;padding:3px 0;font-size:11px;}td{font-size:11px;}' +
      '.total-box{border:2px solid #000;padding:8px;text-align:center;margin:8px 0;border-radius:4px;}' +
      '@media print{body{max-width:100%;}}</style></head><body>' +
      (DB.empresa.logo?'<div class="center"><img src="'+DB.empresa.logo+'" style="max-height:60px;margin-bottom:6px;"></div>':'')+
      '<div class="center bold big">'+DB.empresa.nombre+'</div>' +
      '<div class="center">RUC: '+DB.empresa.ruc+'</div>' +
      '<div class="center" style="font-size:11px;">'+DB.empresa.direccion+'</div>' +
      (DB.empresa.telefono?'<div class="center" style="font-size:11px;">Tel: '+DB.empresa.telefono+'</div>':'')+
      '<hr/><div class="center bold big">'+venta.tipo_comprobante+'</div>' +
      '<div class="center bold">'+venta.serie+' - '+venta.numero+'</div><hr/>' +
      '<div>Fecha: <strong>'+venta.fecha+' '+venta.hora+'</strong></div>' +
      '<div>Cliente: <strong>'+(cli?cli.nombre:'PÚBLICO EN GENERAL')+'</strong></div>' +
      (cli&&cli.tipo!=='DNI'&&cli.doc!=='00000000'?'<div>'+cli.tipo+': '+cli.doc+'</div>':'')+
      (venta.nota?'<div>Nota: '+venta.nota+'</div>':'')+
      '<hr/><table><thead><tr><th style="text-align:left;">Producto</th><th>Cant</th><th style="text-align:right;">P.Unit</th><th style="text-align:right;">Total</th></tr></thead>' +
      '<tbody>'+itemsHtml+'</tbody></table><hr/>' +
      '<div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>S/ '+venta.subtotal.toFixed(2)+'</span></div>' +
      '<div style="display:flex;justify-content:space-between;"><span>IGV (Exonerado):</span><span>S/ 0.00</span></div>' +
      '<div class="total-box"><div class="bold">TOTAL A PAGAR</div><div class="xl bold">S/ '+venta.total.toFixed(2)+'</div></div><hr/>' +
      '<div style="display:flex;justify-content:space-between;"><span>Método pago:</span><span><b>'+venta.metodo_pago.replace(/\+/g,' + ')+'</b></span></div>' +
      '<div style="display:flex;justify-content:space-between;"><span>Monto recibido:</span><span>S/ '+venta.monto_pago.toFixed(2)+'</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-weight:bold;"><span>VUELTO:</span><span>S/ '+venta.vuelto.toFixed(2)+'</span></div><hr/>' +
      '<div class="center bold" style="font-size:14px;">¡GRACIAS POR SU COMPRA!</div>' +
      '<div class="center" style="font-size:10px;margin-top:4px;">'+DB.empresa.nombre+' · '+DB.empresa.direccion+'</div>' +
      (DB.empresa.whatsapp?'<div class="center" style="font-size:10px;">WhatsApp: +51'+DB.empresa.whatsapp+'</div>':'')+
      '</body></html>'
    );
    w.document.close();
    setTimeout(function(){w.print();},250);
  },

  // ──────────────────────────────────────────────────────
  // TECLADO
  // ──────────────────────────────────────────────────────
  _onSearchKey(e) {
    if(e.key==='Enter'){
      var term=(e.target.value||'').trim(); if(!term)return;
      var p=(DB.productos||[]).find(function(x){return (x.codigo||'').toLowerCase()===term.toLowerCase();});
      if(p){this.agregar(p.id);this.searchTerm='';App.renderPage();setTimeout(function(){var s=document.getElementById('posSearch');if(s){s.value='';s.focus();}},50);}
      else{var m=this.getProductosFiltrados();if(m.length===1){this.agregar(m[0].id);this.searchTerm='';App.renderPage();setTimeout(function(){var s=document.getElementById('posSearch');if(s){s.value='';s.focus();}},50);}
      else if(m.length===0) App.toast('Producto no encontrado: '+term,'error');}
    }
    if(e.key==='Escape') this.buscar('');
  },

  _initKeyboard() {
    document.removeEventListener('keydown',POSModule._keyHandler);
    document.addEventListener('keydown',POSModule._keyHandler);
  },

  _keyHandler(e) {
    if(!document.getElementById('modalOverlay')?.classList.contains('hidden'))return;
    if(App.currentPage!=='pos')return;
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(e.key==='F1'){e.preventDefault();var s=document.getElementById('posSearch');if(s){s.focus();s.select();}}
    if(e.key==='F2'){e.preventDefault();POSModule.cobrar();}
    if(e.key==='F3'){e.preventDefault();POSModule.holdSale();}
    if(e.key==='Escape') POSModule.buscar('');
    if(e.key==='Delete'&&POSModule.items.length>0) POSModule.quitar(POSModule.items.length-1);
  },
};
