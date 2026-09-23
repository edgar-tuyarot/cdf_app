const { sequelize, Sucursal, Producto, ProductoStock } = require('../models');

/**
 * Helper para formatear fechas YYYY-MM-DD
 */
function formatYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Detecta automáticamente el próximo día de despacho (Miércoles o Sábado)
 * basado en la fecha actual (hora local).
 */
function detectarProximoDiaDespacho(fechaBase = new Date()) {
  const diaSemana = fechaBase.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb

  // Si es Domingo (0), Lunes (1) o Martes (2) -> El próximo despacho es Miércoles
  if (diaSemana === 0 || diaSemana === 1 || diaSemana === 2) {
    const diasFaltantes = (3 - diaSemana);
    const fechaDespacho = new Date(fechaBase);
    fechaDespacho.setDate(fechaBase.getDate() + diasFaltantes);
    return {
      dia: 'miercoles',
      diaNombre: 'Miércoles',
      fechaEstimada: formatYYYYMMDD(fechaDespacho)
    };
  }

  // Si es Miércoles (3), Jueves (4) o Viernes (5) -> El próximo despacho es Sábado
  if (diaSemana === 3 || diaSemana === 4 || diaSemana === 5) {
    const diasFaltantes = (6 - diaSemana);
    const fechaDespacho = new Date(fechaBase);
    fechaDespacho.setDate(fechaBase.getDate() + diasFaltantes);
    return {
      dia: 'sabado',
      diaNombre: 'Sábado',
      fechaEstimada: formatYYYYMMDD(fechaDespacho)
    };
  }

  // Si es Sábado (6) -> El próximo despacho es el siguiente Miércoles (+4 días)
  const fechaDespacho = new Date(fechaBase);
  fechaDespacho.setDate(fechaBase.getDate() + 4);
  return {
    dia: 'miercoles',
    diaNombre: 'Miércoles',
    fechaEstimada: formatYYYYMMDD(fechaDespacho)
  };
}

/**
 * Controlador para calcular la proyección de consumo y faltantes de stock
 * para el próximo despacho a las 6 sucursales.
 */
