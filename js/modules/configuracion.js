// ============================================================
// MÓDULO: CONFIGURACIÓN — Versión Profesional Completa
// ============================================================

const ConfiguracionModule = {

  _seccion: 'empresa',

  _fechaHoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },

  render() {
    App.setTabs2('Configuración', 'AJUSTES DEL SISTEMA');

    var secciones = [
      { id:'empresa',       icon:'fa-building',    label:'Empresa',        desc:'Datos fiscales y logo',     color:'#2563eb' },
      { id:'usuarios',      icon:'fa-users-cog',   label:'Usuarios',       desc:'Accesos y permisos',        color:'#7c3aed' },
      { id:'facturacion',   icon:'fa-file-invoice',label:'Facturación',    desc:'Series y comprobantes',     color:'#16a34a' },
      { id:'apariencia',    icon:'fa-palette',     label:'Apariencia',     desc:'Tema y personalización',    color:'#db2777' },
      { id:'notificaciones',icon:'fa-bell',        label:'Notificaciones', desc:'Alertas y avisos',          color:'#d97706' },
      { id:'sistema',       icon:'fa-database',    label:'Sistema',        desc:'Backup y mantenimiento',    color:'#0891b2' },
      { id:'seguridad',     icon:'fa-shield-alt',  label:'Seguridad',      desc:'Contraseña y sesiones',     color:'#dc2626' },
      { id:'acerca',        icon:'fa-info-circle', label:'Acerca de',      desc:'Versión del sistema',       color:'#6b7280' },
    ];

    var self = this;
    var sidebarItems = secciones.map(function(s) {
      var activo = self._seccion === s.id;
      return '<div onclick="ConfiguracionModule._irSeccion(\''+s.id+'\')" ' +
        'style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;' +
        'background:'+(activo?s.color:'transparent')+';color:'+(activo?'white':'var(--gray-700)')+';transition:all 0.15s;user-select:none;" ' +
        'onmouseover="if(\''+s.id+'\'!==ConfiguracionModule._seccion)this.style.background=\'var(--gray-100)\'" ' +
        'onmouseout="if(\''+s.id+'\'!==ConfiguracionModule._seccion)this.style.background=\'transparent\'">' +
        '<div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:'+(activo?'rgba(255,255,255,0.2)':'var(--gray-100)')+';color:'+(activo?'white':s.color)+'">' +
          '<i class="fas '+s.icon+'"></i>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:700;">'+s.label+'</div>' +
          '<div style="font-size:10px;opacity:0.65;margin-top:1px;">'+s.desc+'</div>' +
        '</div>' +
        (activo?'<i class="fas fa-chevron-right" style="font-size:9px;opacity:0.6;flex-shrink:0;"></i>':'') +
      '</div>';
    }).join('');

    return (
      '<div class="page-header"><div>' +
        '<h2 class="page-title"><i class="fas fa-cog" style="color:var(--accent);margin-right:8px;"></i>Configuración</h2>' +
        '<p class="text-muted text-sm">Administra todos los ajustes del sistema ERP</p>' +
      '</div></div>' +
      '<div style="display:flex;gap:16px;align-items:flex-start;">' +
        '<div class="card" style="width:195px;flex-shrink:0;padding:8px;">' +
          '<div style="padding:6px 10px 10px;margin-bottom:4px;border-bottom:1px solid var(--gray-100);">' +
            '<div style="font-size:10px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">Secciones</div>' +
          '</div>' +
          sidebarItems +
        '</div>' +
        '<div style="flex:1;min-width:0;">' + this._renderSeccion() + '</div>' +
      '</div>'
    );
  },

  _irSeccion(id) { this._seccion = id; App.renderPage(); },

  _renderSeccion() {
    var mapa = {
      empresa: this._secEmpresa.bind(this), usuarios: this._secUsuarios.bind(this),
      facturacion: this._secFacturacion.bind(this), apariencia: this._secApariencia.bind(this),
      notificaciones: this._secNotificaciones.bind(this), sistema: this._secSistema.bind(this),
      seguridad: this._secSeguridad.bind(this), acerca: this._secAcerca.bind(this),
    };
    return (mapa[this._seccion] || mapa.empresa)();
  },

  _card(icon, color, title, subtitle, body, btn) {
    return '<div class="card" style="margin-bottom:16px;">' +
      '<div style="padding:16px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:34px;height:34px;border-radius:9px;background:'+color+'18;display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas '+icon+'" style="color:'+color+';font-size:14px;"></i>' +
          '</div>' +
          '<div><div style="font-size:14px;font-weight:800;color:var(--gray-800);">'+title+'</div>' +
          (subtitle?'<div style="font-size:11px;color:var(--gray-400);margin-top:1px;">'+subtitle+'</div>':'') +
          '</div>' +
        '</div>' + (btn||'') +
      '</div><div style="padding:20px;">'+body+'</div></div>';
  },

  _saveBtn(fn, label) {
    return '<div style="display:flex;justify-content:flex-end;margin-top:18px;">' +
      '<button onclick="'+fn+'" style="padding:10px 26px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">' +
        '<i class="fas fa-save" style="margin-right:7px;"></i>'+(label||'Guardar Cambios')+'</button></div>';
  },

  _toggleVis(id) {
    var inp=document.getElementById(id), icon=document.getElementById('vi_'+id);
    if(!inp)return; inp.type=inp.type==='password'?'text':'password';
    if(icon) icon.className=inp.type==='password'?'fas fa-eye':'fas fa-eye-slash';
  },

  // ── 1. EMPRESA ──────────────────────────────────────────
  _secEmpresa() {
    var e = DB.empresa||{};
    var logoSrc = e.logo || '';

    var logoBox = '<div style="display:flex;align-items:center;gap:16px;padding:14px;background:var(--gray-50);border-radius:12px;margin-bottom:20px;">' +
      '<div id="logoPreview" style="width:72px;height:72px;border-radius:14px;border:2px dashed var(--gray-300);display:flex;align-items:center;justify-content:center;overflow:hidden;background:white;flex-shrink:0;">' +
        (logoSrc?'<img src="'+logoSrc+'" style="width:100%;height:100%;object-fit:contain;">':'<div style="text-align:center;"><i class="fas fa-store" style="font-size:26px;color:var(--gray-300);display:block;"></i><span style="font-size:9px;color:var(--gray-400);">Sin logo</span></div>') +
      '</div>' +
      '<div><div style="font-size:15px;font-weight:800;">'+(e.nombre||'Sin nombre')+'</div>' +
      '<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">RUC: '+(e.ruc||'—')+'</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;">' +
        '<button onclick="document.getElementById(\'inputLogo\').click()" style="padding:5px 12px;background:var(--accent);color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fas fa-camera" style="margin-right:4px;"></i>Subir Logo</button>' +
        (logoSrc?'<button onclick="ConfiguracionModule._quitarLogo()" style="padding:5px 12px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;"><i class="fas fa-trash" style="margin-right:4px;"></i>Quitar</button>':'') +
      '</div>' +
      '<input type="file" id="inputLogo" accept="image/*" style="display:none;" onchange="ConfiguracionModule._onLogo(event)">' +
      '</div></div>';

    var camposHTML = logoBox +
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Razón Social <span style="color:red">*</span></label><input class="form-control" id="cfg_nombre" value="'+(e.nombre||'')+'" placeholder="Ej: MI TIENDA S.A.C."/></div>' +
        '<div class="form-group"><label class="form-label">RUC</label><input class="form-control" id="cfg_ruc" maxlength="11" value="'+(e.ruc||'')+'" placeholder="20XXXXXXXXX"/></div>' +
        '<div class="form-group"><label class="form-label">Sucursal</label><input class="form-control" id="cfg_sucursal" value="'+(e.sucursal||'')+'" placeholder="Sede principal"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Dirección</label><input class="form-control" id="cfg_dir" value="'+(e.direccion||'')+'" placeholder="Av. ..."/></div>' +
        '<div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" id="cfg_tel" value="'+(e.telefono||'')+'" placeholder="062-XXXXXX"/></div>' +
        '<div class="form-group"><label class="form-label">Email</label><input class="form-control" id="cfg_mail" type="email" value="'+(e.email||'')+'" placeholder="contacto@empresa.com"/></div>' +
        '<div class="form-group"><label class="form-label">WhatsApp</label>' +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<span style="padding:8px 10px;background:var(--gray-100);border-radius:8px;font-size:13px;color:var(--gray-500);border:1px solid var(--gray-200);white-space:nowrap;">+51</span>' +
            '<input class="form-control" id="cfg_wa" value="'+(e.whatsapp||'')+'" placeholder="987654321" style="flex:1;"/>' +
          '</div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Sitio Web</label><input class="form-control" id="cfg_web" value="'+(e.web||'')+'" placeholder="www.mitienda.com"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Lema / Eslogan</label><input class="form-control" id="cfg_lema" value="'+(e.lema||'')+'" placeholder="Ej: CALIDAD Y CONFIANZA EN CADA PRENDA"/></div>' +
        '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Resolución de Autorización SUNAT</label><input class="form-control" id="cfg_resolucion" value="'+(e.resolucion||'')+'" placeholder="Ej: 034-005-0010431"/></div>' +
      '</div>' +
      this._saveBtn('ConfiguracionModule._guardarEmpresa()');

    var monedaHTML =
      '<div class="form-grid">' +
        '<div class="form-group"><label class="form-label">Moneda</label>' +
          '<select class="form-control" id="cfg_moneda"><option value="SOLES"'+(( e.moneda||'SOLES')==='SOLES'?' selected':'')+'>🇵🇪 Soles (S/)</option><option value="DOLARES"'+(e.moneda==='DOLARES'?' selected':'')+'>🇺🇸 Dólares ($)</option></select>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Tipo de Cambio (S/ por $)</label><input class="form-control" id="cfg_tc" type="number" step="0.001" value="'+(e.tipoCambio||3.467)+'"/></div>' +
        '<div class="form-group"><label class="form-label">Símbolo</label><input class="form-control" id="cfg_sim" maxlength="3" value="'+(e.simbolo||'S/')+'" placeholder="S/"/></div>' +
        '<div class="form-group"><label class="form-label">País</label>' +
          '<select class="form-control" id="cfg_pais"><option value="PE"'+(( e.pais||'PE')==='PE'?' selected':'')+'>🇵🇪 Perú</option><option value="CO"'+(e.pais==='CO'?' selected':'')+'>🇨🇴 Colombia</option><option value="MX"'+(e.pais==='MX'?' selected':'')+'>🇲🇽 México</option></select>' +
        '</div>' +
      '</div>' + this._saveBtn('ConfiguracionModule._guardarMoneda()', 'Guardar Moneda');

    return this._card('fa-id-card','#2563eb','Información de la Empresa','Datos fiscales, logo y contacto', camposHTML) +
           this._card('fa-coins','#16a34a','Moneda y Región','Moneda principal y tipo de cambio', monedaHTML);
  },

  _onLogo(ev) {
    var f=ev.target.files[0]; if(!f)return;
    if(f.size>2097152){App.toast('El logo no debe superar 2MB','error');return;}
    var r=new FileReader(); r.onload=function(e){
      DB.empresa.logo=e.target.result; Storage.guardarEmpresa();
      SupabaseDB.actualizarEmpresa(DB.empresa);
      var p=document.getElementById('logoPreview');
      if(p) p.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:contain;">';
      App.toast('✅ Logo actualizado','success');
    }; r.readAsDataURL(f);
  },

  _quitarLogo() { DB.empresa.logo=''; Storage.guardarEmpresa(); SupabaseDB.actualizarEmpresa(DB.empresa); App.toast('Logo eliminado','warning'); App.renderPage(); },

  _guardarEmpresa() {
    var n=(document.getElementById('cfg_nombre')?.value||'').trim();
    if(!n){App.toast('El nombre es obligatorio','error');return;}
    Object.assign(DB.empresa, { nombre:n, ruc:(document.getElementById('cfg_ruc')?.value||'').trim(),
      sucursal:(document.getElementById('cfg_sucursal')?.value||'').trim(), direccion:(document.getElementById('cfg_dir')?.value||'').trim(),
      telefono:(document.getElementById('cfg_tel')?.value||'').trim(), email:(document.getElementById('cfg_mail')?.value||'').trim(),
      whatsapp:(document.getElementById('cfg_wa')?.value||'').trim(), web:(document.getElementById('cfg_web')?.value||'').trim(),
      lema:(document.getElementById('cfg_lema')?.value||'').trim(), resolucion:(document.getElementById('cfg_resolucion')?.value||'').trim() });
    Storage.guardarEmpresa();
    SupabaseDB.actualizarEmpresa(DB.empresa);
    App.toast('✅ Datos de empresa guardados','success');
  },

  _guardarMoneda() {
    Object.assign(DB.empresa, { moneda:document.getElementById('cfg_moneda')?.value||'SOLES',
      tipoCambio:parseFloat(document.getElementById('cfg_tc')?.value)||3.467,
      simbolo:(document.getElementById('cfg_sim')?.value||'S/').trim(), pais:document.getElementById('cfg_pais')?.value||'PE' });
    Storage.guardarEmpresa();
    SupabaseDB.actualizarEmpresa(DB.empresa);
    App.toast('✅ Moneda guardada','success');
  },

  // ── 2. USUARIOS ─────────────────────────────────────────
  _secUsuarios() {
    var filas = (DB.usuarios||[]).map(function(u) {
      var ad=u.rol==='admin'||u.permisos==='todos', yo=DB.usuarioActual&&DB.usuarioActual.id===u.id;
      var c=ad?'#7c3aed':'#2563eb';
      return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:11px 16px;"><div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:'+c+';color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;">'+(u.nombre[0]||'?').toUpperCase()+'</div>' +
          '<div><div style="font-size:13px;font-weight:700;">'+u.nombre+'</div><div style="font-size:11px;color:var(--gray-400);">@'+u.usuario+'</div></div>' +
        '</div></td>' +
        '<td style="padding:11px 8px;"><span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(ad?'#f5f3ff':'#eff6ff')+';color:'+c+'">'+(ad?'ADMIN':'CAJERO')+'</span>'+(yo?'<span style="margin-left:4px;padding:2px 6px;border-radius:10px;font-size:9px;font-weight:700;background:#fef3c7;color:#d97706;">TÚ</span>':'')+'</td>' +
        '<td style="padding:11px 8px;font-size:12px;color:var(--gray-500);">'+(u.cargo||'—')+'</td>' +
        '<td style="padding:11px 8px;font-size:11px;color:var(--gray-400);">'+(u.sucursal||'—')+'</td>' +
        '<td style="padding:11px 8px;"><span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(u.activo!==false?'#f0fdf4':'#fef2f2')+';color:'+(u.activo!==false?'#16a34a':'#dc2626')+'">'+(u.activo!==false?'ACTIVO':'INACTIVO')+'</span></td>' +
        '<td style="padding:11px 16px;"><div style="display:flex;gap:5px;justify-content:flex-end;">' +
          '<button onclick="ConfiguracionModule._permisos('+u.id+')" title="Permisos" style="width:28px;height:28px;border-radius:6px;border:none;background:#f5f3ff;color:#7c3aed;cursor:pointer;font-size:12px;"><i class="fas fa-key"></i></button>' +
          '<button onclick="ConfiguracionModule._editUser('+u.id+')" title="Editar" style="width:28px;height:28px;border-radius:6px;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;font-size:12px;"><i class="fas fa-edit"></i></button>' +
          '<button onclick="ConfiguracionModule._passUser('+u.id+')" title="Contraseña" style="width:28px;height:28px;border-radius:6px;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;font-size:12px;"><i class="fas fa-lock"></i></button>' +
          (!yo?'<button onclick="ConfiguracionModule._togUser('+u.id+')" title="'+(u.activo!==false?'Desactivar':'Activar')+'" style="width:28px;height:28px;border-radius:6px;border:none;background:'+(u.activo!==false?'#fef2f2':'#f0fdf4')+';color:'+(u.activo!==false?'#dc2626':'#16a34a')+';cursor:pointer;font-size:12px;"><i class="fas '+(u.activo!==false?'fa-user-slash':'fa-user-check')+'"></i></button>':'') +
        '</div></td>' +
      '</tr>';
    }).join('');

    var tabla = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
        '<th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Usuario</th>' +
        '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Rol</th>' +
        '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cargo</th>' +
        '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Sucursal</th>' +
        '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
        '<th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Acciones</th>' +
      '</tr></thead><tbody>'+filas+'</tbody></table></div>';

    var btn = '<button onclick="ConfiguracionModule._newUser()" style="padding:7px 14px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nuevo</button>';
    return this._card('fa-users-cog','#7c3aed','Gestión de Usuarios','Administra accesos y permisos', tabla, btn);
  },

  _userForm(u) {
    u=u||{};
    return '<div class="form-grid">' +
      '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre completo *</label><input class="form-control" id="uf_nombre" value="'+(u.nombre||'')+'" placeholder="Juan Pérez" autofocus/></div>' +
      '<div class="form-group"><label class="form-label">Usuario (login) *</label><input class="form-control" id="uf_user" value="'+(u.usuario||'')+'" placeholder="juanperez"/></div>' +
      '<div class="form-group"><label class="form-label">Rol</label><select class="form-control" id="uf_rol"><option value="admin"'+(u.rol==='admin'?' selected':'')+'>👑 Administrador</option><option value="cajero"'+(u.rol!=='admin'?' selected':'')+'>👤 Cajero</option></select></div>' +
      '<div class="form-group"><label class="form-label">Cargo</label><input class="form-control" id="uf_cargo" value="'+(u.cargo||'')+'" placeholder="Cajero, Vendedor..."/></div>' +
      '<div class="form-group"><label class="form-label">Sucursal</label><input class="form-control" id="uf_suc" value="'+(u.sucursal||DB.empresa?.sucursal||'')+'" placeholder="Sede principal"/></div>' +
    '</div>';
  },

  _newUser() {
    App.showModal('➕ Nuevo Usuario', this._userForm() +
      '<div class="form-group" style="margin-top:12px;"><label class="form-label">Contraseña *</label>' +
        '<div style="position:relative;"><input class="form-control" id="uf_pass" type="password" placeholder="Mínimo 6 caracteres" style="padding-right:38px;"/>' +
        '<button type="button" onclick="ConfiguracionModule._toggleVis(\'uf_pass\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye" id="vi_uf_pass"></i></button></div></div>',
      [{text:'💾 Crear',cls:'btn-primary',cb:function(){ConfiguracionModule._saveUser(null);}}]
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  _editUser(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    App.showModal('✏️ Editar — '+u.nombre, this._userForm(u),
      [{text:'💾 Guardar',cls:'btn-primary',cb:function(){ConfiguracionModule._saveUser(id);}}]
    );
    document.getElementById('modalBox').style.maxWidth='480px';
  },

  _saveUser(id) {
    var n=(document.getElementById('uf_nombre')?.value||'').trim();
    var u=(document.getElementById('uf_user')?.value||'').trim();
    var r=document.getElementById('uf_rol')?.value||'cajero';
    var c=(document.getElementById('uf_cargo')?.value||'').trim();
    var s=(document.getElementById('uf_suc')?.value||'').trim();
    var p=(document.getElementById('uf_pass')?.value||'').trim();
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
      App.toast('✅ Usuario actualizado','success');
    } else {
      var nid=DB.usuarios.length>0?Math.max.apply(null,DB.usuarios.map(function(x){return x.id;}))+1:1;
      DB.usuarios.push({id:nid,nombre:n,usuario:u,password:p,rol:r,cargo:c,sucursal:s,activo:true,fechaCreacion:this._fechaHoy(),
        permisos:r==='admin'?'todos':{inicio:true,pos:true,ventas:true,caja:true,clientes:true,productos:true}});
      App.toast('✅ Usuario creado','success');
    }
    App.closeModal(); App.renderPage();
  },

  _passUser(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    App.showModal('🔑 Contraseña — '+u.nombre,
      '<div class="form-group"><label class="form-label">Nueva contraseña *</label>' +
        '<div style="position:relative;"><input class="form-control" id="pu_n" type="password" placeholder="Mínimo 6 caracteres" style="padding-right:38px;" autofocus/>' +
        '<button type="button" onclick="ConfiguracionModule._toggleVis(\'pu_n\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye" id="vi_pu_n"></i></button></div></div>' +
      '<div class="form-group" style="margin-top:12px;"><label class="form-label">Confirmar *</label><input class="form-control" id="pu_c" type="password" placeholder="Repite la contraseña"/></div>',
      [{text:'🔑 Cambiar',cls:'btn-primary',cb:function(){
        var n=document.getElementById('pu_n')?.value||'', c=document.getElementById('pu_c')?.value||'';
        if(n.length<6){App.toast('Mínimo 6 caracteres','error');return;}
        if(n!==c){App.toast('Las contraseñas no coinciden','error');return;}
        var i=DB.usuarios.findIndex(function(x){return x.id===id;});
        if(i>=0)DB.usuarios[i].password=n;
        App.toast('✅ Contraseña actualizada','success'); App.closeModal();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='380px';
  },

  _togUser(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    u.activo=u.activo===false; App.toast(u.activo?'✅ Usuario activado':'⚠️ Desactivado',u.activo?'success':'warning'); App.renderPage();
  },

  _permUserId:null, _permMods:null,

  _permisos(id) {
    var u=(DB.usuarios||[]).find(function(x){return x.id===id;}); if(!u)return;
    if(u.permisos==='todos'){App.toast('Administrador: acceso total','info');return;}
    var perms=u.permisos||{};
    var mods=[
      {k:'inicio',l:'Inicio'},{k:'pos',l:'Punto de Venta'},{k:'ventas',l:'Ventas'},
      {k:'cotizaciones',l:'Cotizaciones'},{k:'clientes',l:'Clientes'},{k:'productos',l:'Productos'},
      {k:'inventario',l:'Inventario'},{k:'compras',l:'Compras'},{k:'caja',l:'Caja'},
      {k:'reportes',l:'Reportes'},{k:'kardex',l:'Kardex'},{k:'agenda',l:'Agenda'},
      {k:'tickets',l:'Tickets'},{k:'precios',l:'Precios'},{k:'configuracion',l:'Config.'},{k:'soporte',l:'Soporte'},
    ];
    this._permUserId=id; this._permMods=mods;

    var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div style="font-size:12px;font-weight:700;color:var(--gray-600);">Módulos accesibles para @'+u.usuario+'</div>' +
      '<div style="display:flex;gap:6px;">' +
        '<button onclick="ConfiguracionModule._allPerms(true)" style="padding:4px 10px;background:#f0fdf4;color:#16a34a;border:1px solid #86efac;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Todo</button>' +
        '<button onclick="ConfiguracionModule._allPerms(false)" style="padding:4px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Nada</button>' +
      '</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
      mods.map(function(m){
        var on=perms[m.k]===true;
        return '<div id="pb_'+m.k+'" onclick="ConfiguracionModule._togPerm(\''+m.k+'\')" ' +
          'style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;border:1.5px solid '+(on?'#86efac':'var(--gray-200)')+';background:'+(on?'#f0fdf4':'white')+';cursor:pointer;transition:all 0.15s;">' +
          '<div style="width:18px;height:18px;border-radius:4px;background:'+(on?'#16a34a':'var(--gray-200)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+(on?'<i class="fas fa-check" style="font-size:9px;color:white;"></i>':'')+'</div>' +
          '<span style="font-size:12px;font-weight:600;color:'+(on?'#15803d':'var(--gray-600)')+';">'+m.l+'</span>' +
        '</div>';
      }).join('')+'</div>';

    App.showModal('🔑 Permisos — '+u.nombre, html,
      [{text:'💾 Guardar',cls:'btn-primary',cb:function(){
        var idx=DB.usuarios.findIndex(function(x){return x.id===id;});
        if(idx<0)return;
        var np={};
        mods.forEach(function(m){
          var b=document.getElementById('pb_'+m.k);
          np[m.k]=b?b.style.background.includes('240, 253, 244'):'false';
        });
        DB.usuarios[idx].permisos=np;
        App.toast('✅ Permisos guardados para '+u.nombre,'success'); App.closeModal();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='460px';
  },

  _togPerm(key) {
    var b=document.getElementById('pb_'+key); if(!b)return;
    var on=b.style.background.includes('240, 253, 244');
    b.style.background=!on?'#f0fdf4':'white'; b.style.borderColor=!on?'#86efac':'var(--gray-200)';
    var d=b.querySelector('div'); if(d){d.style.background=!on?'#16a34a':'var(--gray-200)'; d.innerHTML=!on?'<i class="fas fa-check" style="font-size:9px;color:white;"></i>':'';}
    var sp=b.querySelector('span'); if(sp)sp.style.color=!on?'#15803d':'var(--gray-600)';
  },

  _allPerms(v) {
    (this._permMods||[]).forEach(function(m){
      var b=document.getElementById('pb_'+m.k); if(!b)return;
      b.style.background=v?'#f0fdf4':'white'; b.style.borderColor=v?'#86efac':'var(--gray-200)';
      var d=b.querySelector('div'); if(d){d.style.background=v?'#16a34a':'var(--gray-200)'; d.innerHTML=v?'<i class="fas fa-check" style="font-size:9px;color:white;"></i>':'';}
      var sp=b.querySelector('span'); if(sp)sp.style.color=v?'#15803d':'var(--gray-600)';
    });
  },

  // ── 3. FACTURACIÓN ──────────────────────────────────────
  _secFacturacion() {
    var e=DB.empresa||{}, seq=DB._sequences||{};

    var fiscal='<div class="form-grid">' +
      '<div class="form-group"><label class="form-label">Tasa IGV (%)</label><input class="form-control" id="fi_igv" type="number" step="0.1" value="'+(e.igv||18)+'"/></div>' +
      '<div class="form-group"><label class="form-label">IGV por defecto</label><select class="form-control" id="fi_igvd"><option value="incluido"'+(( e.igvDefault||'incluido')==='incluido'?' selected':'')+'>Precio incluye IGV</option><option value="exonerado"'+(e.igvDefault==='exonerado'?' selected':'')+'>Exonerado de IGV</option></select></div>' +
      '<div class="form-group"><label class="form-label">Decimales en precios</label><select class="form-control" id="fi_dec"><option value="2"'+(( e.decimales||2)===2?' selected':'')+'>2 decimales — S/ 10.50</option><option value="0"'+(e.decimales===0?' selected':'')+'>Sin decimales — S/ 10</option></select></div>' +
      '<div class="form-group"><label class="form-label">Imprimir ticket automático</label><select class="form-control" id="fi_print"><option value="si"'+(e.autoprint!==false?' selected':'')+'>Sí, al cerrar venta</option><option value="no"'+(e.autoprint===false?' selected':'')+'>No imprimir</option></select></div>' +
    '</div>' + this._saveBtn('ConfiguracionModule._saveFiscal()');

    var docs=[{k:'NV03',l:'Nota de Venta',i:'fa-receipt',c:'#2563eb'},{k:'BV03',l:'Boleta',i:'fa-file-invoice',c:'#16a34a'},{k:'FC01',l:'Factura',i:'fa-file-contract',c:'#7c3aed'}];
    var series='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">' +
      docs.map(function(d){
        return '<div style="padding:16px;background:var(--gray-50);border-radius:12px;border:1.5px solid var(--gray-200);">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
            '<div style="width:30px;height:30px;border-radius:7px;background:'+d.c+'18;display:flex;align-items:center;justify-content:center;"><i class="fas '+d.i+'" style="color:'+d.c+';font-size:12px;"></i></div>' +
            '<div style="font-size:12px;font-weight:700;color:var(--gray-700);">'+d.l+'</div>' +
          '</div>' +
          '<div style="font-size:20px;font-weight:900;color:'+d.c+';margin-bottom:8px;">'+d.k+'</div>' +
          '<label style="font-size:10px;font-weight:700;color:var(--gray-500);text-transform:uppercase;display:block;margin-bottom:4px;">Próximo Nº</label>' +
          '<input type="number" id="sq_'+d.k+'" value="'+(seq[d.k]||1)+'" min="1" style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:18px;font-weight:900;text-align:center;color:'+d.c+';box-sizing:border-box;"/>' +
        '</div>';
      }).join('') + '</div>' + this._saveBtn('ConfiguracionModule._saveSeries()','Guardar Series');

    return this._card('fa-percent','#16a34a','Configuración Fiscal','IGV, decimales y comportamiento de ventas',fiscal) +
           this._card('fa-hashtag','#2563eb','Series y Correlativos','Próximo número a emitir por tipo de comprobante',series);
  },

  _saveFiscal() {
    Object.assign(DB.empresa,{igv:parseFloat(document.getElementById('fi_igv')?.value)||18,
      igvDefault:document.getElementById('fi_igvd')?.value||'incluido',
      decimales:parseInt(document.getElementById('fi_dec')?.value)||2,
      autoprint:document.getElementById('fi_print')?.value!=='no'});
    Storage.guardarEmpresa(); App.toast('✅ Configuración fiscal guardada','success');
  },

  _saveSeries() {
    ['NV03','BV03','FC01'].forEach(function(k){
      DB._sequences[k]=parseInt(document.getElementById('sq_'+k)?.value)||1;
    });
    Storage.guardarSequences(); App.toast('✅ Series actualizadas','success');
  },

  // ── 4. APARIENCIA ────────────────────────────────────────
  _secApariencia() {
    var dark=document.body.classList.contains('dark-mode');
    var actual=localStorage.getItem('erp_accent')||'#2563eb';
    var colores=['#2563eb','#7c3aed','#db2777','#dc2626','#16a34a','#d97706','#0891b2','#1e3a5f','#065f46','#7f1d1d'];

    var tema='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      [
        {v:false,label:'☀️ Modo Claro',desc:'Fondo blanco, texto oscuro',bg:'#f8fafc',border:'#e2e8f0'},
        {v:true, label:'🌙 Modo Oscuro',desc:'Fondo oscuro, texto claro',  bg:'#1e293b',border:'#334155'},
      ].map(function(t){
        var sel=dark===t.v;
        return '<div onclick="ConfiguracionModule._setTema('+t.v+')" style="padding:16px;border-radius:12px;border:2px solid '+(sel?'var(--accent)':'var(--gray-200)')+';background:'+(sel?'#eff6ff':'white')+';cursor:pointer;transition:all 0.15s;">' +
          '<div style="width:48px;height:30px;border-radius:8px;background:'+t.bg+';border:1px solid '+t.border+';margin:0 auto 8px;"></div>' +
          '<div style="text-align:center;"><div style="font-size:13px;font-weight:700;">'+t.label+'</div><div style="font-size:10px;color:var(--gray-400);margin-top:2px;">'+t.desc+'</div>' +
          (sel?'<div style="font-size:10px;color:var(--accent);font-weight:700;margin-top:4px;">● Activo</div>':'')+'</div>' +
        '</div>';
      }).join('')+'</div>';

    var acento='<div style="margin-bottom:16px;">' +
      '<div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:10px;">Color principal del sistema</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">' +
        colores.map(function(c){
          var sel=c===actual;
          return '<div onclick="ConfiguracionModule._setAccent(\''+c+'\')" title="'+c+'" ' +
            'style="width:36px;height:36px;border-radius:10px;background:'+c+';cursor:pointer;border:3px solid '+(sel?'var(--gray-800)':'transparent')+';box-shadow:0 2px 8px '+c+'55;transition:all 0.15s;display:flex;align-items:center;justify-content:center;">' +
            (sel?'<i class="fas fa-check" style="color:white;font-size:12px;"></i>':'')+'</div>';
        }).join('')+'</div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<input type="color" id="colorPick" value="'+actual+'" oninput="document.getElementById(\'colorHex\').value=this.value" style="width:44px;height:36px;border:none;border-radius:8px;cursor:pointer;padding:2px;"/>' +
        '<input class="form-control" id="colorHex" value="'+actual+'" placeholder="#2563eb" style="width:120px;font-family:monospace;" oninput="document.getElementById(\'colorPick\').value=this.value"/>' +
        '<button onclick="ConfiguracionModule._setAccent(document.getElementById(\'colorHex\').value)" style="padding:8px 14px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Aplicar</button>' +
      '</div></div>';

    var densidad='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">' +
      [{v:'compacto',l:'Compacto',d:'Más info visible',i:'fa-compress-alt'},{v:'normal',l:'Normal',d:'Balance ideal',i:'fa-grip-lines'},{v:'espacioso',l:'Espacioso',d:'Más cómodo',i:'fa-expand-alt'}].map(function(x){
        var sel=(localStorage.getItem('erp_density')||'normal')===x.v;
        return '<div onclick="ConfiguracionModule._setDens(\''+x.v+'\')" style="padding:14px;border-radius:10px;border:2px solid '+(sel?'var(--accent)':'var(--gray-200)')+';background:'+(sel?'#eff6ff':'white')+';cursor:pointer;text-align:center;transition:all 0.15s;">' +
          '<i class="fas '+x.i+'" style="font-size:20px;color:'+(sel?'var(--accent)':'var(--gray-400)')+';display:block;margin-bottom:6px;"></i>' +
          '<div style="font-size:12px;font-weight:700;">'+x.l+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);margin-top:2px;">'+x.d+'</div>' +
          (sel?'<div style="font-size:10px;color:var(--accent);font-weight:700;margin-top:4px;">● Activo</div>':'')+'</div>';
      }).join('')+'</div>';

    return this._card('fa-adjust','#db2777','Tema del Sistema','Alterna entre modo claro y oscuro',tema) +
           this._card('fa-palette','#7c3aed','Color Principal','Personaliza el color primario de la interfaz',acento) +
           this._card('fa-grip-lines','#0891b2','Densidad de Interfaz','Ajusta el espaciado de la interfaz',densidad);
  },

  _setTema(dark) {
    dark?document.body.classList.add('dark-mode'):document.body.classList.remove('dark-mode');
    localStorage.setItem('erp_jumila_theme',dark?'dark':'light');
    App.toast(dark?'🌙 Modo oscuro activado':'☀️ Modo claro activado','success');
    App.renderPage();
  },

  _setAccent(c) {
    if(!/^#[0-9A-Fa-f]{6}$/.test(c)){App.toast('Color inválido. Usa formato #RRGGBB','error');return;}
    document.documentElement.style.setProperty('--accent',c);
    localStorage.setItem('erp_accent',c);
    App.toast('✅ Color aplicado','success'); App.renderPage();
  },

  _setDens(v) { localStorage.setItem('erp_density',v); App.toast('✅ Densidad: '+v,'success'); App.renderPage(); },

  // ── 5. NOTIFICACIONES ────────────────────────────────────
  _secNotificaciones() {
    var cfg=JSON.parse(localStorage.getItem('erp_notif_cfg')||'{}');

    var row=function(key,label,desc,def){
      var on=cfg[key]!==undefined?cfg[key]:def;
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--gray-100);">' +
        '<div><div style="font-size:13px;font-weight:700;">'+label+'</div><div style="font-size:11px;color:var(--gray-400);margin-top:2px;">'+desc+'</div></div>' +
        '<div onclick="ConfiguracionModule._togNotif(\''+key+'\')" id="nt_'+key+'" ' +
          'style="width:44px;height:24px;border-radius:12px;background:'+(on?'var(--accent)':'var(--gray-300)')+';cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;">' +
          '<div style="width:18px;height:18px;border-radius:50%;background:white;position:absolute;top:3px;transition:all 0.2s;'+(on?'right:3px;':'left:3px;')+'box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>' +
        '</div>' +
      '</div>';
    };

    var body=row('stock_bajo','Alerta de stock bajo','Avisar cuando el stock alcance el mínimo',true) +
      row('stock_agotado','Alerta de stock agotado','Avisar cuando un producto llegue a 0 unidades',true) +
      row('caja_abierta','Recordatorio caja abierta','Avisar si la caja quedó abierta al cerrar sesión',false) +
      row('ventas_dia','Resumen diario de ventas','Mostrar resumen al final del día',false) +
      row('comprobante_pdf','Generar PDF automático','Crear PDF del comprobante al emitir',false) +
      '<div style="margin-top:16px;display:flex;align-items:center;gap:12px;">' +
        '<div style="flex:1;"><label style="font-size:12px;font-weight:700;color:var(--gray-600);display:block;margin-bottom:4px;">Stock mínimo de alerta (unidades)</label>' +
        '<div style="font-size:11px;color:var(--gray-400);">Se usará si el producto no tiene mínimo propio</div></div>' +
        '<input class="form-control" id="nt_min" type="number" min="1" value="'+(cfg.stock_min||10)+'" style="width:90px;text-align:center;font-weight:700;"/>' +
      '</div>' +
      this._saveBtn('ConfiguracionModule._saveNotif()','Guardar Notificaciones');

    return this._card('fa-bell','#d97706','Alertas y Notificaciones','Configura qué avisos quieres recibir del sistema',body);
  },

  _togNotif(key) {
    var cfg=JSON.parse(localStorage.getItem('erp_notif_cfg')||'{}');
    cfg[key]=!cfg[key]; localStorage.setItem('erp_notif_cfg',JSON.stringify(cfg));
    var el=document.getElementById('nt_'+key); if(!el)return;
    var on=cfg[key]; el.style.background=on?'var(--accent)':'var(--gray-300)';
    var dot=el.querySelector('div'); if(dot){dot.style.left=on?'':'3px'; dot.style.right=on?'3px':'';}
  },

  _saveNotif() {
    var cfg=JSON.parse(localStorage.getItem('erp_notif_cfg')||'{}');
    cfg.stock_min=parseInt(document.getElementById('nt_min')?.value)||10;
    localStorage.setItem('erp_notif_cfg',JSON.stringify(cfg));
    App.toast('✅ Notificaciones guardadas','success');
  },

  // ── 6. SISTEMA ──────────────────────────────────────────
  _secSistema() {
    var usoB=0; try{Object.keys(localStorage).forEach(function(k){usoB+=(localStorage.getItem(k)||'').length*2;});}catch(e){}
    var usoMB=(usoB/1048576).toFixed(2), pct=Math.min(100,(usoB/5242880*100)).toFixed(0);

    var stats='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">' +
      [{l:'Ventas',v:(DB.ventas||[]).length,c:'#16a34a',i:'fa-shopping-cart'},
       {l:'Clientes',v:(DB.clientes||[]).length,c:'#2563eb',i:'fa-users'},
       {l:'Productos',v:(DB.productos||[]).length,c:'#7c3aed',i:'fa-boxes'},
       {l:'Kardex',v:(DB.kardex||[]).length,c:'#d97706',i:'fa-history'},
       {l:'Mov.Caja',v:(DB.movimientosCaja||[]).length,c:'#0891b2',i:'fa-exchange-alt'}].map(function(s){
        return '<div style="text-align:center;padding:14px;background:var(--gray-50);border-radius:10px;">' +
          '<i class="fas '+s.i+'" style="font-size:20px;color:'+s.c+';display:block;margin-bottom:6px;"></i>' +
          '<div style="font-size:22px;font-weight:900;color:var(--gray-800);">'+s.v+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);font-weight:700;">'+s.l+'</div></div>';
      }).join('')+'</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
        '<span style="font-size:12px;font-weight:700;color:var(--gray-600);">Almacenamiento</span>' +
        '<span style="font-size:12px;font-weight:700;color:var(--gray-700);">'+usoMB+' MB / 5 MB ('+pct+'%)</span>' +
      '</div>' +
      '<div style="height:10px;background:var(--gray-200);border-radius:5px;overflow:hidden;">' +
        '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+(pct>80?'#dc2626':'var(--accent)')+','+(pct>80?'#ef4444':'#7c3aed')+');border-radius:5px;transition:width 0.5s;"></div>' +
      '</div>';

    var backup='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
      '<div style="padding:18px;background:#f0fdf4;border-radius:12px;border:1.5px solid #86efac;">' +
        '<div style="font-size:13px;font-weight:800;color:#15803d;margin-bottom:6px;"><i class="fas fa-download" style="margin-right:6px;"></i>Exportar Backup</div>' +
        '<div style="font-size:11px;color:#16a34a;margin-bottom:14px;line-height:1.5;">Descarga un archivo JSON con todos los datos del sistema.</div>' +
        '<button onclick="ConfiguracionModule._exportBK()" style="width:100%;padding:10px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-download" style="margin-right:6px;"></i>Descargar</button>' +
      '</div>' +
      '<div style="padding:18px;background:#eff6ff;border-radius:12px;border:1.5px solid #93c5fd;">' +
        '<div style="font-size:13px;font-weight:800;color:#1d4ed8;margin-bottom:6px;"><i class="fas fa-upload" style="margin-right:6px;"></i>Restaurar Backup</div>' +
        '<div style="font-size:11px;color:#2563eb;margin-bottom:14px;line-height:1.5;"><strong>Reemplazará todos los datos actuales.</strong></div>' +
        '<button onclick="document.getElementById(\'bkFile\').click()" style="width:100%;padding:10px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-upload" style="margin-right:6px;"></i>Cargar Archivo</button>' +
        '<input type="file" id="bkFile" accept=".json" style="display:none;" onchange="ConfiguracionModule._importBK(event)"/>' +
      '</div>' +
      '<div style="padding:18px;background:#fff7ed;border-radius:12px;border:1.5px solid #fed7aa;">' +
        '<div style="font-size:13px;font-weight:800;color:#c2410c;margin-bottom:6px;"><i class="fas fa-eraser" style="margin-right:6px;"></i>Limpiar Ventas</div>' +
        '<div style="font-size:11px;color:#ea580c;margin-bottom:14px;line-height:1.5;">Elimina el historial de ventas. Clientes y productos se conservan.</div>' +
        '<button onclick="ConfiguracionModule._clearVentas()" style="width:100%;padding:10px;background:#ea580c;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-eraser" style="margin-right:6px;"></i>Limpiar Ventas</button>' +
      '</div>' +
      '<div style="padding:18px;background:#fef2f2;border-radius:12px;border:1.5px solid #fca5a5;">' +
        '<div style="font-size:13px;font-weight:800;color:#dc2626;margin-bottom:6px;"><i class="fas fa-trash-alt" style="margin-right:6px;"></i>Resetear Sistema</div>' +
        '<div style="font-size:11px;color:#dc2626;margin-bottom:14px;line-height:1.5;"><strong>Elimina TODOS los datos.</strong> Acción irreversible.</div>' +
        '<button onclick="ConfiguracionModule._reset()" style="width:100%;padding:10px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-skull-crossbones" style="margin-right:6px;"></i>Resetear Todo</button>' +
      '</div></div>';

    return this._card('fa-chart-bar','#0891b2','Estadísticas y Almacenamiento','Datos del sistema y uso de memoria',stats) +
           this._card('fa-database','#16a34a','Backup y Mantenimiento','Exporta, restaura y gestiona los datos',backup);
  },

  _exportBK() {
    var b={version:'2.1',fecha:new Date().toISOString(),empresa:DB.empresa,clientes:DB.clientes,
      ventas:DB.ventas,productos:DB.productos,kardex:DB.kardex||[],cotizaciones:DB.cotizaciones||[],
      compras:DB.compras||[],sequences:DB._sequences,movimientosCaja:DB.movimientosCaja||[],
      cajas:DB.cajas||[],notasCredito:DB.notasCredito||[],agenda:DB.agenda||[]};
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(b,null,2)],{type:'application/json'}));
    a.download='backup_erp_'+this._fechaHoy()+'.json'; a.click();
    URL.revokeObjectURL(a.href); App.toast('✅ Backup exportado','success');
  },

  _importBK(ev) {
    var f=ev.target.files[0]; if(!f)return;
    var r=new FileReader(); r.onload=function(e){
      App.showModal('⚠️ Restaurar Backup',
        '<div style="text-align:center;padding:10px 0;">' +
          '<div style="width:54px;height:54px;border-radius:50%;background:#fffbeb;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><i class="fas fa-exclamation-triangle" style="font-size:22px;color:#d97706;"></i></div>' +
          '<div style="font-size:15px;font-weight:800;margin-bottom:6px;">¿Restaurar este backup?</div>' +
          '<div style="font-size:12px;color:var(--gray-500);margin-bottom:12px;">'+f.name+'</div>' +
          '<div style="background:#fef2f2;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">⚠️ Se reemplazarán TODOS los datos actuales.</div>' +
        '</div>',
        [{text:'✅ Restaurar',cls:'btn-danger',cb:function(){
          try{
            var d=JSON.parse(e.target.result);
            if(d.empresa){DB.empresa=d.empresa;Storage.guardarEmpresa();}
            if(d.clientes){DB.clientes=d.clientes;Storage.guardarClientes();}
            if(d.ventas){DB.ventas=d.ventas;Storage.guardarVentas();}
            if(d.productos){DB.productos=d.productos;Storage.guardarProductos();}
            if(d.kardex){DB.kardex=d.kardex;Storage.guardarKardex();}
            if(d.compras){DB.compras=d.compras;Storage.guardarCompras();}
            if(d.cotizaciones){DB.cotizaciones=d.cotizaciones;Storage.guardarCotizaciones();}
            if(d.sequences){DB._sequences=d.sequences;Storage.guardarSequences();}
            if(d.cajas){DB.cajas=d.cajas;Storage.guardarCajas();}
            if(d.movimientosCaja){DB.movimientosCaja=d.movimientosCaja;Storage.guardarMovimientosCaja();}
            App.closeModal(); App.toast('✅ Backup restaurado','success');
            setTimeout(function(){App.renderPage();},300);
          }catch(err){App.toast('Error al leer el archivo','error');}
        }}]
      );
      document.getElementById('modalBox').style.maxWidth='400px';
    }; r.readAsText(f); ev.target.value='';
  },

  _clearVentas() {
    App.showModal('🗑️ Limpiar Ventas',
      '<div style="text-align:center;padding:10px 0;">' +
        '<div style="width:54px;height:54px;border-radius:50%;background:#fffbeb;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><i class="fas fa-eraser" style="font-size:22px;color:#d97706;"></i></div>' +
        '<div style="font-size:15px;font-weight:800;margin-bottom:6px;">¿Limpiar historial de ventas?</div>' +
        '<div style="font-size:13px;color:var(--gray-500);margin-bottom:12px;"><strong>'+(DB.ventas||[]).length+'</strong> ventas serán eliminadas</div>' +
        '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;font-size:12px;color:#dc2626;">Esta acción no se puede deshacer.</div>' +
      '</div>',
      [{text:'🗑️ Sí, limpiar',cls:'btn-danger',cb:function(){
        DB.ventas=[];DB._sequences={NV03:1,BV03:1,FC01:1};
        Storage.guardarVentas();Storage.guardarSequences();
        App.closeModal();App.toast('✅ Ventas eliminadas','warning');App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='400px';
  },

  _reset() {
    App.showModal('🚨 Resetear Sistema',
      '<div style="text-align:center;padding:10px 0;">' +
        '<div style="width:54px;height:54px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><i class="fas fa-trash-alt" style="font-size:22px;color:#dc2626;"></i></div>' +
        '<div style="font-size:15px;font-weight:800;color:#dc2626;margin-bottom:6px;">⚠️ RESETEAR TODO</div>' +
        '<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:14px;font-size:12px;color:#dc2626;margin-bottom:14px;">Ventas, clientes, productos, kardex y toda la configuración serán eliminados.</div>' +
        '<label style="font-size:12px;color:var(--gray-600);display:block;margin-bottom:6px;">Escribe <strong style="color:#dc2626;">RESETEAR</strong> para confirmar:</label>' +
        '<input id="cfmReset" type="text" placeholder="RESETEAR" style="width:100%;padding:10px;border:2px solid #fca5a5;border-radius:8px;text-align:center;font-size:14px;font-weight:700;box-sizing:border-box;"/>' +
      '</div>',
      [{text:'🚨 Resetear',cls:'btn-danger',cb:function(){
        if((document.getElementById('cfmReset')?.value||'').trim()!=='RESETEAR'){App.toast('Escribe RESETEAR para confirmar','error');return;}
        Storage.limpiarTodo(); App.closeModal();
        App.toast('Sistema reseteado. Recargando...','warning');
        setTimeout(function(){window.location.reload();},1500);
      }}]
    );
    document.getElementById('modalBox').style.maxWidth='420px';
  },

  // ── 7. SEGURIDAD ─────────────────────────────────────────
  _secSeguridad() {
    var u=DB.usuarioActual||{};

    var pass='<div class="form-grid">' +
      '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Contraseña actual *</label>' +
        '<div style="position:relative;"><input class="form-control" id="sc_a" type="password" placeholder="••••••••" style="padding-right:38px;"/>' +
        '<button type="button" onclick="ConfiguracionModule._toggleVis(\'sc_a\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye" id="vi_sc_a"></i></button></div></div>' +
      '<div class="form-group"><label class="form-label">Nueva contraseña *</label>' +
        '<div style="position:relative;"><input class="form-control" id="sc_n" type="password" placeholder="Mínimo 6 caracteres" style="padding-right:38px;" oninput="ConfiguracionModule._fuerza(this.value)"/>' +
        '<button type="button" onclick="ConfiguracionModule._toggleVis(\'sc_n\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye" id="vi_sc_n"></i></button></div>' +
        '<div id="sc_strength" style="margin-top:5px;"></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Confirmar nueva *</label>' +
        '<div style="position:relative;"><input class="form-control" id="sc_c" type="password" placeholder="Repite la contraseña" style="padding-right:38px;"/>' +
        '<button type="button" onclick="ConfiguracionModule._toggleVis(\'sc_c\')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);"><i class="fas fa-eye" id="vi_sc_c"></i></button></div></div>' +
    '</div>' + this._saveBtn('ConfiguracionModule._savePass()','Cambiar Contraseña');

    var sesion='<div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--gray-50);border-radius:12px;margin-bottom:16px;">' +
      '<div style="width:50px;height:50px;border-radius:14px;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;flex-shrink:0;">'+(u.nombre||'?')[0].toUpperCase()+'</div>' +
      '<div style="flex:1;"><div style="font-size:15px;font-weight:800;">'+(u.nombre||'—')+'</div><div style="font-size:12px;color:var(--gray-400);">@'+(u.usuario||'—')+' · '+(u.cargo||u.rol||'—')+'</div><div style="font-size:11px;color:var(--gray-400);">'+(u.sucursal||'—')+'</div></div>' +
      '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:#f0fdf4;color:#16a34a;border:1px solid #86efac;">● ACTIVO</span>' +
    '</div>' +
    '<button onclick="ConfiguracionModule._logout()" style="padding:10px 18px;background:#fef2f2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">' +
      '<i class="fas fa-sign-out-alt" style="margin-right:6px;"></i>Cerrar Sesión</button>';

    return this._card('fa-key','#dc2626','Cambiar Contraseña','Actualiza la contraseña de tu cuenta',pass) +
           this._card('fa-user-shield','#7c3aed','Sesión Activa','Información de tu sesión actual',sesion);
  },

  _fuerza(v) {
    var el=document.getElementById('sc_strength'); if(!el)return;
    if(!v){el.innerHTML='';return;}
    var f=0;
    if(v.length>=6)f++;if(v.length>=10)f++;if(/[A-Z]/.test(v))f++;if(/[0-9]/.test(v))f++;if(/[^A-Za-z0-9]/.test(v))f++;
    var labels=['','Muy débil','Débil','Regular','Buena','Fuerte'];
    var colors=['','#dc2626','#d97706','#f59e0b','#2563eb','#16a34a'];
    el.innerHTML='<div style="display:flex;align-items:center;gap:8px;">' +
      '<div style="display:flex;gap:3px;">'+ [1,2,3,4,5].map(function(i){return '<div style="width:24px;height:4px;border-radius:2px;background:'+(i<=f?colors[f]:'var(--gray-200)')+'"></div>';}).join('') +'</div>' +
      '<span style="font-size:11px;font-weight:700;color:'+colors[f]+';">'+labels[f]+'</span></div>';
  },

  _savePass() {
    var a=document.getElementById('sc_a')?.value||'', n=document.getElementById('sc_n')?.value||'', c=document.getElementById('sc_c')?.value||'';
    var u=DB.usuarioActual; if(!u)return;
    if(!a){App.toast('Ingresa tu contraseña actual','error');return;}
    if(n.length<6){App.toast('Mínimo 6 caracteres','error');return;}
    if(n!==c){App.toast('Las contraseñas no coinciden','error');return;}
    var i=(DB.usuarios||[]).findIndex(function(x){return x.id===u.id;});
    if(i<0||DB.usuarios[i].password!==a){App.toast('Contraseña actual incorrecta','error');return;}
    DB.usuarios[i].password=n; App.toast('✅ Contraseña actualizada','success');
    ['sc_a','sc_n','sc_c'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('sc_strength').innerHTML='';
  },

  _logout() {
    App.showModal('🚪 Cerrar Sesión',
      '<div style="text-align:center;padding:16px 0;">' +
        '<div style="width:54px;height:54px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><i class="fas fa-sign-out-alt" style="font-size:22px;color:#dc2626;"></i></div>' +
        '<div style="font-size:15px;font-weight:800;margin-bottom:6px;">¿Cerrar sesión?</div>' +
        '<div style="font-size:13px;color:var(--gray-500);">Sesión de <strong>'+(DB.usuarioActual?.nombre||'')+'</strong></div>' +
      '</div>',
      [{text:'Cerrar sesión',cls:'btn-danger',cb:function(){App.closeModal(); if(typeof App.logout==='function')App.logout(); else{DB.usuarioActual=null;window.location.reload();}}}]
    );
    document.getElementById('modalBox').style.maxWidth='340px';
  },

  // ── 8. ACERCA DE ─────────────────────────────────────────
  _secAcerca() {
    var e=DB.empresa||{};
    var mods=['Ventas','POS','Cotizaciones','Clientes','Productos','Inventario','Caja','Reportes','Kardex','Tickets','Agenda','Compras','Notas Crédito','Herramientas','Configuración','Soporte'];
    var body=
      '<div style="text-align:center;padding:10px 0 20px;">' +
        '<div style="width:80px;height:80px;border-radius:22px;background:linear-gradient(135deg,var(--accent),#7c3aed);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 8px 24px rgba(37,99,235,0.3);">' +
          '<i class="fas fa-store" style="font-size:36px;color:white;"></i>' +
        '</div>' +
        '<div style="font-size:26px;font-weight:900;color:var(--gray-800);margin-bottom:2px;">JUMILA ERP</div>' +
        '<div style="font-size:13px;color:var(--gray-400);margin-bottom:20px;">Sistema de Gestión Empresarial</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:400px;margin:0 auto 20px;">' +
          [{l:'Versión',v:'2.1'},{l:'Módulos',v:''+mods.length},{l:'Año',v:'2026'},{l:'País',v:'🇵🇪 PE'}].map(function(s){
            return '<div style="padding:12px;background:var(--gray-50);border-radius:10px;border:1px solid var(--gray-200);">' +
              '<div style="font-size:9px;color:var(--gray-400);font-weight:800;text-transform:uppercase;margin-bottom:3px;">'+s.l+'</div>' +
              '<div style="font-size:17px;font-weight:900;color:var(--accent);">'+s.v+'</div></div>';
          }).join('')+
        '</div>' +
        '<div style="padding:16px;background:linear-gradient(135deg,#f0fdf4,#eff6ff);border-radius:14px;max-width:360px;margin:0 auto 20px;">' +
          '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:5px;">Desarrollado para</div>' +
          '<div style="font-size:17px;font-weight:900;color:var(--accent);">'+(e.nombre||'GRUPO JUMILA')+'</div>' +
          (e.ruc?'<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">RUC: '+e.ruc+'</div>':'') +
          (e.direccion?'<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">'+e.direccion+'</div>':'') +
        '</div>' +
        '<div style="font-size:11px;font-weight:700;color:var(--gray-400);margin-bottom:10px;">MÓDULOS INSTALADOS</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:400px;margin:0 auto;">' +
          mods.map(function(m){return '<span style="padding:4px 10px;background:var(--gray-100);border-radius:20px;font-size:11px;font-weight:600;color:var(--gray-600);">'+m+'</span>';}).join('')+
        '</div>' +
      '</div>';
    return this._card('fa-info-circle','#6b7280','Acerca del Sistema','Versión, módulos y datos del sistema',body);
  }

};
