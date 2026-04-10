// ============================================================
// MÓDULO: KARDEX — Historial de Movimientos de Inventario
// ============================================================

if (!DB.kardex) DB.kardex = [
  { id:1, fecha:'2026-03-25', hora:'09:00:00', prod_id:1, tipo:'ENTRADA', concepto:'Compra proveedor FC01-00001234', cantidad:50, stock_anterior:70, stock_nuevo:120, usuario:'FREDDY' },
  { id:2, fecha:'2026-03-28', hora:'18:05:13', prod_id:2, tipo:'SALIDA',  concepto:'Venta BV03-00000235', cantidad:3, stock_anterior:88, stock_nuevo:85, usuario:'FREDDY' },
  { id:3, fecha:'2026-03-28', hora:'17:29:19', prod_id:9, tipo:'SALIDA',  concepto:'Venta NV03-00000683', cantidad:2, stock_anterior:77, stock_nuevo:75, usuario:'FREDDY' },
  { id:4, fecha:'2026-03-30', hora:'20:15:25', prod_id:1, tipo:'SALIDA',  concepto:'Venta NV03-00000687', cantidad:2, stock_anterior:122, stock_nuevo:120, usuario:'FREDDY' },
  { id:5, fecha:'2026-04-01', hora:'10:30:00', prod_id:8, tipo:'AJUSTE',  concepto:'Ajuste de inventario — producto dañado', cantidad:-10, stock_anterior:10, stock_nuevo:0, usuario:'FREDDY' },
];

