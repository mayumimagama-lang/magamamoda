// ============================================================
// MÓDULO: COTIZACIONES / PROFORMAS
// ============================================================

if (!DB.cotizaciones) DB.cotizaciones = [
  { id:1, numero:'COT-001', fecha:'2026-03-25', vencimiento:'2026-04-25', cliente_id:2, items:[{nombre:'ARROZ EXTRA 5KG',qty:10,precio:22,total:220},{nombre:'ACEITE VEGETAL 1L',qty:5,precio:7.5,total:37.5}], total:257.5, estado:'PENDIENTE', notas:'Entrega a domicilio incluida' },
  { id:2, numero:'COT-002', fecha:'2026-03-28', vencimiento:'2026-04-28', cliente_id:12, items:[{nombre:'DETERGENTE ARIEL 1KG',qty:6,precio:12,total:72}], total:72, estado:'APROBADA', notas:'' },
  { id:3, numero:'COT-003', fecha:'2026-03-30', vencimiento:'2026-04-15', cliente_id:13, items:[{nombre:'SHAMPOO HEAD&SHOULDERS',qty:3,precio:18.5,total:55.5}], total:55.5, estado:'RECHAZADA', notas:'Precio muy alto' },
];
DB._cotSeq = DB._cotSeq || 4;

const CotizacionesModule = {
  currentItems: [],
  clienteSeleccionado: null,

  render() {
    App.setTabs2('Cotizaciones / Proformas', 'VENTAS');
    const aprobadas = DB.cotizaciones.filter(c=>c.estado==='APROBADA').length;
    const pendientes = DB.cotizaciones.filter(c=>c.estado==='PENDIENTE').length;
    const totalMonto = DB.cotizaciones.reduce((s,c)=>s+c.total,0);

    return `
      <div class="page-header">
        <h2 class="page-title">Cotizaciones / Proformas</h2>
        <div class="page-actions">
          <button class="btn btn-success" onclick="CotizacionesModule.nueva()"><i class="fas fa-plus"></i> Nueva Cotización</button>
          <button class="btn btn-outline" onclick="CotizacionesModule.exportar()"><i class="fas fa-cloud-download-alt"></i> Exportar</button>
        </div>
      </div>

      <div class="stats-grid mb-5" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-file-alt"></i></div>
          <div class="stat-info"><div class="stat-value">${DB.cotizaciones.length}</div><div class="stat-label">Total Cotizaciones</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-clock"></i></div>
          <div class="stat-info"><div class="stat-value">${pendientes}</div><div class="stat-label">Pendientes</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-check"></i></div>
          <div class="stat-info"><div class="stat-value">${aprobadas}</div><div class="stat-label">Aprobadas</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-dollar-sign"></i></div>
          <div class="stat-info"><div class="stat-value">S/ ${totalMonto.toFixed(2)}</div><div class="stat-label">Monto Total</div></div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>N° Cotización</th><th>Fecha</th><th>Vencimiento</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              ${DB.cotizaciones.length===0?`<tr><td colspan="7"><div class="empty-state"><i class="fas fa-file-alt"></i><p>Sin cotizaciones</p></div></td></tr>`:
                DB.cotizaciones.map(c=>{
                  const cli=DB.clientes.find(x=>x.id===c.cliente_id);
                  const vencida=new Date(c.vencimiento)<new Date()&&c.estado==='PENDIENTE';
                  return `<tr>
                    <td><strong style="color:var(--accent);">${c.numero}</strong></td>
                    <td class="text-sm">${c.fecha}</td>
                    <td><span style="color:${vencida?'var(--danger)':'var(--gray-700)'};">${c.vencimiento}</span></td>
                    <td><div class="td-name" style="font-size:12px;">${cli?.nombre||'N/A'}</div></td>
                    <td><strong>S/ ${c.total.toFixed(2)}</strong></td>
                    <td>${this.badge(vencida?'VENCIDA':c.estado)}</td>
                    <td>
                      <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" onclick="CotizacionesModule.ver(${c.id})"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline btn-sm" onclick="CotizacionesModule.imprimir(${c.id})"><i class="fas fa-print"></i></button>
                        <button class="btn btn-outline btn-sm" onclick="CotizacionesModule.whatsapp(${c.id})"><i class="fab fa-whatsapp" style="color:#25D366;"></i></button>
                        ${c.estado==='APROBADA'?`<button class="btn btn-success btn-sm" onclick="CotizacionesModule.convertirVenta(${c.id})"><i class="fas fa-file-invoice"></i> Facturar</button>`:''}
                        ${c.estado==='PENDIENTE'?`
                          <button class="btn btn-success btn-sm" onclick="CotizacionesModule.cambiarEstado(${c.id},'APROBADA')"><i class="fas fa-check"></i></button>
                          <button class="btn btn-danger btn-sm" onclick="CotizacionesModule.cambiarEstado(${c.id},'RECHAZADA')"><i class="fas fa-times"></i></button>`:''}
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

  badge(estado) {
    const map={PENDIENTE:'cotiz-pendiente',APROBADA:'cotiz-aprobada',RECHAZADA:'cotiz-rechazada',VENCIDA:'cotiz-vencida',CONVERTIDA:'cotiz-convertida'};
    return `<span class="cotiz-status ${map[estado]||'cotiz-pendiente'}">${estado}</span>`;
  },

  nueva() {
    this.currentItems=[];
    this.clienteSeleccionado=DB.clientes.find(c=>c.doc==='00000000');
    App.showModal('Nueva Cotización', this._formHTML(), [
      { text:'Guardar Cotización', cls:'btn-primary', cb:()=>this._guardar() }
    ]);
    document.getElementById('modalBox').style.maxWidth='750px';
  },

  _formHTML() {
    const total=this.currentItems.reduce((s,i)=>s+i.total,0);
    return `
      <div class="form-grid mb-4">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Cliente <span class="required">*</span></label>
          <select class="form-control" id="cot_cli">
            ${DB.clientes.filter(c=>c.tipo_cliente==='cliente').map(c=>`<option value="${c.id}" ${this.clienteSeleccionado?.id===c.id?'selected':''}>${c.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Vencimiento</label>
          <input class="form-control" id="cot_venc" type="date" value="${new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0]}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <input class="form-control" id="cot_notas" placeholder="Condiciones, notas..."/>
        </div>
      </div>
      <div class="flex-between mb-3">
        <strong>Productos:</strong>
        <button class="btn btn-outline btn-sm" onclick="CotizacionesModule._abrirBuscador()"><i class="fas fa-plus"></i> Agregar Producto</button>
      </div>
      ${this.currentItems.length===0?
        `<div style="text-align:center;padding:20px;color:var(--gray-400);background:var(--gray-50);border-radius:8px;"><i class="fas fa-box-open" style="font-size:28px;display:block;margin-bottom:8px;"></i>Agrega productos</div>`:
        `<table class="data-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th><th></th></tr></thead>
        <tbody>${this.currentItems.map((item,i)=>`<tr>
          <td>${item.nombre}</td>
          <td><input type="number" min="1" value="${item.qty}" style="width:60px;padding:4px;border:1.5px solid var(--gray-200);border-radius:4px;" onchange="CotizacionesModule._updQty(${i},this.value)"/></td>
          <td>S/ ${item.precio.toFixed(2)}</td>
          <td><strong>S/ ${item.total.toFixed(2)}</strong></td>
          <td><button onclick="CotizacionesModule._remove(${i})" style="color:var(--danger);background:none;border:none;cursor:pointer;"><i class="fas fa-times"></i></button></td>
        </tr>`).join('')}</tbody></table>`}
      <div style="text-align:right;margin-top:12px;padding:12px;background:var(--gray-50);border-radius:8px;">
        <strong style="font-size:18px;">TOTAL: S/ ${total.toFixed(2)}</strong>
      </div>`;
  },

  _abrirBuscador() {
    // Quick product add via alert
    const prods=DB.productos.map((p,i)=>`${i+1}. ${p.nombre} - S/${p.precio_venta}`).join('\n');
    const idx=parseInt(prompt(`Seleccione producto (número):\n${prods}`))-1;
    if (idx>=0&&idx<DB.productos.length) {
      const p=DB.productos[idx];
      const qty=parseInt(prompt(`Cantidad para "${p.nombre}":`)||1);
      if (qty>0) {
        this.currentItems.push({prod_id:p.id,nombre:p.nombre,precio:p.precio_venta,qty,total:p.precio_venta*qty});
        document.getElementById('modalBody').innerHTML=this._formHTML();
      }
    }
  },

  _updQty(idx,val) {
    const q=parseInt(val)||1;
    this.currentItems[idx].qty=q;
    this.currentItems[idx].total=q*this.currentItems[idx].precio;
    document.getElementById('modalBody').innerHTML=this._formHTML();
  },

  _remove(idx) { this.currentItems.splice(idx,1); document.getElementById('modalBody').innerHTML=this._formHTML(); },

  _guardar() {
    if (!this.currentItems.length) { App.toast('Agregue productos','error'); return; }
    const total=this.currentItems.reduce((s,i)=>s+i.total,0);
    DB.cotizaciones.unshift({
      id:DB.cotizaciones.length+1,
      numero:`COT-${String(DB._cotSeq++).padStart(3,'0')}`,
      fecha:new Date().toISOString().split('T')[0],
      vencimiento:document.getElementById('cot_venc')?.value||'',
      cliente_id:parseInt(document.getElementById('cot_cli')?.value),
      items:[...this.currentItems], total,
      estado:'PENDIENTE',
      notas:document.getElementById('cot_notas')?.value||''
    });
    App.toast('Cotización creada correctamente','success'); App.closeModal(); App.renderPage();
  },

  ver(id) {
    const c=DB.cotizaciones.find(x=>x.id===id);
    const cli=DB.clientes.find(x=>x.id===c.cliente_id);
    App.showModal(`Cotización ${c.numero}`,`
      <div style="font-size:13px;">
        <div class="flex-between mb-2"><span><strong>Cliente:</strong> ${cli?.nombre}</span>${this.badge(c.estado)}</div>
        <div class="flex-between mb-3"><span><strong>Fecha:</strong> ${c.fecha}</span><span><strong>Vencimiento:</strong> ${c.vencimiento}</span></div>
        <table class="data-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
        <tbody>${c.items.map(i=>`<tr><td>${i.nombre}</td><td>${i.qty}</td><td>S/ ${i.precio.toFixed(2)}</td><td><strong>S/ ${i.total.toFixed(2)}</strong></td></tr>`).join('')}</tbody></table>
        <div style="text-align:right;margin-top:12px;font-size:18px;font-weight:800;">TOTAL: S/ ${c.total.toFixed(2)}</div>
        ${c.notas?`<div style="margin-top:12px;color:var(--gray-500);">Notas: ${c.notas}</div>`:''}
      </div>`,[
      { text:'Imprimir', cls:'btn-primary', cb:()=>{this.imprimir(id);App.closeModal();} }
    ]);
  },

  imprimir(id) {
    const c=DB.cotizaciones.find(x=>x.id===id);
    const cli=DB.clientes.find(x=>x.id===c.cliente_id);
    const w=window.open('','_blank','width=500,height=700');
    if (!w) return;
    w.document.write(`<html><head><title>Cotización</title><style>body{font-family:Arial;font-size:13px;padding:20px;max-width:600px;margin:0 auto;}.c{text-align:center;}.b{font-weight:bold;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;}.r{text-align:right;}h2{color:#1e3a5f;}</style></head><body>
    <div class="c b" style="font-size:18px;">${DB.empresa.nombre}</div>
    <div class="c">RUC: ${DB.empresa.ruc} | ${DB.empresa.direccion}</div>
    <hr/><h2 class="c">COTIZACIÓN / PROFORMA</h2>
    <div class="flex" style="display:flex;justify-content:space-between;margin-bottom:16px;">
      <div><strong>N°:</strong> ${c.numero}<br/><strong>Fecha:</strong> ${c.fecha}<br/><strong>Válida hasta:</strong> ${c.vencimiento}</div>
      <div><strong>Cliente:</strong> ${cli?.nombre}<br/><strong>${cli?.tipo}:</strong> ${cli?.doc}</div>
    </div>
    <table><tr style="background:#1e3a5f;color:white;"><th>Producto</th><th>Cant.</th><th>P.Unit</th><th>Total</th></tr>
    ${c.items.map(i=>`<tr><td>${i.nombre}</td><td class="r">${i.qty}</td><td class="r">S/ ${i.precio.toFixed(2)}</td><td class="r">S/ ${i.total.toFixed(2)}</td></tr>`).join('')}
    <tr style="background:#f0f0f0;"><td colspan="3" class="r"><strong>TOTAL</strong></td><td class="r"><strong>S/ ${c.total.toFixed(2)}</strong></td></tr></table>
    ${c.notas?`<p><strong>Notas:</strong> ${c.notas}</p>`:''}
    <hr/><div class="c" style="color:#666;">Cotización válida hasta ${c.vencimiento} — ${DB.empresa.nombre}</div>
    </body></html>`);
    w.document.close(); w.print();
  },

  whatsapp(id) {
    const c=DB.cotizaciones.find(x=>x.id===id);
    const cli=DB.clientes.find(x=>x.id===c.cliente_id);
    const items=c.items.map(i=>`• ${i.nombre} x${i.qty} = S/ ${i.total.toFixed(2)}`).join('\n');
    const msg=encodeURIComponent(`Estimado/a ${cli?.nombre}, adjuntamos nuestra cotización ${c.numero}:\n\n${items}\n\n*TOTAL: S/ ${c.total.toFixed(2)}*\n\nVálida hasta: ${c.vencimiento}\n\n${DB.empresa.nombre} — RUC: ${DB.empresa.ruc}`);
    window.open(`https://wa.me/?text=${msg}`,'_blank');
  },

  cambiarEstado(id,estado) {
    const i=DB.cotizaciones.findIndex(x=>x.id===id);
    if (i>=0) DB.cotizaciones[i].estado=estado;
    App.toast(`Cotización ${estado.toLowerCase()}`,'success'); App.renderPage();
  },

  convertirVenta(id) {
    const c=DB.cotizaciones.find(x=>x.id===id);
    if (!c) return;
    // Copy items to VentasModule
    VentasModule.currentItems = c.items.map(i=>({...i,prod_id:i.prod_id||0}));
    VentasModule.selectedCliente = DB.clientes.find(x=>x.id===c.cliente_id);
    VentasModule.tipoComprobante = 'BOLETA DE VENTA ELECTRONICA';
    VentasModule.serieActual = 'BV03';
    const ci=DB.cotizaciones.findIndex(x=>x.id===id);
    DB.cotizaciones[ci].estado='CONVERTIDA';
    App.toast('Cotización convertida a venta','success');
    App.navigate('ventas');
    setTimeout(()=>{
      const el=document.getElementById('pageContent');
      if (el) el.innerHTML=VentasModule.renderComprobante();
    },100);
  },

  exportar() { App.toast('Exportando cotizaciones...','info'); }
};

// ============================================================
// MÓDULO: NOTAS DE CRÉDITO / DÉBITO
// ============================================================

if (!DB.notasCredito) DB.notasCredito = [
  { id:1, tipo:'CREDITO', numero:'NC01-001', fecha:'2026-03-29', venta_ref:'BV03-00000236', cliente_id:12, motivo:'ANULACION', monto:54.00, estado:'EMITIDA' },
  { id:2, tipo:'DEBITO',  numero:'ND01-001', fecha:'2026-03-28', venta_ref:'BV03-00000235', cliente_id:13, motivo:'AJUSTE DE PRECIO', monto:5.00, estado:'EMITIDA' },
];

const NotasCreditoModule = {
  render() {
    App.setTabs2('Notas de Crédito / Débito', 'VENTAS');
    return `
      <div class="page-header">
        <h2 class="page-title">Notas de Crédito / Débito</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="NotasCreditoModule.nueva()"><i class="fas fa-plus"></i> Nueva Nota</button>
        </div>
      </div>

      <div class="stats-grid mb-5" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-file-invoice"></i></div>
          <div class="stat-info"><div class="stat-value">${DB.notasCredito.filter(n=>n.tipo==='CREDITO').length}</div><div class="stat-label">Notas de Crédito</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-file-invoice"></i></div>
          <div class="stat-info"><div class="stat-value">${DB.notasCredito.filter(n=>n.tipo==='DEBITO').length}</div><div class="stat-label">Notas de Débito</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-dollar-sign"></i></div>
          <div class="stat-info"><div class="stat-value">S/ ${DB.notasCredito.reduce((s,n)=>s+n.monto,0).toFixed(2)}</div><div class="stat-label">Monto Total</div></div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>Tipo</th><th>Número</th><th>Fecha</th><th>Ref. Venta</th><th>Cliente</th><th>Motivo</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              ${DB.notasCredito.map(n=>{
                const cli=DB.clientes.find(x=>x.id===n.cliente_id);
                return `<tr>
                  <td><span class="${n.tipo==='CREDITO'?'nc-tipo-credito':'nc-tipo-debito'}">${n.tipo}</span></td>
                  <td><strong>${n.numero}</strong></td>
                  <td class="text-sm">${n.fecha}</td>
                  <td class="text-sm text-muted">${n.venta_ref}</td>
                  <td><div class="td-name" style="font-size:12px;">${cli?.nombre||'N/A'}</div></td>
                  <td class="text-sm">${n.motivo}</td>
                  <td><strong>S/ ${n.monto.toFixed(2)}</strong></td>
                  <td><span class="status-aceptado">EMITIDA</span></td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="NotasCreditoModule.imprimir(${n.id})"><i class="fas fa-print"></i></button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  nueva() {
    App.showModal('Nueva Nota de Crédito / Débito',`
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipo <span class="required">*</span></label>
          <select class="form-control" id="nc_tipo">
            <option value="CREDITO">NOTA DE CRÉDITO</option>
            <option value="DEBITO">NOTA DE DÉBITO</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comprobante de Referencia</label>
          <select class="form-control" id="nc_ref">
            ${DB.ventas.map(v=>`<option value="${v.serie}-${v.numero}">${v.serie}-${v.numero}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Cliente <span class="required">*</span></label>
          <select class="form-control" id="nc_cli">
            ${DB.clientes.filter(c=>c.tipo_cliente==='cliente').map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Motivo <span class="required">*</span></label>
          <select class="form-control" id="nc_motivo">
            <option>ANULACION</option>
            <option>DEVOLUCION</option>
            <option>DESCUENTO</option>
            <option>AJUSTE DE PRECIO</option>
            <option>ERROR EN COMPROBANTE</option>
            <option>DIFERENCIA DE CAMBIO</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Monto (S/) <span class="required">*</span></label>
          <input class="form-control" id="nc_monto" type="number" step="0.01" min="0.01" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" id="nc_fecha" type="date" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
      </div>`,
      [{ text:'Emitir Nota', cls:'btn-primary', cb:()=>{
        const tipo=document.getElementById('nc_tipo')?.value;
        const monto=parseFloat(document.getElementById('nc_monto')?.value)||0;
        if (!monto) { App.toast('Ingrese monto','error'); return; }
        const seq=DB.notasCredito.length+1;
        const prefix=tipo==='CREDITO'?'NC01':'ND01';
        DB.notasCredito.push({
          id:seq, tipo,
          numero:`${prefix}-${String(seq).padStart(3,'0')}`,
          fecha:document.getElementById('nc_fecha')?.value,
          venta_ref:document.getElementById('nc_ref')?.value||'',
          cliente_id:parseInt(document.getElementById('nc_cli')?.value),
          motivo:document.getElementById('nc_motivo')?.value,
          monto, estado:'EMITIDA'
        });
        App.toast(`Nota de ${tipo.toLowerCase()} emitida`,'success'); App.closeModal(); App.renderPage();
      }}]
    );
  },

  imprimir(id) { App.toast('Imprimiendo nota...','info'); }
};
