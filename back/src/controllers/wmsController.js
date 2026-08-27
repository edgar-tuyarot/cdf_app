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

const getActiveWmsSession = () => {
  const cfg = wmsService.cargarConfiguracion();
  return {
    sessionId: cfg.sessionId || '',
    siteId: cfg.siteId || '194326',
    host: cfg.host || 'http://192.168.10.2',
    usuario: cfg.usuario || 'edgar'
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
    const sites = await wmsService.obtenerSitesDisponiblesWMS(creds);
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

module.exports = {
  getConfig,
  saveConfig,
  login,
  testLogin: login,
  getProductos,
  getEntidades,
  getSitesDisponibles,
  getStockPorUbicacion,
  syncStock,
  getMotivos,
  ejecutarAjuste
};
