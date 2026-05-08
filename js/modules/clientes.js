// ============================================================
// MÓDULO: CLIENTES / PROVEEDORES — Versión Profesional
// ============================================================

const ClientesModule = {

  // ── Estado ──
  _filtro:      'cliente',
  _busqueda:    '',
  _pagina:      1,
  _porPagina:   10,
  _vistaTabla:  true,

  // ── Helpers ──
  _fechaHoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  _mesActual() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  },
  _iniciales(nombre) {
    var partes = (nombre || '').trim().split(' ').filter(Boolean);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return (nombre || '?')[0].toUpperCase();
  },
  _colorAvatar(nombre) {
    var colores = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#dc2626','#d97706'];
    var idx = (nombre || '').charCodeAt(0) % colores.length;
    return colores[idx];
  },
  _getClientes() {
    return DB.clientes || [];
  },
  _filtrados() {
    var q = this._busqueda.toLowerCase();
    return this._getClientes().filter(function(c) {
      var matchFiltro = ClientesModule._filtro === 'todos' || c.tipo_cliente === ClientesModule._filtro;
      var matchBusq   = !q || (c.nombre||'').toLowerCase().includes(q) ||
                        (c.doc||'').includes(q) ||
                        (c.telefono||'').includes(q) ||
                        (c.email||'').toLowerCase().includes(q);
      return matchFiltro && matchBusq;
    });
  },
  _calcKPIs() {
    var todos      = this._getClientes();
    var clientes   = todos.filter(function(c){ return c.tipo_cliente === 'cliente'; });
    var proveedores= todos.filter(function(c){ return c.tipo_cliente === 'proveedor'; });
    var mes        = this._mesActual();
    var nuevosHoy  = todos.filter(function(c){ return (c.fechaCreacion||'').startsWith(mes); }).length;
    var conVentas  = (DB.ventas||[]).map(function(v){ return v.cliente_id; });
    var activos    = clientes.filter(function(c){ return conVentas.includes(c.id); }).length;
    return { total: todos.length, clientes: clientes.length, proveedores: proveedores.length, nuevosHoy, activos };
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Clientes', 'CLIENTES-PROVEEDORES');
    var kpis      = this._calcKPIs();
    var filtrados = this._filtrados();
    var totalPags = Math.ceil(filtrados.length / this._porPagina) || 1;
    if (this._pagina > totalPags) this._pagina = 1;
    var inicio    = (this._pagina - 1) * this._porPagina;
    var pagina    = filtrados.slice(inicio, inicio + this._porPagina);

    // ── KPIs ──
    var kpiHTML =
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-users"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.total+'</div><div class="stat-label">Total Registros</div></div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-user-check"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.clientes+'</div><div class="stat-label">Clientes</div></div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#fef3c7;color:#d97706;"><i class="fas fa-truck"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.proveedores+'</div><div class="stat-label">Proveedores</div></div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#f5f3ff;color:#7c3aed;"><i class="fas fa-shopping-bag"></i></div>' +
        '<div class="stat-info"><div class="stat-value">'+kpis.activos+'</div><div class="stat-label">Con Compras</div></div>' +
      '</div>' +

      '</div>';

    // ── Toolbar ──
    var toolbar =
      '<div class="card" style="margin-bottom:16px;">' +
        '<div style="padding:14px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +

          // Tabs
          '<div style="display:flex;gap:4px;background:var(--gray-100);padding:4px;border-radius:10px;">' +
            ['cliente','proveedor','todos'].map(function(f) {
              var labels = { cliente:'Clientes', proveedor:'Proveedores', todos:'Todos' };
              var counts = { cliente: kpis.clientes, proveedor: kpis.proveedores, todos: kpis.total };
              var activo = ClientesModule._filtro === f;
              return '<button onclick="ClientesModule._setFiltro(\''+f+'\')" ' +
                'style="padding:6px 14px;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;' +
                'background:'+(activo?'white':'transparent')+';color:'+(activo?'var(--accent)':'var(--gray-500)')+';' +
                'box-shadow:'+(activo?'0 1px 4px rgba(0,0,0,0.1)':'none')+';white-space:nowrap;">' +
                labels[f]+' <span style="background:'+(activo?'var(--accent)':'var(--gray-300)')+';color:'+(activo?'white':'var(--gray-600)')+';font-size:10px;padding:1px 6px;border-radius:10px;margin-left:4px;">'+counts[f]+'</span>' +
              '</button>';
            }).join('') +
          '</div>' +

          // Búsqueda
          '<div style="position:relative;flex:1;min-width:200px;">' +
            '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>' +
            '<input id="clienteBusq" type="text" placeholder="Buscar por nombre, documento, teléfono..." value="'+this._busqueda+'" ' +
              'oninput="ClientesModule._buscar(this.value)" ' +
              'style="width:100%;padding:8px 10px 8px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;"/>' +
          '</div>' +

          // Por página
          '<select onchange="ClientesModule._porPagina=parseInt(this.value);ClientesModule._pagina=1;App.renderPage();" ' +
            'style="padding:8px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;background:white;cursor:pointer;">' +
            [10,25,50].map(function(n){
              return '<option value="'+n+'"'+(ClientesModule._porPagina===n?' selected':'')+'>'+n+' / pág</option>';
            }).join('') +
          '</select>' +

          // Vista
          '<div style="display:flex;gap:2px;">' +
            '<button onclick="ClientesModule._vistaTabla=true;App.renderPage();" title="Vista tabla" ' +
              'style="width:32px;height:32px;border:1.5px solid var(--gray-200);border-radius:6px 0 0 6px;background:'+(this._vistaTabla?'var(--accent)':'white')+';color:'+(this._vistaTabla?'white':'var(--gray-500)')+';cursor:pointer;">' +
              '<i class="fas fa-list"></i></button>' +
            '<button onclick="ClientesModule._vistaTabla=false;App.renderPage();" title="Vista tarjetas" ' +
              'style="width:32px;height:32px;border:1.5px solid var(--gray-200);border-left:none;border-radius:0 6px 6px 0;background:'+(!this._vistaTabla?'var(--accent)':'white')+';color:'+(!this._vistaTabla?'white':'var(--gray-500)')+';cursor:pointer;">' +
              '<i class="fas fa-th-large"></i></button>' +
          '</div>' +

          // Acciones
          '<button onclick="ClientesModule._exportarCSV()" style="background:var(--gray-100);color:var(--gray-700);border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-file-csv" style="margin-right:5px;"></i>Exportar' +
          '</button>' +
          '<button onclick="ClientesModule.nuevo()" style="background:var(--accent);color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-plus" style="margin-right:6px;"></i>Nuevo' +
          '</button>' +

        '</div>' +

        '<div style="padding:0 16px 10px;font-size:12px;color:var(--gray-400);">' +
          'Mostrando <strong>'+(filtrados.length===0?0:inicio+1)+'-'+Math.min(filtrados.length, inicio+this._porPagina)+'</strong> de <strong>'+filtrados.length+'</strong> registros' +
          (this._busqueda ? ' &nbsp;·&nbsp; <a href="#" onclick="ClientesModule._buscar(\'\');return false;" style="color:var(--accent);font-weight:700;">Limpiar</a>' : '') +
        '</div>' +
      '</div>';

    // ── Contenido ──
    var contenido = this._vistaTabla ? this._buildTabla(pagina) : this._buildTarjetas(pagina);

    // ── Paginación ──
    var paginacion = this._buildPaginacion(filtrados.length, totalPags);

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-users" style="color:var(--accent);margin-right:8px;"></i>Clientes / Proveedores</h2>' +
          '<p class="text-muted text-sm">Gestión de clientes y proveedores</p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-outline" onclick="ClientesModule._exportarCSV()"><i class="fas fa-file-csv"></i> Exportar CSV</button>' +
          '<button class="btn btn-primary" onclick="ClientesModule.nuevo()"><i class="fas fa-plus"></i> Nuevo</button>' +
        '</div>' +
      '</div>' +
      kpiHTML + toolbar + contenido + paginacion
    );
  },

  _setFiltro(f)  { this._filtro = f; this._pagina = 1; App.renderPage(); },
  _buscar(v)     { this._busqueda = v; this._pagina = 1; this._renderLista(); },
  _irPagina(n)   {
    var max = Math.ceil(this._filtrados().length / this._porPagina) || 1;
    this._pagina = Math.max(1, Math.min(n, max));
    this._renderLista();
  },

  _renderLista() {
    var filtrados = this._filtrados();
    var totalPags = Math.ceil(filtrados.length / this._porPagina) || 1;
    if (this._pagina > totalPags) this._pagina = 1;
    var inicio   = (this._pagina - 1) * this._porPagina;
    var pagina   = filtrados.slice(inicio, inicio + this._porPagina);
    var cont = document.getElementById('clientesLista');
    var pag  = document.getElementById('clientesPag');
    var info = document.getElementById('clientesInfo');
    if (cont) cont.innerHTML = this._vistaTabla ? this._buildTabla(pagina) : this._buildTarjetas(pagina);
    if (pag)  pag.innerHTML  = this._buildPaginacion(filtrados.length, totalPags);
    if (info) info.innerHTML = 'Mostrando <strong>'+(filtrados.length===0?0:inicio+1)+'-'+Math.min(filtrados.length,inicio+this._porPagina)+'</strong> de <strong>'+filtrados.length+'</strong> registros'+(this._busqueda?' &nbsp;·&nbsp; <a href="#" onclick="ClientesModule._buscar(\'\');return false;" style="color:var(--accent);font-weight:700;">Limpiar</a>':'');
  },

  // ──────────────────────────────────────────────────────
  // VISTA TABLA
  // ──────────────────────────────────────────────────────
  _buildTabla(pagina) {
    var filas = '';
    if (pagina.length === 0) {
      filas = '<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--gray-400);">' +
        '<i class="fas fa-users" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<div style="font-size:14px;font-weight:700;">No se encontraron registros</div>' +
        '</td></tr>';
    } else {
      pagina.forEach(function(c) {
        var color  = ClientesModule._colorAvatar(c.nombre);
        var inic   = ClientesModule._iniciales(c.nombre);
        var esProv = c.tipo_cliente === 'proveedor';
        var ventasCliente = (DB.ventas||[]).filter(function(v){ return v.cliente_id === c.id; });
        var totalCompras  = ventasCliente.reduce(function(s,v){ return s+v.total; }, 0);

        filas +=
          '<tr style="transition:background 0.1s;" onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +

          // Avatar + nombre
          '<td style="padding:12px 16px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:38px;height:38px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
                'font-size:13px;font-weight:900;color:white;background:'+color+';">'+inic+'</div>' +
              '<div>' +
                '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+c.nombre+'</div>' +
                '<div style="font-size:11px;color:var(--gray-400);margin-top:1px;">' +
                  '<i class="fas fa-id-card" style="font-size:10px;margin-right:3px;"></i>'+c.tipo+': '+c.doc+
                '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +

          // Tipo badge
          '<td style="padding:12px 8px;">' +
            '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;' +
              'background:'+(esProv?'#fef3c7':'#eff6ff')+';color:'+(esProv?'#d97706':'#2563eb')+';border:1px solid '+(esProv?'#fde68a':'#93c5fd')+';white-space:nowrap;">' +
              '<i class="fas '+(esProv?'fa-truck':'fa-user')+'" style="margin-right:4px;"></i>'+(esProv?'Proveedor':'Cliente')+
            '</span>' +
          '</td>' +

          // Contacto
          '<td style="padding:12px 8px;">' +
            (c.telefono ? '<div style="font-size:12px;color:var(--gray-700);"><i class="fas fa-phone" style="color:var(--gray-400);margin-right:5px;font-size:10px;"></i>'+c.telefono+'</div>' : '') +
            (c.email    ? '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;"><i class="fas fa-envelope" style="margin-right:5px;font-size:10px;"></i>'+c.email+'</div>' : '') +
            (!c.telefono && !c.email ? '<span style="font-size:12px;color:var(--gray-300);">—</span>' : '') +
          '</td>' +

          // Dirección
          '<td style="padding:12px 8px;font-size:12px;color:var(--gray-500);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
            (c.direccion && c.direccion !== '-/-/-' ? '<i class="fas fa-map-marker-alt" style="color:var(--gray-400);margin-right:5px;font-size:10px;"></i>'+c.direccion : '—') +
          '</td>' +

          // Compras
          '<td style="padding:12px 8px;text-align:right;">' +
            (ventasCliente.length > 0 ?
              '<div style="font-size:13px;font-weight:800;color:#16a34a;">S/ '+totalCompras.toFixed(2)+'</div>' +
              '<div style="font-size:10px;color:var(--gray-400);">'+ventasCliente.length+' compra(s)</div>' :
              '<span style="font-size:12px;color:var(--gray-300);">Sin compras</span>'
            ) +
          '</td>' +

          // Acciones
          '<td style="padding:12px 16px;">' +
            '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
              '<button onclick="ClientesModule.ver('+c.id+')" title="Ver detalle" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:13px;">' +
                '<i class="fas fa-eye"></i></button>' +
              '<button onclick="ClientesModule.editar('+c.id+')" title="Editar" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:13px;">' +
                '<i class="fas fa-edit"></i></button>' +
              '<button onclick="ClientesModule.eliminar('+c.id+')" title="Eliminar" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:13px;">' +
                '<i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</td>' +

          '</tr>';
      });
    }

    return '<div id="clientesLista"><div class="card"><div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
        '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Cliente / Proveedor</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Tipo</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Contacto</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Dirección</th>' +
        '<th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Compras</th>' +
        '<th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.5px;">Acciones</th>' +
      '</tr></thead>' +
      '<tbody>' + filas + '</tbody>' +
      '</table></div></div></div>';
  },

  // ──────────────────────────────────────────────────────
  // VISTA TARJETAS
  // ──────────────────────────────────────────────────────
  _buildTarjetas(pagina) {
    if (pagina.length === 0) {
      return '<div id="clientesLista"><div style="text-align:center;padding:60px;color:var(--gray-400);">' +
        '<i class="fas fa-users" style="font-size:48px;display:block;margin-bottom:16px;opacity:0.2;"></i>' +
        '<div style="font-size:16px;font-weight:700;">No se encontraron registros</div>' +
      '</div></div>';
    }

    var tarjetas = pagina.map(function(c) {
      var color  = ClientesModule._colorAvatar(c.nombre);
      var inic   = ClientesModule._iniciales(c.nombre);
      var esProv = c.tipo_cliente === 'proveedor';
      var ventas = (DB.ventas||[]).filter(function(v){ return v.cliente_id === c.id; });
      var total  = ventas.reduce(function(s,v){ return s+v.total; }, 0);

      return '<div style="background:white;border-radius:14px;border:1.5px solid var(--gray-200);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);transition:all 0.2s;" ' +
        'onmouseover="this.style.boxShadow=\'0 6px 20px rgba(0,0,0,0.1)\';this.style.borderColor=\'var(--accent)\'" ' +
        'onmouseout="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.04)\';this.style.borderColor=\'var(--gray-200)\'">' +

        // Header con color
        '<div style="height:6px;background:'+color+';"></div>' +

        '<div style="padding:16px;">' +
          // Avatar + nombre
          '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">' +
            '<div style="width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
              'font-size:15px;font-weight:900;color:white;background:'+color+';">'+inic+'</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:13px;font-weight:800;color:var(--gray-800);line-height:1.3;margin-bottom:3px;">'+c.nombre+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);">'+c.tipo+': '+c.doc+'</div>' +
              '<span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:800;' +
                'background:'+(esProv?'#fef3c7':'#eff6ff')+';color:'+(esProv?'#d97706':'#2563eb')+';border:1px solid '+(esProv?'#fde68a':'#93c5fd')+'">' +
                (esProv?'PROVEEDOR':'CLIENTE')+'</span>' +
            '</div>' +
          '</div>' +

          // Info
          '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">' +
            (c.telefono ? '<div style="font-size:12px;color:var(--gray-600);display:flex;align-items:center;gap:6px;">' +
              '<i class="fas fa-phone" style="color:var(--gray-400);width:12px;font-size:10px;"></i>'+c.telefono+'</div>' : '') +
            (c.email    ? '<div style="font-size:12px;color:var(--gray-600);display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
              '<i class="fas fa-envelope" style="color:var(--gray-400);width:12px;font-size:10px;"></i>'+c.email+'</div>' : '') +
            (c.direccion && c.direccion !== '-/-/-' ? '<div style="font-size:11px;color:var(--gray-400);display:flex;align-items:flex-start;gap:6px;">' +
              '<i class="fas fa-map-marker-alt" style="color:var(--gray-400);width:12px;font-size:10px;margin-top:1px;"></i><span style="line-height:1.3;">'+c.direccion+'</span></div>' : '') +
          '</div>' +

          // Compras
          (ventas.length > 0 ?
            '<div style="background:var(--gray-50);border-radius:8px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Total compras</div>' +
              '<div>' +
                '<div style="font-size:14px;font-weight:900;color:#16a34a;text-align:right;">S/ '+total.toFixed(2)+'</div>' +
                '<div style="font-size:10px;color:var(--gray-400);text-align:right;">'+ventas.length+' pedido(s)</div>' +
              '</div>' +
            '</div>' : '') +

          // Botones
          '<div style="display:flex;gap:6px;">' +
            '<button onclick="ClientesModule.ver('+c.id+')" style="flex:1;padding:7px;border:1.5px solid #93c5fd;border-radius:8px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-eye" style="margin-right:4px;"></i>Ver</button>' +
            '<button onclick="ClientesModule.editar('+c.id+')" style="flex:1;padding:7px;border:1.5px solid #86efac;border-radius:8px;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-edit" style="margin-right:4px;"></i>Editar</button>' +
            '<button onclick="ClientesModule.eliminar('+c.id+')" style="width:32px;padding:7px;border:1.5px solid #fca5a5;border-radius:8px;background:#fef2f2;color:#dc2626;font-size:12px;cursor:pointer;">' +
              '<i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div id="clientesLista"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">' +
      tarjetas + '</div></div>';
  },

  // ──────────────────────────────────────────────────────
  // PAGINACIÓN
  // ──────────────────────────────────────────────────────
  _buildPaginacion(total, totalPags) {
    if (totalPags <= 1) return '<div id="clientesPag"></div>';
    var inicio = (this._pagina - 1) * this._porPagina;
    var html =
      '<div id="clientesPag" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;margin-top:8px;">' +
        '<div id="clientesInfo" style="font-size:12px;color:var(--gray-400);">'+
          'Mostrando <strong>'+(total===0?0:inicio+1)+'-'+Math.min(total,inicio+this._porPagina)+'</strong> de <strong>'+total+'</strong> registros'+
        '</div>' +
        '<div style="display:flex;gap:5px;">' +
          '<button onclick="ClientesModule._irPagina(1)" '+(this._pagina===1?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">«</button>' +
          '<button onclick="ClientesModule._irPagina('+(this._pagina-1)+')" '+(this._pagina===1?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">‹</button>' +
          (function(){
            var btns = '';
            var desde = Math.max(1, ClientesModule._pagina - 2);
            var hasta = Math.min(totalPags, desde + 4);
            for (var i = desde; i <= hasta; i++) {
              var act = i === ClientesModule._pagina;
              btns += '<button onclick="ClientesModule._irPagina('+i+')" style="padding:5px 9px;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';border-radius:6px;background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-700)')+';cursor:pointer;font-size:12px;font-weight:'+(act?'700':'400')+';">'+i+'</button>';
            }
            return btns;
          })() +
          '<button onclick="ClientesModule._irPagina('+(this._pagina+1)+')" '+(this._pagina===totalPags?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">›</button>' +
          '<button onclick="ClientesModule._irPagina('+totalPags+')" '+(this._pagina===totalPags?'disabled':'')+' style="padding:5px 9px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;font-size:12px;">»</button>' +
        '</div>' +
      '</div>';
    return html;
  },

  // ──────────────────────────────────────────────────────
  // VER DETALLE
  // ──────────────────────────────────────────────────────
  ver(id) {
    var c = this._getClientes().find(function(x){ return x.id === id; });
    if (!c) return;
    var color    = this._colorAvatar(c.nombre);
    var inic     = this._iniciales(c.nombre);
    var esProv   = c.tipo_cliente === 'proveedor';
    var ventas   = (DB.ventas||[]).filter(function(v){ return v.cliente_id === id; })
                    .sort(function(a,b){ return a.fecha > b.fecha ? -1 : 1; });
    var totalComp = ventas.reduce(function(s,v){ return s+v.total; }, 0);

    var ultVentas = ventas.slice(0,5).map(function(v) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100);">' +
        '<div style="flex:1;">' +
          '<div style="font-size:12px;font-weight:700;color:var(--gray-800);">'+v.serie+'-'+v.numero+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">'+v.fecha+' · '+(v.metodo_pago||'')+'</div>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:900;color:#16a34a;">S/ '+v.total.toFixed(2)+'</div>' +
      '</div>';
    }).join('');

    var html =
      // Encabezado
      '<div style="background:linear-gradient(135deg,'+color+'22,'+color+'11);border-radius:14px;padding:20px;margin-bottom:18px;border:1.5px solid '+color+'44;">' +
        '<div style="display:flex;align-items:center;gap:16px;">' +
          '<div style="width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:white;background:'+color+';">'+inic+'</div>' +
          '<div>' +
            '<div style="font-size:18px;font-weight:900;color:var(--gray-800);">'+c.nombre+'</div>' +
            '<div style="font-size:12px;color:var(--gray-500);margin-top:2px;">'+c.tipo+': <strong>'+c.doc+'</strong></div>' +
            '<span style="display:inline-block;margin-top:6px;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:800;' +
              'background:'+(esProv?'#fef3c7':'#eff6ff')+';color:'+(esProv?'#d97706':'#2563eb')+';border:1px solid '+(esProv?'#fde68a':'#93c5fd')+'">' +
              (esProv?'PROVEEDOR':'CLIENTE')+'</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Info de contacto
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        '<div style="padding:12px;background:var(--gray-50);border-radius:10px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-phone" style="margin-right:5px;"></i>Teléfono</div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--gray-800);">'+(c.telefono||'—')+'</div>' +
        '</div>' +
        '<div style="padding:12px;background:var(--gray-50);border-radius:10px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-envelope" style="margin-right:5px;"></i>Email</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--gray-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(c.email||'—')+'</div>' +
        '</div>' +
        '<div style="grid-column:1/-1;padding:12px;background:var(--gray-50);border-radius:10px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-map-marker-alt" style="margin-right:5px;"></i>Dirección</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+(c.direccion && c.direccion !== '-/-/-' ? c.direccion : '—')+'</div>' +
        '</div>' +
      '</div>' +

      // Estadísticas de compras
      (ventas.length > 0 ?
        '<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #86efac;">' +
          '<div style="font-size:11px;font-weight:800;color:#16a34a;text-transform:uppercase;margin-bottom:10px;"><i class="fas fa-shopping-bag" style="margin-right:6px;"></i>Historial de Compras</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div style="text-align:center;"><div style="font-size:22px;font-weight:900;color:#15803d;">'+ventas.length+'</div><div style="font-size:10px;color:#16a34a;">Compra(s)</div></div>' +
            '<div style="text-align:center;"><div style="font-size:22px;font-weight:900;color:#15803d;">S/ '+totalComp.toFixed(2)+'</div><div style="font-size:10px;color:#16a34a;">Total gastado</div></div>' +
          '</div>' +
          (ultVentas ? '<div style="font-size:10px;font-weight:800;color:#16a34a;text-transform:uppercase;margin-bottom:6px;">Últimas compras</div>'+ultVentas : '') +
        '</div>' : '') +

      // Acciones whatsapp si tiene teléfono
      (c.telefono ?
        '<div style="display:flex;gap:8px;">' +
          '<a href="https://wa.me/51'+c.telefono.replace(/\D/g,'')+'" target="_blank" ' +
            'style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;background:#25d366;color:white;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;">' +
            '<i class="fab fa-whatsapp" style="font-size:16px;"></i>WhatsApp</a>' +
        '</div>' : '');

    App.showModal('👤 Detalle del Registro', html, [
      { text:'✏️ Editar', cls:'btn-primary', cb: function(){ App.closeModal(); ClientesModule.editar(id); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '480px';
  },

  // ──────────────────────────────────────────────────────
  // FORMULARIO NUEVO / EDITAR
  // ──────────────────────────────────────────────────────
  nuevo() {
    App.showModal('➕ Nuevo Registro',
      this._formHTML({}),
      [{ text:'💾 Guardar', cls:'btn-primary', cb: function(){ ClientesModule._guardar(); } }]
    );
    document.getElementById('modalBox').style.maxWidth = '520px';
  },

  editar(id) {
    var c = this._getClientes().find(function(x){ return x.id === id; });
    if (!c) return;
    App.showModal('✏️ Editar Registro',
      this._formHTML(c),
      [{ text:'💾 Guardar cambios', cls:'btn-primary', cb: function(){ ClientesModule._guardar(id); } }]
    );
    document.getElementById('modalBox').style.maxWidth = '520px';
  },

  _formHTML(c) {
    return (
      '<div class="form-grid">' +

      // Tipo + Documento
      '<div class="form-group">' +
        '<label class="form-label">Tipo Documento <span style="color:red;">*</span></label>' +
        '<select class="form-control" id="f_tipo" onchange="ClientesModule._onTipoChange()">' +
          '<option value="DNI"'+(c.tipo==='DNI'?' selected':'')+'>DNI</option>' +
          '<option value="RUC"'+(c.tipo==='RUC'?' selected':'')+'>RUC</option>' +
          '<option value="CE"'+(c.tipo==='CE'?' selected':'')+'>CE</option>' +
          '<option value="PASAPORTE"'+(c.tipo==='PASAPORTE'?' selected':'')+'>Pasaporte</option>' +
        '</select>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label">N° Documento <span style="color:red;">*</span></label>' +
        '<div style="display:flex;gap:6px;">' +
          '<input class="form-control" id="f_doc" type="text" style="flex:1;" ' +
            'placeholder="Ingresa el documento" value="'+(c.doc||'')+'" ' +
            'oninput="ClientesModule._onDocInput(this.value)"/>' +
          '<button onclick="ClientesModule._consultarAPI()" id="btn_buscar_doc" ' +
            'style="padding:0 12px;background:var(--accent);border:none;border-radius:8px;color:white;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">' +
            '<i class="fas fa-search"></i> Buscar</button>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--gray-400);margin-top:4px;"><i class="fas fa-bolt" style="color:var(--accent);"></i> Auto-búsqueda SUNAT/RENIEC al completar dígitos</div>' +
      '</div>' +

      // Resultado API
      '<div id="resultado_api" style="grid-column:1/-1;display:none;"></div>' +

      // Nombre
      '<div class="form-group" style="grid-column:1/-1">' +
        '<label class="form-label">Nombre / Razón Social <span style="color:red;">*</span></label>' +
        '<input class="form-control" id="f_nombre" type="text" placeholder="Se autocompleta o ingresa manualmente" value="'+(c.nombre||'')+'"/>' +
      '</div>' +

      // Dirección
      '<div class="form-group" style="grid-column:1/-1">' +
        '<label class="form-label">Dirección</label>' +
        '<input class="form-control" id="f_direccion" type="text" placeholder="Dirección" value="'+(c.direccion && c.direccion!=='-/-/-' ? c.direccion : '')+'"/>' +
      '</div>' +

      // Teléfono + Email
      '<div class="form-group">' +
        '<label class="form-label">Teléfono</label>' +
        '<input class="form-control" id="f_telefono" type="text" placeholder="Ej: 987654321" value="'+(c.telefono||'')+'"/>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Email</label>' +
        '<input class="form-control" id="f_email" type="email" placeholder="correo@ejemplo.com" value="'+(c.email||'')+'"/>' +
      '</div>' +

      // Tipo cliente
      '<div class="form-group">' +
        '<label class="form-label">Clasificar como</label>' +
        '<select class="form-control" id="f_tipo_cliente">' +
          '<option value="cliente"'  +((c.tipo_cliente||'cliente')==='cliente'  ?' selected':'')+'>Cliente</option>' +
          '<option value="proveedor"'+(c.tipo_cliente==='proveedor'             ?' selected':'')+'>Proveedor</option>' +
        '</select>' +
      '</div>' +

      '</div>'
    );
  },

  _onTipoChange() {
    var tipo = document.getElementById('f_tipo')?.value;
    var inp  = document.getElementById('f_doc');
    if (inp) {
      inp.value = '';
      inp.placeholder = tipo === 'RUC' ? '11 dígitos' : tipo === 'DNI' ? '8 dígitos' : 'N° documento';
    }
    var res = document.getElementById('resultado_api');
    if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  },

  _onDocInput(val) {
    var tipo = document.getElementById('f_tipo')?.value;
    var len  = val.replace(/\D/g,'').length;
    if ((tipo === 'DNI' && len === 8) || (tipo === 'RUC' && len === 11)) {
      this._consultarAPI();
    }
  },

  async _consultarAPI() {
    var tipo = document.getElementById('f_tipo')?.value;
    var doc  = (document.getElementById('f_doc')?.value || '').trim();
    var btn  = document.getElementById('btn_buscar_doc');
    var res  = document.getElementById('resultado_api');

    if (!doc) { App.toast('Ingresa el número de documento', 'warning'); return; }
    if (tipo === 'DNI' && doc.length !== 8)  { App.toast('El DNI debe tener 8 dígitos', 'error'); return; }
    if (tipo === 'RUC' && doc.length !== 11) { App.toast('El RUC debe tener 11 dígitos', 'error'); return; }

    // Buscar en DB local primero
    var local = this._getClientes().find(function(c){ return c.doc === doc; });
    if (local) {
      document.getElementById('f_nombre').value    = local.nombre;
      document.getElementById('f_direccion').value = local.direccion !== '-/-/-' ? local.direccion : '';
      if (res) {
        res.style.display = 'block';
        res.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;">' +
          '<i class="fas fa-database" style="color:#16a34a;"></i>' +
          '<div><div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+local.nombre+'</div>' +
          '<div style="font-size:11px;color:#16a34a;">✅ Encontrado en base de datos local</div></div></div>';
      }
      return;
    }

    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }
    if (res) {
      res.style.display = 'block';
      res.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;">' +
        '<i class="fas fa-spinner fa-spin" style="color:#2563eb;"></i>' +
        '<span style="font-size:13px;color:var(--gray-600);">Consultando SUNAT / RENIEC...</span></div>';
    }

    try {
      var endpoint = tipo === 'RUC' ? 'https://apiperu.dev/api/ruc' : 'https://apiperu.dev/api/dni';
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json',
          'Authorization': 'Bearer 2568cd05aaa32855bded783fdb2a9a7ef984e2d136aaeaf2d59091dc48ef68cb' },
        body: JSON.stringify(tipo === 'RUC' ? { ruc: doc } : { dni: doc })
      });
      var data = await response.json();

      if (data.success) {
        var nombre    = tipo === 'RUC' ? (data.data.nombre_o_razon_social||'') : (data.data.nombre_completo||'');
        var direccion = tipo === 'RUC' ? (data.data.direccion||'') : '';
        document.getElementById('f_nombre').value    = nombre;
        document.getElementById('f_direccion').value = direccion;

        if (res) {
          res.innerHTML =
            '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:14px 16px;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">' +
                '<div style="width:8px;height:8px;border-radius:50%;background:#16a34a;"></div>' +
                '<span style="font-size:10px;font-weight:800;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">✅ Datos encontrados — SUNAT/RENIEC</span>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                '<div><div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">'+tipo+'</div><div style="font-size:14px;font-weight:800;color:var(--accent);">'+doc+'</div></div>' +
                '<div><div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Nombre</div><div style="font-size:12px;font-weight:700;color:var(--gray-800);">'+nombre+'</div></div>' +
                (tipo==='RUC' && data.data.estado ? '<div><div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Estado</div>' +
                  '<span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:'+(data.data.estado==='ACTIVO'?'#dcfce7':'#fee2e2')+';color:'+(data.data.estado==='ACTIVO'?'#16a34a':'#dc2626')+';">'+data.data.estado+'</span></div>' : '') +
                (direccion ? '<div style="grid-column:1/-1"><div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Dirección</div><div style="font-size:11px;color:var(--gray-700);">'+direccion+'</div></div>' : '') +
              '</div>' +
            '</div>';
        }
        App.toast('✅ Datos autocompletados correctamente', 'success');
      } else {
        if (res) res.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;">' +
          '<i class="fas fa-exclamation-circle" style="color:#dc2626;"></i>' +
          '<div><div style="font-size:13px;font-weight:700;">No se encontraron datos</div>' +
          '<div style="font-size:11px;color:var(--gray-500);">Verifica el número o ingresa los datos manualmente</div></div></div>';
        App.toast('No se encontraron datos para ese '+tipo, 'warning');
      }
    } catch(e) {
      if (res) res.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;">' +
        '<i class="fas fa-wifi" style="color:#dc2626;"></i>' +
        '<div><div style="font-size:13px;font-weight:700;">Error de conexión</div>' +
        '<div style="font-size:11px;color:var(--gray-500);">Verifica tu internet e intenta nuevamente</div></div></div>';
      App.toast('Error al consultar la API', 'error');
    } finally {
      if (btn) { btn.innerHTML = '<i class="fas fa-search"></i> Buscar'; btn.disabled = false; }
    }
  },

  // ──────────────────────────────────────────────────────
  // GUARDAR
  // ──────────────────────────────────────────────────────
  _guardar(id) {
    var tipo        = document.getElementById('f_tipo')?.value;
    var doc         = (document.getElementById('f_doc')?.value || '').trim();
    var nombre      = (document.getElementById('f_nombre')?.value || '').trim();
    var direccion   = (document.getElementById('f_direccion')?.value || '').trim() || '-/-/-';
    var telefono    = (document.getElementById('f_telefono')?.value || '').trim();
    var email       = (document.getElementById('f_email')?.value || '').trim();
    var tipoCliente = document.getElementById('f_tipo_cliente')?.value || 'cliente';

    if (!doc)    { App.toast('El número de documento es obligatorio', 'error'); return; }
    if (!nombre) { App.toast('El nombre es obligatorio', 'error'); return; }

    // Verificar duplicado doc (si es nuevo)
    if (!id) {
      var existe = this._getClientes().find(function(c){ return c.doc === doc; });
      if (existe) { App.toast('Ya existe un registro con ese documento: '+existe.nombre, 'error'); return; }
    }

    var datos = { tipo, doc, nombre, direccion, telefono, email, tipo_cliente: tipoCliente };

    if (id) {
      var idx = DB.clientes.findIndex(function(x){ return x.id === id; });
      if (idx >= 0) DB.clientes[idx] = Object.assign({}, DB.clientes[idx], datos);
      App.toast('✅ Registro actualizado correctamente', 'success');
    } else {
      var nuevoId = DB.clientes.length > 0 ? Math.max.apply(null, DB.clientes.map(function(x){ return x.id; })) + 1 : 1;
      DB.clientes.push(Object.assign({ id: nuevoId, fechaCreacion: this._fechaHoy() }, datos));
      App.toast('✅ Registro creado correctamente', 'success');
    }

    Storage.guardarClientes();
    App.closeModal();
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // ELIMINAR
  // ──────────────────────────────────────────────────────
  eliminar(id) {
    var c = this._getClientes().find(function(x){ return x.id === id; });
    if (!c) return;
    var enVentas = (DB.ventas||[]).some(function(v){ return v.cliente_id === id; });

    App.showModal('🗑️ Eliminar Registro',
      '<div style="text-align:center;padding:10px 0;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
          '<i class="fas fa-trash" style="font-size:24px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;color:var(--gray-800);margin-bottom:6px;">¿Eliminar este registro?</div>' +
        '<div style="font-size:14px;color:var(--gray-600);margin-bottom:16px;"><strong>'+c.nombre+'</strong></div>' +
        (enVentas ?
          '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;font-size:12px;color:#d97706;text-align:left;">' +
            '<i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>' +
            'Este registro tiene ventas asociadas. Eliminarlo no borrará las ventas pero quedará sin cliente asignado.' +
          '</div>' : '') +
      '</div>',
      [{ text:'🗑️ Sí, eliminar', cls:'btn-danger', cb: function() {
        var i = DB.clientes.findIndex(function(x){ return x.id === id; });
        if (i >= 0) DB.clientes.splice(i, 1);
        Storage.guardarClientes();
        App.toast('🗑️ Registro eliminado', 'warning');
        App.closeModal();
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '400px';
  },

  // ──────────────────────────────────────────────────────
  // EXPORTAR CSV
  // ──────────────────────────────────────────────────────
  _exportarCSV() {
    var clientes = this._filtrados();
    var header   = ['ID','Tipo Doc','Documento','Nombre','Dirección','Teléfono','Email','Tipo','Fecha Creación'];
    var filas    = clientes.map(function(c) {
      return [c.id, c.tipo, c.doc, '"'+c.nombre+'"', '"'+(c.direccion||'')+'"', c.telefono||'', c.email||'', c.tipo_cliente, c.fechaCreacion||''].join(',');
    });
    var csv  = [header.join(',')].concat(filas).join('\n');
    var blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = 'clientes_'+this._fechaHoy()+'.csv'; a.click();
    URL.revokeObjectURL(url);
    App.toast('✅ CSV exportado: '+clientes.length+' registros', 'success');
  }
};