const getProyeccionProximoDespacho = async (req, res) => {
  try {
    const { diaDespacho = 'auto', soloConConsumo = 'false' } = req.query;

    // 1. Determinar día de despacho objetivo
    let despachoInfo;
    if (diaDespacho === 'miercoles') {
      despachoInfo = { dia: 'miercoles', diaNombre: 'Miércoles', fechaEstimada: null };
    } else if (diaDespacho === 'sabado') {
      despachoInfo = { dia: 'sabado', diaNombre: 'Sábado', fechaEstimada: null };
    } else {
      despachoInfo = detectarProximoDiaDespacho();
    }

    // 2. Identificar las últimas 4 fechas históricas de ese ciclo
    // En CDF, los pedidos para el despacho del Miércoles se registran en pedidos los Martes (día 3) / Miércoles (día 4).
    // Los pedidos para el despacho del Sábado se registran los Viernes (día 6) / Sábados (día 7).
    const diasSemanaSql = despachoInfo.dia === 'miercoles' ? '3, 4' : '6, 7';

    const [fechasRows] = await sequelize.query(`
      SELECT DISTINCT fecha, DAYNAME(fecha) as dia_nombre
      FROM pedidos
      WHERE DAYOFWEEK(fecha) IN (${diasSemanaSql})
        AND estado IN ('Enviado', 'Completado', 'Pesado')
      ORDER BY fecha DESC
      LIMIT 4
    `);

    const fechasHistoricas = fechasRows.map(r => r.fecha);

    if (fechasHistoricas.length === 0) {
      return res.json({
        ok: true,
        despachoInfo,
        fechasHistoricas: [],
        resumen: {
          totalProductos: 0,
          productosOK: 0,
          productosFaltante: 0,
          productosJusto: 0,
          totalConsumoEsperadoKg: 0,
          totalFaltanteKg: 0
        },
        sucursales: [],
        productos: []
      });
    }

    // 3. Obtener las 6 sucursales activas
    const sucursalesDb = await Sucursal.findAll({ raw: true }).catch(() => []);
    let sucursales = sucursalesDb.map(s => s.sucursal).filter(Boolean);
    if (sucursales.length === 0) {
      sucursales = ['Ameghino', 'Cordoba', 'Italia', 'Laprida', 'Roca', 'Sarmiento'];
    }

    // 4. Obtener todos los productos y construir el mapa de hijos a madres
    const [productosDb] = await sequelize.query(`
      SELECT codigo, nombre, tipo_calculo_piezas, codigo_fraccionado, peso_pieza, peso_fraccion, peso_unidad, activo
      FROM productos
      ORDER BY nombre ASC
    `);

    // Mapa hijo -> { codigoMadre, nombreMadre }
    const hijoToMadreMap = new Map();
    productosDb.forEach(p => {
      const fracc = p.codigo_fraccionado ? String(p.codigo_fraccionado).trim() : '';
      if (fracc) {
        hijoToMadreMap.set(fracc, {
          codigoMadre: String(p.codigo).trim(),
          nombreMadre: p.nombre
        });
      }
    });

    // 5. Obtener stock actual del depósito central (id_ubicacion = 1)
    const [stockRows] = await sequelize.query(`
      SELECT codigo_producto, stock
      FROM productos_stock
      WHERE id_ubicacion = 1
    `);
    const stockMap = new Map();
    stockRows.forEach(r => stockMap.set(String(r.codigo_producto).trim(), parseFloat(r.stock) || 0));

    // 6. Obtener todos los despachos con peso_enviado para las fechas históricas seleccionadas
    const [despachosRows] = await sequelize.query(`
      SELECT 
        p.fecha,
        p.sucursal,
        pp.codigo_producto,
        pp.peso_enviado
      FROM pedidos p
      JOIN producto_pedidos pp ON pp.id_pedido = p.id
      WHERE p.fecha IN (:fechasHistoricas)
        AND p.estado IN ('Enviado', 'Completado', 'Pesado')
        AND pp.peso_enviado > 0
    `, { replacements: { fechasHistoricas } });

    // Agrupar despachos por producto y sucursal
    // Map: codigo_producto -> Map: sucursal -> Array: [{ fecha, peso_enviado }]
    const enviosMap = new Map();
    despachosRows.forEach(row => {
      const cod = String(row.codigo_producto).trim();
      const suc = String(row.sucursal).trim();
      const peso = parseFloat(row.peso_enviado) || 0;

      if (!enviosMap.has(cod)) enviosMap.set(cod, new Map());
      const sucMap = enviosMap.get(cod);
      if (!sucMap.has(suc)) sucMap.set(suc, []);
      sucMap.get(suc).push({ fecha: row.fecha, peso });
    });

    // 7. Obtener pedidos pendientes de preparar (estados 'Pendiente' y 'Preparando')
    const [pedidosPendientesRows] = await sequelize.query(`
      SELECT 
        p.id AS id_pedido,
        p.codigo AS pedido_codigo,
        p.sucursal,
        p.fecha,
        p.estado AS pedido_estado,
        pp.codigo_producto,
        pp.pieza,
        pp.fraccion,
        pp.peso_enviado,
        pp.cantidad_enviada,
        pp.fraccion_enviada
      FROM pedidos p
      JOIN producto_pedidos pp ON pp.id_pedido = p.id
      WHERE p.estado IN ('Pendiente', 'Preparando')
      ORDER BY p.fecha DESC, p.sucursal ASC
    `);

    // Mapa de pesos unitarios del catálogo
    const prodWeightsMap = new Map();
    productosDb.forEach(p => {
      prodWeightsMap.set(String(p.codigo).trim(), {
        pesoPieza: parseFloat(p.peso_pieza) || 0,
        pesoFraccion: parseFloat(p.peso_fraccion) || 0,
        pesoUnidad: parseFloat(p.peso_unidad) || 1,
        tipo: p.tipo_calculo_piezas || 'normal'
      });
    });

    // Agrupar pedidos pendientes por producto y consolidar pedidos únicos
    const pendientesMap = new Map();
    const pedidosPendientesSet = new Map(); // id_pedido -> { id, codigo, sucursal, fecha, estado }

    pedidosPendientesRows.forEach(row => {
      const cod = String(row.codigo_producto).trim();
      const pz = parseInt(row.pieza, 10) || 0;
      const fr = parseFloat(row.fraccion) || 0;

      if (!pedidosPendientesSet.has(row.id_pedido)) {
        pedidosPendientesSet.set(row.id_pedido, {
          id: row.id_pedido,
          codigo: row.pedido_codigo,
          sucursal: row.sucursal,
          fecha: row.fecha,
          estado: row.pedido_estado
        });
      }

      const wInfo = prodWeightsMap.get(cod) || { pesoPieza: 0, pesoFraccion: 0, pesoUnidad: 1, tipo: 'normal' };
      let kgEstimado = 0;
      if (wInfo.tipo === 'unidad') {
        kgEstimado = (pz * wInfo.pesoUnidad) + (fr * wInfo.pesoUnidad);
      } else if (wInfo.tipo === 'fraccionado') {
        const wFrac = wInfo.pesoFraccion > 0 ? wInfo.pesoFraccion : (wInfo.pesoPieza > 0 ? wInfo.pesoPieza : 0.25);
        const wPieza = wInfo.pesoPieza > 0 ? wInfo.pesoPieza : (wFrac * 2);
        kgEstimado = (pz * wPieza) + (fr * wFrac);
      } else {
        const wPieza = wInfo.pesoPieza > 0 ? wInfo.pesoPieza : 1;
        const wFrac = wInfo.pesoFraccion > 0 ? wInfo.pesoFraccion : wPieza;
        kgEstimado = (pz * wPieza) + (fr * wFrac);
      }

      if (!pendientesMap.has(cod)) {
        pendientesMap.set(cod, {
          totalKg: 0,
          totalPiezas: 0,
          totalFracciones: 0,
          pedidos: []
        });
      }

      const itemPend = pendientesMap.get(cod);
      itemPend.totalKg += kgEstimado;
      itemPend.totalPiezas += pz;
      itemPend.totalFracciones += fr;
      itemPend.pedidos.push({
        idPedido: row.id_pedido,
        codigoPedido: row.pedido_codigo,
        sucursal: row.sucursal,
        fecha: row.fecha,
        estado: row.pedido_estado,
        piezas: pz,
        fracciones: fr,
        kgEstimado: parseFloat(kgEstimado.toFixed(3))
      });
    });

    // 8. Calcular métricas por producto
    let totalConsumoEsperadoGlobal = 0;
    let totalFaltanteGlobal = 0;
    let totalKgPedidosPendientesGlobal = 0;
    let countOK = 0;
    let countFaltaFraccionar = 0;
    let countNoPedido = 0;
    let countFaltante = 0;
    let countSinStock = 0;
    let countJusto = 0;
    let countSinHistorial = 0;
    let countProyectadoSinPedido = 0;
    let countConPedidoReal = 0;

    const productosCalculados = productosDb.map(prod => {
      const codigo = String(prod.codigo).trim();
      const sucMap = enviosMap.get(codigo) || new Map();
      const stockActual = stockMap.get(codigo) || 0;

      const tieneMadre = hijoToMadreMap.has(codigo);
      const infoMadre = tieneMadre ? hijoToMadreMap.get(codigo) : null;
      const stockMadre = tieneMadre ? (stockMap.get(infoMadre.codigoMadre) || 0) : 0;

      let consumoEsperadoTotal = 0;
      let totalDespachosEncontrados = 0;
      const desgloseSucursales = {};

      sucursales.forEach(suc => {
        const enviosSuc = sucMap.get(suc) || [];
        const cantRegistros = enviosSuc.length;
        totalDespachosEncontrados += cantRegistros;

        const sumaKg = enviosSuc.reduce((acc, it) => acc + it.peso, 0);
        // Si existen menos de 4 registros históricos, utilizar los registros disponibles
        const promedioKg = cantRegistros > 0 ? (sumaKg / cantRegistros) : 0;

        consumoEsperadoTotal += promedioKg;

        desgloseSucursales[suc] = {
          sucursal: suc,
          cantRegistros,
          totalDespachosConsiderados: cantRegistros,
          sumaKg: parseFloat(sumaKg.toFixed(3)),
          promedioKg: parseFloat(promedioKg.toFixed(3)),
          envios: enviosSuc
        };
      });

      const consumoEsperado = parseFloat(consumoEsperadoTotal.toFixed(3));
      // stock proyectado = stock actual - consumo esperado
      const stockProyectado = parseFloat((stockActual - consumoEsperado).toFixed(3));

      // Datos de pedidos pendientes de preparar
      const infoPendiente = pendientesMap.get(codigo) || null;
      const pedidoPendienteKg = infoPendiente ? parseFloat(infoPendiente.totalKg.toFixed(3)) : 0;
      const pedidoPendientePiezas = infoPendiente ? infoPendiente.totalPiezas : 0;
      const pedidoPendienteFracciones = infoPendiente ? infoPendiente.totalFracciones : 0;
      const cantPedidosPendientes = infoPendiente ? infoPendiente.pedidos.length : 0;
      const desglosePedidosPendientes = infoPendiente ? infoPendiente.pedidos : [];

      const tienePedidoReal = pedidoPendienteKg > 0;
      // Proyectado pero nadie lo pidió en los pedidos actuales:
      const proyectadoSinPedido = (consumoEsperado > 0 && pedidoPendienteKg === 0);
      // Pedido en órdenes actuales pero sin proyección histórica:
      const pedidoSinProyeccion = (consumoEsperado === 0 && pedidoPendienteKg > 0);
      const diferenciaRealVsProyectado = parseFloat((pedidoPendienteKg - consumoEsperado).toFixed(3));

      if (proyectadoSinPedido) countProyectadoSinPedido++;
      if (tienePedidoReal) countConPedidoReal++;
      totalKgPedidosPendientesGlobal += pedidoPendienteKg;
      totalConsumoEsperadoGlobal += consumoEsperado;

      // Determinación de estado refinada según reglas de negocio CDF
      let estado = 'OK';
      let faltante = 0;

      if (tieneMadre) {
        // PRODUCTO FRACCIONADO (DERIVADO CON HORMAMADRE)
        // Regla CDF: Solo pasa a 'A FRACCIONAR' si alguna sucursal realmente lo pidió.
        // Si la proyección estima demanda pero nadie lo pidió en los pedidos pendientes, NO fraccionar -> NO_PEDIDO.
        if (pedidoPendienteKg === 0) {
          if (consumoEsperado > 0) {
            estado = 'NO_PEDIDO';
            countNoPedido++;
          } else {
            estado = stockActual > 0 ? 'OK_SIN_HISTORIAL' : 'SIN_HISTORIAL';
            countSinHistorial++;
          }
          faltante = 0;
        } else {
          // Alguien realmente lo pidió: evaluar si el stock actual alcanza
          const deficitReal = Math.max(0, parseFloat((pedidoPendienteKg - stockActual).toFixed(3)));
          if (deficitReal === 0) {
            estado = 'OK';
            countOK++;
            faltante = 0;
          } else {
            faltante = deficitReal;
            totalFaltanteGlobal += faltante;
            if (stockMadre >= deficitReal && stockMadre > 0) {
              // El stock de la horma madre alcanza para fraccionar lo requerido
              estado = 'FALTA_FRACCIONAR';
              countFaltaFraccionar++;
            } else {
              // La horma madre no tiene stock o es insuficiente para cubrir el pedido
              estado = 'SIN_STOCK';
              countSinStock++;
            }
          }
        }
      } else {
        // PRODUCTO ESTÁNDAR / DIRECTO (SIN MADRE)
        if (totalDespachosEncontrados === 0 && consumoEsperado === 0) {
          estado = stockActual > 0 ? 'OK_SIN_HISTORIAL' : 'SIN_HISTORIAL';
          countSinHistorial++;
        } else if (stockProyectado < 0) {
          faltante = parseFloat(Math.abs(stockProyectado).toFixed(3));
          totalFaltanteGlobal += faltante;
          if (stockActual <= 0) {
            estado = 'SIN_STOCK';
            countSinStock++;
          } else {
            estado = 'FALTANTE';
            countFaltante++;
          }
        } else if (stockProyectado === 0) {
          estado = 'JUSTO';
          countJusto++;
        } else {
          estado = 'OK';
          countOK++;
        }
      }

      return {
        codigo,
        nombre: prod.nombre,
        activo: Boolean(prod.activo),
        tipoCalculo: prod.tipo_calculo_piezas,
        codigoFraccionado: prod.codigo_fraccionado,
        tieneMadre,
        madre: tieneMadre ? {
          codigo: infoMadre.codigoMadre,
          nombre: infoMadre.nombreMadre,
          stock: parseFloat(stockMadre.toFixed(3))
        } : null,
        proximoDespacho: despachoInfo.diaNombre,
        consumoEsperado,
        stockActual: parseFloat(stockActual.toFixed(3)),
        diferencia: stockProyectado, // Positivo: sobra; Negativo: falta
        faltante,
        estado,
        // Nuevas propiedades de pedidos pendientes reales
        pedidoPendienteKg,
        pedidoPendientePiezas,
        pedidoPendienteFracciones,
        cantPedidosPendientes,
        tienePedidoReal,
        proyectadoSinPedido,
        pedidoSinProyeccion,
        diferenciaRealVsProyectado,
        desglosePedidosPendientes,
        totalDespachosHistoricos: totalDespachosEncontrados,
        tieneHistorialCompleto: totalDespachosEncontrados >= (sucursales.length * 2),
        desgloseSucursales
      };
    });

    // Filtrar opcionalmente si se solicita ver solo productos con consumo esperado > 0
    let resultadoFinal = productosCalculados;
    if (soloConConsumo === 'true') {
      resultadoFinal = resultadoFinal.filter(p => p.consumoEsperado > 0 || p.stockActual > 0 || p.pedidoPendienteKg > 0);
    }

    // Orden de prioridad en visualización
    const ordenPrioridad = {
      'FALTA_FRACCIONAR': 1,
      'FALTANTE': 2,
      'SIN_STOCK': 3,
      'JUSTO': 4,
      'OK': 5,
      'NO_PEDIDO': 6,
      'OK_SIN_HISTORIAL': 7,
      'SIN_HISTORIAL': 8
    };

    resultadoFinal.sort((a, b) => {
      const pA = ordenPrioridad[a.estado] || 99;
      const pB = ordenPrioridad[b.estado] || 99;
      if (pA !== pB) return pA - pB;
      if (a.faltante !== b.faltante) return b.faltante - a.faltante;
      return b.consumoEsperado - a.consumoEsperado;
    });

    return res.json({
      ok: true,
      despachoInfo: {
        dia: despachoInfo.dia,
        diaNombre: despachoInfo.diaNombre,
        fechaEstimada: despachoInfo.fechaEstimada,
        esAutoDetectado: diaDespacho === 'auto'
      },
      fechasHistoricas: fechasRows.map(r => ({
        fecha: r.fecha,
        dia: r.dia_nombre
      })),
      sucursales,
      resumen: {
        totalProductos: resultadoFinal.length,
        productosOK: countOK,
        productosFaltaFraccionar: countFaltaFraccionar,
        productosNoPedido: countNoPedido,
        productosFaltante: countFaltante,
        productosSinStock: countSinStock,
        productosJusto: countJusto,
        productosSinHistorial: countSinHistorial,
        // Métricas de pedidos pendientes
        totalPedidosPendientes: pedidosPendientesSet.size,
        pedidosPendientesInfo: Array.from(pedidosPendientesSet.values()),
        sucursalesConPedidosPendientes: Array.from(new Set(Array.from(pedidosPendientesSet.values()).map(p => p.sucursal))).filter(Boolean),
        productosConPedidoReal: countConPedidoReal,
        productosProyectadosSinPedido: countProyectadoSinPedido,
        totalKgPedidosPendientes: parseFloat(totalKgPedidosPendientesGlobal.toFixed(3)),
        totalConsumoEsperadoKg: parseFloat(totalConsumoEsperadoGlobal.toFixed(3)),
        totalFaltanteKg: parseFloat(totalFaltanteGlobal.toFixed(3))
      },
      productos: resultadoFinal
    });

  } catch (error) {
    console.error('[stockProximoDespachoController] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error al calcular la proyección de stock para el próximo despacho.'
    });
  }
};

module.exports = {
  getProyeccionProximoDespacho,
  detectarProximoDiaDespacho
};
