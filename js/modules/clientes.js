// ============================================================
// MÓDULO: CLIENTES / PROVEEDORES
// ============================================================

const ClientesModule = {
  currentFilter: 'cliente',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,

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

  formHTML(c) {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipo Documento <span class="required">*</span></label>
          <select class="form-control" id="f_tipo">
            <option value="DNI" ${c.tipo==='DNI'?'selected':''}>DNI</option>
            <option value="RUC" ${c.tipo==='RUC'?'selected':''}>RUC</option>
            <option value="CE" ${c.tipo==='CE'?'selected':''}>CE</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">N° Documento <span class="required">*</span></label>
          <input class="form-control" id="f_doc" type="text" placeholder="Ej: 12345678" value="${c.doc||''}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre / Razón Social <span class="required">*</span></label>
          <input class="form-control" id="f_nombre" type="text" placeholder="Nombre completo" value="${c.nombre||''}"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Dirección</label>
          <input class="form-control" id="f_direccion" type="text" placeholder="Dirección" value="${c.direccion||''}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-control" id="f_telefono" type="text" placeholder="062-123456" value="${c.telefono||''}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" id="f_email" type="email" placeholder="correo@email.com" value="${c.email||''}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-control" id="f_tipo_cliente">
            <option value="cliente" ${(c.tipo_cliente||'cliente')==='cliente'?'selected':''}>Cliente</option>
            <option value="proveedor" ${c.tipo_cliente==='proveedor'?'selected':''}>Proveedor</option>
          </select>
        </div>
      </div>
    `;
  },

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
