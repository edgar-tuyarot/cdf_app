const { StockSnapshot, Producto, ProductoStock, sequelize } = require('../src/models')

async function setTodayAsSnapshotDayZero() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a la base de datos establecida.')

    // 1. Limpiar snapshots anteriores
    await StockSnapshot.destroy({ where: {}, truncate: true })
    console.log('Tabla stock_snapshots vaciada exitosamente.')

    // 2. Obtener todos los productos activos con su stock actual
    const productos = await Producto.findAll({
      include: [
        {
          model: ProductoStock,
          as: 'Stocks',
          required: false
        }
      ]
    })

    console.log(`Cargando Stock Inicial Día 0 para ${productos.length} productos...`)

    const fechaCorte = new Date('2026-09-01T00:00:00')
    let creados = 0

    for (const p of productos) {
      // Determinar stock actual real en kilos
      let stockVal = 0.000
      if (p.Stocks && p.Stocks.length > 0) {
        stockVal = parseFloat(p.Stocks[0].stock) || 0.000
      } else {
        stockVal = parseFloat(p.stock) || 0.000
      }

      await StockSnapshot.create({
        codigo_producto: p.codigo,
        id_ubicacion: p.Stocks && p.Stocks[0] ? p.Stocks[0].id_ubicacion : 1,
        fecha_corte: fechaCorte,
        stock_kilos: stockVal,
        observaciones: 'Inventario Inicial Auditado Día 0 (01/09/2026)',
        usuario: 'Sistema'
      })

      creados++
    }

    console.log(`✅ ¡Éxito! Se han creado ${creados} snapshots con fecha Día 0 (01/09/2026).`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error al establecer el Día 0 de snapshots:', error)
    process.exit(1)
  }
}

setTodayAsSnapshotDayZero()
