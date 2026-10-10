# Gylden Inventory & Production Management

Sistema web integral desarrollado a medida para **Gylden Meadery**, enfocado en el control de inventario de materias primas, formulación y escalado de recetas, seguimiento de lotes a través de las 6 etapas de producción artesanal, y despacho de producto terminado a clientes.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, TypeScript)
- **Base de Datos & ORM**: [SQLite](https://www.sqlite.org/) con [Prisma ORM](https://www.prisma.io/)
- **Estilos & UI**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **Gestión de Roles**: Selector integrado para *Administrador*, *Producción / Cervecero* y *Ventas / Despachos*

---

## 🚀 Funcionalidades Principales

### 1. Inventario de Materia Prima e Insumos
- Catálogo de insumos clasificados por categoría: Mieles, Levaduras, Nutrientes, Frutas, Agua y Material de Empaque (botellas de 330ml, chapas, etiquetas).
- Control de unidades (`kg`, `g`, `L`, `units`), precios unitarios de compra y stock mínimo de seguridad con alertas visuales.
- Ajustes de inventario y entradas directas por compras.
- **Módulo de Órdenes de Compra (Requisiciones)**: El cervecero solicita insumos requeridos al administrador, quien puede autorizarlos y, al llegar a almacén, ingresarlos automáticamente al inventario.

### 2. Formulación y Escalado de Recetas (BOM)
- Recetas maestras formuladas para un volumen base de 20 Litros.
- Insumos asignados a la etapa exacta de fermentación en que se incorporan.
- **Calculadora dinámica de escalado**: Permite ingresar cualquier volumen en litros (ej. 40L, 60L, 100L) y calcula los ingredientes exactos verificando en tiempo real la disponibilidad de stock en bodega.

### 3. Trazabilidad de Batches en 6 Etapas
1. **Preparación de base y 1ra fermentación** (~7 días)
2. **Agregado de frutas y 2da fermentación** (~7 días)
3. **Clarificación** (~3 días)
4. **Trasvase a keg y enfriamiento** (~1 día)
5. **Gasificación** (~1 día)
6. **Embotellado y empaque** (~1 día)

- **Descuento automático de inventario** al lanzar el lote según el volumen escalado.
- Avance ágil de etapas con registro de bitácora y observaciones.
- **Embotellado final**: Al registrar las botellas obtenidas, se suman a Producto Terminado y se descuentan botellas vacías, chapas y etiquetas de materia prima.

### 4. Inventario de Producto Terminado y Envíos
- Stock disponible de botellas de 330ml por estilo y valorización total del almacén.
- Catálogo de clientes y puntos de entrega regulares.
- **Gestión de Pedidos y Envíos**:
  - Registro de **Pedidos Pendientes** (pedidos recibidos aún por enviar).
  - Despacho y seguimiento (*En Reparto* y *Entregado*).
  - Control de cobranzas: Total esperado, anticipos y saldo pendiente por cobrar.

### 5. Dashboard Ejecutivo con Alertas Tempranas
- Notificación con **1 día de antelación**: Identifica qué lotes requieren cambio de etapa **HOY** y cuáles **MAÑANA** para preparar insumos y tanques.
- Indicadores financieros de cuentas por cobrar y valor del inventario.

---

## 💻 Instalación y Uso Local

```bash
# 1. Clonar el repositorio
git clone git@github.com:jvazponce/gylden_inventory.git
cd gylden_inventory

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno y base de datos
npx prisma db push
node prisma/seed.js

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).