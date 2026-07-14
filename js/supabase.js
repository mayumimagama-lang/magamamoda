// ============================================================
// SUPABASE — Conexión con la base de datos en la nube
// ============================================================

const SUPABASE_URL = 'https://eandhzmzotmundjsbpng.supabase.co';
const SUPABASE_KEY = 'sb_publishable_c53ZhfK5P2nGYlP5JP8Mow_IGciQWui';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// PRODUCTOS
// ============================================================
const SupabaseDB = {

  // Cargar todos los productos
  async cargarProductos() {
    try {
      const { data, error } = await db.from('productos').select('*').eq('activo', true);
      if (error) throw error;
      DB.productos = data.map(p => ({
        id:               p.id,
        codigo:           p.codigo        || '',
        nombre:           p.nombre        || '',
        categoria:        p.categoria     || 'General',
        descripcion:      p.descripcion   || '',
        precio_venta:     parseFloat(p.precio_venta)     || 0,
        precio_compra:    parseFloat(p.precio_compra)    || 0,
        precio_mayorista: parseFloat(p.precio_mayorista) || 0,
        stock:            parseInt(p.stock)              || 0,
        stock_minimo:     parseInt(p.stock_minimo)       || 10,
        unidad:           p.unidad        || 'UND',
        igv:              p.igv,
        activo:           p.activo,
        imagen:           p.imagen_url    || '',
        imagen_url:       p.imagen_url    || '',
        barcode:          p.barcode       || ''
      }));
      Storage.guardarProductos();
      console.log('✅ ' + DB.productos.length + ' productos cargados desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando productos:', e);
      return { ok: false };
    }
    
  },

  // Agregar producto
  async agregarProducto(producto) {
    try {
      const { data, error } = await db.from('productos').insert([{
        codigo:           producto.codigo           || '',
        nombre:           producto.nombre           || '',
        categoria:        producto.categoria        || 'General',
        descripcion:      producto.descripcion      || '',
        precio_venta:     producto.precio_venta     || 0,
        precio_compra:    producto.precio_compra    || 0,
        precio_mayorista: producto.precio_mayorista || 0,
        stock:            producto.stock            || 0,
        stock_minimo:     producto.stock_minimo     || 10,
        unidad:           producto.unidad           || 'UND',
        igv:              producto.igv              ?? true,
        activo:           true,
        imagen_url:       producto.imagen_url || producto.imagen || '',
        barcode:          producto.barcode          || ''
      }]).select().single();
      if (error) throw error;
      console.log('✅ Producto guardado en Supabase id=' + data.id);
      await this.cargarProductos();
      return { ok: true, id: data.id };
    } catch(e) {
      console.warn('⚠️ Error guardando producto:', e);
      return { ok: false, msg: e.toString() };
    }
  },

  // Actualizar producto
  async actualizarProducto(producto) {
    try {
      const { error } = await db.from('productos').update({
        codigo:           producto.codigo           || '',
        nombre:           producto.nombre           || '',
        categoria:        producto.categoria        || 'General',
        descripcion:      producto.descripcion      || '',
        precio_venta:     producto.precio_venta     || 0,
        precio_compra:    producto.precio_compra    || 0,
        precio_mayorista: producto.precio_mayorista || 0,
        stock:            producto.stock            || 0,
        stock_minimo:     producto.stock_minimo     || 10,
        unidad:           producto.unidad           || 'UND',
        igv:              producto.igv              ?? true,
        imagen_url:       producto.imagen_url || producto.imagen || '',
        barcode:          producto.barcode          || ''
      }).eq('id', producto.id);
      if (error) throw error;
      console.log('✅ Producto actualizado en Supabase');
      await this.cargarProductos();
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error actualizando producto:', e);
      return { ok: false };
    }
  },

  // Eliminar producto
  async eliminarProducto(id) {
    try {
      const { error } = await db.from('productos').update({ activo: false }).eq('id', id);
      if (error) throw error;
      console.log('✅ Producto eliminado en Supabase');
      await this.cargarProductos();
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error eliminando producto:', e);
      return { ok: false };
    }
  },

  // ============================================================
  // CLIENTES
  // ============================================================

  async cargarClientes() {
    try {
      const { data, error } = await db.from('clientes').select('*');
      if (error) throw error;
      DB.clientes = data.map(function(c) {
        return {
          id: c.id, doc: c.doc||'', tipo: c.tipo||'DNI',
          nombre: c.nombre||'', telefono: c.telefono||'',
          email: c.email||'', direccion: c.direccion||'',
          tipo_cliente: c.tipo_cliente||'cliente'
        };
      });
      Storage.guardarClientes && Storage.guardarClientes();
      console.log('✅ ' + DB.clientes.length + ' clientes cargados desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando clientes:', e);
      return { ok: false };
    }
  },

  async guardarCliente(cliente) {
    try {
      const { error } = await db.from('clientes').upsert([{
        id: cliente.id, doc: cliente.doc||'', tipo: cliente.tipo||'DNI',
        nombre: cliente.nombre||'', telefono: cliente.telefono||'',
        email: cliente.email||'', direccion: cliente.direccion||'',
        tipo_cliente: cliente.tipo_cliente||'cliente'
      }]);
      if (error) throw error;
      console.log('✅ Cliente guardado en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando cliente:', e);
      return { ok: false };
    }
  },

  async eliminarCliente(id) {
    try {
      const { error } = await db.from('clientes').delete().eq('id', id);
      if (error) throw error;
      console.log('✅ Cliente eliminado en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error eliminando cliente:', e);
      return { ok: false };
    }
  },

  // ============================================================
  // COTIZACIONES
  // ============================================================

  async cargarCotizaciones() {
    try {
      const { data, error } = await db.from('cotizaciones').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      DB.cotizaciones = data;
      console.log('✅ ' + DB.cotizaciones.length + ' cotizaciones cargadas desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando cotizaciones:', e);
      return { ok: false };
    }
  },

  async guardarCotizacion(cot) {
    try {
      const { error } = await db.from('cotizaciones').upsert([{
        id: cot.id, numero: cot.numero||'', fecha: cot.fecha||'',
        vencimiento: cot.vencimiento||'', cliente_id: cot.cliente_id||0,
        cliente_nombre: cot.cliente_nombre||'', items: cot.items||[],
        subtotal: cot.subtotal||0, descuento: cot.descuento||0,
        total: cot.total||0, estado: cot.estado||'PENDIENTE',
        notas: cot.notas||'', cajero: cot.cajero||''
      }]);
      if (error) throw error;
      console.log('✅ Cotización guardada en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando cotización:', e);
      return { ok: false };
    }
  },

  async eliminarCotizacion(id) {
    try {
      const { error } = await db.from('cotizaciones').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch(e) {
      return { ok: false };
    }
  },

  // ============================================================
  // AGENDA
  // ============================================================

  async cargarAgenda() {
    try {
      const { data, error } = await db.from('agenda').select('*').order('fecha');
      if (error) throw error;
      if (data && data.length > 0) DB.agenda = data;
      console.log('✅ ' + (data||[]).length + ' eventos cargados desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando agenda:', e);
      return { ok: false };
    }
  },

  async guardarAgenda(evento) {
    try {
      const { error } = await db.from('agenda').upsert([{
        id: evento.id, titulo: evento.titulo||'', tipo: evento.tipo||'recordatorio',
        prioridad: evento.prioridad||'media', fecha: evento.fecha||'',
        hora: evento.hora||'09:00', descripcion: evento.descripcion||'',
        completado: evento.completado||false, fecha_completado: evento.fechaCompletado||''
      }]);
      if (error) throw error;
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando agenda:', e);
      return { ok: false };
    }
  },

  async eliminarAgenda(id) {
    try {
      const { error } = await db.from('agenda').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error eliminando agenda:', e);
      return { ok: false };
    }
  },

  // ============================================================
  // VENTAS
  // ============================================================

  async cargarVentas() {
    try {
      const { data, error } = await db.from('ventas').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      DB.ventas = data;
      Storage.guardarVentas();
      console.log('✅ ' + DB.ventas.length + ' ventas cargadas desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando ventas:', e);
      return { ok: false };
    } finally {
      DB._ventasListas = true;
    }
  },

  async guardarVenta(venta) {
    try {
      const { error } = await db.from('ventas').upsert([{
        id:               String(venta.id),
        serie:            venta.serie            || '',
        numero:           venta.numero           || '',
        tipo:             venta.tipo             || '',
        tipo_comprobante: venta.tipo_comprobante || '',
        fecha:            venta.fecha            || '',
        hora:             venta.hora             || '',
        cliente_id:       String(venta.cliente_id || ''),
        subtotal:         venta.subtotal         || 0,
        igv:              venta.igv              || 0,
        total:            venta.total            || 0,
        metodo_pago:      venta.metodo_pago      || '',
        monto_pago:       venta.monto_pago       || 0,
        vuelto:           venta.vuelto           || 0,
        estado:           venta.estado           || 'NO_ENVIADO',
        items:            venta.items            || [],
        cajero:           venta.cajero           || '',
        nota:             venta.nota             || '',
        cliente_nombre:   venta.cliente_nombre   || '',
        cliente_doc:      venta.cliente_doc      || ''
      }]);
      if (error) throw error;
      console.log('✅ Venta guardada en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando venta:', e);
      this._colaPendiente.push(venta);
      App.toast('⚠️ Sin conexión — venta en cola de sincronización','warning');
      return { ok: false };
    }
  },

  async actualizarVenta(venta) {
    try {
      const { error } = await db.from('ventas').update({
        estado: venta.estado,
        items:  venta.items || []
      }).eq('id', String(venta.id));
      if (error) throw error;
      console.log('✅ Venta actualizada en Supabase id=' + venta.id);
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error actualizando venta:', e);
      return { ok: false };
    }
  },

  // ============================================================
  // CAJA
  // ============================================================

  async cargarCaja() {
    try {
      const { data, error } = await db.from('caja').select('*').order('id', { ascending: false }).limit(1);
      if (error) throw error;
      if (data && data.length > 0) DB.cajas = [data[0]];
      console.log('✅ Caja cargada desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando caja:', e);
      return { ok: false };
    }
  },

  async guardarCaja(caja) {
    try {
      const { error } = await db.from('caja').upsert([{
        id:             caja.id,
        estado:         caja.estado         || 'CERRADA',
        monto_inicial:  caja.monto_inicial  || 0,
        fecha_apertura: caja.fecha_apertura || '',
        hora_apertura:  caja.hora_apertura  || '',
        responsable:    caja.responsable    || '',
        hora_cierre:    caja.hora_cierre    || null,
        monto_contado:  caja.monto_contado  ?? null
      }]);
      if (error) throw error;
      console.log('✅ Caja guardada en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando caja:', e);
      return { ok: false };
    }
  },

  async cargarMovimientosCaja() {
    try {
      const { data, error } = await db.from('movimientos_caja').select('*').order('id', { ascending: false });
      if (error) throw error;
      DB.movimientosCaja = data || [];
      console.log('✅ ' + DB.movimientosCaja.length + ' movimientos de caja cargados desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando movimientos de caja:', e);
      return { ok: false };
    }
  },

  async guardarMovimientoCaja(mov) {
    try {
      const { error } = await db.from('movimientos_caja').upsert([{
        id:          mov.id,
        tipo:        mov.tipo        || '',
        concepto:    mov.concepto    || '',
        monto:       mov.monto       || 0,
        fecha:       mov.fecha       || '',
        hora:        mov.hora        || '',
        responsable: mov.responsable || ''
      }]);
      if (error) throw error;
      console.log('✅ Movimiento de caja guardado en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando movimiento de caja:', e);
      return { ok: false };
    }
  },

  async cargarHistorialCaja() {
    try {
      const { data, error } = await db.from('historial_caja').select('*').order('id', { ascending: false });
      if (error) throw error;
      DB.historialCaja = data || [];
      console.log('✅ ' + DB.historialCaja.length + ' cierres de caja cargados desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando historial de caja:', e);
      return { ok: false };
    }
  },

  async guardarHistorialCaja(snap) {
    try {
      const { error } = await db.from('historial_caja').upsert([{
        id:               snap.id,
        fecha:            snap.fecha            || '',
        hora_apertura:    snap.hora_apertura     || '',
        hora_cierre:      snap.hora_cierre       || '',
        responsable:      snap.responsable       || '',
        monto_inicial:    snap.monto_inicial     || 0,
        venta_efectivo:   snap.venta_efectivo    || 0,
        venta_yape:       snap.venta_yape        || 0,
        venta_tarjeta:    snap.venta_tarjeta     || 0,
        venta_combinado:  snap.venta_combinado   || 0,
        venta_total:      snap.venta_total       || 0,
        num_ventas:       snap.num_ventas        || 0,
        ingresos:         snap.ingresos          || 0,
        egresos:          snap.egresos           || 0,
        balance_efectivo: snap.balance_efectivo  || 0,
        balance_total:    snap.balance_total     || 0,
        monto_contado:    snap.monto_contado     || 0,
        diferencia:       snap.diferencia        || 0,
        observaciones:    snap.observaciones     || ''
      }]);
      if (error) throw error;
      console.log('✅ Historial de caja guardado en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando historial de caja:', e);
      return { ok: false };
    }
  },

  async cargarKardex() {
    try {
      const { data, error } = await db.from('kardex').select('*').order('id', { ascending: false }).limit(500);
      if (error) throw error;
      if (data && data.length > 0) DB.kardex = data;
      console.log('✅ ' + (data||[]).length + ' movimientos de kardex cargados desde Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando kardex:', e);
      return { ok: false };
    }
  },

  async guardarKardex(entries) {
    try {
      const rows = entries.map(function(k){
        return {
          id: k.id,
          fecha: k.fecha || '',
          hora: k.hora || '',
          prod_id: k.prod_id,
          tipo: k.tipo || '',
          concepto: k.concepto || '',
          cantidad: k.cantidad || 0,
          stock_anterior: k.stock_anterior || 0,
          stock_nuevo: k.stock_nuevo || 0,
          usuario: k.usuario || ''
        };
      });
      const { error } = await db.from('kardex').upsert(rows);
      if (error) throw error;
      console.log('✅ ' + rows.length + ' movimiento(s) de kardex guardados en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando kardex:', e);
      return { ok: false };
    }
  },

  // Igual que actualizarProducto() pero para varios productos en UNA sola llamada,
  // sin disparar cargarProductos() por cada uno (evita recargas redundantes en cascada).
  async actualizarProductosBatch(productos) {
    try {
      if (!productos || !productos.length) return { ok: true };
      const rows = productos.map(function(p){
        return {
          id:               p.id,
          codigo:           p.codigo           || '',
          nombre:           p.nombre           || '',
          categoria:        p.categoria        || 'General',
          descripcion:      p.descripcion      || '',
          precio_venta:     p.precio_venta     || 0,
          precio_compra:    p.precio_compra    || 0,
          precio_mayorista: p.precio_mayorista || 0,
          stock:            p.stock            || 0,
          stock_minimo:     p.stock_minimo     || 10,
          unidad:           p.unidad           || 'UND',
          igv:              p.igv              ?? true,
          imagen_url:       p.imagen_url || p.imagen || '',
          barcode:          p.barcode          || ''
        };
      });
      const { error } = await db.from('productos').upsert(rows);
      if (error) throw error;
      console.log('✅ ' + rows.length + ' producto(s) sincronizados en Supabase (batch)');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error sincronizando productos en batch:', e);
      return { ok: false };
    }
  },

  // ============================================================
  // EMPRESA
  // ============================================================

  async cargarEmpresa() {
    try {
      const { data, error } = await db.from('empresa').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      if (data) {
        Object.assign(DB.empresa, {
          nombre:      data.nombre      || DB.empresa.nombre,
          ruc:         data.ruc         || DB.empresa.ruc,
          sucursal:    data.sucursal    || DB.empresa.sucursal,
          direccion:   data.direccion   || DB.empresa.direccion,
          telefono:    data.telefono    || '',
          email:       data.email       || '',
          whatsapp:    data.whatsapp    || '',
          web:         data.web         || '',
          logo:        data.logo        || '',
          moneda:      data.moneda      || 'SOLES',
          tipoCambio:  data.tipo_cambio || DB.empresa.tipoCambio,
          simbolo:     data.simbolo     || 'S/',
          pais:        data.pais        || 'PE',
          igv:         data.igv         ?? 18,
          igvDefault:  data.igv_default || 'incluido',
          decimales:   data.decimales   ?? 2,
          autoprint:   data.autoprint   !== false
        });
        Storage.guardarEmpresa();
        console.log('✅ Datos de empresa cargados desde Supabase');
      }
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cargando empresa:', e);
      return { ok: false };
    }
  },

  async actualizarEmpresa(e) {
    try {
      const { error } = await db.from('empresa').upsert([{
        id:           1,
        nombre:       e.nombre       || '',
        ruc:          e.ruc          || '',
        sucursal:     e.sucursal     || '',
        direccion:    e.direccion    || '',
        telefono:     e.telefono     || '',
        email:        e.email        || '',
        whatsapp:     e.whatsapp     || '',
        web:          e.web          || '',
        logo:         e.logo         || '',
        moneda:       e.moneda       || 'SOLES',
        tipo_cambio:  e.tipoCambio   || 3.467,
        simbolo:      e.simbolo      || 'S/',
        pais:         e.pais         || 'PE',
        igv:          e.igv          ?? 18,
        igv_default:  e.igvDefault   || 'incluido',
        decimales:    e.decimales    ?? 2,
        autoprint:    e.autoprint    !== false
      }]);
      if (error) throw error;
      console.log('✅ Empresa actualizada en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error actualizando empresa:', e);
      return { ok: false };
    }
  },

  // ============================================================
  // AUTH
  // ============================================================

  _uuidMap: {
    '0010635d-4557-4a73-8a2e-5eb0a656bdb6': 'MayumiMagama',
    'bf399d25-053a-4154-9d5e-203de63c0045': 'AstridVara'
  },

  // Respaldo: permite entrar desde CUALQUIER compu aunque la lista local esté vacía
  _infoUsuarios: {
    'MayumiMagama': { usuario: 'MayumiMagama', activo: true, cargo: 'ADMINISTRADOR', nombre: 'MAGAMA Administrador' },
    'AstridVara':   { usuario: 'AstridVara',   activo: true, cargo: 'ADMINISTRADOR', nombre: 'Astrid Vara' } // ajusta el nombre si es otro
  },

  _resolverUsuario: function(usuario) {
    var found = (DB.usuarios || []).find(function(u) {
      return u.usuario === usuario && u.activo;
    });
    if (!found) found = this._infoUsuarios[usuario] || { usuario: usuario, activo: true };
    return found;
  },

  async loginConSupabase(email, password) {
    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid     = data.user.id;
      const usuario = this._uuidMap[uid];
      if (!usuario) throw new Error('Usuario no autorizado en el sistema');
      const found = this._resolverUsuario(usuario);
      console.log('✅ Login Supabase OK:', found.usuario);
      return { ok: true, usuario: found };
    } catch(e) {
      console.warn('⚠️ Login error:', e.message);
      return { ok: false, msg: e.message };
    }
  },

  _colaPendiente: [],

  async _reintentarPendientes() {
    if (this._colaPendiente.length === 0) return;
    var pendientes = this._colaPendiente.slice();
    for (var i = 0; i < pendientes.length; i++) {
      var venta = pendientes[i];
      var res = await this.guardarVenta(venta);
      if (res.ok) {
        var idx = this._colaPendiente.indexOf(venta);
        if (idx >= 0) this._colaPendiente.splice(idx, 1);
        App.toast('✅ Venta '+venta.serie+'-'+venta.numero+' sincronizada','success');
      }
    }
  },

  iniciarSincronizacion() {
    var self = this;
    setInterval(async function() {
      if (self._colaPendiente.length > 0) {
        await self._reintentarPendientes();
      }
    }, 30000);
  },

  async cerrarSesion() {
    try {
      await db.auth.signOut();
      console.log('✅ Sesión cerrada en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error cerrando sesión:', e);
      return { ok: false };
    }
  },

  async obtenerSesionActual() {
    try {
      const { data } = await db.auth.getSession();
      if (!data.session) return { ok: false };
      const uid     = data.session.user.id;
      const usuario = this._uuidMap[uid];
      if (!usuario) return { ok: false };
      const found = this._resolverUsuario(usuario);
      return { ok: true, usuario: found };
    } catch(e) {
      return { ok: false };
    }
  },

  // ============================================================
  // COMPROBANTES (PDF por WhatsApp)
  // ============================================================

  async subirComprobantePDF(blob, nombreArchivo) {
    try {
      const { data, error } = await db.storage
        .from('comprobantes')
        .upload(nombreArchivo, blob, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
      const { data: urlData } = db.storage.from('comprobantes').getPublicUrl(nombreArchivo);
      return { ok: true, url: urlData.publicUrl };
    } catch(e) {
      console.warn('⚠️ Error subiendo comprobante:', e);
      return { ok: false };
    }
  }

}; // ← fin SupabaseDB

// ============================================================
// SUPABASE STORAGE — Subida de imágenes con compresión
// ============================================================

const SupabaseStorage = {

  MAX_WIDTH:  800,
  MAX_HEIGHT: 800,
  QUALITY:    0.75,
  TARGET_KB:  300,

  async comprimir(file) {
    return new Promise(function(resolve) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          let w = img.width;
          let h = img.height;
          const maxW = SupabaseStorage.MAX_WIDTH;
          const maxH = SupabaseStorage.MAX_HEIGHT;

          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          let quality = SupabaseStorage.QUALITY;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let sizeKB  = Math.round(dataUrl.length * 0.75 / 1024);

          while (sizeKB > SupabaseStorage.TARGET_KB && quality > 0.3) {
            quality -= 0.05;
            dataUrl  = canvas.toDataURL('image/jpeg', quality);
            sizeKB   = Math.round(dataUrl.length * 0.75 / 1024);
          }

          console.log('🗜️ Imagen comprimida: ' + sizeKB + 'KB (calidad: ' + Math.round(quality * 100) + '%)');

          const byteString = atob(dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/jpeg' });
          resolve({ blob: blob, sizeKB: sizeKB, quality: quality });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  async subirImagen(file, carpeta) {
    carpeta = carpeta || 'productos';
    try {
      const compressed = await this.comprimir(file);

      const nombre = carpeta + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.jpg';
      const ruta   = carpeta + '/' + nombre;

      const { data, error } = await db.storage
        .from('productos')
        .upload(ruta, compressed.blob, {
          contentType:  'image/jpeg',
          cacheControl: '3600',
          upsert:       false
        });

      if (error) throw error;

      const { data: urlData } = db.storage
        .from('productos')
        .getPublicUrl(ruta);

      const url = urlData.publicUrl;
      console.log('✅ Imagen subida: ' + compressed.sizeKB + 'KB → ' + url);
      return { ok: true, url: url, sizeKB: compressed.sizeKB };

    } catch(e) {
      console.error('❌ Error subiendo imagen:', e);
      return { ok: false, msg: e.message || e.toString() };
    }
  },

  async eliminarImagen(url) {
    try {
      const marker = '/object/public/productos/';
      const idx    = url.indexOf(marker);
      if (idx === -1) return { ok: false, msg: 'URL no reconocida' };
      const ruta   = url.substring(idx + marker.length);
      const { error } = await db.storage.from('productos').remove([ruta]);
      if (error) throw error;
      console.log('✅ Imagen eliminada del storage:', ruta);
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error eliminando imagen:', e);
      return { ok: false };
    }
  }

};
