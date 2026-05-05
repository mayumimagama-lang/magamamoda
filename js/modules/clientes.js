// ============================================================
// MÓDULO: CLIENTES / PROVEEDORES
// ============================================================

const ClientesModule = {
  currentFilter: 'cliente',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,

  // ── API KEY peruapi.com ──
  _API_KEY: '93d2a2c57c97b46ca1a42e85ad46fe50',

  render() {
    const tabs = [
      { id: 'clientes', label: 'Clientes', page: 'clientes' },
      { id: 'clientes-proveedores', label: 'Clientes-Proveedores', page: 'clientes' }
    ];
    App.setTabs(tabs, 'clientes');
    App.setTabs2('Clientes', 'CLIENTES-PROVEEDORES');

    const filtered = this.getFiltered();
    const paged = this.getPaged(filtered);

    return `
      <div class="page-header">
        <h2 class="page-title">Listado de Clientes</h2>
        <div class="page-actions">
          <button class="btn btn-outline" onclick="ClientesModule.exportar()"><i class="fas fa-cloud-download-alt"></i> Exportar</button>
          <button class="btn btn-primary" onclick="ClientesModule.nuevo()"><i class="fas fa-plus"></i> Nuevo</button>
          <button class="btn btn-info" onclick="ClientesModule.buscar()"><i class="fas fa-search"></i> Buscar</button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding-bottom:0;">
          <!-- Tabs -->
          <div class="tabs-nav mb-4">
            <button class="tab-btn ${this.currentFilter==='cliente'?'active':''}" onclick="ClientesModule.setFilter('cliente')">
              Clientes <span class="tab-count">${DB.clientes.filter(c=>c.tipo_cliente==='cliente').length}</span>
            </button>
            <button class="tab-btn ${this.currentFilter==='proveedor'?'active':''}" onclick="ClientesModule.setFilter('proveedor')">
              Proveedores <span class="tab-count">${DB.clientes.filter(c=>c.tipo_cliente==='proveedor').length}</span>
            </button>
            <button class="tab-btn ${this.currentFilter==='todos'?'active':''}" onclick="ClientesModule.setFilter('todos')">
              Todos <span class="tab-count">${DB.clientes.length}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="flex-between mb-3">
            <div class="search-bar">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Buscar cliente..." value="${this.searchTerm}"
                oninput="ClientesModule.search(this.value)" id="clienteSearch"/>
            </div>
            <span class="text-sm text-muted">Registros por página:
              <select class="filter-select" onchange="ClientesModule.setPerPage(this.value)" style="width:70px;margin-left:4px;">
                <option value="10" ${this.itemsPerPage==10?'selected':''}>10</option>
                <option value="25" ${this.itemsPerPage==25?'selected':''}>25</option>
                <option value="50" ${this.itemsPerPage==50?'selected':''}>50</option>
              </select>
            </span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${paged.length === 0 ? `<tr><td colspan="3"><div class="empty-state"><i class="fas fa-users"></i><p>No se encontraron clientes</p></div></td></tr>` :
                paged.map(c => `
                <tr>
                  <td>
                    <div class="td-name"><i class="fas fa-user" style="color:var(--gray-400);margin-right:6px;"></i>${c.nombre}</div>
                    <div class="td-sub"><i class="fas fa-id-card" style="font-size:10px;"></i> ${c.tipo}: ${c.doc}</div>
                  </td>
                  <td><span class="text-muted text-sm">${c.direccion}</span></td>
                  <td>
                    <div class="action-menu-wrapper">
                      <button class="action-menu-btn" onclick="ClientesModule.toggleMenu(${c.id})">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <div class="action-menu hidden" id="menu-cliente-${c.id}">
                        <button class="action-menu-item" onclick="ClientesModule.ver(${c.id})">
                          <i class="fas fa-eye"></i> Ver detalle
                        </button>
                        <button class="action-menu-item" onclick="ClientesModule.editar(${c.id})">
                          <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="action-menu-item danger" onclick="ClientesModule.eliminar(${c.id})">
                          <i class="fas fa-trash"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="text-sm text-muted">Página ${this.currentPage} de ${Math.ceil(filtered.length/this.itemsPerPage)} — ${filtered.length} registros</span>
          <button class="pagination-btn" onclick="ClientesModule.prevPage()"><i class="fas fa-chevron-left"></i></button>
          ${this.renderPageNums(filtered.length)}
          <button class="pagination-btn" onclick="ClientesModule.nextPage(filtered_len)"><i class="fas fa-chevron-right"></i></button>
        </div>
      </div>
    `;
  },

  renderPageNums(total) {
    const pages = Math.ceil(total / this.itemsPerPage);
    let html = '';
    for (let i = 1; i <= Math.min(pages, 5); i++) {
      html += `<button class="pagination-btn ${i===this.currentPage?'active':''}" onclick="ClientesModule.goPage(${i})">${i}</button>`;
    }
    return html;
  },

  getFiltered() {
    return DB.clientes.filter(c => {
      const matchFilter = this.currentFilter === 'todos' || c.tipo_cliente === this.currentFilter;
      const matchSearch = !this.searchTerm ||
        c.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.doc.includes(this.searchTerm);
      return matchFilter && matchSearch;
    });
  },

  getPaged(filtered) {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  },

  setFilter(f) { this.currentFilter = f; this.currentPage = 1; App.renderPage(); },
  search(v) { this.searchTerm = v; this.currentPage = 1; App.renderPage(); },
  setPerPage(v) { this.itemsPerPage = parseInt(v); this.currentPage = 1; App.renderPage(); },
  prevPage() { if (this.currentPage > 1) { this.currentPage--; App.renderPage(); } },
  nextPage() {
    const max = Math.ceil(this.getFiltered().length / this.itemsPerPage);
    if (this.currentPage < max) { this.currentPage++; App.renderPage(); }
  },
  goPage(p) { this.currentPage = p; App.renderPage(); },

  toggleMenu(id) {
    document.querySelectorAll('.action-menu').forEach(m => {
      if (m.id !== `menu-cliente-${id}`) m.classList.add('hidden');
    });
    document.getElementById(`menu-cliente-${id}`)?.classList.toggle('hidden');
  },

  ver(id) {
    const c = DB.clientes.find(x => x.id === id);
    if (!c) return;
    App.showModal('Detalle de Cliente', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipo Documento</label>
          <div class="form-control" style="background:var(--gray-50);color:var(--gray-700);">${c.tipo}</div>
        </div>
        <div class="form-group">
          <label class="form-label">N° Documento</label>
          <div class="form-control" style="background:var(--gray-50);color:var(--gray-700);">${c.doc}</div>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre / Razón Social</label>
          <div class="form-control" style="background:var(--gray-50);color:var(--gray-700);">${c.nombre}</div>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Dirección</label>
          <div class="form-control" style="background:var(--gray-50);color:var(--gray-700);">${c.direccion}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <div class="form-control" style="background:var(--gray-50);color:var(--gray-700);">${c.telefono || '-'}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <div class="form-control" style="background:var(--gray-50);color:var(--gray-700);">${c.email || '-'}</div>
        </div>
      </div>
    `, [{ text:'Editar', cls:'btn-primary', cb: () => { App.closeModal(); this.editar(id); } }]);
  },

  nuevo() {
    App.showModal('Nuevo Cliente', this.formHTML({}), [
      { text: 'Guardar', cls: 'btn-primary', cb: () => this.guardar() }
    ]);
  },

  editar(id) {
    const c = DB.clientes.find(x => x.id === id);
    App.showModal('Editar Cliente', this.formHTML(c || {}), [
      { text: 'Guardar', cls: 'btn-primary', cb: () => this.guardar(id) }
    ]);
  },

  // ============================================================
  // FORMULARIO CON BÚSQUEDA DNI/RUC — peruapi.com
  // ============================================================
  formHTML(c) {
    return `
      <div class="form-grid">

        <!-- Tipo Documento -->
        <div class="form-group">
          <label class="form-label">Tipo Documento <span class="required">*</span></label>
          <select class="form-control" id="f_tipo" onchange="ClientesModule._onTipoChange()">
            <option value="DNI" ${c.tipo==='DNI'?'selected':''}>DNI</option>
            <option value="RUC" ${c.tipo==='RUC'?'selected':''}>RUC</option>
            <option value="CE"  ${c.tipo==='CE' ?'selected':''}>CE</option>
          </select>
        </div>

        <!-- N° Documento + Botón buscar -->
        <div class="form-group">
          <label class="form-label">N° Documento <span class="required">*</span></label>
          <div style="display:flex;gap:6px;">
            <input class="form-control" id="f_doc" type="text"
              placeholder="Ej: 12345678" value="${c.doc||''}"
              oninput="ClientesModule._onDocInput(this.value)"
              style="flex:1;"/>
            <button id="btn_buscar_doc" onclick="ClientesModule._consultarAPI()"
              style="padding:0 14px;background:linear-gradient(135deg,#0096ff,#0077cc);border:none;border-radius:8px;color:white;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-search"></i> Buscar
            </button>
          </div>
          <div style="font-size:10px;color:var(--gray-400);margin-top:4px;">
            <i class="fas fa-magic" style="color:#0096ff;"></i>
            Auto-búsqueda al escribir 8 dígitos (DNI) o 11 (RUC)
          </div>
        </div>

        <!-- Resultado de búsqueda API -->
        <div id="resultado_api" style="grid-column:1/-1;display:none;"></div>

        <!-- Nombre -->
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre / Razón Social <span class="required">*</span></label>
          <input class="form-control" id="f_nombre" type="text"
            placeholder="Se autocompleta o ingresa manualmente"
            value="${c.nombre||''}"/>
        </div>

        <!-- Dirección -->
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Dirección</label>
          <input class="form-control" id="f_direccion" type="text"
            placeholder="Se autocompleta con RUC o ingresa manualmente"
            value="${c.direccion||''}"/>
        </div>

        <!-- Teléfono y Email -->
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-control" id="f_telefono" type="text"
            placeholder="062-123456" value="${c.telefono||''}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" id="f_email" type="email"
            placeholder="correo@email.com" value="${c.email||''}"/>
        </div>

        <!-- Tipo cliente -->
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-control" id="f_tipo_cliente">
            <option value="cliente"   ${(c.tipo_cliente||'cliente')==='cliente'  ?'selected':''}>Cliente</option>
            <option value="proveedor" ${c.tipo_cliente==='proveedor'             ?'selected':''}>Proveedor</option>
          </select>
        </div>

      </div>
    `;
  },

  // ── Detecta dígitos y activa auto-búsqueda ──
  _onDocInput(val) {
    const tipo = document.getElementById('f_tipo')?.value;
    const len  = val.replace(/\D/g, '').length;
    if ((tipo === 'DNI' && len === 8) || (tipo === 'RUC' && len === 11)) {
      this._consultarAPI();
    }
  },

  // ── Actualiza placeholder según tipo ──
  _onTipoChange() {
    const tipo = document.getElementById('f_tipo')?.value;
    const docInput = document.getElementById('f_doc');
    if (docInput) {
      docInput.placeholder = tipo === 'RUC' ? 'Ej: 20601234567 (11 dígitos)' :
                             tipo === 'DNI' ? 'Ej: 45678912 (8 dígitos)' : 'N° documento';
      docInput.value = '';
    }
    // Limpiar resultado anterior
    const res = document.getElementById('resultado_api');
    if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  },

  // ── Consulta a peruapi.com ──
  async _consultarAPI() {
    const tipo = document.getElementById('f_tipo')?.value;
    const doc  = document.getElementById('f_doc')?.value?.trim();
    const btn  = document.getElementById('btn_buscar_doc');
    const res  = document.getElementById('resultado_api');

    if (!doc) { App.toast('Ingresa un número de documento', 'warning'); return; }
    if (tipo === 'DNI' && doc.length !== 8)  { App.toast('El DNI debe tener 8 dígitos', 'error'); return; }
    if (tipo === 'RUC' && doc.length !== 11) { App.toast('El RUC debe tener 11 dígitos', 'error'); return; }

    // 1° Buscar en DB local primero (sin consumir API)
    const local = DB.clientes.find(function(c) { return c.doc === doc; });
    if (local) {
      document.getElementById('f_nombre')?.setAttribute('value', local.nombre);
      document.getElementById('f_nombre').value = local.nombre;
      document.getElementById('f_direccion').value = local.direccion || '';
      if (res) {
        res.style.display = 'block';
        res.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.3);border-radius:10px;">
            <i class="fas fa-database" style="color:#16a34a;font-size:18px;"></i>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--gray-900);">${local.nombre}</div>
              <div style="font-size:11px;color:#16a34a;font-weight:600;">✅ Encontrado en tu base de datos local</div>
            </div>
          </div>`;
      }
      return;
    }

    // 2° Si no está local → consultar peruapi.com
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
      btn.disabled = true;
    }
    if (res) {
      res.style.display = 'block';
      res.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(0,150,255,0.06);border:1px solid rgba(0,150,255,0.2);border-radius:10px;">
          <i class="fas fa-spinner fa-spin" style="color:#0096ff;"></i>
          <span style="font-size:13px;color:var(--gray-600);">Consultando SUNAT / RENIEC...</span>
        </div>`;
    }

    try {
      const endpoint = tipo === 'RUC'
        ? `https://peruapi.com/api/ruc/${doc}?api_token=${this._API_KEY}`
        : `https://peruapi.com/api/dni/${doc}?api_token=${this._API_KEY}`;

      var PROXY = 'https://script.google.com/macros/s/AKfycbzopc9-UZI3fNvav1c1_Tar52kRy_gom7grN5-q4MdlTOQ6SSvD_BH2CSmTmgW1j_EfXg/exec';
      const response = await fetch(PROXY + '?accion=' + (tipo==='RUC'?'ruc':'dni') + '&tipo=' + (tipo==='RUC'?'ruc':'dni') + '&doc=' + doc);
      const data = await response.json();

      if (data.code === '200' || data.code === 200) {
        // Extraer datos según tipo
        var nombre    = '';
        var direccion = '';

        if (tipo === 'RUC') {
          nombre    = data.razon_social || '';
          direccion = data.direccion    || '';
        } else {
          nombre = data.cliente || (data.nombres + ' ' + data.apellido_paterno + ' ' + data.apellido_materno).trim();
        }

        // Autocompletar campos
        document.getElementById('f_nombre').value    = nombre;
        document.getElementById('f_direccion').value = direccion;

        // Mostrar resultado exitoso
        if (res) {
          res.innerHTML = `
            <div style="background:linear-gradient(135deg,rgba(0,150,255,0.05),rgba(0,150,255,0.02));border:1.5px solid rgba(0,150,255,0.3);border-radius:12px;padding:14px 16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 6px rgba(22,163,74,0.6);"></div>
                <span style="font-size:10px;font-weight:800;color:#16a34a;letter-spacing:1.5px;">DATOS ENCONTRADOS — SUNAT/RENIEC</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <div style="font-size:10px;color:var(--gray-500);font-weight:700;text-transform:uppercase;margin-bottom:3px;">${tipo}</div>
                  <div style="font-size:14px;font-weight:800;color:#0096ff;">${doc}</div>
                </div>
                <div>
                  <div style="font-size:10px;color:var(--gray-500);font-weight:700;text-transform:uppercase;margin-bottom:3px;">Nombre / Razón Social</div>
                  <div style="font-size:13px;font-weight:700;color:var(--gray-900);">${nombre}</div>
                </div>
                ${tipo === 'RUC' && data.estado ? `
                <div>
                  <div style="font-size:10px;color:var(--gray-500);font-weight:700;text-transform:uppercase;margin-bottom:3px;">Estado SUNAT</div>
                  <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${data.estado==='ACTIVO'?'#dcfce7':'#fee2e2'};color:${data.estado==='ACTIVO'?'#16a34a':'#dc2626'};">${data.estado}</span>
                </div>
                <div>
                  <div style="font-size:10px;color:var(--gray-500);font-weight:700;text-transform:uppercase;margin-bottom:3px;">Condición</div>
                  <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${data.condicion==='HABIDO'?'#dcfce7':'#fee2e2'};color:${data.condicion==='HABIDO'?'#16a34a':'#dc2626'};">${data.condicion||'-'}</span>
                </div>` : ''}
                ${direccion ? `
                <div style="grid-column:1/-1">
                  <div style="font-size:10px;color:var(--gray-500);font-weight:700;text-transform:uppercase;margin-bottom:3px;">Dirección</div>
                  <div style="font-size:12px;color:var(--gray-700);">${direccion}</div>
                </div>` : ''}
              </div>
              <div style="margin-top:10px;font-size:10px;color:var(--gray-400);display:flex;align-items:center;gap:4px;">
                <i class="fas fa-info-circle"></i>
                Los campos se han autocompletado. Puedes editarlos si necesitas.
              </div>
            </div>`;
        }

        App.toast('✅ Datos encontrados y autocompletados', 'success');

      } else {
        if (res) {
          res.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:10px;">
              <i class="fas fa-exclamation-circle" style="color:#dc2626;font-size:18px;"></i>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--gray-900);">No se encontraron datos</div>
                <div style="font-size:11px;color:var(--gray-500);">Verifica el número o ingresa los datos manualmente</div>
              </div>
            </div>`;
        }
        App.toast('No se encontraron datos para ese ' + tipo, 'warning');
      }

    } catch(e) {
      if (res) {
        res.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:10px;">
            <i class="fas fa-wifi" style="color:#dc2626;font-size:18px;"></i>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--gray-900);">Error de conexión</div>
              <div style="font-size:11px;color:var(--gray-500);">Verifica tu internet e intenta nuevamente</div>
            </div>
          </div>`;
      }
      App.toast('Error al consultar la API. Verifica tu conexión.', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = '<i class="fas fa-search"></i> Buscar';
        btn.disabled = false;
      }
    }
  },

  // ============================================================
  guardar(id) {
    const tipo = document.getElementById('f_tipo')?.value;
    const doc = document.getElementById('f_doc')?.value?.trim();
    const nombre = document.getElementById('f_nombre')?.value?.trim();
    if (!doc || !nombre) { App.toast('Complete los campos obligatorios', 'error'); return; }

    const data = {
      tipo, doc, nombre,
      direccion: document.getElementById('f_direccion')?.value || '-/-/-',
      telefono: document.getElementById('f_telefono')?.value || '',
      email: document.getElementById('f_email')?.value || '',
      tipo_cliente: document.getElementById('f_tipo_cliente')?.value || 'cliente'
    };

    if (id) {
      const i = DB.clientes.findIndex(x => x.id === id);
      if (i >= 0) DB.clientes[i] = { ...DB.clientes[i], ...data };
      App.toast('Cliente actualizado correctamente', 'success');
    } else {
      const newId = Math.max(...DB.clientes.map(x => x.id)) + 1;
      DB.clientes.push({ id: newId, ...data });
      App.toast('Cliente registrado correctamente', 'success');
    }
    App.closeModal();
    App.renderPage();
  },

  eliminar(id) {
    const c = DB.clientes.find(x => x.id === id);
    if (confirm(`¿Eliminar a "${c?.nombre}"?`)) {
      const i = DB.clientes.findIndex(x => x.id === id);
      if (i >= 0) DB.clientes.splice(i, 1);
      App.toast('Cliente eliminado', 'warning');
      App.renderPage();
    }
  },

  exportar() { App.toast('Exportando clientes...', 'info'); },
  buscar()   { document.getElementById('clienteSearch')?.focus(); }
};
