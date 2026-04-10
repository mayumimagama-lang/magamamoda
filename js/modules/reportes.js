// ============================================================
// MÓDULO: REPORTES
// ============================================================

const ReportesModule = {
  render() {
    App.setTabs2('Reportes', 'ESTADÍSTICAS');
    const totalVentas = DB.ventas.reduce((s, v) => s + v.total, 0);
    const totalCompras = DB.compras.reduce((s, c) => s + c.total, 0);
    const utilidad = totalVentas - totalCompras;

    // Ventas por día (últimos 7 días)
    const hoy = new Date();
    const ventasDia = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      const fecha = d.toISOString().split('T')[0];
      const total = DB.ventas.filter(v => v.fecha === fecha).reduce((s, v) => s + v.total, 0);
      ventasDia.push({ fecha: d.toLocaleDateString('es-PE', {day:'2-digit',month:'short'}), total });
    }
    const maxVenta = Math.max(...ventasDia.map(d => d.total), 1);

    return `
      <div class="page-header">
        <h2 class="page-title">Reportes y Estadísticas</h2>
        <div class="page-actions">
          <button class="btn btn-outline" onclick="ReportesModule.exportarPDF()"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="stats-grid mb-5" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-dollar-sign"></i></div>
          <div class="stat-info">
            <div class="stat-value">S/ ${totalVentas.toFixed(2)}</div>
            <div class="stat-label">Total Ventas</div>
            <div class="stat-change up"><i class="fas fa-arrow-up"></i> Período actual</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-shopping-cart"></i></div>
          <div class="stat-info">
            <div class="stat-value">S/ ${totalCompras.toFixed(2)}</div>
            <div class="stat-label">Total Compras</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-chart-line"></i></div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--success);">S/ ${utilidad.toFixed(2)}</div>
            <div class="stat-label">Utilidad Bruta</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <div class="stat-value">${DB.clientes.filter(c=>c.tipo_cliente==='cliente').length}</div>
            <div class="stat-label">Clientes Activos</div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px;">
        <!-- Gráfico de Ventas -->
        <div class="card">
          <div class="card-header">
            <span class="card-title"><i class="fas fa-chart-bar" style="color:var(--accent);margin-right:6px;"></i> Ventas Últimos 7 Días</span>
          </div>
          <div class="card-body">
            <div style="display:flex;align-items:flex-end;gap:10px;height:180px;padding:10px 0;">
              ${ventasDia.map(d => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                  <div style="font-size:10px;font-weight:700;color:var(--gray-700);">S/${d.total.toFixed(0)}</div>
                  <div style="width:100%;background:linear-gradient(180deg,#2563eb,#3b82f6);border-radius:4px 4px 0 0;height:${d.total>0?(d.total/maxVenta*140).toFixed(0):2}px;min-height:2px;transition:height 0.5s;"></div>
                  <div style="font-size:10px;color:var(--gray-500);text-align:center;">${d.fecha}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Top Productos -->
        <div class="card">
          <div class="card-header">
            <span class="card-title"><i class="fas fa-star" style="color:var(--warning);margin-right:6px;"></i> Top Productos</span>
          </div>
          <div class="card-body" style="padding:0;">
            ${this.topProductos().map((p, i) => `
              <div class="flex-between" style="padding:12px 16px;border-bottom:1px solid var(--gray-100);">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="width:22px;height:22px;border-radius:50%;background:${['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed'][i]};color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;">${i+1}</span>
                  <span class="text-sm font-bold">${p.nombre}</span>
                </div>
                <span class="badge badge-info">${p.vendido} und</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Reportes disponibles -->
      <div class="card">
        <div class="card-header"><span class="card-title">Reportes Disponibles</span></div>
        <div class="card-body">
          <div class="report-cards">
            ${[
              { icon:'fas fa-file-invoice-dollar', title:'Reporte de Ventas', color:'#2563eb', cb:'VentasDiarias' },
              { icon:'fas fa-shopping-cart', title:'Reporte de Compras', color:'#dc2626', cb:'Compras' },
              { icon:'fas fa-boxes', title:'Reporte de Inventario', color:'#16a34a', cb:'Inventario' },
              { icon:'fas fa-users', title:'Reporte de Clientes', color:'#7c3aed', cb:'Clientes' },
              { icon:'fas fa-chart-pie', title:'Reporte de Utilidades', color:'#d97706', cb:'Utilidades' },
              { icon:'fas fa-truck', title:'Reporte de Guías', color:'#0ea5e9', cb:'Guias' },
            ].map(r => `
              <div class="report-card" onclick="ReportesModule.ver('${r.cb}')">
                <i class="${r.icon}" style="color:${r.color};"></i>
                <h4>${r.title}</h4>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  topProductos() {
    const ventas = {};
    DB.ventas.forEach(v => {
      v.items.forEach(item => {
        if (!ventas[item.prod_id]) ventas[item.prod_id] = { nombre: item.nombre, vendido: 0 };
        ventas[item.prod_id].vendido += item.qty;
      });
    });
    return Object.values(ventas).sort((a, b) => b.vendido - a.vendido).slice(0, 5);
  },

  ver(tipo) { App.toast(`Generando Reporte de ${tipo}...`, 'info'); },
  exportarPDF() { App.toast('Exportando reporte en PDF...', 'info'); }
};
