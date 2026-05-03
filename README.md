# 🏪 JUMILA ERP — Sistema de Gestión Empresarial
> Sistema ERP completo desarrollado para **MAGAMA Fashion Store** — Huánuco, Perú 🇵🇪

![Estado](https://img.shields.io/badge/Estado-Producción-success)
![Versión](https://img.shields.io/badge/Versión-2.0-blue)
![Desarrollado por](https://img.shields.io/badge/Desarrollado%20por-Industry%20Yara-0096ff)
![Cliente](https://img.shields.io/badge/Cliente-MAGAMA%20Fashion%20Store-d4af37)

---

## 🌐 Acceso al Sistema

| Entorno | URL |
|---------|-----|
| **Producción** | [magamamoda.com](https://magamamoda.com) |

> ⚠️ **Seguridad:** Las credenciales de acceso están protegidas con **Supabase Auth**. No se almacenan contraseñas en el código fuente.

---

## 🏢 Información del Proyecto

| Campo | Detalle |
|-------|---------|
| **Cliente** | GRUPO JUMILA SOCIEDAD ANÓNIMA CERRADA |
| **Tienda** | MAGAMA Fashion Store |
| **Ubicación** | Jr. 2 de Mayo 708, Huánuco, Perú |
| **Desarrollador** | Industry Yara — Soluciones digitales |
| **Base de datos** | Supabase (PostgreSQL en la nube) |
| **Año** | 2026 |

---

## 📦 Estructura del Proyecto

```
erp-jumila/
├── index.html                  ← Archivo principal + Login
├── assets/
│   └── magama-logo.png         ← Logo de MAGAMA
├── css/
│   └── styles.css              ← Estilos del sistema
├── js/
│   ├── app.js                  ← Controlador principal + Auth
│   ├── data.js                 ← Base de datos local + Google Sheets Sync
│   ├── supabase.js             ← Conexión Supabase + Auth
│   ├── cloudinary.js           ← Gestión de imágenes
│   └── modules/
│       ├── inicio.js           ← Dashboard principal
│       ├── pos.js              ← Punto de Venta
│       ├── ventas.js           ← Gestión de Ventas
│       ├── cotizaciones.js     ← Cotizaciones
│       ├── notascredito.js     ← Notas de Crédito/Débito
│       ├── clientes.js         ← Clientes y Proveedores
│       ├── productos.js        ← Productos y Servicios
│       ├── precios.js          ← Lista de Precios
│       ├── tickets.js          ← Tickets / Cuenta Corriente
│       ├── inventario.js       ← Control de Inventario
│       ├── kardex.js           ← Kardex de movimientos
│       ├── caja.js             ← Caja y Arqueo
│       ├── reportes.js         ← Reportes y Estadísticas
│       ├── agenda.js           ← Agenda y Eventos
│       ├── herramientas.js     ← Herramientas del sistema
│       └── notascredito.js     ← Notas de Crédito/Débito
├── CNAME                       ← Dominio personalizado GitHub Pages
└── README.md
```

---

## 🎯 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| 🏠 **Inicio** | Dashboard con KPIs, ventas del día, stock bajo, acciones rápidas |
| 🖥️ **Punto de Venta (POS)** | Venta rápida con lector de barras, pago combinado, tickets |
| 📄 **Ventas** | Comprobantes (Boleta, Factura, N. Venta), filtros, exportar CSV |
| 📋 **Cotizaciones** | Generación y seguimiento de cotizaciones |
| 📝 **Notas Créd./Déb.** | Notas de crédito y débito electrónicas |
| 👥 **Clientes/Proveedores** | CRUD completo, búsqueda por DNI/RUC |
| 📦 **Productos/Servicios** | Catálogo completo, imágenes, categorías, stock |
| 🏷️ **Lista de Precios** | Precios por lista (minorista, mayorista, VIP, distribuidor) |
| 🎫 **Tickets** | Cuenta corriente y créditos de clientes |
| 🏭 **Inventario** | Control de stock, alertas de stock mínimo |
| 📊 **Kardex** | Historial de entradas y salidas de productos |
| 💰 **Caja** | Apertura/cierre, arqueo, ingresos/egresos |
| 📈 **Reportes** | Estadísticas de ventas, top productos, gráficos |
| 📅 **Agenda** | Eventos y recordatorios del negocio |
| 🛒 **Compras** | Registro de compras a proveedores |
| 🏦 **Cuentas Bancarias** | Gestión de cuentas bancarias |
| 💹 **Finanzas** | Flujo de caja, ingresos vs egresos |
| 🔧 **Herramientas** | Utilidades del sistema |
| ⚙️ **Configuración** | Datos de empresa, tipo de cambio |
| 👑 **Administración** | Gestión de usuarios y permisos |
| 🆘 **Soporte** | Canal de ayuda y soporte técnico |

---

## 💳 Métodos de Pago Soportados

- 💵 **Efectivo** — Con cálculo de vuelto automático
- 💳 **Tarjeta** — Débito y crédito
- 📱 **Yape/Plin** — Billeteras digitales
- 🔀 **Pago Combinado** — Yape + Efectivo / Tarjeta + Efectivo

---

## 🧾 Tipos de Comprobante

| Tipo | Serie | Uso |
|------|-------|-----|
| NOTA DE VENTA | NV03 | Ventas internas |
| BOLETA ELECTRÓNICA | BV03 | Consumidor final |
| FACTURA ELECTRÓNICA | FC01 | Empresas con RUC |

> 📍 **Nota:** Huánuco está exonerada de IGV — todos los comprobantes muestran IGV = S/ 0.00

---

## 🔐 Seguridad

El sistema implementa **3 capas de seguridad**:

1. ✅ **Login obligatorio** — Nadie puede acceder sin credenciales válidas
2. ✅ **Protección por roles** — Admin vs Cajero con permisos granulares
3. ✅ **Supabase Auth** — Contraseñas encriptadas en la nube, nunca en el código

### Roles del Sistema

| Rol | Acceso |
|-----|--------|
| 👑 **Administrador** | Acceso total a todos los módulos |
| 👤 **Cajero** | Solo POS, Ventas, Caja, Clientes, Productos, Reportes |

---

## 🗄️ Base de Datos

El sistema usa una arquitectura **híbrida**:

| Fuente | Datos |
|--------|-------|
| **Supabase** (PostgreSQL) | Productos, Ventas, Auth de usuarios |
| **Google Sheets** | Sincronización de productos (respaldo) |
| **localStorage** | Caché local para funcionamiento offline |

---

## 🚀 Desarrollo Local

### Requisitos
- VS Code
- Extensión **Live Server** (Ritwick Dey)
- Navegador Chrome o Edge

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/erp-jumila.git

# 2. Abrir en VS Code
code erp-jumila/

# 3. Click derecho en index.html → "Open with Live Server"
```

---

## 🌐 Despliegue

El sistema está desplegado en **GitHub Pages** con dominio personalizado:

```
magamamoda.com → GitHub Pages → index.html
```

Para desplegar cambios:
```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| **HTML5 / CSS3** | Estructura y estilos |
| **JavaScript (Vanilla)** | Lógica del negocio |
| **Supabase** | Base de datos y autenticación |
| **Google Sheets API** | Sincronización de productos |
| **Cloudinary** | Almacenamiento de imágenes |
| **Chart.js** | Gráficos y reportes |
| **Font Awesome** | Iconografía |
| **GitHub Pages** | Hosting gratuito |

---

## 📱 Compatibilidad

| Navegador | Estado |
|-----------|--------|
| Chrome | ✅ Recomendado |
| Edge | ✅ Compatible |
| Firefox | ✅ Compatible |
| Opera | ✅ Compatible |
| Safari | ⚠️ Parcial |

---

## 📞 Contacto

| | |
|-|-|
| **Cliente** | MAGAMA Fashion Store |
| **Desarrollador** | Industry Yara |
| **Ubicación** | Huánuco, Perú |
| **WhatsApp** | +51 913 436 194 |

---

> 💡 **Desarrollado con ❤️ por Industry Yara para MAGAMA Fashion Store — Huánuco, Perú 🇵🇪**
