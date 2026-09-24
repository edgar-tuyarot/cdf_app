const wmsService = require('../services/wmsService');

/**
 * Helper para extraer credenciales dinámicas de las cabeceras HTTP del cliente
 */
const extractWmsCredentials = (req) => {
  const sessionId = req.headers['x-wms-session-id'] || req.query.sessionId || (req.body ? req.body.sessionId : '') || '';
  const siteId = req.headers['x-wms-site-id'] || req.query.siteId || (req.body ? req.body.siteId : '') || '194326';
  const host = req.headers['x-wms-host'] || req.query.host || (req.body ? req.body.host : '') || 'http://192.168.10.2';
  return { sessionId, siteId, host };
};

/**
 * Obtener estado de configuración
 */
const getConfig = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const config = wmsService.cargarConfiguracion();
    res.json({
      host: creds.host || config.host || 'http://192.168.10.2',
      siteId: creds.siteId || config.siteId || '194326',
      usuario: config.usuario || 'edgar',
      sessionId: creds.sessionId || config.sessionId || '',
      soloBorrador: Boolean(config.soloBorrador)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Guardar configuración en archivo wms_config.json
 */
const saveConfig = async (req, res, next) => {
  try {
    const configData = req.body || {};
    const updated = wmsService.guardarConfiguracion(configData);
    res.json({ ok: true, config: updated });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Probador de Login en BlockWMS
 */
const login = async (req, res, next) => {
  try {
    const { usuario, password, host, siteId } = req.body;
    const result = await wmsService.loginWMS({ usuario, password, host, siteId });
    res.json(result);
  } catch (error) {
    res.status(401).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Cerrar sesión en BlockWMS y limpiar credenciales activas del servidor
 */
const logout = async (req, res, next) => {
  try {
    const result = wmsService.logoutWMS();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getActiveWmsSession = () => {
  const cfg = wmsService.cargarConfiguracion();
  const activeSess = cfg.sessionId || wmsService.getActiveSessionId() || '';
  if (!activeSess) {
    return null;
  }
  return {
    sessionId: activeSess,
    siteId: cfg.siteId || '194326',
    host: cfg.host || 'http://192.168.10.2',
    usuario: cfg.usuario || ''
  };
};

/**
 * Obtener lista de productos parseados desde BlockWMS
 */
const getProductos = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const result = await wmsService.obtenerProductosWMS(creds);
    res.json({
      ok: true,
      totalItems: result.totalItems,
      excelFileUrl: result.excelFileUrl,
      items: result.items,
      productos: result.productos || result.items || [],
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Sincronizar cantidades de stock locales con las de BlockWMS
 */
const syncStock = async (req, res, next) => {
  try {
    const id_ubicacion = req.ubicacionId || 1;
    const usuarioEjecutor = req.user ? req.user.nombre : 'Administrador';
    const creds = extractWmsCredentials(req);

    const report = await wmsService.sincronizarStock(id_ubicacion, usuarioEjecutor, creds);
    const msg = `Sincronización finalizada: ${report.actualizados} productos actualizados (${report.coincidentes} de ${report.totalWms} productos WMS vinculados, ${report.sinCambios} sin variación de stock, ${report.noEncontradosCount} no en BD).`;
    res.json({
      ok: true,
      message: msg,
      mensaje: msg,
      report,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Obtener lista de motivos de ajuste disponibles en BlockWMS
 */
const getMotivos = async (req, res, next) => {
  try {
    const motivos = wmsService.obtenerMotivosAjusteWMS();
    res.json({ ok: true, motivos });
  } catch (error) {
    next(error);
  }
};

/**
 * Ejecutar un ajuste de stock en BlockWMS desde la app
 */
const ejecutarAjuste = async (req, res, next) => {
  try {
    const { codigoProducto, cantidad, operador, idMotivo, observaciones, ubicacion, lote, serie, fechaVencimiento, soloBorrador } = req.body;
    const creds = extractWmsCredentials(req);

    if (!codigoProducto || cantidad === undefined) {
      return res.status(400).json({ ok: false, error: 'Debe especificar el código de producto y la cantidad.' });
    }

    const result = await wmsService.ejecutarAjusteCompletoWMS({
      codigoProducto,
      cantidad,
      operador,
      idMotivo,
      observaciones,
      ubicacion,
      lote,
      serie,
      fechaVencimiento,
      soloBorrador,
      ...creds
    });

    res.json({
      ok: true,
      message: `Ajuste (${operador}) de ${cantidad} kg para producto '${codigoProducto}' procesado exitosamente en BlockWMS.`,
      result
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Obtener listado de entidades activas
 */
const getEntidades = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const entidades = await wmsService.obtenerEntidadesWMS(creds);
    res.json({ ok: true, entidades });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Obtener listado de sites/ubicaciones disponibles
 */
const getSitesDisponibles = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const id_ubicacion = req.query.id_ubicacion || req.headers['x-ubicacion-id'] || req.ubicacionId;
    const sites = await wmsService.obtenerSitesDisponiblesWMS(creds, id_ubicacion);
    res.json({ ok: true, sites });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Consultar stock en tiempo real de cualquier siteId/ubicación
 */
const getStockPorUbicacion = async (req, res, next) => {
  try {
    const siteId = req.params.siteId || req.headers['x-wms-site-id'];
    const creds = extractWmsCredentials(req);
    const result = await wmsService.obtenerStockPorUbicacionWMS(siteId || creds.siteId, creds);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Consulta el reporte de diferencias en órdenes de ingreso (recepción) desde BlockWMS
 */
const getReporteDiferenciasIngreso = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const filtros = {
      fechaAltaDesde: req.query.fechaAltaDesde || req.body?.fechaAltaDesde || '1900-01-01',
      fechaAltaHasta: req.query.fechaAltaHasta || req.body?.fechaAltaHasta || '1900-01-01',
      fechaCierreDesde: req.query.fechaCierreDesde || req.body?.fechaCierreDesde || new Date().toISOString().split('T')[0],
      fechaCierreHasta: req.query.fechaCierreHasta || req.body?.fechaCierreHasta || new Date().toISOString().split('T')[0],
      codigoOrdenes: req.query.codigoOrdenes || req.body?.codigoOrdenes || '',
      codigoProveedor: req.query.codigoProveedor || req.body?.codigoProveedor || '',
      codigoProducto: req.query.codigoProducto || req.body?.codigoProducto || '',
      diferencia: req.query.diferencia !== undefined ? req.query.diferencia : (req.body?.diferencia !== undefined ? req.body.diferencia : '-1'),
      lote: req.query.lote || req.body?.lote || '',
      operador: req.query.operador || req.body?.operador || '-1',
      asn: req.query.asn || req.body?.asn || '',
      wave: req.query.wave || req.body?.wave || ''
    };

    const result = await wmsService.obtenerReporteDiferenciasIngresoWMS(filtros, creds);
    res.json({
      ok: true,
      ...result,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Obtener listado de todas las tablas y vistas de BlockWMS
 */
const getTablas = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const result = await wmsService.obtenerTablasWMS(creds);
    res.json({
      ok: true,
      total: result.length,
      tablas: result
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Ejecutar una consulta SQL SELECT arbitraria contra BlockWMS
 */
const ejecutarConsultaSql = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const sql = req.body?.sql || req.query?.sql;
    if (!sql) {
      return res.status(400).json({ ok: false, error: 'Se requiere el parámetro sql' });
    }

    const result = await wmsService.consultarSqlWMS(sql, creds);
    res.json({
      ok: true,
      total: result.length,
      rows: result
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Consulta el stock consolidado por sucursal para un código de producto
 */
const getStockSucursales = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const codigoProducto = req.query.codigoProducto || req.body?.codigoProducto || req.query.codigo || req.body?.codigo || '';
    const result = await wmsService.obtenerStockSucursalesWMS(codigoProducto, creds);
    res.json({
      ok: true,
      ...result,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Consulta el stock matricial (productos x sucursales) para un grupo de siteIds
 */
const getStockSucursalesMatriz = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const siteIds = req.body?.siteIds || (req.query?.siteIds ? String(req.query.siteIds).split(',') : []);
    const codigoProducto = req.body?.codigoProducto || req.query?.codigoProducto || '';

    const result = await wmsService.obtenerStockMatrizSucursalesWMS({ siteIds, codigoProducto }, { ...creds, ubicacionId: req.ubicacionId || 1 });
    res.json({
      ok: true,
      ...result,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Consulta órdenes de ingreso (y sus ítems) por rango de fecha y site
 */
const getOrdenesIngreso = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const filtros = {
      siteId: req.query.siteId || req.body?.siteId || req.headers['x-wms-site-id'] || '194326',
      fechaDesde: req.query.fechaDesde || req.body?.fechaDesde || '',
      fechaHasta: req.query.fechaHasta || req.body?.fechaHasta || '',
      tipoComprobante: req.query.tipoComprobante || req.body?.tipoComprobante || req.query.documento || req.body?.documento || ''
    };

    const result = await wmsService.obtenerOrdenesIngresoWMS(filtros, creds);
    res.json({
      ok: true,
      ...result,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Suma los pesos recibidos de una orden de ingreso al campo 'recorte' de productos_stock
 */
const impactarRecortesOrden = async (req, res) => {
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();
  try {
    const { orden, items, destino } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ ok: false, error: 'Se requieren los ítems de la orden para impactar.' });
    }

    const isDecomiso = String(destino || '').toLowerCase() === 'decomiso';
    const campoTarget = isDecomiso ? 'decomiso' : 'recorte';
    const tipoMovimiento = isDecomiso ? 'INGRESO_DECOMISO' : 'INGRESO_RECORTE';
    const conceptoTexto = isDecomiso ? 'Ingreso a Decomisos' : 'Ingreso a Recortes';

    const { ProductoStock, MovimientoStock, Ubicacion, Producto, ProductoVencimiento } = require('../models');

    let id_ubicacion = req.ubicacionId;
    if (!id_ubicacion) {
      const ub = await Ubicacion.findOne({ transaction });
      id_ubicacion = ub ? ub.id : 1;
    }

    let itemsImpactados = 0;
    let totalKilosSumados = 0;

    for (const item of items) {
      const codigo = String(item.codigo || '').trim();
      const pesoRecibido = parseFloat(item.recibida !== undefined && item.recibida !== null ? item.recibida : (item.despachada !== undefined && item.despachada !== null ? item.despachada : 0));

      if (!codigo || pesoRecibido <= 0) continue;

      const productoExistente = await Producto.findByPk(codigo, { transaction });
      if (!productoExistente) {
        await Producto.create({
          codigo,
          nombre: String(item.producto || `Producto ${codigo}`).trim(),
          activo: true
        }, { transaction });
      }

      const [stockObj, created] = await ProductoStock.findOrCreate({
        where: {
          codigo_producto: codigo,
          id_ubicacion
        },
        defaults: {
          stock: 0.0000,
          recorte: isDecomiso ? 0.000 : pesoRecibido,
          decomiso: isDecomiso ? pesoRecibido : 0.000,
          kg_fraccionados: 0.000,
          cantidad_piezas: 0
        },
        transaction
      });

      if (!created) {
        const valActual = parseFloat(stockObj[campoTarget] || 0);
        const nuevoValor = parseFloat((valActual + pesoRecibido).toFixed(3));
        await stockObj.update({ [campoTarget]: nuevoValor }, { transaction });
      }

      // Procesar vencimiento y lote en la BBDD local (tabla producto_vencimientos)
      const vencimientoFecha = item.vencimiento ? String(item.vencimiento).trim() : null;
      const loteCode = item.loteVencimiento ? String(item.loteVencimiento).trim() : null;

      if (vencimientoFecha && vencimientoFecha !== '-') {
        const [vencObj, vencCreated] = await ProductoVencimiento.findOrCreate({
          where: {
            codigo_producto: codigo,
            vencimiento: vencimientoFecha,
            id_ubicacion
          },
          defaults: {
            piezas: 0,
            peso: pesoRecibido
          },
          transaction
        });

        if (!vencCreated) {
          const pesoVencActual = parseFloat(vencObj.peso || 0);
          const nuevoPesoVenc = parseFloat((pesoVencActual + pesoRecibido).toFixed(3));
          await vencObj.update({ peso: nuevoPesoVenc }, { transaction });
        }
      }

      const detalleVenc = (vencimientoFecha && vencimientoFecha !== '-') ? ` [Vto: ${vencimientoFecha}${loteCode ? ' Lote: ' + loteCode : ''}]` : '';

      const movData = {
        codigo_producto: codigo,
        id_ubicacion,
        tipo_movimiento: tipoMovimiento,
        referencia_id: null,
        concepto: `${conceptoTexto} desde Orden WMS Nº ${orden || 'S/N'}${detalleVenc}`,
        usuario: req.user ? req.user.nombre : 'Sistema',
        fecha: new Date()
      };
      if (isDecomiso) {
        movData.kg_decomiso = pesoRecibido;
      } else {
        movData.kg_recorte = pesoRecibido;
      }

      await MovimientoStock.create(movData, { transaction });

      itemsImpactados++;
      totalKilosSumados += pesoRecibido;
    }

    await transaction.commit();

    return res.json({
      ok: true,
      mensaje: `Se sumaron con éxito ${totalKilosSumados.toFixed(3)} kg al campo '${campoTarget}' de ${itemsImpactados} producto(s) en la base de datos local.`,
      itemsImpactados,
      totalKilosSumados: parseFloat(totalKilosSumados.toFixed(3)),
      destino: campoTarget
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al impactar orden:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error al actualizar stock en la base de datos.' });
  }
};

/**
 * Consulta órdenes de egreso / despacho / salida (y sus ítems) por rango de fecha y site
 */
const getOrdenesEgreso = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const filtros = {
      siteId: req.query.siteId || req.body?.siteId || req.headers['x-wms-site-id'] || '194326',
      fechaDesde: req.query.fechaDesde || req.body?.fechaDesde || '',
      fechaHasta: req.query.fechaHasta || req.body?.fechaHasta || '',
      tipoComprobante: req.query.tipoComprobante || req.body?.tipoComprobante || req.query.documento || req.body?.documento || ''
    };

    const result = await wmsService.obtenerOrdenesEgresoWMS(filtros, creds);
    res.json({
      ok: true,
      ...result,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Obtener órdenes de ingreso pendientes reales desde BlockWMS
 */
const getOrdenesIngresoPendientes = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const filtros = {
      search: req.query.search || req.body?.search || '',
      proveedor: req.query.proveedor || req.body?.proveedor || ''
    };

    const result = await wmsService.obtenerOrdenesIngresoPendientesWMS(filtros, creds);
    res.json({
      ok: true,
      ...result,
      wmsSession: getActiveWmsSession()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Procesar la recepción de una orden de ingreso WMS
 */
const procesarRecepcionOrden = async (req, res, next) => {
  try {
    const { ordenWms, idOrdenes, items, id_ubicacion, observaciones } = req.body;
    const creds = extractWmsCredentials(req);
    const usuarioEjecutor = req.user ? (req.user.nombre || req.user.username) : 'Sistema';

    if (!ordenWms || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'Debe especificar la orden WMS y al menos un ítem a recepcionar.' });
    }

    const result = await wmsService.procesarRecepcionOrdenWMS({
      ordenWms,
      idOrdenes,
      items,
      id_ubicacion: id_ubicacion || 1,
      observaciones,
      usuarioEjecutor
    }, creds);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};

/**
 * Registra vencimientos y lotes de los productos seleccionados de una orden de ingreso en producto_vencimientos
 */
const registrarVencimientosOrden = async (req, res) => {
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();
  try {
    const { orden, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ ok: false, error: 'Se requieren los ítems de la orden para registrar vencimientos.' });
    }

    const { MovimientoStock, Ubicacion, Producto, ProductoVencimiento } = require('../models');

    let id_ubicacion = req.ubicacionId;
    if (!id_ubicacion) {
      const ub = await Ubicacion.findOne({ transaction });
      id_ubicacion = ub ? ub.id : 1;
    }

    let itemsProcesados = 0;
    let totalKilosRegistrados = 0;

    for (const item of items) {
      const codigo = String(item.codigo || '').trim();
      const pesoRecibido = parseFloat(item.recibida !== undefined && item.recibida !== null ? item.recibida : (item.despachada !== undefined && item.despachada !== null ? item.despachada : 0));
      const vencimientoFecha = item.vencimiento ? String(item.vencimiento).trim() : null;
      const loteCode = item.loteVencimiento ? String(item.loteVencimiento).trim() : null;

      if (!codigo || !vencimientoFecha || vencimientoFecha === '-') continue;

      const productoExistente = await Producto.findByPk(codigo, { transaction });
      if (!productoExistente) {
        await Producto.create({
          codigo,
          nombre: String(item.producto || `Producto ${codigo}`).trim(),
          activo: true
        }, { transaction });
      }

      // Buscar o crear registro de vencimiento en BBDD local
      const [vencObj, vencCreated] = await ProductoVencimiento.findOrCreate({
        where: {
          codigo_producto: codigo,
          vencimiento: vencimientoFecha,
          id_ubicacion
        },
        defaults: {
          piezas: 0,
          peso: pesoRecibido
        },
        transaction
      });

      if (!vencCreated) {
        const pesoVencActual = parseFloat(vencObj.peso || 0);
        const nuevoPesoVenc = parseFloat((pesoVencActual + pesoRecibido).toFixed(3));
        await vencObj.update({ peso: nuevoPesoVenc }, { transaction });
      }

      // Crear registro de movimiento de stock para auditoría
      const movData = {
        codigo_producto: codigo,
        id_ubicacion,
        tipo_movimiento: 'REGISTRO_VENCIMIENTO',
        referencia_id: null,
        concepto: `Registro de Vencimiento (${vencimientoFecha}${loteCode ? ' Lote: ' + loteCode : ''}) desde Orden WMS Nº ${orden || 'S/N'}`,
        usuario: req.user ? req.user.nombre : 'Sistema',
        fecha: new Date()
      };

      await MovimientoStock.create(movData, { transaction });

      itemsProcesados++;
      totalKilosRegistrados += pesoRecibido;
    }

    await transaction.commit();

    if (itemsProcesados === 0) {
      return res.status(400).json({ ok: false, error: 'Ninguno de los productos seleccionados posee fecha de vencimiento ingresada.' });
    }

    return res.json({
      ok: true,
      mensaje: `Se registraron con éxito los vencimientos para ${itemsProcesados} producto(s) (${totalKilosRegistrados.toFixed(3)} kg) en la base de datos local.`,
      itemsProcesados,
      totalKilosRegistrados: parseFloat(totalKilosRegistrados.toFixed(3))
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar vencimientos de orden:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error al guardar vencimientos en la base de datos.' });
  }
};

/**
 * Obtiene el archivo PDF original de la orden generado directamente por Block WMS (pdf_export.php)
 */
const obtenerPdfOrdenWMS = async (req, res) => {
  const wmsService = require('../services/wmsService');
  try {
    const creds = extractWmsCredentials(req);
    const ordenNum = req.query.orden || req.body?.orden || '';

    const pdfBuffer = await wmsService.obtenerPdfOrdenWMS(ordenNum, creds);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Orden_Ingreso_${ordenNum || 'BlockWMS'}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al obtener PDF desde Block WMS:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error al descargar el PDF desde Block WMS.' });
  }
};

/**
 * Consulta de Reporte de Trazabilidad por Producto directamente en la BBDD de BlockWMS
 */
const getTrazabilidadBlockWMS = async (req, res, next) => {
  try {
    const creds = extractWmsCredentials(req);
    const codigo_producto = req.query.codigo_producto || req.query.codigo || (req.body ? req.body.codigo_producto || req.body.codigo : '');
    const fecha_desde = req.query.fecha_desde || req.query.fechaDesde || (req.body ? req.body.fecha_desde || req.body.fechaDesde : '');
    const fecha_hasta = req.query.fecha_hasta || req.query.fechaHasta || (req.body ? req.body.fecha_hasta || req.body.fechaHasta : '');

    const result = await wmsService.obtenerTrazabilidadBlockWMS({
      ...creds,
      codigo_producto,
      fecha_desde,
      fecha_hasta
    });

    res.json(result);
  } catch (error) {
    console.error('[wmsController] Error en getTrazabilidadBlockWMS:', error.message);
    const isTimeout = error.message && error.message.toLowerCase().includes('timeout');
    const msg = isTimeout 
      ? 'El servidor de BlockWMS tardó más de lo esperado en procesar la consulta para este rango de fechas extenso. Intenta seleccionar un rango de fechas más acotado (ej: 7 o 14 días).'
      : (error.message || 'Error al consultar trazabilidad en BlockWMS.');
    
    res.status(isTimeout ? 504 : 500).json({
      ok: false,
      error: msg
    });
  }
};

const getComparacionVariabilidad = async (req, res, next) => {
  try {
    if (req.setTimeout) req.setTimeout(300000);
    if (res.setTimeout) res.setTimeout(300000);
    const creds = extractWmsCredentials(req);
    const codigo1 = req.query.codigo1 || req.query.codigo_producto1 || (req.body ? req.body.codigo1 : '');
    const codigo2 = req.query.codigo2 || req.query.codigo_producto2 || (req.body ? req.body.codigo2 : '');
    const fecha_desde = req.query.fecha_desde || req.query.fechaDesde || (req.body ? req.body.fecha_desde : '');
    const fecha_hasta = req.query.fecha_hasta || req.query.fechaHasta || (req.body ? req.body.fecha_hasta : '');
    const solo_ajustes = req.query.solo_ajustes !== undefined ? req.query.solo_ajustes === 'true' : true;

    if (!codigo1 || !codigo2) {
      return res.status(400).json({
        ok: false,
        error: 'Debe especificar ambos códigos de producto (codigo1 y codigo2).'
      });
    }

    const result = await wmsService.compararVariabilidadProductosWMS({
      ...creds,
      codigo1,
      codigo2,
      fechaDesde: fecha_desde,
      fechaHasta: fecha_hasta,
      soloAjustes: solo_ajustes
    });

    res.json(result);
  } catch (error) {
    console.error('[wmsController] Error en getComparacionVariabilidad:', error.message);
    const isTimeout = error.message && error.message.toLowerCase().includes('timeout');
    const msg = isTimeout 
      ? 'El servidor de BlockWMS tardó más de lo esperado en responder. Intenta seleccionar un rango de fechas más acotado.'
      : (error.message || 'Error al comparar variabilidad de productos en BlockWMS.');
    res.status(isTimeout ? 504 : 500).json({ ok: false, error: msg });
  }
};

const guardarStockObjetivos = async (req, res, next) => {
  try {
    const items = req.body?.items || [];
    const result = await wmsService.guardarStockObjetivosWMS(items);
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

const calcularStockObjetivoHistorico = async (req, res, next) => {
  try {
    const params = req.body || {};
    const result = await wmsService.calcularStockObjetivoHistoricoWMS(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

const generarPedidoReposicion = async (req, res, next) => {
  try {
    const payload = req.body || {};
    payload.id_ubicacion = req.ubicacionId || 1;
    const result = await wmsService.generarPedidoReposicionWMS(payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

module.exports = {
  getConfig,
  saveConfig,
  login,
  logout,
  testLogin: login,
  getProductos,
  getEntidades,
  getSitesDisponibles,
  getStockPorUbicacion,
  getReporteDiferenciasIngreso,
  getStockSucursales,
  getStockSucursalesMatriz,
  getOrdenesIngreso,
  getOrdenesIngresoPendientes,
  procesarRecepcionOrden,
  getOrdenesEgreso,
  impactarRecortesOrden,
  registrarVencimientosOrden,
  obtenerPdfOrdenWMS,
  getTablas,
  ejecutarConsultaSql,
  syncStock,
  getMotivos,
  ejecutarAjuste,
  getTrazabilidadBlockWMS,
  getComparacionVariabilidad,
  guardarStockObjetivos,
  calcularStockObjetivoHistorico,
  generarPedidoReposicion
};
