const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 1. Productos
const Producto = sequelize.define('Producto', {
  id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_interno: { type: DataTypes.STRING, unique: true, allowNull: false },
  codigo_proveedor: { type: DataTypes.STRING },
  descripcion: { type: DataTypes.STRING, allowNull: false },
  categoria: { type: DataTypes.STRING },
  stock: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
}, { tableName: 'productos', timestamps: false });

// 2. Colaboradores
const Colaborador = sequelize.define('Colaborador', {
  id_colaborador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, unique: true, allowNull: false },
  rol: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING }
}, { tableName: 'colaboradores', timestamps: false });

// 3. Sucursales
const Sucursal = sequelize.define('Sucursal', {
  id_sucursal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  ubicacion: { type: DataTypes.STRING }
}, { tableName: 'sucursales', timestamps: false });

// 4. Ingresos Proveedores
const IngresoProveedor = sequelize.define('IngresoProveedor', {
  id_ingreso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha: { type: DataTypes.DATE },
  proveedor: { type: DataTypes.STRING },
  nro_factura: { type: DataTypes.STRING },
  id_producto_proveedor: { type: DataTypes.STRING }, // Código interno del proveedor
  id_producto: { type: DataTypes.INTEGER },
  kilos_totales: { type: DataTypes.DECIMAL(10, 2) },
  bultos: { type: DataTypes.INTEGER },
  vencimiento: { type: DataTypes.DATEONLY }
}, { tableName: 'ingresos_proveedores', timestamps: false });

// 5. Registro Produccion
const RegistroProduccion = sequelize.define('RegistroProduccion', {
  id_produccion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha: { type: DataTypes.DATEONLY },
  id_colaborador: { type: DataTypes.INTEGER },
  id_producto: { type: DataTypes.INTEGER },
  cantidad_bolsitas: { type: DataTypes.INTEGER },
  tipo_proceso: { type: DataTypes.STRING }
}, { tableName: 'registro_produccion', timestamps: false });

// 6. Pedidos Sucursales
const PedidoSucursal = sequelize.define('PedidoSucursal', {
  id_pedido: { type: DataTypes.STRING, primaryKey: true }, // Ahora usamos tu código de pedido
  codigo_pedido: { type: DataTypes.STRING, unique: true },
  id_sucursal: { type: DataTypes.INTEGER },
  fecha_pedido: { type: DataTypes.DATE },
  estado: { type: DataTypes.STRING }
}, { tableName: 'pedidos_sucursales', timestamps: false });

// 7. Recorte Recepcion
const RecorteRecepcion = require('./recorteRecepcion');

// 8. Items de Pedido (Detalle)
const ItemPedido = sequelize.define('ItemPedido', {
  id_item: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: { type: DataTypes.STRING }, // Debe coincidir con PedidoSucursal
  id_producto: { type: DataTypes.INTEGER },
  cantidad_piezas: { type: DataTypes.INTEGER, defaultValue: 0 },
  cantidad_fraccionado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
}, { tableName: 'items_pedidos', timestamps: false });

// 9. Despachos
const Despacho = sequelize.define('Despacho', {
  id_despacho: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha_hora: { type: DataTypes.DATE },
  id_sucursal: { type: DataTypes.INTEGER },
  id_pedido: { type: DataTypes.STRING },
  codigo_barras_raw: { type: DataTypes.STRING },
  peso_despachado: { type: DataTypes.DECIMAL(10, 2) }
}, { tableName: 'despachos', timestamps: false });

// 10. Usuarios
const Usuario = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.STRING, defaultValue: 'operario' }
}, { tableName: 'usuarios', timestamps: false });

// 11. Detalle de Feteado (Control de mermas)
const DetalleFeteado = sequelize.define('DetalleFeteado', {
  id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: { type: DataTypes.STRING, allowNull: false },
  peso_bruto: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  cantidad_fraccionada: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  decomiso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  total_feteado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  nombre_usuario: { type: DataTypes.STRING },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'detalles_feteado', timestamps: false });

// 12. Producción Feteados
const ProduccionFeteado = sequelize.define('ProduccionFeteado', {
  id_feteado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: { type: DataTypes.STRING, allowNull: false },
  peso_bruto: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  peso_decomiso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  peso_recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  peso_feteado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  cantidad_bolsitas: { type: DataTypes.INTEGER, defaultValue: 0 },
  feteador: { type: DataTypes.STRING },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'produccion_feteados', timestamps: false });

// 13. Stock a Fetear
const StockAFetear = sequelize.define('StockAFetear', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  cantidad: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'stock_a_fetear', timestamps: false });

// 14. Stock a Picada
const StockAPicada = sequelize.define('StockAPicada', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
}, { tableName: 'stock_a_picada', timestamps: false });

// 15. Stock a Decomiso
const StockADecomiso = sequelize.define('StockADecomiso', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, allowNull: false },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  motivo: { type: DataTypes.STRING }
}, { tableName: 'stock_a_decomiso', timestamps: false });

// 16. Stock Envasados
const StockEnvasado = sequelize.define('StockEnvasado', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, defaultValue: 0 },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  fecha_ultimo_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'stock_envasados', timestamps: false });