const KardexModule = {
  prodFiltro: 0,
  tipoFiltro: 'todos',
  fechaInicio: '2026-03-01',
  fechaFin: new Date().toISOString().split('T')[0],

  render() {
    App.setTabs2('Kardex de Productos', 'ALMACÉN');
    const filtered = this.getFiltrado();
    const entradas = filtered.filter(k=>k.tipo==='ENTRADA').reduce((s,k)=>s+Math.abs(k.cantidad),0);
    const salidas  = filtered.filter(k=>k.tipo==='SALIDA').reduce((s,k)=>s+Math.abs(k.cantidad),0);
    const ajustes  = filtered.filter(k=>k.tipo==='AJUSTE').length;

    return `
      <div class="page-header">
        <h2 class="page-title">Kardex — Movimientos de Inventario</h2>
        <div class="page-actions">
          <button class="btn btn-success" onclick="KardexModule.registrarManual()"><i class="fas fa-plus"></i> Registro Manual</button>
          <button class="btn btn-outline" onclick="KardexModule.exportar()"><i class="fas fa-file-excel"></i> Exportar</button>
        </div>
      </div>

      <div class="stats-grid mb-5" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-history"></i></div>
          <div class="stat-info"><div class="stat-value">${filtered.length}</div><div class="stat-label">Movimientos</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-arrow-circle-up"></i></div>
          <div class="stat-info"><div class="stat-value kardex-entrada">${entradas}</div><div class="stat-label">Entradas (Unidades)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-arrow-circle-down"></i></div>
          <div class="stat-info"><div class="stat-value kardex-salida">${salidas}</div><div class="stat-label">Salidas (Unidades)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-exchange-alt"></i></div>
          <div class="stat-info"><div class="stat-value kardex-ajuste">${ajustes}</div><div class="stat-label">Ajustes</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding-bottom:0;">
          <div class="filter-row mb-4">
            <div class="filter-group">
              <label>Fecha Inicio</label>
              <input type="date" class="filter-input" value="${this.fechaInicio}" onchange="KardexModule.fechaInicio=this.value;App.renderPage()"/>
            </div>
            <div class="filter-group">
              <label>Fecha Fin</label>
              <input type="date" class="filter-input" value="${this.fechaFin}" onchange="KardexModule.fechaFin=this.value;App.renderPage()"/>
            </div>
            <div class="filter-group">
              <label>Producto</label>
              <select class="filter-select" onchange="KardexModule.prodFiltro=parseInt(this.value);App.renderPage()">
                <option value="0">Todos los productos</option>
                ${DB.productos.map(p=>`<option value="${p.id}" ${this.prodFiltro===p.id?'selected':''}>${p.nombre}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>Tipo</label>
              <select class="filter-select" onchange="KardexModule.tipoFiltro=this.value;App.renderPage()">
                <option value="todos">Todos</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SALIDA">Salidas</option>
                <option value="AJUSTE">Ajustes</option>
              </select>
            </div>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th><th>Producto</th><th>Tipo</th><th>Concepto</th>
                <th>Cantidad</th><th>Stock Anterior</th><th>Stock Nuevo</th><th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length===0?`<tr><td colspan="8"><div class="empty-state"><i class="fas fa-history"></i><p>Sin movimientos en el período</p></div></td></tr>`:
                [...filtered].reverse().map(k=>{
                  const p=DB.productos.find(x=>x.id===k.prod_id);
                  return `<tr>
                    <td><div style="font-size:13px;font-weight:700;">${k.fecha}</div><div class="td-sub">${k.hora}</div></td>
                    <td><div class="td-name">${p?.nombre||'N/A'}</div><div class="td-sub">${p?.codigo||''}</div></td>
                    <td>
                      <span class="${k.tipo==='ENTRADA'?'badge badge-success':k.tipo==='SALIDA'?'badge badge-danger':'badge badge-warning'}">
                        <i class="fas ${k.tipo==='ENTRADA'?'fa-arrow-up':k.tipo==='SALIDA'?'fa-arrow-down':'fa-exchange-alt'}"></i> ${k.tipo}
                      </span>
                    </td>
                    <td class="text-sm text-muted">${k.concepto}</td>
                    <td class="${k.tipo==='ENTRADA'?'kardex-entrada':'kardex-salida'}">
                      ${k.tipo==='ENTRADA'?'+':''}${k.cantidad}
                    </td>
                    <td class="text-muted">${k.stock_anterior}</td>
                    <td><strong>${k.stock_nuevo}</strong></td>
                    <td class="text-sm text-muted"><i class="fas fa-user"></i> ${k.usuario}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getFiltrado() {
    return DB.kardex.filter(k=>{
      const matchProd = !this.prodFiltro || k.prod_id===this.prodFiltro;
      const matchTipo = this.tipoFiltro==='todos' || k.tipo===this.tipoFiltro;
      const matchFecha = k.fecha>=this.fechaInicio && k.fecha<=this.fechaFin;
      return matchProd && matchTipo && matchFecha;
    });
  },

  // Called automatically when products are sold/purchased
  registrar(items, tipo, concepto) {
    const ahora=new Date();
    items.forEach(item=>{
      const p=DB.productos.find(x=>x.id===item.prod_id);
      if (!p) return;
      const stockAnterior = tipo==='SALIDA' ? p.stock + item.qty : p.stock;
      const stockNuevo = tipo==='SALIDA' ? p.stock : p.stock + item.qty;
      DB.kardex.push({
        id:DB.kardex.length+1,
        fecha:ahora.toISOString().split('T')[0],
        hora:ahora.toTimeString().slice(0,8),
        prod_id:item.prod_id, tipo, concepto,
        cantidad: tipo==='SALIDA'? -item.qty : item.qty,
        stock_anterior:stockAnterior, stock_nuevo:stockNuevo,
        usuario:'FREDDY'
      });
    });
  },

  registrarManual() {
    App.showModal('Registro Manual de Movimiento',`
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Producto <span class="required">*</span></label>
          <select class="form-control" id="km_prod">
            ${DB.productos.map(p=>`<option value="${p.id}">${p.nombre} (Stock: ${p.stock})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo <span class="required">*</span></label>
          <select class="form-control" id="km_tipo">
            <option value="ENTRADA">ENTRADA (+)</option>
            <option value="SALIDA">SALIDA (-)</option>
            <option value="AJUSTE">AJUSTE</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cantidad <span class="required">*</span></label>
          <input class="form-control" id="km_cant" type="number" min="1" placeholder="0"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Concepto / Motivo</label>
          <input class="form-control" id="km_concepto" placeholder="Ej: Compra, ajuste, devolución..."/>
        </div>
      </div>`,[
      { text:'Registrar', cls:'btn-primary', cb:()=>{
        const prodId=parseInt(document.getElementById('km_prod')?.value);
        const tipo=document.getElementById('km_tipo')?.value;
        const cant=parseInt(document.getElementById('km_cant')?.value)||0;
        const concepto=document.getElementById('km_concepto')?.value||'Ajuste manual';
        if (!cant) { App.toast('Ingrese cantidad','error'); return; }
        const pi=DB.productos.findIndex(x=>x.id===prodId);
        const antes=DB.productos[pi].stock;
        if (tipo==='SALIDA') DB.productos[pi].stock=Math.max(0,antes-cant);
        else DB.productos[pi].stock=antes+cant;
        DB.kardex.push({
          id:DB.kardex.length+1, fecha:new Date().toISOString().split('T')[0],
          hora:new Date().toTimeString().slice(0,8), prod_id:prodId, tipo, concepto,
          cantidad:tipo==='SALIDA'?-cant:cant, stock_anterior:antes, stock_nuevo:DB.productos[pi].stock, usuario:'FREDDY'
        });
        App.toast('Movimiento registrado','success'); App.closeModal(); App.renderPage();
      }}
    ]);
  },

  exportar() { App.toast('Exportando kardex...','info'); }
};
