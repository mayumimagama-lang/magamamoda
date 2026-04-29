// ============================================================
// MÓDULO: PUNTO DE VENTA (POS) — Versión Profesional
// ============================================================

const POSModule = {
  items: [],
  categoriaActiva: 'todos',
  searchTerm: '',
  clienteSeleccionado: null,
  tipoComp: 'NV',           // NV | BOL | FAC
  notaVenta: '',
  ventasEnEspera: [],
  _metodoCobro: 'EFECTIVO',
  _pagosDiv: [],            // pagos divididos
  _pagosDivActivo: false,
  _barcodeBuffer: '',
  _barcodeTimer: null,

  // ──────────────────────────────────────────────────────
  // UTILIDADES
  // ──────────────────────────────────────────────────────
  get categorias() {
    var cats = ['todos'];
    DB.productos.forEach(function(p) {
      if (cats.indexOf(p.categoria) === -1) cats.push(p.categoria);
    });
    return cats;
  },

  _fechaLocal: function() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },

  _horaLocal: function() {
    return new Date().toTimeString().slice(0,8);
  },

  _emoji: function(cat) {
    var map = { Alimentos:'🥫', Bebidas:'🥤', Lacteos:'🥛', Limpieza:'🧹',
                Higiene:'🧴', Hogar:'🏠', Snacks:'🍪', Condimentos:'🥄', General:'📦' };
    return map[cat] || '📦';
  },

  getTotal: function() {
    return this.items.reduce(function(s, i) { return s + i.total; }, 0);
  },

  getDescuentoTotal: function() {
    return this.items.reduce(function(s, item) {
      var precio = item.precioCustom || item.precio;
      var dcto   = item.descuento   || 0;
      return s + (item.qty * precio * dcto / 100);
    }, 0);
  },

  _recalcItem: function(idx) {
    var item   = this.items[idx];
    var precio = item.precioCustom || item.precio;
    var dcto   = item.descuento    || 0;
    item.total = item.qty * precio * (1 - dcto / 100);
  },

  getProductosFiltrados: function() {
    var self = this;
    return DB.productos.filter(function(p) {
      var matchCat = self.categoriaActiva === 'todos' || p.categoria === self.categoriaActiva;
      var matchSearch = !self.searchTerm ||
        p.nombre.toLowerCase().indexOf(self.searchTerm.toLowerCase()) >= 0 ||
        p.codigo.toLowerCase().indexOf(self.searchTerm.toLowerCase()) >= 0;
      return matchCat && matchSearch;
    });
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render: function() {
    App.setTabs2('Punto de Venta', 'POS');
    if (!this.clienteSeleccionado) {
      this.clienteSeleccionado = DB.clientes.find(function(c) { return c.doc === '00000000'; }) || DB.clientes[0];
    }
    var total = this.getTotal();
    var self  = this;

    // -- PANEL IZQUIERDO: header --
    var leftHeader =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;' +
        'padding:10px 14px;background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:38px;height:38px;background:linear-gradient(135deg,#b71c1c,#e53935);border-radius:10px;' +
            'display:flex;align-items:center;justify-content:center;color:white;font-size:17px;">' +
            '<i class="fas fa-cash-register"></i></div>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:800;color:var(--gray-900);">PUNTO DE VENTA</div>' +
            '<div style="font-size:11px;color:var(--gray-500);">' + new Date().toLocaleString('es-PE') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          (this.ventasEnEspera.length > 0 ?
            '<button class="btn btn-sm" style="border:1.5px solid #d97706;color:#d97706;background:#fffbeb;" onclick="POSModule.verEnEspera()">' +
              '<i class="fas fa-pause-circle"></i> En espera (' + this.ventasEnEspera.length + ')</button>' : '') +
          '<div style="display:flex;gap:4px;align-items:center;">' +
            '<span class="pos-kbd">F1</span><span style="font-size:10px;color:var(--gray-400);">Buscar</span>' +
            '<span class="pos-kbd" style="margin-left:6px;">F2</span><span style="font-size:10px;color:var(--gray-400);">Cobrar</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    // -- Barra de búsqueda --
    var searchBar =
      '<div class="pos-search" style="margin-bottom:12px;">' +
        '<i class="fas fa-barcode" style="color:var(--gray-400);font-size:18px;"></i>' +
        '<input type="text" id="posSearch" placeholder="Escanear código de barras o buscar producto..." ' +
          'value="' + this.searchTerm + '" autocomplete="off" ' +
          'oninput="POSModule.buscar(this.value)" ' +
          'onkeydown="POSModule._onSearchKey(event)"/>' +
        (this.searchTerm ?
          '<button style="background:var(--gray-200);color:var(--gray-600);padding:4px 10px;border-radius:6px;' +
            'font-size:12px;border:none;cursor:pointer;" onclick="POSModule.buscar(\'\')"><i class="fas fa-times"></i></button>' : '') +
      '</div>';

    // -- Categorías --
    var catTabs = '<div class="pos-cat-tabs" style="margin-bottom:12px;">';
    this.categorias.forEach(function(c) {
      var cnt   = c === 'todos' ? DB.productos.length : DB.productos.filter(function(p){return p.categoria===c;}).length;
      var activo = self.categoriaActiva === c;
      catTabs += '<button class="pos-cat-btn ' + (activo?'active':'') + '" onclick="POSModule.setCategoria(\'' + c + '\')">' +
        self._emoji(c) + ' ' + (c==='todos'?'TODOS':c.toUpperCase()) +
        ' <span style="font-size:10px;opacity:0.65;">(' + cnt + ')</span></button>';
    });
    catTabs += '</div>';

    // -- Grid productos --
    var prods = this.getProductosFiltrados();
    var grid = '<div class="pos-grid">';
    if (!prods.length) {
      grid += '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-400);">' +
        '<i class="fas fa-search" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.4;"></i>' +
        '<p style="font-size:14px;">Sin resultados</p></div>';
    } else {
      prods.forEach(function(p) {
        var agotado   = p.stock === 0;
        var stockBaj  = !agotado && p.stock <= 10;
        var stockPct  = agotado ? 0 : Math.min(100, (p.stock / 50) * 100);
        var stockClr  = agotado ? '#dc2626' : stockBaj ? '#d97706' : '#16a34a';
        var stockTxt  = agotado ? '✗ AGOTADO' : (stockBaj ? '⚠ Stock: '+p.stock : '✓ '+p.stock+' disp.');
        var onclick   = agotado ? "App.toast('Producto agotado','error')" : 'POSModule.agregar(' + p.id + ')';
        grid +=
          '<div class="pos-product-card ' + (agotado?'out-of-stock':'') + '" onclick="' + onclick + '" title="' + p.codigo + '">' +
            '<div style="font-size:30px;margin-bottom:6px;">' + self._emoji(p.categoria) + '</div>' +
            '<div class="pos-prod-name">' + p.nombre + '</div>' +
            '<div class="pos-prod-price">S/ ' + p.precio_venta.toFixed(2) + '</div>' +
            '<div style="height:3px;background:var(--gray-200);border-radius:2px;margin:5px 0;">' +
              '<div style="height:100%;width:' + stockPct + '%;background:' + stockClr + ';border-radius:2px;"></div>' +
            '</div>' +
            '<div class="pos-prod-stock" style="color:' + stockClr + ';font-size:10px;font-weight:700;">' + stockTxt + '</div>' +
          '</div>';
      });
    }
    grid += '</div>';

    // -- PANEL DERECHO --
    // Selector tipo comprobante
    var tiposBtns = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">';
    var tipos = [
      {key:'NV',  label:'Nota Venta', color:'#ea580c', icon:'fa-file-alt'},
      {key:'BOL', label:'Boleta',     color:'#2563eb', icon:'fa-file-invoice'},
      {key:'FAC', label:'Factura',    color:'#7c3aed', icon:'fa-file-invoice-dollar'}
    ];
    tipos.forEach(function(t) {
      var activo = self.tipoComp === t.key;
      tiposBtns +=
        '<button onclick="POSModule.tipoComp=\'' + t.key + '\';App.renderPage();" style="padding:8px 4px;border-radius:8px;' +
          'border:2px solid ' + (activo?t.color:'var(--gray-200)') + ';' +
          'background:' + (activo?t.color+'18':'white') + ';' +
          'color:' + (activo?t.color:'var(--gray-500)') + ';' +
          'font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;">' +
          '<i class="fas ' + t.icon + '" style="font-size:16px;"></i>' + t.label + '</button>';
    });
    tiposBtns += '</div>';

    // Cliente
    var tipoLabels = {NV:'NOTA DE VENTA', BOL:'BOLETA ELECTRÓNICA', FAC:'FACTURA ELECTRÓNICA'};
    var clienteBox =
      '<div style="background:white;border-radius:var(--radius);padding:8px 12px;border:1px solid var(--gray-200);' +
        'display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
        '<div style="width:32px;height:32px;border-radius:50%;background:#eff6ff;color:var(--accent);' +
          'display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">' +
          '<i class="fas fa-user"></i></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Cliente</div>' +
          '<div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
            (this.clienteSeleccionado ? this.clienteSeleccionado.nombre : 'PÚBLICO EN GENERAL') + '</div>' +
        '</div>' +
        '<button class="btn btn-outline btn-sm" onclick="POSModule.cambiarCliente()" style="padding:4px 8px;font-size:11px;">' +
          '<i class="fas fa-exchange-alt"></i></button>' +
      '</div>';

    // Ticket header
    var ticketHeader =
      '<div class="pos-ticket-header">' +
        '<h3><i class="fas fa-receipt"></i> ' + tipoLabels[this.tipoComp] + '</h3>' +
        '<span style="font-size:11px;opacity:0.8;">' + this.items.length + ' ítem(s)</span>' +
      '</div>';

    // Ticket items
    var ticketItems = '';
    if (this.items.length === 0) {
      ticketItems =
        '<div style="text-align:center;padding:24px 16px;color:var(--gray-400);">' +
          '<i class="fas fa-shopping-basket" style="font-size:38px;display:block;margin-bottom:10px;opacity:0.4;"></i>' +
          '<p style="font-size:13px;">Toca un producto para agregarlo</p>' +
          '<p style="font-size:11px;margin-top:4px;opacity:0.7;">o escanea su código de barras</p>' +
        '</div>';
    } else {
      this.items.forEach(function(item, i) {
        var descPct      = item.descuento   || 0;
        var precioFinal  = item.precioCustom || item.precio;
        var tieneCustom  = !!item.precioCustom;
        ticketItems +=
          '<div class="pos-ticket-item" style="flex-direction:column;align-items:stretch;padding:8px 10px;">' +
            // Fila principal
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<div style="flex:1;min-width:0;">' +
                '<div class="pos-ticket-item-name">' + item.nombre + '</div>' +
                '<div style="font-size:10px;color:var(--gray-400);">S/ ' + precioFinal.toFixed(2) + ' c/u' +
                  (descPct > 0 ? ' · <span style="color:#16a34a;font-weight:700;">-' + descPct + '%</span>' : '') +
                '</div>' +
              '</div>' +
              '<button class="pos-qty-btn pos-qty-minus" onclick="POSModule.cambiarQty(' + i + ',-1)">−</button>' +
              '<span class="pos-qty-val" onclick="POSModule.editarQty(' + i + ')" ' +
                'style="cursor:pointer;text-decoration:underline dotted;min-width:28px;text-align:center;" title="Clic para editar">' +
                item.qty + '</span>' +
              '<button class="pos-qty-btn pos-qty-plus" onclick="POSModule.cambiarQty(' + i + ',1)">+</button>' +
              '<span class="pos-item-total" style="min-width:68px;text-align:right;">S/ ' + item.total.toFixed(2) + '</span>' +
              '<button class="pos-remove" onclick="POSModule.quitar(' + i + ')"><i class="fas fa-times"></i></button>' +
            '</div>' +
            // Fila de acciones del ítem
            '<div style="display:flex;gap:5px;margin-top:5px;padding-top:5px;border-top:1px solid var(--gray-100);">' +
              '<button onclick="POSModule.descuentoItem(' + i + ')" ' +
                'style="flex:1;font-size:10px;padding:3px 0;border-radius:4px;border:1px solid var(--gray-200);' +
                'background:' + (descPct>0?'#eff6ff':'white') + ';color:' + (descPct>0?'var(--accent)':'var(--gray-500)') + ';cursor:pointer;">' +
                '<i class="fas fa-percent"></i> ' + (descPct>0?descPct+'% Dcto':'Descuento') + '</button>' +
              '<button onclick="POSModule.editarPrecio(' + i + ')" ' +
                'style="flex:1;font-size:10px;padding:3px 0;border-radius:4px;border:1px solid var(--gray-200);' +
                'background:' + (tieneCustom?'#f0fdf4':'white') + ';color:' + (tieneCustom?'#16a34a':'var(--gray-500)') + ';cursor:pointer;">' +
                '<i class="fas fa-tag"></i> ' + (tieneCustom?'S/'+item.precioCustom.toFixed(2):'Precio especial') + '</button>' +
            '</div>' +
          '</div>';
      });
    }

    // Totales
    var dctoTotal = this.getDescuentoTotal();
    var totalesBox =
      '<div class="pos-totals">' +
        (dctoTotal > 0 ?
          '<div class="pos-total-row" style="color:var(--success);"><span><i class="fas fa-tag"></i> Descuento:</span>' +
          '<span>− S/ ' + dctoTotal.toFixed(2) + '</span></div>' : '') +
        '<div class="pos-total-row"><span>Subtotal:</span><span>S/ ' + total.toFixed(2) + '</span></div>' +
'<div class="pos-total-row"><span>IGV (Exonerado):</span><span>S/ 0.00</span></div>' +
        '<div class="pos-total-row main"><span>TOTAL:</span><span style="color:var(--accent);">S/ ' + total.toFixed(2) + '</span></div>' +
      '</div>';

    // Nota de venta
    var notaBox = this.notaVenta ?
      '<div style="background:#fffbeb;padding:6px 10px;border-radius:6px;font-size:11px;color:#92400e;' +
        'display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
        '<i class="fas fa-sticky-note"></i><span style="flex:1;">' + this.notaVenta + '</span>' +
        '<button onclick="POSModule.notaVenta=\'\';App.renderPage();" style="background:none;border:none;color:#92400e;cursor:pointer;">' +
          '<i class="fas fa-times"></i></button>' +
      '</div>' : '';

    // Botones acción
    var accionesBtns =
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:8px;">' +
        '<button onclick="POSModule.limpiar()" style="' + this._btnEstiloAccion('#dc2626') + '">' +
          '<i class="fas fa-trash" style="font-size:15px;color:#dc2626;"></i>Limpiar</button>' +
        '<button onclick="POSModule.descuentoGlobal()" style="' + this._btnEstiloAccion('#7c3aed') + '">' +
          '<i class="fas fa-percent" style="font-size:15px;color:#7c3aed;"></i>Descuento</button>' +
        '<button onclick="POSModule.agregarNota()" style="' + this._btnEstiloAccion('#d97706') + '">' +
          '<i class="fas fa-sticky-note" style="font-size:15px;color:#d97706;"></i>Nota</button>' +
        '<button onclick="POSModule.holdSale()" ' + (this.items.length===0?'disabled':'') + ' style="' + this._btnEstiloAccion('#0ea5e9') + '">' +
          '<i class="fas fa-pause-circle" style="font-size:15px;color:#0ea5e9;"></i>En Espera</button>' +
      '</div>';

    // Botón cobrar
    var cobrarBtn =
      '<button class="pos-cobrar-btn" id="posCobrarBtn" onclick="POSModule.cobrar()" ' +
        (this.items.length===0?'disabled':'') + '>' +
        '<i class="fas fa-credit-card" style="font-size:18px;"></i>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:0;">' +
          '<span style="font-size:11px;opacity:0.9;">COBRAR VENTA</span>' +
          '<span style="font-size:20px;font-weight:900;">S/ ' + total.toFixed(2) + '</span>' +
        '</div>' +
        '<i class="fas fa-arrow-right" style="font-size:16px;margin-left:auto;"></i>' +
      '</button>';

    // -- ARMAR HTML FINAL --
    return '<div class="pos-layout">' +
      // LEFT
      '<div class="pos-products">' +
        leftHeader + searchBar + catTabs + grid +
      '</div>' +
      // RIGHT
      '<div class="pos-panel">' +
        tiposBtns + clienteBox +
        '<div class="pos-ticket">' +
          ticketHeader +
          '<div class="pos-ticket-items">' + ticketItems + '</div>' +
          totalesBox +
        '</div>' +
        notaBox + accionesBtns + cobrarBtn +
      '</div>' +
    '</div>';
  },

  _btnEstiloAccion: function(color) {
    return 'padding:7px 4px;border-radius:8px;border:1.5px solid var(--gray-200);background:white;' +
      'font-size:10px;font-weight:700;color:var(--gray-600);cursor:pointer;' +
      'display:flex;flex-direction:column;align-items:center;gap:3px;width:100%;' +
      'transition:all 0.15s;';
  },

  // ──────────────────────────────────────────────────────
  // ACCIONES DE PRODUCTOS
  // ──────────────────────────────────────────────────────
  setCategoria: function(c) { this.categoriaActiva = c; this.searchTerm = ''; App.renderPage(); },
  buscar: function(v)        { this.searchTerm = v; App.renderPage(); },

  agregar: function(id, qty) {
    var p = DB.productos.find(function(x){ return x.id === id; });
    if (!p || p.stock === 0) { App.toast('Sin stock disponible', 'error'); return; }
    qty = qty || 1;
    var idx = this.items.findIndex(function(x){ return x.prod_id === id; });
    if (idx >= 0) {
      if (this.items[idx].qty + qty > p.stock) { App.toast('Stock insuficiente (máx: '+p.stock+')', 'warning'); return; }
      this.items[idx].qty += qty;
      this._recalcItem(idx);
    } else {
      this.items.push({ prod_id:id, nombre:p.nombre, precio:p.precio_venta,
        precioCustom:null, descuento:0, qty:qty, total:p.precio_venta * qty });
    }
    App.renderPage();
    App.toast(p.nombre + ' ×' + qty + ' ✓', 'success');
  },

  cambiarQty: function(idx, delta) {
    var p = DB.productos.find(function(x){ return x.id === POSModule.items[idx].prod_id; });
    var newQty = this.items[idx].qty + delta;
    if (newQty <= 0) { this.quitar(idx); return; }
    if (p && newQty > p.stock) { App.toast('Stock insuficiente (máx: '+p.stock+')', 'warning'); return; }
    this.items[idx].qty = newQty;
    this._recalcItem(idx);
    App.renderPage();
  },

  editarQty: function(idx) {
    var p = DB.productos.find(function(x){ return x.id === POSModule.items[idx].prod_id; });
    var input = prompt('Cantidad para "' + this.items[idx].nombre + '":' +
      (p ? ' (stock: ' + p.stock + ')' : ''), this.items[idx].qty);
    if (input === null) return;
    var qty = parseInt(input);
    if (isNaN(qty) || qty < 1) { App.toast('Cantidad inválida', 'error'); return; }
    if (p && qty > p.stock) { App.toast('Stock insuficiente (máx: '+p.stock+')', 'warning'); return; }
    this.items[idx].qty = qty;
    this._recalcItem(idx);
    App.renderPage();
  },

  editarPrecio: function(idx) {
    var item   = this.items[idx];
    var actual = (item.precioCustom || item.precio).toFixed(2);
    var input  = prompt('Precio especial para "' + item.nombre + '" (S/):\n(Precio original: S/' + item.precio.toFixed(2) + ')', actual);
    if (input === null) return;
    var precio = parseFloat(input);
    if (isNaN(precio) || precio <= 0) { App.toast('Precio inválido', 'error'); return; }
    if (precio === item.precio) { this.items[idx].precioCustom = null; }
    else { this.items[idx].precioCustom = precio; }
    this._recalcItem(idx);
    App.renderPage();
  },

  descuentoItem: function(idx) {
    var item  = this.items[idx];
    var input = prompt('Descuento para "' + item.nombre + '" (%):', item.descuento || 0);
    if (input === null) return;
    var pct = parseFloat(input);
    if (isNaN(pct) || pct < 0 || pct > 100) { App.toast('Ingrese un valor entre 0 y 100', 'error'); return; }
    this.items[idx].descuento = pct;
    this._recalcItem(idx);
    App.renderPage();
  },

  quitar: function(idx) {
    this.items.splice(idx, 1);
    App.renderPage();
  },

  limpiar: function() {
    if (this.items.length === 0) return;
    if (confirm('¿Limpiar todo el ticket?')) {
      this.items = [];
      this.notaVenta = '';
      App.renderPage();
    }
  },

  // ──────────────────────────────────────────────────────
  // DESCUENTO GLOBAL
  // ──────────────────────────────────────────────────────
  descuentoGlobal: function() {
    if (!this.items.length) { App.toast('Agrega productos primero', 'warning'); return; }
    var pcts = [5,10,15,20,25,50];
    var btnsHtml = pcts.map(function(p) {
      return '<button class="btn btn-outline btn-sm" onclick="document.getElementById(\'dcto_global\').value=' + p + ';"> ' + p + '%</button>';
    }).join('');
    App.showModal('% Descuento Global al Ticket',
      '<div class="form-group mb-3">' +
        '<label class="form-label">Porcentaje a aplicar a TODOS los productos</label>' +
        '<input class="form-control" id="dcto_global" type="number" min="0" max="100" value="0" style="font-size:24px;text-align:center;"/>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + btnsHtml + '</div>',
      [{ text:'Aplicar Descuento', cls:'btn-success', cb: function() {
        var pct = parseFloat(document.getElementById('dcto_global').value) || 0;
        if (pct < 0 || pct > 100) { App.toast('Valor entre 0 y 100', 'error'); return; }
        POSModule.items.forEach(function(item, i) {
          POSModule.items[i].descuento = pct;
          POSModule._recalcItem(i);
        });
        App.toast('Descuento de ' + pct + '% aplicado a ' + POSModule.items.length + ' productos', 'success');
        App.closeModal();
        App.renderPage();
      }}]
    );
  },

  // ──────────────────────────────────────────────────────
  // NOTA DE VENTA
  // ──────────────────────────────────────────────────────
  agregarNota: function() {
    var input = prompt('Nota para el ticket:', this.notaVenta);
    if (input === null) return;
    this.notaVenta = input.trim();
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // HOLD / EN ESPERA
  // ──────────────────────────────────────────────────────
  holdSale: function() {
    if (!this.items.length) return;
    var nombre = prompt('Nombre o referencia de esta venta en espera:', 'Mesa/Cliente ' + (this.ventasEnEspera.length+1));
    if (nombre === null) return;
    this.ventasEnEspera.push({
      nombre: nombre || ('Espera #' + (this.ventasEnEspera.length+1)),
      items: JSON.parse(JSON.stringify(this.items)),
      cliente: this.clienteSeleccionado,
      tipoComp: this.tipoComp,
      nota: this.notaVenta,
      hora: new Date().toLocaleTimeString('es-PE')
    });
    this.items = [];
    this.notaVenta = '';
    App.toast('Venta guardada en espera: ' + nombre, 'info');
    App.renderPage();
  },

  verEnEspera: function() {
    if (!this.ventasEnEspera.length) return;
    var rows = this.ventasEnEspera.map(function(v, i) {
      var total = v.items.reduce(function(s,item){ return s+item.total; }, 0);
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gray-100);">' +
        '<div>' +
          '<div style="font-weight:700;">' + v.nombre + '</div>' +
          '<div style="font-size:12px;color:var(--gray-500);">' + v.items.length + ' productos · ' + v.hora + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<strong style="color:var(--accent);">S/ ' + total.toFixed(2) + '</strong>' +
          '<button class="btn btn-success btn-sm" onclick="POSModule.recuperarEspera(' + i + ')"><i class="fas fa-play"></i> Retomar</button>' +
          '<button class="btn btn-danger btn-sm" onclick="POSModule.eliminarEspera(' + i + ')"><i class="fas fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }).join('');
    App.showModal('Ventas en Espera', rows, []);
  },

  recuperarEspera: function(idx) {
    var venta = this.ventasEnEspera[idx];
    if (this.items.length > 0) {
      if (!confirm('¿Reemplazar el ticket actual con esta venta en espera?')) return;
    }
    this.items    = JSON.parse(JSON.stringify(venta.items));
    this.clienteSeleccionado = venta.cliente;
    this.tipoComp = venta.tipoComp;
    this.notaVenta = venta.nota;
    this.ventasEnEspera.splice(idx, 1);
    App.closeModal();
    App.renderPage();
    App.toast('Venta retomada', 'success');
  },

  eliminarEspera: function(idx) {
    if (confirm('¿Eliminar esta venta en espera?')) {
      this.ventasEnEspera.splice(idx, 1);
      App.closeModal();
      App.renderPage();
    }
  },

  // ──────────────────────────────────────────────────────
  // CAMBIAR CLIENTE
  // ──────────────────────────────────────────────────────
  cambiarCliente: function() {
    var listaClientes = DB.clientes.filter(function(c){ return c.tipo_cliente === 'cliente'; });
    var rowsHtml = function(list) {
      return '<table class="data-table"><thead><tr><th>Documento</th><th>Nombre</th><th></th></tr></thead><tbody>' +
        list.map(function(c) {
          return '<tr>' +
            '<td class="text-sm">' + c.tipo + ': ' + c.doc + '</td>' +
            '<td>' + c.nombre + '</td>' +
            '<td><button class="btn btn-primary btn-sm" onclick="POSModule.setCliente(' + c.id + ')">Seleccionar</button></td>' +
          '</tr>';
        }).join('') +
      '</tbody></table>';
    };
    App.showModal('Seleccionar Cliente',
      '<div class="search-bar mb-3" style="width:100%;">' +
        '<i class="fas fa-search"></i>' +
        '<input type="text" placeholder="Buscar por nombre o documento..." autofocus ' +
          'oninput="var r=DB.clientes.filter(function(c){return c.tipo_cliente===\'cliente\'&&(' +
            'c.nombre.toLowerCase().indexOf(this.value.toLowerCase())>=0||c.doc.indexOf(this.value)>=0);},this);" ' +
          'onkeyup="var t=this.value.toLowerCase();var r=DB.clientes.filter(function(c){return c.tipo_cliente===\'cliente\'&&(' +
            'c.nombre.toLowerCase().indexOf(t)>=0||c.doc.indexOf(t)>=0);});' +
            'document.getElementById(\'posCliRes\').innerHTML=POSModule._rowsCliente(r);"/>' +
      '</div>' +
      '<div id="posCliRes" style="max-height:320px;overflow-y:auto;">' + rowsHtml(listaClientes) + '</div>',
      []
    );
  },

  _rowsCliente: function(list) {
    if (!list.length) return '<div class="empty-state"><i class="fas fa-search"></i><p>Sin resultados</p></div>';
    return '<table class="data-table"><thead><tr><th>Documento</th><th>Nombre</th><th></th></tr></thead><tbody>' +
      list.map(function(c) {
        return '<tr><td class="text-sm">' + c.tipo + ': ' + c.doc + '</td><td>' + c.nombre + '</td>' +
          '<td><button class="btn btn-primary btn-sm" onclick="POSModule.setCliente(' + c.id + ')">Seleccionar</button></td></tr>';
      }).join('') +
    '</tbody></table>';
  },

  setCliente: function(id) {
    this.clienteSeleccionado = DB.clientes.find(function(x){ return x.id === id; });
    App.closeModal();
    App.renderPage();
    App.toast('Cliente: ' + this.clienteSeleccionado.nombre, 'info');
  },

  // ──────────────────────────────────────────────────────
  // COBRAR — MODAL PROFESIONAL CON PAGO DIVIDIDO
  // ──────────────────────────────────────────────────────
  cobrar: function() {
    if (!this.items.length) return;
    var total = this.getTotal();
    this._pagosDivActivo = false;
    this._pagosDiv = [{ metodo:'EFECTIVO', monto: total }];
    this._metodoCobro = 'EFECTIVO';

    var metodos = [
      {val:'EFECTIVO',  icon:'fas fa-money-bill-wave', color:'#16a34a', label:'Efectivo'},
      {val:'TARJETA',   icon:'fas fa-credit-card',     color:'#2563eb', label:'Tarjeta'},
      {val:'YAPE',      icon:'fas fa-mobile-alt',       color:'#7c3aed', label:'Yape/Plin'},
      {val:'TRANSFER',  icon:'fas fa-university',       color:'#0ea5e9', label:'Transfer.'}
    ];

    var metodosBtns = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">';
    metodos.forEach(function(m) {
      metodosBtns +=
        '<button id="mpb_' + m.val + '" onclick="POSModule._selMetodo(\'' + m.val + '\')" ' +
          'style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;' +
          'border-radius:10px;border:2px solid var(--gray-200);background:white;cursor:pointer;transition:all 0.15s;">' +
          '<i class="' + m.icon + '" style="font-size:22px;color:' + m.color + ';"></i>' +
          '<span style="font-size:11px;font-weight:700;color:var(--gray-600);">' + m.label + '</span>' +
        '</button>';
    });
    metodosBtns += '</div>';

    // Billetes rápidos
    var billetes = [total, 10, 20, 50, 100, 200].filter(function(v,i,a){ return a.indexOf(v)===i; }).sort(function(a,b){return a-b;});
    var billetesHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
      billetes.map(function(v) {
        return '<button class="btn btn-outline btn-sm" style="flex:1;min-width:44px;font-weight:700;" ' +
          'onclick="document.getElementById(\'montoPOS\').value=\'' + v.toFixed(2) + '\';POSModule._calcVuelto();">' +
          'S/' + (v===total?'Exacto':v) + '</button>';
      }).join('') +
    '</div>';

    var modalHtml =
      // Total grande
      '<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;padding:18px;text-align:center;margin-bottom:16px;color:white;">' +
        '<div style="font-size:13px;opacity:0.8;font-weight:700;letter-spacing:1px;">TOTAL A COBRAR</div>' +
        '<div style="font-size:36px;font-weight:900;margin:4px 0;">S/ ' + total.toFixed(2) + '</div>' +
        '<div style="font-size:12px;opacity:0.7;">' + this.items.length + ' producto(s) · ' + this.tipoComp + '</div>' +
      '</div>' +

      // Métodos
      '<div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Método de Pago</div>' +
      metodosBtns +

      // Toggle pago dividido
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--gray-700);">' +
          '<input type="checkbox" id="togglePagoDiv" onchange="POSModule._togglePagoDiv(this.checked,' + total + ')" ' +
            'style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"/>' +
          'Pago dividido (varios métodos)' +
        '</label>' +
      '</div>' +

      // Sección efectivo (numpad)
      '<div id="seccionEfectivo">' +
        '<div style="font-size:12px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">Monto Recibido</div>' +
        '<input id="montoPOS" type="number" step="0.01" value="' + total.toFixed(2) + '" ' +
          'oninput="POSModule._calcVuelto()" ' +
          'style="width:100%;padding:12px;font-size:24px;font-weight:800;text-align:center;border:2px solid var(--gray-200);border-radius:10px;margin-bottom:10px;outline:none;"/>' +
        billetesHtml +
        '<div class="numpad" style="margin-bottom:10px;">' +
          [7,8,9,4,5,6,1,2,3].map(function(n) {
            return '<button class="numpad-btn" onclick="POSModule._numpad(\'' + n + '\')">' + n + '</button>';
          }).join('') +
          '<button class="numpad-btn" onclick="POSModule._numpad(\'00\')">00</button>' +
          '<button class="numpad-btn" onclick="POSModule._numpad(\'0\')">0</button>' +
          '<button class="numpad-btn clear" onclick="POSModule._numpad(\'C\')"><i class="fas fa-backspace"></i></button>' +
        '</div>' +
        '<div id="vueltoBox" class="cobro-vuelto">Vuelto: S/ 0.00</div>' +
      '</div>' +

      // Sección pago dividido (oculta por defecto)
      '<div id="seccionPagoDiv" style="display:none;">' +
        '<div id="pagosDivContainer"></div>' +
        '<button onclick="POSModule._agregarPagoDiv()" ' +
          'style="width:100%;padding:8px;border:1.5px dashed var(--gray-300);border-radius:8px;background:none;' +
            'color:var(--gray-500);cursor:pointer;font-size:13px;font-weight:600;margin:8px 0;">' +
          '<i class="fas fa-plus"></i> Agregar método de pago</button>' +
        '<div id="resumenPagoDiv" style="margin-top:8px;"></div>' +
      '</div>';

    App.showModal('💳 Cobrar Venta', modalHtml, [
      { text:'✅ Confirmar Cobro', cls:'btn-success', cb: function(){ POSModule._confirmarCobro(total); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '480px';

    setTimeout(function() {
      POSModule._selMetodo('EFECTIVO');
      POSModule._calcVuelto();
    }, 60);
  },

  _selMetodo: function(val) {
    ['EFECTIVO','TARJETA','YAPE','TRANSFER'].forEach(function(m) {
      var btn = document.getElementById('mpb_' + m);
      if (!btn) return;
      if (m === val) {
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
        btn.querySelectorAll('span,i').forEach(function(el){ el.style.color='white'; });
      } else {
        btn.style.background = 'white';
        btn.style.borderColor = 'var(--gray-200)';
        btn.querySelectorAll('span').forEach(function(el){ el.style.color='var(--gray-600)'; });
        // Restore icon color
        var iconColors = {EFECTIVO:'#16a34a',TARJETA:'#2563eb',YAPE:'#7c3aed',TRANSFER:'#0ea5e9'};
        var icon = btn.querySelector('i');
        if (icon) icon.style.color = iconColors[m];
      }
    });
    this._metodoCobro = val;
    var secEf = document.getElementById('seccionEfectivo');
    if (secEf) secEf.style.display = val === 'EFECTIVO' ? 'block' : 'none';
    if (val !== 'EFECTIVO') {
      var vb = document.getElementById('vueltoBox');
      if (vb) { vb.textContent = 'Pago exacto con ' + val; vb.className = 'cobro-vuelto'; }
    } else {
      this._calcVuelto();
    }
  },

  _togglePagoDiv: function(activo, total) {
    this._pagosDivActivo = activo;
    var secEf  = document.getElementById('seccionEfectivo');
    var secDiv = document.getElementById('seccionPagoDiv');
    if (!secEf || !secDiv) return;
    secEf.style.display  = activo ? 'none' : 'block';
    secDiv.style.display = activo ? 'block' : 'none';
    if (activo) {
      this._pagosDiv = [
        { metodo: 'EFECTIVO', monto: parseFloat((total/2).toFixed(2)) },
        { metodo: 'YAPE',     monto: parseFloat((total/2).toFixed(2)) }
      ];
      this._renderPagosDivUI(total);
    }
  },

  _agregarPagoDiv: function() {
    this._pagosDiv.push({ metodo:'EFECTIVO', monto:0 });
    var total = POSModule.getTotal();
    this._renderPagosDivUI(total);
  },

  _renderPagosDivUI: function(total) {
    var container = document.getElementById('pagosDivContainer');
    if (!container) return;
    var metodosOpts = ['EFECTIVO','TARJETA','YAPE','TRANSFER','TRANSFERENCIA'].map(function(m) {
      return '<option value="' + m + '">' + m + '</option>';
    }).join('');
    container.innerHTML = this._pagosDiv.map(function(p, i) {
      return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">' +
        '<select style="flex:1;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;" ' +
          'onchange="POSModule._pagosDiv[' + i + '].metodo=this.value">' +
          ['EFECTIVO','TARJETA','YAPE','TRANSFER'].map(function(m) {
            return '<option value="' + m + '" ' + (p.metodo===m?'selected':'') + '>' + m + '</option>';
          }).join('') +
        '</select>' +
        '<input type="number" step="0.01" value="' + p.monto.toFixed(2) + '" ' +
          'style="width:100px;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:14px;font-weight:700;text-align:center;" ' +
          'oninput="POSModule._pagosDiv[' + i + '].monto=parseFloat(this.value)||0;POSModule._updateResumenDiv(' + total + ')"/>' +
        (i > 0 ? '<button onclick="POSModule._pagosDiv.splice(' + i + ',1);POSModule._renderPagosDivUI(' + total + ');" ' +
          'style="padding:8px;border:none;background:#fef2f2;color:#dc2626;border-radius:6px;cursor:pointer;">' +
          '<i class="fas fa-times"></i></button>' : '<div style="width:32px;"></div>') +
      '</div>';
    }).join('');
    this._updateResumenDiv(total);
  },

  _updateResumenDiv: function(total) {
    var pagado   = this._pagosDiv.reduce(function(s,p){ return s + (p.monto||0); }, 0);
    var falta    = total - pagado;
    var vuelto   = pagado - total;
    var resumen  = document.getElementById('resumenPagoDiv');
    if (!resumen) return;
    resumen.innerHTML =
      '<div style="background:var(--gray-50);padding:12px;border-radius:8px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
          '<span>Total a cobrar:</span><strong>S/ ' + total.toFixed(2) + '</strong></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
          '<span>Total ingresado:</span><strong style="color:var(--accent);">S/ ' + pagado.toFixed(2) + '</strong></div>' +
        (falta > 0.005 ?
          '<div style="background:#fef2f2;padding:8px;border-radius:6px;text-align:center;font-weight:800;color:#dc2626;">Falta: S/ ' + falta.toFixed(2) + '</div>' :
          '<div style="background:#f0fdf4;padding:8px;border-radius:6px;text-align:center;font-weight:800;color:#16a34a;">Vuelto: S/ ' + Math.max(0,vuelto).toFixed(2) + '</div>') +
      '</div>';
  },

  _numpad: function(key) {
    var inp = document.getElementById('montoPOS');
    if (!inp) return;
    if (key === 'C')     { inp.value = inp.value.slice(0,-1) || '0'; }
    else if (inp.value === '0') { inp.value = key; }
    else { inp.value += key; }
    this._calcVuelto();
  },

  _calcVuelto: function() {
    var total  = this.getTotal();
    var monto  = parseFloat(document.getElementById('montoPOS')?.value) || 0;
    var vuelto = monto - total;
    var vb = document.getElementById('vueltoBox');
    if (!vb) return;
    if (vuelto < 0) {
      vb.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Falta: S/ ' + Math.abs(vuelto).toFixed(2);
      vb.className = 'cobro-vuelto negativo';
    } else {
      vb.innerHTML = '<i class="fas fa-check-circle"></i> Vuelto: S/ ' + vuelto.toFixed(2);
      vb.className = 'cobro-vuelto';
    }
  },

  // ──────────────────────────────────────────────────────
  // CONFIRMAR COBRO
  // ──────────────────────────────────────────────────────
  _confirmarCobro: function(total) {
    var metodo, montoPagado, vuelto;

    if (this._pagosDivActivo) {
      var pagado = this._pagosDiv.reduce(function(s,p){ return s+(p.monto||0); }, 0);
      if (pagado < total - 0.005) { App.toast('Monto insuficiente. Faltan S/ ' + (total-pagado).toFixed(2), 'error'); return; }
      metodo     = this._pagosDiv.map(function(p){ return p.metodo+'('+p.monto.toFixed(2)+')'; }).join(' + ');
      montoPagado = pagado;
      vuelto      = Math.max(0, pagado - total);
    } else {
      metodo = this._metodoCobro || 'EFECTIVO';
      montoPagado = (metodo === 'EFECTIVO') ? (parseFloat(document.getElementById('montoPOS')?.value) || total) : total;
      if (metodo === 'EFECTIVO' && montoPagado < total - 0.005) {
        App.toast('Monto insuficiente', 'error'); return;
      }
      vuelto = Math.max(0, montoPagado - total);
    }

    // Serie según tipo de comprobante
    var serieMap = { NV:'NV03', BOL:'BV03', FAC:'FC01' };
    var tipoMap  = { NV:'N. VENTA', BOL:'BOL', FAC:'FAC' };
    var tipoNomMap = { NV:'NOTA DE VENTA', BOL:'BOLETA DE VENTA ELECTRONICA', FAC:'FACTURA ELECTRONICA' };
    var serie    = serieMap[this.tipoComp] || 'NV03';
    var numero   = DB.nextNumber(serie);
    var fecha    = this._fechaLocal();
    var hora     = this._horaLocal();

    var venta = {
      id:           DB.ventas.length + 1,
      fecha:        fecha,
      hora:         hora,
      serie:        serie,
      numero:       numero,
      tipo:         tipoMap[this.tipoComp],
      cliente_id:   this.clienteSeleccionado ? this.clienteSeleccionado.id : 1,
      items:        this.items.map(function(i){
        return { prod_id:i.prod_id, nombre:i.nombre, qty:i.qty,
                 precio:i.precioCustom||i.precio, total:i.total };
      }),
      subtotal:     total,
      igv:          0,
      total:        total,
      tc:           DB.empresa.tipoCambio,
      moneda:       'SOLES',
      estado:       this.tipoComp === 'NV' ? 'NO_ENVIADO' : 'NO_ENVIADO',
      tipo_comprobante: tipoNomMap[this.tipoComp],
      metodo_pago:  metodo,
      monto_pago:   montoPagado,
      vuelto:       vuelto,
      nota:         this.notaVenta
    };

    // Descontar stock y registrar kardex
    var itemsCopy = JSON.parse(JSON.stringify(this.items));
    itemsCopy.forEach(function(item) {
      var pi = DB.productos.findIndex(function(p){ return p.id === item.prod_id; });
      if (pi >= 0) DB.productos[pi].stock = Math.max(0, DB.productos[pi].stock - item.qty);
    });
    DB.ventas.unshift(venta);
    if (typeof KardexModule !== 'undefined') {
      KardexModule.registrar(itemsCopy, 'SALIDA', 'Venta POS ' + serie + '-' + numero);
    }

    App.closeModal();
    App.toast('✅ ' + serie + '-' + numero + ' procesado — Vuelto: S/ ' + vuelto.toFixed(2), 'success');
    this._mostrarDetalleVenta(venta);

    // Reset
    this.items = [];
    this.notaVenta = '';
    App.renderPage();
  },

  // ============================================================
// PATCH PARA pos.js — Mostrar detalle antes de imprimir
// INSTRUCCIONES:
//   1. Abre pos.js en VS Code
//   2. Aplica los 2 cambios indicados abajo
// ============================================================

// ════════════════════════════════════════════════════════════
// CAMBIO 1: En la función _confirmarCobro
// Busca esta línea (cerca del final de _confirmarCobro):
//
//     this._imprimirTicket(venta);
//
// Reemplázala por:
//
//     this._mostrarDetalleVenta(venta);
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// CAMBIO 2: Agrega esta función NUEVA justo ANTES de
// la función _imprimirTicket (o al final del objeto POSModule,
// antes del último });  )
// ════════════════════════════════════════════════════════════

  _mostrarDetalleVenta: function(venta) {
    var self = this;
    var cli  = DB.clientes.find(function(c){ return c.id === venta.cliente_id; });
    var tipoLabel = {
      'N. VENTA' : 'NOTA DE VENTA',
      'BOL'      : 'BOLETA DE VENTA',
      'FAC'      : 'FACTURA ELECTRÓNICA'
    };

    // Tabla de productos
    var itemsHtml = venta.items.map(function(i) {
      return '<tr style="border-bottom:1px solid var(--gray-100);">' +
        '<td style="padding:8px 4px;font-size:13px;">' + i.nombre + '</td>' +
        '<td style="text-align:center;padding:8px 4px;font-size:13px;font-weight:700;">' + i.qty + '</td>' +
        '<td style="text-align:right;padding:8px 4px;font-size:13px;">S/ ' + i.precio.toFixed(2) + '</td>' +
        '<td style="text-align:right;padding:8px 4px;font-size:13px;font-weight:800;color:var(--accent);">S/ ' + i.total.toFixed(2) + '</td>' +
      '</tr>';
    }).join('');

    // Estado badge
    var estadoColor = { NO_ENVIADO:'#d97706', ENVIADO:'#16a34a', ACEPTADO:'#2563eb' };
    var estadoBg    = { NO_ENVIADO:'#fffbeb', ENVIADO:'#f0fdf4', ACEPTADO:'#eff6ff' };
    var estado      = venta.estado || 'NO_ENVIADO';

    var html =
      // Header comprobante
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">' +
        '<div>' +
          '<div style="font-size:17px;font-weight:900;color:var(--gray-900);">' +
            (tipoLabel[venta.tipo] || venta.tipo_comprobante || venta.tipo) +
          '</div>' +
          '<div style="font-size:13px;color:var(--accent);font-weight:700;margin:2px 0;">' +
            venta.serie + ' — ' + venta.numero +
          '</div>' +
          '<div style="font-size:12px;color:var(--gray-400);">' + venta.fecha + ' ' + venta.hora + '</div>' +
        '</div>' +
        '<span style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;' +
          'background:' + (estadoBg[estado]||'#fffbeb') + ';' +
          'color:' + (estadoColor[estado]||'#d97706') + ';border:1.5px solid ' + (estadoColor[estado]||'#d97706') + ';">' +
          estado +
        '</span>' +
      '</div>' +

      // Cliente
      '<div style="background:var(--gray-50);border-radius:8px;padding:10px 14px;margin-bottom:14px;' +
        'font-size:13px;font-weight:700;color:var(--gray-700);">' +
        (cli ? cli.nombre : 'PÚBLICO EN GENERAL') +
      '</div>' +

      // Tabla productos
      '<div style="border:1px solid var(--gray-200);border-radius:10px;overflow:hidden;margin-bottom:14px;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead>' +
            '<tr style="background:var(--gray-50);">' +
              '<th style="text-align:left;padding:9px 4px;font-size:11px;text-transform:uppercase;color:var(--gray-500);">Producto</th>' +
              '<th style="text-align:center;padding:9px 4px;font-size:11px;text-transform:uppercase;color:var(--gray-500);">Cant</th>' +
              '<th style="text-align:right;padding:9px 4px;font-size:11px;text-transform:uppercase;color:var(--gray-500);">Precio</th>' +
              '<th style="text-align:right;padding:9px 4px;font-size:11px;text-transform:uppercase;color:var(--gray-500);">Total</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + itemsHtml + '</tbody>' +
        '</table>' +
      '</div>' +

      // Subtotales
      '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:var(--gray-600);">' +
          '<span>Subtotal:</span><span>S/ ' + venta.subtotal.toFixed(2) + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:var(--gray-600);">' +
          '<span>IGV (Exonerado):</span><span>S/ 0.00</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;' +
          'padding:14px 18px;background:var(--accent);border-radius:10px;color:white;">' +
          '<span style="font-size:18px;font-weight:900;">TOTAL:</span>' +
          '<span style="font-size:22px;font-weight:900;">S/ ' + venta.total.toFixed(2) + '</span>' +
        '</div>' +
      '</div>' +

      // Pago
      '<div style="font-size:12px;color:var(--gray-600);line-height:1.9;">' +
        '<div><b>Método de pago:</b> ' + venta.metodo_pago + '</div>' +
        '<div><b>Monto recibido:</b> S/ ' + (venta.monto_pago||venta.total).toFixed(2) + '</div>' +
        '<div style="color:#16a34a;font-weight:700;"><b>Vuelto:</b> S/ ' + (venta.vuelto||0).toFixed(2) + '</div>' +
      '</div>';

    App.showModal('Detalle: ' + venta.serie + '-' + venta.numero, html, [
      {
        text: '<i class="fas fa-print"></i> Imprimir',
        cls:  'btn-primary',
        cb:   function() {
          App.closeModal();
          POSModule._imprimirTicket(venta);
        }
      },
      {
        text: '<i class="fas fa-paper-plane"></i> Enviar SUNAT',
        cls:  'btn-outline',
        cb:   function() {
          App.toast('Función SUNAT no implementada aún', 'info');
        }
      }
    ]);

    // Ancho del modal un poco más amplio
    setTimeout(function() {
      var box = document.getElementById('modalBox');
      if (box) box.style.maxWidth = '520px';
    }, 30);
  },

  // ──────────────────────────────────────────────────────
  // IMPRIMIR TICKET PROFESIONAL
  // ──────────────────────────────────────────────────────
  _imprimirTicket: function(venta) {
    var cli = DB.clientes.find(function(c){ return c.id === venta.cliente_id; });
    var w   = window.open('', '_blank', 'width=380,height=650');
    if (!w) { App.toast('Activa las ventanas emergentes para imprimir', 'warning'); return; }

    var itemsHtml = venta.items.map(function(i) {
      return '<tr>' +
        '<td style="padding:3px 0;">' + i.nombre + '</td>' +
        '<td style="text-align:center;padding:3px 4px;">' + i.qty + '</td>' +
        '<td style="text-align:right;padding:3px 0;">S/' + i.precio.toFixed(2) + '</td>' +
        '<td style="text-align:right;padding:3px 0;font-weight:700;">S/' + i.total.toFixed(2) + '</td>' +
      '</tr>';
    }).join('');

    var metodoPagoFmt = venta.metodo_pago.replace(/\+/g,' + ');

    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + venta.serie + '-' + venta.numero + '</title>' +
      '<style>' +
        'body{font-family:"Courier New",monospace;font-size:12px;max-width:300px;margin:0 auto;padding:12px;color:#000;}' +
        '.center{text-align:center;} .bold{font-weight:bold;} .big{font-size:16px;} .xl{font-size:22px;}' +
        'hr{border:none;border-top:1px dashed #000;margin:8px 0;}' +
        'table{width:100%;border-collapse:collapse;} th{border-bottom:1px solid #000;padding:3px 0;font-size:11px;}' +
        'td{font-size:11px;} .r{text-align:right;} .right{text-align:right;}' +
        '.total-box{border:2px solid #000;padding:8px;text-align:center;margin:8px 0;border-radius:4px;}' +
      '</style></head><body>' +
      '<div class="center bold" style="font-size:15px;">' + DB.empresa.nombre + '</div>' +
      '<div class="center">RUC: ' + DB.empresa.ruc + '</div>' +
      '<div class="center" style="font-size:11px;">' + DB.empresa.direccion + '</div>' +
      '<hr/>' +
      '<div class="center bold big">' + venta.tipo_comprobante + '</div>' +
      '<div class="center bold">' + venta.serie + ' - ' + venta.numero + '</div>' +
      '<hr/>' +
      '<div>Fecha: <strong>' + venta.fecha + ' ' + venta.hora + '</strong></div>' +
      '<div>Cliente: <strong>' + (cli ? cli.nombre : 'PÚBLICO EN GENERAL') + '</strong></div>' +
      (cli && cli.tipo !== 'DNI' && cli.doc !== '00000000' ? '<div>' + cli.tipo + ': ' + cli.doc + '</div>' : '') +
      (venta.nota ? '<div>Nota: ' + venta.nota + '</div>' : '') +
      '<hr/>' +
      '<table><thead><tr><th style="text-align:left;">Producto</th><th>Cant</th><th class="r">P.Unit</th><th class="r">Total</th></tr></thead>' +
      '<tbody>' + itemsHtml + '</tbody></table>' +
      '<hr/>' +
      '<div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>S/ ' + venta.subtotal.toFixed(2) + '</span></div>' +
'<div style="display:flex;justify-content:space-between;"><span>IGV (Exonerado):</span><span>S/ 0.00</span></div>' +
      '<div class="total-box"><div class="bold">TOTAL A PAGAR</div><div class="xl bold">S/ ' + venta.total.toFixed(2) + '</div></div>' +
      '<hr/>' +
      '<div style="display:flex;justify-content:space-between;"><span>Método de pago:</span><span><b>' + metodoPagoFmt + '</b></span></div>' +
      '<div style="display:flex;justify-content:space-between;"><span>Monto recibido:</span><span>S/ ' + venta.monto_pago.toFixed(2) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-weight:bold;"><span>VUELTO:</span><span>S/ ' + venta.vuelto.toFixed(2) + '</span></div>' +
      '<hr/>' +
      '<div class="center bold" style="font-size:14px;">¡GRACIAS POR SU COMPRA!</div>' +
      '<div class="center" style="font-size:10px;margin-top:4px;">' + DB.empresa.nombre + '</div>' +
      '<div class="center" style="font-size:10px;">' + DB.empresa.direccion + '</div>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(function(){ w.print(); }, 250);
  },

  // ──────────────────────────────────────────────────────
  // LECTOR DE CÓDIGO DE BARRAS
  // ──────────────────────────────────────────────────────
  _onSearchKey: function(e) {
    // Enter = buscar coincidencia exacta por código
    if (e.key === 'Enter') {
      var term = (e.target.value || '').trim();
      if (!term) return;
      var p = DB.productos.find(function(x) {
        return x.codigo.toLowerCase() === term.toLowerCase();
      });
      if (p) {
        this.agregar(p.id);
        this.searchTerm = '';
        App.renderPage();
        setTimeout(function(){ var s=document.getElementById('posSearch'); if(s){s.value='';s.focus();} }, 50);
      } else {
        // Si no es código exacto, buscar en nombre
        var matches = this.getProductosFiltrados();
        if (matches.length === 1) {
          this.agregar(matches[0].id);
          this.searchTerm = '';
          App.renderPage();
          setTimeout(function(){ var s=document.getElementById('posSearch'); if(s){s.value='';s.focus();} }, 50);
        } else if (matches.length === 0) {
          App.toast('Producto no encontrado: ' + term, 'error');
        }
        // Si hay varios, los deja filtrados en la grilla
      }
    }
    // Escape = limpiar búsqueda
    if (e.key === 'Escape') {
      this.buscar('');
    }
  },

  // ──────────────────────────────────────────────────────
  // ATAJOS DE TECLADO GLOBALES
  // ──────────────────────────────────────────────────────
  _initKeyboard: function() {
    document.removeEventListener('keydown', POSModule._keyHandler);
    document.addEventListener('keydown', POSModule._keyHandler);
  },

  _keyHandler: function(e) {
    // Solo activos cuando POS está visible y no hay modal abierto
    if (document.getElementById('modalOverlay') &&
        !document.getElementById('modalOverlay').classList.contains('hidden')) return;
    if (App.currentPage !== 'pos') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'F1') {
      e.preventDefault();
      var s = document.getElementById('posSearch');
      if (s) { s.focus(); s.select(); }
    }
    if (e.key === 'F2') {
      e.preventDefault();
      POSModule.cobrar();
    }
    if (e.key === 'Escape') {
      POSModule.buscar('');
    }
    if (e.key === 'Delete') {
      if (POSModule.items.length > 0) POSModule.quitar(POSModule.items.length - 1);
    }
  }
};