// 17. Stock Piezas
const StockPiezas = sequelize.define('StockPiezas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, defaultValue: 0 },
  vencimiento: { type: DataTypes.STRING },
  fecha_ultimo_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'stock_piezas', timestamps: false });

// 18. Stock Kilos
const StockKilos = sequelize.define('StockKilos', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: { type: DataTypes.STRING, unique: true, allowNull: false },
  cantidad_kilos: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
}, { tableName: 'stock_kilos', timestamps: false });

// 19. Preparación de Pedidos
const PreparacionPedido = sequelize.define('PreparacionPedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_de_pedido: { type: DataTypes.STRING, allowNull: false },
  codigo_producto: { type: DataTypes.STRING, allowNull: false },
  cantidad_piezas_pedida: { type: DataTypes.INTEGER, defaultValue: 0 },
  cantidad_fracciones_pedidas: { type: DataTypes.INTEGER, defaultValue: 0 },
  peso_piezas_preparadas: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  peso_fracciones_preparadas: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  cantidad_bolsitas_preparadas: { type: DataTypes.INTEGER, defaultValue: 0 },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'preparacion_pedidos', timestamps: false });

// 20. Stock de Producción (Envasados)
const StockProduccion = sequelize.define('StockProduccion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false },
  cantidad_bolsitas: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'stock_produccion', timestamps: false });

// 21. Producción Envasados (Historial)
const ProduccionEnvasado = sequelize.define('ProduccionEnvasado', {
  id_envasado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: { type: DataTypes.STRING, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, defaultValue: 0 },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  envasador: { type: DataTypes.STRING },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'produccion_envasados', timestamps: false });

// --- Relaciones ---

// Producto <-> IngresoProveedor (1:N)
Producto.hasMany(IngresoProveedor, { foreignKey: 'id_producto' });
IngresoProveedor.belongsTo(Producto, { foreignKey: 'id_producto' });

// Colaborador <-> RegistroProduccion (1:N)
Colaborador.hasMany(RegistroProduccion, { foreignKey: 'id_colaborador' });
RegistroProduccion.belongsTo(Colaborador, { foreignKey: 'id_colaborador' });

// Producto <-> RegistroProduccion (1:N)
Producto.hasMany(RegistroProduccion, { foreignKey: 'id_producto' });
RegistroProduccion.belongsTo(Producto, { foreignKey: 'id_producto' });

// Sucursal <-> PedidoSucursal (1:N)
Sucursal.hasMany(PedidoSucursal, { foreignKey: 'id_sucursal' });
PedidoSucursal.belongsTo(Sucursal, { foreignKey: 'id_sucursal' });

// Sucursal <-> Despacho (1:N)
Sucursal.hasMany(Despacho, { foreignKey: 'id_sucursal' });
Despacho.belongsTo(Sucursal, { foreignKey: 'id_sucursal' });

// PedidoSucursal <-> ItemPedido (1:N)
PedidoSucursal.hasMany(ItemPedido, { foreignKey: 'id_pedido' });
ItemPedido.belongsTo(PedidoSucursal, { foreignKey: 'id_pedido' });

// Producto <-> ItemPedido (1:N)
Producto.hasMany(ItemPedido, { foreignKey: 'id_producto' });
ItemPedido.belongsTo(Producto, { foreignKey: 'id_producto' });

// Colaborador <-> Usuario (Relación lógica, sin constraints de DB para evitar bloqueos)
Colaborador.hasOne(Usuario, { foreignKey: 'usuario', sourceKey: 'nombre', constraints: false });
Usuario.belongsTo(Colaborador, { foreignKey: 'usuario', targetKey: 'nombre', constraints: false });

// PedidoSucursal <-> Despacho (1:N)
PedidoSucursal.hasMany(Despacho, { foreignKey: 'id_pedido' });
Despacho.belongsTo(PedidoSucursal, { foreignKey: 'id_pedido' });

// Producto <-> StockProduccion (1:1) por código
Producto.hasOne(StockProduccion, { foreignKey: 'codigo', sourceKey: 'codigo_interno' });
StockProduccion.belongsTo(Producto, { foreignKey: 'codigo', targetKey: 'codigo_interno' });

// Producto <-> ProduccionFeteado (1:N por código)
ProduccionFeteado.belongsTo(Producto, { foreignKey: 'codigo_producto', targetKey: 'codigo_interno' });
Producto.hasMany(ProduccionFeteado, { foreignKey: 'codigo_producto', sourceKey: 'codigo_interno' });

// Producto <-> StockAFetear (1:1 por código)
StockAFetear.belongsTo(Producto, { foreignKey: 'codigo', targetKey: 'codigo_interno' });
Producto.hasOne(StockAFetear, { foreignKey: 'codigo', sourceKey: 'codigo_interno' });

module.exports = {
  sequelize,
  Producto,
  Colaborador,
  Sucursal,
  IngresoProveedor,
  RegistroProduccion,
  PedidoSucursal,
  RecorteRecepcion,
  ItemPedido,
  Despacho,
  StockProduccion,
  Usuario,
  DetalleFeteado,
  ProduccionFeteado,
  StockAFetear,
  StockAPicada,
  StockADecomiso,
  StockEnvasado,
  StockPiezas,
  StockKilos,
  PreparacionPedido,
  ProduccionEnvasado
};
