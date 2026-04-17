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
    const subtotal = total / 1.18;
    const igv      = total - subtotal;
    const self     = this;
    const hoy      = new Date().toISOString().split('T')[0];
    const venc     = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    const numero   = 'COT-' + String(DB._cotSeq).padStart(3,'0');

    // Productos recientes
    const productosRecientes = (function() {
      const usados = {};
      DB.cotizaciones.slice(0,10).forEach(c => c.items.forEach(it => { usados[it.prod_id] = true; }));
      let recientes = DB.productos.filter(p => usados[p.id]).slice(0,8);
      if (recientes.length < 4) {
        DB.productos.forEach(p => { if (!usados[p.id] && recientes.length < 8) recientes.push(p); });
      }
      return recientes;
    })();

    // Area central de items/busqueda
    let itemsArea = '';
    if (this._searchResults && this._searchResults.length > 0) {
      itemsArea = `
        <div style="padding:10px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:12px;font-weight:800;color:var(--gray-500);">
              <i class="fas fa-search" style="margin-right:5px;color:var(--accent);"></i>
              ${this._searchResults.length} resultados encontrados
            </span>
            <button onclick="CotizacionesModule._searchResults=null;App.renderPage();"
              style="background:var(--gray-100);color:var(--gray-600);border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">
              <i class="fas fa-times"></i> Cerrar
            </button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
            ${this._searchResults.map(p => {
              const sClr = p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
              return `<div onclick="CotizacionesModule._agregarProd(${p.id})"
                style="display:flex;gap:10px;align-items:center;padding:10px;border-radius:10px;
                border:1.5px solid var(--gray-200);background:white;cursor:pointer;
                box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                <div style="width:56px;height:56px;border-radius:8px;background:var(--gray-100);
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <i class="fas fa-image" style="font-size:18px;color:var(--gray-300);"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.nombre}</div>
                  <div style="font-size:11px;color:var(--gray-400);">${p.codigo} · ${p.unidad}</div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="font-size:15px;font-weight:900;color:var(--accent);">S/ ${p.precio_venta.toFixed(2)}</span>
                    <span style="font-size:11px;font-weight:700;color:${sClr};">${p.stock===0?'Sin stock':'✓ '+p.stock}</span>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
          ${this.currentItems.length > 0 ? `
            <div style="border-top:1px solid var(--gray-200);margin-top:12px;padding-top:12px;">
              <div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">EN LA COTIZACIÓN</div>
              ${this._renderItemsList()}
            </div>` : ''}
        </div>`;
    } else if (this._searchResults && this._searchResults.length === 0) {
      itemsArea = `
        <div style="text-align:center;padding:40px;color:var(--gray-400);">
          <i class="fas fa-search" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.3;"></i>
          <p style="font-size:14px;font-weight:700;">Sin resultados</p>
          <button onclick="CotizacionesModule._searchResults=null;App.renderPage();"
            style="margin-top:10px;background:var(--gray-100);color:var(--gray-600);border:none;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;">
            Limpiar búsqueda
          </button>
        </div>`;
    } else if (this.currentItems.length > 0) {
      itemsArea = `<div style="padding:8px 12px;">${this._renderItemsList()}</div>`;
    } else {
      const prodsDisp = productosRecientes.length > 0 ? productosRecientes : DB.productos.slice(0, 8);
      itemsArea = prodsDisp.length === 0 ?
        `<div style="text-align:center;padding:40px;color:var(--gray-400);">
          <i class="fas fa-box-open" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.2;"></i>
          <div style="font-size:14px;font-weight:700;">Usa el buscador de abajo para agregar productos</div>
        </div>` :
        `<div style="padding:14px 16px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
            <i class="fas fa-star" style="color:#f59e0b;font-size:14px;"></i>
            <span style="font-size:12px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;">Productos Disponibles</span>
            <span style="font-size:11px;color:var(--gray-400);margin-left:4px;">— Clic para agregar</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
            ${prodsDisp.map(p => {
              const sClr = p.stock===0?'#dc2626':p.stock<=10?'#d97706':'#16a34a';
              const sTxt = p.stock===0?'Sin stock':'Stock: '+p.stock;
              return `<div onclick="${p.stock>0?'CotizacionesModule._agregarProd('+p.id+')':''}"
                style="display:flex;flex-direction:column;align-items:center;text-align:center;
                padding:14px 10px;border-radius:12px;border:2px solid var(--gray-200);
                background:white;cursor:${p.stock>0?'pointer':'not-allowed'};
                transition:all 0.15s;${p.stock===0?'opacity:0.5;':''}
                ${p.stock>0?'box-shadow:0 2px 8px rgba(0,0,0,0.06);':''}"
                ${p.stock>0?'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 4px 16px rgba(37,99,235,0.2)\'"':''} 
                ${p.stock>0?'onmouseout="this.style.borderColor=\'var(--gray-200)\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.06)\'"':''}>
                <div style="width:70px;height:70px;border-radius:10px;background:var(--gray-100);
                  display:flex;align-items:center;justify-content:center;margin-bottom:8px;
                  border:2px dashed var(--gray-300);">
                  ${p.imagen_url ? `<img src="${p.imagen_url}" style="width:100%;height:100%;object-fit:cover;border-radius:9px;" alt=""/>` :
                  `<i class="fas fa-image" style="font-size:22px;color:var(--gray-300);"></i>`}
                </div>
                <div style="font-size:13px;font-weight:800;color:var(--gray-900);margin-bottom:4px;
                  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${p.nombre}</div>
                <div style="font-size:15px;font-weight:900;color:var(--accent);margin-bottom:3px;">S/ ${p.precio_venta.toFixed(2)}</div>
                <div style="font-size:11px;font-weight:700;color:${sClr};">${sTxt}</div>
                ${p.stock>0 ? `<div style="margin-top:8px;padding:5px 14px;background:var(--accent);color:white;
                  border-radius:6px;font-size:12px;font-weight:700;">
                  <i class="fas fa-plus" style="margin-right:4px;"></i>Agregar</div>` : ''}
              </div>`;
            }).join('')}
          </div>
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--gray-100);text-align:center;">
            <p style="font-size:12px;color:var(--gray-400);">
              <i class="fas fa-barcode" style="margin-right:5px;"></i>
              También puedes buscar por nombre o código abajo
            </p>
          </div>
        </div>`;
    }

    return `
    <!-- TOPBAR -->
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:13px 18px;background:var(--gray-50);border-radius:12px;
      border:1.5px solid var(--gray-200);margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <button onclick="CotizacionesModule.modoVista='lista';App.renderPage();"
          style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);
          border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;">
          <i class="fas fa-arrow-left" style="margin-right:6px;"></i>Regresar
        </button>
        <div>
          <div style="font-size:18px;font-weight:900;color:var(--gray-900);">Nueva Cotización</div>
          <div style="font-size:11px;color:var(--gray-400);">${numero} · ${hoy}</div>
        </div>
      </div>
      <button onclick="CotizacionesModule._guardar()"
        style="background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:none;
        border-radius:8px;padding:8px 26px;font-weight:900;cursor:pointer;font-size:15px;
        box-shadow:0 4px 12px rgba(22,163,74,0.3);">
        <i class="fas fa-save" style="margin-right:6px;"></i>GUARDAR
      </button>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- Datos del cliente -->
      <div class="card">
        <div style="padding:14px 20px;">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">N° COTIZACIÓN</div>
              <div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:15px;font-weight:900;color:var(--accent);">${numero}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">FECHA</div>
              <div style="padding:8px 12px;background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:8px;font-size:14px;font-weight:700;color:var(--gray-700);">${hoy}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">VÁLIDA HASTA</div>
              <input class="form-control" id="cot_venc" type="date" value="${venc}" style="font-size:13px;"/>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">NOTAS</div>
              <input class="form-control" id="cot_notas" placeholder="Condiciones..." style="font-size:13px;"/>
            </div>
          </div>
         <div style="margin-top:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--gray-500);text-transform:uppercase;margin-bottom:6px;">CLIENTE *</div>
            <div style="display:flex;gap:8px;">
              <input class="form-control" id="cot_cli_search" type="text"
                placeholder="Ingresa DNI/RUC y presiona Enter para buscar..."
                value="${this.clienteSeleccionado ? this.clienteSeleccionado.doc+' — '+this.clienteSeleccionado.nombre : ''}"
                onkeydown="CotizacionesModule._buscarCliente(event)"
                style="flex:1;font-size:14px;padding:10px 12px;"/>
              <button class="btn btn-outline" onclick="CotizacionesModule._abrirModalCliente()" style="padding:10px 14px;" title="Buscar cliente">
                <i class="fas fa-search"></i>
              </button>
              <button class="btn btn-success" onclick="CotizacionesModule._nuevoCliente()" style="padding:10px 14px;" title="Nuevo cliente">
                <i class="fas fa-user-plus"></i>
              </button>
            </div>
            ${this.clienteSeleccionado ? `
            <div style="margin-top:8px;padding:10px 14px;background:var(--gray-50);border-radius:8px;border:1.5px solid var(--gray-200);display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:700;font-size:14px;">${this.clienteSeleccionado.nombre}</div>
                <div style="font-size:12px;color:var(--gray-500);">${this.clienteSeleccionado.tipo}: ${this.clienteSeleccionado.doc}</div>
              </div>
              <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;background:#dcfce7;color:#16a34a;">✓ Seleccionado</span>
            </div>` : ''}
          </div>
        </div>
      </div>

      <!-- Productos -->
      <div class="card">
        <div style="padding:12px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;letter-spacing:1px;">
            <i class="fas fa-boxes" style="color:var(--accent);margin-right:5px;"></i>Productos / Servicios
            <span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:4px;">${this.currentItems.length}</span>
          </div>
        </div>
        <div style="min-height:360px;">${itemsArea}</div>

        <!-- Buscador -->
        <div style="padding:14px 20px;border-top:2px solid var(--gray-200);background:var(--gray-50);">
          <div style="font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px;">
            <i class="fas fa-search" style="margin-right:5px;"></i>Buscar Producto
          </div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;position:relative;">
              <i class="fas fa-barcode" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:17px;"></i>
              <input type="text" id="cotBuscador" placeholder="Nombre, código o escanea con lector de barras..."
                style="width:100%;padding:12px 12px 12px 42px;border:2px solid var(--gray-200);border-radius:10px;font-size:14px;background:white;outline:none;box-sizing:border-box;"
                oninput="CotizacionesModule._filtrarProds(this.value)"
                onkeydown="if(event.key==='Escape'){CotizacionesModule._searchResults=null;App.renderPage();}"/>
            </div>
            <button onclick="CotizacionesModule._filtrarProds(document.getElementById('cotBuscador')?.value||'')"
              style="padding:0 20px;background:var(--accent);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-size:13px;white-space:nowrap;">
              <i class="fas fa-search" style="margin-right:5px;"></i>Buscar
            </button>
          </div>
        </div>
      </div>

      <!-- Resumen y pago -->
      <div class="card">
        <div style="padding:20px;display:flex;justify-content:flex-end;">
          <div style="background:var(--gray-50);border:2px solid var(--gray-200);border-radius:14px;padding:22px;width:350px;">
            <div style="font-size:12px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:18px;">RESUMEN</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
              <span style="font-size:15px;color:var(--gray-500);font-weight:600;">Subtotal (sin IGV):</span>
              <span style="font-size:18px;font-weight:900;color:var(--gray-800);">S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:18px;padding-bottom:18px;border-bottom:2px solid var(--gray-200);">
              <span style="font-size:15px;color:var(--gray-500);font-weight:600;">IGV (18%):</span>
              <span style="font-size:18px;font-weight:900;color:var(--gray-800);">S/ ${igv.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;
              padding:16px 18px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;color:white;">
              <span style="font-size:20px;font-weight:900;">TOTAL</span>
              <span style="font-size:34px;font-weight:900;">S/ ${total.toFixed(2)}</span>
            </div>
            <button onclick="CotizacionesModule._guardar()"
              style="width:100%;margin-top:14px;padding:16px;background:linear-gradient(135deg,#15803d,#16a34a);
              color:white;border:none;border-radius:12px;font-size:17px;font-weight:900;cursor:pointer;
              box-shadow:0 4px 14px rgba(22,163,74,0.4);">
              <i class="fas fa-save" style="margin-right:8px;"></i>GUARDAR COTIZACIÓN
            </button>
          </div>
        </div>
      </div>

    </div>`;
  },

  _renderItemsList() {
    return this.currentItems.map((item, i) => `
      <div style="display:flex;align-items:center;gap:12px;background:white;
        border:1.5px solid var(--gray-200);border-radius:12px;
        padding:12px 14px;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);
          display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;flex-shrink:0;">${i+1}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:800;color:var(--gray-900);margin-bottom:2px;">${item.nombre}</div>
          <div style="font-size:11px;color:var(--gray-400);">Precio unitario: S/ ${item.precio.toFixed(2)}</div>
        </div>
        <div style="width:1px;height:50px;background:var(--gray-200);flex-shrink:0;"></div>
        <div style="text-align:center;flex-shrink:0;">
          <div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">CANTIDAD</div>
          <div style="display:flex;align-items:center;gap:4px;">
            <button onclick="CotizacionesModule._updQty(${i},${item.qty-1})"
              style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-weight:900;cursor:pointer;color:var(--gray-600);">−</button>
            <input type="number" min="1" value="${item.qty}" onchange="CotizacionesModule._updQty(${i},this.value)"
              style="width:48px;height:30px;border:1.5px solid var(--accent);border-radius:6px;text-align:center;font-weight:900;font-size:15px;color:var(--accent);"/>
            <button onclick="CotizacionesModule._updQty(${i},${item.qty+1})"
              style="width:30px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;background:var(--gray-50);font-weight:900;cursor:pointer;color:var(--gray-600);">+</button>
          </div>
        </div>
        <div style="width:1px;height:50px;background:var(--gray-200);flex-shrink:0;"></div>
        <div style="text-align:center;flex-shrink:0;min-width:90px;">
          <div style="font-size:9px;font-weight:700;color:var(--gray-400);text-transform:uppercase;margin-bottom:5px;">P. UNITARIO</div>
          <div style="display:flex;align-items:center;gap:3px;">
            <span style="font-size:12px;font-weight:700;color:var(--gray-400);">S/</span>
            <input type="number" min="0" step="0.01" value="${item.precio.toFixed(2)}"
              onchange="CotizacionesModule._updPrecio(${i},this.value)"
              style="width:70px;height:30px;border:1.5px solid var(--gray-200);border-radius:6px;padding:0 6px;font-size:14px;font-weight:800;color:var(--gray-800);text-align:center;"/>
          </div>
        </div>
        <div style="width:1px;height:50px;background:var(--gray-200);flex-shrink:0;"></div>
        <div style="text-align:center;flex-shrink:0;min-width:100px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:8px 10px;">
          <div style="font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">TOTAL</div>
          <div style="font-size:18px;font-weight:900;color:var(--accent);">S/ ${item.total.toFixed(2)}</div>
        </div>
        <button onclick="CotizacionesModule._remove(${i})"
          style="width:32px;height:32px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:7px;cursor:pointer;flex-shrink:0;">
          <i class="fas fa-trash"></i>
        </button>
      </div>`).join('');
  },

  _buscarCliente(event) {
    if (event.key !== 'Enter') return;
    const val   = event.target.value.trim();
    const found = DB.clientes.find(c => c.doc === val);
    if (found) {
      this.clienteSeleccionado = found;
      event.target.value = found.doc + ' — ' + found.nombre;
      App.toast('Cliente: ' + found.nombre, 'info');
      App.renderPage();
    } else {
      App.toast('No encontrado. Usa el botón buscar.', 'warning');
    }
  },

  _abrirModalCliente() {
    App.showModal('Seleccionar Cliente',
      `<div class="search-bar mb-3" style="width:100%;">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Buscar por nombre o documento..." autofocus
          oninput="CotizacionesModule._filtrarClientes(this.value)"/>
      </div>
      <div id="cotClienteResultados" style="max-height:360px;overflow-y:auto;">
        ${this._renderClientes(DB.clientes.filter(c => c.tipo_cliente==='cliente' || c.doc==='00000000'))}
      </div>`, []
    );
    document.getElementById('modalBox').style.maxWidth = '540px';
  },

  _renderClientes(clientes) {
    if (!clientes.length) return '<div class="empty-state"><i class="fas fa-user"></i><p>Sin resultados</p></div>';
    return '<table class="data-table"><thead><tr><th>Documento</th><th>Nombre</th><th></th></tr></thead><tbody>' +
      clientes.map(c => `<tr>
        <td class="text-sm">${c.tipo}: ${c.doc}</td>
        <td style="font-weight:700;">${c.nombre}</td>
        <td><button class="btn btn-primary btn-sm" onclick="CotizacionesModule._setCliente(${c.id})">Seleccionar</button></td>
      </tr>`).join('') +
    '</tbody></table>';
  },

  _filtrarClientes(term) {
    const found = DB.clientes.filter(c =>
      (c.tipo_cliente==='cliente' || c.doc==='00000000') && (
        c.nombre.toLowerCase().includes(term.toLowerCase()) || c.doc.includes(term))
    );
    const el = document.getElementById('cotClienteResultados');
    if (el) el.innerHTML = this._renderClientes(found);
  },

  _setCliente(id) {
    this.clienteSeleccionado = DB.clientes.find(x => x.id === id);
    App.closeModal();
    App.toast('Cliente: ' + this.clienteSeleccionado.nombre, 'info');
    App.renderPage();
  },

  _nuevoCliente() {
    App.navigate('clientes');
    App.toast('Registra el cliente y vuelve a cotizaciones', 'info');
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

  _updPrecio(idx, val) {
    const precio = Math.max(0, parseFloat(val) || 0);
    this.currentItems[idx].precio = precio;
    this.currentItems[idx].total  = this.currentItems[idx].qty * precio;
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
      cliente_id: this.clienteSeleccionado?.id || 0,
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
