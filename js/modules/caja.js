// ============================================================
// MÓDULO: CAJA
// ============================================================

const CajaModule = {
  render() {
    App.setTabs2('Arqueo de Cajas', 'GRUPO JUMILA SOCIEDAD ANONIMA CERRADA');
    const caja = DB.cajas[0];
    const ventasHoy = DB.ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]);
    const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);

    return `
      <div class="page-header">
        <h2 class="page-title">Caja</h2>
      </div>

      <!-- Estado de la caja -->
      <div class="stats-grid mb-5" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:${caja?.estado==='ABIERTA'?'#f0fdf4':'#fef2f2'};color:${caja?.estado==='ABIERTA'?'#16a34a':'#dc2626'};">
            <i class="fas fa-cash-register"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:16px;">${caja?.estado || 'CERRADA'}</div>
            <div class="stat-label">Estado de Caja</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-dollar-sign"></i></div>
          <div class="stat-info">
            <div class="stat-value">S/ ${(caja?.monto_inicial || 0).toFixed(2)}</div>
            <div class="stat-label">Monto Inicial</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-file-invoice"></i></div>
          <div class="stat-info">
            <div class="stat-value">${ventasHoy.length}</div>
            <div class="stat-label">Ventas del Día</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-chart-line"></i></div>
          <div class="stat-info">
            <div class="stat-value">S/ ${totalHoy.toFixed(2)}</div>
            <div class="stat-label">Total Recaudado</div>
          </div>
        </div>
      </div>

      <!-- Opciones de caja -->
      <div class="caja-grid">
        <div class="caja-card" onclick="CajaModule.abrirArqueo()">
          <div class="caja-card-icon">🏪</div>
          <div class="caja-card-title">Arqueo de Caja</div>
          <p style="color:var(--gray-500);font-size:12px;margin-top:8px;">Apertura y cierre de caja</p>
        </div>
        <div class="caja-card" onclick="CajaModule.abrirReporte()">
          <div class="caja-card-icon">🖥️</div>
          <div class="caja-card-title">Reporte de Caja</div>
          <p style="color:var(--gray-500);font-size:12px;margin-top:8px;">Ver movimientos del día</p>
        </div>
        <div class="caja-card" onclick="CajaModule.registrarIngreso()">
          <div class="caja-card-icon">💵</div>
          <div class="caja-card-title">Registro de Ingreso</div>
          <p style="color:var(--gray-500);font-size:12px;margin-top:8px;">Registrar ingresos de efectivo</p>
        </div>
        <div class="caja-card" onclick="CajaModule.registrarEgreso()">
          <div class="caja-card-icon">💸</div>
          <div class="caja-card-title">Registro de Egreso</div>
          <p style="color:var(--gray-500);font-size:12px;margin-top:8px;">Registrar salidas de efectivo</p>
        </div>
      </div>
    `;
  },

  abrirArqueo() {
    const caja = DB.cajas[0];
    App.showModal('Arqueo de Caja', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Estado Actual</label>
          <div class="form-control" style="background:var(--gray-50);">${caja?.estado || 'CERRADA'}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" type="date" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Monto Inicial (S/)</label>
          <input class="form-control" id="montoCajaInicial" type="number" step="0.01" value="${caja?.monto_inicial || 200}" placeholder="0.00"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" rows="2" placeholder="Observaciones..."></textarea>
        </div>
      </div>
    `, [
      { text: caja?.estado === 'ABIERTA' ? 'Cerrar Caja' : 'Abrir Caja', cls: caja?.estado === 'ABIERTA' ? 'btn-danger' : 'btn-success', cb: () => {
        if (caja?.estado === 'ABIERTA') {
          DB.cajas[0].estado = 'CERRADA';
          App.toast('Caja cerrada correctamente', 'warning');
        } else {
          DB.cajas[0] = { ...DB.cajas[0], estado: 'ABIERTA', monto_inicial: parseFloat(document.getElementById('montoCajaInicial')?.value) || 200 };
          App.toast('Caja abierta correctamente', 'success');
        }
        App.closeModal();
        App.renderPage();
      }}
    ]);
  },

  abrirReporte() {
    const ventasHoy = DB.ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]);
    const totalEfectivo = ventasHoy.filter(v=>v.metodo_pago==='EFECTIVO').reduce((s,v)=>s+v.total,0);
    const totalTarjeta = ventasHoy.filter(v=>v.metodo_pago==='TARJETA').reduce((s,v)=>s+v.total,0);
    const total = ventasHoy.reduce((s,v)=>s+v.total,0);
    App.showModal('Reporte de Caja - Hoy', `
      <div style="font-size:14px;">
        <div class="total-line"><span>Ventas en Efectivo:</span><span class="font-bold">S/ ${totalEfectivo.toFixed(2)}</span></div>
        <div class="total-line"><span>Ventas con Tarjeta:</span><span class="font-bold">S/ ${totalTarjeta.toFixed(2)}</span></div>
        <div class="total-line main"><span>TOTAL CAJA:</span><span style="color:var(--success);">S/ ${((DB.cajas[0]?.monto_inicial||0)+total).toFixed(2)}</span></div>
        <hr style="margin:12px 0;"/>
        <div style="font-weight:700;margin-bottom:8px;">Detalle de Ventas:</div>
        ${ventasHoy.length === 0 ? '<p class="text-muted text-center">Sin ventas registradas hoy</p>' :
          ventasHoy.map(v=>`<div class="flex-between text-sm" style="padding:4px 0;border-bottom:1px solid var(--gray-100);">
            <span>${v.hora} - ${v.serie}-${v.numero}</span>
            <span class="font-bold">S/ ${v.total.toFixed(2)}</span>
          </div>`).join('')}
      </div>
    `, [{ text:'Imprimir Reporte', cls:'btn-primary', cb: () => App.toast('Imprimiendo reporte...','info') }]);
  },

  registrarIngreso() {
    App.showModal('Registrar Ingreso', `
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Concepto</label>
          <input class="form-control" type="text" placeholder="Ej: Préstamo, apertura de caja, etc."/>
        </div>
        <div class="form-group">
          <label class="form-label">Monto (S/)</label>
          <input class="form-control" type="number" step="0.01" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" type="date" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
      </div>
    `, [{ text:'Registrar Ingreso', cls:'btn-success', cb: () => { App.toast('Ingreso registrado', 'success'); App.closeModal(); } }]);
  },

  registrarEgreso() {
    App.showModal('Registrar Egreso', `
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Concepto</label>
          <input class="form-control" type="text" placeholder="Ej: Pago a proveedor, gastos, etc."/>
        </div>
        <div class="form-group">
          <label class="form-label">Monto (S/)</label>
          <input class="form-control" type="number" step="0.01" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" type="date" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
      </div>
    `, [{ text:'Registrar Egreso', cls:'btn-danger', cb: () => { App.toast('Egreso registrado', 'warning'); App.closeModal(); } }]);
  }
};

// ============================================================
// MÓDULO: INVENTARIO
// ============================================================

const InventarioModule = {
  render() {
    App.setTabs2('Inventario', 'PRODUCTOS');
    const stockBajo = DB.productos.filter(p => p.stock > 0 && p.stock <= 10);
    const sinStock  = DB.productos.filter(p => p.stock === 0);
    const stockOk   = DB.productos.filter(p => p.stock > 10);

    return `
      <div class="page-header">
        <h2 class="page-title">Control de Inventario</h2>
        <div class="page-actions">
          <button class="btn btn-success" onclick="App.navigate('productos')"><i class="fas fa-boxes"></i> Gestionar Productos</button>
          <button class="btn btn-outline" onclick="InventarioModule.exportar()"><i class="fas fa-cloud-download-alt"></i> Exportar</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid mb-5" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-boxes"></i></div>
          <div class="stat-info"><div class="stat-value">${DB.productos.length}</div><div class="stat-label">Productos Totales</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info"><div class="stat-value">${stockOk.length}</div><div class="stat-label">Stock Normal</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-info"><div class="stat-value">${stockBajo.length}</div><div class="stat-label">Stock Bajo ≤ 10</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-times-circle"></i></div>
          <div class="stat-info"><div class="stat-value">${sinStock.length}</div><div class="stat-label">Sin Stock</div></div>
        </div>
      </div>

      ${stockBajo.length || sinStock.length ? `
      <div class="card mb-4" style="border-left:4px solid var(--warning);">
        <div class="card-header">
          <span class="card-title" style="color:var(--warning);"><i class="fas fa-exclamation-triangle"></i> Alertas de Stock</span>
        </div>
        <div class="card-body">
          ${sinStock.map(p=>`
            <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
              <div><span class="font-bold">${p.nombre}</span> <span class="text-muted text-sm">(${p.codigo})</span></div>
              <span class="stock-badge stock-out"><i class="fas fa-times"></i> SIN STOCK</span>
            </div>`).join('')}
          ${stockBajo.map(p=>`
            <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
              <div><span class="font-bold">${p.nombre}</span> <span class="text-muted text-sm">(${p.codigo})</span></div>
              <span class="stock-badge stock-low"><i class="fas fa-exclamation"></i> STOCK BAJO: ${p.stock}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Tabla de inventario completa -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Inventario de Productos</span>
          <span class="text-sm text-muted">Valorizado total: <strong style="color:var(--success);">S/ ${DB.productos.reduce((s,p)=>s+(p.stock*p.precio_venta),0).toFixed(2)}</strong></span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Valor Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${DB.productos.map(p => `
              <tr>
                <td><span class="badge badge-gray">${p.codigo}</span></td>
                <td><div class="td-name">${p.nombre}</div><div class="td-sub">${p.unidad}</div></td>
                <td class="text-sm text-muted">${p.categoria}</td>
                <td>${this.stockBadge(p.stock)}</td>
                <td class="text-muted">S/ ${p.precio_compra.toFixed(2)}</td>
                <td><strong>S/ ${p.precio_venta.toFixed(2)}</strong></td>
                <td style="color:var(--success);font-weight:700;">S/ ${(p.stock*p.precio_venta).toFixed(2)}</td>
                <td><span class="badge ${p.stock>0?'badge-success':'badge-danger'}">${p.stock>10?'Normal':p.stock>0?'Bajo':'Agotado'}</span></td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="ProductosModule.ajustarStock(${p.id})">
                    <i class="fas fa-edit"></i> Ajustar
                  </button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  stockBadge(stock) {
    if (stock === 0)  return `<span class="stock-badge stock-out"><i class="fas fa-times"></i> ${stock}</span>`;
    if (stock <= 10)  return `<span class="stock-badge stock-low"><i class="fas fa-exclamation"></i> ${stock}</span>`;
    return `<span class="stock-badge stock-ok"><i class="fas fa-check"></i> ${stock}</span>`;
  },

  exportar() { App.toast('Exportando inventario...', 'info'); }
};
