// ============================================================
// MÓDULO: LISTA DE PRECIOS — Versión Profesional Completa
// ============================================================

const PreciosModule = {

  listas: [
    { id:1, nombre:'PRECIO MINORISTA',    descripcion:'Precio regular para clientes al por menor',      descuento:0,  color:'#2563eb', icon:'fa-user',          activa:true  },
    { id:2, nombre:'PRECIO MAYORISTA',    descripcion:'Para compras mayores a 10 unidades',             descuento:15, color:'#16a34a', icon:'fa-users',         activa:true  },
    { id:3, nombre:'PRECIO VIP',          descripcion:'Clientes frecuentes y especiales',               descuento:20, color:'#7c3aed', icon:'fa-crown',         activa:true  },
    { id:4, nombre:'PRECIO DISTRIBUIDOR', descripcion:'Distribuidores y revendedores autorizados',      descuento:30, color:'#d97706', icon:'fa-truck',         activa:false },
  ],

  selectedLista:   1,
  searchProducto:  '',
  searchCategoria: 'todas',
  currentPage:     1,
  _porPagina:      15,
  _vistaComparacion: false,

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Lista de Precios', 'CATÁLOGO');
    var self = this;
    var lista = this.listas.find(function(l){return l.id===self.selectedLista;}) || this.listas[0];
    var categorias = ['todas'].concat([...new Set((DB.productos||[]).map(function(p){return p.categoria;}))].sort());
    var productosFiltrados = (DB.productos||[]).filter(function(p){
      var matchCat  = self.searchCategoria==='todas' || p.categoria===self.searchCategoria;
      var matchProd = !self.searchProducto ||
        (p.nombre||'').toLowerCase().includes(self.searchProducto.toLowerCase()) ||
        (p.codigo||'').toLowerCase().includes(self.searchProducto.toLowerCase());
      return matchCat && matchProd;
    });

    var totalPages  = Math.max(1, Math.ceil(productosFiltrados.length / this._porPagina));
    var currentPage = Math.min(this.currentPage, totalPages);
    var paginados   = productosFiltrados.slice((currentPage-1)*this._porPagina, currentPage*this._porPagina);

    // KPIs de la lista seleccionada
    var customCount = 0;
    if (DB.preciosCustom && DB.preciosCustom[lista.id]) {
      customCount = Object.keys(DB.preciosCustom[lista.id]).length;
    }
    var totalProds   = (DB.productos||[]).length;
    var avgDescuento = lista.descuento;
    var ahorroTotal  = (DB.productos||[]).reduce(function(s,p){
      return s + (p.precio_venta||0) * (lista.descuento/100);
    }, 0);

    // ── CARDS DE LISTAS ──
    var cardsHTML = '<div style="display:grid;grid-template-columns:repeat('+this.listas.length+',1fr);gap:14px;margin-bottom:22px;">' +
      this.listas.map(function(l){
        var isSelected = self.selectedLista === l.id;
        var customCnt  = DB.preciosCustom && DB.preciosCustom[l.id] ? Object.keys(DB.preciosCustom[l.id]).length : 0;
        return '<div onclick="PreciosModule.selectedLista='+l.id+';PreciosModule.currentPage=1;App.renderPage()" ' +
          'style="cursor:pointer;padding:16px;background:white;border-radius:14px;border:2px solid '+(isSelected?l.color:'var(--gray-200)')+';' +
          'box-shadow:'+(isSelected?'0 4px 16px '+l.color+'33':'0 1px 4px rgba(0,0,0,0.05)')+';transition:all 0.2s;position:relative;overflow:hidden;" ' +
          'onmouseover="this.style.borderColor=\''+l.color+'\';this.style.boxShadow=\'0 4px 16px '+l.color+'33\'" ' +
          'onmouseout="this.style.borderColor=\''+(isSelected?l.color:'var(--gray-200)')+'\';this.style.boxShadow=\''+(isSelected?'0 4px 16px '+l.color+'33':'0 1px 4px rgba(0,0,0,0.05)')+'\';">' +

          // Fondo decorativo
          '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:'+l.color+'0d;"></div>' +

          // Header
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">' +
            '<div style="width:42px;height:42px;border-radius:12px;background:'+l.color+'18;color:'+l.color+';display:flex;align-items:center;justify-content:center;font-size:16px;">' +
              '<i class="fas '+l.icon+'"></i>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(l.activa?'#f0fdf4':'#f3f4f6')+';color:'+(l.activa?'#16a34a':'#6b7280')+';">'+(l.activa?'ACTIVA':'INACTIVA')+'</span>' +
            '</div>' +
          '</div>' +

          // Info
          '<div style="font-size:13px;font-weight:900;color:var(--gray-800);margin-bottom:3px;">'+l.nombre+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);margin-bottom:12px;line-height:1.4;">'+l.descripcion+'</div>' +

          // Stats
          '<div style="display:flex;gap:8px;">' +
            '<div style="flex:1;padding:8px;background:'+l.color+'0d;border-radius:8px;text-align:center;">' +
              '<div style="font-size:16px;font-weight:900;color:'+l.color+';">'+(l.descuento===0?'Base':'-'+l.descuento+'%')+'</div>' +
              '<div style="font-size:9px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Descuento</div>' +
            '</div>' +
            '<div style="flex:1;padding:8px;background:var(--gray-50);border-radius:8px;text-align:center;">' +
              '<div style="font-size:16px;font-weight:900;color:var(--gray-700);">'+customCnt+'</div>' +
              '<div style="font-size:9px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Precios esp.</div>' +
            '</div>' +
          '</div>' +

          (isSelected ? '<div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:'+l.color+';"></div>' : '') +
        '</div>';
      }).join('') +
    '</div>';

    // ── KPIs DE LA LISTA ACTIVA ──
    var kpisHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {l:'Productos en Lista', v:totalProds,        c:lista.color, bg:lista.color+'18', i:'fa-boxes'},
        {l:'Descuento Global',   v:(avgDescuento>0?'-'+avgDescuento+'%':'Sin descuento'), c:lista.color, bg:lista.color+'18', i:'fa-percent'},
        {l:'Precios Especiales', v:customCount,       c:'#7c3aed', bg:'#f5f3ff', i:'fa-tag'},
        {l:'Ahorro Estimado',    v:'S/ '+ahorroTotal.toFixed(0), c:'#16a34a', bg:'#f0fdf4', i:'fa-piggy-bank'},
      ].map(function(k){
        return '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:12px;">' +
          '<div style="width:38px;height:38px;border-radius:10px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas '+k.i+'"></i></div>' +
          '<div><div style="font-size:17px;font-weight:900;color:'+k.c+';">'+k.v+'</div><div style="font-size:11px;color:var(--gray-400);">'+k.l+'</div></div>' +
        '</div>';
      }).join('') +
    '</div>';

    // ── TOOLBAR ──
    var toolbar = '<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">' +

        // Info lista
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:'+lista.color+'18;color:'+lista.color+';display:flex;align-items:center;justify-content:center;font-size:14px;">' +
            '<i class="fas '+lista.icon+'"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:900;color:var(--gray-800);">'+lista.nombre+'</div>' +
            '<div style="font-size:11px;color:var(--gray-400);">'+lista.descripcion+'</div>' +
          '</div>' +
          (lista.descuento>0 ?
            '<span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800;background:'+lista.color+'18;color:'+lista.color+';border:1px solid '+lista.color+'44;">-'+lista.descuento+'% aplicado</span>' :
            '<span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800;background:#eff6ff;color:#2563eb;border:1px solid #93c5fd;">Precio Base</span>'
          ) +
        '</div>' +

        // Acciones
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button onclick="PreciosModule._vistaComparacion=!PreciosModule._vistaComparacion;App.renderPage()" ' +
            'style="padding:8px 14px;background:'+(this._vistaComparacion?lista.color:lista.color+'18')+';color:'+(this._vistaComparacion?'white':lista.color)+';border:1.5px solid '+lista.color+';border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-columns" style="margin-right:5px;"></i>'+(this._vistaComparacion?'Vista Simple':'Vista Comparativa')+'</button>' +
          '<button onclick="PreciosModule.aplicarDescuentoMasivo()" ' +
            'style="padding:8px 14px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-percentage" style="margin-right:5px;color:#7c3aed;"></i>Dcto. Masivo</button>' +
          '<button onclick="PreciosModule.editarLista('+lista.id+')" ' +
            'style="padding:8px 14px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-edit" style="margin-right:5px;color:#2563eb;"></i>Editar</button>' +
          '<button onclick="PreciosModule.exportarLista()" ' +
            'style="padding:8px 14px;background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-file-csv" style="margin-right:5px;color:#16a34a;"></i>Exportar CSV</button>' +
        '</div>' +
      '</div>' +

      // Filtros
      '<div style="padding:12px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--gray-100);">' +
        '<div style="position:relative;flex:1;min-width:200px;">' +
          '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>' +
          '<input type="text" placeholder="Buscar producto o código..." value="'+this.searchProducto+'" ' +
            'oninput="PreciosModule.searchProducto=this.value;PreciosModule.currentPage=1;PreciosModule._updateTabla()" ' +
            'style="width:100%;padding:8px 10px 8px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
        '</div>' +
        '<select onchange="PreciosModule.searchCategoria=this.value;PreciosModule.currentPage=1;PreciosModule._updateTabla()" ' +
          'style="padding:8px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;background:white;cursor:pointer;min-width:180px;">' +
          categorias.map(function(c){
            return '<option value="'+c+'"'+(self.searchCategoria===c?' selected':'')+'>'+( c==='todas'?'Todas las categorías':c)+'</option>';
          }).join('') +
        '</select>' +
        '<select onchange="PreciosModule._porPagina=parseInt(this.value);PreciosModule.currentPage=1;App.renderPage()" ' +
          'style="padding:8px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;background:white;cursor:pointer;">' +
          [10,15,25,50].map(function(n){return '<option value="'+n+'"'+(self._porPagina===n?' selected':'')+'>'+n+' / pág</option>';}).join('')+
        '</select>' +
        (this.searchProducto || this.searchCategoria!=='todas' ?
          '<button onclick="PreciosModule.searchProducto=\'\';PreciosModule.searchCategoria=\'todas\';PreciosModule.currentPage=1;App.renderPage();" ' +
            'style="padding:8px 14px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-times" style="margin-right:5px;"></i>Limpiar</button>' : '') +
      '</div>' +

      '<div style="padding:6px 18px;font-size:12px;color:var(--gray-400);">' +
        'Mostrando <strong>'+paginados.length+'</strong> de <strong>'+productosFiltrados.length+'</strong> productos' +
      '</div>' +
    '</div>';

    // ── TABLA ──
    var tablaHTML = this._vistaComparacion ? this._buildTablaComparativa(paginados, lista) : this._buildTabla(paginados, lista);

    // ── PAGINACIÓN ──
    var paginacion = this._buildPaginacion(currentPage, totalPages, productosFiltrados.length);

    return '<div class="page-header">' +
      '<div><h2 class="page-title"><i class="fas fa-tags" style="color:var(--accent);margin-right:8px;"></i>Lista de Precios</h2>' +
        '<p class="text-muted text-sm">Gestiona los precios por tipo de cliente</p></div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-outline" onclick="PreciosModule.exportarLista()"><i class="fas fa-file-csv"></i> Exportar</button>' +
        '<button class="btn btn-primary" onclick="PreciosModule.nuevaLista()"><i class="fas fa-plus"></i> Nueva Lista</button>' +
      '</div>' +
    '</div>' +
    cardsHTML + kpisHTML + toolbar +
     '<div id="preciosContent">' + tablaHTML + paginacion + '</div>';
  },

  // ──────────────────────────────────────────────────────
  // TABLA NORMAL
  // ──────────────────────────────────────────────────────
  _buildTabla(paginados, lista) {
    var self = this;
    var filas = paginados.length === 0 ?
      '<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--gray-400);">' +
        '<i class="fas fa-search" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<div style="font-size:14px;font-weight:700;">No se encontraron productos</div></td></tr>' :
      paginados.map(function(p) {
        var custom  = DB.preciosCustom && DB.preciosCustom[lista.id] ? DB.preciosCustom[lista.id][p.id] : null;
        var pFinal  = custom || (p.precio_venta * (1 - lista.descuento/100));
        var tieneCustom = !!custom;
        var ahorro  = p.precio_venta - pFinal;
        var stock   = p.stock||0;
        var stockClr= stock===0?'#dc2626':stock<=10?'#d97706':'#16a34a';

        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +

          // Código
          '<td style="padding:10px 14px;">' +
            '<span style="padding:2px 8px;background:var(--gray-100);border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;color:var(--gray-600);">'+p.codigo+'</span>' +
          '</td>' +

          // Producto
          '<td style="padding:10px 8px;">' +
            '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+p.nombre+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);margin-top:1px;">'+p.categoria+'</div>' +
          '</td>' +

          // Stock
          '<td style="padding:10px 8px;text-align:center;">' +
            '<span style="font-size:12px;font-weight:700;color:'+stockClr+';">'+(stock===0?'Agotado':stock+' uds')+'</span>' +
          '</td>' +

          // P. Base
          '<td style="padding:10px 8px;font-size:13px;font-weight:700;color:var(--gray-600);">S/ '+p.precio_venta.toFixed(2)+'</td>' +

          // Dcto
          '<td style="padding:10px 8px;text-align:center;">' +
            (lista.descuento>0 && !tieneCustom ?
              '<span style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:800;background:#f0fdf4;color:#16a34a;">-'+lista.descuento+'%</span>' :
              tieneCustom ? '<span style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:800;background:#eff6ff;color:#2563eb;">Custom</span>' :
              '<span style="color:var(--gray-300);font-size:12px;">—</span>'
            ) +
          '</td>' +

          // P. Final
          '<td style="padding:10px 8px;">' +
            '<div style="font-size:15px;font-weight:900;color:'+lista.color+';">S/ '+pFinal.toFixed(2)+'</div>' +
            (ahorro>0 ? '<div style="font-size:10px;color:#16a34a;">Ahorro: S/ '+ahorro.toFixed(2)+'</div>' : '') +
          '</td>' +

          // Precio especial (input inline)
          '<td style="padding:8px;">' +
            '<div style="display:flex;align-items:center;gap:5px;">' +
              '<input type="number" step="0.01" placeholder="Precio esp..." value="'+(custom?custom.toFixed(2):'')+'" ' +
                'onchange="PreciosModule.setCustom('+lista.id+','+p.id+',this.value)" ' +
                'onfocus="this.style.borderColor=\''+lista.color+'\'" ' +
                'onblur="this.style.borderColor=\'var(--gray-200)\'" ' +
                'style="width:100px;padding:5px 8px;border:1.5px solid '+(tieneCustom?lista.color:'var(--gray-200)')+';border-radius:7px;font-size:12px;font-weight:700;outline:none;background:'+(tieneCustom?lista.color+'08':'white')+';color:'+(tieneCustom?lista.color:'var(--gray-700)')+';transition:all 0.15s;"/>' +
              (tieneCustom ?
                '<button onclick="PreciosModule.clearCustom('+lista.id+','+p.id+')" title="Restaurar precio" ' +
                  'style="width:26px;height:26px;border-radius:6px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:11px;flex-shrink:0;">' +
                  '<i class="fas fa-undo"></i></button>' : '') +
            '</div>' +
          '</td>' +

          // Acciones
          '<td style="padding:8px 14px;">' +
            '<button onclick="PreciosModule.verHistorial('+p.id+')" title="Ver historial de precios" ' +
              'style="width:28px;height:28px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:11px;">' +
              '<i class="fas fa-history"></i></button>' +
          '</td>' +

        '</tr>';
      }).join('');

    return '<div class="card" style="margin-bottom:12px;"><div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
          '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Código</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Producto</th>' +
          '<th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Stock</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">P. Base</th>' +
          '<th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Dcto.</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:'+lista.color+';text-transform:uppercase;letter-spacing:0.5px;">P. Final</th>' +
          '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Precio Especial</th>' +
          '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Más</th>' +
        '</tr></thead>' +
        '<tbody>'+filas+'</tbody>' +
      '</table>' +
    '</div></div>';
  },

  // ──────────────────────────────────────────────────────
  // TABLA COMPARATIVA
  // ──────────────────────────────────────────────────────
  _buildTablaComparativa(paginados, listaActual) {
    var self = this;
    if (paginados.length === 0) {
      return '<div class="card" style="margin-bottom:12px;"><div style="text-align:center;padding:48px;color:var(--gray-400);"><i class="fas fa-search" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i><div style="font-size:14px;font-weight:700;">No se encontraron productos</div></div></div>';
    }

    var filas = paginados.map(function(p) {
      var row = '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:10px 14px;">' +
          '<span style="padding:2px 8px;background:var(--gray-100);border-radius:5px;font-size:11px;font-family:monospace;font-weight:700;">'+p.codigo+'</span>' +
        '</td>' +
        '<td style="padding:10px 8px;">' +
          '<div style="font-size:13px;font-weight:700;">'+p.nombre+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+p.categoria+'</div>' +
        '</td>' +
        '<td style="padding:10px 8px;font-size:13px;font-weight:700;color:var(--gray-600);">S/ '+p.precio_venta.toFixed(2)+'</td>';

      self.listas.filter(function(l){return l.activa;}).forEach(function(l) {
        var custom = DB.preciosCustom && DB.preciosCustom[l.id] ? DB.preciosCustom[l.id][p.id] : null;
        var pFinal = custom || (p.precio_venta * (1 - l.descuento/100));
        var isAct  = l.id === listaActual.id;
        row += '<td style="padding:10px 8px;text-align:center;background:'+(isAct?l.color+'08':'')+';">' +
          '<div style="font-size:14px;font-weight:900;color:'+l.color+';">S/ '+pFinal.toFixed(2)+'</div>' +
          (custom ? '<div style="font-size:9px;color:'+l.color+';font-weight:700;">Custom</div>' :
           l.descuento>0 ? '<div style="font-size:9px;color:#16a34a;">-'+l.descuento+'%</div>' : '') +
        '</td>';
      });

      row += '</tr>';
      return row;
    }).join('');

    var header = '<tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
      '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Código</th>' +
      '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Producto</th>' +
      '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">P. Base</th>';

    this.listas.filter(function(l){return l.activa;}).forEach(function(l) {
      var isAct = l.id === listaActual.id;
      header += '<th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:800;color:'+l.color+';text-transform:uppercase;background:'+(isAct?l.color+'08':'')+';">'+
        '<i class="fas '+l.icon+'" style="margin-right:4px;"></i>'+l.nombre+'</th>';
    });
    header += '</tr>';

    return '<div class="card" style="margin-bottom:12px;"><div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead>'+header+'</thead>' +
        '<tbody>'+filas+'</tbody>' +
      '</table></div></div>';
  },

  // ──────────────────────────────────────────────────────
  // PAGINACIÓN
  // ──────────────────────────────────────────────────────
  _buildPaginacion(currentPage, totalPages, total) {
    if (totalPages <= 1) return '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;">' +
      '<span style="font-size:12px;color:var(--gray-400);">Página <strong>'+currentPage+'</strong> de <strong>'+totalPages+'</strong> · '+total+' productos</span>' +
      '<div style="display:flex;gap:5px;">' +
        '<button onclick="PreciosModule.currentPage=1;App.renderPage()" '+(currentPage===1?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">«</button>' +
        '<button onclick="PreciosModule.currentPage--;App.renderPage()" '+(currentPage===1?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">‹</button>' +
        (function(){
          var btns='', desde=Math.max(1,currentPage-2), hasta=Math.min(totalPages,desde+4);
          for(var i=desde;i<=hasta;i++){
            var act=i===currentPage;
            btns+='<button onclick="PreciosModule.currentPage='+i+';App.renderPage()" style="padding:6px 10px;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';border-radius:7px;background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-700)')+';cursor:pointer;font-size:12px;font-weight:'+(act?'700':'400')+';">'+i+'</button>';
          }
          return btns;
        })() +
        '<button onclick="PreciosModule.currentPage++;App.renderPage()" '+(currentPage===totalPages?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">›</button>' +
        '<button onclick="PreciosModule.currentPage='+totalPages+';App.renderPage()" '+(currentPage===totalPages?'disabled':'')+' style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:7px;background:white;cursor:pointer;font-size:12px;">»</button>' +
      '</div>' +
    '</div>';
  },

  // ──────────────────────────────────────────────────────
  // NUEVA LISTA
  // ──────────────────────────────────────────────────────
  nuevaLista() {
    var iconos = ['fa-user','fa-users','fa-crown','fa-truck','fa-star','fa-building','fa-briefcase'];
    App.showModal('➕ Nueva Lista de Precios',
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre de la Lista *</label>' +
          '<input class="form-control" id="nl_nombre" placeholder="Ej: PRECIO DISTRIBUIDOR" autofocus style="font-weight:700;"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Descripción</label>' +
          '<input class="form-control" id="nl_desc" placeholder="Para quién aplica esta lista..."/></div>' +
        '<div class="form-group"><label class="form-label">Descuento Global (%)</label>' +
          '<input class="form-control" id="nl_dcto" type="number" min="0" max="100" value="0" style="font-size:20px;text-align:center;font-weight:900;"/></div>' +
        '<div class="form-group"><label class="form-label">Color de Identificación</label>' +
          '<input class="form-control" id="nl_color" type="color" value="#2563eb" style="height:42px;cursor:pointer;"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Ícono</label>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;" id="iconPicker">' +
            iconos.map(function(ic){
              return '<div onclick="document.querySelectorAll(\'[data-icon]\').forEach(function(e){e.style.border=\'1.5px solid var(--gray-200)\';e.style.background=\'white\'});this.style.border=\'2px solid var(--accent)\';this.style.background=\'#eff6ff\';document.getElementById(\'nl_icon\').value=\''+ic+'\'" ' +
                'data-icon="'+ic+'" style="width:42px;height:42px;border-radius:10px;border:1.5px solid var(--gray-200);background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:var(--gray-600);transition:all 0.15s;">' +
                '<i class="fas '+ic+'"></i></div>';
            }).join('') +
          '</div>' +
          '<input type="hidden" id="nl_icon" value="fa-tags"/>' +
        '</div>' +
      '</div>',
      [{text:'💾 Crear Lista',cls:'btn-primary',cb:function(){
        var nombre=(document.getElementById('nl_nombre')?.value||'').trim().toUpperCase();
        if(!nombre){App.toast('El nombre es obligatorio','error');return;}
        PreciosModule.listas.push({
          id:PreciosModule.listas.length+1, nombre,
          descripcion:document.getElementById('nl_desc')?.value||'',
          descuento:parseFloat(document.getElementById('nl_dcto')?.value)||0,
          color:document.getElementById('nl_color')?.value||'#2563eb',
          icon:document.getElementById('nl_icon')?.value||'fa-tags',
          activa:true
        });
        App.toast('✅ Lista "'+nombre+'" creada','success');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='500px';
  },

  // ──────────────────────────────────────────────────────
  // EDITAR LISTA
  // ──────────────────────────────────────────────────────
  editarLista(id) {
    var l = this.listas.find(function(x){return x.id===id;});
    if (!l) return;
    App.showModal('✏️ Editar — '+l.nombre,
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre *</label>' +
          '<input class="form-control" id="el_nombre" value="'+l.nombre+'" style="font-weight:700;"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Descripción</label>' +
          '<input class="form-control" id="el_desc" value="'+l.descripcion+'"/></div>' +
        '<div class="form-group"><label class="form-label">Descuento Global (%)</label>' +
          '<input class="form-control" id="el_dcto" type="number" min="0" max="100" value="'+l.descuento+'" style="font-size:20px;text-align:center;font-weight:900;"/></div>' +
        '<div class="form-group"><label class="form-label">Color</label>' +
          '<input class="form-control" id="el_color" type="color" value="'+l.color+'" style="height:42px;cursor:pointer;"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Estado</label>' +
          '<div style="display:flex;gap:10px;">' +
            '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;border:2px solid '+(l.activa?'#16a34a':'var(--gray-200)')+';border-radius:10px;background:'+(l.activa?'#f0fdf4':'white')+'" id="lblActiva">' +
              '<input type="radio" name="el_estado" value="true" '+(l.activa?'checked':'')+' onchange="document.getElementById(\'lblActiva\').style.borderColor=\'#16a34a\';document.getElementById(\'lblActiva\').style.background=\'#f0fdf4\';document.getElementById(\'lblInactiva\').style.borderColor=\'var(--gray-200)\';document.getElementById(\'lblInactiva\').style.background=\'white\'"/>' +
              '<i class="fas fa-check-circle" style="color:#16a34a;"></i> Activa</label>' +
            '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;border:2px solid '+(!l.activa?'#dc2626':'var(--gray-200)')+';border-radius:10px;background:'+(!l.activa?'#fef2f2':'white')+'" id="lblInactiva">' +
              '<input type="radio" name="el_estado" value="false" '+(!l.activa?'checked':'')+' onchange="document.getElementById(\'lblInactiva\').style.borderColor=\'#dc2626\';document.getElementById(\'lblInactiva\').style.background=\'#fef2f2\';document.getElementById(\'lblActiva\').style.borderColor=\'var(--gray-200)\';document.getElementById(\'lblActiva\').style.background=\'white\'"/>' +
              '<i class="fas fa-ban" style="color:#dc2626;"></i> Inactiva</label>' +
          '</div>' +
        '</div>' +
      '</div>',
      [
        {text:'💾 Guardar',cls:'btn-primary',cb:function(){
          var i=PreciosModule.listas.findIndex(function(x){return x.id===id;});
          PreciosModule.listas[i].nombre  =(document.getElementById('el_nombre')?.value||l.nombre).trim().toUpperCase();
          PreciosModule.listas[i].descripcion=document.getElementById('el_desc')?.value||'';
          PreciosModule.listas[i].descuento=parseFloat(document.getElementById('el_dcto')?.value)||0;
          PreciosModule.listas[i].color   =document.getElementById('el_color')?.value||l.color;
          PreciosModule.listas[i].activa  =document.querySelector('input[name="el_estado"]:checked')?.value==='true';
          App.toast('✅ Lista actualizada','success'); App.closeModal(); App.renderPage();
        }},
        {text:'🗑️ Eliminar Lista',cls:'btn-danger',cb:function(){
          if(PreciosModule.listas.length<=1){App.toast('Debe quedar al menos una lista','error');return;}
          App.showModal('⚠️ Eliminar "'+l.nombre+'"',
            '<div style="text-align:center;padding:10px;"><i class="fas fa-trash" style="font-size:36px;color:#dc2626;display:block;margin-bottom:12px;"></i><div style="font-size:14px;font-weight:700;margin-bottom:6px;">¿Eliminar esta lista?</div><div style="font-size:12px;color:var(--gray-500);">Se perderán todos los precios especiales configurados.</div></div>',
            [{text:'🗑️ Sí, eliminar',cls:'btn-danger',cb:function(){
              var i=PreciosModule.listas.findIndex(function(x){return x.id===id;});
              PreciosModule.listas.splice(i,1);
              PreciosModule.selectedLista=PreciosModule.listas[0].id;
              if(DB.preciosCustom&&DB.preciosCustom[id]) delete DB.preciosCustom[id];
              App.toast('Lista eliminada','warning'); App.closeModal(); App.renderPage();
            }}]
          );
          document.getElementById('modalBox').style.maxWidth='380px';
        }}
      ]
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  // ──────────────────────────────────────────────────────
  // DESCUENTO MASIVO
  // ──────────────────────────────────────────────────────
  aplicarDescuentoMasivo() {
    var self = this;
    var lista = this.listas.find(function(l){return l.id===self.selectedLista;});
    var categorias = ['TODAS'].concat([...new Set((DB.productos||[]).map(function(p){return p.categoria;}))].sort());
    var pcts = [5,10,15,20,25,30,40,50];

    App.showModal('💰 Descuento Masivo — '+lista.nombre,
      '<div style="background:'+lista.color+'18;border-radius:12px;padding:14px;margin-bottom:16px;border:1.5px solid '+lista.color+'44;">' +
        '<div style="font-size:12px;font-weight:800;color:'+lista.color+';margin-bottom:4px;"><i class="fas fa-info-circle" style="margin-right:6px;"></i>APLICACIÓN MASIVA DE PRECIOS</div>' +
        '<div style="font-size:11px;color:var(--gray-600);">Establece un precio especial para múltiples productos. Se calculará como porcentaje del precio base.</div>' +
      '</div>' +
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Tipo de descuento</label>' +
          '<div style="display:flex;gap:8px;">' +
            '<label style="flex:1;cursor:pointer;"><input type="radio" name="dctoTipo" value="pct" checked id="dTipoPct" style="margin-right:6px;"/>Porcentaje (%)</label>' +
            '<label style="flex:1;cursor:pointer;"><input type="radio" name="dctoTipo" value="fijo" id="dTipoFijo" style="margin-right:6px;"/>Monto fijo (S/)</label>' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Valor *</label>' +
          '<input class="form-control" id="dctoValor" type="number" step="0.01" min="0" value="10" style="font-size:22px;text-align:center;font-weight:900;"/>' +
          '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">' +
            pcts.map(function(p){return '<button onclick="document.getElementById(\'dctoValor\').value='+p+'" style="padding:4px 8px;background:#eff6ff;color:var(--accent);border:1px solid #93c5fd;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">'+p+'%</button>';}).join('')+
          '</div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Aplicar a categoría</label>' +
          '<select class="form-control" id="dctoCat">' +
            categorias.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('')+
          '</select>' +
        '</div>' +
        '<div class="form-group" style="grid-column:1/-1">' +
          '<div style="background:#fffbeb;border-radius:8px;padding:12px;border:1px solid #fde68a;font-size:12px;color:#92400e;">' +
            '<i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>Esto <strong>sobreescribirá</strong> los precios especiales existentes para los productos seleccionados.' +
          '</div>' +
        '</div>' +
      '</div>',
      [{text:'✅ Aplicar',cls:'btn-primary',cb:function(){
        var tipo=document.querySelector('input[name="dctoTipo"]:checked')?.value||'pct';
        var valor=parseFloat(document.getElementById('dctoValor')?.value)||0;
        var cat=document.getElementById('dctoCat')?.value||'TODAS';
        if(valor<=0){App.toast('Ingresa un valor válido','error');return;}
        var prods=(DB.productos||[]).filter(function(p){return cat==='TODAS'||p.categoria===cat;});
        if(!DB.preciosCustom) DB.preciosCustom={};
        if(!DB.preciosCustom[self.selectedLista]) DB.preciosCustom[self.selectedLista]={};
        prods.forEach(function(p){
          var precio=tipo==='pct'?(p.precio_venta*(1-valor/100)):(p.precio_venta-valor);
          if(precio>0) DB.preciosCustom[self.selectedLista][p.id]=parseFloat(precio.toFixed(2));
        });
        App.toast('✅ Precio especial aplicado a '+prods.length+' productos','success');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='460px';
  },

  // ──────────────────────────────────────────────────────
  // VER HISTORIAL (simulado)
  // ──────────────────────────────────────────────────────
  verHistorial(prodId) {
    var p = (DB.productos||[]).find(function(x){return x.id===prodId;});
    if (!p) return;
    var self = this;
    var html = '<div style="margin-bottom:12px;padding:12px;background:var(--gray-50);border-radius:10px;">' +
      '<div style="font-size:14px;font-weight:800;">'+p.nombre+'</div>' +
      '<div style="font-size:11px;color:var(--gray-400);">'+p.codigo+' · Precio base: S/ '+p.precio_venta.toFixed(2)+'</div>' +
    '</div>' +
    '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:10px;">Precios por Lista</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      this.listas.map(function(l){
        var custom = DB.preciosCustom && DB.preciosCustom[l.id] ? DB.preciosCustom[l.id][prodId] : null;
        var pFinal = custom || (p.precio_venta * (1 - l.descuento/100));
        var ahorro = p.precio_venta - pFinal;
        return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:white;border-radius:10px;border:1.5px solid '+(custom?l.color:'var(--gray-200)')+'">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:'+l.color+'18;color:'+l.color+';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas '+l.icon+'"></i></div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:12px;font-weight:700;">'+l.nombre+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+(custom?'Precio especial configurado':(l.descuento>0?'-'+l.descuento+'% sobre base':'Precio base sin descuento'))+'</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:16px;font-weight:900;color:'+l.color+';">S/ '+pFinal.toFixed(2)+'</div>' +
            (ahorro>0 ? '<div style="font-size:10px;color:#16a34a;">Ahorra S/ '+ahorro.toFixed(2)+'</div>' : '') +
          '</div>' +
          (custom ?
            '<button onclick="PreciosModule.clearCustom('+l.id+','+prodId+');App.closeModal();App.renderPage();" ' +
              'style="width:28px;height:28px;border-radius:6px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:11px;">' +
              '<i class="fas fa-undo"></i></button>' : '') +
        '</div>';
      }).join('') +
    '</div>';

    App.showModal('📋 Precios — '+p.nombre, html, []);
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  // ──────────────────────────────────────────────────────
  // PRECIOS ESPECIALES
  // ──────────────────────────────────────────────────────
  setCustom(listaId, prodId, val) {
    if (!DB.preciosCustom) DB.preciosCustom = {};
    if (!DB.preciosCustom[listaId]) DB.preciosCustom[listaId] = {};
    var v = parseFloat(val);
    if (v > 0) { DB.preciosCustom[listaId][prodId] = v; }
    else { delete DB.preciosCustom[listaId][prodId]; }
    Storage.guardarEmpresa && null; // señal silenciosa
  },

  clearCustom(listaId, prodId) {
    if (DB.preciosCustom && DB.preciosCustom[listaId]) {
      delete DB.preciosCustom[listaId][prodId];
      App.renderPage();
      App.toast('Precio especial eliminado','warning');
    }
  },

  // ──────────────────────────────────────────────────────
  // EXPORTAR CSV
  // ──────────────────────────────────────────────────────
  exportarLista() {
    var self = this;
    var lista = this.listas.find(function(l){return l.id===self.selectedLista;});
    var prods = DB.productos||[];
    var header = ['Código','Producto','Categoría','Stock','P. Base','Descuento %','P. Final','Precio Especial'];
    var filas  = prods.map(function(p){
      var custom = DB.preciosCustom && DB.preciosCustom[lista.id] ? DB.preciosCustom[lista.id][p.id] : null;
      var pFinal = custom || (p.precio_venta * (1 - lista.descuento/100));
      return [p.codigo,'"'+p.nombre+'"',p.categoria,p.stock||0,p.precio_venta.toFixed(2),lista.descuento,pFinal.toFixed(2),custom?custom.toFixed(2):''].join(',');
    });
    var csv  = '\uFEFF' + [header.join(',')].concat(filas).join('\n');
    var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'lista_precios_'+lista.nombre.replace(/\s/g,'_')+'_'+new Date().toISOString().split('T')[0]+'.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast('✅ CSV exportado: '+prods.length+' productos','success');
  },

  exportar() { this.exportarLista(); },

  _updateTabla() {
    var self = this;
    var lista = this.listas.find(function(l){return l.id===self.selectedLista;}) || this.listas[0];
    var filtrados = (DB.productos||[]).filter(function(p){
      var matchCat  = self.searchCategoria==='todas' || p.categoria===self.searchCategoria;
      var matchProd = !self.searchProducto ||
        (p.nombre||'').toLowerCase().includes(self.searchProducto.toLowerCase()) ||
        (p.codigo||'').toLowerCase().includes(self.searchProducto.toLowerCase());
      return matchCat && matchProd;
    });
    var totalPages = Math.max(1, Math.ceil(filtrados.length / this._porPagina));
    if (this.currentPage > totalPages) this.currentPage = 1;
    var paginados  = filtrados.slice((this.currentPage-1)*this._porPagina, this.currentPage*this._porPagina);
    var cont = document.getElementById('preciosContent');
    if (cont) {
      cont.innerHTML =
        (this._vistaComparacion ? this._buildTablaComparativa(paginados, lista) : this._buildTabla(paginados, lista)) +
        this._buildPaginacion(this.currentPage, totalPages, filtrados.length);
    }
  },
  
};

// ============================================================
// MÓDULO: CUENTA CORRIENTE (Créditos)
// ============================================================

if (!DB.cuentasCorriente) DB.cuentasCorriente = [
  { id:1, cliente_id:12, fecha:'2026-03-10', tipo:'CREDITO', concepto:'Venta al crédito BV03-00000230', monto:150.00, saldo:150.00, pagado:0,      vencimiento:'2026-04-10', estado:'PENDIENTE' },
  { id:2, cliente_id:13, fecha:'2026-03-15', tipo:'CREDITO', concepto:'Venta al crédito BV03-00000231', monto:85.00,  saldo:50.00,  pagado:35.00,  vencimiento:'2026-04-15', estado:'PARCIAL'   },
  { id:3, cliente_id:4,  fecha:'2026-03-20', tipo:'CREDITO', concepto:'Venta al crédito BV03-00000232', monto:200.00, saldo:0,      pagado:200.00, vencimiento:'2026-04-20', estado:'PAGADO'    },
];

const CuentaCorrienteModule = {
  filtroEstado: 'todos',

  render() {
    App.setTabs2('Cuenta Corriente','CRÉDITOS');
    var cuentas    = this.getFiltradas();
    var hoyStr     = new Date().toISOString().split('T')[0];
    var totalDeuda = DB.cuentasCorriente.filter(function(c){return c.estado!=='PAGADO';}).reduce(function(s,c){return s+c.saldo;},0);
    var porVencer  = DB.cuentasCorriente.filter(function(c){var d=new Date(c.vencimiento),h=new Date();var diff=(d-h)/(1000*60*60*24);return c.estado!=='PAGADO'&&diff<=7&&diff>=0;}).length;
    var vencidas   = DB.cuentasCorriente.filter(function(c){return c.estado!=='PAGADO'&&new Date(c.vencimiento)<new Date();}).length;
    var pagadas    = DB.cuentasCorriente.filter(function(c){return c.estado==='PAGADO';}).length;

    var kpis = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">' +
      [
        {v:'S/ '+totalDeuda.toFixed(2), l:'Deuda Total',        c:'#dc2626', bg:'#fef2f2', i:'fa-hand-holding-usd'},
        {v:porVencer,                   l:'Por Vencer (7 días)', c:'#d97706', bg:'#fffbeb', i:'fa-clock'},
        {v:vencidas,                    l:'Cuentas Vencidas',    c:'#dc2626', bg:'#fef2f2', i:'fa-exclamation-circle'},
        {v:pagadas,                     l:'Pagadas',             c:'#16a34a', bg:'#f0fdf4', i:'fa-check-circle'},
      ].map(function(k){
        return '<div class="stat-card" style="border-left:3px solid '+k.c+';">' +
          '<div class="stat-icon" style="background:'+k.bg+';color:'+k.c+'"><i class="fas '+k.i+'"></i></div>' +
          '<div class="stat-info"><div class="stat-value" style="color:'+k.c+';">'+k.v+'</div><div class="stat-label">'+k.l+'</div></div>' +
        '</div>';
      }).join('')+'</div>';

    var tabs = ['todos','PENDIENTE','PARCIAL','PAGADO','VENCIDO'].map(function(e){
      var cnt = e==='todos' ? DB.cuentasCorriente.length :
                e==='VENCIDO' ? vencidas :
                DB.cuentasCorriente.filter(function(c){return c.estado===e;}).length;
      var act = CuentaCorrienteModule.filtroEstado===e;
      return '<button onclick="CuentaCorrienteModule.filtroEstado=\''+e+'\';App.renderPage()" ' +
        'style="padding:8px 16px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;background:'+(act?'var(--accent)':'transparent')+';color:'+(act?'white':'var(--gray-500)')+'">' +
        (e==='todos'?'Todos':e)+' <span style="background:'+(act?'rgba(255,255,255,0.25)':'var(--gray-200)')+';color:'+(act?'white':'var(--gray-600)')+';padding:1px 6px;border-radius:10px;font-size:10px;">'+cnt+'</span></button>';
    }).join('');

    var filas = cuentas.length===0 ?
      '<tr><td colspan="9" style="text-align:center;padding:48px;color:var(--gray-400);"><i class="fas fa-hand-holding-usd" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i><div style="font-size:14px;font-weight:700;">Sin registros</div></td></tr>' :
      cuentas.map(function(c){
        var cli  = (DB.clientes||[]).find(function(x){return x.id===c.cliente_id;});
        var venc = new Date(c.vencimiento) < new Date() && c.estado!=='PAGADO';
        var pct  = c.monto > 0 ? (c.pagado/c.monto*100) : 0;
        return '<tr onmouseover="this.style.background=\''+(venc?'#fff5f5':'var(--gray-50)')+'\'" onmouseout="this.style.background=\''+(venc?'#fff5f5':'white')+'\'" style="background:'+(venc?'#fff9f9':'white')+'">' +
          '<td style="padding:11px 16px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:34px;height:34px;border-radius:9px;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0;">'+(cli?cli.nombre[0].toUpperCase():'?')+'</div>' +
              '<div><div style="font-size:13px;font-weight:700;">'+(cli?cli.nombre.substring(0,25):'N/A')+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div></div>' +
            '</div>' +
          '</td>' +
          '<td style="padding:11px 8px;font-size:12px;color:var(--gray-500);">'+c.fecha+'</td>' +
          '<td style="padding:11px 8px;font-size:12px;color:var(--gray-600);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+c.concepto+'</td>' +
          '<td style="padding:11px 8px;font-size:13px;font-weight:800;">S/ '+c.monto.toFixed(2)+'</td>' +
          '<td style="padding:11px 8px;">' +
            '<div style="font-size:12px;font-weight:700;color:#16a34a;margin-bottom:3px;">S/ '+c.pagado.toFixed(2)+'</div>' +
            '<div style="height:4px;background:var(--gray-200);border-radius:2px;width:60px;"><div style="height:100%;width:'+pct.toFixed(0)+'%;background:#16a34a;border-radius:2px;"></div></div>' +
          '</td>' +
          '<td style="padding:11px 8px;font-size:14px;font-weight:900;color:#dc2626;">S/ '+c.saldo.toFixed(2)+'</td>' +
          '<td style="padding:11px 8px;"><span style="font-size:12px;font-weight:700;color:'+(venc?'#dc2626':'var(--gray-600)')+';">'+(venc?'⚠️ ':'')+c.vencimiento+'</span></td>' +
          '<td style="padding:11px 8px;">'+CuentaCorrienteModule.estadoBadge(c.estado,venc)+'</td>' +
          '<td style="padding:11px 16px;">' +
            '<div style="display:flex;gap:5px;">' +
              (c.estado!=='PAGADO' ?
                '<button onclick="CuentaCorrienteModule.registrarPago('+c.id+')" title="Registrar pago" style="padding:5px 10px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fas fa-dollar-sign" style="margin-right:3px;"></i>Pagar</button>' : '') +
              '<button onclick="CuentaCorrienteModule.whatsapp('+c.id+')" title="Enviar recordatorio WhatsApp" style="width:28px;height:28px;border-radius:6px;border:none;background:#f0fdf4;color:#25D366;cursor:pointer;font-size:12px;"><i class="fab fa-whatsapp"></i></button>' +
              '<button onclick="CuentaCorrienteModule.verDetalle('+c.id+')" title="Ver detalle" style="width:28px;height:28px;border-radius:6px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:12px;"><i class="fas fa-eye"></i></button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');

    return '<div class="page-header"><div>' +
      '<h2 class="page-title"><i class="fas fa-hand-holding-usd" style="color:var(--accent);margin-right:8px;"></i>Cuenta Corriente</h2>' +
      '<p class="text-muted text-sm">Gestión de créditos y cobros pendientes</p>' +
    '</div><div class="page-actions">' +
      '<button class="btn btn-primary" onclick="CuentaCorrienteModule.nuevo()"><i class="fas fa-plus"></i> Nuevo Crédito</button>' +
    '</div></div>' +
    kpis +
    '<div class="card">' +
      '<div style="padding:12px 16px;border-bottom:1px solid var(--gray-200);display:flex;gap:4px;background:var(--gray-50);border-radius:12px 12px 0 0;">'+tabs+'</div>' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cliente</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Fecha</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Concepto</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Monto</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Pagado</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:#dc2626;text-transform:uppercase;">Saldo</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Vencimiento</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
            '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
          '</tr></thead>' +
          '<tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  },

  estadoBadge(estado, vencida) {
    if (vencida) return '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:#fef2f2;color:#dc2626;">⚠ VENCIDA</span>';
    var map = {
      PENDIENTE:'background:#fffbeb;color:#d97706',
      PARCIAL:  'background:#eff6ff;color:#2563eb',
      PAGADO:   'background:#f0fdf4;color:#16a34a',
    };
    return '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;'+(map[estado]||'background:var(--gray-100);color:var(--gray-600)')+';">'+estado+'</span>';
  },

  getFiltradas() {
    return DB.cuentasCorriente.filter(function(c){
      if (CuentaCorrienteModule.filtroEstado==='todos') return true;
      if (CuentaCorrienteModule.filtroEstado==='VENCIDO') return new Date(c.vencimiento)<new Date()&&c.estado!=='PAGADO';
      return c.estado===CuentaCorrienteModule.filtroEstado;
    });
  },

  verDetalle(id) {
    var cc  = DB.cuentasCorriente.find(function(x){return x.id===id;});
    var cli = (DB.clientes||[]).find(function(x){return x.id===cc.cliente_id;});
    var pct = cc.monto>0?(cc.pagado/cc.monto*100):0;
    var venc= new Date(cc.vencimiento)<new Date()&&cc.estado!=='PAGADO';

    App.showModal('📋 Detalle de Crédito',
      '<div style="background:var(--gray-50);border-radius:12px;padding:16px;margin-bottom:14px;">' +
        '<div style="font-size:15px;font-weight:800;margin-bottom:4px;">'+(cli?cli.nombre:'N/A')+'</div>' +
        '<div style="font-size:12px;color:var(--gray-400);">'+(cli?cli.tipo+': '+cli.doc:'')+'</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">' +
        '<div style="padding:12px;background:var(--gray-50);border-radius:10px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Monto Total</div><div style="font-size:20px;font-weight:900;">S/ '+cc.monto.toFixed(2)+'</div></div>' +
        '<div style="padding:12px;background:#fef2f2;border-radius:10px;"><div style="font-size:10px;font-weight:800;color:#dc2626;text-transform:uppercase;margin-bottom:3px;">Saldo Pendiente</div><div style="font-size:20px;font-weight:900;color:#dc2626;">S/ '+cc.saldo.toFixed(2)+'</div></div>' +
        '<div style="padding:12px;background:#f0fdf4;border-radius:10px;"><div style="font-size:10px;font-weight:800;color:#16a34a;text-transform:uppercase;margin-bottom:3px;">Ya Pagado</div><div style="font-size:20px;font-weight:900;color:#16a34a;">S/ '+cc.pagado.toFixed(2)+'</div></div>' +
        '<div style="padding:12px;background:'+(venc?'#fef2f2':'var(--gray-50)')+';border-radius:10px;"><div style="font-size:10px;font-weight:800;color:'+(venc?'#dc2626':'var(--gray-400)')+';text-transform:uppercase;margin-bottom:3px;">Vencimiento</div><div style="font-size:14px;font-weight:700;color:'+(venc?'#dc2626':'var(--gray-800)')+';">'+(venc?'⚠️ ':'')+cc.vencimiento+'</div></div>' +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;"><span>Progreso de pago</span><span style="font-weight:700;">'+pct.toFixed(0)+'%</span></div>' +
        '<div style="height:10px;background:var(--gray-200);border-radius:5px;overflow:hidden;"><div style="height:100%;width:'+pct.toFixed(0)+'%;background:linear-gradient(90deg,#16a34a,#4ade80);border-radius:5px;transition:width 0.5s;"></div></div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--gray-600);"><b>Concepto:</b> '+cc.concepto+'</div>',
      [
        (cc.estado!=='PAGADO' ? {text:'💵 Registrar Pago',cls:'btn-success',cb:function(){App.closeModal();CuentaCorrienteModule.registrarPago(id);}} : null),
        {text:'📱 WhatsApp',cls:'btn-outline',cb:function(){CuentaCorrienteModule.whatsapp(id);}},
      ].filter(Boolean)
    );
    document.getElementById('modalBox').style.maxWidth='460px';
  },

  nuevo() {
    var hoy30 = new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0];
    App.showModal('➕ Nuevo Crédito',
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Cliente *</label>' +
          '<select class="form-control" id="cc_cli">' +
            (DB.clientes||[]).filter(function(c){return c.tipo_cliente==='cliente';}).map(function(c){
              return '<option value="'+c.id+'">'+c.nombre+' ('+c.tipo+': '+c.doc+')</option>';
            }).join('')+
          '</select></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Concepto *</label>' +
          '<input class="form-control" id="cc_concepto" placeholder="Ej: Venta al crédito..."/></div>' +
        '<div class="form-group"><label class="form-label">Monto (S/) *</label>' +
          '<input class="form-control" id="cc_monto" type="number" step="0.01" min="0.01" placeholder="0.00" style="font-size:20px;text-align:center;font-weight:900;"/></div>' +
        '<div class="form-group"><label class="form-label">Fecha Vencimiento *</label>' +
          '<input class="form-control" id="cc_venc" type="date" value="'+hoy30+'"/></div>' +
      '</div>',
      [{text:'💾 Registrar Crédito',cls:'btn-primary',cb:function(){
        var monto=parseFloat(document.getElementById('cc_monto')?.value)||0;
        var concepto=(document.getElementById('cc_concepto')?.value||'').trim();
        if(!concepto||!monto){App.toast('Complete los campos obligatorios','error');return;}
        DB.cuentasCorriente.push({
          id:DB.cuentasCorriente.length+1,
          cliente_id:parseInt(document.getElementById('cc_cli')?.value),
          fecha:new Date().toISOString().split('T')[0],
          tipo:'CREDITO', concepto, monto, saldo:monto, pagado:0,
          vencimiento:document.getElementById('cc_venc')?.value, estado:'PENDIENTE'
        });
        App.toast('✅ Crédito registrado correctamente','success');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='460px';
  },

  registrarPago(id) {
    var cc  = DB.cuentasCorriente.find(function(x){return x.id===id;});
    var cli = (DB.clientes||[]).find(function(x){return x.id===cc.cliente_id;});
    App.showModal('💵 Registrar Pago — '+(cli?cli.nombre:''),
      '<div style="background:var(--gray-50);border-radius:12px;padding:14px;margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:var(--gray-500);">Total:</span><span style="font-weight:700;">S/ '+cc.monto.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:var(--gray-500);">Ya pagado:</span><span style="font-weight:700;color:#16a34a;">S/ '+cc.pagado.toFixed(2)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:14px;font-weight:700;">Saldo pendiente:</span><span style="font-size:22px;font-weight:900;color:#dc2626;">S/ '+cc.saldo.toFixed(2)+'</span></div>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:12px;"><label class="form-label">Monto a Pagar (S/) *</label>' +
        '<input class="form-control" id="pago_monto" type="number" step="0.01" value="'+cc.saldo.toFixed(2)+'" autofocus style="font-size:24px;text-align:center;font-weight:900;"/></div>' +
      '<div class="form-group"><label class="form-label">Método de Pago</label>' +
        '<select class="form-control" id="pago_metodo">' +
          ['EFECTIVO','TARJETA','YAPE/PLIN','TRANSFERENCIA'].map(function(m){return '<option>'+m+'</option>';}).join('')+
        '</select></div>',
      [{text:'✅ Registrar Pago',cls:'btn-success',cb:function(){
        var pago=parseFloat(document.getElementById('pago_monto')?.value)||0;
        if(pago<=0||pago>cc.saldo+0.005){App.toast('Monto inválido','error');return;}
        var i=DB.cuentasCorriente.findIndex(function(x){return x.id===id;});
        DB.cuentasCorriente[i].pagado+=pago;
        DB.cuentasCorriente[i].saldo=Math.max(0,cc.saldo-pago);
        DB.cuentasCorriente[i].estado=DB.cuentasCorriente[i].saldo<0.01?'PAGADO':'PARCIAL';
        App.toast('✅ Pago de S/ '+pago.toFixed(2)+' registrado','success');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='400px';
  },

  whatsapp(id) {
    var cc  = DB.cuentasCorriente.find(function(x){return x.id===id;});
    var cli = (DB.clientes||[]).find(function(x){return x.id===cc.cliente_id;});
    var msg = encodeURIComponent(
      '🏪 *'+DB.empresa.nombre+'*\n\n' +
      'Estimado/a *'+( cli?cli.nombre:'cliente')+'*, le recordamos que tiene una cuenta pendiente:\n\n' +
      '📄 Concepto: '+cc.concepto+'\n' +
      '💰 Monto total: S/ '+cc.monto.toFixed(2)+'\n' +
      '✅ Pagado: S/ '+cc.pagado.toFixed(2)+'\n' +
      '⚠️ *Saldo pendiente: S/ '+cc.saldo.toFixed(2)+'*\n' +
      '📅 Vencimiento: '+cc.vencimiento+'\n\n' +
      'Por favor comuníquese con nosotros para regularizar su pago.\n' +
      (DB.empresa.telefono?'📞 '+DB.empresa.telefono:'')
    );
    if (cli && cli.telefono) {
      window.open('https://wa.me/51'+cli.telefono.replace(/\D/g,'')+'?text='+msg,'_blank');
    } else {
      window.open('https://wa.me/?text='+msg,'_blank');
      App.toast('El cliente no tiene teléfono, abriendo WhatsApp Web','info');
    }
  },
};