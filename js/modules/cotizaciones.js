// ============================================================
// MÓDULO: COTIZACIONES / PROFORMAS — Versión Profesional
// ============================================================

if (!DB.cotizaciones) DB.cotizaciones = [];
DB._cotSeq = DB._cotSeq || 1;

const CotizacionesModule = {
  currentItems: [],
  clienteSeleccionado: null,
  modoVista: 'lista',
  _searchResults: null,

  render() {
    App.setTabs2('Cotizaciones / Proformas', 'VENTAS');
    return this.modoVista === 'form' ? this._renderForm() : this._renderLista();
  },

  // ─── LISTA ───
  _renderLista() {
    const aprobadas  = DB.cotizaciones.filter(c => c.estado === 'APROBADA').length;
    const pendientes = DB.cotizaciones.filter(c => c.estado === 'PENDIENTE').length;
    const totalMonto = DB.cotizaciones.reduce((s, c) => s + c.total, 0);

    return `
    <div class="page-header">
      <div>
        <h2 class="page-title"><i class="fas fa-file-alt" style="color:var(--accent);margin-right:8px;"></i>Cotizaciones / Proformas</h2>
        <p class="text-muted text-sm">${DB.cotizaciones.length} cotizaciones · Total: <strong style="color:var(--success);">S/ ${totalMonto.toFixed(2)}</strong></p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline" onclick="CotizacionesModule.exportar()"><i class="fas fa-file-download"></i> Exportar</button>
        <button class="btn btn-success" style="padding:10px 24px;font-size:15px;" onclick="CotizacionesModule.nueva()"><i class="fas fa-plus"></i> Nueva Cotización</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      <div class="stat-card">
        <div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-file-alt"></i></div>
        <div class="stat-info"><div class="stat-value">${DB.cotizaciones.length}</div><div class="stat-label">Total Cotizaciones</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-clock"></i></div>
        <div class="stat-info"><div class="stat-value">${pendientes}</div><div class="stat-label">Pendientes</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-check-circle"></i></div>
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
            <tr><th>N° Cotización</th><th>Fecha</th><th>Vencimiento</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${DB.cotizaciones.length === 0 ? `
              <tr><td colspan="8">
                <div class="empty-state">
                  <i class="fas fa-file-alt"></i>
                  <p>Sin cotizaciones</p>
                  <button class="btn btn-success btn-sm" onclick="CotizacionesModule.nueva()" style="margin-top:12px;">
                    <i class="fas fa-plus"></i> Crear Primera Cotización
                  </button>
                </div>
              </td></tr>` :
              DB.cotizaciones.map(c => {
                const cli = DB.clientes.find(x => x.id === c.cliente_id);
                const vencida = new Date(c.vencimiento) < new Date() && c.estado === 'PENDIENTE';
                const estado = vencida ? 'VENCIDA' : c.estado;
                const estBg  = estado==='APROBADA'?'#dcfce7':estado==='RECHAZADA'?'#fee2e2':estado==='VENCIDA'?'#fef2f2':estado==='CONVERTIDA'?'#ede9fe':'#fef3c7';
                const estClr = estado==='APROBADA'?'#16a34a':estado==='RECHAZADA'?'#dc2626':estado==='VENCIDA'?'#dc2626':estado==='CONVERTIDA'?'#7c3aed':'#d97706';
                return `<tr>
                  <td><strong style="color:var(--accent);">${c.numero}</strong></td>
                  <td class="text-sm">${c.fecha}</td>
                  <td><span style="color:${vencida?'#dc2626':'var(--gray-700)'};">${c.vencimiento}</span></td>
                  <td><div style="font-weight:700;font-size:13px;">${cli?.nombre || 'N/A'}</div></td>
                  <td><span style="font-size:12px;color:var(--gray-500);">${c.items.length} producto(s)</span></td>
                  <td><strong style="font-size:15px;">S/ ${c.total.toFixed(2)}</strong></td>
                  <td><span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;background:${estBg};color:${estClr};">${estado}</span></td>
                  <td>
                    <div style="display:flex;gap:5px;flex-wrap:wrap;">
                      <button class="btn btn-outline btn-sm" onclick="CotizacionesModule.ver(${c.id})" title="Ver"><i class="fas fa-eye"></i></button>
                      <button class="btn btn-outline btn-sm" onclick="CotizacionesModule.imprimir(${c.id})" title="Imprimir"><i class="fas fa-print"></i></button>
                      <button class="btn btn-outline btn-sm" onclick="CotizacionesModule.whatsapp(${c.id})" title="WhatsApp"><i class="fab fa-whatsapp" style="color:#25D366;"></i></button>
                      ${c.estado === 'PENDIENTE' ? `
                        <button class="btn btn-success btn-sm" onclick="CotizacionesModule.cambiarEstado(${c.id},'APROBADA')" title="Aprobar"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="CotizacionesModule.cambiarEstado(${c.id},'RECHAZADA')" title="Rechazar"><i class="fas fa-times"></i></button>` : ''}
                      ${c.estado === 'APROBADA' ? `
                        <button class="btn btn-success btn-sm" onclick="CotizacionesModule.convertirVenta(${c.id})"><i class="fas fa-file-invoice"></i> Facturar</button>` : ''}
                    </div>
                  </td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  // ─── FORMULARIO NUEVA COTIZACIÓN ───
  nueva() {
    this.currentItems = [];
    this.clienteSeleccionado = DB.clientes.find(c => c.doc === '00000000') || DB.clientes[0];
    this._searchResults = null;
    this.modoVista = 'form';
    App.renderPage();
  },

  _renderForm() {
    const total    = this.currentItems.reduce((s, i) => s + i.total, 0);
    const self     = this;
    const hoy      = new Date().toISOString().split('T')[0];
    const venc     = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    const numero   = 'COT-' + String(DB._cotSeq).padStart(3,'0');

    // Buscador live de productos
    let buscadorArea = '';
    if (this._searchResults && this._searchResults.length > 0) {
      buscadorArea = `
        <div style="border:2px solid var(--accent);border-radius:10px;overflow:hidden;margin-top:8px;">
          <div style="padding:8px 12px;background:var(--accent);color:white;font-size:11px;font-weight:800;display:flex;justify-content:space-between;align-items:center;">
            <span>${this._searchResults.length} resultados</span>
            <button onclick="CotizacionesModule._searchResults=null;App.renderPage();" style="background:none;border:none;color:white;cursor:pointer;font-size:14px;">✕</button>
          </div>
          <div style="max-height:280px;overflow-y:auto;">
            <table class="data-table">
              <tbody>
                ${this._searchResults.map(p => {
                  const sClr = p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
                  return `<tr style="cursor:pointer;" onclick="CotizacionesModule._agregarProd(${p.id})">
                    <td>
                      <div style="font-weight:700;font-size:13px;">${p.nombre}</div>
                      <div style="font-size:11px;color:var(--gray-400);">${p.codigo} · ${p.unidad}</div>
                    </td>
                    <td><strong style="color:var(--accent);">S/ ${p.precio_venta.toFixed(2)}</strong></td>
                    <td><span style="font-weight:700;color:${sClr};font-size:12px;">${p.stock===0?'Sin stock':'✓ '+p.stock}</span></td>
                    <td>
                      <button class="btn btn-primary btn-sm" ${p.stock===0?'disabled':''}><i class="fas fa-plus"></i> Agregar</button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } else if (this._searchResults && this._searchResults.length === 0) {
      buscadorArea = `<div style="padding:16px;text-align:center;color:var(--gray-400);background:var(--gray-50);border-radius:8px;margin-top:8px;">Sin resultados</div>`;
    }

    return `
    <!-- TOPBAR -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:var(--gray-50);border-radius:12px;border:1.5px solid var(--gray-200);margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <button onclick="CotizacionesModule.modoVista='lista';App.renderPage();"
          style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;">
          <i class="fas fa-arrow-left" style="margin-right:6px;"></i>Regresar
        </button>
        <div>
          <div style="font-size:18px;font-weight:900;color:var(--gray-900);">Nueva Cotización</div>
          <div style="font-size:11px;color:var(--gray-400);">${numero} · ${hoy}</div>
        </div>
      </div>
      <button onclick="CotizacionesModule._guardar()"
        style="background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;border-radius:8px;padding:10px 26px;font-weight:900;cursor:pointer;font-size:15px;">
        <i class="fas fa-save" style="margin-right:6px;"></i>GUARDAR COTIZACIÓN
      </button>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- Datos del cliente -->
      <div class="card">
        <div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">
          <div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">
            <i class="fas fa-user" style="color:var(--accent);margin-right:5px;"></i>Datos del Cliente
          </div>
        </div>
        <div style="padding:16px 20px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">CLIENTE *</div>
              <select class="form-control" id="cot_cli" style="font-size:13px;">
                ${DB.clientes.filter(c => c.tipo_cliente === 'cliente' || c.doc === '00000000').map(c =>
                  `<option value="${c.id}" ${this.clienteSeleccionado?.id === c.id ? 'selected' : ''}>${c.nombre}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">VÁLIDA HASTA</div>
              <input class="form-control" id="cot_venc" type="date" value="${venc}" style="font-size:13px;"/>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">NOTAS</div>
              <input class="form-control" id="cot_notas" placeholder="Condiciones, observaciones..." style="font-size:13px;"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos -->
      <div class="card">
        <div style="padding:12px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">
            <i class="fas fa-boxes" style="color:var(--accent);margin-right:5px;"></i>Productos
            <span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:4px;">${this.currentItems.length}</span>
          </div>
        </div>

        <!-- Lista de items agregados -->
        <div style="padding:14px 20px;">
          ${this.currentItems.length === 0 ?
            `<div style="text-align:center;padding:30px;color:var(--gray-400);background:var(--gray-50);border-radius:10px;margin-bottom:14px;">
              <i class="fas fa-box-open" style="font-size:36px;display:block;margin-bottom:10px;opacity:0.3;"></i>
              <div style="font-size:14px;font-weight:700;">Busca y agrega productos abajo</div>
            </div>` :
            `<div style="margin-bottom:14px;">
              ${this.currentItems.map((item, i) => `
                <div style="display:flex;align-items:center;gap:12px;background:white;border:1.5px solid var(--gray-200);border-radius:10px;padding:10px 14px;margin-bottom:8px;">
                  <div style="flex:1;font-weight:700;font-size:14px;">${item.nombre}</div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <button onclick="CotizacionesModule._updQty(${i},${item.qty-1})" style="width:28px;height:28px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-weight:900;cursor:pointer;">−</button>
                    <input type="number" min="1" value="${item.qty}" onchange="CotizacionesModule._updQty(${i},this.value)"
                      style="width:50px;height:28px;border:1.5px solid var(--accent);border-radius:6px;text-align:center;font-weight:800;font-size:14px;color:var(--accent);"/>
                    <button onclick="CotizacionesModule._updQty(${i},${item.qty+1})" style="width:28px;height:28px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-weight:900;cursor:pointer;">+</button>
                  </div>
                  <div style="min-width:80px;text-align:center;">
                    <div style="font-size:11px;color:var(--gray-400);">P.Unit</div>
                    <div style="font-weight:700;">S/ ${item.precio.toFixed(2)}</div>
                  </div>
                  <div style="min-width:90px;text-align:center;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:8px;padding:6px 10px;">
                    <div style="font-size:11px;color:#1d4ed8;">Total</div>
                    <div style="font-size:16px;font-weight:900;color:var(--accent);">S/ ${item.total.toFixed(2)}</div>
                  </div>
                  <button onclick="CotizacionesModule._remove(${i})" style="width:32px;height:32px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:7px;cursor:pointer;">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>`).join('')}
            </div>`}

          <!-- Total -->
          <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
            <div style="padding:16px 24px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;color:white;text-align:center;">
              <div style="font-size:14px;font-weight:700;opacity:0.8;">TOTAL COTIZACIÓN</div>
              <div style="font-size:32px;font-weight:900;">S/ ${total.toFixed(2)}</div>
            </div>
          </div>

          <!-- Buscador de productos -->
          <div style="border-top:2px solid var(--gray-200);padding-top:14px;">
            <div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">
              <i class="fas fa-search" style="margin-right:5px;"></i>Buscar y Agregar Producto
            </div>
            <div style="display:flex;gap:8px;">
              <div style="flex:1;position:relative;">
                <i class="fas fa-barcode" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:16px;"></i>
                <input type="text" id="cotBuscador" placeholder="Escribe el nombre o código del producto..."
                  style="width:100%;padding:12px 12px 12px 42px;border:2px solid var(--gray-200);border-radius:10px;font-size:14px;background:white;outline:none;box-sizing:border-box;"
                  oninput="CotizacionesModule._filtrarProds(this.value)"
                  onkeydown="if(event.key==='Escape'){CotizacionesModule._searchResults=null;App.renderPage();}"/>
              </div>
            </div>
            ${buscadorArea}
          </div>
        </div>
      </div>

    </div>`;
  },

  _filtrarProds(term) {
    if (!term || term.length < 1) {
      this._searchResults = null;
      App.renderPage();
      setTimeout(() => {
        const inp = document.getElementById('cotBuscador');
        if (inp) inp.focus();
      }, 30);
      return;
    }
    this._searchResults = DB.productos.filter(p =>
      p.nombre.toLowerCase().includes(term.toLowerCase()) ||
      p.codigo.toLowerCase().includes(term.toLowerCase())
    );
    App.renderPage();
    setTimeout(() => {
      const inp = document.getElementById('cotBuscador');
      if (inp) { inp.value = term; inp.focus(); }
    }, 30);
  },

  _agregarProd(id) {
    const p = DB.productos.find(x => x.id === id);
    if (!p || p.stock === 0) return;
    const ex = this.currentItems.findIndex(x => x.prod_id === id);
    if (ex >= 0) {
      this.currentItems[ex].qty++;
      this.currentItems[ex].total = this.currentItems[ex].qty * this.currentItems[ex].precio;
    } else {
      this.currentItems.push({ prod_id:p.id, nombre:p.nombre, precio:p.precio_venta, qty:1, total:p.precio_venta });
    }
    this._searchResults = null;
    App.toast(p.nombre + ' agregado ✓', 'success');
    App.renderPage();
    setTimeout(() => {
      const inp = document.getElementById('cotBuscador');
      if (inp) { inp.value = ''; inp.focus(); }
    }, 50);
  },

  _updQty(idx, val) {
    const q = Math.max(1, parseInt(val) || 1);
    this.currentItems[idx].qty   = q;
    this.currentItems[idx].total = q * this.currentItems[idx].precio;
    App.renderPage();
  },

  _remove(idx) {
    this.currentItems.splice(idx, 1);
    App.renderPage();
  },

  _guardar() {
    if (!this.currentItems.length) { App.toast('Agrega al menos un producto', 'error'); return; }
    const total = this.currentItems.reduce((s, i) => s + i.total, 0);
    DB.cotizaciones.unshift({
      id: Date.now(),
      numero: 'COT-' + String(DB._cotSeq++).padStart(3,'0'),
      fecha: new Date().toISOString().split('T')[0],
      vencimiento: document.getElementById('cot_venc')?.value || '',
      cliente_id: parseInt(document.getElementById('cot_cli')?.value),
      items: [...this.currentItems],
      total,
      estado: 'PENDIENTE',
      notas: document.getElementById('cot_notas')?.value || ''
    });
    Storage.guardarCotizaciones();
    App.toast('✅ Cotización guardada correctamente', 'success');
    this.modoVista = 'lista';
    App.renderPage();
  },

  // ─── VER DETALLE ───
  ver(id) {
    const c   = DB.cotizaciones.find(x => x.id === id);
    const cli = DB.clientes.find(x => x.id === c.cliente_id);
    const estBg  = c.estado==='APROBADA'?'#dcfce7':c.estado==='RECHAZADA'?'#fee2e2':'#fef3c7';
    const estClr = c.estado==='APROBADA'?'#16a34a':c.estado==='RECHAZADA'?'#dc2626':'#d97706';
    App.showModal(`Cotización ${c.numero}`, `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <div style="font-size:18px;font-weight:900;">${c.numero}</div>
          <div style="font-size:12px;color:var(--gray-500);">Fecha: ${c.fecha} · Vence: ${c.vencimiento}</div>
        </div>
        <span style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:800;background:${estBg};color:${estClr};">${c.estado}</span>
      </div>
      <div style="background:var(--gray-50);padding:12px;border-radius:8px;margin-bottom:14px;">
        <div style="font-weight:700;">${cli?.nombre || 'N/A'}</div>
        <div style="font-size:12px;color:var(--gray-500);">${cli?.tipo}: ${cli?.doc}</div>
      </div>
      <table class="data-table">
        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
        <tbody>${c.items.map(i => `
          <tr>
            <td style="font-weight:700;">${i.nombre}</td>
            <td style="text-align:center;">${i.qty}</td>
            <td>S/ ${i.precio.toFixed(2)}</td>
            <td><strong>S/ ${i.total.toFixed(2)}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:14px;">
        <div style="padding:14px 20px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:10px;color:white;">
          <span style="font-size:18px;font-weight:900;">TOTAL: S/ ${c.total.toFixed(2)}</span>
        </div>
      </div>
      ${c.notas ? `<div style="margin-top:12px;padding:10px;background:var(--gray-50);border-radius:8px;font-size:13px;color:var(--gray-600);"><i class="fas fa-sticky-note" style="margin-right:5px;"></i>${c.notas}</div>` : ''}
    `, [
      { text:'🖨️ Imprimir', cls:'btn-primary', cb: () => { this.imprimir(id); App.closeModal(); } },
      { text:'📱 WhatsApp', cls:'btn-outline', cb: () => { this.whatsapp(id); App.closeModal(); } },
    ]);
    document.getElementById('modalBox').style.maxWidth = '580px';
  },

  // ─── IMPRIMIR ───
  imprimir(id) {
    const c   = DB.cotizaciones.find(x => x.id === id);
    const cli = DB.clientes.find(x => x.id === c.cliente_id);
    const w   = window.open('', '_blank', 'width=600,height=750');
    if (!w) { App.toast('Activa ventanas emergentes', 'warning'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${c.numero}</title>
    <style>body{font-family:Arial;font-size:13px;padding:24px;max-width:600px;margin:0 auto;}
    .c{text-align:center;}.b{font-weight:bold;}h2{color:#1e3a5f;}
    table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;}
    th{background:#1e3a5f;color:white;}.r{text-align:right;}
    .total-row{background:#f0f7ff;font-size:16px;}</style></head><body>
    <div class="c b" style="font-size:18px;">${DB.empresa.nombre}</div>
    <div class="c">RUC: ${DB.empresa.ruc}</div>
    <div class="c" style="font-size:11px;">${DB.empresa.direccion}</div>
    <hr/>
    <h2 class="c">COTIZACIÓN / PROFORMA</h2>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
      <div><b>N°:</b> ${c.numero}<br/><b>Fecha:</b> ${c.fecha}<br/><b>Válida hasta:</b> ${c.vencimiento}</div>
      <div><b>Cliente:</b> ${cli?.nombre}<br/><b>${cli?.tipo}:</b> ${cli?.doc}</div>
    </div>
    <table>
      <tr><th style="text-align:left;">Producto</th><th>Cant.</th><th>P.Unit</th><th>Total</th></tr>
      ${c.items.map(i => `<tr><td>${i.nombre}</td><td class="r">${i.qty}</td><td class="r">S/ ${i.precio.toFixed(2)}</td><td class="r">S/ ${i.total.toFixed(2)}</td></tr>`).join('')}
      <tr class="total-row"><td colspan="3" class="r"><b>TOTAL</b></td><td class="r"><b>S/ ${c.total.toFixed(2)}</b></td></tr>
    </table>
    ${c.notas ? `<p><b>Notas:</b> ${c.notas}</p>` : ''}
    <hr/>
    <div class="c" style="color:#666;font-size:12px;">Cotización válida hasta ${c.vencimiento} — ${DB.empresa.nombre}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  },

  // ─── WHATSAPP ───
  whatsapp(id) {
    const c    = DB.cotizaciones.find(x => x.id === id);
    const cli  = DB.clientes.find(x => x.id === c.cliente_id);
    const items = c.items.map(i => `• ${i.nombre} x${i.qty} = S/ ${i.total.toFixed(2)}`).join('\n');
    const msg  = encodeURIComponent(
      `Estimado/a ${cli?.nombre},\n\nLe presentamos nuestra cotización ${c.numero}:\n\n${items}\n\n*TOTAL: S/ ${c.total.toFixed(2)}*\n\nVálida hasta: ${c.vencimiento}\n\n${DB.empresa.nombre} — RUC: ${DB.empresa.ruc}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  },

  // ─── CAMBIAR ESTADO ───
  cambiarEstado(id, estado) {
    const i = DB.cotizaciones.findIndex(x => x.id === id);
    if (i >= 0) DB.cotizaciones[i].estado = estado;
    Storage.guardarCotizaciones();
    App.toast('Cotización ' + estado.toLowerCase(), 'success');
    App.renderPage();
  },

  // ─── CONVERTIR A VENTA ───
  convertirVenta(id) {
    const c = DB.cotizaciones.find(x => x.id === id);
    if (!c) return;
    VentasModule.currentItems      = c.items.map(i => ({ ...i, prod_id: i.prod_id || 0 }));
    VentasModule.selectedCliente   = DB.clientes.find(x => x.id === c.cliente_id);
    VentasModule.tipoComprobante   = 'BOLETA DE VENTA ELECTRONICA';
    VentasModule.serieActual       = 'BV03';
    VentasModule.modoVista         = 'comprobante';
    const ci = DB.cotizaciones.findIndex(x => x.id === id);
    DB.cotizaciones[ci].estado = 'CONVERTIDA';
    Storage.guardarCotizaciones();
    App.toast('Cotización convertida a venta', 'success');
    App.navigate('ventas');
  },

  exportar() { App.toast('Exportando cotizaciones...', 'info'); }
};

// ============================================================
// MÓDULO: NOTAS DE CRÉDITO / DÉBITO
// ============================================================

if (!DB.notasCredito) DB.notasCredito = [];

const NotasCreditoModule = {
  render() {
    App.setTabs2('Notas de Crédito / Débito', 'VENTAS');
    return `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-file-invoice" style="color:var(--accent);margin-right:8px;"></i>Notas de Crédito / Débito</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="NotasCreditoModule.nueva()"><i class="fas fa-plus"></i> Nueva Nota</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
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
              ${DB.notasCredito.length === 0 ?
                '<tr><td colspan="9"><div class="empty-state"><i class="fas fa-file-invoice"></i><p>Sin notas emitidas</p></div></td></tr>' :
                DB.notasCredito.map(n => {
                  const cli = DB.clientes.find(x => x.id === n.cliente_id);
                  const bg  = n.tipo==='CREDITO'?'#f0fdf4':'#fef2f2';
                  const clr = n.tipo==='CREDITO'?'#16a34a':'#dc2626';
                  return `<tr>
                    <td><span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800;background:${bg};color:${clr};">${n.tipo}</span></td>
                    <td><strong>${n.numero}</strong></td>
                    <td class="text-sm">${n.fecha}</td>
                    <td class="text-sm" style="color:var(--accent);">${n.venta_ref}</td>
                    <td style="font-size:13px;">${cli?.nombre || 'N/A'}</td>
                    <td class="text-sm">${n.motivo}</td>
                    <td><strong>S/ ${n.monto.toFixed(2)}</strong></td>
                    <td><span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800;background:#dcfce7;color:#16a34a;">EMITIDA</span></td>
                    <td><button class="btn btn-outline btn-sm" onclick="NotasCreditoModule.imprimir(${n.id})"><i class="fas fa-print"></i></button></td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  nueva() {
    App.showModal('Nueva Nota de Crédito / Débito', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipo *</label>
          <select class="form-control" id="nc_tipo">
            <option value="CREDITO">NOTA DE CRÉDITO</option>
            <option value="DEBITO">NOTA DE DÉBITO</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comprobante de Referencia</label>
          <select class="form-control" id="nc_ref">
            ${DB.ventas.map(v => `<option value="${v.serie}-${v.numero}">${v.serie}-${v.numero}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Cliente *</label>
          <select class="form-control" id="nc_cli">
            ${DB.clientes.filter(c => c.tipo_cliente === 'cliente').map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Motivo *</label>
          <select class="form-control" id="nc_motivo">
            <option>ANULACION</option><option>DEVOLUCION</option><option>DESCUENTO</option>
            <option>AJUSTE DE PRECIO</option><option>ERROR EN COMPROBANTE</option><option>DIFERENCIA DE CAMBIO</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Monto (S/) *</label>
          <input class="form-control" id="nc_monto" type="number" step="0.01" min="0.01" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-control" id="nc_fecha" type="date" value="${new Date().toISOString().split('T')[0]}"/>
        </div>
      </div>`,
      [{ text:'Emitir Nota', cls:'btn-primary', cb: () => {
        const tipo  = document.getElementById('nc_tipo')?.value;
        const monto = parseFloat(document.getElementById('nc_monto')?.value) || 0;
        if (!monto) { App.toast('Ingrese monto', 'error'); return; }
        const seq    = DB.notasCredito.length + 1;
        const prefix = tipo === 'CREDITO' ? 'NC01' : 'ND01';
        DB.notasCredito.push({
          id: Date.now(), tipo,
          numero: `${prefix}-${String(seq).padStart(3,'0')}`,
          fecha:      document.getElementById('nc_fecha')?.value,
          venta_ref:  document.getElementById('nc_ref')?.value || '',
          cliente_id: parseInt(document.getElementById('nc_cli')?.value),
          motivo:     document.getElementById('nc_motivo')?.value,
          monto, estado: 'EMITIDA'
        });
        Storage.guardarNotasCredito();
        App.toast(`Nota de ${tipo.toLowerCase()} emitida`, 'success');
        App.closeModal(); App.renderPage();
      }}]
    );
  },

  imprimir(id) { App.toast('Imprimiendo nota...', 'info'); }
};
