// ============================================================
// APP CONTROLLER - Controlador principal del ERP JUMILA
// ============================================================

const App = {
  currentPage: 'inicio',
  sidebarOpen: true,

  init() {
    this.initTheme();
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-menu-wrapper')) {
        document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
      }
    });
  },

  // ---- AUTH ----
  login() {
    const user = document.getElementById('loginUser')?.value?.trim().toUpperCase();
    const pass = document.getElementById('loginPass')?.value;
    const found = DB.usuarios.find(u => u.usuario.toUpperCase() === user && u.password === pass && u.activo);
    if (found) {
      DB.usuarioActual = found;
      // Guardar sesión en localStorage para sobrevivir recargas
      try { localStorage.setItem('erp_jumila_session', JSON.stringify({ id: found.id })); } catch(e) {}
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('welcomeName').textContent = found.nombre;
      localStorage.setItem('erp_jumila_uid', found.id);
      this.buildSidebar();
      this.navigate('inicio');
    } else {
      const existe = DB.usuarios.find(u => u.usuario.toUpperCase() === user);
      if (existe && !existe.activo) {
        this.toast('Usuario desactivado. Contacte al administrador.', 'error');
      } else {
        this.toast('Usuario o contraseña incorrectos', 'error');
      }
    }
  },

  logout() {
    if (confirm('¿Cerrar sesión?')) {
      DB.usuarioActual = null;
      // Limpiar sesión y datos guardados
      try { localStorage.removeItem('erp_jumila_session'); } catch(e) {}
      document.getElementById('mainApp').classList.add('hidden');
      document.getElementById('loginPage').classList.remove('hidden');
      document.getElementById('loginUser').value = '';
      document.getElementById('loginPass').value = '';
      localStorage.removeItem('erp_jumila_uid');
    }
  },

  // ---- PERSISTENCIA EN LOCALSTORAGE ----
  _saveDB() {
    try {
      var snapshot = {
        v: 1,
        ts: Date.now(),
        ventas:           DB.ventas,
        productos:        DB.productos,
        clientes:         DB.clientes,
        usuarios:         DB.usuarios,
        cajas:            DB.cajas,
        compras:          DB.compras,
        agenda:           DB.agenda          || [],
        cuentasCorriente: DB.cuentasCorriente|| [],
        cotizaciones:     DB.cotizaciones    || [],
        kardex:           DB.kardex          || [],
        notasCredito:     DB.notasCredito    || [],
        preciosCustom:    DB.preciosCustom   || {},
        _sequences:       DB._sequences,
        _cotSeq:          DB._cotSeq         || 4
      };
      localStorage.setItem('erp_jumila_db', JSON.stringify(snapshot));
    } catch(e) {
      console.warn('ERP: no se pudo guardar estado', e);
    }
  },

  _loadDB() {
    try {
      var raw = localStorage.getItem('erp_jumila_db');
      if (!raw) return false;
      var s = JSON.parse(raw);
      if (!s || !s.v) return false;
      if (s.ventas)           DB.ventas           = s.ventas;
      if (s.productos)        DB.productos        = s.productos;
      if (s.clientes)         DB.clientes         = s.clientes;
      if (s.usuarios)         DB.usuarios         = s.usuarios;
      if (s.cajas)            DB.cajas            = s.cajas;
      if (s.compras)          DB.compras          = s.compras;
      if (s.agenda)           DB.agenda           = s.agenda;
      if (s.cuentasCorriente) DB.cuentasCorriente = s.cuentasCorriente;
      if (s.cotizaciones)     DB.cotizaciones     = s.cotizaciones;
      if (s.kardex)           DB.kardex           = s.kardex;
      if (s.notasCredito)     DB.notasCredito     = s.notasCredito;
      if (s.preciosCustom)    DB.preciosCustom    = s.preciosCustom;
      if (s._sequences)       DB._sequences       = s._sequences;
      if (s._cotSeq)          DB._cotSeq          = s._cotSeq;
      return true;
    } catch(e) {
      console.warn('ERP: no se pudo restaurar estado', e);
      return false;
    }
  },

  _restoreSession() {
    try {
      var raw = localStorage.getItem('erp_jumila_session');
      if (!raw) return false;
      var sess = JSON.parse(raw);
      var user = DB.usuarios.find(function(u) { return u.id === sess.id && u.activo; });
      if (!user) { localStorage.removeItem('erp_jumila_session'); return false; }
      DB.usuarioActual = user;
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('welcomeName').textContent = user.nombre;
      localStorage.setItem('erp_jumila_uid', user.id);
      this.buildSidebar();
      this.navigate('inicio');
      return true;
    } catch(e) {
      localStorage.removeItem('erp_jumila_session');
      return false;
    }
  },

  tienePermiso(modulo) {
    const u = DB.usuarioActual;
    if (!u) return false;
    if (u.rol === 'admin' || u.permisos === 'todos') return true;
    return u.permisos?.[modulo] === true;
  },

  buildSidebar() {
    const u = DB.usuarioActual;
    if (!u) return;
    const infos = document.querySelectorAll('.info-value');
    if (infos[0]) infos[0].textContent = DB.empresa.nombre;
    if (infos[1]) infos[1].textContent = u.cargo;
    if (infos[2]) infos[2].innerHTML = u.sucursal + ' <i class="fas fa-chevron-down"></i>';
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
      btn.style.display = this.tienePermiso(btn.dataset.page) ? '' : 'none';
    });
    document.querySelectorAll('.nav-section-label').forEach(label => {
      let next = label.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('nav-section-label')) {
        next.querySelectorAll?.('.nav-btn[data-page]').forEach(b => {
          if (b.style.display !== 'none') hasVisible = true;
        });
        next = next.nextElementSibling;
      }
      label.style.display = hasVisible ? '' : 'none';
    });
  },

  // ---- NAVIGATION ----
  navigate(page) {
    if (page !== 'inicio' && DB.usuarioActual && !this.tienePermiso(page)) {
      this.toast('No tiene permiso para acceder a este módulo', 'error');
      return;
    }
    this.currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
    this.renderPage();
    // Auto-guardar en localStorage en cada navegación
    try { this._saveDB(); } catch(e) {}
  },

  renderPage() {
    const el = document.getElementById('pageContent');
    if (!el) return;
    let html = '';
    switch (this.currentPage) {
      case 'inicio':          html = InicioModule.render(); break;
      case 'clientes':        html = ClientesModule.render(); break;
      case 'productos':       html = ProductosModule.render(); break;
      case 'ventas':          html = VentasModule.render(); break;
      case 'compras':         html = this.renderCompras(); break;
      case 'guias':           html = this.renderGuias(); break;
      case 'inventario':      html = InventarioModule.render(); break;
      case 'cuentas':         html = this.renderCuentas(); break;
      case 'finanzas':        html = this.renderFinanzas(); break;
      case 'caja':            html = CajaModule.render(); break;
      case 'reportes':        html = ReportesModule.render(); break;
      case 'administracion':  html = this.renderAdministracion(); break;
      case 'configuracion':   html = this.renderConfiguracion(); break;
      case 'soporte':         html = this.renderSoporte(); break;
      case 'pos':             html = POSModule.render(); setTimeout(function(){ POSModule._initKeyboard(); document.getElementById('posSearch')?.focus(); },80); break;
      case 'precios':         html = PreciosModule.render(); break;
      case 'tickets':         html = CuentaCorrienteModule.render(); break;  // ← CAMBIADO
      case 'cotizaciones':    html = CotizacionesModule.render(); break;
      case 'notascredito':    html = NotasCreditoModule.render(); break;
      case 'kardex':          html = KardexModule.render(); break;
      case 'agenda':          html = AgendaModule.render(); break;
      case 'herramientas':    html = HerramientasModule.render(); break;
      default:                html = this.renderInicio();
    }
    el.innerHTML = html;
    if (this.currentPage === 'inicio') {
      setTimeout(function(){ InicioModule.initCharts(); }, 80);
    }
  },

  // ---- TABS ----
  setTabs2(tab1, tab2) {
    const el = document.getElementById('topbarTabs');
    if (!el) return;
    el.innerHTML = `
      <button class="topbar-tab active">${tab1}</button>
      ${tab2 ? `<span style="color:var(--gray-300);margin:0 4px;">|</span><button class="topbar-tab">${tab2}</button>` : ''}
    `;
  },

  setTabs(tabs, active) {
    const el = document.getElementById('topbarTabs');
    if (!el) return;
    el.innerHTML = tabs.map(t =>
      `<button class="topbar-tab ${t.page === active ? 'active' : ''}">${t.label}</button>`
    ).join('<span style="color:var(--gray-300);margin:0 4px;">|</span>');
  },

  // ---- SIDEBAR ----
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed', !this.sidebarOpen);
  },

  // ---- MODAL ----
  showModal(title, bodyHTML, buttons = []) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const footer = document.getElementById('modalFooter');
    footer.innerHTML = buttons.map((btn, i) =>
      `<button class="btn ${btn.cls || 'btn-primary'}" id="modalBtn${i}">${btn.text}</button>`
    ).join('');
    buttons.forEach((btn, i) => {
      document.getElementById('modalBtn' + i)?.addEventListener('click', btn.cb);
    });
    document.getElementById('modalOverlay').classList.remove('hidden');
  },

  closeModal(e) {
    if (!e || e.target === document.getElementById('modalOverlay')) {
      document.getElementById('modalOverlay').classList.add('hidden');
    }
  },

  // ---- TOAST ----
  toast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    const icons = { success:'fas fa-check-circle', error:'fas fa-exclamation-circle', warning:'fas fa-exclamation-triangle', info:'fas fa-info-circle' };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="' + (icons[type] || icons.info) + '"></i> ' + message;
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
  },

  // ---- INICIO ----
  renderInicio() {
    this.setTabs2('Inicio', '');
    const totalVentas = DB.ventas.reduce(function(s,v){ return s+v.total; }, 0);
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = DB.ventas.filter(function(v){ return v.fecha === hoy; });
    const totalHoy = ventasHoy.reduce(function(s,v){ return s+v.total; }, 0);
    const agendaPend = (DB.agenda||[]).filter(function(a){ return !a.completado; }).length;
    const agendaVenc = (DB.agenda||[]).filter(function(a){ return !a.completado && a.fecha < hoy; }).length;

    return '<div class="page-header"><div>' +
      '<h2 class="page-title">Panel Principal</h2>' +
      '<p class="text-muted text-sm">Bienvenido al Sistema ERP JUMILA</p>' +
      '</div></div>' +
      '<div class="stats-grid mb-5">' +
        '<div class="stat-card">' +
          '<div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-file-invoice-dollar"></i></div>' +
          '<div class="stat-info"><div class="stat-value">S/ ' + totalHoy.toFixed(2) + '</div><div class="stat-label">Ventas de Hoy</div>' +
          '<div class="stat-change up"><i class="fas fa-arrow-up"></i> ' + ventasHoy.length + ' comprobantes</div></div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-dollar-sign"></i></div>' +
          '<div class="stat-info"><div class="stat-value">S/ ' + totalVentas.toFixed(2) + '</div><div class="stat-label">Total Ventas</div>' +
          '<div class="stat-change up"><i class="fas fa-file-invoice"></i> ' + DB.ventas.length + ' comprobantes</div></div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-icon" style="background:#fef3c7;color:#d97706;"><i class="fas fa-exclamation-triangle"></i></div>' +
          '<div class="stat-info"><div class="stat-value">' + DB.productos.filter(function(p){ return p.stock<=10; }).length + '</div>' +
          '<div class="stat-label">Stock Bajo</div><div class="stat-change down"><i class="fas fa-boxes"></i> Requiere reposición</div></div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-users"></i></div>' +
          '<div class="stat-info"><div class="stat-value">' + DB.clientes.filter(function(c){ return c.tipo_cliente==='cliente'; }).length + '</div>' +
          '<div class="stat-label">Clientes</div><div class="stat-change up"><i class="fas fa-user-plus"></i> Activos</div></div>' +
        '</div>' +
        '<div class="stat-card" onclick="App.navigate(\'agenda\')" style="cursor:pointer;">' +
          '<div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-calendar-alt"></i></div>' +
          '<div class="stat-info"><div class="stat-value">' + agendaPend + '</div>' +
          '<div class="stat-label">Eventos Pendientes</div>' +
          '<div class="stat-change ' + (agendaVenc > 0 ? 'down' : 'up') + '"><i class="fas fa-bell"></i> ' + agendaVenc + ' vencidos</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="card mb-5"><div class="card-header"><span class="card-title">Acciones Rápidas</span></div>' +
      '<div class="card-body"><div class="quick-actions">' +
        '<div class="quick-btn" onclick="App.navigate(\'pos\');" style="color:#b71c1c;"><i class="fas fa-cash-register" style="color:#b71c1c;"></i>Punto de Venta</div>' +
        '<div class="quick-btn" onclick="VentasModule.nuevaVenta();App.navigate(\'ventas\');" style="color:#16a34a;"><i class="fas fa-file-invoice-dollar" style="color:#16a34a;"></i>Nueva Venta</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'cotizaciones\');setTimeout(function(){CotizacionesModule.nueva();},100);" style="color:#006064;"><i class="fas fa-file-alt" style="color:#006064;"></i>Cotización</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'clientes\');setTimeout(function(){ClientesModule.nuevo();},100);" style="color:#6a1b9a;"><i class="fas fa-user-plus" style="color:#6a1b9a;"></i>Nuevo Cliente</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'productos\');setTimeout(function(){ProductosModule.nuevo();},100);" style="color:#2e7d32;"><i class="fas fa-plus-circle" style="color:#2e7d32;"></i>Nuevo Producto</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'inventario\');" style="color:#283593;"><i class="fas fa-warehouse" style="color:#283593;"></i>Inventario</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'caja\');" style="color:#00695c;"><i class="fas fa-cash-register" style="color:#00695c;"></i>Caja</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'tickets\');" style="color:#4a148c;"><i class="fas fa-ticket-alt" style="color:#4a148c;"></i>Tickets</div>' +  // ← CAMBIADO
        '<div class="quick-btn" onclick="App.navigate(\'reportes\');" style="color:#33691e;"><i class="fas fa-chart-bar" style="color:#33691e;"></i>Reportes</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'agenda\');" style="color:#1b5e20;"><i class="fas fa-calendar-alt" style="color:#1b5e20;"></i>Agenda</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'herramientas\');" style="color:#4e342e;"><i class="fas fa-tools" style="color:#4e342e;"></i>Herramientas</div>' +
        '<div class="quick-btn" onclick="App.navigate(\'kardex\');" style="color:#1a237e;"><i class="fas fa-history" style="color:#1a237e;"></i>Kardex</div>' +
      '</div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
        '<div class="card"><div class="card-header"><span class="card-title">Últimas Ventas</span>' +
        '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'ventas\')">Ver todas</button></div>' +
        '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Comprobante</th><th>Total</th><th>Estado</th></tr></thead><tbody>' +
        DB.ventas.slice(0,5).map(function(v) {
          var c = DB.clientes.find(function(x){ return x.id===v.cliente_id; });
          return '<tr><td><div class="td-name text-sm">' + v.serie + '-' + v.numero + '</div>' +
            '<div class="td-sub">' + ((c && c.nombre) ? c.nombre.substring(0,25) : '') + '</div></td>' +
            '<td><strong>S/ ' + v.total.toFixed(2) + '</strong></td>' +
            '<td><span class="' + (v.estado==='ACEPTADO'?'status-aceptado':'status-no-enviado') + '" style="font-size:10px;">' +
            (v.estado==='ACEPTADO'?'ACEPT.':'N.ENV.') + '</span></td></tr>';
        }).join('') +
        '</tbody></table></div></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Stock Bajo</span>' +
        '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'inventario\')">Ver inventario</button></div>' +
        '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Producto</th><th>Stock</th><th>Categoría</th></tr></thead><tbody>' +
        DB.productos.filter(function(p){ return p.stock<=10; }).slice(0,6).map(function(p) {
          return '<tr><td><div class="td-name text-sm">' + p.nombre + '</div></td>' +
            '<td>' + (p.stock===0 ? '<span class="stock-badge stock-out">0</span>' : '<span class="stock-badge stock-low">' + p.stock + '</span>') + '</td>' +
            '<td class="text-muted text-sm">' + p.categoria + '</td></tr>';
        }).join('') +
        (DB.productos.filter(function(p){ return p.stock<=10; }).length===0 ? '<tr><td colspan="3" class="text-center text-muted">Sin alertas de stock</td></tr>' : '') +
        '</tbody></table></div></div>' +
      '</div>';
  },

  // ---- COMPRAS ----
  renderCompras() {
    this.setTabs2('Gestión de Compras', 'COMPRAS');
    return '<div class="page-header"><h2 class="page-title">Listado de Compras</h2>' +
      '<div class="page-actions"><button class="btn btn-primary" onclick="App.toast(\'Nueva compra\',\'info\')"><i class="fas fa-plus"></i> Nueva Compra</button></div></div>' +
      '<div class="card"><div class="table-wrapper"><table class="data-table">' +
      '<thead><tr><th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Total</th><th>Estado</th></tr></thead><tbody>' +
      DB.compras.map(function(c) {
        var prov = DB.clientes.find(function(x){ return x.id===c.proveedor_id; });
        return '<tr><td>' + c.fecha + '</td><td>' + c.serie + '-' + c.numero + '</td>' +
          '<td>' + (prov ? prov.nombre : 'N/A') + '</td>' +
          '<td><strong>S/ ' + c.total.toFixed(2) + '</strong></td>' +
          '<td><span class="badge ' + (c.estado==='PAGADO'?'badge-success':'badge-warning') + '">' + c.estado + '</span></td></tr>';
      }).join('') +
      '</tbody></table></div></div>';
  },

  // ---- GUIAS ----
  renderGuias() {
    this.setTabs2('Guías de Remisión', 'GUÍAS');
    return '<div class="page-header"><h2 class="page-title">Guías de Remisión</h2>' +
      '<div class="page-actions"><button class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Guía</button></div></div>' +
      '<div class="card"><div class="empty-state"><i class="fas fa-truck"></i><p>No hay guías registradas</p></div></div>';
  },

  // ---- CUENTAS BANCARIAS ----
  renderCuentas() {
    this.setTabs2('Cuentas Bancarias', 'FINANZAS');
    return '<div class="page-header"><h2 class="page-title">Cuentas Bancarias</h2></div>' +
      '<div class="card"><div class="empty-state"><i class="fas fa-university"></i>' +
      '<p>No hay cuentas bancarias registradas.</p></div></div>';
  },

  // ---- FINANZAS ----
  renderFinanzas() {
    this.setTabs2('Finanzas', 'FLUJO DE CAJA');
    var totalVentas = DB.ventas.reduce(function(s,v){ return s+v.total; }, 0);
    var totalCompras = DB.compras.reduce(function(s,c){ return s+c.total; }, 0);
    return '<div class="page-header"><h2 class="page-title">Finanzas</h2></div>' +
      '<div class="stats-grid mb-5" style="grid-template-columns:repeat(3,1fr);">' +
        '<div class="stat-card"><div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-arrow-circle-up"></i></div>' +
        '<div class="stat-info"><div class="stat-value" style="color:var(--success);">S/ ' + totalVentas.toFixed(2) + '</div><div class="stat-label">Ingresos</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-arrow-circle-down"></i></div>' +
        '<div class="stat-info"><div class="stat-value" style="color:var(--danger);">S/ ' + totalCompras.toFixed(2) + '</div><div class="stat-label">Egresos</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-balance-scale"></i></div>' +
        '<div class="stat-info"><div class="stat-value" style="color:var(--success);">S/ ' + (totalVentas-totalCompras).toFixed(2) + '</div><div class="stat-label">Saldo Neto</div></div></div>' +
      '</div>' +
      '<div class="card"><div class="empty-state"><i class="fas fa-chart-line"></i><p>Módulo de finanzas en construcción</p></div></div>';
  },

  // ---- ADMINISTRACIÓN / USUARIOS ----
  renderAdministracion() {
    this.setTabs2('Administración', 'USUARIOS');
    if (DB.usuarioActual && DB.usuarioActual.rol !== 'admin') {
      return '<div class="empty-state" style="padding:80px;"><i class="fas fa-lock" style="font-size:64px;color:var(--danger);"></i>' +
        '<p style="font-size:18px;font-weight:700;margin-top:16px;">Acceso Restringido</p>' +
        '<p>Solo el Administrador puede gestionar usuarios.</p></div>';
    }

    var rows = DB.usuarios.map(function(u) {
      var esTu = DB.usuarioActual && u.id === DB.usuarioActual.id;
      var bgRow = esTu ? 'style="background:#eff6ff;"' : '';
      var avatar = u.rol === 'admin'
        ? 'linear-gradient(135deg,#b71c1c,#e53935)'
        : 'linear-gradient(135deg,#1565c0,#1976d2)';
      var tuBadge = esTu ? '<span style="background:#eff6ff;color:var(--accent);font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;margin-left:4px;">TÚ</span>' : '';
      var rolBg    = u.rol === 'admin' ? '#fef2f2' : '#eff6ff';
      var rolColor = u.rol === 'admin' ? '#dc2626' : '#2563eb';
      var rolLabel = u.rol === 'admin' ? '👑 ADMIN' : '👤 ' + u.rol.toUpperCase();
      var estadoBg    = u.activo ? '#dcfce7' : '#fee2e2';
      var estadoColor = u.activo ? '#16a34a' : '#dc2626';
      var estadoLabel = u.activo ? '✓ ACTIVO' : '✗ INACTIVO';
      var adminDis = u.rol === 'admin' ? ' disabled style="opacity:0.4;"' : '';
      var toggleBtn = u.activo
        ? '<button class="btn btn-warning btn-sm" onclick="App.toggleUsuario(' + u.id + ')" title="Desactivar"><i class="fas fa-user-slash"></i></button>'
        : '<button class="btn btn-success btn-sm" onclick="App.toggleUsuario(' + u.id + ')" title="Activar"><i class="fas fa-user-check"></i></button>';
      var deleteBtn = '<button class="btn btn-danger btn-sm" onclick="App.eliminarUsuario(' + u.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button>';
      var extraBtns = esTu ? '' : (toggleBtn + deleteBtn);

      return '<tr ' + bgRow + '>' +
        '<td><div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:' + avatar + ';color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">' +
            u.nombre.charAt(0) +
          '</div>' +
          '<strong>' + u.usuario + '</strong>' + tuBadge +
        '</div></td>' +
        '<td>' + u.nombre + '</td>' +
        '<td><span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:' + rolBg + ';color:' + rolColor + ';">' + rolLabel + '</span></td>' +
        '<td class="text-sm">' + u.cargo + '</td>' +
        '<td class="text-sm text-muted">' + u.sucursal + '</td>' +
        '<td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:' + estadoBg + ';color:' + estadoColor + ';">' + estadoLabel + '</span></td>' +
        '<td><div class="flex gap-2">' +
          '<button class="btn btn-outline btn-sm" onclick="App.editarUsuario(' + u.id + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
          '<button class="btn btn-primary btn-sm" onclick="App.gestionarPermisos(' + u.id + ')" title="Permisos"' + adminDis + '><i class="fas fa-shield-alt"></i> Permisos</button>' +
          '<button class="btn btn-outline btn-sm" onclick="App.cambiarPassword(' + u.id + ')" title="Contraseña"><i class="fas fa-key"></i></button>' +
          extraBtns +
        '</div></td>' +
      '</tr>';
    }).join('');

    return '<div class="page-header">' +
      '<h2 class="page-title"><i class="fas fa-users-cog" style="color:var(--accent);margin-right:8px;"></i>Gestión de Usuarios</h2>' +
      '<div class="page-actions"><button class="btn btn-success" onclick="App.nuevoUsuario()"><i class="fas fa-user-plus"></i> Crear Usuario</button></div>' +
    '</div>' +
    '<div class="card mb-5">' +
      '<div class="card-header"><span class="card-title">Usuarios del Sistema</span>' +
        '<span class="text-muted text-sm">' + DB.usuarios.length + ' usuarios registrados</span>' +
      '</div>' +
      '<div class="table-wrapper"><table class="data-table">' +
        '<thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Cargo</th><th>Sucursal</th><th>Estado</th><th>Acciones</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</div>' +
    '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:6px;"></i>Guía de Roles</span></div>' +
    '<div class="card-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
      '<div style="padding:16px;background:#fef2f2;border-radius:var(--radius);border-left:4px solid #dc2626;">' +
        '<div style="font-size:16px;font-weight:800;color:#dc2626;margin-bottom:8px;">👑 ADMINISTRADOR</div>' +
        '<ul style="font-size:13px;color:var(--gray-700);padding-left:16px;line-height:1.8;">' +
          '<li>Acceso completo a todos los módulos</li><li>Crear, editar y eliminar usuarios</li>' +
          '<li>Configurar permisos por usuario</li><li>Ver reportes y finanzas completos</li>' +
        '</ul>' +
      '</div>' +
      '<div style="padding:16px;background:#eff6ff;border-radius:var(--radius);border-left:4px solid #2563eb;">' +
        '<div style="font-size:16px;font-weight:800;color:#2563eb;margin-bottom:8px;">👤 CAJERO / VENDEDOR</div>' +
        '<ul style="font-size:13px;color:var(--gray-700);padding-left:16px;line-height:1.8;">' +
          '<li>Solo ve los módulos asignados por el Admin</li><li>No puede acceder a Administración</li>' +
          '<li>Puede vender, cobrar y usar la caja</li><li>Se puede activar/desactivar fácilmente</li>' +
        '</ul>' +
      '</div>' +
    '</div></div></div>';
  },

  // ---- CONFIGURACIÓN ----
  renderConfiguracion() {
    this.setTabs2('Configuración', 'SISTEMA');
    return '<div class="page-header"><h2 class="page-title">Configuración del Sistema</h2></div>' +
      '<div class="card"><div class="card-header"><span class="card-title">Datos de la Empresa</span></div>' +
      '<div class="card-body"><div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre / Razón Social</label>' +
          '<input class="form-control" value="' + DB.empresa.nombre + '" id="cfg_nombre"/></div>' +
        '<div class="form-group"><label class="form-label">RUC</label>' +
          '<input class="form-control" value="' + DB.empresa.ruc + '" id="cfg_ruc"/></div>' +
        '<div class="form-group"><label class="form-label">Sucursal</label>' +
          '<input class="form-control" value="' + DB.empresa.sucursal + '" id="cfg_sucursal"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Dirección</label>' +
          '<input class="form-control" value="' + DB.empresa.direccion + '" id="cfg_direccion"/></div>' +
        '<div class="form-group"><label class="form-label">Tipo de Cambio</label>' +
          '<input class="form-control" type="number" step="0.001" value="' + DB.empresa.tipoCambio + '" id="cfg_tc"/></div>' +
      '</div>' +
      '<div style="margin-top:20px;">' +
        '<button class="btn btn-primary" onclick="' +
          'DB.empresa.nombre=document.getElementById(\'cfg_nombre\').value;' +
          'DB.empresa.ruc=document.getElementById(\'cfg_ruc\').value;' +
          'DB.empresa.sucursal=document.getElementById(\'cfg_sucursal\').value;' +
          'DB.empresa.direccion=document.getElementById(\'cfg_direccion\').value;' +
          'DB.empresa.tipoCambio=parseFloat(document.getElementById(\'cfg_tc\').value)||3.467;' +
          'App.toast(\'Configuración guardada\',\'success\');' +
        '"><i class="fas fa-save"></i> Guardar Configuración</button>' +
      '</div></div></div>';
  },

  // ---- SOPORTE ----
  renderSoporte() {
    this.setTabs2('Soporte / Ayuda', 'CONTACTO');
    return '<div class="page-header"><h2 class="page-title">Soporte y Ayuda</h2></div>' +
      '<div class="card"><div class="card-body">' +
        '<div style="text-align:center;padding:20px;">' +
          '<i class="fas fa-headset" style="font-size:64px;color:var(--accent);margin-bottom:20px;display:block;"></i>' +
          '<h3 style="font-size:20px;font-weight:800;margin-bottom:8px;">¿Necesita ayuda?</h3>' +
          '<p class="text-muted mb-4">Nuestro equipo está disponible para asistirle</p>' +
        '</div>' +
        '<div class="quick-actions">' +
          '<div class="quick-btn" onclick="App.toast(\'Chat de soporte\',\'info\')"><i class="fas fa-comments" style="color:#2563eb;"></i>Chat en Vivo</div>' +
          '<div class="quick-btn" onclick="App.toast(\'Email soporte\',\'info\')"><i class="fas fa-envelope" style="color:#16a34a;"></i>Email Soporte</div>' +
          '<div class="quick-btn" onclick="App.toast(\'Llamando...\',\'info\')"><i class="fas fa-phone" style="color:#d97706;"></i>Llamar Soporte</div>' +
          '<div class="quick-btn" onclick="App.toast(\'Abriendo manual\',\'info\')"><i class="fas fa-book" style="color:#7c3aed;"></i>Manual</div>' +
        '</div>' +
      '</div></div>';
  },

  // ============================================================
  // GESTIÓN DE USUARIOS
  // ============================================================

  _MODULOS_PERMISOS: [
    { key:'inicio',          label:'Inicio',               grupo:'Principal' },
    { key:'pos',             label:'Punto de Venta (POS)', grupo:'Principal' },
    { key:'productos',       label:'Productos/Servicios',  grupo:'Catalogo'  },
    { key:'precios',         label:'Lista de Precios',     grupo:'Catalogo'  },
    { key:'clientes',        label:'Clientes/Proveedores', grupo:'Clientes'  },
    { key:'tickets',         label:'Tickets',              grupo:'Clientes'  },  // ← CAMBIADO
    { key:'ventas',          label:'Ventas',               grupo:'Ventas'    },
    { key:'cotizaciones',    label:'Cotizaciones',         grupo:'Ventas'    },
    { key:'notascredito',    label:'Notas Cred./Deb.',     grupo:'Ventas'    },
    { key:'guias',           label:'Guias de Remision',    grupo:'Ventas'    },
    { key:'compras',         label:'Compras',              grupo:'Compras'   },
    { key:'cuentas',         label:'Cuentas Bancarias',    grupo:'Compras'   },
    { key:'inventario',      label:'Inventario',           grupo:'Almacen'   },
    { key:'kardex',          label:'Kardex',               grupo:'Almacen'   },
    { key:'finanzas',        label:'Finanzas',             grupo:'Finanzas'  },
    { key:'caja',            label:'Caja',                 grupo:'Finanzas'  },
    { key:'reportes',        label:'Reportes',             grupo:'Gestion'   },
    { key:'agenda',          label:'Agenda',               grupo:'Gestion'   },
    { key:'herramientas',    label:'Herramientas',         grupo:'Gestion'   },
    { key:'configuracion',   label:'Configuracion',        grupo:'Sistema'   },
    { key:'soporte',         label:'Soporte/Ayuda',        grupo:'Sistema'   }
  ],

  nuevoUsuario() {
    this.showModal('Crear Nuevo Usuario', this._formUsuario({}), [
      { text:'Crear Usuario', cls:'btn-success', cb: function(){ App._guardarUsuario(); } }
    ]);
  },

  editarUsuario(id) {
    var u = DB.usuarios.find(function(x){ return x.id === id; });
    this.showModal('Editar Usuario', this._formUsuario(u || {}), [
      { text:'Guardar Cambios', cls:'btn-primary', cb: function(){ App._guardarUsuario(id); } }
    ]);
  },

  _formUsuario(u) {
    var rolOpts = ['cajero','vendedor','almacen','contador','admin'];
    var rolLabels = {'cajero':'Cajero/Vendedor','vendedor':'Vendedor','almacen':'Almacenero','contador':'Contador','admin':'Administrador'};
    var optionsHtml = rolOpts.map(function(r){
      return '<option value="' + r + '" ' + ((u.rol||'cajero')===r?'selected':'') + '>' + rolLabels[r] + '</option>';
    }).join('');
    return '<div class="form-grid">' +
      '<div class="form-group"><label class="form-label">Usuario (login) *</label>' +
        '<input class="form-control" id="fu_usuario" placeholder="Ej: CAJERO2" value="' + (u.usuario||'') + '" ' +
        'oninput="this.value=this.value.toUpperCase().replace(/\\s/g,\'\')"/></div>' +
      '<div class="form-group"><label class="form-label">Contrasena *</label>' +
        '<input class="form-control" id="fu_pass" type="password" placeholder="Contrasena" value="' + (u.password||'') + '"/></div>' +
      '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre Completo *</label>' +
        '<input class="form-control" id="fu_nombre" placeholder="Nombre del trabajador" value="' + (u.nombre||'') + '"/></div>' +
      '<div class="form-group"><label class="form-label">Rol *</label>' +
        '<select class="form-control" id="fu_rol">' + optionsHtml + '</select></div>' +
      '<div class="form-group"><label class="form-label">Cargo</label>' +
        '<input class="form-control" id="fu_cargo" value="' + (u.cargo||'CAJERO') + '"/></div>' +
      '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Sucursal</label>' +
        '<input class="form-control" id="fu_sucursal" value="' + (u.sucursal||DB.empresa.sucursal) + '"/></div>' +
    '</div>' +
    '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-top:8px;font-size:12px;color:#92400e;">' +
      '<i class="fas fa-info-circle"></i> Despues de crear el usuario usa el boton <strong>Permisos</strong> para asignar accesos.' +
    '</div>';
  },

  _guardarUsuario(id) {
    var usuario  = (document.getElementById('fu_usuario')?.value||'').trim().toUpperCase();
    var pass     = document.getElementById('fu_pass')?.value || '';
    var nombre   = (document.getElementById('fu_nombre')?.value||'').trim();
    var rol      = document.getElementById('fu_rol')?.value || 'cajero';
    var cargo    = (document.getElementById('fu_cargo')?.value||'CAJERO').trim().toUpperCase();
    var sucursal = (document.getElementById('fu_sucursal')?.value||'').trim();

    if (!usuario || !pass || !nombre) { this.toast('Complete todos los campos obligatorios', 'error'); return; }

    var duplic = DB.usuarios.find(function(u){ return u.usuario.toUpperCase() === usuario && u.id !== id; });
    if (duplic) { this.toast('Ese nombre de usuario ya existe', 'error'); return; }

    if (id) {
      var i = DB.usuarios.findIndex(function(u){ return u.id === id; });
      if (i >= 0) {
        DB.usuarios[i].usuario  = usuario;
        DB.usuarios[i].password = pass;
        DB.usuarios[i].nombre   = nombre;
        DB.usuarios[i].rol      = rol;
        DB.usuarios[i].cargo    = cargo;
        DB.usuarios[i].sucursal = sucursal;
        this.toast('Usuario actualizado correctamente', 'success');
      }
    } else {
      var newId = Math.max.apply(null, DB.usuarios.map(function(u){ return u.id; })) + 1;
      var permisos = rol === 'admin' ? 'todos' : {
        inicio:true, pos:true, ventas:true, caja:true, clientes:true,
        productos:true, inventario:false, compras:false, cotizaciones:false,
        notascredito:false, guias:false, cuentas:false, finanzas:false,
        reportes:false, kardex:false, precios:false, tickets:false,
        agenda:false, herramientas:false, administracion:false,
        configuracion:false, soporte:true
      };
      DB.usuarios.push({ id:newId, usuario:usuario, password:pass, nombre:nombre, rol:rol,
        cargo:cargo, sucursal:sucursal, activo:true,
        fechaCreacion:new Date().toISOString().split('T')[0], permisos:permisos });
      this.toast('Usuario "' + usuario + '" creado. Asignale permisos.', 'success');
    }
    this.closeModal();
    this.renderPage();
  },

  gestionarPermisos(id) {
    var u = DB.usuarios.find(function(x){ return x.id === id; });
    if (!u || u.rol === 'admin') { this.toast('Los admins tienen acceso total', 'info'); return; }

    var perms = (typeof u.permisos === 'object') ? u.permisos : {};
    var grupos = [];
    this._MODULOS_PERMISOS.forEach(function(m){
      if (grupos.indexOf(m.grupo) === -1) grupos.push(m.grupo);
    });
    var self = this;

    var html = '<div style="background:linear-gradient(135deg,#1a2744,#2563eb);border-radius:10px;padding:16px;margin-bottom:16px;color:white;display:flex;align-items:center;gap:14px;">' +
      '<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">' + u.nombre.charAt(0) + '</div>' +
      '<div><div style="font-weight:800;font-size:16px;">' + u.nombre + '</div><div style="opacity:0.8;font-size:13px;">' + u.usuario + ' - ' + u.cargo + '</div></div></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:12px;align-items:center;">' +
        '<span style="font-size:13px;font-weight:700;">Modulos a los que tendra acceso:</span>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-outline btn-sm" onclick="App._toggleTodos(true)"><i class="fas fa-check-double"></i> Todos</button>' +
          '<button class="btn btn-outline btn-sm" onclick="App._toggleTodos(false)"><i class="fas fa-times"></i> Ninguno</button>' +
        '</div></div>';

    grupos.forEach(function(grupo) {
      var mods = self._MODULOS_PERMISOS.filter(function(m){ return m.grupo === grupo; });
      html += '<div style="margin-bottom:14px;">' +
        '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--gray-200);">' + grupo + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';
      mods.forEach(function(m) {
        var checked = perms[m.key] ? 'checked' : '';
        var border  = perms[m.key] ? 'var(--accent)' : 'var(--gray-200)';
        var bg      = perms[m.key] ? '#eff6ff' : 'white';
        html += '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ' + border + ';border-radius:8px;cursor:pointer;background:' + bg + ';" id="lbl_' + m.key + '">' +
          '<input type="checkbox" id="perm_' + m.key + '" ' + checked + ' style="width:16px;height:16px;cursor:pointer;" onchange="App._updatePermLabel(\'' + m.key + '\',this.checked)"/>' +
          '<span style="font-size:13px;font-weight:600;">' + m.label + '</span>' +
        '</label>';
      });
      html += '</div></div>';
    });

    this.showModal('Permisos: ' + u.nombre, html, [
      { text:'Guardar Permisos', cls:'btn-success', cb: function(){ App._guardarPermisos(id); } }
    ]);
    setTimeout(function(){ var mb=document.getElementById('modalBox'); if(mb) mb.style.maxWidth='680px'; }, 10);
  },

  _updatePermLabel(key, checked) {
    var lbl = document.getElementById('lbl_' + key);
    if (lbl) {
      lbl.style.borderColor = checked ? 'var(--accent)' : 'var(--gray-200)';
      lbl.style.background  = checked ? '#eff6ff' : 'white';
    }
  },

  _toggleTodos(val) {
    var self = this;
    this._MODULOS_PERMISOS.forEach(function(m) {
      var cb = document.getElementById('perm_' + m.key);
      if (cb) { cb.checked = val; self._updatePermLabel(m.key, val); }
    });
  },

  _guardarPermisos(id) {
    var i = DB.usuarios.findIndex(function(u){ return u.id === id; });
    if (i < 0) return;
    var permisos = {};
    this._MODULOS_PERMISOS.forEach(function(m) {
      permisos[m.key] = document.getElementById('perm_' + m.key)?.checked || false;
    });
    DB.usuarios[i].permisos = permisos;
    this.toast('Permisos de "' + DB.usuarios[i].nombre + '" actualizados', 'success');
    this.closeModal();
    this.renderPage();
  },

  cambiarPassword(id) {
    var u = DB.usuarios.find(function(x){ return x.id === id; });
    this.showModal('Cambiar Contrasena: ' + u.nombre,
      '<div class="form-group mb-3"><label class="form-label">Nueva Contrasena *</label>' +
        '<input class="form-control" id="np_pass" type="password" placeholder="Nueva contrasena" style="font-size:16px;"/></div>' +
      '<div class="form-group"><label class="form-label">Confirmar Contrasena *</label>' +
        '<input class="form-control" id="np_confirm" type="password" placeholder="Repita la contrasena"/></div>',
      [{ text:'Cambiar Contrasena', cls:'btn-primary', cb: function(){
        var pass = document.getElementById('np_pass')?.value || '';
        var conf = document.getElementById('np_confirm')?.value || '';
        if (pass.length < 3) { App.toast('Contrasena muy corta', 'error'); return; }
        if (pass !== conf)   { App.toast('Las contrasenas no coinciden', 'error'); return; }
        var i = DB.usuarios.findIndex(function(x){ return x.id === id; });
        DB.usuarios[i].password = pass;
        App.toast('Contrasena actualizada', 'success');
        App.closeModal();
      }}]
    );
  },

  toggleUsuario(id) {
    var i = DB.usuarios.findIndex(function(u){ return u.id === id; });
    if (i < 0) return;
    DB.usuarios[i].activo = !DB.usuarios[i].activo;
    this.toast('Usuario ' + (DB.usuarios[i].activo ? 'activado' : 'desactivado'), DB.usuarios[i].activo ? 'success' : 'warning');
    this.renderPage();
  },

  eliminarUsuario(id) {
    var u = DB.usuarios.find(function(x){ return x.id === id; });
    if (!u) return;
    if (confirm('Eliminar al usuario "' + u.nombre + '"? Esta accion no se puede deshacer.')) {
      var i = DB.usuarios.findIndex(function(x){ return x.id === id; });
      DB.usuarios.splice(i, 1);
      this.toast('Usuario eliminado', 'warning');
      this.renderPage();
    }
  },

  // ---- TEMA (MODO OSCURO / CLARO) ----
  initTheme() {
    var saved = localStorage.getItem('erp_jumila_theme');
    if (saved === 'dark') {
      document.body.classList.add('dark-mode');
      this._updateThemeLabel(true);
    } else {
      document.body.classList.remove('dark-mode');
      this._updateThemeLabel(false);
    }
  },

  toggleTheme() {
    var isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('erp_jumila_theme', isDark ? 'dark' : 'light');
    this._updateThemeLabel(isDark);
  },

  _updateThemeLabel(isDark) {
    var lbl = document.getElementById('themeLabel');
    if (lbl) lbl.textContent = isDark ? 'Claro' : 'Oscuro';
  }

};

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', function() {
  App.init();
  // Restaurar sesión automáticamente si existe
  var savedId = localStorage.getItem('erp_jumila_uid');
  if (savedId) {
    var u = DB.usuarios.find(function(x){ return x.id === parseInt(savedId) && x.activo; });
    if (u) {
      DB.usuarioActual = u;
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('welcomeName').textContent = u.nombre;
      App.buildSidebar();
      App.navigate('inicio');
      return; // no registrar eventos de login
    } else {
      localStorage.removeItem('erp_jumila_uid'); // sesión inválida, limpiar
    }
  }

  // 1. Restaurar datos guardados (productos, ventas, etc.)
  App._loadDB();

  // 2. Cargar productos desde Google Sheets
  SheetsSync.cargarProductos();

  // 3. Intentar restaurar sesión activa (evita cerrar sesión al recargar)
  var sessionRestored = App._restoreSession();

  // 4. Si no hay sesión guardada, mostrar login normalmente
  if (!sessionRestored) {
    document.getElementById('loginPass')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') App.login();
    });
    document.getElementById('loginUser')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('loginPass')?.focus();
    });
  } else {
    document.getElementById('loginPass')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') App.login();
    });
    document.getElementById('loginUser')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('loginPass')?.focus();
    });
  }

  // 5. Auto-guardar cada 60 segundos en segundo plano
  setInterval(function() {
    try { App._saveDB(); } catch(e) {}
  }, 60000);

  // 6. Guardar antes de cerrar la pestaña
  window.addEventListener('beforeunload', function() {
    try { App._saveDB(); } catch(e) {}
  });
});
