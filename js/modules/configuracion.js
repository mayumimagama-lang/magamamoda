// ============================================================
// MÓDULO: CONFIGURACIÓN — Versión Profesional y Completa
// ============================================================

const ConfiguracionModule = {

  _seccion: 'empresa',

  // ── Helpers ──
  _fechaHoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Configuración', 'AJUSTES DEL SISTEMA');

    var secciones = [
      { id:'empresa',    icon:'fa-building',       label:'Empresa',        desc:'Datos fiscales y logo' },
      { id:'usuarios',   icon:'fa-users-cog',       label:'Usuarios',       desc:'Accesos y permisos' },
      { id:'facturacion',icon:'fa-file-invoice',    label:'Facturación',    desc:'Series y comprobantes' },
      { id:'sistema',    icon:'fa-database',        label:'Sistema',        desc:'Backup y datos' },
      { id:'seguridad',  icon:'fa-shield-alt',      label:'Seguridad',      desc:'Contraseña y acceso' },
      { id:'acerca',     icon:'fa-info-circle',     label:'Acerca de',      desc:'Versión del sistema' },
    ];

    var sidebar = '<div style="width:220px;flex-shrink:0;">' +
      secciones.map(function(s) {
        var activo = ConfiguracionModule._seccion === s.id;
        return '<div onclick="ConfiguracionModule._irSeccion(\''+s.id+'\')" ' +
          'style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;cursor:pointer;margin-bottom:4px;' +
          'background:'+(activo?'var(--accent)':'transparent')+';' +
          'color:'+(activo?'white':'var(--gray-700)')+';transition:all 0.15s;" ' +
          'onmouseover="if(\''+s.id+'\'!==ConfiguracionModule._seccion) this.style.background=\'var(--gray-100)\'" ' +
          'onmouseout="if(\''+s.id+'\'!==ConfiguracionModule._seccion) this.style.background=\'transparent\'">' +
          '<div style="width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
            'background:'+(activo?'rgba(255,255,255,0.2)':'var(--gray-100)')+';' +
            'color:'+(activo?'white':'var(--accent)')+';font-size:14px;">' +
            '<i class="fas '+s.icon+'"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:700;">' +s.label+'</div>' +
            '<div style="font-size:10px;opacity:'+(activo?'0.8':'0.6')+';">'+s.desc+'</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

    var contenido = this._renderSeccion();

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-cog" style="color:var(--accent);margin-right:8px;"></i>Configuración</h2>' +
          '<p class="text-muted text-sm">Ajustes generales del sistema ERP</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:16px;align-items:flex-start;">' +
        // Sidebar
        '<div class="card" style="width:220px;flex-shrink:0;padding:12px;">'+
          sidebar.replace('<div style="width:220px;flex-shrink:0;">','').replace('</div>','') +
        '</div>' +
        // Contenido
        '<div style="flex:1;min-width:0;" id="configContenido">' + contenido + '</div>' +
      '</div>'
    );
  },

  _irSeccion(id) {
    this._seccion = id;
    var cont = document.getElementById('configContenido');
    if (cont) {
      cont.innerHTML = this._renderSeccion();
    } else {
      App.renderPage();
    }
    // Actualizar sidebar activo sin re-render completo
    App.renderPage();
  },

  _renderSeccion() {
    switch (this._seccion) {
      case 'empresa':     return this._secEmpresa();
      case 'usuarios':    return this._secUsuarios();
      case 'facturacion': return this._secFacturacion();
      case 'sistema':     return this._secSistema();
      case 'seguridad':   return this._secSeguridad();
      case 'acerca':      return this._secAcerca();
      default:            return this._secEmpresa();
    }
  },

  // ──────────────────────────────────────────────────────
  // SECCIÓN: EMPRESA
  // ──────────────────────────────────────────────────────
  _secEmpresa() {
    var e = DB.empresa || {};
    return (
      '<div class="card" style="margin-bottom:16px;">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-building" style="color:var(--accent);margin-right:8px;"></i>Datos de la Empresa</div>' +
          '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">Información fiscal y de contacto del negocio</div>' +
        '</div>' +
        '<div style="padding:20px;">' +

          // Logo actual
          '<div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--gray-50);border-radius:12px;margin-bottom:20px;">' +
            '<div id="logoPreview" style="width:72px;height:72px;border-radius:14px;border:2px dashed var(--gray-300);display:flex;align-items:center;justify-content:center;overflow:hidden;background:white;">' +
              (e.logo ? '<img src="'+e.logo+'" style="width:100%;height:100%;object-fit:contain;">' :
                '<i class="fas fa-store" style="font-size:28px;color:var(--gray-300);"></i>') +
            '</div>' +
            '<div>' +
              '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">'+(e.nombre||'Sin nombre')+'</div>' +
              '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">RUC: '+(e.ruc||'—')+'</div>' +
              '<button onclick="ConfiguracionModule._subirLogo()" style="margin-top:8px;padding:5px 12px;background:var(--accent);color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">' +
                '<i class="fas fa-camera" style="margin-right:5px;"></i>Cambiar logo' +
              '</button>' +
              '<input type="file" id="inputLogo" accept="image/*" style="display:none;" onchange="ConfiguracionModule._onLogoChange(event)">' +
            '</div>' +
          '</div>' +

          '<div class="form-grid">' +
            '<div class="form-group" style="grid-column:1/-1">' +
              '<label class="form-label">Razón Social / Nombre del Negocio <span style="color:red;">*</span></label>' +
              '<input class="form-control" id="cfg_nombre" type="text" value="'+(e.nombre||'')+'" placeholder="Ej: MI TIENDA S.A.C."/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">RUC</label>' +
              '<input class="form-control" id="cfg_ruc" type="text" maxlength="11" value="'+(e.ruc||'')+'" placeholder="20XXXXXXXXX"/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Sucursal / Sede</label>' +
              '<input class="form-control" id="cfg_sucursal" type="text" value="'+(e.sucursal||'')+'" placeholder="Sede principal"/>' +
            '</div>' +
            '<div class="form-group" style="grid-column:1/-1">' +
              '<label class="form-label">Dirección</label>' +
              '<input class="form-control" id="cfg_direccion" type="text" value="'+(e.direccion||'')+'" placeholder="Av. ..."/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Teléfono</label>' +
              '<input class="form-control" id="cfg_telefono" type="text" value="'+(e.telefono||'')+'" placeholder="062-XXXXXX"/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Email</label>' +
              '<input class="form-control" id="cfg_email" type="email" value="'+(e.email||'')+'" placeholder="contacto@empresa.com"/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Moneda</label>' +
              '<select class="form-control" id="cfg_moneda">' +
                '<option value="SOLES"'+(e.moneda==='SOLES'?' selected':'')+'>Soles (S/)</option>' +
                '<option value="DOLARES"'+(e.moneda==='DOLARES'?' selected':'')+'>Dólares ($)</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Tipo de Cambio (S/ por $)</label>' +
              '<input class="form-control" id="cfg_tipoCambio" type="number" step="0.001" value="'+(e.tipoCambio||3.467)+'" placeholder="3.467"/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">WhatsApp (sin código de país)</label>' +
              '<input class="form-control" id="cfg_whatsapp" type="text" value="'+(e.whatsapp||'')+'" placeholder="987654321"/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Sitio Web</label>' +
              '<input class="form-control" id="cfg_web" type="text" value="'+(e.web||'')+'" placeholder="www.mitienda.com"/>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;justify-content:flex-end;margin-top:16px;">' +
            '<button onclick="ConfiguracionModule._guardarEmpresa()" ' +
              'style="padding:10px 28px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-save" style="margin-right:8px;"></i>Guardar Cambios' +
            '</button>' +
          '</div>' +

        '</div>' +
      '</div>'
    );
  },

  _subirLogo() { document.getElementById('inputLogo')?.click(); },

  _onLogoChange(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var data = e.target.result;
      var preview = document.getElementById('logoPreview');
      if (preview) preview.innerHTML = '<img src="'+data+'" style="width:100%;height:100%;object-fit:contain;">';
      DB.empresa.logo = data;
      Storage.guardarEmpresa();
      App.toast('✅ Logo actualizado', 'success');
    };
    reader.readAsDataURL(file);
  },

  _guardarEmpresa() {
    var nombre = (document.getElementById('cfg_nombre')?.value || '').trim();
    if (!nombre) { App.toast('El nombre de la empresa es obligatorio', 'error'); return; }
    DB.empresa = Object.assign(DB.empresa || {}, {
      nombre:     nombre,
      ruc:        (document.getElementById('cfg_ruc')?.value || '').trim(),
      sucursal:   (document.getElementById('cfg_sucursal')?.value || '').trim(),
      direccion:  (document.getElementById('cfg_direccion')?.value || '').trim(),
      telefono:   (document.getElementById('cfg_telefono')?.value || '').trim(),
      email:      (document.getElementById('cfg_email')?.value || '').trim(),
      moneda:     document.getElementById('cfg_moneda')?.value || 'SOLES',
      tipoCambio: parseFloat(document.getElementById('cfg_tipoCambio')?.value) || 3.467,
      whatsapp:   (document.getElementById('cfg_whatsapp')?.value || '').trim(),
      web:        (document.getElementById('cfg_web')?.value || '').trim(),
    });
    Storage.guardarEmpresa();
    App.toast('✅ Datos de empresa guardados correctamente', 'success');
  },

  // ──────────────────────────────────────────────────────
  // SECCIÓN: USUARIOS
  // ──────────────────────────────────────────────────────
  _secUsuarios() {
    var usuarios = DB.usuarios || [];

    var filas = usuarios.map(function(u) {
      var esAdmin  = u.rol === 'admin' || u.permisos === 'todos';
      var esActual = DB.usuarioActual && DB.usuarioActual.id === u.id;

      return '<tr style="transition:background 0.1s;" onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:12px 16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:white;background:'+(esAdmin?'#7c3aed':'#2563eb')+';flex-shrink:0;">' +
              (u.usuario||'?')[0].toUpperCase() +
            '</div>' +
            '<div>' +
              '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+u.nombre+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);">@'+u.usuario+'</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 8px;">' +
          '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(esAdmin?'#f5f3ff':'#eff6ff')+';color:'+(esAdmin?'#7c3aed':'#2563eb')+';border:1px solid '+(esAdmin?'#c4b5fd':'#93c5fd')+'">' +
            (esAdmin?'ADMINISTRADOR':'CAJERO')+'</span>' +
        '</td>' +
        '<td style="padding:12px 8px;">' +
          '<span style="font-size:11px;color:var(--gray-500);">'+(u.sucursal||'—')+'</span>' +
        '</td>' +
        '<td style="padding:12px 8px;">' +
          '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(u.activo!==false?'#f0fdf4':'#fef2f2')+';color:'+(u.activo!==false?'#16a34a':'#dc2626')+'">' +
            (u.activo!==false?'● ACTIVO':'● INACTIVO')+'</span>' +
          (esActual ? ' <span style="font-size:9px;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:10px;font-weight:700;">TÚ</span>' : '') +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
            '<button onclick="ConfiguracionModule._verPermisos('+u.id+')" title="Ver permisos" ' +
              'style="width:30px;height:30px;border-radius:7px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:13px;">' +
              '<i class="fas fa-key"></i></button>' +
            '<button onclick="ConfiguracionModule._editarUsuario('+u.id+')" title="Editar" ' +
              'style="width:30px;height:30px;border-radius:7px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:13px;">' +
              '<i class="fas fa-edit"></i></button>' +
            (!esActual ?
              '<button onclick="ConfiguracionModule._toggleUsuario('+u.id+')" title="'+(u.activo!==false?'Desactivar':'Activar')+'" ' +
                'style="width:30px;height:30px;border-radius:7px;border:none;background:'+(u.activo!==false?'#fef2f2':'#f0fdf4')+';color:'+(u.activo!==false?'#dc2626':'#16a34a')+';cursor:pointer;font-size:13px;">' +
                '<i class="fas '+(u.activo!==false?'fa-ban':'fa-check')+'"></i></button>' : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    return (
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
          '<div>' +
            '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-users-cog" style="color:var(--accent);margin-right:8px;"></i>Gestión de Usuarios</div>' +
            '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">Administra accesos y permisos del sistema</div>' +
          '</div>' +
          '<button onclick="ConfiguracionModule._nuevoUsuario()" style="padding:8px 16px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-plus" style="margin-right:6px;"></i>Nuevo Usuario' +
          '</button>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
              '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Usuario</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Rol</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Sucursal</th>' +
              '<th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
              '<th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
            '</tr></thead>' +
            '<tbody>'+filas+'</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    );
  },

  _nuevoUsuario() {
    App.showModal('➕ Nuevo Usuario', this._formUsuario({}), [
      { text:'💾 Crear Usuario', cls:'btn-primary', cb: function(){ ConfiguracionModule._guardarUsuario(); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '480px';
  },

  _editarUsuario(id) {
    var u = (DB.usuarios||[]).find(function(x){ return x.id === id; });
    if (!u) return;
    App.showModal('✏️ Editar Usuario', this._formUsuario(u, id), [
      { text:'💾 Guardar Cambios', cls:'btn-primary', cb: function(){ ConfiguracionModule._guardarUsuario(id); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '480px';
  },

  _formUsuario(u, id) {
    return (
      '<div class="form-grid">' +
        '<div class="form-group">' +
          '<label class="form-label">Nombre completo <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="usr_nombre" type="text" value="'+(u.nombre||'')+'" placeholder="Juan Pérez"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Usuario (login) <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="usr_usuario" type="text" value="'+(u.usuario||'')+'" placeholder="juanperez"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">'+(id?'Nueva Contraseña (dejar vacío para no cambiar)':'Contraseña')+(id?'':' <span style="color:red;">*</span>')+'</label>' +
          '<div style="position:relative;">' +
            '<input class="form-control" id="usr_password" type="password" placeholder="••••••••" style="padding-right:40px;"/>' +
            '<button type="button" onclick="ConfiguracionModule._togglePassVis(\'usr_password\')" ' +
              'style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);font-size:13px;">' +
              '<i class="fas fa-eye" id="iconPass_usr_password"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Rol</label>' +
          '<select class="form-control" id="usr_rol" onchange="ConfiguracionModule._onRolChange()">' +
            '<option value="admin"'+(u.rol==='admin'?' selected':'')+'>Administrador</option>' +
            '<option value="cajero"'+((u.rol==='cajero'||u.rol==='vendedor')?' selected':'')+'>Cajero / Vendedor</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Cargo</label>' +
          '<input class="form-control" id="usr_cargo" type="text" value="'+(u.cargo||'')+'" placeholder="Administrador, Cajero..."/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Sucursal</label>' +
          '<input class="form-control" id="usr_sucursal" type="text" value="'+(u.sucursal||DB.empresa?.sucursal||'')+'" placeholder="Sede principal"/>' +
        '</div>' +
      '</div>'
    );
  },

  _togglePassVis(inputId) {
    var inp  = document.getElementById(inputId);
    var icon = document.getElementById('iconPass_'+inputId);
    if (!inp) return;
    if (inp.type === 'password') { inp.type = 'text'; if (icon) { icon.className = 'fas fa-eye-slash'; } }
    else                         { inp.type = 'password'; if (icon) { icon.className = 'fas fa-eye'; } }
  },

  _guardarUsuario(id) {
    var nombre   = (document.getElementById('usr_nombre')?.value || '').trim();
    var usuario  = (document.getElementById('usr_usuario')?.value || '').trim();
    var password = (document.getElementById('usr_password')?.value || '').trim();
    var rol      = document.getElementById('usr_rol')?.value || 'cajero';
    var cargo    = (document.getElementById('usr_cargo')?.value || '').trim();
    var sucursal = (document.getElementById('usr_sucursal')?.value || '').trim();

    if (!nombre)  { App.toast('El nombre es obligatorio', 'error'); return; }
    if (!usuario) { App.toast('El nombre de usuario es obligatorio', 'error'); return; }
    if (!id && !password) { App.toast('La contraseña es obligatoria', 'error'); return; }

    // Verificar usuario duplicado
    var duplicado = (DB.usuarios||[]).find(function(u){ return u.usuario === usuario && u.id !== id; });
    if (duplicado) { App.toast('Ese nombre de usuario ya existe', 'error'); return; }

    if (!DB.usuarios) DB.usuarios = [];

    if (id) {
      var idx = DB.usuarios.findIndex(function(u){ return u.id === id; });
      if (idx >= 0) {
        DB.usuarios[idx].nombre   = nombre;
        DB.usuarios[idx].usuario  = usuario;
        DB.usuarios[idx].cargo    = cargo;
        DB.usuarios[idx].sucursal = sucursal;
        DB.usuarios[idx].rol      = rol;
        DB.usuarios[idx].permisos = rol === 'admin' ? 'todos' : DB.usuarios[idx].permisos;
        if (password) DB.usuarios[idx].password = password;
      }
      App.toast('✅ Usuario actualizado', 'success');
    } else {
      var nuevoId = DB.usuarios.length > 0 ? Math.max.apply(null, DB.usuarios.map(function(u){ return u.id; })) + 1 : 1;
      DB.usuarios.push({
        id: nuevoId, nombre, usuario, password, rol, cargo, sucursal,
        activo: true, fechaCreacion: this._fechaHoy(),
        permisos: rol === 'admin' ? 'todos' : {
          inicio:true, pos:true, ventas:true, caja:true, clientes:true, productos:true,
          inventario:false, compras:false, cotizaciones:false, reportes:true,
          kardex:false, administracion:false, configuracion:false
        }
      });
      App.toast('✅ Usuario creado correctamente', 'success');
    }
    App.closeModal();
    App.renderPage();
  },

  _verPermisos(id) {
    var u = (DB.usuarios||[]).find(function(x){ return x.id === id; });
    if (!u) return;
    if (u.permisos === 'todos') {
      App.toast('Este usuario tiene acceso total (Administrador)', 'info');
      return;
    }
    var perms = u.permisos || {};
    var modulos = [
      { k:'inicio',       label:'Inicio' },       { k:'pos',            label:'Punto de Venta' },
      { k:'ventas',       label:'Ventas' },        { k:'cotizaciones',   label:'Cotizaciones' },
      { k:'clientes',     label:'Clientes' },      { k:'productos',      label:'Productos' },
      { k:'inventario',   label:'Inventario' },    { k:'compras',        label:'Compras' },
      { k:'caja',         label:'Caja' },          { k:'reportes',       label:'Reportes' },
      { k:'kardex',       label:'Kardex' },        { k:'agenda',         label:'Agenda' },
      { k:'configuracion',label:'Configuración' }, { k:'administracion', label:'Administración' },
    ];

    var html =
      '<div style="margin-bottom:14px;padding:12px 14px;background:var(--gray-50);border-radius:10px;display:flex;align-items:center;gap:10px;">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:#2563eb;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;">'+u.usuario[0].toUpperCase()+'</div>' +
        '<div><div style="font-size:14px;font-weight:700;">'+u.nombre+'</div><div style="font-size:11px;color:var(--gray-400);">@'+u.usuario+'</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      modulos.map(function(m) {
        var activo = perms[m.k] === true;
        return '<div onclick="ConfiguracionModule._togglePermiso('+id+',\''+m.k+'\')" id="perm_'+m.k+'" ' +
          'style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;border:1.5px solid '+(activo?'#86efac':'var(--gray-200)')+';background:'+(activo?'#f0fdf4':'white')+';cursor:pointer;transition:all 0.15s;">' +
          '<div style="width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:'+(activo?'#16a34a':'var(--gray-200)')+';flex-shrink:0;">' +
            (activo ? '<i class="fas fa-check" style="font-size:10px;color:white;"></i>' : '') +
          '</div>' +
          '<span style="font-size:12px;font-weight:700;color:'+(activo?'#16a34a':'var(--gray-500)')+';">'+m.label+'</span>' +
        '</div>';
      }).join('') +
      '</div>';

    App.showModal('🔑 Permisos — '+u.nombre, html, [
      { text:'💾 Guardar Permisos', cls:'btn-primary', cb: function(){ App.closeModal(); App.toast('✅ Permisos guardados', 'success'); App.renderPage(); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '460px';
  },

  _togglePermiso(userId, modulo) {
    var u = (DB.usuarios||[]).find(function(x){ return x.id === userId; });
    if (!u || u.permisos === 'todos') return;
    if (!u.permisos) u.permisos = {};
    u.permisos[modulo] = !u.permisos[modulo];
    var activo = u.permisos[modulo];
    var el = document.getElementById('perm_'+modulo);
    if (el) {
      el.style.borderColor = activo ? '#86efac' : 'var(--gray-200)';
      el.style.background  = activo ? '#f0fdf4' : 'white';
      el.innerHTML =
        '<div style="width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:'+(activo?'#16a34a':'var(--gray-200)')+';flex-shrink:0;">' +
          (activo ? '<i class="fas fa-check" style="font-size:10px;color:white;"></i>' : '') +
        '</div>' +
        '<span style="font-size:12px;font-weight:700;color:'+(activo?'#16a34a':'var(--gray-500)')+';">'+modulo+'</span>';
    }
  },

  _toggleUsuario(id) {
    var u = (DB.usuarios||[]).find(function(x){ return x.id === id; });
    if (!u) return;
    u.activo = u.activo === false ? true : false;
    App.toast(u.activo ? '✅ Usuario activado' : '⚠️ Usuario desactivado', u.activo?'success':'warning');
    App.renderPage();
  },

  // ──────────────────────────────────────────────────────
  // SECCIÓN: FACTURACIÓN
  // ──────────────────────────────────────────────────────
  _secFacturacion() {
    var seq = DB._sequences || {};
    var igvActual = DB.empresa?.igv !== undefined ? DB.empresa.igv : 18;

    return (
      '<div style="display:flex;flex-direction:column;gap:16px;">' +

      // IGV y configuración fiscal
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-percent" style="color:var(--accent);margin-right:8px;"></i>Configuración Fiscal</div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="form-grid">' +
            '<div class="form-group">' +
              '<label class="form-label">Tasa de IGV (%)</label>' +
              '<input class="form-control" id="cfg_igv" type="number" step="0.1" value="'+igvActual+'" placeholder="18"/>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">IGV por defecto en ventas</label>' +
              '<select class="form-control" id="cfg_igv_default">' +
                '<option value="incluido"'+(DB.empresa?.igvDefault==='incluido'?' selected':'')+'>Precio incluye IGV</option>' +
                '<option value="agregado"'+(DB.empresa?.igvDefault==='agregado'?' selected':'')+'>Agregar IGV al precio</option>' +
                '<option value="exonerado"'+(DB.empresa?.igvDefault==='exonerado'?' selected':'')+'>Exonerado de IGV</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:12px;">' +
            '<button onclick="ConfiguracionModule._guardarFiscal()" style="padding:9px 24px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-save" style="margin-right:6px;"></i>Guardar' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Series de comprobantes
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-hashtag" style="color:var(--accent);margin-right:8px;"></i>Series y Correlativo de Comprobantes</div>' +
          '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">El correlativo indica el próximo número a emitir</div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">' +
            [
              { key:'NV03', label:'Nota de Venta', icon:'fa-receipt', color:'#2563eb' },
              { key:'BV03', label:'Boleta de Venta', icon:'fa-file-invoice', color:'#16a34a' },
              { key:'FC01', label:'Factura', icon:'fa-file-contract', color:'#7c3aed' },
            ].map(function(doc) {
              return '<div style="padding:16px;background:var(--gray-50);border-radius:12px;border:1.5px solid var(--gray-200);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                  '<div style="width:32px;height:32px;border-radius:8px;background:'+doc.color+'18;display:flex;align-items:center;justify-content:center;">' +
                    '<i class="fas '+doc.icon+'" style="color:'+doc.color+';font-size:13px;"></i>' +
                  '</div>' +
                  '<div style="font-size:12px;font-weight:700;color:var(--gray-700);">'+doc.label+'</div>' +
                '</div>' +
                '<label style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;">Serie</label>' +
                '<div style="font-size:18px;font-weight:900;color:'+doc.color+';margin:2px 0 10px;">'+doc.key+'</div>' +
                '<label style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;">Próximo N°</label>' +
                '<input type="number" id="seq_'+doc.key+'" value="'+(seq[doc.key]||1)+'" min="1" ' +
                  'style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:16px;font-weight:900;text-align:center;color:'+doc.color+';box-sizing:border-box;margin-top:2px;"/>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:14px;">' +
            '<button onclick="ConfiguracionModule._guardarSeries()" style="padding:9px 24px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-save" style="margin-right:6px;"></i>Guardar Series' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '</div>'
    );
  },

  _guardarFiscal() {
    DB.empresa = Object.assign(DB.empresa || {}, {
      igv:        parseFloat(document.getElementById('cfg_igv')?.value) || 18,
      igvDefault: document.getElementById('cfg_igv_default')?.value || 'incluido',
    });
    Storage.guardarEmpresa();
    App.toast('✅ Configuración fiscal guardada', 'success');
  },

  _guardarSeries() {
    ['NV03','BV03','FC01'].forEach(function(k) {
      var val = parseInt(document.getElementById('seq_'+k)?.value) || 1;
      DB._sequences[k] = val;
    });
    Storage.guardarSequences();
    App.toast('✅ Series y correlativos guardados', 'success');
  },

  // ──────────────────────────────────────────────────────
  // SECCIÓN: SISTEMA
  // ──────────────────────────────────────────────────────
  _secSistema() {
    var ventas    = (DB.ventas||[]).length;
    var clientes  = (DB.clientes||[]).length;
    var productos = (DB.productos||[]).length;
    var kardex    = (DB.kardex||[]).length;

    // Calcular uso de localStorage
    var usoBytes = 0;
    try {
      Object.keys(localStorage).forEach(function(k) {
        usoBytes += (localStorage.getItem(k)||'').length * 2;
      });
    } catch(e) {}
    var usoKB = (usoBytes / 1024).toFixed(1);
    var usoMB = (usoBytes / 1024 / 1024).toFixed(2);

    return (
      '<div style="display:flex;flex-direction:column;gap:16px;">' +

      // Estadísticas
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-chart-bar" style="color:var(--accent);margin-right:8px;"></i>Estadísticas del Sistema</div>' +
        '</div>' +
        '<div style="padding:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">' +
          [
            { label:'Ventas', value: ventas, icon:'fa-shopping-cart', color:'#16a34a' },
            { label:'Clientes', value: clientes, icon:'fa-users', color:'#2563eb' },
            { label:'Productos', value: productos, icon:'fa-boxes', color:'#7c3aed' },
            { label:'Kardex', value: kardex, icon:'fa-history', color:'#d97706' },
          ].map(function(s) {
            return '<div style="text-align:center;padding:16px;background:var(--gray-50);border-radius:12px;">' +
              '<i class="fas '+s.icon+'" style="font-size:24px;color:'+s.color+';display:block;margin-bottom:8px;"></i>' +
              '<div style="font-size:24px;font-weight:900;color:var(--gray-800);">'+s.value+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);font-weight:700;">'+s.label+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      // Almacenamiento
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-hdd" style="color:var(--accent);margin-right:8px;"></i>Almacenamiento Local</div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">' +
            '<div style="flex:1;height:12px;background:var(--gray-200);border-radius:6px;overflow:hidden;">' +
              '<div style="height:100%;width:'+Math.min(100,(usoBytes/5242880*100)).toFixed(1)+'%;background:linear-gradient(90deg,#2563eb,#7c3aed);border-radius:6px;transition:width 0.3s;"></div>' +
            '</div>' +
            '<div style="font-size:13px;font-weight:700;color:var(--gray-700);white-space:nowrap;">'+usoMB+' MB / 5 MB</div>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--gray-400);">Usando '+usoKB+' KB de 5,120 KB disponibles en localStorage</div>' +
        '</div>' +
      '</div>' +

      // Backup y restauración
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-database" style="color:var(--accent);margin-right:8px;"></i>Backup y Restauración</div>' +
          '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">Exporta e importa todos los datos del sistema</div>' +
        '</div>' +
        '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +

          '<div style="padding:18px;background:#f0fdf4;border-radius:12px;border:1.5px solid #86efac;">' +
            '<div style="font-size:13px;font-weight:800;color:#15803d;margin-bottom:6px;"><i class="fas fa-download" style="margin-right:6px;"></i>Exportar Backup</div>' +
            '<div style="font-size:11px;color:#16a34a;margin-bottom:14px;">Descarga un archivo JSON con todos los datos: ventas, clientes, productos, kardex, configuración.</div>' +
            '<button onclick="ConfiguracionModule._exportarBackup()" style="width:100%;padding:10px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-download" style="margin-right:6px;"></i>Descargar Backup' +
            '</button>' +
          '</div>' +

          '<div style="padding:18px;background:#eff6ff;border-radius:12px;border:1.5px solid #93c5fd;">' +
            '<div style="font-size:13px;font-weight:800;color:#1d4ed8;margin-bottom:6px;"><i class="fas fa-upload" style="margin-right:6px;"></i>Restaurar Backup</div>' +
            '<div style="font-size:11px;color:#2563eb;margin-bottom:14px;">Carga un archivo de backup previamente exportado. <strong>Reemplazará todos los datos actuales.</strong></div>' +
            '<button onclick="ConfiguracionModule._importarBackup()" style="width:100%;padding:10px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-upload" style="margin-right:6px;"></i>Cargar Backup' +
            '</button>' +
            '<input type="file" id="inputBackup" accept=".json" style="display:none;" onchange="ConfiguracionModule._onBackupImport(event)"/>' +
          '</div>' +

        '</div>' +
      '</div>' +

      // Zona peligrosa
      '<div class="card" style="border:1.5px solid #fca5a5;">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #fca5a5;background:#fef2f2;border-radius:12px 12px 0 0;">' +
          '<div style="font-size:15px;font-weight:800;color:#dc2626;"><i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>Zona Peligrosa</div>' +
          '<div style="font-size:12px;color:#ef4444;margin-top:2px;">Estas acciones son irreversibles. Procede con cuidado.</div>' +
        '</div>' +
        '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

          '<div style="padding:14px;border:1.5px solid #fde68a;border-radius:10px;background:#fffbeb;">' +
            '<div style="font-size:12px;font-weight:800;color:#d97706;margin-bottom:4px;"><i class="fas fa-eraser" style="margin-right:5px;"></i>Limpiar Ventas</div>' +
            '<div style="font-size:11px;color:#92400e;margin-bottom:10px;">Elimina todo el historial de ventas. Los productos y clientes se mantienen.</div>' +
            '<button onclick="ConfiguracionModule._limpiarVentas()" style="width:100%;padding:8px;background:#d97706;color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">' +
              'Limpiar Ventas</button>' +
          '</div>' +

          '<div style="padding:14px;border:1.5px solid #fca5a5;border-radius:10px;background:#fef2f2;">' +
            '<div style="font-size:12px;font-weight:800;color:#dc2626;margin-bottom:4px;"><i class="fas fa-trash-alt" style="margin-right:5px;"></i>Resetear Sistema</div>' +
            '<div style="font-size:11px;color:#b91c1c;margin-bottom:10px;">Elimina TODOS los datos. El sistema quedará como recién instalado.</div>' +
            '<button onclick="ConfiguracionModule._resetearSistema()" style="width:100%;padding:8px;background:#dc2626;color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">' +
              'Resetear Todo</button>' +
          '</div>' +

        '</div>' +
      '</div>' +

      '</div>'
    );
  },

  _exportarBackup() {
    var backup = {
      version:   '1.0',
      fecha:     new Date().toISOString(),
      empresa:   DB.empresa,
      clientes:  DB.clientes,
      ventas:    DB.ventas,
      productos: DB.productos,
      kardex:    DB.kardex || [],
      cotizaciones: DB.cotizaciones || [],
      compras:   DB.compras || [],
      sequences: DB._sequences,
      movimientosCaja: DB.movimientosCaja || [],
      cajas:     DB.cajas || [],
    };
    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url;
    a.download = 'backup_erp_'+this._fechaHoy()+'.json';
    a.click();
    URL.revokeObjectURL(url);
    App.toast('✅ Backup descargado correctamente', 'success');
  },

  _importarBackup() { document.getElementById('inputBackup')?.click(); },

  _onBackupImport(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      App.showModal('⚠️ Restaurar Backup',
        '<div style="text-align:center;padding:10px 0;">' +
          '<div style="width:60px;height:60px;border-radius:50%;background:#fffbeb;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size:24px;color:#d97706;"></i>' +
          '</div>' +
          '<div style="font-size:16px;font-weight:800;margin-bottom:8px;">¿Restaurar este backup?</div>' +
          '<div style="font-size:13px;color:var(--gray-600);margin-bottom:12px;">Archivo: <strong>'+file.name+'</strong></div>' +
          '<div style="background:#fef2f2;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">⚠️ Esta acción reemplazará TODOS los datos actuales. Esta operación no se puede deshacer.</div>' +
        '</div>',
        [{ text:'✅ Sí, restaurar', cls:'btn-danger', cb: function() {
          try {
            var data = JSON.parse(e.target.result);
            if (data.empresa)   { DB.empresa   = data.empresa;   Storage.guardarEmpresa(); }
            if (data.clientes)  { DB.clientes  = data.clientes;  Storage.guardarClientes(); }
            if (data.ventas)    { DB.ventas    = data.ventas;    Storage.guardarVentas(); }
            if (data.productos) { DB.productos = data.productos; Storage.guardarProductos(); }
            if (data.kardex)    { DB.kardex    = data.kardex;    Storage.guardarKardex(); }
            if (data.compras)   { DB.compras   = data.compras;   Storage.guardarCompras(); }
            if (data.cotizaciones) { DB.cotizaciones = data.cotizaciones; Storage.guardarCotizaciones(); }
            if (data.sequences) { DB._sequences = data.sequences; Storage.guardarSequences(); }
            if (data.cajas)     { DB.cajas = data.cajas; Storage.guardarCajas(); }
            if (data.movimientosCaja) { DB.movimientosCaja = data.movimientosCaja; Storage.guardarMovimientosCaja(); }
            App.closeModal();
            App.toast('✅ Backup restaurado correctamente', 'success');
            setTimeout(function(){ App.renderPage(); }, 500);
          } catch(err) {
            App.toast('Error al leer el archivo de backup', 'error');
          }
        }}]
      );
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  _limpiarVentas() {
    App.showModal('⚠️ Limpiar Ventas',
      '<div style="text-align:center;padding:10px 0;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fffbeb;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
          '<i class="fas fa-eraser" style="font-size:24px;color:#d97706;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:8px;">¿Limpiar historial de ventas?</div>' +
        '<div style="font-size:13px;color:var(--gray-600);margin-bottom:12px;">Se eliminarán <strong>'+(DB.ventas||[]).length+'</strong> ventas registradas.</div>' +
        '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">Esta acción no se puede deshacer. Los productos y clientes se mantendrán.</div>' +
      '</div>',
      [{ text:'🗑️ Sí, limpiar', cls:'btn-danger', cb: function() {
        DB.ventas = [];
        DB._sequences = { NV03:1, BV03:1, FC01:1 };
        Storage.guardarVentas();
        Storage.guardarSequences();
        App.closeModal();
        App.toast('🗑️ Ventas eliminadas', 'warning');
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '400px';
  },

  _resetearSistema() {
    App.showModal('🚨 Resetear Sistema',
      '<div style="text-align:center;padding:10px 0;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
          '<i class="fas fa-trash-alt" style="font-size:24px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;color:#dc2626;margin-bottom:8px;">⚠️ RESETEAR SISTEMA</div>' +
        '<div style="font-size:13px;color:var(--gray-600);margin-bottom:12px;">Esta acción eliminará <strong>TODOS los datos</strong> del sistema.</div>' +
        '<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:14px;font-size:12px;color:#dc2626;">' +
          '⚠️ Se eliminarán: ventas, clientes, productos, kardex, caja y configuración. El sistema se reiniciará. <strong>Esta acción es IRREVERSIBLE.</strong>' +
        '</div>' +
        '<div style="margin-top:12px;">' +
          '<label style="font-size:12px;color:var(--gray-600);display:block;margin-bottom:6px;">Escribe <strong>RESETEAR</strong> para confirmar:</label>' +
          '<input id="confirmReset" type="text" placeholder="RESETEAR" style="width:100%;padding:10px;border:2px solid #fca5a5;border-radius:8px;text-align:center;font-size:14px;font-weight:700;box-sizing:border-box;"/>' +
        '</div>' +
      '</div>',
      [{ text:'🚨 Resetear Todo', cls:'btn-danger', cb: function() {
        var confirm = document.getElementById('confirmReset')?.value?.trim();
        if (confirm !== 'RESETEAR') { App.toast('Escribe RESETEAR para confirmar', 'error'); return; }
        Storage.limpiarTodo();
        App.closeModal();
        App.toast('Sistema reseteado. Recargando...', 'warning');
        setTimeout(function(){ window.location.reload(); }, 1500);
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '420px';
  },

  // ──────────────────────────────────────────────────────
  // SECCIÓN: SEGURIDAD
  // ──────────────────────────────────────────────────────
  _secSeguridad() {
    var u = DB.usuarioActual || {};
    return (
      '<div style="display:flex;flex-direction:column;gap:16px;">' +

      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-key" style="color:var(--accent);margin-right:8px;"></i>Cambiar Contraseña</div>' +
          '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">Usuario: <strong>@'+u.usuario+'</strong></div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div class="form-grid">' +

            '<div class="form-group" style="grid-column:1/-1">' +
              '<label class="form-label">Contraseña actual <span style="color:red;">*</span></label>' +
              '<div style="position:relative;">' +
                '<input class="form-control" id="sec_actual" type="password" placeholder="••••••••" style="padding-right:40px;"/>' +
                '<button type="button" onclick="ConfiguracionModule._togglePassVis(\'sec_actual\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);">' +
                  '<i class="fas fa-eye" id="iconPass_sec_actual"></i></button>' +
              '</div>' +
            '</div>' +

            '<div class="form-group">' +
              '<label class="form-label">Nueva contraseña <span style="color:red;">*</span></label>' +
              '<div style="position:relative;">' +
                '<input class="form-control" id="sec_nueva" type="password" placeholder="••••••••" style="padding-right:40px;" oninput="ConfiguracionModule._checkPassFuerza(this.value)"/>' +
                '<button type="button" onclick="ConfiguracionModule._togglePassVis(\'sec_nueva\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);">' +
                  '<i class="fas fa-eye" id="iconPass_sec_nueva"></i></button>' +
              '</div>' +
              '<div id="passFortaleza" style="margin-top:6px;font-size:11px;color:var(--gray-400);"></div>' +
            '</div>' +

            '<div class="form-group">' +
              '<label class="form-label">Confirmar nueva contraseña <span style="color:red;">*</span></label>' +
              '<div style="position:relative;">' +
                '<input class="form-control" id="sec_confirmar" type="password" placeholder="••••••••" style="padding-right:40px;"/>' +
                '<button type="button" onclick="ConfiguracionModule._togglePassVis(\'sec_confirmar\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);">' +
                  '<i class="fas fa-eye" id="iconPass_sec_confirmar"></i></button>' +
              '</div>' +
            '</div>' +

          '</div>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:16px;">' +
            '<button onclick="ConfiguracionModule._cambiarPassword()" style="padding:10px 28px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">' +
              '<i class="fas fa-lock" style="margin-right:8px;"></i>Cambiar Contraseña' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Sesión activa
      '<div class="card">' +
        '<div style="padding:18px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<div style="font-size:15px;font-weight:800;color:var(--gray-800);"><i class="fas fa-user-shield" style="color:var(--accent);margin-right:8px;"></i>Sesión Activa</div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--gray-50);border-radius:12px;margin-bottom:14px;">' +
            '<div style="width:48px;height:48px;border-radius:14px;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:900;">'+((u.usuario||'?')[0].toUpperCase())+'</div>' +
            '<div>' +
              '<div style="font-size:15px;font-weight:800;color:var(--gray-800);">'+(u.nombre||'—')+'</div>' +
              '<div style="font-size:12px;color:var(--gray-400);">@'+u.usuario+' · '+(u.cargo||u.rol||'—')+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);">Sucursal: '+(u.sucursal||'—')+'</div>' +
            '</div>' +
            '<div style="margin-left:auto;">' +
              '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:#f0fdf4;color:#16a34a;border:1px solid #86efac;">● ACTIVO</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="ConfiguracionModule._cerrarSesion()" style="padding:10px 20px;background:#fef2f2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
            '<i class="fas fa-sign-out-alt" style="margin-right:6px;"></i>Cerrar Sesión' +
          '</button>' +
        '</div>' +
      '</div>' +

      '</div>'
    );
  },

  _checkPassFuerza(val) {
    var el = document.getElementById('passFortaleza');
    if (!el) return;
    if (!val) { el.innerHTML = ''; return; }
    var fuerza = 0;
    if (val.length >= 8)          fuerza++;
    if (/[A-Z]/.test(val))        fuerza++;
    if (/[0-9]/.test(val))        fuerza++;
    if (/[^A-Za-z0-9]/.test(val)) fuerza++;
    var labels = ['','Muy débil','Débil','Buena','Fuerte'];
    var colors = ['','#dc2626','#d97706','#2563eb','#16a34a'];
    el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
      '<div style="display:flex;gap:3px;">' +
        [1,2,3,4].map(function(i){ return '<div style="width:28px;height:4px;border-radius:2px;background:'+(i<=fuerza?colors[fuerza]:'var(--gray-200)')+'"></div>'; }).join('') +
      '</div>' +
      '<span style="color:'+colors[fuerza]+';font-weight:700;">'+labels[fuerza]+'</span>' +
    '</div>';
  },

  _cambiarPassword() {
    var actual    = document.getElementById('sec_actual')?.value || '';
    var nueva     = document.getElementById('sec_nueva')?.value || '';
    var confirmar = document.getElementById('sec_confirmar')?.value || '';
    var u = DB.usuarioActual;
    if (!u) return;

    if (!actual)    { App.toast('Ingresa tu contraseña actual', 'error'); return; }
    if (!nueva)     { App.toast('Ingresa la nueva contraseña', 'error'); return; }
    if (nueva.length < 6) { App.toast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    if (nueva !== confirmar) { App.toast('Las contraseñas no coinciden', 'error'); return; }

    var idx = (DB.usuarios||[]).findIndex(function(x){ return x.id === u.id; });
    if (idx < 0 || DB.usuarios[idx].password !== actual) {
      App.toast('La contraseña actual es incorrecta', 'error'); return;
    }

    DB.usuarios[idx].password = nueva;
    App.toast('✅ Contraseña actualizada correctamente', 'success');
    document.getElementById('sec_actual').value = '';
    document.getElementById('sec_nueva').value = '';
    document.getElementById('sec_confirmar').value = '';
    document.getElementById('passFortaleza').innerHTML = '';
  },

  _cerrarSesion() {
    App.showModal('🚪 Cerrar Sesión',
      '<div style="text-align:center;padding:16px 0;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
          '<i class="fas fa-sign-out-alt" style="font-size:24px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">¿Cerrar sesión?</div>' +
        '<div style="font-size:13px;color:var(--gray-500);">Se cerrará la sesión de <strong>'+(DB.usuarioActual?.nombre||'')+'</strong></div>' +
      '</div>',
      [{ text:'Sí, cerrar sesión', cls:'btn-danger', cb: function() {
        DB.usuarioActual = null;
        App.closeModal();
        if (typeof App.logout === 'function') App.logout();
        else window.location.reload();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '360px';
  },

  // ──────────────────────────────────────────────────────
  // SECCIÓN: ACERCA DE
  // ──────────────────────────────────────────────────────
  _secAcerca() {
    return (
      '<div class="card">' +
        '<div style="padding:40px;text-align:center;">' +
          '<div style="width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,var(--accent),#7c3aed);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 24px rgba(37,99,235,0.3);">' +
            '<i class="fas fa-store" style="font-size:36px;color:white;"></i>' +
          '</div>' +
          '<div style="font-size:24px;font-weight:900;color:var(--gray-800);margin-bottom:4px;">JUMILA ERP</div>' +
          '<div style="font-size:13px;color:var(--gray-400);margin-bottom:24px;">Sistema de Gestión Empresarial</div>' +

          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:480px;margin:0 auto 28px;">' +
            '<div style="padding:14px;background:var(--gray-50);border-radius:10px;">' +
              '<div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Versión</div>' +
              '<div style="font-size:18px;font-weight:900;color:var(--accent);">2.0</div>' +
            '</div>' +
            '<div style="padding:14px;background:var(--gray-50);border-radius:10px;">' +
              '<div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Módulos</div>' +
              '<div style="font-size:18px;font-weight:900;color:var(--accent);">16</div>' +
            '</div>' +
            '<div style="padding:14px;background:var(--gray-50);border-radius:10px;">' +
              '<div style="font-size:10px;color:var(--gray-400);font-weight:700;text-transform:uppercase;">Año</div>' +
              '<div style="font-size:18px;font-weight:900;color:var(--accent);">2026</div>' +
            '</div>' +
          '</div>' +

          '<div style="padding:20px;background:linear-gradient(135deg,#f0fdf4,#eff6ff);border-radius:14px;max-width:400px;margin:0 auto;">' +
            '<div style="font-size:13px;font-weight:800;color:var(--gray-800);margin-bottom:4px;">Desarrollado para</div>' +
            '<div style="font-size:16px;font-weight:900;color:var(--accent);">'+(DB.empresa?.nombre||'GRUPO JUMILA')+'</div>' +
            '<div style="font-size:12px;color:var(--gray-400);margin-top:4px;">'+(DB.empresa?.ruc ? 'RUC: '+DB.empresa.ruc : '')+'</div>' +
          '</div>' +

          '<div style="margin-top:24px;font-size:11px;color:var(--gray-400);">' +
            'ERP JUMILA · Huánuco, Perú · 2026' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }
};
