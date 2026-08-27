const axios = require('axios');
const XLSX = require('xlsx');

/**
 * Controller temporal para consultar, descargar y parsear el Excel de stock desde PHP.
 * GET /api/stock/debug?endpoint=excel_export.php | block_reporte_stock.php
 */
const consultarStockDebug = async (req, res) => {
  const startTime = Date.now();

  // Determinar qué script PHP consultar
  const targetScript = req.query.endpoint || 'excel_export.php';
  const targetUrl = `http://192.168.10.2/${targetScript}`;

  // Parámetros por defecto según especificación
  const defaultParams = {
    id_ordenes: '',
    accion: 'listar',
    filtro: '',
    h_trFiltros: '0',
    codigo_productos: '',
    lote: '',
    localidad_to_lote: '',
    serie: '',
    fecha_desde: '1900-01-01',
    fecha_hasta: '1900-01-01',
    stock_desde: '',
    stock_hasta: '',
    id_entidades_sites: '194326',
    id_layout_grupos_tipos: '0',
    codigo_layout_grupos: '',
    codigo_contenedores: '',
    custom2: '',
    custom3: '',
    custom4: '',
    custom5: ''
  };

  // Copiar query params quitando 'endpoint' para enviarlos al PHP
  const queryCopy = { ...req.query };
  delete queryCopy.endpoint;

  const params = { ...defaultParams, ...queryCopy };

  // Obtener la cookie de sesión desde la variable de entorno
  const phpSessionId = (process.env.PHP_SESSION_ID || '').trim();
  const hasSessionConfigured = Boolean(phpSessionId);

  // Configurar las cabeceras HTTP
  const requestHeaders = {
    'User-Agent': 'NodeJS-CDF-StockDebug/1.0',
    'Accept': '*/*'
  };

  if (hasSessionConfigured) {
    requestHeaders['Cookie'] = `PHPSESSID=${phpSessionId}`;
  }

  try {
    // 1. Consultar el endpoint PHP
    const response = await axios.get(targetUrl, {
      params,
      timeout: 15000,
      responseType: 'text',
      validateStatus: () => true,
      headers: requestHeaders
    });

    const contentType = response.headers['content-type'] || 'desconocido';
    const responseText = typeof response.data === 'string' ? response.data : String(response.data || '');

    // Detección de login expirado
    const isLoginPage = responseText.toLowerCase().includes('name="clave"') || 
                        responseText.toLowerCase().includes('name="usuario"') ||
                        responseText.toLowerCase().includes('iniciar sesión') || 
                        responseText.toLowerCase().includes('acceso al sistema') ||
                        responseText.toLowerCase().includes('id="login"');

    let sessionStatusMessage = '';
    let isSessionValid = false;

    if (!hasSessionConfigured) {
      sessionStatusMessage = 'No se ha configurado PHP_SESSION_ID en el archivo .env del backend.';
      isSessionValid = false;
    } else if (isLoginPage) {
      sessionStatusMessage = 'La sesión PHP ha expirado o no es válida (el servidor devolvió el formulario de login).';
      isSessionValid = false;
    } else if (response.status === 401 || response.status === 403) {
      sessionStatusMessage = `Sesión rechazada por el servidor con estado HTTP ${response.status}.`;
      isSessionValid = false;
    } else if (response.status >= 200 && response.status < 300) {
      sessionStatusMessage = 'Sesión PHP aceptada correctamente.';
      isSessionValid = true;
    } else {
      sessionStatusMessage = `El servidor respondió con código HTTP ${response.status}.`;
      isSessionValid = false;
    }

    let excelFileUrl = null;
    let parsedItems = null;
    let parseError = null;

    // 2. Si consultamos excel_export.php y la respuesta fue exitosa, intentar descargar y parsear el .xlsx
    if (isSessionValid && targetScript.includes('excel_export')) {
      const match = responseText.match(/href=['"]?([^'"\s>]+?\.xlsx)/i);
      if (match && match[1]) {
        let relativePath = match[1].replace(/\\/g, '/');
        if (!relativePath.startsWith('/')) {
          relativePath = '/' + relativePath;
        }
        excelFileUrl = `http://192.168.10.2${relativePath}`;

        try {
          // Descargar el archivo Excel binario
          const excelRes = await axios.get(excelFileUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: requestHeaders
          });

          // Parsear Excel a JSON usando la librería 'xlsx'
          const workbook = XLSX.read(excelRes.data, { type: 'buffer' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          parsedItems = XLSX.utils.sheet_to_json(worksheet);

        } catch (downloadErr) {
          console.error('[StockDebug Excel Parse Error]', downloadErr.message);
          parseError = `No se pudo descargar o parsear el archivo Excel: ${downloadErr.message}`;
        }
      } else {
        parseError = 'No se encontró el enlace al archivo .xlsx en la respuesta devuelta por excel_export.php';
      }
    }

    const durationMs = Date.now() - startTime;

    return res.json({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      contentType,
      durationMs,
      targetUrl,
      targetScript,
      hasSessionConfigured,
      isSessionValid,
      sessionStatusMessage,
      excelFileUrl,
      totalParsedItems: parsedItems ? parsedItems.length : 0,
      parsedItems,
      parseError,
      requestParams: params,
      headers: response.headers,
      data: response.data
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[StockDebug Controller Error]', error.message);

    return res.status(502).json({
      ok: false,
      status: error.response ? error.response.status : 502,
      statusText: error.code || 'NETWORK_ERROR',
      contentType: error.response?.headers?.['content-type'] || 'desconocido',
      durationMs,
      targetUrl,
      targetScript,
      hasSessionConfigured,
      isSessionValid: false,
      sessionStatusMessage: 'Error de red o conectividad al intentar llamar al servidor PHP.',
      requestParams: params,
      headers: error.response ? error.response.headers : null,
      error: error.message,
      errorCode: error.code,
      details: 'No se pudo conectar al endpoint PHP (192.168.10.2). Verifique conectividad de red, VPN o estado del servidor PHP.',
      data: error.response ? error.response.data : null
    });
  }
};

module.exports = {
  consultarStockDebug
};
