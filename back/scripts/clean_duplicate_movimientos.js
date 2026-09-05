const { MovimientoStock, sequelize } = require('../src/models')

async function cleanDuplicates() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a BD establecida.')

    const allMovs = await MovimientoStock.findAll({
      order: [['fecha', 'ASC'], ['id', 'ASC']]
    })

    console.log(`Total movimientos en BD: ${allMovs.length}`)

    const idsToDelete = []

    for (let i = 0; i < allMovs.length; i++) {
      const current = allMovs[i]
      const concepto = current.concepto || ''
      const currentStock = parseFloat(current.stock) || 0

      // 1. Detectar duplicados de Sincronización BlockWMS donde se guardó el Stock Total en lugar del delta
      if (concepto.includes('Sincronización automática BlockWMS')) {
        const match = concepto.match(/Anterior:\s*([\d\.]+)/i)
        if (match && match[1]) {
          const prevStock = parseFloat(match[1]) || 0
          
          // Buscar si hay otra fila al mismo tiempo (mismo timestamp o +-10 seg) para el mismo producto
          const twin = allMovs.find((other, idx) => 
            idx !== i &&
            other.codigo_producto === current.codigo_producto &&
            Math.abs(new Date(other.fecha) - new Date(current.fecha)) < 10000 &&
            !idsToDelete.includes(other.id)
          )

          if (twin) {
            const twinStock = parseFloat(twin.stock) || 0
            // Si currentStock es igual o muy cercano al nuevo stock absoluto (y twinStock es el delta real)
            // O si currentStock es el valor absoluto positivo grande y twinStock es la diferencia
            if (Math.abs(currentStock - (prevStock + twinStock)) < 0.05 || (currentStock > 10 && Math.abs(twinStock) < Math.abs(currentStock))) {
              console.log(`[DELETE BAD WMS FULL-STOCK LOG] ID: ${current.id} | Fecha: ${current.fecha} | Cod: ${current.codigo_producto} | Stock Guardado: ${currentStock} kg (prev: ${prevStock} kg) | Twin Delta: ${twinStock} kg`)
              idsToDelete.push(current.id)
            }
          }
        }
      }

      // 2. Detectar duplicados de AUDITORIA_PIEZAS en el mismo segundo con el mismo peso
      if (current.tipo_movimiento === 'AUDITORIA_PIEZAS' && !idsToDelete.includes(current.id)) {
        const twinAudit = allMovs.find((other, idx) => 
          idx > i &&
          other.codigo_producto === current.codigo_producto &&
          other.tipo_movimiento === 'AUDITORIA_PIEZAS' &&
          Math.abs(new Date(other.fecha) - new Date(current.fecha)) < 3000 &&
          Math.abs(parseFloat(other.stock) - currentStock) < 0.001 &&
          !idsToDelete.includes(other.id)
        )

        if (twinAudit) {
          console.log(`[DELETE DUPLICATE AUDIT LOG] ID: ${twinAudit.id} | Fecha: ${twinAudit.fecha} | Cod: ${twinAudit.codigo_producto} | Stock: ${twinAudit.stock} kg`)
          idsToDelete.push(twinAudit.id)
        }
      }
    }

    console.log(`Encontrados ${idsToDelete.length} registros duplicados/erróneos para eliminar.`)

    if (idsToDelete.length > 0) {
      await MovimientoStock.destroy({
        where: {
          id: idsToDelete
        }
      })
      console.log(`✅ ${idsToDelete.length} registros duplicados eliminados correctamente de MariaDB.`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error durante la limpieza:', err)
    process.exit(1)
  }
}

cleanDuplicates()
