// ============================================================
// MÓDULO: INVENTARIO — Versión Profesional
// ============================================================

const InventarioModule = {

  // ── Estado interno ──
  _filtroCategoria: 'TODAS',
  _filtroBusqueda:  '',
  _filtroEstado:    'TODOS',
  _paginaActual:    1,
  _porPagina:       15,

  // ── Helpers ──
  _fechaHoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  _horaAhora() {
    return new Date().toTimeString().slice(0,8);
  },
  _getKardex() {
    if (!DB.kardex) DB.kardex = [];
    return DB.kardex;
  },
  _estadoStock(producto) {
    var s = producto.stock || 0;
    var m = producto.stock_minimo || 10;
    if (s === 0)       return { label: 'SIN STOCK',  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
    if (s <= m)        return { label: 'BAJO',        color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    if (s <= m * 2)    return { label: 'NORMAL',      color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' };
    return               { label: 'ÓPTIMO',           color: '#16a34a', bg: '#f0fdf4', border: '#86efac' };
  },
  _calcKPIs() {
    var prods  = DB.productos || [];
    var kardex = this._getKardex();
    var hoy    = this._fechaHoy();

    var total        = prods.length;
    var sinStock     = prods.filter(function(p){ return (p.stock||0) === 0; }).length;
    var bajoMinimo   = prods.filter(function(p){ return (p.stock||0) > 0 && (p.stock||0) <= (p.stock_minimo||10); }).length;
    var valorTotal   = prods.reduce(function(s,p){ return s + ((p.stock||0) * (p.precio_venta||0)); }, 0);
    var movsHoy      = kardex.filter(function(k){ return k.fecha === hoy; }).length;
    var unidadesTotales = prods.reduce(function(s,p){ return s + (p.stock||0); }, 0);

    return { total, sinStock, bajoMinimo, valorTotal, movsHoy, unidadesTotales };
  },
  _productosFiltrados() {
    var prods = (DB.productos || []).slice();

    if (this._filtroCategoria !== 'TODAS') {
      prods = prods.filter(function(p){ return p.categoria === InventarioModule._filtroCategoria; });
    }
    if (this._filtroBusqueda) {
      var q = this._filtroBusqueda.toLowerCase();
      prods = prods.filter(function(p){
        return (p.nombre||'').toLowerCase().includes(q) ||
               (p.codigo||'').toLowerCase().includes(q);
      });
    }
    if (this._filtroEstado === 'SIN_STOCK') {
      prods = prods.filter(function(p){ return (p.stock||0) === 0; });
    } else if (this._filtroEstado === 'BAJO') {
      prods = prods.filter(function(p){ return (p.stock||0) > 0 && (p.stock||0) <= (p.stock_minimo||10); });
    } else if (this._filtroEstado === 'OPTIMO') {
      prods = prods.filter(function(p){ return (p.stock||0) > (p.stock_minimo||10); });
    }

    return prods;
  },
  _categorias() {
    var cats = [];
    (DB.productos || []).forEach(function(p){
      if (p.categoria && !cats.includes(p.categoria)) cats.push(p.categoria);
    });
    return cats.sort();
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Inventario', 'CONTROL DE STOCK');
    var kpis   = this._calcKPIs();
    var prods  = this._productosFiltrados();
    var cats   = this._categorias();

    var totalPags = Math.ceil(prods.length / this._porPagina) || 1;
    if (this._paginaActual > totalPags) this._paginaActual = 1;
    var inicio = (this._paginaActual - 1) * this._porPagina;
    var prodsPag = prods.slice(inicio, inicio + this._porPagina);

    // ── KPIs ──
    var kpiHTML =
      '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-boxes"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.total+'</div><div class="stat-label">Total Productos</div></div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-cubes"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.unidadesTotales+'</div><div class="stat-label">Unidades en Stock</div></div>' +
      '</div>' +

      '<div class="stat-card" style="border-left:4px solid #d97706;">' +
        '<div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-exclamation-triangle"></i></div>' +
        '<div class="stat-info"><div class="stat-value" style="color:#d97706;">'+kpis.bajoMinimo+'</div><div class="stat-label">Bajo Mínimo</div></div>' +
      '</div>' +

      '<div class="stat-card" style="border-left:4px solid #dc2626;">' +
        '<div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-times-circle"></i></div>' +
        '<div class="stat-info"><div class="stat-value" style="color:#dc2626;">'+kpis.sinStock+'</div><div class="stat-label">Sin Stock</div></div>' +
      '</div>' +

      '<div class="stat-card" style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border:none;">' +
        '<div class="stat-icon" style="background:rgba(255,255,255,0.15);color:white;"><i class="fas fa-dollar-sign"></i></div>' +
        '<div class="stat-info"><div class="stat-value" style="color:white;font-size:15px;">S/ '+kpis.valorTotal.toFixed(0)+'</div><div class="stat-label" style="color:rgba(255,255,255,0.7);">Valor en Stock</div></div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#f5f3ff;color:#7c3aed;"><i class="fas fa-exchange-alt"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.movsHoy+'</div><div class="stat-label">Movimientos Hoy</div></div>' +
      '</div>' +

      '</div>';

    // ── Alertas ──
    var alertas = '';
    var criticos = (DB.productos||[]).filter(function(p){ return (p.stock||0) === 0; });
    var bajos    = (DB.productos||[]).filter(function(p){ return (p.stock||0) > 0 && (p.stock||0) <= (p.stock_minimo||10); });

    if (criticos.length > 0 || bajos.length > 0) {
      alertas = '<div style="margin-bottom:18px;">';

      if (criticos.length > 0) {
        alertas += '<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">' +
          '<i class="fas fa-times-circle" style="color:#dc2626;font-size:18px;flex-shrink:0;"></i>' +
          '<div style="flex:1;">' +
            '<div style="font-size:12px;font-weight:800;color:#dc2626;margin-bottom:3px;">⚠️ '+criticos.length+' PRODUCTO(S) SIN STOCK</div>' +
            '<div style="font-size:11px;color:#b91c1c;">'+criticos.slice(0,5).map(function(p){ return p.nombre; }).join(', ')+(criticos.length>5?' y '+(criticos.length-5)+' más...':'')+'</div>' +
          '</div>' +
          '<button onclick="InventarioModule._filtroEstado=\'SIN_STOCK\';App.renderPage();" style="background:#dc2626;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">Ver todos</button>' +
        '</div>';
      }

      if (bajos.length > 0) {
        alertas += '<div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;">' +
          '<i class="fas fa-exclamation-triangle" style="color:#d97706;font-size:18px;flex-shrink:0;"></i>' +
          '<div style="flex:1;">' +
            '<div style="font-size:12px;font-weight:800;color:#d97706;margin-bottom:3px;">'+bajos.length+' PRODUCTO(S) CON STOCK BAJO</div>' +
            '<div style="font-size:11px;color:#92400e;">'+bajos.slice(0,5).map(function(p){ return p.nombre+' ('+p.stock+' uds)'; }).join(', ')+(bajos.length>5?' y '+(bajos.length-5)+' más...':'')+'</div>' +
          '</div>' +
          '<button onclick="InventarioModule._filtroEstado=\'BAJO\';App.renderPage();" style="background:#d97706;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">Ver todos</button>' +
        '</div>';
      }

      alertas += '</div>';
    }

    // ── Filtros y barra de herramientas ──
    var toolbar =
      '<div class="card" style="margin-bottom:16px;">' +
        '<div style="padding:14px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +

          // Búsqueda
          '<div style="position:relative;flex:1;min-width:200px;">' +
            '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>' +
            '<input id="invBusqueda" type="text" placeholder="Buscar producto o código..." value="'+this._filtroBusqueda+'" ' +
              'oninput="InventarioModule._filtroBusqueda=this.value;InventarioModule._paginaActual=1;InventarioModule._renderTabla();" ' +
              'style="width:100%;padding:8px 10px 8px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
          '</div>' +

          // Filtro categoría
          '<select onchange="InventarioModule._filtroCategoria=this.value;InventarioModule._paginaActual=1;InventarioModule._renderTabla();" ' +
            'style="padding:8px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;background:white;cursor:pointer;">' +
            '<option value="TODAS"'+(this._filtroCategoria==='TODAS'?' selected':'')+'>Todas las categorías</option>' +
            cats.map(function(c){ return '<option value="'+c+'"'+(InventarioModule._filtroCategoria===c?' selected':'')+'>'+c+'</option>'; }).join('') +
          '</select>' +

          // Filtro estado
          '<select onchange="InventarioModule._filtroEstado=this.value;InventarioModule._paginaActual=1;InventarioModule._renderTabla();" ' +
            'style="padding:8px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;background:white;cursor:pointer;">' +
            '<option value="TODOS"'+(this._filtroEstado==='TODOS'?' selected':'')+'>Todos los estados</option>' +
            '<option value="OPTIMO"'+(this._filtroEstado==='OPTIMO'?' selected':'')+'>✅ Óptimo</option>' +
            '<option value="BAJO"'+(this._filtroEstado==='BAJO'?' selected':'')+'>⚠️ Stock bajo</option>' +
            '<option value="SIN_STOCK"'+(this._filtroEstado==='SIN_STOCK'?' selected':'')+'>🔴 Sin stock</option>' +
          '</select>' +

          // Botones acción
          '<button onclick="InventarioModule.ajusteRapido()" style="background:var(--accent);color:white;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">' +
            '<i class="fas fa-plus-minus" style="margin-right:6px;"></i>Ajuste de Stock' +
          '</button>' +
          '<button onclick="InventarioModule.verKardex()" style="background:var(--gray-100);color:var(--gray-700);border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">' +
            '<i class="fas fa-history" style="margin-right:6px;"></i>Historial' +
          '</button>' +

        '</div>' +

        // Contador
        '<div style="padding:0 16px 12px;font-size:12px;color:var(--gray-400);">' +
          'Mostrando <strong>'+Math.min(prods.length, inicio+1)+'-'+Math.min(prods.length, inicio+this._porPagina)+'</strong> de <strong>'+prods.length+'</strong> productos' +
          (this._filtroBusqueda || this._filtroCategoria !== 'TODAS' || this._filtroEstado !== 'TODOS' ?
            ' &nbsp;·&nbsp; <a href="#" onclick="InventarioModule._limpiarFiltros();return false;" style="color:var(--accent);font-weight:700;">Limpiar filtros</a>' : '') +
        '</div>' +
      '</div>';

    // ── Tabla ──
    var tabla = this._buildTabla(prodsPag, prods.length, inicio, totalPags);

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-warehouse" style="color:var(--accent);margin-right:8px;"></i>Inventario</h2>' +
          '<p class="text-muted text-sm">Control de stock · '+this._fechaHoy()+'</p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-outline" onclick="InventarioModule.verKardex()"><i class="fas fa-history"></i> Historial de Movimientos</button>' +
          '<button class="btn btn-primary" onclick="InventarioModule.ajusteRapido()"><i class="fas fa-sliders-h"></i> Ajuste de Stock</button>' +
        '</div>' +
      '</div>' +
      kpiHTML + alertas + toolbar +
      '<div id="invTablaContainer">' + tabla + '</div>'
    );
  },

  _limpiarFiltros() {
    this._filtroCategoria = 'TODAS';
    this._filtroBusqueda  = '';
    this._filtroEstado    = 'TODOS';
    this._paginaActual    = 1;
    App.renderPage();
  },

  _renderTabla() {
    var prods     = this._productosFiltrados();
    var totalPags = Math.ceil(prods.length / this._porPagina) || 1;
    if (this._paginaActual > totalPags) this._paginaActual = 1;
    var inicio    = (this._paginaActual - 1) * this._porPagina;
    var prodsPag  = prods.slice(inicio, inicio + this._porPagina);
    var container = document.getElementById('invTablaContainer');
    if (container) container.innerHTML = this._buildTabla(prodsPag, prods.length, inicio, totalPags);
  },

  _buildTabla(prodsPag, totalProds, inicio, totalPags) {
    var filas = '';
    if (prodsPag.length === 0) {
      filas = '<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--gray-400);">' +
        '<i class="fas fa-search" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<div style="font-size:14px;font-weight:700;">No se encontraron productos</div>' +
        '<div style="font-size:12px;margin-top:4px;">Prueba cambiando los filtros</div>' +
        '</td></tr>';
    } else {
      prodsPag.forEach(function(p, idx) {
        var estado = InventarioModule._estadoStock(p);
        var stock  = p.stock || 0;
        var minimo = p.stock_minimo || 10;
        var pct    = Math.min(100, Math.round((stock / Math.max(minimo * 2, 1)) * 100));

        filas +=
          '<tr style="transition:background 0.1s;" onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +

          // Imagen + nombre
          '<td style="padding:12px 16px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:40px;height:40px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--gray-100);display:flex;align-items:center;justify-content:center;">' +
                (p.imagen ? '<img src="'+p.imagen+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' :
                  '<i class="fas fa-tshirt" style="color:var(--gray-400);font-size:16px;"></i>') +
              '</div>' +
              '<div>' +
                '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+p.nombre+'</div>' +
                '<div style="font-size:11px;color:var(--gray-400);">'+p.codigo+'</div>' +
              '</div>' +
            '</div>' +
          '</td>' +

          // Categoría
          '<td style="padding:12px 8px;font-size:12px;color:var(--gray-600);">' +
            '<span style="background:var(--gray-100);padding:2px 8px;border-radius:20px;font-weight:600;">'+( p.categoria||'—')+'</span>' +
          '</td>' +

          // Stock actual con barra
          '<td style="padding:12px 8px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div style="font-size:20px;font-weight:900;color:'+(stock===0?'#dc2626':stock<=minimo?'#d97706':'var(--gray-800)')+';">'+stock+'</div>' +
              '<div>' +
                '<div style="font-size:10px;color:var(--gray-400);margin-bottom:2px;">uds</div>' +
                '<div style="width:60px;height:4px;background:var(--gray-200);border-radius:2px;overflow:hidden;">' +
                  '<div style="height:100%;width:'+pct+'%;background:'+(stock===0?'#dc2626':stock<=minimo?'#d97706':'#16a34a')+';border-radius:2px;transition:width 0.3s;"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +

          // Mínimo
          '<td style="padding:12px 8px;font-size:13px;color:var(--gray-500);text-align:center;">'+minimo+'</td>' +

          // Precio venta
          '<td style="padding:12px 8px;font-size:13px;font-weight:700;color:var(--gray-800);">S/ '+(p.precio_venta||0).toFixed(2)+'</td>' +

          // Valor en stock
          '<td style="padding:12px 8px;font-size:13px;font-weight:700;color:#2563eb;">S/ '+(stock*(p.precio_venta||0)).toFixed(2)+'</td>' +

          // Estado badge
          '<td style="padding:12px 8px;">' +
            '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;' +
              'background:'+estado.bg+';color:'+estado.color+';border:1px solid '+estado.border+';">' +
              estado.label +
            '</span>' +
          '</td>' +

          // Acciones
          '<td style="padding:12px 8px;">' +
            '<div style="display:flex;gap:6px;">' +
              '<button onclick="InventarioModule.ajusteProducto('+p.id+',\'ENTRADA\')" title="Entrada de stock" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:13px;" >' +
                '<i class="fas fa-plus"></i></button>' +
              '<button onclick="InventarioModule.ajusteProducto('+p.id+',\'SALIDA\')" title="Salida de stock" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:13px;">' +
                '<i class="fas fa-minus"></i></button>' +
              '<button onclick="InventarioModule.verHistorialProducto('+p.id+')" title="Ver historial" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:13px;">' +
                '<i class="fas fa-history"></i></button>' +
            '</div>' +
          '</td>' +

          '</tr>';
      });
    }

    // Paginación
    var paginacion = '';
    if (totalPags > 1) {
      paginacion = '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--gray-100);">' +
        '<div style="font-size:12px;color:var(--gray-400);">Página '+this._paginaActual+' de '+totalPags+'</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button onclick="InventarioModule._irPagina(1)" '+(this._paginaActual===1?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">«</button>' +
          '<button onclick="InventarioModule._irPagina('+(this._paginaActual-1)+')" '+(this._paginaActual===1?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">‹</button>' +
          (function(){
            var btns = '';
            var desde = Math.max(1, InventarioModule._paginaActual - 2);
            var hasta = Math.min(totalPags, desde + 4);
            for (var i = desde; i <= hasta; i++) {
              var activa = i === InventarioModule._paginaActual;
              btns += '<button onclick="InventarioModule._irPagina('+i+')" style="padding:5px 9px;border:1.5px solid '+(activa?'var(--accent)':'var(--gray-200)')+';border-radius:6px;background:'+(activa?'var(--accent)':'white')+';color:'+(activa?'white':'var(--gray-700)')+';cursor:pointer;font-size:12px;font-weight:'+(activa?'700':'400')+';">'+i+'</button>';
            }
            return btns;
          })() +
          '<button onclick="InventarioModule._irPagina('+(this._paginaActual+1)+')" '+(this._paginaActual===totalPags?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">›</button>' +
          '<button onclick="InventarioModule._irPagina('+totalPags+')" '+(this._paginaActual===totalPags?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">»</button>' +
        '</div>' +
      '</div>';
    }

    return '<div class="card">' +
      '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<thead>' +
        '<tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
          '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Producto</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Categoría</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Stock Actual</th>' +
          '<th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Mín.</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Precio</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Valor</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Estado</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Acciones</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' + filas + '</tbody>' +
      '</table>' +
      '</div>' +
      paginacion +
    '</div>';
  },

  _irPagina(n) {
    var prods     = this._productosFiltrados();
    var totalPags = Math.ceil(prods.length / this._porPagina) || 1;
    this._paginaActual = Math.max(1, Math.min(n, totalPags));
    this._renderTabla();
  },

  // ──────────────────────────────────────────────────────
  // AJUSTE DE STOCK — PRODUCTO ESPECÍFICO
  // ──────────────────────────────────────────────────────
  ajusteProducto(id, tipoDefault) {
    var prod = (DB.productos||[]).find(function(p){ return p.id == id; });
    if (!prod) return;
    var tipo = tipoDefault || 'ENTRADA';

    App.showModal('📦 Ajuste de Stock — '+prod.nombre,
      '<div style="background:var(--gray-50);border-radius:10px;padding:14px;margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:48px;height:48px;border-radius:10px;overflow:hidden;background:var(--gray-200);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            (prod.imagen ? '<img src="'+prod.imagen+'" style="width:100%;height:100%;object-fit:cover;">' :
              '<i class="fas fa-tshirt" style="color:var(--gray-400);font-size:20px;"></i>') +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">'+prod.nombre+'</div>' +
            '<div style="font-size:12px;color:var(--gray-400);">'+prod.codigo+' · '+prod.categoria+'</div>' +
            '<div style="font-size:12px;font-weight:700;color:var(--accent);margin-top:2px;">Stock actual: <span id="stockActualBadge" style="background:var(--accent);color:white;padding:1px 8px;border-radius:10px;">'+prod.stock+' uds</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="form-grid">' +

        // Tipo de movimiento
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Tipo de Movimiento</label>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
            ['ENTRADA','SALIDA','AJUSTE'].map(function(t) {
              var cfg = {
                ENTRADA: { icon:'fa-plus-circle', color:'#16a34a', bg:'#f0fdf4', border:'#86efac', label:'Entrada' },
                SALIDA:  { icon:'fa-minus-circle', color:'#dc2626', bg:'#fef2f2', border:'#fca5a5', label:'Salida'  },
                AJUSTE:  { icon:'fa-sliders-h',    color:'#2563eb', bg:'#eff6ff', border:'#93c5fd', label:'Ajuste'  }
              }[t];
              var activo = tipo === t;
              return '<label style="cursor:pointer;">' +
                '<input type="radio" name="tipoMov" value="'+t+'" '+(activo?'checked':'')+' style="display:none;" ' +
                  'onchange="InventarioModule._cambiarTipoMov(\''+t+'\','+prod.stock+')">' +
                '<div id="tipoBtn_'+t+'" style="padding:10px;border-radius:10px;text-align:center;border:2px solid '+(activo?cfg.border:'var(--gray-200)')+';background:'+(activo?cfg.bg:'white')+';transition:all 0.15s;">' +
                  '<i class="fas '+cfg.icon+'" style="font-size:18px;color:'+cfg.color+';display:block;margin-bottom:4px;"></i>' +
                  '<div style="font-size:12px;font-weight:700;color:'+cfg.color+';">'+cfg.label+'</div>' +
                '</div>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>' +

        // Cantidad
        '<div class="form-group">' +
          '<label class="form-label" id="labelCantidad">'+(tipo==='AJUSTE'?'Stock Final (uds)':'Cantidad (uds)')+'</label>' +
          '<input class="form-control" id="ajusteCantidad" type="number" min="0" step="1" value="'+(tipo==='AJUSTE'?prod.stock:'1')+'" ' +
            'style="font-size:24px;text-align:center;font-weight:900;padding:12px;" ' +
            'oninput="InventarioModule._previewNuevoStock('+prod.stock+')" />' +
        '</div>' +

        // Preview nuevo stock
        '<div class="form-group" style="display:flex;align-items:flex-end;">' +
          '<div style="width:100%;padding:14px;background:var(--gray-50);border-radius:10px;text-align:center;">' +
            '<div style="font-size:11px;color:var(--gray-400);margin-bottom:4px;">Nuevo stock será</div>' +
            '<div id="previewStock" style="font-size:28px;font-weight:900;color:var(--accent);">—</div>' +
          '</div>' +
        '</div>' +

        // Motivo
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Motivo / Observación <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="ajusteMotivo" type="text" list="motivosAjuste" placeholder="Ej: Compra a proveedor, Merma, Conteo físico..." autofocus/>' +
          '<datalist id="motivosAjuste">' +
            ['Compra a proveedor','Conteo físico','Merma / Daño','Devolución cliente','Traslado entre tiendas','Corrección de error','Muestra de producto'].map(function(m){ return '<option value="'+m+'">'; }).join('') +
          '</datalist>' +
        '</div>' +

        // Responsable
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Responsable</label>' +
          '<input class="form-control" value="'+(DB.usuarioActual?DB.usuarioActual.usuario:'')+'" readonly style="background:var(--gray-50);"/>' +
        '</div>' +

      '</div>',

      [{ text:'✅ Confirmar Ajuste', cls:'btn-primary', cb: function() {
        var tipoSel = document.querySelector('input[name="tipoMov"]:checked')?.value || 'ENTRADA';
        var cantRaw = parseFloat(document.getElementById('ajusteCantidad')?.value);
        var motivo  = document.getElementById('ajusteMotivo')?.value?.trim();

        if (isNaN(cantRaw) || cantRaw < 0) { App.toast('Ingresa una cantidad válida', 'error'); return; }
        if (!motivo) { App.toast('Ingresa el motivo del ajuste', 'error'); return; }

        var stockAnterior = prod.stock || 0;
        var stockNuevo;

        if (tipoSel === 'ENTRADA')      stockNuevo = stockAnterior + cantRaw;
        else if (tipoSel === 'SALIDA')  stockNuevo = Math.max(0, stockAnterior - cantRaw);
        else                            stockNuevo = cantRaw; // AJUSTE directo

        if (tipoSel === 'SALIDA' && cantRaw > stockAnterior) {
          App.toast('No hay suficiente stock (disponible: '+stockAnterior+')', 'error'); return;
        }

        // Actualizar stock en DB
        var idxProd = DB.productos.findIndex(function(p){ return p.id == id; });
        if (idxProd !== -1) {
          DB.productos[idxProd].stock = stockNuevo;
          Storage.guardarProductos();
          SheetsSync.actualizarProducto(DB.productos[idxProd]);
        }

        // Registrar en Kardex
        if (!DB.kardex) DB.kardex = [];
        DB.kardex.push({
          id:             Date.now(),
          producto_id:    prod.id,
          producto_nombre:prod.nombre,
          tipo:           tipoSel,
          cantidad:       tipoSel === 'AJUSTE' ? (stockNuevo - stockAnterior) : (tipoSel === 'SALIDA' ? -cantRaw : cantRaw),
          stock_anterior: stockAnterior,
          stock_nuevo:    stockNuevo,
          motivo:         motivo,
          fecha:          InventarioModule._fechaHoy(),
          hora:           InventarioModule._horaAhora(),
          responsable:    DB.usuarioActual?.usuario || ''
        });
        Storage.guardarKardex();

        var msg = tipoSel === 'ENTRADA' ? '📦 Entrada registrada: +'+cantRaw+' uds' :
                  tipoSel === 'SALIDA'  ? '📤 Salida registrada: -'+cantRaw+' uds' :
                                          '🔄 Stock ajustado a '+stockNuevo+' uds';
        App.toast(msg, 'success');
        App.closeModal();
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '480px';
    // Trigger preview inicial
    setTimeout(function(){
      InventarioModule._previewNuevoStock(prod.stock);
    }, 100);
  },

  _cambiarTipoMov(tipo, stockActual) {
    ['ENTRADA','SALIDA','AJUSTE'].forEach(function(t) {
      var btn = document.getElementById('tipoBtn_'+t);
      if (!btn) return;
      var cfgs = {
        ENTRADA: { color:'#16a34a', bg:'#f0fdf4', border:'#86efac' },
        SALIDA:  { color:'#dc2626', bg:'#fef2f2', border:'#fca5a5' },
        AJUSTE:  { color:'#2563eb', bg:'#eff6ff', border:'#93c5fd' }
      };
      var cfg = cfgs[t];
      if (t === tipo) {
        btn.style.border    = '2px solid '+cfg.border;
        btn.style.background = cfg.bg;
      } else {
        btn.style.border    = '2px solid var(--gray-200)';
        btn.style.background = 'white';
      }
    });
    var label = document.getElementById('labelCantidad');
    var input = document.getElementById('ajusteCantidad');
    if (label) label.textContent = tipo === 'AJUSTE' ? 'Stock Final (uds)' : 'Cantidad (uds)';
    if (input) { input.value = tipo === 'AJUSTE' ? stockActual : '1'; }
    this._previewNuevoStock(stockActual);
  },

  _previewNuevoStock(stockActual) {
    var tipo  = document.querySelector('input[name="tipoMov"]:checked')?.value || 'ENTRADA';
    var cant  = parseFloat(document.getElementById('ajusteCantidad')?.value) || 0;
    var el    = document.getElementById('previewStock');
    if (!el) return;
    var nuevo;
    if (tipo === 'ENTRADA')     nuevo = stockActual + cant;
    else if (tipo === 'SALIDA') nuevo = Math.max(0, stockActual - cant);
    else                        nuevo = cant;
    el.textContent = Math.round(nuevo) + ' uds';
    el.style.color = nuevo === 0 ? '#dc2626' : nuevo < 10 ? '#d97706' : '#16a34a';
  },

  // ──────────────────────────────────────────────────────
  // AJUSTE RÁPIDO — BUSCAR PRODUCTO
  // ──────────────────────────────────────────────────────
  ajusteRapido() {
    var prods = DB.productos || [];
    App.showModal('🔍 Ajuste de Stock',
      '<div style="margin-bottom:14px;">' +
        '<div style="position:relative;">' +
          '<i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--gray-400);"></i>' +
          '<input id="busqAjuste" type="text" placeholder="Buscar producto por nombre o código..." autofocus ' +
            'oninput="InventarioModule._filtrarModalAjuste()" ' +
            'style="width:100%;padding:10px 10px 10px 36px;border:2px solid var(--accent);border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;"/>' +
        '</div>' +
      '</div>' +
      '<div id="listaAjuste" style="max-height:340px;overflow-y:auto;border-radius:8px;border:1px solid var(--gray-200);">' +
        this._buildListaAjuste(prods.slice(0,20)) +
      '</div>',
      []
    );
    document.getElementById('modalBox').style.maxWidth = '460px';
  },

  _buildListaAjuste(prods) {
    if (prods.length === 0) {
      return '<div style="text-align:center;padding:24px;color:var(--gray-400);">No se encontraron productos</div>';
    }
    return prods.map(function(p) {
      var estado = InventarioModule._estadoStock(p);
      return '<div onclick="App.closeModal();InventarioModule.ajusteProducto('+p.id+',\'ENTRADA\')" ' +
        'style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--gray-100);cursor:pointer;transition:background 0.1s;" ' +
        'onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<div style="width:36px;height:36px;border-radius:8px;overflow:hidden;background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          (p.imagen ? '<img src="'+p.imagen+'" style="width:100%;height:100%;object-fit:cover;">' :
            '<i class="fas fa-tshirt" style="color:var(--gray-400);font-size:14px;"></i>') +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:700;color:var(--gray-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+p.nombre+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+p.codigo+' · '+(p.categoria||'—')+'</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:16px;font-weight:900;color:'+estado.color+';">'+p.stock+'</div>' +
          '<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:'+estado.bg+';color:'+estado.color+';font-weight:700;">'+estado.label+'</span>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  _filtrarModalAjuste() {
    var q     = (document.getElementById('busqAjuste')?.value || '').toLowerCase();
    var prods = (DB.productos||[]).filter(function(p){
      return (p.nombre||'').toLowerCase().includes(q) || (p.codigo||'').toLowerCase().includes(q);
    }).slice(0, 20);
    var lista = document.getElementById('listaAjuste');
    if (lista) lista.innerHTML = this._buildListaAjuste(prods);
  },

  // ──────────────────────────────────────────────────────
  // HISTORIAL GENERAL (KARDEX)
  // ──────────────────────────────────────────────────────
  verKardex() {
    var kardex = this._getKardex().slice().sort(function(a,b){
      return (a.fecha+a.hora) > (b.fecha+b.hora) ? -1 : 1;
    });
    var recientes = kardex.slice(0, 50);

    var filas = recientes.length === 0 ?
      '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--gray-400);">Sin movimientos registrados</td></tr>' :
      recientes.map(function(k) {
        var cfg = k.tipo === 'ENTRADA' ? { color:'#16a34a', icon:'fa-plus-circle', bg:'#f0fdf4' } :
                  k.tipo === 'SALIDA'  ? { color:'#dc2626', icon:'fa-minus-circle', bg:'#fef2f2' } :
                                         { color:'#2563eb', icon:'fa-sliders-h',   bg:'#eff6ff' };
        var cant = k.cantidad || 0;
        return '<tr>' +
          '<td style="padding:10px 12px;font-size:11px;color:var(--gray-400);white-space:nowrap;">'+k.fecha+'<br>'+k.hora+'</td>' +
          '<td style="padding:10px 8px;">' +
            '<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+cfg.bg+';color:'+cfg.color+';">' +
              '<i class="fas '+cfg.icon+'"></i>'+k.tipo+
            '</span>' +
          '</td>' +
          '<td style="padding:10px 8px;font-size:12px;font-weight:700;color:var(--gray-800);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+k.producto_nombre+'</td>' +
          '<td style="padding:10px 8px;font-size:14px;font-weight:900;color:'+cfg.color+';text-align:center;">'+(cant>0?'+':'')+cant+'</td>' +
          '<td style="padding:10px 8px;font-size:11px;color:var(--gray-500);">'+k.motivo+'</td>' +
          '<td style="padding:10px 8px;font-size:11px;color:var(--gray-400);">'+k.responsable+'</td>' +
        '</tr>';
      }).join('');

    var html =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
        '<div style="background:#f0fdf4;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;color:#16a34a;">'+kardex.filter(function(k){ return k.tipo==='ENTRADA'; }).length+' Entradas</div>' +
        '<div style="background:#fef2f2;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;color:#dc2626;">'+kardex.filter(function(k){ return k.tipo==='SALIDA'; }).length+' Salidas</div>' +
        '<div style="background:#eff6ff;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;color:#2563eb;">'+kardex.filter(function(k){ return k.tipo==='AJUSTE'; }).length+' Ajustes</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-left:auto;">Mostrando últimos 50 movimientos</div>' +
      '</div>' +
      '<div style="max-height:380px;overflow-y:auto;border-radius:8px;border:1px solid var(--gray-200);">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead style="position:sticky;top:0;z-index:1;">' +
            '<tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
              '<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Fecha/Hora</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Tipo</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Producto</th>' +
              '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cant.</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Motivo</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Usuario</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>';

    App.showModal('📋 Historial de Movimientos de Stock', html, []);
    document.getElementById('modalBox').style.maxWidth = '700px';
  },

  // ──────────────────────────────────────────────────────
  // HISTORIAL POR PRODUCTO
  // ──────────────────────────────────────────────────────
  verHistorialProducto(id) {
    var prod   = (DB.productos||[]).find(function(p){ return p.id == id; });
    if (!prod) return;
    var movs = this._getKardex()
      .filter(function(k){ return k.producto_id == id; })
      .sort(function(a,b){ return (a.fecha+a.hora) > (b.fecha+b.hora) ? -1 : 1; });

    var filas = movs.length === 0 ?
      '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400);">Sin movimientos para este producto</td></tr>' :
      movs.map(function(k) {
        var cfg = k.tipo === 'ENTRADA' ? { color:'#16a34a', bg:'#f0fdf4' } :
                  k.tipo === 'SALIDA'  ? { color:'#dc2626', bg:'#fef2f2' } :
                                         { color:'#2563eb', bg:'#eff6ff' };
        var cant = k.cantidad || 0;
        return '<tr>' +
          '<td style="padding:9px 12px;font-size:11px;color:var(--gray-400);">'+k.fecha+' '+k.hora+'</td>' +
          '<td style="padding:9px 8px;">' +
            '<span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;background:'+cfg.bg+';color:'+cfg.color+';">'+k.tipo+'</span>' +
          '</td>' +
          '<td style="padding:9px 8px;font-size:13px;font-weight:900;color:'+cfg.color+';text-align:center;">'+(cant>0?'+':'')+cant+'</td>' +
          '<td style="padding:9px 8px;font-size:11px;color:var(--gray-500);">'+k.motivo+'</td>' +
          '<td style="padding:9px 8px;font-size:11px;color:var(--gray-400);">'+k.responsable+'</td>' +
        '</tr>';
      }).join('');

    var html =
      '<div style="background:var(--gray-50);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">'+prod.nombre+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+prod.codigo+' · '+(prod.categoria||'—')+'</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:22px;font-weight:900;color:var(--accent);">'+prod.stock+' uds</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">stock actual</div>' +
        '</div>' +
      '</div>' +
      '<div style="max-height:320px;overflow-y:auto;border-radius:8px;border:1px solid var(--gray-200);">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead>' +
            '<tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
              '<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Fecha</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Tipo</th>' +
              '<th style="padding:8px 8px;text-align:center;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cant.</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Motivo</th>' +
              '<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Usuario</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>';

    App.showModal('📋 Historial — '+prod.nombre, html, [
      { text:'📦 Ajustar Stock', cls:'btn-primary', cb: function(){ App.closeModal(); InventarioModule.ajusteProducto(id, 'ENTRADA'); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '560px';
  }
};