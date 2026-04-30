// ============================================================
// MÓDULO: LISTA DE PRECIOS
// ============================================================

const PreciosModule = {
  listas: [
    { id:1, nombre:'PRECIO MINORISTA', descripcion:'Precio regular para clientes al por menor', descuento:0, color:'#2563eb', activa:true },
    { id:2, nombre:'PRECIO MAYORISTA', descripcion:'Para compras mayores a 10 unidades', descuento:15, color:'#16a34a', activa:true },
    { id:3, nombre:'PRECIO VIP', descripcion:'Clientes frecuentes y especiales', descuento:20, color:'#7c3aed', activa:true },
    { id:4, nombre:'PRECIO DISTRIBUIDOR', descripcion:'Distribuidores y revendedores autorizados', descuento:30, color:'#d97706', activa:false },
  ],

searchProducto: '',
searchCategoria: 'todas',
currentPage: 1,

  render() {
    App.setTabs2('Lista de Precios', 'CATÁLOGO');
    const lista = this.listas.find(l=>l.id===this.selectedLista) || this.listas[0];
    const categorias = ['todas', ...new Set(DB.productos.map(p=>p.categoria))];
    const productosFiltrados = DB.productos.filter(p => {
      const matchCat  = this.searchCategoria === 'todas' || p.categoria === this.searchCategoria;
      const matchProd = !this.searchProducto ||
        p.nombre.toLowerCase().includes(this.searchProducto.toLowerCase()) ||
        p.codigo.toLowerCase().includes(this.searchProducto.toLowerCase());
      return matchCat && matchProd;
    });
    const totalPages  = Math.max(1, Math.ceil(productosFiltrados.length / 10));
    const currentPage = Math.min(this.currentPage, totalPages);
    const paginados   = productosFiltrados.slice((currentPage-1)*10, currentPage*10);

    return `
      <div class="page-header">
        <h2 class="page-title">Lista de Precios</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="PreciosModule.nuevaLista()"><i class="fas fa-plus"></i> Nueva Lista</button>
          <button class="btn btn-outline" onclick="PreciosModule.exportar()"><i class="fas fa-file-excel"></i> Exportar</button>
        </div>
      </div>

      <!-- Tarjetas de listas -->
      <div class="stats-grid mb-5" style="grid-template-columns:repeat(${this.listas.length},1fr);">
        ${this.listas.map(l=>`
          <div class="stat-card" style="cursor:pointer;border:2px solid ${this.selectedLista===l.id?l.color:'var(--gray-200)'};transition:all 0.2s;"
            onclick="PreciosModule.selectedLista=${l.id};App.renderPage()">
            <div class="stat-icon" style="background:${l.color}22;color:${l.color};width:48px;height:48px;border-radius:12px;font-size:22px;">
              <i class="fas fa-tags"></i>
            </div>
            <div class="stat-info">
              <div style="font-size:13px;font-weight:800;color:var(--gray-900);">${l.nombre}</div>
              <div style="font-size:12px;color:var(--gray-500);">${l.descuento===0?'Precio base':`-${l.descuento}% dcto.`}</div>
              <div style="margin-top:4px;">
                <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${l.activa?'#dcfce7':'#f3f4f6'};color:${l.activa?'#16a34a':'#6b7280'};">${l.activa?'ACTIVA':'INACTIVA'}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- Lista seleccionada -->
      <div class="card">
        <div class="card-header">
          <div>
            <span class="card-title">${lista.nombre}</span>
            <span class="text-muted text-sm" style="margin-left:8px;">${lista.descripcion}</span>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="PreciosModule.editarLista(${lista.id})"><i class="fas fa-edit"></i> Editar Lista</button>
            ${lista.descuento>0?`<span class="badge badge-success" style="font-size:13px;">Descuento: ${lista.descuento}%</span>`:'<span class="badge badge-info">Precio Base</span>'}
          </div>
        </div>
        <div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">Buscar Producto</div>
              <div style="position:relative;">
                <i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);"></i>
                <input type="text" placeholder="Nombre o código..." value="${this.searchProducto}"
                  style="width:100%;padding:9px 9px 9px 32px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;box-sizing:border-box;"
                  oninput="PreciosModule.searchProducto=this.value;PreciosModule.currentPage=1;App.renderPage()"/>
              </div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">Categoría</div>
              <select style="width:100%;padding:9px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;"
                onchange="PreciosModule.searchCategoria=this.value;PreciosModule.currentPage=1;App.renderPage()">
                ${categorias.map(c=>`<option value="${c}" ${this.searchCategoria===c?'selected':''}>${c==='todas'?'Todas las categorías':c}</option>`).join('')}
              </select>
            </div>
            <button onclick="PreciosModule.searchProducto='';PreciosModule.searchCategoria='todas';PreciosModule.currentPage=1;App.renderPage();"
              style="padding:9px 16px;border:1.5px solid var(--gray-200);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:700;color:var(--gray-600);">
              <i class="fas fa-times"></i> Limpiar
            </button>
          </div>
          <div style="padding:8px 20px;font-size:12px;color:var(--gray-500);">
            Mostrando ${paginados.length} de ${productosFiltrados.length} productos
          </div>
          <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th><th>Producto</th><th>Categoría</th>
                <th>P. Base</th><th>Dcto.</th><th>P. Final</th>
                <th>Precio Custom</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${paginados.map(p => {
                const pFinal = p.precio_venta * (1 - lista.descuento/100);
                const custom = DB.preciosCustom?.[lista.id]?.[p.id];
                return `
                <tr>
                  <td><span class="badge badge-gray">${p.codigo}</span></td>
                  <td><div class="td-name">${p.nombre}</div></td>
                  <td class="text-sm text-muted">${p.categoria}</td>
                  <td>S/ ${p.precio_venta.toFixed(2)}</td>
                  <td>${lista.descuento>0?`<span style="color:var(--success);font-weight:700;">-${lista.descuento}%</span>`:'—'}</td>
                  <td><strong style="color:${lista.color};">S/ ${(custom||pFinal).toFixed(2)}</strong></td>
                  <td>
                    <input type="number" step="0.01" placeholder="Precio especial" value="${custom||''}"
                      style="width:110px;padding:5px 8px;border:1.5px solid var(--gray-200);border-radius:6px;font-size:12px;"
                      onchange="PreciosModule.setCustom(${lista.id},${p.id},this.value)"/>
                  </td>
                  <td>
                    ${custom?`<button class="btn btn-outline btn-sm" onclick="PreciosModule.clearCustom(${lista.id},${p.id})"><i class="fas fa-undo"></i></button>`:''}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
        </table>
      </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--gray-200);">
            <span style="font-size:13px;color:var(--gray-500);">
              Página ${currentPage} de ${totalPages}
            </span>
            <div style="display:flex;gap:6px;">
              <button onclick="PreciosModule.currentPage=1;App.renderPage()" ${currentPage===1?'disabled':''} style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;"><i class="fas fa-angle-double-left"></i></button>
              <button onclick="PreciosModule.currentPage--;App.renderPage()" ${currentPage===1?'disabled':''} style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;"><i class="fas fa-chevron-left"></i></button>
              <button onclick="PreciosModule.currentPage++;App.renderPage()" ${currentPage===totalPages?'disabled':''} style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;"><i class="fas fa-chevron-right"></i></button>
              <button onclick="PreciosModule.currentPage=${totalPages};App.renderPage()" ${currentPage===totalPages?'disabled':''} style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:6px;background:white;cursor:pointer;"><i class="fas fa-angle-double-right"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  nuevaLista() {
    App.showModal('Nueva Lista de Precios', `
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre de la Lista <span class="required">*</span></label>
          <input class="form-control" id="nl_nombre" placeholder="Ej: PRECIO DISTRIBUIDOR"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Descripción</label>
          <input class="form-control" id="nl_desc" placeholder="Descripción de la lista"/>
        </div>
        <div class="form-group">
          <label class="form-label">Descuento Global (%)</label>
          <input class="form-control" id="nl_dcto" type="number" min="0" max="100" value="0"/>
        </div>
        <div class="form-group">
          <label class="form-label">Color de Identificación</label>
          <input class="form-control" id="nl_color" type="color" value="#2563eb"/>
        </div>
      </div>`, [
      { text:'Guardar Lista', cls:'btn-primary', cb:()=>{
        const nombre=document.getElementById('nl_nombre')?.value?.trim();
        if (!nombre) { App.toast('Ingrese un nombre','error'); return; }
        this.listas.push({
          id:this.listas.length+1, nombre:nombre.toUpperCase(),
          descripcion:document.getElementById('nl_desc')?.value||'',
          descuento:parseFloat(document.getElementById('nl_dcto')?.value)||0,
          color:document.getElementById('nl_color')?.value||'#2563eb', activa:true
        });
        App.toast('Lista creada','success'); App.closeModal(); App.renderPage();
      }}
    ]);
  },

  editarLista(id) {
    const l=this.listas.find(x=>x.id===id);
    App.showModal('Editar Lista', `
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre</label>
          <input class="form-control" id="el_nombre" value="${l.nombre}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Descripción</label>
          <input class="form-control" id="el_desc" value="${l.descripcion}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Descuento Global (%)</label>
          <input class="form-control" id="el_dcto" type="number" value="${l.descuento}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" id="el_activa">
            <option value="true" ${l.activa?'selected':''}>Activa</option>
            <option value="false" ${!l.activa?'selected':''}>Inactiva</option>
          </select>
        </div>
      </div>`, [
      { text:'Guardar', cls:'btn-primary', cb:()=>{
        const i=this.listas.findIndex(x=>x.id===id);
        this.listas[i].nombre=document.getElementById('el_nombre')?.value||l.nombre;
        this.listas[i].descripcion=document.getElementById('el_desc')?.value||'';
        this.listas[i].descuento=parseFloat(document.getElementById('el_dcto')?.value)||0;
        this.listas[i].activa=document.getElementById('el_activa')?.value==='true';
        App.toast('Lista actualizada','success'); App.closeModal(); App.renderPage();
      }}
    ]);
  },

  setCustom(listaId, prodId, val) {
    if (!DB.preciosCustom) DB.preciosCustom = {};
    if (!DB.preciosCustom[listaId]) DB.preciosCustom[listaId] = {};
    const v = parseFloat(val);
    if (v > 0) DB.preciosCustom[listaId][prodId] = v;
    else delete DB.preciosCustom[listaId][prodId];
  },

  clearCustom(listaId, prodId) {
    if (DB.preciosCustom?.[listaId]) { delete DB.preciosCustom[listaId][prodId]; App.renderPage(); }
  },

  exportar() { App.toast('Exportando lista de precios...', 'info'); }
};

// ============================================================
// MÓDULO: CUENTA CORRIENTE (Créditos)
// ============================================================

if (!DB.cuentasCorriente) DB.cuentasCorriente = [
  { id:1, cliente_id:12, fecha:'2026-03-10', tipo:'CREDITO', concepto:'Venta al crédito BV03-00000230', monto:150.00, saldo:150.00, pagado:0, vencimiento:'2026-04-10', estado:'PENDIENTE' },
  { id:2, cliente_id:13, fecha:'2026-03-15', tipo:'CREDITO', concepto:'Venta al crédito BV03-00000231', monto:85.00, saldo:50.00, pagado:35.00, vencimiento:'2026-04-15', estado:'PARCIAL' },
  { id:3, cliente_id:4,  fecha:'2026-03-20', tipo:'CREDITO', concepto:'Venta al crédito BV03-00000232', monto:200.00, saldo:0, pagado:200.00, vencimiento:'2026-04-20', estado:'PAGADO' },
];

const CuentaCorrienteModule = {
  filtroEstado: 'todos',

  render() {
    App.setTabs2('Cuenta Corriente', 'CRÉDITOS');
    const cuentas = this.getFiltradas();
    const totalDeuda = DB.cuentasCorriente.filter(c=>c.estado!=='PAGADO').reduce((s,c)=>s+c.saldo,0);
    const porVencer = DB.cuentasCorriente.filter(c=>{
      const d=new Date(c.vencimiento); const hoy=new Date();
      const diff=(d-hoy)/(1000*60*60*24);
      return c.estado!=='PAGADO' && diff<=7 && diff>=0;
    }).length;
    const vencidas = DB.cuentasCorriente.filter(c=>c.estado!=='PAGADO'&&new Date(c.vencimiento)<new Date()).length;

    return `
      <div class="page-header">
        <h2 class="page-title">Cuenta Corriente (Créditos)</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="CuentaCorrienteModule.nuevo()"><i class="fas fa-plus"></i> Nuevo Crédito</button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="stats-grid mb-5" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-hand-holding-usd"></i></div>
          <div class="stat-info"><div class="stat-value" style="color:#dc2626;">S/ ${totalDeuda.toFixed(2)}</div><div class="stat-label">Deuda Total Pendiente</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-clock"></i></div>
          <div class="stat-info"><div class="stat-value">${porVencer}</div><div class="stat-label">Por Vencer (7 días)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-exclamation-circle"></i></div>
          <div class="stat-info"><div class="stat-value" style="color:#dc2626;">${vencidas}</div><div class="stat-label">Cuentas Vencidas</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info"><div class="stat-value">${DB.cuentasCorriente.filter(c=>c.estado==='PAGADO').length}</div><div class="stat-label">Pagadas</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="tabs-nav" style="border:none;margin:0;">
            ${['todos','PENDIENTE','PARCIAL','PAGADO','VENCIDO'].map(e=>`
              <button class="tab-btn ${this.filtroEstado===e?'active':''}" onclick="CuentaCorrienteModule.filtroEstado='${e}';App.renderPage()">
                ${e==='todos'?'Todos':e}
              </button>`).join('')}
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>Cliente</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Pagado</th><th>Saldo</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              ${cuentas.length===0?`<tr><td colspan="9"><div class="empty-state"><i class="fas fa-hand-holding-usd"></i><p>No hay registros</p></div></td></tr>`:
                cuentas.map(c=>{
                  const cli=DB.clientes.find(x=>x.id===c.cliente_id);
                  const venc=new Date(c.vencimiento)<new Date() && c.estado!=='PAGADO';
                  return `<tr ${venc?'style="background:#fff5f5;"':''}>
                    <td><div class="td-name">${cli?.nombre||'N/A'}</div><div class="td-sub">${cli?.doc||''}</div></td>
                    <td class="text-sm">${c.fecha}</td>
                    <td class="text-sm text-muted">${c.concepto}</td>
                    <td><strong>S/ ${c.monto.toFixed(2)}</strong></td>
                    <td style="color:var(--success);">S/ ${c.pagado.toFixed(2)}</td>
                    <td style="color:var(--danger);font-weight:700;">S/ ${c.saldo.toFixed(2)}</td>
                    <td><span style="color:${venc?'var(--danger)':'var(--gray-700)'};font-weight:${venc?700:400};">${c.vencimiento}</span></td>
                    <td>${this.estadoBadge(c.estado,venc)}</td>
                    <td>
                      <div class="flex gap-2">
                        ${c.estado!=='PAGADO'?`<button class="btn btn-success btn-sm" onclick="CuentaCorrienteModule.registrarPago(${c.id})"><i class="fas fa-dollar-sign"></i> Pago</button>`:''}
                        <button class="btn btn-outline btn-sm" onclick="CuentaCorrienteModule.whatsapp(${c.id})"><i class="fab fa-whatsapp" style="color:#25D366;"></i></button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  estadoBadge(estado,vencida=false) {
    if (vencida) return '<span class="status-no-enviado">VENCIDA</span>';
    const map={PENDIENTE:'status-pendiente',PARCIAL:'badge badge-warning',PAGADO:'status-aceptado'};
    return `<span class="${map[estado]||'badge badge-gray'}">${estado}</span>`;
  },

  getFiltradas() {
    return DB.cuentasCorriente.filter(c=>{
      if (this.filtroEstado==='todos') return true;
      if (this.filtroEstado==='VENCIDO') return new Date(c.vencimiento)<new Date() && c.estado!=='PAGADO';
      return c.estado===this.filtroEstado;
    });
  },

  nuevo() {
    App.showModal('Nuevo Crédito', `
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Cliente <span class="required">*</span></label>
          <select class="form-control" id="cc_cli">
            ${DB.clientes.filter(c=>c.tipo_cliente==='cliente').map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Concepto <span class="required">*</span></label>
          <input class="form-control" id="cc_concepto" placeholder="Ej: Venta al crédito..."/>
        </div>
        <div class="form-group">
          <label class="form-label">Monto (S/) <span class="required">*</span></label>
          <input class="form-control" id="cc_monto" type="number" step="0.01" min="0.01" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Vencimiento <span class="required">*</span></label>
          <input class="form-control" id="cc_venc" type="date" value="${new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0]}"/>
        </div>
      </div>`, [
      { text:'Registrar Crédito', cls:'btn-primary', cb:()=>{
        const monto=parseFloat(document.getElementById('cc_monto')?.value)||0;
        const concepto=document.getElementById('cc_concepto')?.value?.trim();
        if (!concepto||!monto) { App.toast('Complete los campos','error'); return; }
        DB.cuentasCorriente.push({
          id:DB.cuentasCorriente.length+1,
          cliente_id:parseInt(document.getElementById('cc_cli')?.value),
          fecha:new Date().toISOString().split('T')[0],
          tipo:'CREDITO', concepto, monto, saldo:monto, pagado:0,
          vencimiento:document.getElementById('cc_venc')?.value,
          estado:'PENDIENTE'
        });
        App.toast('Crédito registrado','success'); App.closeModal(); App.renderPage();
      }}
    ]);
  },

  registrarPago(id) {
    const cc=DB.cuentasCorriente.find(x=>x.id===id);
    const cli=DB.clientes.find(x=>x.id===cc.cliente_id);
    App.showModal(`Registrar Pago — ${cli?.nombre}`, `
      <div style="background:var(--gray-50);padding:14px;border-radius:8px;margin-bottom:16px;">
        <div class="flex-between"><span class="text-muted">Monto Total:</span><span class="font-bold">S/ ${cc.monto.toFixed(2)}</span></div>
        <div class="flex-between"><span class="text-muted">Ya Pagado:</span><span style="color:var(--success);font-weight:700;">S/ ${cc.pagado.toFixed(2)}</span></div>
        <div class="flex-between"><span class="text-muted">Saldo Pendiente:</span><span style="color:var(--danger);font-weight:800;font-size:18px;">S/ ${cc.saldo.toFixed(2)}</span></div>
      </div>
      <div class="form-group mb-3">
        <label class="form-label">Monto a Pagar (S/) <span class="required">*</span></label>
        <input class="form-control" id="pago_monto" type="number" step="0.01" value="${cc.saldo.toFixed(2)}" style="font-size:20px;text-align:center;"/>
      </div>
      <div class="form-group">
        <label class="form-label">Método de Pago</label>
        <select class="form-control" id="pago_metodo">
          <option>EFECTIVO</option><option>TARJETA</option><option>YAPE/PLIN</option><option>TRANSFERENCIA</option>
        </select>
      </div>`, [
      { text:'Registrar Pago', cls:'btn-success', cb:()=>{
        const pago=parseFloat(document.getElementById('pago_monto')?.value)||0;
        if (pago<=0||pago>cc.saldo) { App.toast('Monto inválido','error'); return; }
        const i=DB.cuentasCorriente.findIndex(x=>x.id===id);
        DB.cuentasCorriente[i].pagado+=pago;
        DB.cuentasCorriente[i].saldo=Math.max(0,cc.saldo-pago);
        DB.cuentasCorriente[i].estado=DB.cuentasCorriente[i].saldo===0?'PAGADO':'PARCIAL';
        App.toast('Pago registrado correctamente','success'); App.closeModal(); App.renderPage();
      }}
    ]);
  },

  whatsapp(id) {
    const cc=DB.cuentasCorriente.find(x=>x.id===id);
    const cli=DB.clientes.find(x=>x.id===cc.cliente_id);
    const msg=encodeURIComponent(`Estimado/a ${cli?.nombre}, le recordamos que tiene una deuda pendiente de S/ ${cc.saldo.toFixed(2)} con vencimiento el ${cc.vencimiento}. Por favor comuníquese con nosotros. — ${DB.empresa.nombre}`);
    window.open(`https://wa.me/?text=${msg}`,'_blank');
  }
};
