const { StockSnapshot, Producto, sequelize } = require('../src/models')

const snapshotData = [
  { codigo_producto: '4787', stock_kilos: 162.38 },
  { codigo_producto: '2910', stock_kilos: 16.72 },
  { codigo_producto: '1922', stock_kilos: 0 },
  { codigo_producto: '2422', stock_kilos: 0 },
  { codigo_producto: '6179', stock_kilos: 0 },
  { codigo_producto: '8657', stock_kilos: 3.665 },
  { codigo_producto: '1621', stock_kilos: 7.315 },
  { codigo_producto: '2912', stock_kilos: 0 },
  { codigo_producto: '8512', stock_kilos: 0 },
  { codigo_producto: '3740', stock_kilos: 17.475 },
  { codigo_producto: '3755', stock_kilos: 101.4 },
  { codigo_producto: '3781', stock_kilos: 0 },
  { codigo_producto: '1218', stock_kilos: 25.425 },
  { codigo_producto: '3817', stock_kilos: 11.16 },
  { codigo_producto: '2842', stock_kilos: 0 },
  { codigo_producto: '8974', stock_kilos: 0 },
  { codigo_producto: '2420', stock_kilos: 0 },
  { codigo_producto: '3067', stock_kilos: 16.84 },
  { codigo_producto: '6442', stock_kilos: 7.565 },
  { codigo_producto: '5076', stock_kilos: 0 },
  { codigo_producto: '2406', stock_kilos: 2.015 },
  { codigo_producto: '4898', stock_kilos: 0.62 },
  { codigo_producto: '2266', stock_kilos: 0.745 },
  { codigo_producto: '6011', stock_kilos: 0 },
  { codigo_producto: '4998', stock_kilos: 0.72 },
  { codigo_producto: '4318', stock_kilos: 14.535 },
  { codigo_producto: '5933', stock_kilos: 0 },
  { codigo_producto: '3756', stock_kilos: 8.785 },
  { codigo_producto: '4186', stock_kilos: 0 },
  { codigo_producto: '2379', stock_kilos: 150.87 },
  { codigo_producto: '5072', stock_kilos: 0 },
  { codigo_producto: '5048', stock_kilos: 0 },
  { codigo_producto: '1068', stock_kilos: 0 },
  { codigo_producto: '2073', stock_kilos: 0 },
  { codigo_producto: '2443', stock_kilos: 0 },
  { codigo_producto: '1057', stock_kilos: 0 },
  { codigo_producto: '2265', stock_kilos: 0 },
  { codigo_producto: '2431', stock_kilos: 0 },
  { codigo_producto: '174', stock_kilos: 0 },
  { codigo_producto: '4027', stock_kilos: 0 },
  { codigo_producto: '2914', stock_kilos: 10.38 },
  { codigo_producto: '2634', stock_kilos: 0 },
  { codigo_producto: '8085', stock_kilos: 0 },
  { codigo_producto: '2450', stock_kilos: 5.495 },
  { codigo_producto: '3035', stock_kilos: 0 },
  { codigo_producto: '8016', stock_kilos: 0 },
  { codigo_producto: '2250', stock_kilos: 0 },
  { codigo_producto: '2427', stock_kilos: 0 },
  { codigo_producto: '1611', stock_kilos: 0 },
  { codigo_producto: '3491', stock_kilos: 0 },
  { codigo_producto: '4695', stock_kilos: 4.775 },
  { codigo_producto: '2934', stock_kilos: 0 },
  { codigo_producto: '2190', stock_kilos: 20.97 },
  { codigo_producto: '2218', stock_kilos: 36.03 },
  { codigo_producto: '7718', stock_kilos: 18.045 },
  { codigo_producto: '6572', stock_kilos: 3.47 },
  { codigo_producto: '2187', stock_kilos: 4.63 },
  { codigo_producto: '6598', stock_kilos: 10.105 },
  { codigo_producto: '2440', stock_kilos: 3.625 },
  { codigo_producto: '8010', stock_kilos: 105.93 },
  { codigo_producto: '4116', stock_kilos: 6.24 },
  { codigo_producto: '7105', stock_kilos: 8.665 },
  { codigo_producto: '2435', stock_kilos: 93.735 },
  { codigo_producto: '2404', stock_kilos: 23.89 }
]

async function seedSnapshots() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a la base de datos establecida.')

    await StockSnapshot.sync()
    console.log('Tabla stock_snapshots sincronizada.')

    const fechaCorte = new Date('2026-08-12T00:00:00')
    let inserted = 0
    let skipped = 0

    for (const item of snapshotData) {
      const [snap, created] = await StockSnapshot.findOrCreate({
        where: {
          codigo_producto: item.codigo_producto,
          fecha_corte: fechaCorte
        },
        defaults: {
          stock_kilos: item.stock_kilos,
          observaciones: 'Inventario Inicial Auditado 12/08/2026',
          usuario: 'Sistema'
        }
      })

      if (!created) {
        snap.stock_kilos = item.stock_kilos
        snap.observaciones = 'Inventario Inicial Auditado 12/08/2026 (Actualizado)'
        await snap.save()
        skipped++
      } else {
        inserted++
      }
    }

    console.log(`✅ Proceso finalizado: ${inserted} creados, ${skipped} actualizados. Total: ${snapshotData.length} productos procesados.`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error al insertar snapshots:', error)
    process.exit(1)
  }
}

seedSnapshots()
