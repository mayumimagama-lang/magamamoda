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
        imagen_url:       producto.imagen_url       || '',
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
        imagen_url:       producto.imagen_url       || '',
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
  // VENTAS
  // ============================================================

  // Cargar ventas
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
    }
  },

  // Guardar venta
  async guardarVenta(venta) {
    try {
      const { error } = await db.from('ventas').insert([{
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
        items:            venta.items            || []
      }]);
      if (error) throw error;
      console.log('✅ Venta guardada en Supabase');
      return { ok: true };
    } catch(e) {
      console.warn('⚠️ Error guardando venta:', e);
      return { ok: false };
    }
  },

  // Actualizar estado de venta (anular, aceptar, etc.)
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
  // AUTH — Autenticación con Supabase
  // ============================================================

  _uuidMap: {
    '0010635d-4557-4a73-8a2e-5eb0a656bdb6': 'MayumiMagama',
    'bf399d25-053a-4154-9d5e-203de63c0045': 'AstridVara'
  },

  async loginConSupabase(email, password) {
    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid     = data.user.id;
      const usuario = this._uuidMap[uid];
      if (!usuario) throw new Error('Usuario no autorizado en el sistema');
      const found = DB.usuarios.find(function(u) {
        return u.usuario === usuario && u.activo;
      });
      if (!found) throw new Error('Usuario inactivo o no encontrado');
      console.log('✅ Login Supabase OK:', found.usuario);
      return { ok: true, usuario: found };
    } catch(e) {
      console.warn('⚠️ Login error:', e.message);
      return { ok: false, msg: e.message };
    }
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
      const found = DB.usuarios.find(function(u) {
        return u.usuario === usuario && u.activo;
      });
      if (!found) return { ok: false };
      return { ok: true, usuario: found };
    } catch(e) {
      return { ok: false };
    }
  }

};
