// ============================================================
// MÓDULO: ADMINISTRACIÓN — Versión Profesional Completa
// ============================================================

const AdministracionModule = {

  _tab: 'dashboard',
  _log: [],

  _fechaHoy() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _horaAhora() { return new Date().toTimeString().slice(0,8); },
  _mesActual() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  },

  _addLog(accion, detalle, tipo) {
    this._log.unshift({ accion, detalle, tipo:tipo||'info', fecha:this._fechaHoy(), hora:this._horaAhora(), user:DB.usuarioActual?.usuario||'—' });
    if (this._log.length > 100) this._log.pop();
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Administración', 'PANEL DE CONTROL');

    if (DB.usuarioActual && DB.usuarioActual.rol !== 'admin') {
      return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;text-align:center;">' +
        '<div style="width:80px;height:80px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">' +
          '<i class="fas fa-lock" style="font-size:36px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:20px;font-weight:800;color:var(--gray-800);margin-bottom:8px;">Acceso Restringido</div>' +
        '<div style="font-size:14px;color:var(--gray-500);">Solo los administradores pueden acceder a este módulo.</div>' +
      '</div>';
    }

    var tabs = [
      { id:'dashboard', icon:'fa-tachometer-alt', label:'Dashboard' },
      { id:'usuarios',  icon:'fa-users',          label:'Usuarios' },
      { id:'accesos',   icon:'fa-key',            label:'Permisos' },
      { id:'actividad', icon:'fa-history',         label:'Actividad' },
      { id:'auditoria', icon:'fa-clipboard-list',  label:'Auditoría' },
    ];

    var self = this;
    var tabsHTML = '<div style="display:flex;gap:4px;background:var(--gray-100);padding:5px;border-radius:12px;margin-bottom:20px;flex-wrap:wrap;">' +
      tabs.map(function(t) {
        var act = self._tab === t.id;
        return '<button onclick="AdministracionModule._setTab(\''+t.id+'\')" ' +
          'style="display:flex;align-items:center;gap:7px;padding:8px 16px;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap;' +
          'background:'+(act?'white':'transparent')+';color:'+(act?'var(--accent)':'var(--gray-500)')+';box-shadow:'+(act?'0 1px 6px rgba(0,0,0,0.1)':'none')+'">' +
          '<i class="fas '+t.icon+'" style="font-size:12px;"></i>'+t.label+'</button>';
      }).join('') +
    '</div>';

    return '<div class="page-header"><div>' +
      '<h2 class="page-title"><i class="fas fa-user-shield" style="color:var(--accent);margin-right:8px;"></i>Administración</h2>' +
      '<p class="text-muted text-sm">Panel de control del sistema · '+this._fechaHoy()+'</p>' +
    '</div></div>' + tabsHTML +
    '<div id="adminContent">'+this._renderTab()+'</div>';
  },

  _setTab(id) { this._tab=id; App.renderPage(); },

  _renderTab() {
    switch(this._tab) {
      case 'dashboard': return this._tabDashboard();
      case 'usuarios':  return this._tabUsuarios();
      case 'accesos':   return this._tabAccesos();
      case 'actividad': return this._tabActividad();
      case 'auditoria': return this._tabAuditoria();
      default:          return this._tabDashboard();
    }
  },

  // ──────────────────────────────────────────────────────
  // TAB: DASHBOARD
  // ──────────────────────────────────────────────────────
  _tabDashboard() {
    var hoy    = this._fechaHoy();
    var mes    = this._mesActual();
    var ventas = DB.ventas||[], prods = DB.productos||[], clts = DB.clientes||[], usrs = DB.usuarios||[];
    var vHoy   = ventas.filter(function(v){return v.fecha===hoy;});
    var vMes   = ventas.filter(function(v){return (v.fecha||'').startsWith(mes);});
    var tHoy   = vHoy.reduce(function(s,v){return s+v.total;},0);
    var tMes   = vMes.reduce(function(s,v){return s+v.total;},0);
    var tGen   = ventas.reduce(function(s,v){return s+v.total;},0);
    var sinStk = prods.filter(function(p){return (p.stock||0)===0;}).length;
    var bajStk = prods.filter(function(p){return (p.stock||0)>0&&(p.stock||0)<=10;}).length;
    var activos= usrs.filter(function(u){return u.activo!==false;}).length;

    var kpis = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">' +
      [
        {l:'Ventas Hoy',     v:'S/ '+tHoy.toFixed(2),  s:vHoy.length+' transacciones',    i:'fa-shopping-cart',       c:'#16a34a',bg:'#f0fdf4'},
        {l:'Ventas del Mes', v:'S/ '+tMes.toFixed(2),  s:vMes.length+' transacciones',    i:'fa-calendar-check',      c:'#2563eb',bg:'#eff6ff'},
        {l:'Total General',  v:'S/ '+tGen.toFixed(2),  s:ventas.length+' comprobantes',   i:'fa-chart-line',          c:'#7c3aed',bg:'#f5f3ff'},
        {l:'Alertas Stock',  v:sinStk+' agotados',     s:bajStk+' bajo mínimo',           i:'fa-exclamation-triangle',c:'#d97706',bg:'#fffbeb'},
      ].map(function(k){
        return '<div class="stat-card" style="border-left:4px solid '+k.c+';">' +
          '<div class="stat-icon" style="background:'+k.bg+';color:'+k.c+'"><i class="fas '+k.i+'"></i></div>' +
          '<div class="stat-info"><div class="stat-value" style="color:'+k.c+';font-size:15px;">'+k.v+'</div>' +
          '<div class="stat-label">'+k.l+'</div><div style="font-size:10px;color:var(--gray-400);margin-top:2px;">'+k.s+'</div></div></div>';
      }).join('')+'</div>';

    // Uso de almacenamiento
    var uB=0; try{Object.keys(localStorage).forEach(function(k){uB+=(localStorage.getItem(k)||'').length*2;});}catch(e){}
    var uMB=(uB/1048576).toFixed(2), uPct=Math.min(100,(uB/5242880*100)).toFixed(0);

    var estadoCard = '<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;"><i class="fas fa-server" style="color:#2563eb;font-size:13px;"></i></div>' +
          '<div style="font-size:14px;font-weight:800;">Estado del Sistema</div>' +
        '</div>' +
        '<span style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#16a34a;"><span style="width:8px;height:8px;border-radius:50%;background:#16a34a;display:inline-block;box-shadow:0 0 6px rgba(22,163,74,0.6);"></span>Operativo</span>' +
      '</div>' +
      '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
        '<div>' +
          [
            {l:'Ventas',c:'#16a34a',n:ventas.length},
            {l:'Productos',c:'#2563eb',n:prods.length},
            {l:'Clientes',c:'#7c3aed',n:clts.filter(function(c){return c.tipo_cliente==='cliente';}).length},
            {l:'Usuarios activos',c:'#d97706',n:activos},
          ].map(function(b){
            return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;">' +
              '<span style="font-size:12px;font-weight:700;color:var(--gray-700);">'+b.l+'</span>' +
              '<span style="font-size:12px;font-weight:900;color:'+b.c+';">'+b.n+'</span></div>' +
              '<div style="height:5px;background:var(--gray-200);border-radius:3px;"><div style="height:100%;width:100%;background:'+b.c+';border-radius:3px;"></div></div></div>';
          }).join('') +
        '</div>' +
        '<div>' +
          '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;">' +
            '<span style="font-size:12px;font-weight:700;color:var(--gray-700);">Almacenamiento</span>' +
            '<span style="font-size:12px;font-weight:700;">'+uMB+' / 5 MB</span></div>' +
            '<div style="height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden;">' +
              '<div style="height:100%;width:'+uPct+'%;background:linear-gradient(90deg,'+(uPct>80?'#dc2626':'#2563eb')+','+(uPct>80?'#ef4444':'#7c3aed')+');border-radius:4px;"></div></div>' +
            '<div style="font-size:10px;color:var(--gray-400);margin-top:3px;">'+uPct+'% utilizado</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
            [
              {l:'Empresa', v:DB.empresa?.nombre||'—',  i:'fa-building',c:'#2563eb'},
              {l:'Sucursal',v:DB.empresa?.sucursal||'—',i:'fa-store',   c:'#16a34a'},
              {l:'RUC',     v:DB.empresa?.ruc||'—',     i:'fa-id-card', c:'#7c3aed'},
              {l:'Moneda',  v:DB.empresa?.moneda||'SOLES',i:'fa-coins', c:'#d97706'},
            ].map(function(i){
              return '<div style="padding:8px;background:var(--gray-50);border-radius:7px;">' +
                '<div style="font-size:9px;font-weight:800;color:var(--gray-400);text-transform:uppercase;"><i class="fas '+i.i+'" style="color:'+i.c+';margin-right:3px;"></i>'+i.l+'</div>' +
                '<div style="font-size:11px;font-weight:700;color:var(--gray-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">'+i.v+'</div></div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div></div>';

    // Top productos del mes
    var topP = {};
    vMes.forEach(function(v){ (v.items||[]).forEach(function(it){ if(!topP[it.nombre]) topP[it.nombre]={q:0,t:0}; topP[it.nombre].q+=it.cantidad||1; topP[it.nombre].t+=it.total||0; }); });
    var topList = Object.entries(topP).sort(function(a,b){return b[1].t-a[1].t;}).slice(0,5);

    var bottom = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;gap:8px;">' +
          '<div style="width:28px;height:28px;border-radius:7px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;"><i class="fas fa-star" style="color:#7c3aed;font-size:11px;"></i></div>' +
          '<div style="font-size:13px;font-weight:800;">Top Productos del Mes</div>' +
        '</div>' +
        '<div style="padding:12px 16px;">' +
          (topList.length===0?'<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:12px;">Sin ventas este mes</div>':
          topList.map(function(p,i){
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100);">' +
              '<div style="width:22px;height:22px;border-radius:6px;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0;">'+(i+1)+'</div>' +
              '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p[0]+'</div>' +
              '<div style="font-size:10px;color:var(--gray-400);">'+p[1].q+' uds</div></div>' +
              '<div style="font-size:13px;font-weight:900;color:#16a34a;">S/ '+p[1].t.toFixed(2)+'</div></div>';
          }).join('')) +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<div style="width:28px;height:28px;border-radius:7px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;"><i class="fas fa-receipt" style="color:#16a34a;font-size:11px;"></i></div>' +
            '<div style="font-size:13px;font-weight:800;">Últimas Ventas</div>' +
          '</div>' +
          '<button onclick="App.navigate(\'ventas\')" style="font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:700;">Ver todas →</button>' +
        '</div>' +
        '<div style="padding:0;">' +
          (ventas.length===0?'<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:12px;">Sin ventas</div>':
          ventas.slice(0,6).map(function(v){
            var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--gray-100);">' +
              '<div style="width:32px;height:32px;border-radius:8px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-shopping-cart" style="color:#16a34a;font-size:11px;"></i></div>' +
              '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:700;">'+v.serie+'-'+v.numero+'</div>' +
              '<div style="font-size:10px;color:var(--gray-400);">'+v.fecha+' · '+(cli?cli.nombre.substring(0,20):'—')+'</div></div>' +
              '<div style="text-align:right;"><div style="font-size:13px;font-weight:900;color:#16a34a;">S/ '+v.total.toFixed(2)+'</div>' +
              '<div style="font-size:10px;color:var(--gray-400);">'+v.metodo_pago+'</div></div></div>';
          }).join('')) +
        '</div>' +
      '</div></div>';

    return kpis + estadoCard + bottom;
  },

  // ──────────────────────────────────────────────────────
  // TAB: USUARIOS
  // ──────────────────────────────────────────────────────
  _tabUsuarios() {
    var usuarios = DB.usuarios||[];
    var filas = usuarios.map(function(u) {
      var esAdmin = u.rol==='admin'||u.permisos==='todos';
      var esActual= DB.usuarioActual&&DB.usuarioActual.id===u.id;
      var c = esAdmin?'#7c3aed':'#2563eb';
      return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:12px 16px;"><div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:40px;height:40px;border-radius:11px;background:'+c+';color:white;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;flex-shrink:0;">'+(u.nombre[0]||'?').toUpperCase()+'</div>' +
          '<div><div style="font-size:13px;font-weight:800;">'+u.nombre+'</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">@'+u.usuario+(esActual?'&nbsp;<span style="color:#d97706;font-weight:700;">TÚ</span>':'')+'</div></div>' +
        '</div></td>' +
        '<td style="padding:12px 8px;"><span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(esAdmin?'#f5f3ff':'#eff6ff')+';color:'+c+';border:1px solid '+(esAdmin?'#c4b5fd':'#93c5fd')+'">'+(esAdmin?'👑 ADMIN':'👤 CAJERO')+'</span></td>' +
        '<td style="padding:12px 8px;font-size:12px;color:var(--gray-600);">'+(u.cargo||'—')+'</td>' +
        '<td style="padding:12px 8px;font-size:12px;color:var(--gray-500);">'+(u.sucursal||'—')+'</td>' +
        '<td style="padding:12px 8px;font-size:11px;color:var(--gray-400);">'+(u.fechaCreacion||'—')+'</td>' +
        '<td style="padding:12px 8px;"><span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(u.activo!==false?'#f0fdf4':'#fef2f2')+';color:'+(u.activo!==false?'#16a34a':'#dc2626')+'">'+(u.activo!==false?'● ACTIVO':'● INACTIVO')+'</span></td>' +
        '<td style="padding:12px 16px;"><div style="display:flex;gap:5px;justify-content:flex-end;">' +
          '<button onclick="AdministracionModule._verUsuario('+u.id+')" title="Ver" style="width:30px;height:30px;border-radius:7px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:13px;"><i class="fas fa-eye"></i></button>' +
          '<button onclick="AdministracionModule._editarUsuario('+u.id+')" title="Editar" style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:13px;"><i class="fas fa-edit"></i></button>' +
          '<button onclick="AdministracionModule._gestionPermisos('+u.id+')" title="Permisos" style="width:30px;height:30px;border-radius:7px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:13px;"><i class="fas fa-key"></i></button>' +
          '<button onclick="AdministracionModule._resetPass('+u.id+')" title="Contraseña" style="width:30px;height:30px;border-radius:7px;border:none;background:#fef3c7;color:#d97706;cursor:pointer;font-size:13px;"><i class="fas fa-lock"></i></button>' +
          (!esActual?'<button onclick="AdministracionModule._toggleUser('+u.id+')" title="'+(u.activo!==false?'Desactivar':'Activar')+'" style="width:30px;height:30px;border-radius:7px;border:none;background:'+(u.activo!==false?'#fef2f2':'#f0fdf4')+';color:'+(u.activo!==false?'#dc2626':'#16a34a')+';cursor:pointer;font-size:13px;"><i class="fas '+(u.activo!==false?'fa-user-slash':'fa-user-check')+'"></i></button>':'')+
          (!esActual?'<button onclick="AdministracionModule._eliminarUsuario('+u.id+')" title="Eliminar" style="width:30px;height:30px;border-radius:7px;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;font-size:13px;"><i class="fas fa-trash"></i></button>':'')+
        '</div></td></tr>';
    }).join('');

    return '<div class="card">' +
      '<div style="padding:16px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div><div style="font-size:15px;font-weight:800;">Usuarios del Sistema</div>' +
        '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">'+usuarios.length+' usuarios · '+usuarios.filter(function(u){return u.activo!==false;}).length+' activos</div></div>' +
        '<button onclick="AdministracionModule._nuevoUsuario()" style="padding:9px 18px;background:var(--accent);color:white;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;">' +
          '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Crear Usuario</button>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Usuario</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Rol</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cargo</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Sucursal</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Creado</th>' +
            '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
            '<th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
          '</tr></thead><tbody>'+filas+'</tbody></table></div></div>';
  },

  _verUsuario(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    var c=u.rol==='admin'?'#7c3aed':'#2563eb';
    var ventas=(DB.ventas||[]).filter(function(v){return v.cajero===u.usuario||v.responsable===u.usuario;});
    var total=ventas.reduce(function(s,v){return s+v.total;},0);
    var perms=u.permisos;
    var permList=perms==='todos'
      ?'<span style="padding:3px 10px;background:#f0fdf4;border-radius:10px;font-size:11px;font-weight:700;color:#16a34a;">✅ Acceso total al sistema</span>'
      :Object.entries(perms||{}).filter(function(p){return p[1];}).map(function(p){
        return '<span style="padding:2px 8px;background:var(--gray-100);border-radius:10px;font-size:10px;font-weight:600;color:var(--gray-600);">'+p[0]+'</span>';
      }).join(' ')||'<span style="color:var(--gray-400);font-size:12px;">Sin permisos asignados</span>';

    App.showModal('👤 Perfil de Usuario',
      '<div style="background:linear-gradient(135deg,'+c+'22,'+c+'08);border-radius:14px;padding:20px;margin-bottom:16px;border:1.5px solid '+c+'33;">' +
        '<div style="display:flex;align-items:center;gap:14px;">' +
          '<div style="width:60px;height:60px;border-radius:16px;background:'+c+';color:white;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;">'+(u.nombre[0]||'?').toUpperCase()+'</div>' +
          '<div><div style="font-size:18px;font-weight:900;">'+u.nombre+'</div>' +
          '<div style="font-size:12px;color:var(--gray-500);margin-top:2px;">@'+u.usuario+' · '+u.cargo+'</div>' +
          '<span style="display:inline-block;margin-top:5px;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:800;background:'+(u.rol==='admin'?'#f5f3ff':'#eff6ff')+';color:'+c+'">'+(u.rol==='admin'?'👑 ADMINISTRADOR':'👤 CAJERO')+'</span></div>' +
          '<span style="margin-left:auto;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:'+(u.activo!==false?'#f0fdf4':'#fef2f2')+';color:'+(u.activo!==false?'#16a34a':'#dc2626')+'">'+(u.activo!==false?'● ACTIVO':'● INACTIVO')+'</span>' +
        '</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">' +
        '<div style="padding:12px;background:var(--gray-50);border-radius:10px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Sucursal</div><div style="font-size:13px;font-weight:700;">'+(u.sucursal||'—')+'</div></div>' +
        '<div style="padding:12px;background:var(--gray-50);border-radius:10px;"><div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:3px;">Creado</div><div style="font-size:13px;font-weight:700;">'+(u.fechaCreacion||'—')+'</div></div>' +
      '</div>' +
      (ventas.length>0?
        '<div style="padding:14px;background:#f0fdf4;border-radius:10px;border:1px solid #86efac;margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:800;color:#16a34a;margin-bottom:8px;"><i class="fas fa-shopping-cart" style="margin-right:5px;"></i>ACTIVIDAD EN VENTAS</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
            '<div style="text-align:center;"><div style="font-size:22px;font-weight:900;color:#15803d;">'+ventas.length+'</div><div style="font-size:10px;color:#16a34a;">Ventas</div></div>' +
            '<div style="text-align:center;"><div style="font-size:22px;font-weight:900;color:#15803d;">S/ '+total.toFixed(2)+'</div><div style="font-size:10px;color:#16a34a;">Total</div></div>' +
          '</div></div>':'') +
      '<div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">Permisos</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;">'+permList+'</div>',
      [
        {text:'✏️ Editar', cls:'btn-primary', cb:function(){App.closeModal();AdministracionModule._editarUsuario(id);}},
        {text:'🔑 Permisos', cls:'btn-outline', cb:function(){App.closeModal();AdministracionModule._gestionPermisos(id);}},
      ]
    );
    document.getElementById('modalBox').style.maxWidth='500px';
  },

  _formUsuario(u) {
    u=u||{};
    return '<div class="form-grid">' +
      '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre completo *</label><input class="form-control" id="au_n" value="'+(u.nombre||'')+'" placeholder="Juan Pérez" autofocus/></div>' +
      '<div class="form-group"><label class="form-label">Usuario (login) *</label><input class="form-control" id="au_u" value="'+(u.usuario||'')+'" placeholder="juanperez"/></div>' +
      '<div class="form-group"><label class="form-label">Rol</label><select class="form-control" id="au_r"><option value="admin"'+(u.rol==='admin'?' selected':'')+'>👑 Administrador</option><option value="cajero"'+(u.rol!=='admin'?' selected':'')+'>👤 Cajero</option></select></div>' +
      '<div class="form-group"><label class="form-label">Cargo</label><input class="form-control" id="au_c" value="'+(u.cargo||'')+'" placeholder="Cajero, Vendedor..."/></div>' +
      '<div class="form-group"><label class="form-label">Sucursal</label><input class="form-control" id="au_s" value="'+(u.sucursal||DB.empresa?.sucursal||'')+'"/></div>' +
    '</div>';
  },

  _nuevoUsuario() {
    App.showModal('➕ Crear Nuevo Usuario',
      this._formUsuario()+
      '<div class="form-group" style="margin-top:12px;"><label class="form-label">Contraseña *</label>' +
        '<div style="position:relative;"><input class="form-control" id="au_p" type="password" placeholder="Mínimo 6 caracteres" style="padding-right:38px;"/>' +
        '<button type="button" onclick="var i=document.getElementById(\'au_p\');var ic=this.querySelector(\'i\');i.type=i.type===\'password\'?\'text\':\'password\';ic.className=i.type===\'password\'?\'fas fa-eye\':\'fas fa-eye-slash\'" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye"></i></button></div></div>',
      [{text:'💾 Crear',cls:'btn-primary',cb:function(){AdministracionModule._guardarUsuario(null);}}]
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  _editarUsuario(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    App.showModal('✏️ Editar — '+u.nombre, this._formUsuario(u),
      [{text:'💾 Guardar',cls:'btn-primary',cb:function(){AdministracionModule._guardarUsuario(id);}}]
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  _guardarUsuario(id) {
    var n=(document.getElementById('au_n')?.value||'').trim();
    var u=(document.getElementById('au_u')?.value||'').trim();
    var r=document.getElementById('au_r')?.value||'cajero';
    var c=(document.getElementById('au_c')?.value||'').trim();
    var s=(document.getElementById('au_s')?.value||'').trim();
    var p=(document.getElementById('au_p')?.value||'').trim();
    if(!n){App.toast('El nombre es obligatorio','error');return;}
    if(!u){App.toast('El usuario es obligatorio','error');return;}
    if(!id&&!p){App.toast('La contraseña es obligatoria','error');return;}
    if(!id&&p.length<6){App.toast('Contraseña mínimo 6 caracteres','error');return;}
    var dup=(DB.usuarios||[]).find(function(x){return x.usuario===u&&x.id!==id;});
    if(dup){App.toast('Ese usuario ya existe','error');return;}
    if(!DB.usuarios)DB.usuarios=[];
    if(id){
      var i=DB.usuarios.findIndex(function(x){return x.id===id;});
      if(i>=0)Object.assign(DB.usuarios[i],{nombre:n,usuario:u,rol:r,cargo:c,sucursal:s});
      this._addLog('Editar usuario','@'+u,'edit');
      App.toast('✅ Usuario actualizado','success');
    } else {
      var nid=DB.usuarios.length>0?Math.max.apply(null,DB.usuarios.map(function(x){return x.id;}))+1:1;
      DB.usuarios.push({id:nid,nombre:n,usuario:u,password:p,rol:r,cargo:c,sucursal:s,activo:true,fechaCreacion:this._fechaHoy(),
        permisos:r==='admin'?'todos':{inicio:true,pos:true,ventas:true,caja:true,clientes:true,productos:true}});
      this._addLog('Crear usuario','@'+u+' ('+r+')','success');
      App.toast('✅ Usuario creado','success');
    }
    App.closeModal(); App.renderPage();
  },

  _resetPass(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    App.showModal('🔑 Contraseña — '+u.nombre,
      '<div class="form-group"><label class="form-label">Nueva contraseña *</label>' +
        '<div style="position:relative;"><input class="form-control" id="rp_n" type="password" placeholder="Mínimo 6 caracteres" style="padding-right:38px;" autofocus/>' +
        '<button type="button" onclick="var i=document.getElementById(\'rp_n\');i.type=i.type===\'password\'?\'text\':\'password\'" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye"></i></button></div></div>' +
      '<div class="form-group" style="margin-top:12px;"><label class="form-label">Confirmar *</label><input class="form-control" id="rp_c" type="password" placeholder="Repite la contraseña"/></div>',
      [{text:'🔑 Cambiar',cls:'btn-primary',cb:function(){
        var n=document.getElementById('rp_n')?.value||'', c=document.getElementById('rp_c')?.value||'';
        if(n.length<6){App.toast('Mínimo 6 caracteres','error');return;}
        if(n!==c){App.toast('Las contraseñas no coinciden','error');return;}
        var i=(DB.usuarios||[]).findIndex(function(x){return x.id===id;});
        if(i>=0)DB.usuarios[i].password=n;
        AdministracionModule._addLog('Cambio contraseña','@'+u.usuario,'warning');
        App.toast('✅ Contraseña actualizada','success'); App.closeModal();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='380px';
  },

  _toggleUser(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    u.activo=u.activo===false;
    this._addLog(u.activo?'Activar usuario':'Desactivar usuario','@'+u.usuario,u.activo?'success':'warning');
    App.toast(u.activo?'✅ Usuario activado':'⚠️ Desactivado',u.activo?'success':'warning');
    App.renderPage();
  },

  _eliminarUsuario(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    App.showModal('🗑️ Eliminar Usuario',
      '<div style="text-align:center;padding:10px 0;">' +
        '<div style="width:54px;height:54px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><i class="fas fa-user-times" style="font-size:22px;color:#dc2626;"></i></div>' +
        '<div style="font-size:15px;font-weight:800;margin-bottom:6px;">¿Eliminar usuario?</div>' +
        '<div style="font-size:14px;color:var(--gray-600);margin-bottom:12px;"><strong>'+u.nombre+'</strong> (@'+u.usuario+')</div>' +
        '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">Esta acción no se puede deshacer.</div>' +
      '</div>',
      [{text:'🗑️ Eliminar',cls:'btn-danger',cb:function(){
        var i=(DB.usuarios||[]).findIndex(function(x){return x.id===id;});
        if(i>=0)DB.usuarios.splice(i,1);
        AdministracionModule._addLog('Eliminar usuario','@'+u.usuario,'danger');
        App.toast('🗑️ Usuario eliminado','warning');
        App.closeModal(); App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='400px';
  },

  // ──────────────────────────────────────────────────────
  // TAB: ACCESOS Y PERMISOS (MATRIZ)
  // ──────────────────────────────────────────────────────
  _tabAccesos() {
    var cajeros = (DB.usuarios||[]).filter(function(u){return u.rol!=='admin'&&u.permisos!=='todos';});
    var mods = [
      {k:'inicio',l:'Inicio',g:'Principal'},{k:'pos',l:'POS',g:'Principal'},
      {k:'ventas',l:'Ventas',g:'Ventas'},{k:'cotizaciones',l:'Cotizaciones',g:'Ventas'},
      {k:'notascredito',l:'Notas Crédito',g:'Ventas'},{k:'clientes',l:'Clientes',g:'Clientes'},
      {k:'tickets',l:'Tickets',g:'Clientes'},{k:'productos',l:'Productos',g:'Catálogo'},
      {k:'precios',l:'Precios',g:'Catálogo'},{k:'inventario',l:'Inventario',g:'Almacén'},
      {k:'kardex',l:'Kardex',g:'Almacén'},{k:'compras',l:'Compras',g:'Compras'},
      {k:'caja',l:'Caja',g:'Finanzas'},{k:'finanzas',l:'Finanzas',g:'Finanzas'},
      {k:'reportes',l:'Reportes',g:'Gestión'},{k:'agenda',l:'Agenda',g:'Gestión'},
      {k:'herramientas',l:'Herramientas',g:'Gestión'},{k:'soporte',l:'Soporte',g:'Sistema'},
    ];

    if(cajeros.length===0) {
      return '<div class="card"><div style="text-align:center;padding:48px;color:var(--gray-400);">' +
        '<i class="fas fa-key" style="font-size:36px;display:block;margin-bottom:12px;opacity:0.3;"></i>' +
        '<div style="font-size:14px;font-weight:700;">No hay usuarios cajero para configurar</div>' +
        '<div style="font-size:12px;margin-top:4px;">Los administradores tienen acceso total automático</div>' +
        '<button onclick="AdministracionModule._setTab(\'usuarios\')" style="margin-top:14px;padding:9px 18px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Crear un usuario cajero</button>' +
      '</div></div>';
    }

    return '<div class="card">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Matriz de Permisos</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">Clic en cada celda para activar o desactivar el permiso al instante</div>' +
      '</div>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;">' +
        '<thead><tr style="background:var(--gray-50);">' +
          '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-600);min-width:130px;position:sticky;left:0;background:var(--gray-50);z-index:2;">Módulo</th>' +
          cajeros.map(function(u){
            return '<th style="padding:8px;text-align:center;min-width:80px;">' +
              '<div style="width:28px;height:28px;border-radius:7px;background:#2563eb;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;margin:0 auto 3px;font-size:12px;">'+(u.nombre[0]||'?').toUpperCase()+'</div>' +
              '<div style="font-size:10px;font-weight:700;color:var(--gray-600);">@'+u.usuario+'</div></th>';
          }).join('') +
        '</tr></thead><tbody>' +
        mods.map(function(m,idx){
          return '<tr style="'+(idx%2===0?'background:var(--gray-50);':'background:white;')+'">' +
            '<td style="padding:8px 14px;font-size:12px;font-weight:700;color:var(--gray-700);position:sticky;left:0;background:'+(idx%2===0?'var(--gray-50)':'white')+';z-index:1;">' +
              '<span style="font-size:9px;color:var(--gray-400);display:block;margin-bottom:1px;">'+m.g+'</span>'+m.l+'</td>' +
            cajeros.map(function(u){
              var on=(u.permisos||{})[m.k]===true;
              return '<td style="padding:6px;text-align:center;">' +
                '<div onclick="AdministracionModule._toggleCelda('+u.id+',\''+m.k+'\')" id="mc_'+u.id+'_'+m.k+'" ' +
                  'style="width:28px;height:28px;border-radius:7px;margin:0 auto;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;' +
                  'background:'+(on?'#16a34a':'var(--gray-200)')+';box-shadow:'+(on?'0 2px 6px rgba(22,163,74,0.4)':'none')+'">' +
                  (on?'<i class="fas fa-check" style="font-size:10px;color:white;"></i>':'')+'</div></td>';
            }).join('') +
          '</tr>';
        }).join('') +
        '</tbody></table></div></div>';
  },

  _toggleCelda(userId, mod) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===userId;}); if(!u||!u.permisos||u.permisos==='todos')return;
    u.permisos[mod]=!u.permisos[mod];
    var on=u.permisos[mod];
    var cel=document.getElementById('mc_'+userId+'_'+mod);
    if(cel){cel.style.background=on?'#16a34a':'var(--gray-200)';cel.style.boxShadow=on?'0 2px 6px rgba(22,163,74,0.4)':'none';cel.innerHTML=on?'<i class="fas fa-check" style="font-size:10px;color:white;"></i>':'';}
    App.toast((on?'✅ Permiso activado':'⛔ Permiso revocado')+': '+mod+' → @'+u.usuario,on?'success':'warning');
  },

  _permMods: null,
  _gestionPermisos(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    if(u.permisos==='todos'){App.toast('Administrador: acceso total al sistema','info');return;}
    var perms=u.permisos||{};
    var mods=[
      {k:'inicio',l:'Inicio'},{k:'pos',l:'POS'},{k:'ventas',l:'Ventas'},
      {k:'cotizaciones',l:'Cotizaciones'},{k:'clientes',l:'Clientes'},{k:'productos',l:'Productos'},
      {k:'inventario',l:'Inventario'},{k:'compras',l:'Compras'},{k:'caja',l:'Caja'},
      {k:'reportes',l:'Reportes'},{k:'kardex',l:'Kardex'},{k:'agenda',l:'Agenda'},
      {k:'tickets',l:'Tickets'},{k:'precios',l:'Precios'},{k:'configuracion',l:'Config.'},{k:'soporte',l:'Soporte'},
    ];
    this._permMods=mods;
    App.showModal('🔑 Permisos — '+u.nombre,
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div style="font-size:12px;font-weight:700;color:var(--gray-600);">Módulos de @'+u.usuario+'</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button onclick="AdministracionModule._allPerms(true)" style="padding:4px 10px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Todo</button>' +
          '<button onclick="AdministracionModule._allPerms(false)" style="padding:4px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Nada</button>' +
        '</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
        mods.map(function(m){
          var on=perms[m.k]===true;
          return '<div id="pb_'+m.k+'" onclick="AdministracionModule._togPerm(\''+m.k+'\')" ' +
            'style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;border:1.5px solid '+(on?'#86efac':'var(--gray-200)')+';background:'+(on?'#f0fdf4':'white')+';cursor:pointer;transition:all 0.15s;">' +
            '<div style="width:18px;height:18px;border-radius:4px;background:'+(on?'#16a34a':'var(--gray-200)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+(on?'<i class="fas fa-check" style="font-size:9px;color:white;"></i>':'')+'</div>' +
            '<span style="font-size:12px;font-weight:600;color:'+(on?'#15803d':'var(--gray-600)')+';">'+m.l+'</span></div>';
        }).join('')+'</div>',
      [{text:'💾 Guardar',cls:'btn-primary',cb:function(){
        var idx=(DB.usuarios||[]).findIndex(function(x){return x.id===id;});
        if(idx<0)return;
        var np={};
        mods.forEach(function(m){var b=document.getElementById('pb_'+m.k);np[m.k]=b?b.style.background.includes('240, 253, 244'):false;});
        DB.usuarios[idx].permisos=np;
        AdministracionModule._addLog('Actualizar permisos','@'+u.usuario,'edit');
        App.toast('✅ Permisos guardados para @'+u.usuario,'success'); App.closeModal();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='460px';
  },

  _togPerm(k){
    var b=document.getElementById('pb_'+k); if(!b)return;
    var on=b.style.background.includes('240, 253, 244');
    b.style.background=!on?'#f0fdf4':'white'; b.style.borderColor=!on?'#86efac':'var(--gray-200)';
    var d=b.querySelector('div'); if(d){d.style.background=!on?'#16a34a':'var(--gray-200)';d.innerHTML=!on?'<i class="fas fa-check" style="font-size:9px;color:white;"></i>':'';}
    var sp=b.querySelector('span'); if(sp)sp.style.color=!on?'#15803d':'var(--gray-600)';
  },

  _allPerms(v){
    (this._permMods||[]).forEach(function(m){
      var b=document.getElementById('pb_'+m.k); if(!b)return;
      b.style.background=v?'#f0fdf4':'white'; b.style.borderColor=v?'#86efac':'var(--gray-200)';
      var d=b.querySelector('div'); if(d){d.style.background=v?'#16a34a':'var(--gray-200)';d.innerHTML=v?'<i class="fas fa-check" style="font-size:9px;color:white;"></i>':'';}
      var sp=b.querySelector('span'); if(sp)sp.style.color=v?'#15803d':'var(--gray-600)';
    });
  },

  // ──────────────────────────────────────────────────────
  // TAB: ACTIVIDAD
  // ──────────────────────────────────────────────────────
  _tabActividad() {
    var hoy=this._fechaHoy(), ventas=DB.ventas||[];
    var vHoy=ventas.filter(function(v){return v.fecha===hoy;});

    var porUser={};
    vHoy.forEach(function(v){var k=v.cajero||v.responsable||'Sistema';if(!porUser[k]){porUser[k]={n:0,t:0};}porUser[k].n++;porUser[k].t+=v.total||0;});

    var actBox='<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Actividad de Hoy — '+hoy+'</div>' +
        '<div style="font-size:11px;color:var(--gray-400);">'+vHoy.length+' transacciones registradas</div>' +
      '</div>' +
      '<div style="padding:16px;">' +
        (Object.keys(porUser).length===0?
          '<div style="text-align:center;padding:24px;color:var(--gray-400);"><i class="fas fa-moon" style="font-size:28px;display:block;margin-bottom:8px;opacity:0.3;"></i>Sin actividad hoy</div>':
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">' +
            Object.entries(porUser).map(function(e){
              return '<div style="padding:14px;background:var(--gray-50);border-radius:10px;border-left:4px solid var(--accent);">' +
                '<div style="font-size:13px;font-weight:800;margin-bottom:6px;"><i class="fas fa-user" style="color:var(--accent);margin-right:6px;"></i>@'+e[0]+'</div>' +
                '<div style="font-size:20px;font-weight:900;color:#16a34a;">S/ '+e[1].t.toFixed(2)+'</div>' +
                '<div style="font-size:11px;color:var(--gray-400);">'+e[1].n+' venta(s)</div></div>';
            }).join('')+
          '</div>'
        ) +
      '</div></div>';

    var timeline='<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Timeline de Ventas</div>' +
        '<div style="font-size:11px;color:var(--gray-400);">Últimas 10 transacciones</div>' +
      '</div>' +
      '<div style="padding:16px;">' +
        (ventas.length===0?'<div style="text-align:center;padding:24px;color:var(--gray-400);">Sin ventas registradas</div>':
          '<div style="position:relative;padding-left:20px;">' +
            '<div style="position:absolute;left:7px;top:0;bottom:0;width:2px;background:var(--gray-200);"></div>' +
            ventas.slice(0,10).map(function(v,i){
              var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
              var cols=['#16a34a','#2563eb','#7c3aed','#d97706','#dc2626'];
              var c=cols[i%cols.length];
              return '<div style="position:relative;margin-bottom:10px;">' +
                '<div style="position:absolute;left:-16px;top:4px;width:10px;height:10px;border-radius:50%;background:'+c+';border:2px solid white;box-shadow:0 0 0 2px '+c+'44;"></div>' +
                '<div style="padding:10px 12px;background:var(--gray-50);border-radius:8px;border-left:3px solid '+c+';">' +
                  '<div style="display:flex;justify-content:space-between;">' +
                    '<div style="font-size:12px;font-weight:700;">'+v.serie+'-'+v.numero+'</div>' +
                    '<div style="font-size:13px;font-weight:900;color:'+c+';">S/ '+v.total.toFixed(2)+'</div></div>' +
                  '<div style="font-size:10px;color:var(--gray-400);margin-top:2px;">'+v.fecha+' '+v.hora+' · '+(cli?cli.nombre.substring(0,25):'—')+' · '+v.metodo_pago+'</div>' +
                '</div></div>';
            }).join('') +
          '</div>'
        )+'</div></div>';

    var logBox='<div class="card">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Log de Administración</div>' +
        '<div style="font-size:11px;color:var(--gray-400);">Acciones de esta sesión</div>' +
      '</div>' +
      '<div style="padding:12px 16px;">' +
        (this._log.length===0?
          '<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:12px;"><i class="fas fa-clipboard" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3;"></i>Sin acciones registradas en esta sesión</div>':
          this._log.map(function(e){
            var im={success:'fa-check-circle',edit:'fa-edit',warning:'fa-exclamation-triangle',danger:'fa-times-circle',info:'fa-info-circle'};
            var cm={success:'#16a34a',edit:'#2563eb',warning:'#d97706',danger:'#dc2626',info:'#6b7280'};
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--gray-100);">' +
              '<div style="width:28px;height:28px;border-radius:7px;background:'+(cm[e.tipo]||'#6b7280')+'18;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas '+(im[e.tipo]||'fa-info-circle')+'" style="color:'+(cm[e.tipo]||'#6b7280')+';font-size:12px;"></i></div>' +
              '<div style="flex:1;"><div style="font-size:12px;font-weight:700;">'+e.accion+'</div><div style="font-size:10px;color:var(--gray-400);">'+e.detalle+'</div></div>' +
              '<div style="font-size:10px;color:var(--gray-400);text-align:right;">'+e.hora+'<br>@'+e.user+'</div></div>';
          }).join('')
        ) +
      '</div></div>';

    return actBox+timeline+logBox;
  },

  // ──────────────────────────────────────────────────────
  // TAB: AUDITORÍA
  // ──────────────────────────────────────────────────────
  _tabAuditoria() {
    var hoy=this._fechaHoy(), ventas=DB.ventas||[], prods=DB.productos||[];

    // Ventas por método de pago
    var porMetodo={};
    ventas.forEach(function(v){
      var mp=(v.metodo_pago||'OTRO').split('+')[0].trim().split('(')[0].trim()||'OTRO';
      if(!porMetodo[mp]){porMetodo[mp]={n:0,t:0};}
      porMetodo[mp].n++; porMetodo[mp].t+=v.total||0;
    });

    var metodosCard='<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Ventas por Método de Pago</div>' +
        '<div style="font-size:11px;color:var(--gray-400);">Histórico total acumulado</div>' +
      '</div>' +
      '<div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;">' +
        (Object.keys(porMetodo).length===0?'<div style="text-align:center;padding:20px;color:var(--gray-400);">Sin datos</div>':
        Object.entries(porMetodo).sort(function(a,b){return b[1].t-a[1].t;}).map(function(e){
          var cols={EFECTIVO:'#16a34a',YAPE:'#7c3aed',PLIN:'#7c3aed',TARJETA:'#2563eb',COMBINADO:'#d97706'};
          var c=cols[e[0]]||'#6b7280';
          return '<div style="padding:14px;background:var(--gray-50);border-radius:10px;border-top:3px solid '+c+';">' +
            '<div style="font-size:11px;font-weight:800;color:'+c+';text-transform:uppercase;margin-bottom:6px;">'+e[0]+'</div>' +
            '<div style="font-size:20px;font-weight:900;">S/ '+e[1].t.toFixed(2)+'</div>' +
            '<div style="font-size:11px;color:var(--gray-400);">'+e[1].n+' transacciones</div></div>';
        }).join('')) +
      '</div></div>';

    // Gráfica últimos 7 días
    var dias=[];
    for(var i=6;i>=0;i--){
      var d=new Date();d.setDate(d.getDate()-i);
      var f=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      var vd=ventas.filter(function(v){return v.fecha===f;});
      dias.push({f:f,n:vd.length,t:vd.reduce(function(s,v){return s+v.total;},0)});
    }
    var maxT=Math.max.apply(null,dias.map(function(d){return d.t;}))||1;

    var grafCard='<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Ventas — Últimos 7 Días</div>' +
      '</div>' +
      '<div style="padding:20px;">' +
        '<div style="display:flex;align-items:flex-end;gap:8px;height:120px;">' +
          dias.map(function(d){
            var pct=Math.max(4,Math.round((d.t/maxT)*100));
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">' +
              '<div style="font-size:9px;font-weight:700;color:var(--gray-600);">S/'+Math.round(d.t)+'</div>' +
              '<div style="width:100%;border-radius:5px 5px 0 0;background:var(--accent);height:'+pct+'%;min-height:4px;opacity:'+(d.f===hoy?1:0.55)+';transition:height 0.3s;"></div>' +
              '<div style="font-size:9px;color:var(--gray-400);">'+d.f.slice(5)+'</div>' +
              '<div style="font-size:9px;font-weight:700;color:var(--gray-500);">'+d.n+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--gray-400);">' +
          '<span>Barra = S/ total · Número = cantidad ventas</span>' +
          '<span style="color:var(--accent);font-weight:700;">■ Hoy</span>' +
        '</div>' +
      '</div></div>';

    // Inventario
    var sinStk=prods.filter(function(p){return(p.stock||0)===0;});
    var bajMin=prods.filter(function(p){return(p.stock||0)>0&&(p.stock||0)<=10;});
    var valInv=prods.reduce(function(s,p){return s+(p.stock||0)*(p.precio_venta||0);},0);

    var invCard='<div class="card">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:14px;font-weight:800;">Auditoría de Inventario</div>' +
      '</div>' +
      '<div style="padding:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;">' +
        [
          {l:'Productos',v:prods.length,c:'#2563eb',i:'fa-boxes'},
          {l:'Valor Stock',v:'S/ '+valInv.toFixed(0),c:'#16a34a',i:'fa-dollar-sign'},
          {l:'Agotados',v:sinStk.length,c:'#dc2626',i:'fa-times-circle'},
          {l:'Stock Bajo',v:bajMin.length,c:'#d97706',i:'fa-exclamation-triangle'},
        ].map(function(s){
          return '<div style="padding:14px;background:var(--gray-50);border-radius:10px;text-align:center;">' +
            '<i class="fas '+s.i+'" style="font-size:20px;color:'+s.c+';display:block;margin-bottom:6px;"></i>' +
            '<div style="font-size:20px;font-weight:900;">'+s.v+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);font-weight:700;">'+s.l+'</div></div>';
        }).join('') +
      '</div>' +
      (sinStk.length>0?
        '<div style="background:#fef2f2;border-radius:10px;padding:14px;margin:0 4px 4px;">' +
          '<div style="font-size:11px;font-weight:800;color:#dc2626;margin-bottom:8px;"><i class="fas fa-times-circle" style="margin-right:5px;"></i>AGOTADOS ('+sinStk.length+')</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:5px;">' +
            sinStk.slice(0,10).map(function(p){return '<span style="padding:3px 10px;background:#fef2f2;border:1px solid #fca5a5;border-radius:20px;font-size:11px;font-weight:600;color:#dc2626;">'+p.nombre.substring(0,20)+'</span>';}).join('')+
            (sinStk.length>10?'<span style="font-size:11px;color:var(--gray-400);padding:3px 0;">y '+(sinStk.length-10)+' más...</span>':'') +
          '</div></div>':'') +
    '</div>';

    return metodosCard+grafCard+invCard;
  },
};
