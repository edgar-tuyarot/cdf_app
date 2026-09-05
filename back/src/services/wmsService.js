const fs = require('fs');
const path = require('path');
const axios = require('axios');
const XLSX = require('xlsx');
const { Producto, ProductoStock, MovimientoStock, sequelize } = require('../models');

const CONFIG_FILE_PATH = path.join(__dirname, '../config/wms_config.json');

// Memoria para guardar la sesión activa
let activeSessionId = '';

/**
 * Carga la configuración desde el archivo JSON local o variables de entorno.
 */
const cargarConfiguracion = () => {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const json = JSON.parse(content);
      return {
        host: (json.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, ''),
        usuario: json.usuario !== undefined ? json.usuario : (process.env.WMS_USER || ''),
        password: json.password !== undefined ? json.password : (process.env.WMS_PASS || ''),
        siteId: json.siteId || process.env.WMS_SITE_ID || '194326',
        sessionId: (json.sessionId || process.env.PHP_SESSION_ID || '').trim(),
        soloBorrador: json.soloBorrador !== undefined ? json.soloBorrador : (process.env.WMS_SOLO_BORRADOR === 'true')
      };
    }
  } catch (e) {
    console.warn('[wmsService] Error al leer wms_config.json, usando defaults:', e.message);
  }
  return {
    host: (process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, ''),
    usuario: process.env.WMS_USER || '',
    password: process.env.WMS_PASS || '',
    siteId: process.env.WMS_SITE_ID || '194326',
    sessionId: (process.env.PHP_SESSION_ID || '').trim(),
    soloBorrador: process.env.WMS_SOLO_BORRADOR === 'true'
  };
};

/**
 * Guarda la configuración en wms_config.json.
 */
const guardarConfiguracion = (configData) => {
  try {
    const current = cargarConfiguracion();
    const updated = {
      ...current,
      ...configData
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (e) {
    console.error('[wmsService] Error al guardar wms_config.json:', e.message);
    throw new Error('No se pudo guardar la configuración en disco.');
  }
};

// Helper para extraer cantidades de stock de forma flexible
const extractStockValue = (obj) => {
  if (!obj || typeof obj !== 'object') return 0;
  
  // Prioridad 1: Buscar propiedad exacta de cantidad física
  if (obj.cantidad_fisica !== undefined && obj.cantidad_fisica !== null && obj.cantidad_fisica !== '') {
    const val = parseFloat(String(obj.cantidad_fisica).replace(',', '.'));
    if (!isNaN(val)) return val;
  }
  if (obj.stockFisico !== undefined && obj.stockFisico !== null && obj.stockFisico !== '') {
    const val = parseFloat(String(obj.stockFisico).replace(',', '.'));
    if (!isNaN(val)) return val;
  }
  if (obj.stock_fisico !== undefined && obj.stock_fisico !== null && obj.stock_fisico !== '') {
    const val = parseFloat(String(obj.stock_fisico).replace(',', '.'));
    if (!isNaN(val)) return val;
  }

  // Prioridad 2: Recorrer claves excluyendo 'cantidad_inventario'
  for (const key of Object.keys(obj)) {
    const k = key.toLowerCase().trim();
    if (k === 'cantidad_inventario') continue;
    if (k.includes('stock') || k.includes('cant') || k.includes('fisica') || k.includes('fisico')) {
      const raw = obj[key];
      if (raw !== undefined && raw !== null && raw !== '') {
        const val = parseFloat(String(raw).replace(',', '.'));
        if (!isNaN(val)) return val;
      }
    }
  }
  return 0;
};

// Helper para extraer código SKU de producto de forma flexible
const extractCodigoValue = (obj) => {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of Object.keys(obj)) {
    const k = key.toLowerCase().trim();
    if (k === 'codigo' || k === 'codigo_productos' || k === 'código' || k === 'id' || k === 'id_productos' || k === 'id_productos_presentaciones' || k.includes('codigo')) {
      const val = String(obj[key] || '').trim();
      if (val) return val;
    }
  }
  return String(obj.codigo || obj.codigo_productos || obj.ID || obj.id || '').trim();
};

// Helper para extraer descripción de producto de forma flexible
const extractNombreValue = (obj) => {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of Object.keys(obj)) {
    const k = key.toLowerCase().trim();
    if (k === 'nombre' || k === 'producto' || k === 'descri' || k === 'descripcion' || k === 'descripción' || k.includes('nombre') || k.includes('descri')) {
      const val = String(obj[key] || '').trim();
      if (val) return val;
    }
  }
  return String(obj.nombre || obj.producto || obj.descri || '').trim();
};

// Helper para ocultar o enmascarar secretos en logs (contraseñas, cookies completas)
const maskSecret = (val, maxLen = 3) => {
  if (!val || typeof val !== 'string') return '***';
  if (val.length <= maxLen * 2) return val[0] + '***' + val[val.length - 1];
  return val.substring(0, maxLen) + '...' + val.substring(val.length - maxLen);
};

// Helper de Logs detallados para llamadas HTTP a BlockWMS (seguro sin exponer contraseñas)
const logWmsRequest = (action, url, method, headers, params) => {
  console.log(`\n=================== [WMS LOG REQUEST: ${action}] ===================`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${method}`);
  
  const safeHeaders = { ...headers };
  if (safeHeaders['Cookie']) {
    safeHeaders['Cookie'] = safeHeaders['Cookie'].replace(/PHPSESSID=([^;]+)/i, (m, id) => `PHPSESSID=${maskSecret(id)}`);
  }
  console.log(`Headers: ${JSON.stringify(safeHeaders)}`);
  
  if (params) {
    let pStr = params.toString ? params.toString() : JSON.stringify(params);
    pStr = pStr.replace(/frmUserPass=([^&]+)/i, 'frmUserPass=****').replace(/clave=([^&]+)/i, 'clave=****');
    console.log(`Params/Body: ${pStr}`);
  }
  console.log(`===================================================================\n`);
};

const logWmsResponse = (action, status, data) => {
  console.log(`\n=================== [WMS LOG RESPONSE: ${action}] ===================`);
  console.log(`Status: ${status}`);
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data || '', null, 2);
  console.log(`Data Content (${dataStr.length} bytes):\n${dataStr.substring(0, 4000)}`);
  console.log(`====================================================================\n`);
};

/**
 * Detecta si una respuesta HTTP de BlockWMS contiene en realidad el formulario HTML de Login o Redirección.
 */
const isHtmlRedirectOrLogin = (data) => {
  if (!data) return false;
  const str = typeof data === 'string' ? data : (Buffer.isBuffer(data) ? data.toString('utf-8') : JSON.stringify(data));
  const lower = str.toLowerCase();
  return lower.includes('<form name="loginredir"') ||
         lower.includes('action="home.php"') ||
         lower.includes('document.loginredir') ||
         lower.includes('name="clave"') ||
         lower.includes('usuario incorrecto') ||
         lower.includes('clave incorrecta') ||
         (lower.includes('login.php') && lower.includes('<script>'));
};

/**
 * Detecta si la respuesta en buffer de excel_export.php es un archivo Excel ZIP (.xlsx) válido.
 */
const isBinaryXlsx = (data) => {
  if (!data) return false;
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
};

/**
 * Autentica contra el servidor PHP de BlockWMS enviando la estructura exacta del formulario HTML.
 */
const loginWMS = async (creds = {}) => {
  const host = (creds.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const usuario = (creds.usuario || process.env.WMS_USER || 'admin').trim();
  const password = creds.password !== undefined ? creds.password : (process.env.WMS_PASS || '1435');
  const siteId = creds.siteId || process.env.WMS_SITE_ID || '194326';

  if (!usuario || !password) {
    throw new Error('Debe proporcionar el usuario y la contraseña de BlockWMS.');
  }

  const loginUrl = `${host}/login.php`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0'
  };

  // Paso 0: Obtener cookie inicial enviando GET /login.php
  let initialCookie = '';
  try {
    const initGet = await axios.get(loginUrl, { headers, timeout: 5000, validateStatus: () => true });
    const setCookie = initGet.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      const match = setCookie.join(';').match(/PHPSESSID=([^;]+)/i);
      if (match && match[1]) initialCookie = match[1];
    }
  } catch (e) {}

  if (initialCookie) {
    headers['Cookie'] = `PHPSESSID=${initialCookie}`;
  }

  // Paso 1: Handshake de inicialización de entorno de base de datos en PHP (sys_block_DEPOT)
  const handshakeParams = new URLSearchParams({
    frmLogin: 'true',
    pstrLisSep: ',,',
    pstrDecSep: '.',
    accion: 'login_user',
    frmUserID: 'edgartu',
    frmUserPass: password,
    entorno: 'sys_block_DEPOT'
  });

  logWmsRequest('LOGIN_HANDSHAKE_INIT', loginUrl, 'POST', headers, handshakeParams);
  try {
    await axios.post(loginUrl, handshakeParams, { timeout: 8000, headers, validateStatus: () => true });
  } catch (e) {}

  // Paso 2: Autenticación real del usuario
  const params = new URLSearchParams({
    frmLogin: 'true',
    pstrLisSep: ',,',
    pstrDecSep: '.',
    accion: 'login_user',
    frmUserID: usuario,
    frmUserPass: password,
    entorno: 'sys_block_DEPOT'
  });

  logWmsRequest('LOGIN', loginUrl, 'POST', headers, params);

  try {
    const response = await axios.post(loginUrl, params, {
      timeout: 10000,
      headers,
      validateStatus: () => true
    });

    logWmsResponse('LOGIN', response.status, response.data);

    // Extraer cookie PHPSESSID actualizada si PHP envió Set-Cookie
    const setCookie = response.headers['set-cookie'];
    let sessionId = initialCookie;
    if (setCookie && setCookie.length > 0) {
      const match = setCookie.join(';').match(/PHPSESSID=([^;]+)/i);
      if (match && match[1]) {
        sessionId = match[1];
      }
    }

    if (!sessionId) {
      const envSession = (process.env.PHP_SESSION_ID || '').trim();
      if (envSession) sessionId = envSession;
    }

    if (!sessionId) {
      throw new Error('No se pudo establecer la sesión en BlockWMS. Verifique que las credenciales sean válidas.');
    }

    // Verificación activa del estado autenticado en home.php
    try {
      const verifyRes = await axios.get(`${host}/home.php`, {
        headers: {
          'Cookie': `PHPSESSID=${sessionId}`,
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 8000,
        validateStatus: () => true
      });

      const verifyStr = String(verifyRes.data || '').toLowerCase();
      if (verifyStr.includes('<title> login</title>') || isHtmlRedirectOrLogin(verifyRes.data)) {
        throw new Error('Credenciales rechazadas por BlockWMS (Usuario o Clave incorrectos).');
      }
    } catch (vErr) {
      if (vErr.message.includes('Credenciales rechazadas')) {
        throw vErr;
      }
    }

    activeSessionId = sessionId;
    try {
      const currentConfig = cargarConfiguracion();
      guardarConfiguracion({ ...currentConfig, sessionId, usuario, host, siteId });
    } catch (cfgErr) {}

    console.log(`[wmsService] Login exitoso y verificado en BlockWMS para usuario '${usuario}'. PHPSESSID: ${maskSecret(sessionId)}`);

    return {
      ok: true,
      sessionId,
      siteId,
      usuario,
      host,
      loginTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('[wmsService] Error en loginWMS:', error.message);
    const msg = error.message.includes('BlockWMS') || error.message.includes('Usuario') || error.message.includes('Credenciales')
      ? error.message
      : `Error al conectar con el servidor BlockWMS (${error.message})`;
    throw new Error(msg);
  }
};

/**
 * Garantiza una sesión PHPSESSID activa y válida contra BlockWMS.
 * Si caducó, se reloguea automáticamente de forma transparente.
 */
const ensureValidWmsSession = async (opts = {}) => {
  const config = cargarConfiguracion();
  let sessionId = (opts.sessionId || activeSessionId || config.sessionId || process.env.PHP_SESSION_ID || '').trim();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const usuario = (opts.usuario || config.usuario || process.env.WMS_USER || 'edgar').trim();
  const password = opts.password !== undefined ? opts.password : (config.password || process.env.WMS_PASS || '1435');

  let isValid = false;
  if (sessionId && !opts.forceRefresh) {
    try {
      const verifyRes = await axios.get(`${host}/index.php`, {
        headers: {
          'Cookie': `PHPSESSID=${sessionId}`,
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      if (!isHtmlRedirectOrLogin(verifyRes.data)) {
        isValid = true;
      }
    } catch (e) {
      isValid = false;
    }
  }

  if (!isValid) {
    console.log('[wmsService] PHPSESSID no válida o expirada. Ejecutando re-autenticación automática en BlockWMS...');
    try {
      const loginRes = await loginWMS({ usuario, password, host, siteId: opts.siteId || config.siteId });
      sessionId = loginRes.sessionId;
      activeSessionId = sessionId;
      guardarConfiguracion({ ...config, sessionId, usuario, host });
    } catch (err) {
      console.warn('[wmsService] Re-autenticación automática falló:', err.message);
    }
  }

  return sessionId;
};

/**
 * Obtiene los productos parseados en JSON desde BlockWMS.
 */
const obtenerProductosWMS = async (opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const siteId = opts.siteId || config.siteId || process.env.WMS_SITE_ID || '194326';
  
  // Garantizar sesión viva antes de solicitar stock
  let sessionId = await ensureValidWmsSession(opts);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Cookie': sessionId ? `PHPSESSID=${sessionId}` : '',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const reportHeaders = {
    ...headers,
    'Referer': `${host}/block_reporte_stock.php`,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': '*/*'
  };

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
    id_entidades_sites: siteId,
    id_layout_grupos_tipos: '0',
    codigo_layout_grupos: '',
    codigo_contenedores: '',
    custom2: '',
    custom3: '',
    custom4: '',
    custom5: ''
  };

  // 1. Método A: Invocar block_reporte_stock.php para inicializar reporte en la sesión PHP
  const reportUrl = `${host}/block_reporte_stock.php`;
  try {
    const initParams = new URLSearchParams(defaultParams);
    logWmsRequest('BLOCK_REPORTE_STOCK_INIT', reportUrl, 'POST', reportHeaders, initParams);
    const initRes = await axios.post(reportUrl, initParams, { headers: reportHeaders, timeout: 5000, validateStatus: () => true });
    logWmsResponse('BLOCK_REPORTE_STOCK_INIT', initRes.status, typeof initRes.data === 'string' ? initRes.data.substring(0, 500) : initRes.data);
  } catch (initErr) {
    console.warn('[wmsService] Advertencia al llamar block_reporte_stock.php:', initErr.message);
  }

  // 2. Método B: Invocación directa a proc_paginado_query.php con la consulta SQL exacta de BlockWMS
  try {
    const rawSql = `SELECT dbo.func_Entidades_GetCodigoEntidades(lg.id_entidades_sites) AS site, p.id_productos as ID, p.codigo_productos, pp.codigo_ean, p.descri as producto, pre.descri + '' x '' + dbo.func_FormatCantidad(pp.unidades,pre.decimales) as presentacion, lg.id_layout_grupos, ISNULL(lgt.codigo_layout_grupos_tipos,''NA'') as codigo_layout_grupos_tipos, ISNULL(lg.alias + ''>'' + lg.codigo_layout_grupos , lg.codigo_layout_grupos) AS ubicacion, i.cantidad_inventario, i.cantidad_fisica, CONVERT(VARCHAR(12),i.fecha_ult_mod,103) + '' '' + CONVERT(VARCHAR(8),i.fecha_ult_mod,108) as fecha_ult_mod, CONVERT(VARCHAR(12),i.fecha_ingreso,103) + '' '' + CONVERT(VARCHAR(8),i.fecha_ingreso,108) as fecha_ingreso, i.fecha_inventario, case i.lote when ''0'' then null else i.lote end as lote, case i.serie when ''0'' then null else i.serie end as serie, case i.fecha_vencimiento when ''19000101'' then null else CONVERT(VARCHAR(12),i.fecha_vencimiento,103) end as fecha_vencimiento, ISNULL(''P: '' + cp.codigo_contenedores,'''') + isnull('' C:'' + c.codigo_contenedores,''s/c'') as contenedor, pe.codigo_productos_estados, pre.decimales AS presicion_decimal, pp.custom1 as custom1,pp.custom2 as custom2,pp.custom3 as custom3,pp.custom4 as custom4,pp.custom5 as custom5, isnull(p.precio_costo,0.0) as valor, (isnull(p.precio_costo,0.0) * i.cantidad_fisica) as valor_total, (pp.alto * pp.ancho * pp.profundidad) * i.cantidad_fisica as volumen FROM inventario i join layout_grupos lg on lg.id_layout_grupos = i.id_layout_grupos join productos_presentaciones pp on pp.id_productos_presentaciones = i.id_productos_presentaciones join productos p on p.id_productos = pp.id_productos LEFT JOIN layout_grupos_tipos lgt on lgt.id_layout_grupos_tipos = lg.id_layout_grupos_tipos left join contenedores c on c.id_contenedores = i.id_contenedores LEFT JOIN Contenedores cp ON cp.id_contenedores=c.id_contenedores_parent left join presentaciones pre on pp.id_presentaciones = pre.id_presentaciones left join Productos_Estados pe on pe.id_productos_estados = i.id_productos_estados left join Productos_Grupos PG1 on PG1.id_productos_grupos = P.id_productos_grupos left join Productos_Grupos PG2 on PG2.id_productos_grupos = PG1.id_productos_grupos_parent left join Productos_Grupos PG3 on PG3.id_productos_grupos = PG2.id_productos_grupos_parent left join Productos_Grupos PG4 on PG4.id_productos_grupos = PG3.id_productos_grupos_parent WHERE 1=1 and (lg.id_entidades_sites = ${siteId} or ${siteId} = 0) ORDER by site, lg.id_layout_grupos, presentacion`;

    const queryParams = new URLSearchParams({
      draw: '1',
      start: '0',
      length: '5000',
      query: rawSql,
      entorno: 'sys_block_DEPOT'
    });

    logWmsRequest('PROC_PAGINADO_QUERY', `${host}/proc_paginado_query.php`, 'POST', reportHeaders, queryParams);
    const dtRes = await axios.post(`${host}/proc_paginado_query.php`, queryParams, { headers: reportHeaders, timeout: 10000, validateStatus: () => true });
    logWmsResponse('PROC_PAGINADO_QUERY', dtRes.status, typeof dtRes.data === 'string' ? dtRes.data.substring(0, 500) : (Array.isArray(dtRes.data) ? `Array[${dtRes.data.length}]` : dtRes.data));

    let dtData = dtRes.data;
    if (typeof dtData === 'string') {
      try { dtData = JSON.parse(dtData); } catch (e) {}
    }
    const rows = Array.isArray(dtData) ? dtData : (dtData?.data || dtData?.aaData || []);

    if (rows && rows.length > 0) {
      const localProds = await Producto.findAll();
      const localCodigosSet = new Set(localProds.map(p => String(p.codigo).trim()));

      const productosFormatted = rows.map(row => {
        const cod = extractCodigoValue(row);
        const idPres = String(row.ID || row.id_productos_presentaciones || cod).trim();
        const stockVal = extractStockValue(row);
        const eanVal = String(row.codigo_ean || row.ean || row.codigo_barras || '').trim();
        return {
          id_productos_presentaciones: idPres,
          codigo: cod || idPres,
          nombre: extractNombreValue(row),
          stockFisico: stockVal,
          stock: stockVal,
          ubicacion: row.ubicacion || '',
          lote: row.lote || '',
          ean: eanVal,
          existeEnBd: localCodigosSet.has(cod),
          activo: true
        };
      }).filter(p => p.codigo);

      if (productosFormatted.length > 0) {
        console.log(`[wmsService] ${productosFormatted.length} productos obtenidos vía proc_paginado_query.php con stock real.`);
        return {
          totalItems: productosFormatted.length,
          excelFileUrl: null,
          items: productosFormatted,
          productos: productosFormatted
        };
      }
    }
  } catch (eDt) {
    console.warn('[wmsService] Fallback de proc_paginado_query.php:', eDt.message);
  }

  // 3. Método C: Invocar excel_export.php recibiendo buffer binario o enlace HTML
  const exportUrl = `${host}/excel_export.php`;
  try {
    const expParams = new URLSearchParams(defaultParams);
    logWmsRequest('EXCEL_EXPORT', exportUrl, 'GET', reportHeaders, expParams);
    const expRes = await axios.get(exportUrl, {
      params: defaultParams,
      timeout: 15000,
      responseType: 'arraybuffer',
      validateStatus: () => true,
      headers: reportHeaders
    });
    logWmsResponse('EXCEL_EXPORT', expRes.status, `ArrayBuffer ${expRes.data ? expRes.data.byteLength : 0} bytes`);

    const buffer = Buffer.from(expRes.data || []);
    // Comprobar si la respuesta es directamente un archivo Excel (.xlsx empieza con cabecera ZIP 'PK' 0x50 0x4B)
    const isZipXlsx = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;

    let items = [];
    if (isZipXlsx) {
      console.log('[wmsService] excel_export.php retornó archivo .xlsx binario directamente. Parseando...');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      items = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
    } else {
      const responseText = buffer.toString('utf-8');
      const match = responseText.match(/href=['"]?([^'"\s>]+?\.xlsx)/i) || responseText.match(/([^\s'"\\]+?\.xlsx)/i);
      if (match && match[1]) {
        let relativePath = match[1].replace(/\\/g, '/');
        if (!relativePath.startsWith('/')) relativePath = '/' + relativePath;
        const excelFileUrl = `${host}${relativePath}`;
        console.log(`[wmsService] Descargando Excel desde enlace: ${excelFileUrl}`);
        const excelRes = await axios.get(excelFileUrl, { responseType: 'arraybuffer', timeout: 15000, headers: reportHeaders });
        const workbook = XLSX.read(Buffer.from(excelRes.data), { type: 'buffer' });
        items = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      }
    }

    if (items && items.length > 0) {
      const localProds = await Producto.findAll();
      const localCodigosSet = new Set(localProds.map(p => String(p.codigo).trim()));

      const productosFormatted = items.map(i => {
        const cod = extractCodigoValue(i);
        const idPres = String(i.ID || i.id_productos_presentaciones || i.id || cod).trim();
        const stockVal = extractStockValue(i);
        return {
          id_productos_presentaciones: idPres,
          codigo: cod || idPres,
          nombre: extractNombreValue(i),
          stockFisico: stockVal,
          stock: stockVal,
          ubicacion: i.ubicacion || '',
          lote: i.lote || '',
          ean: i.codigo_ean || '',
          existeEnBd: localCodigosSet.has(cod),
          activo: true
        };
      }).filter(p => p.codigo);

      console.log(`[wmsService] ${productosFormatted.length} productos procesados correctamente desde Excel WMS.`);
      return {
        totalItems: productosFormatted.length,
        excelFileUrl: exportUrl,
        items: productosFormatted,
        productos: productosFormatted
      };
    }
  } catch (expErr) {
    console.warn('[wmsService] Error/Timeout en excel_export.php:', expErr.message);
  }

  // Fallback final: Si BlockWMS no retornó registros por ningún canal, notificar o retornar catálogo local
  console.warn('[wmsService] BlockWMS no devolvió registros de stock. Cargando catálogo desde base de datos local...');
  const localProds = await Producto.findAll();
  const productosMap = localProds.map(p => ({
    codigo: p.codigo || p.id,
    nombre: p.nombre || p.descripcion || `Producto ${p.id}`,
    stockFisico: p.stock_fisico !== undefined ? p.stock_fisico : (p.stock || 0),
    stock: p.stock || 0,
    activo: p.activo !== false
  }));

  return {
    totalItems: productosMap.length,
    excelFileUrl: null,
    items: productosMap,
    productos: productosMap
  };
};

/**
 * Sincroniza las cantidades de stock locales con las de BlockWMS.
 */
const sincronizarStock = async (id_ubicacion = 1, usuarioEjecutor = 'Sistema WMS', opts = {}) => {
  const { productos, items } = await obtenerProductosWMS(opts);
  const prodsList = (productos && productos.length > 0) ? productos : items;

  const productosLocales = await Producto.findAll();
  const localMapByCodigo = {};
  const localMapByEan = {};
  const localMapByNombre = {};

  productosLocales.forEach(p => {
    if (p.codigo) localMapByCodigo[String(p.codigo).trim()] = p;
    if (p.codigo_barra) localMapByEan[String(p.codigo_barra).trim()] = p;
    if (p.nombre) localMapByNombre[String(p.nombre).trim().toLowerCase()] = p;
  });

  const detalles = [];
  const noEncontrados = [];
  const todos = [];
  let actualizadosCount = 0;

  const t = await sequelize.transaction();

  try {
    for (const item of prodsList) {
      const codigoWms = String(item.codigo || item.codigo_productos || item.ID || '').trim();
      const eanWms = String(item.ean || item.codigo_ean || item.codigo_barras || item.codigo_barra || '').trim();
      const nombreWms = String(item.nombre || item.producto || item.descri || '').trim();

      if (!codigoWms && !eanWms && !nombreWms) continue;

      const cantidadFisicaWms = item.stockFisico !== undefined ? parseFloat(item.stockFisico) : (parseFloat(item.cantidad_fisica) || parseFloat(item.stock) || 0);

      // Matcheo jerárquico: 1) por Código, 2) por EAN, 3) por Nombre Exacto
      let productoLocal = null;
      if (codigoWms && localMapByCodigo[codigoWms]) {
        productoLocal = localMapByCodigo[codigoWms];
      } else if (eanWms && localMapByEan[eanWms]) {
        productoLocal = localMapByEan[eanWms];
      } else if (nombreWms && localMapByNombre[nombreWms.toLowerCase()]) {
        productoLocal = localMapByNombre[nombreWms.toLowerCase()];
      }

      if (!productoLocal) {
        noEncontrados.push({
          codigo: codigoWms || eanWms || 'S/C',
          nombre: nombreWms || 'Desconocido',
          cantidad_fisica: cantidadFisicaWms
        });
        todos.push({
          codigo: codigoWms || eanWms || 'S/C',
          nombre: nombreWms || 'Desconocido',
          stockAnterior: '-',
          stockWms: cantidadFisicaWms,
          estado: 'NO_ENCONTRADO'
        });
        continue;
      }

      // Sincronizar el código de barras (EAN) en el producto local si viene desde WMS
      if (eanWms && productoLocal.codigo_barra !== eanWms) {
        productoLocal.codigo_barra = eanWms;
        await productoLocal.save({ transaction: t });
      }

      // Buscar o crear el registro ProductoStock para este producto y ubicación
      let [stockRecord] = await ProductoStock.findOrCreate({
        where: {
          codigo_producto: productoLocal.codigo,
          id_ubicacion
        },
        defaults: {
          codigo_producto: productoLocal.codigo,
          id_ubicacion,
          stock: cantidadFisicaWms,
          recorte: 0,
          decomiso: 0,
          kg_fraccionados: 0
        },
        transaction: t
      });

      const stockAnterior = parseFloat(stockRecord.stock) || 0;
      const stockNuevo = parseFloat(cantidadFisicaWms) || 0;
      const cambio = Math.abs(stockAnterior - stockNuevo) > 0.0001;

      // Actualizar la cantidad de stock si varió
      if (cambio) {
        stockRecord.stock = stockNuevo;
        await stockRecord.save({
          transaction: t,
          tipo_movimiento: 'AJUSTE_DIRECTO',
          concepto: `Sincronización automática BlockWMS (Anterior: ${stockAnterior.toFixed(3)} kg)`,
          usuario: usuarioEjecutor
        });

        actualizadosCount++;

        detalles.push({
          codigo: productoLocal.codigo,
          nombre: productoLocal.nombre,
          stockAnterior,
          stockNuevo: cantidadFisicaWms,
          diferencia: cantidadFisicaWms - stockAnterior
        });
      }

      todos.push({
        codigo: productoLocal.codigo,
        nombre: productoLocal.nombre,
        stockAnterior,
        stockWms: cantidadFisicaWms,
        estado: cambio ? 'ACTUALIZADO' : 'SIN_CAMBIOS'
      });
    }

    await t.commit();

    return {
      success: true,
      totalWms: prodsList.length,
      coincidentes: prodsList.length - noEncontrados.length,
      actualizados: actualizadosCount,
      sinCambios: (prodsList.length - noEncontrados.length) - actualizadosCount,
      noEncontradosCount: noEncontrados.length,
      noEncontrados,
      detalles,
      todos
    };

  } catch (error) {
    await t.rollback();
    console.error('[wmsService] Error en sincronizarStock:', error.message);
    throw error;
  }
};

/**
 * Lista los motivos de ajuste predefinidos en BlockWMS.
 */
const obtenerMotivosAjusteWMS = () => {
  return [
    { id: '54', nombre: 'Diferencia Stock' },
    { id: '24', nombre: 'Ajuste de Maquila' },
    { id: '55', nombre: 'Decomiso' },
    { id: '25', nombre: 'Merma-Pérdida' },
    { id: '27', nombre: 'Baja por consumo' },
    { id: '28', nombre: 'Elaboración del Sector' },
    { id: '53', nombre: 'Baja Merc p/Produccion Interna' },
    { id: '63', nombre: 'Alta p/Produccion Interna' },
    { id: '57', nombre: 'Baja Fiam p/ Envasado al vacío' },
    { id: '49', nombre: 'Baja fiambreria para picaditas' },
    { id: '58', nombre: 'Faltante de Proveedores' }
  ];
};

/**
 * Helper para extraer id_inventario e id_productos_presentaciones del HTML de BlockWMS.
 */
const parseExactProductIds = (html, codigoBuscado) => {
  if (!html) return null;

  const trMatches = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const exactCodePattern = new RegExp(`(?:\\[|>|\\b)${escapeRegex(codigoBuscado)}(?:\\]|<|\\b)`, 'i');

  const candidateRows = [];

  for (const trMatch of trMatches) {
    const trHtml = trMatch[0];
    if (exactCodePattern.test(trHtml)) {
      const matchOnclick = trHtml.match(/getProductoAndHide\s*\(\s*(\d+)\s*,\s*(\d+)/i) ||
                           trHtml.match(/getProducto\s*\(\s*(\d+)\s*,\s*(\d+)/i) ||
                           trHtml.match(/addItems\s*\(\s*(\d+)\s*,\s*(\d+)/i) ||
                           trHtml.match(/id_inventario=(\d+)&id_productos_presentaciones=(\d+)/i);

      let idInv = '0';
      let idPres = '0';

      if (matchOnclick && matchOnclick[1] && matchOnclick[2]) {
        idInv = matchOnclick[1];
        idPres = matchOnclick[2];
      } else {
        const matchTrId = trHtml.match(/id=['"]busqProdTR_i_(\d+)['"]/i);
        const matchPres = trHtml.match(/getProductoAndHide\s*\(\s*\d+\s*,\s*(\d+)/i) || trHtml.match(/check_codigo.*?codigo_productos=(\d+)/i);
        if (matchTrId && matchTrId[1]) {
          idInv = matchTrId[1];
          idPres = matchPres ? matchPres[1] : '0';
        }
      }

      if (idInv !== '0' || idPres !== '0') {
        const stockMatch = trHtml.match(/Stock\s*Fisico:\s*([\d.,]+)/i);
        const stockVal = stockMatch ? parseFloat(stockMatch[1].replace(',', '.')) : 0;

        candidateRows.push({
          idInventario: idInv,
          idProductosPresentaciones: idPres,
          stock: stockVal
        });
      }
    }
  }

  if (candidateRows.length > 0) {
    const rowWithStock = candidateRows.find(r => r.stock > 0);
    if (rowWithStock) {
      return {
        idInventario: rowWithStock.idInventario,
        idProductosPresentaciones: rowWithStock.idProductosPresentaciones
      };
    }
    return {
      idInventario: candidateRows[0].idInventario,
      idProductosPresentaciones: candidateRows[0].idProductosPresentaciones
    };
  }

  const matchGlobal = html.match(/getProductoAndHide\s*\(\s*(\d+)\s*,\s*(\d+)/i) ||
                      html.match(/getProducto\s*\(\s*(\d+)\s*,\s*(\d+)/i) ||
                      html.match(/addItems\s*\(\s*(\d+)\s*,\s*(\d+)/i) ||
                      html.match(/id_inventario=(\d+)&id_productos_presentaciones=(\d+)/i);

  if (matchGlobal && matchGlobal[1] && matchGlobal[2]) {
    return {
      idInventario: matchGlobal[1],
      idProductosPresentaciones: matchGlobal[2]
    };
  }

  return null;
};

/**
 * Ejecuta una orden de ajuste individual en BlockWMS.
 */
const ejecutarAjusteCompletoWMS = async ({
  codigoProducto,
  cantidad,
  operador = 'suma', // 'suma' | 'resta' | 'reemplaza'
  idMotivo = '54', // '54' = Diferencia Stock
  observaciones = 'Ajuste desde App CDF',
  ubicacion = '26-ST-00-00-00-00',
  lote = '',
  serie = '',
  fechaVencimiento = ''
}) => {
  return ejecutarAjusteMultipleWMS({
    items: [{
      codigoProducto,
      cantidad,
      operador,
      idMotivo,
      ubicacion,
      lote,
      serie,
      fechaVencimiento
    }],
    observaciones
  });
};

const activeAdjustmentLocks = new Set();

/**
 * Ejecuta una orden de ajuste agrupando múltiples renglones (bajas y altas) en una sola orden de BlockWMS.
 */
const ejecutarAjusteMultipleWMS = async (params = {}) => {
  const {
    items = [],
    observaciones = 'Conversión Fraccionado desde App CDF',
    soloBorrador = false,
    sessionId: paramSessionId,
    siteId: paramSiteId,
    host: paramHost
  } = params;

  if (!items || items.length === 0) {
    throw new Error('Debe especificar al menos un renglón para el ajuste en BlockWMS.');
  }

  const lockKey = `${observaciones}_${JSON.stringify(items)}`;
  if (activeAdjustmentLocks.has(lockKey)) {
    console.warn(`[wmsService] Operación de ajuste duplicada bloqueada en backend: ${observaciones}`);
    throw new Error('Esta operación de ajuste ya está siendo procesada en este momento. Por favor espere.');
  }
  activeAdjustmentLocks.add(lockKey);

  try {
    const config = cargarConfiguracion();
    const host = (paramHost || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
    const siteId = paramSiteId || config.siteId || process.env.WMS_SITE_ID || '194326';
    let sessionId = (paramSessionId || activeSessionId || config.sessionId || process.env.PHP_SESSION_ID || '').trim();

    if (!sessionId && config.usuario && config.password) {
      console.log('[wmsService] No hay sessionId activa. Intentando login automático en BlockWMS...');
      try {
        const loginRes = await loginWMS(config);
        sessionId = loginRes.sessionId;
      } catch (loginErr) {
        console.warn('[wmsService] Login automático falló:', loginErr.message);
      }
    }

    // Headers AJAX idénticos al navegador
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      'Cookie': `PHPSESSID=${sessionId}`,
      'Referer': `${host}/block_abm_ordenes_ajustes.php`,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': '*/*'
    };

    // 1. Crear la Orden de Ajuste en BlockWMS enviando accion=agregar
    const createOrderUrl = `${host}/block_abm_ordenes_ajustes.php`;
    const initParams = new URLSearchParams();
    initParams.append('t', '1');
    initParams.append('accion', 'agregar');
    initParams.append('id_ordenes', '0');
    initParams.append('parent_id', '0');
    initParams.append('id_entidades_sites', siteId);
    initParams.append('id_ordenes_documento', '3873');
    initParams.append('id_ordenes_tipos', '6');
    initParams.append('observaciones', `${observaciones}\r\n`);

    logWmsRequest('CREAR_ORDEN_AJUSTE', createOrderUrl, 'POST', headers, initParams);

    const initRes = await axios.post(createOrderUrl, initParams, {
      timeout: 15000,
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: () => true
    });
    
    logWmsResponse('CREAR_ORDEN_AJUSTE', initRes.status, initRes.data);
    const initHtml = String(initRes.data || '');

    // Extraer el nuevo id_ordenes mayor a 0 con flexibilidad de atributos HTML
    const matchesAttr = [...initHtml.matchAll(/name=["']id_ordenes["'][^>]*value=["']([1-9]\d*)["']/gi)]
      .concat([...initHtml.matchAll(/value=["']([1-9]\d*)["'][^>]*name=["']id_ordenes["']/gi)]);
    let idOrdenes = '';

    if (matchesAttr.length > 0) {
      idOrdenes = matchesAttr[matchesAttr.length - 1][1];
    } else {
      const matchSql = initHtml.match(/id_ordenes\s*=\s*['"]?([1-9]\d*)['"]?/i) || initHtml.match(/voai\.id_ordenes\s*=\s*['"]?([1-9]\d*)['"]?/i);
      if (matchSql) {
        idOrdenes = matchSql[1];
      }
    }

    const matchDoc = initHtml.match(/id_ordenes_documento.*?value=['"](\d+)['"].*?selected/i) || initHtml.match(/name="id_ordenes_documento".*?value=['"](\d+)['"]/i);
    const idDocumento = matchDoc ? matchDoc[1] : '3873';

    if (!idOrdenes || idOrdenes === '0') {
      console.error('[wmsService] No se pudo obtener id_ordenes > 0. Inicio HTML:', initHtml.substring(0, 400));
      throw new Error('BlockWMS no devolvió un número de orden de ajuste activo (id_ordenes es 0). Verifique que la sesión PHPSESSID esté vigente.');
    }

  const renglonesProcesados = [];

  // Helper de pausa asíncrona
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 2. Iterar sobre cada renglón y agregarlo a la misma orden en BlockWMS
  for (const item of items) {
    const codigoProducto = String(item.codigoProducto || item.codigo || '').trim();
    const cantidad = parseFloat(item.cantidad) || 0;
    const operador = item.operador || 'suma';
    const idMotivo = item.idMotivo || '54';
    const ubicacion = item.ubicacion || '26-ST-00-00-00-00';
    const lote = item.lote || '';
    const serie = item.serie || '';
    const fechaVencimiento = item.fechaVencimiento || '';

    if (!codigoProducto || cantidad <= 0) continue;

    let idInventario = '0';
    let idProductosPresentaciones = '0';

    // 2.1 Intentar búsqueda con ubicación específica (minúscula y mayúscula)
    let searchUrl = `${host}/proc_productos.php?accion=div_busco_producto_ajuste_stock&producto=${encodeURIComponent(codigoProducto)}&codigo_layout_grupos=${encodeURIComponent(ubicacion.toLowerCase())}&id_entidades_sites=${config.siteId || '194326'}&width=300px`;
    let searchRes = await axios.get(searchUrl, { timeout: 15000, responseType: 'text', headers });
    let searchHtml = String(searchRes.data || '');
    let exactResult = parseExactProductIds(searchHtml, codigoProducto);

    if (exactResult) {
      idInventario = exactResult.idInventario;
      idProductosPresentaciones = exactResult.idProductosPresentaciones;
    } else {
      searchUrl = `${host}/proc_productos.php?accion=div_busco_producto_ajuste_stock&producto=${encodeURIComponent(codigoProducto)}&codigo_layout_grupos=${encodeURIComponent(ubicacion)}&id_entidades_sites=${config.siteId || '194326'}&width=300px`;
      searchRes = await axios.get(searchUrl, { timeout: 15000, responseType: 'text', headers });
      searchHtml = String(searchRes.data || '');
      exactResult = parseExactProductIds(searchHtml, codigoProducto);

      if (exactResult) {
        idInventario = exactResult.idInventario;
        idProductosPresentaciones = exactResult.idProductosPresentaciones;
      } else {
        // 2.2 Intentar búsqueda general por código sin restringir ubicación
        searchUrl = `${host}/proc_productos.php?accion=div_busco_producto_ajuste_stock&producto=${encodeURIComponent(codigoProducto)}&id_entidades_sites=${config.siteId || '194326'}&width=300px`;
        searchRes = await axios.get(searchUrl, { timeout: 15000, responseType: 'text', headers });
        searchHtml = String(searchRes.data || '');
        exactResult = parseExactProductIds(searchHtml, codigoProducto);

        if (exactResult) {
          idInventario = exactResult.idInventario;
          idProductosPresentaciones = exactResult.idProductosPresentaciones;
        } else {
          // 2.3 Fallback con el servicio check_codigo
          const fallbackSearchUrl = `${host}/proc_productos.php?accion=check_codigo&codigo_productos=${encodeURIComponent(codigoProducto)}`;
          const fallbackRes = await axios.get(fallbackSearchUrl, { timeout: 15000, responseType: 'text', headers });
          const matchFallback = String(fallbackRes.data || '').match(/(\d+)/);
          if (matchFallback) {
            idProductosPresentaciones = matchFallback[1];
          }
        }
      }
    }

    // Step 1: Agregar Renglón a la Orden forzando id_inventario=0 para evitar que SQL Server copie lote/vencimiento defectuosos
    const addUrl = `${host}/proc_ordenes.php?accion=add_producto_orden_ajuste&id_ordenes=${idOrdenes}&id_productos_presentaciones=${idProductosPresentaciones}&id_inventario=0`;
    const addRes = await axios.get(addUrl, { timeout: 15000, responseType: 'text', headers });
    const addText = String(addRes.data || '').trim();

    // El servidor responde directamente con el ID del renglón (ej: 18606301)
    const matchItem = addText.match(/^(\d+)$/) || addText.match(/(\d+)/);
    const idOrdenesItems = matchItem ? matchItem[1] : '1';

    await delay(200);

    // Step 2: Refrescar la orden en la sesión PHP de BlockWMS
    const getItemsUrl = `${host}/proc_ordenes.php?accion=get_ordenes_ajustes_items&id_ordenes=${idOrdenes}&id_entidades_sites=${config.siteId || '194326'}`;
    await axios.get(getItemsUrl, { timeout: 15000, responseType: 'text', headers });

    await delay(200);

    // Pasar '0' y '1900-01-01' si están vacíos para que PHP procese el UPDATE y SQL Server asigne NULL/por defecto
    const rawLote = String(lote || '').trim();
    const rawSerie = String(serie || '').trim();
    const rawVenc = String(fechaVencimiento || '').trim();

    const cleanLote = (rawLote !== '') ? rawLote : '0';
    const cleanSerie = (rawSerie !== '') ? rawSerie : '0';
    const cleanVenc = (rawVenc !== '') ? rawVenc : '1900-01-01';

    // Step 3: Guardar Renglón y esperar confirmación #OK del servidor PHP
    const saveItemUrl = `${host}/proc_ordenes.php?accion=save_producto_orden_ajuste&id_entidades_sites=${config.siteId || '194326'}&id_ordenes_items=${idOrdenesItems}&cantidad=${cantidad}&id_motivos=${idMotivo}&operador=${operador}&codigo_layout_grupos=${encodeURIComponent(ubicacion)}&codigo_contenedores=&lote=${encodeURIComponent(cleanLote)}&serie=${encodeURIComponent(cleanSerie)}&fecha_vencimiento=${encodeURIComponent(cleanVenc)}&id_productos_estados=1&codigo_contenedores_parent=`;

    const saveRes = await axios.get(saveItemUrl, { timeout: 15000, responseType: 'text', headers });
    const saveText = String(saveRes.data || '').trim();
    console.log(`[wmsService] Orden #${idOrdenes} | Renglón ${idOrdenesItems} (${codigoProducto}): '${saveText}'`);

    await delay(200);

    renglonesProcesados.push({
      idOrdenesItems,
      codigoProducto,
      idInventario,
      idProductosPresentaciones,
      cantidad,
      operador,
      idMotivo,
      phpSaveResult: saveText
    });
  }

  // Refrescar el borrador completo de la orden en la sesión PHP
  await axios.get(`${host}/block_abm_ordenes_ajustes.php?t=1&accion=ok&id_ordenes=${idOrdenes}&parent_id=0`, { timeout: 15000, responseType: 'text', headers });
  await delay(300);

  // Si se solicitó dejar la orden en borrador (Pendiente sin confirmar el ajuste)
  if (soloBorrador || config.soloBorrador || process.env.WMS_SOLO_BORRADOR === 'true') {
    console.log(`[wmsService] Orden #${idOrdenes} generada en borrador (Estado: Pendiente).`);
    return {
      ok: true,
      idOrdenes,
      idDocumento,
      totalRenglones: renglonesProcesados.length,
      renglones: renglonesProcesados,
      estado: 'Pendiente (Borrador)'
    };
  }

  // Step 4: Confirmar y Realizar el Ajuste Definitivo en WMS por POST
  const commitUrl = `${host}/block_abm_ordenes_ajustes.php`;
  const postParams = new URLSearchParams();
  postParams.append('accion', 'ajustar');
  postParams.append('id_ordenes', idOrdenes);
  postParams.append('id_ordenes_tipos', '6');
  postParams.append('id_entidades_sites', siteId);
  postParams.append('id_ordenes_documento', idDocumento);
  postParams.append('producto', '');
  postParams.append('observaciones', `${observaciones}\r\n`);

  logWmsRequest('CONFIRMAR_AJUSTE_DEFINITIVO', commitUrl, 'POST', headers, postParams);

  const commitRes = await axios.post(commitUrl, postParams, {
    timeout: 15000,
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    validateStatus: () => true
  });

  logWmsResponse('CONFIRMAR_AJUSTE_DEFINITIVO', commitRes.status, commitRes.data);
  const commitText = String(commitRes.data || '');

  const messageMatch = commitText.match(/@@MESSAGE@@(.*?)['"<]/i) ||
                       commitText.match(/jAlert\s*\(\s*['"]([^'"]+)['"]/i) ||
                       commitText.match(/alert\s*\(\s*['"]([^'"]+)['"]/i);

  if (messageMatch) {
    console.log(`[wmsService] ALERTA DETECTADA EN POST AJUSTAR: "${messageMatch[1]}"`);
  }

  console.log(`[wmsService] Orden #${idOrdenes} ajustada y confirmada exitosamente en BlockWMS.`);

  return {
    ok: commitRes.status >= 200 && commitRes.status < 300,
    idOrdenes,
    idDocumento,
    totalRenglones: renglonesProcesados.length,
    renglones: renglonesProcesados,
    wmsResponseStatus: commitRes.status,
    wmsAlertMessage: messageMatch ? messageMatch[1] : null,
    estado: 'Confirmada'
  };
  } finally {
    activeAdjustmentLocks.delete(lockKey);
  }
};

/**
 * Obtiene el listado completo de entidades (clientes / sucursales / depósitos) activas en BlockWMS
 */
const obtenerEntidadesWMS = async () => {
  const config = cargarConfiguracion();
  const host = config.host || 'http://192.168.10.2';
  let sessionId = activeSessionId || (process.env.PHP_SESSION_ID || '').trim() || config.sessionId;

  if (!sessionId && config.usuario && config.password) {
    const loginRes = await loginWMS();
    sessionId = loginRes.sessionId;
  }

  const sql = "SELECT id_entidades, codigo_entidades, razon_social FROM entidades WHERE activo = 1 ORDER BY razon_social ASC";
  const headers = { 'Cookie': `PHPSESSID=${sessionId}` };

  const ajaxParams = new URLSearchParams();
  ajaxParams.append('query', sql);
  ajaxParams.append('draw', '1');
  ajaxParams.append('start', '0');
  ajaxParams.append('length', '500');

  try {
    const res = await axios.post(`${host}/proc_paginado_query.php`, ajaxParams, { headers, timeout: 15000, validateStatus: () => true });
    const data = Array.isArray(res.data) ? res.data : [];
    
    return data.map(e => ({
      id_entidades: e.id_entidades,
      codigo: e.codigo_entidades,
      razon_social: e.razon_social
    }));
  } catch (err) {
    console.warn('[wmsService] Error al obtener entidades desde SQL, usando lista por defecto:', err.message);
    return [
      { id_entidades: 194326, codigo: '26', razon_social: 'Distribución. Fiambrería Chaco (DEPOT 026)' },
      { id_entidades: 190463, codigo: '22', razon_social: 'DEPOT 022' }
    ];
  }
};

/**
 * Obtiene las ubicaciones/sites disponibles en BlockWMS.
 */
const obtenerSitesDisponiblesWMS = async () => {
  const config = cargarConfiguracion();
  const host = config.host || 'http://192.168.10.2';
  let sessionId = activeSessionId || (process.env.PHP_SESSION_ID || '').trim() || config.sessionId;

  if (!sessionId && config.usuario && config.password) {
    const loginRes = await loginWMS();
    sessionId = loginRes.sessionId;
  }

  const headers = {
    'Cookie': sessionId ? `PHPSESSID=${sessionId}` : '',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const sql = "SELECT DISTINCT lg.id_entidades_sites, e.razon_social, e.nombre_fantasia FROM layout_grupos lg LEFT JOIN entidades e ON lg.id_entidades_sites = e.id_entidades";
  const ajaxParams = new URLSearchParams();
  ajaxParams.append('query', sql);
  ajaxParams.append('draw', '1');
  ajaxParams.append('start', '0');
  ajaxParams.append('length', '500');

  try {
    const res = await axios.post(`${host}/proc_paginado_query.php`, ajaxParams, { headers, timeout: 10000, validateStatus: () => true });
    const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);

    const sites = rawData.map(item => ({
      siteId: String(item.id_entidades_sites),
      nombre: String(item.nombre_fantasia || item.razon_social || `Site ${item.id_entidades_sites}`).trim(),
      razonSocial: String(item.razon_social || '').trim()
    })).filter(s => s.siteId && s.nombre).sort((a, b) => a.nombre.localeCompare(b.nombre));

    return sites;
  } catch (err) {
    console.warn('[wmsService] Error al obtener sites de BlockWMS:', err.message);
    return [
      { siteId: '194326', nombre: 'Distribución. Fiambrería Chaco (DEPOT 026)', razonSocial: 'Distribución. Fiambrería Chaco' },
      { siteId: '190463', nombre: 'DEPOT 022', razonSocial: 'DEPOT 022' },
      { siteId: '106410', nombre: 'Deposito Central', razonSocial: 'Deposito Central' }
    ];
  }
};

/**
 * Consulta las existencias físicas en tiempo real de cualquier depósito/siteId en BlockWMS.
 */
const obtenerStockPorUbicacionWMS = async (siteIdParam, opts = {}) => {
  const config = cargarConfiguracion();
  const siteId = String(siteIdParam || opts.siteId || config.siteId || '194326').trim();
  if (!siteId) throw new Error('Debe especificar un siteId válido.');

  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  let numStr = siteId;
  if (!isNaN(parseInt(siteId, 10)) && parseInt(siteId, 10) < 100) {
    numStr = String(parseInt(siteId, 10)).padStart(2, '0');
  }

  const sEscaped = siteId.replace(/'/g, "''");
  const nEscaped = numStr.replace(/'/g, "''");

  const rawSql = `SELECT site, codigo_productos AS codigo, producto AS nombre, SUM(cantidad_fisica) AS stockFisico FROM view_Reporte_StockXUbicacion WHERE (id_entidades_sites = ''${sEscaped}'' OR site LIKE ''%${sEscaped}%'' OR site LIKE ''%${nEscaped}%'') GROUP BY site, codigo_productos, producto HAVING SUM(cantidad_fisica) > 0 ORDER BY codigo_productos`;

  const queryPayload = new URLSearchParams({
    query: rawSql,
    start: '0',
    length: '10000'
  });

  let rows = [];
  try {
    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 30000 });
    let data = res.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = []; }
    }
    if (Array.isArray(data)) {
      rows = data;
    }
  } catch (err) {
    console.warn('[wmsService] Error en consulta SQL de stock por sucursal:', err.message);
  }

  const productos = rows.map(r => ({
    codigo: String(r.codigo || r.codigo_productos || '').trim(),
    nombre: String(r.nombre || r.producto || '').trim(),
    stockFisico: parseFloat(parseFloat(r.stockFisico || r.cantidad_fisica || 0).toFixed(3))
  })).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const totalKilos = productos.reduce((acc, p) => acc + p.stockFisico, 0);

  return {
    ok: true,
    siteId,
    totalSkus: productos.length,
    totalKilos: parseFloat(totalKilos.toFixed(3)),
    productos
  };
};


/**
 * Consulta el reporte de diferencias en Órdenes de Ingreso (Recepción) de BlockWMS
 * ejecutando la consulta SQL contra /proc_paginado_query.php
 */
const obtenerReporteDiferenciasIngresoWMS = async (filtros = {}, opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const siteId = opts.siteId || filtros.siteId || config.siteId || '194326';

  const sessionId = await ensureValidWmsSession(opts);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  let whereClauses = [`id_entidades_sites = ''${siteId}''`, `id_operaciones_tipos = 1`];

  if (filtros.codigoOrdenes && filtros.codigoOrdenes.trim()) {
    whereClauses.push(`codigo_ordenes LIKE ''%${filtros.codigoOrdenes.trim()}%''`);
  }
  if (filtros.codigoProveedor && filtros.codigoProveedor.trim()) {
    whereClauses.push(`cliente_proveedor LIKE ''%${filtros.codigoProveedor.trim()}%''`);
  }
  if (filtros.codigoProducto && filtros.codigoProducto.trim()) {
    const p = filtros.codigoProducto.trim();
    whereClauses.push(`(codigo_productos LIKE ''%${p}%'' OR producto LIKE ''%${p}%'')`);
  }
  if (filtros.lote && filtros.lote.trim()) {
    whereClauses.push(`lote_VIS_ LIKE ''%${filtros.lote.trim()}%''`);
  }
  if (filtros.diferencia !== undefined && filtros.diferencia !== null && String(filtros.diferencia) !== '-1') {
    if (String(filtros.diferencia) === '1') {
      whereClauses.push(`ABS(diferencia) > 0.001`);
    } else if (String(filtros.diferencia) === '0') {
      whereClauses.push(`ABS(diferencia) <= 0.001`);
    }
  }

  const rawSql = `select * from view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE ${whereClauses.join(' AND ')} order by fecha_cierre desc, codigo_ordenes desc`;

  const queryPayload = new URLSearchParams({
    query: rawSql,
    start: '0',
    length: '5000'
  });

  logWmsRequest('REPORTE_DIFERENCIAS_INGRESO_QUERY', `${host}/proc_paginado_query.php`, 'POST', headers, queryPayload);

  let rows = [];
  try {
    const pagRes = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 30000 });
    let data = pagRes.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = [];
      }
    }
    if (Array.isArray(data)) {
      rows = data;
    }
    logWmsResponse('REPORTE_DIFERENCIAS_INGRESO_QUERY', pagRes.status, `Filas obtenidas: ${rows.length}`);
  } catch (err) {
    console.warn('[wmsService] Error en POST a /proc_paginado_query.php:', err.message);
  }

  const getNumFromRow = (row, keywords) => {
    for (const key of Object.keys(row)) {
      const kLower = key.toLowerCase();
      for (const kw of keywords) {
        if (kLower.includes(kw.toLowerCase())) {
          const val = row[key];
          if (val !== undefined && val !== null && val !== '') {
            const num = parseFloat(String(val).replace(',', '.'));
            if (!isNaN(num)) return num;
          }
        }
      }
    }
    return 0;
  };

  const itemsFormateados = rows.map((row, idx) => {
    const codigo = row.codigo_productos || row.codigo_productos_VIS_ || '-';
    const productoName = row.producto || row.producto_VIS_ || row.descri || codigo;
    const esperada = getNumFromRow(row, ['cantidad_original', 'esperada']);
    const recibida = getNumFromRow(row, ['cantidad_actual', 'recibida']);
    const diferencia = row.diferencia !== undefined && row.diferencia !== null ? parseFloat(row.diferencia) : (recibida - esperada);

    return {
      id: idx + 1,
      orden: row.codigo_ordenes || row.codigo_ordenes_erp || 'S/N',
      proveedor: row.cliente_proveedor || row.proveedor || '-',
      codigoProducto: String(codigo).trim(),
      producto: String(productoName).trim(),
      lote: row.lote_VIS_ || row.lote || '-',
      cantidadEsperada: parseFloat(esperada.toFixed(3)),
      cantidadRecibida: parseFloat(recibida.toFixed(3)),
      diferencia: parseFloat(diferencia.toFixed(3)),
      fechaCierre: row.fecha_cierre || row.fecha_alta || '-',
      operador: row.operador || '-'
    };
  });

  const totalEsperada = itemsFormateados.reduce((acc, i) => acc + i.cantidadEsperada, 0);
  const totalRecibida = itemsFormateados.reduce((acc, i) => acc + i.cantidadRecibida, 0);
  const totalDiferencia = itemsFormateados.reduce((acc, i) => acc + i.diferencia, 0);
  const conDiferenciaCount = itemsFormateados.filter(i => Math.abs(i.diferencia) > 0.001).length;

  return {
    ok: true,
    totalItems: itemsFormateados.length,
    conDiferenciaCount,
    sinDiferenciaCount: itemsFormateados.length - conDiferenciaCount,
    resumen: {
      totalEsperada: parseFloat(totalEsperada.toFixed(3)),
      totalRecibida: parseFloat(totalRecibida.toFixed(3)),
      totalDiferencia: parseFloat(totalDiferencia.toFixed(3))
    },
    items: itemsFormateados
  };
};

/**
 * Obtener listado de todas las tablas y vistas de BlockWMS
 */
const obtenerTablasWMS = async (opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const rawSql = "SELECT TABLE_TYPE, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_TYPE, TABLE_NAME";
  const queryPayload = new URLSearchParams({ query: rawSql, start: '0', length: '2000' });

  const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 20000 });
  let data = res.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { data = []; }
  }
  return Array.isArray(data) ? data : [];
};

/**
 * Ejecuta una consulta SQL SELECT contra proc_paginado_query.php
 */
const consultarSqlWMS = async (sqlQuery, opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const sqlEscaped = sqlQuery.includes("'") && !sqlQuery.includes("''") ? sqlQuery.replace(/'/g, "''") : sqlQuery;
  const queryPayload = new URLSearchParams({ query: sqlEscaped, start: '0', length: '5000' });

  const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 30000 });
  let data = res.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { data = []; }
  }
  return Array.isArray(data) ? data : [];
};

/**
 * Consulta el stock consolidado por sucursal/sitio para un producto o código dado
 */
const obtenerStockSucursalesWMS = async (codigoProducto = '', opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const pEscaped = String(codigoProducto || '').trim().replace(/'/g, "''");
  let whereClause = '';
  if (pEscaped) {
    whereClause = `WHERE (codigo_productos LIKE ''%${pEscaped}%'' OR producto LIKE ''%${pEscaped}%'')`;
  }

  const rawSql = `SELECT site, codigo_productos, producto, SUM(cantidad_fisica) AS stock_total FROM view_Reporte_StockXUbicacion ${whereClause} GROUP BY site, codigo_productos, producto ORDER BY site, codigo_productos`;

  const queryPayload = new URLSearchParams({
    query: rawSql,
    start: '0',
    length: '5000'
  });

  let rows = [];
  try {
    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 30000 });
    let data = res.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = []; }
    }
    if (Array.isArray(data)) {
      rows = data;
    }
  } catch (err) {
    console.warn('[wmsService] Error al consultar stock por sucursales:', err.message);
  }

  const items = rows.map((r, idx) => ({
    id: idx + 1,
    sucursal: r.site || 'N/A',
    codigo: String(r.codigo_productos || '-').trim(),
    nombre: String(r.producto || '-').trim(),
    stock: parseFloat(parseFloat(r.stock_total || 0).toFixed(3))
  }));

  const totalStock = items.reduce((acc, i) => acc + i.stock, 0);

  return {
    ok: true,
    totalSucursales: items.length,
    totalStock: parseFloat(totalStock.toFixed(3)),
    items
  };
};

/**
 * Obtiene órdenes de ingreso (y sus ítems) en un rango de fechas para un site
 */
const obtenerOrdenesIngresoWMS = async (filtros = {}, opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  const siteId = String(filtros.siteId || '194326').trim();
  const fechaDesde = filtros.fechaDesde || ''; // YYYY-MM-DD
  const fechaHasta = filtros.fechaHasta || ''; // YYYY-MM-DD
  const tipoComprobante = String(filtros.tipoComprobante || filtros.documento || '').trim();

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  let dateWhere = '';
  if (fechaDesde && fechaHasta) {
    dateWhere = `AND CONVERT(date, fecha_cierre, 103) >= ''${fechaDesde}'' AND CONVERT(date, fecha_cierre, 103) <= ''${fechaHasta}''`;
  } else if (fechaDesde) {
    dateWhere = `AND CONVERT(date, fecha_cierre, 103) >= ''${fechaDesde}''`;
  } else if (fechaHasta) {
    dateWhere = `AND CONVERT(date, fecha_cierre, 103) <= ''${fechaHasta}''`;
  }

  let docWhere = '';
  if (tipoComprobante && tipoComprobante !== 'TODOS' && tipoComprobante !== 'ALL') {
    const cEscaped = tipoComprobante.replace(/'/g, "''");
    docWhere = `AND (codigo_ordenes_documentos LIKE ''%${cEscaped}%'' OR documento LIKE ''%${cEscaped}%'')`;
  }

  const rawSql = `SELECT * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''${siteId}'' AND id_operaciones_tipos = 1 ${dateWhere} ${docWhere} ORDER BY codigo_ordenes DESC`;

  const queryPayload = new URLSearchParams({
    query: rawSql,
    start: '0',
    length: '3000'
  });

  let data = [];
  try {
    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 60000 });
    let resData = res.data;
    if (typeof resData === 'string') {
      try { resData = JSON.parse(resData); } catch (e) { resData = []; }
    }
    if (Array.isArray(resData)) {
      data = resData;
    }
  } catch (err) {
    console.warn('[wmsService] Error al obtener órdenes de ingreso:', err.message);
  }

  const parseDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    const parts = String(dateStr).split(' ')[0].split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
    }
    return null;
  };

  const dDesde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
  const dHasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;

  const rowsFiltradas = data.filter(row => {
    const dt = parseDDMMYYYY(row.fecha_cierre || row.fecha_alta);
    if (!dt) return true;
    if (dDesde && dt < dDesde) return false;
    if (dHasta && dt > dHasta) return false;
    return true;
  });

  const getNum = (row, keywords) => {
    for (const key of Object.keys(row)) {
      const kLower = key.toLowerCase();
      for (const kw of keywords) {
        if (kLower.includes(kw.toLowerCase())) {
          const val = row[key];
          if (val !== undefined && val !== null && val !== '') {
            const num = parseFloat(String(val).replace(',', '.'));
            if (!isNaN(num)) return num;
          }
        }
      }
    }
    return 0;
  };

  const ordersMap = new Map();
  for (const row of rowsFiltradas) {
    const ordenCodigo = String(row.codigo_ordenes || row.codigo_ordenes_erp || 'S/N').trim();
    if (!ordersMap.has(ordenCodigo)) {
      ordersMap.set(ordenCodigo, {
        orden: ordenCodigo,
        codigoOrdenErp: String(row.codigo_ordenes_erp || row.documento || row.codigo_ordenes_documentos || ordenCodigo || '-').trim(),
        fechaCierre: String(row.fecha_cierre || row.fecha_alta || '-').trim(),
        proveedor: String(row.cliente_proveedor || row.proveedor || '-').trim(),
        documento: String(row.documento || row.codigo_ordenes_documentos || '-').trim(),
        operador: String(row.operador || '-').trim(),
        totalBultos: parseFloat(getNum(row, ['total_bultos', 'bultos']) || 0),
        items: []
      });
    }

    const orderObj = ordersMap.get(ordenCodigo);
    const recibida = getNum(row, ['cantidad_actual', 'recibida']);
    const esperada = getNum(row, ['cantidad_original', 'esperada']);
    orderObj.items.push({
      id: orderObj.items.length + 1,
      codigo: String(row.codigo_productos || row.codigo_productos_VIS_ || '-').trim(),
      producto: String(row.producto || row.producto_VIS_ || '-').trim(),
      lote: String(row.lote_VIS_ || row.lote || '-').trim(),
      recibida: parseFloat(recibida.toFixed(3)),
      esperada: parseFloat(esperada.toFixed(3)),
      ubicacion: String(row.ubicacion_origen || row.Ubicación_VIS_ || '-').trim()
    });
  }

  const ordenes = Array.from(ordersMap.values());

  // Consultar en la base local qué órdenes ya fueron cargadas como recortes
  const { MovimientoStock } = require('../models');
  const { Op } = require('sequelize');
  const ordenesImpactadasSet = new Set();
  try {
    const logs = await MovimientoStock.findAll({
      where: {
        tipo_movimiento: { [Op.in]: ['INGRESO_RECORTE', 'INGRESO_DECOMISO', 'REGISTRO_VENCIMIENTO'] },
        concepto: { [Op.like]: '%desde Orden WMS Nº %' }
      },
      attributes: ['concepto'],
      raw: true
    });
    logs.forEach(l => {
      const match = String(l.concepto || '').match(/Orden WMS Nº (\S+)/);
      if (match && match[1]) {
        ordenesImpactadasSet.add(match[1].trim());
      }
    });
  } catch (e) {
    console.warn('[wmsService] No se pudo verificar estado de recortes/vencimientos:', e.message);
  }

  for (const o of ordenes) {
    o.totalKilosRecibidos = parseFloat(o.items.reduce((acc, i) => acc + i.recibida, 0).toFixed(3));
    o.totalItemsCount = o.items.length;
    o.recortesImpactados = ordenesImpactadasSet.has(o.orden);
  }

  const productosMap = new Map();
  for (const o of ordenes) {
    for (const item of o.items) {
      if (!productosMap.has(item.codigo)) {
        productosMap.set(item.codigo, {
          codigo: item.codigo,
          producto: item.producto,
          totalRecibido: 0,
          totalEsperado: 0,
          ordenesSet: new Set()
        });
      }
      const prodObj = productosMap.get(item.codigo);
      prodObj.totalRecibido += item.recibida;
      prodObj.totalEsperado += item.esperada;
      prodObj.ordenesSet.add(o.orden);
    }
  }

  const productosConsolidados = Array.from(productosMap.values()).map(p => ({
    codigo: p.codigo,
    producto: p.producto,
    cantOrdenes: p.ordenesSet.size,
    totalRecibido: parseFloat(p.totalRecibido.toFixed(3)),
    totalEsperado: parseFloat(p.totalEsperado.toFixed(3))
  })).sort((a, b) => b.totalRecibido - a.totalRecibido);

  const totalGeneralKilos = ordenes.reduce((acc, o) => acc + o.totalKilosRecibidos, 0);

  return {
    ok: true,
    totalOrdenes: ordenes.length,
    totalProductosDistintos: productosConsolidados.length,
    totalGeneralKilos: parseFloat(totalGeneralKilos.toFixed(3)),
    ordenes,
    productosConsolidados
  };
};

/**
 * Obtiene órdenes de egreso / despacho / salida (y sus ítems) en un rango de fechas para un site
 */
const obtenerOrdenesEgresoWMS = async (filtros = {}, opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  const siteId = String(filtros.siteId || '194326').trim();
  const fechaDesde = filtros.fechaDesde || ''; // YYYY-MM-DD
  const fechaHasta = filtros.fechaHasta || ''; // YYYY-MM-DD
  const tipoComprobante = String(filtros.tipoComprobante || filtros.documento || '').trim();

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Cookie': `PHPSESSID=${sessionId}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  let dateWhere = '';
  if (fechaDesde && fechaHasta) {
    dateWhere = `AND CONVERT(date, fecha_cierre, 103) >= ''${fechaDesde}'' AND CONVERT(date, fecha_cierre, 103) <= ''${fechaHasta}''`;
  } else if (fechaDesde) {
    dateWhere = `AND CONVERT(date, fecha_cierre, 103) >= ''${fechaDesde}''`;
  } else if (fechaHasta) {
    dateWhere = `AND CONVERT(date, fecha_cierre, 103) <= ''${fechaHasta}''`;
  }

  let docWhere = '';
  if (tipoComprobante && tipoComprobante !== 'TODOS' && tipoComprobante !== 'ALL') {
    const cEscaped = tipoComprobante.replace(/'/g, "''");
    docWhere = `AND (codigo_ordenes_documentos LIKE ''%${cEscaped}%'' OR documento LIKE ''%${cEscaped}%'' OR operacion LIKE ''%${cEscaped}%'')`;
  }

  const egresoExclusionSql = `AND (ISNULL(codigo_ordenes_documentos,'''') NOT LIKE ''%RECEPC%'' AND ISNULL(documento,'''') NOT LIKE ''%RECEPC%'' AND ISNULL(operacion,'''') NOT LIKE ''%RECEPC%'')`;

  const rawSql = `SELECT * FROM view_WMS_Rpt_Ordenes_Diferencias_PIC WHERE id_entidades_sites = ''${siteId}'' ${dateWhere} ${docWhere} ${egresoExclusionSql} ORDER BY codigo_ordenes DESC`;

  const queryPayload = new URLSearchParams({
    query: rawSql,
    start: '0',
    length: '3000'
  });

  let data = [];
  try {
    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers, timeout: 60000 });
    let resData = res.data;
    if (typeof resData === 'string') {
      try { resData = JSON.parse(resData); } catch (e) { resData = []; }
    }
    if (Array.isArray(resData)) {
      data = resData;
    }
  } catch (err) {
    console.warn('[wmsService] Error al obtener órdenes de egreso:', err.message);
  }

  const parseDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    const parts = String(dateStr).split(' ')[0].split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
    }
    return null;
  };

  const dDesde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
  const dHasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;

  const rowsFiltradas = data.filter(row => {
    const docStr = String(row.documento || row.codigo_ordenes_documentos || row.operacion || '').toUpperCase();
    if (docStr.includes('RECEPC') || docStr.includes('INGRES')) return false;

    const dt = parseDDMMYYYY(row.fecha_cierre || row.fecha_alta);
    if (!dt) return true;
    if (dDesde && dt < dDesde) return false;
    if (dHasta && dt > dHasta) return false;
    return true;
  });

  const getNum = (row, keywords) => {
    for (const key of Object.keys(row)) {
      const kLower = key.toLowerCase();
      for (const kw of keywords) {
        if (kLower.includes(kw.toLowerCase())) {
          const val = row[key];
          if (val !== undefined && val !== null && val !== '') {
            const num = parseFloat(String(val).replace(',', '.'));
            if (!isNaN(num)) return Math.abs(num);
          }
        }
      }
    }
    return 0;
  };

  const ordersMap = new Map();
  for (const row of rowsFiltradas) {
    const ordenCodigo = String(row.codigo_ordenes || row.codigo_ordenes_erp || 'S/N').trim();
    if (!ordersMap.has(ordenCodigo)) {
      ordersMap.set(ordenCodigo, {
        orden: ordenCodigo,
        fechaCierre: String(row.fecha_cierre || row.fecha_alta || '-').trim(),
        destino: String(row.entidad || row.cliente_proveedor || '-').trim(),
        documento: String(row.documento || row.codigo_ordenes_documentos || '-').trim(),
        operacion: String(row.operacion || row.codigo_operaciones || '-').trim(),
        operador: String(row.operador || '-').trim(),
        items: []
      });
    }

    const orderObj = ordersMap.get(ordenCodigo);
    const despachada = getNum(row, ['cantidad_actual', 'despachada', 'recibida', 'cantidad_original']);
    orderObj.items.push({
      id: orderObj.items.length + 1,
      codigo: String(row.codigo_productos || row.codigo_productos_VIS_ || '-').trim(),
      producto: String(row.producto || row.producto_VIS_ || '-').trim(),
      lote: String(row.lote_VIS_ || row.lote || '-').trim(),
      despachada: parseFloat(despachada.toFixed(3)),
      ubicacion: String(row.ubicacion_origen || row.Ubicación_VIS_ || '-').trim()
    });
  }

  const ordenes = Array.from(ordersMap.values());
  for (const o of ordenes) {
    o.totalKilosDespachados = parseFloat(o.items.reduce((acc, i) => acc + i.despachada, 0).toFixed(3));
    o.totalItemsCount = o.items.length;
  }

  const productosMap = new Map();
  for (const o of ordenes) {
    for (const item of o.items) {
      if (!productosMap.has(item.codigo)) {
        productosMap.set(item.codigo, {
          codigo: item.codigo,
          producto: item.producto,
          totalDespachado: 0,
          ordenesSet: new Set()
        });
      }
      const prodObj = productosMap.get(item.codigo);
      prodObj.totalDespachado += item.despachada;
      prodObj.ordenesSet.add(o.orden);
    }
  }

  const productosConsolidados = Array.from(productosMap.values()).map(p => ({
    codigo: p.codigo,
    producto: p.producto,
    cantOrdenes: p.ordenesSet.size,
    totalDespachado: parseFloat(p.totalDespachado.toFixed(3))
  })).sort((a, b) => b.totalDespachado - a.totalDespachado);

  const totalGeneralKilos = ordenes.reduce((acc, o) => acc + o.totalKilosDespachados, 0);

  return {
    ok: true,
    totalOrdenes: ordenes.length,
    totalProductosDistintos: productosConsolidados.length,
    totalGeneralKilos: parseFloat(totalGeneralKilos.toFixed(3)),
    ordenes,
    productosConsolidados
  };
};

/**
 * Consulta las Órdenes de Ingreso Pendientes reales desde BlockWMS
 */
const obtenerOrdenesIngresoPendientesWMS = async (filtros = {}, opts = {}) => {
  const config = cargarConfiguracion();
  const siteId = String(opts.siteId || filtros.siteId || config.siteId || '194326').trim();
  const sEscaped = siteId.replace(/'/g, "''");

  let whereClauses = [
    `id_entidades_sites = '${sEscaped}'`,
    "status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja')"
  ];

  if (filtros.search && filtros.search.trim()) {
    const sTermEscaped = filtros.search.trim().replace(/'/g, "''");
    whereClauses.push(`(codigo_ordenes LIKE '%${sTermEscaped}%' OR codigo_ordenes_erp LIKE '%${sTermEscaped}%' OR entidad LIKE '%${sTermEscaped}%' OR codigo_productos LIKE '%${sTermEscaped}%' OR producto LIKE '%${sTermEscaped}%')`);
  }

  if (filtros.proveedor && filtros.proveedor.trim()) {
    const pEscaped = filtros.proveedor.trim().replace(/'/g, "''");
    whereClauses.push(`entidad LIKE '%${pEscaped}%'`);
  }

  const rawSql = `SELECT * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE ${whereClauses.join(' AND ')} ORDER BY codigo_ordenes DESC, id_ordenes DESC`;

  const rows = await consultarSqlWMS(rawSql, opts);

  const items = rows.map((r, idx) => {
    const esp = parseFloat(r.cantidad_original || r['Cantidad Original_VIS_¡3'] || 0);
    const rec = parseFloat(r.Cantidad_recibida || r['Cantidad Recibida_VIS_¡¿3'] || 0);
    const pend = Math.max(0, esp - rec);

    return {
      id: r.id_ordenes ? `${r.id_ordenes}-${idx}` : idx + 1,
      idOrdenes: r.id_ordenes,
      ordenWms: String(r.codigo_ordenes || '-').trim(),
      ordenCompraErp: String(r.codigo_ordenes_erp || '-').trim(),
      fechaAlta: r.fecha_alta || '-',
      fechaProgramada: r.fecha_entrega_programada || '-',
      tipoComprobante: r.documento || '-',
      estadoOrden: r.status || 'Pendiente',
      proveedor: r.entidad || r.proveedor_VIS_ || '-',
      codigoProducto: String(r.codigo_productos || r.codigo_VIS_ || '-').trim(),
      nombreProducto: String(r.producto || r.producto_VIS_ || '-').trim(),
      cantidadEsperada: parseFloat(esp.toFixed(3)),
      cantidadRecibida: parseFloat(rec.toFixed(3)),
      cantidadPendiente: parseFloat(pend.toFixed(3))
    };
  }).filter(i => i.cantidadPendiente > 0);

  const ordenesMap = new Map();
  items.forEach(item => {
    if (!ordenesMap.has(item.ordenWms)) {
      ordenesMap.set(item.ordenWms, {
        ordenWms: item.ordenWms,
        ordenCompraErp: item.ordenCompraErp,
        proveedor: item.proveedor,
        fechaAlta: item.fechaAlta,
        estadoOrden: item.estadoOrden,
        itemsCount: 0,
        totalPendiente: 0
      });
    }
    const o = ordenesMap.get(item.ordenWms);
    o.itemsCount++;
    o.totalPendiente += item.cantidadPendiente;
  });

  const totalPendienteKilos = items.reduce((acc, i) => acc + i.cantidadPendiente, 0);

  return {
    ok: true,
    totalItems: items.length,
    totalOrdenes: ordenesMap.size,
    totalPendienteKilos: parseFloat(totalPendienteKilos.toFixed(3)),
    ordenes: Array.from(ordenesMap.values()),
    items
  };
};

/**
 * Procesar la recepción de una orden de ingreso en BlockWMS y sincronizar stock local
 */
const procesarRecepcionOrdenWMS = async (recepcionData = {}, opts = {}) => {
  const { ordenWms, idOrdenes, items, id_ubicacion = 1, observaciones, usuarioEjecutor = 'Sistema' } = recepcionData;

  if (!ordenWms || !items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Debe especificar la orden WMS y al menos un ítem a recepcionar.');
  }

  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);

  console.log(`\n=================== [WMS LOG RECEPCIÓN: INICIO ORDEN ${ordenWms}] ===================`);
  console.log(`Config Host: ${host} | Session ID: ${sessionId} | ID Ordenes: ${idOrdenes || 'N/A'}`);
  console.log(`Total Ítems a procesar: ${items.length}`);

  const wmsLogs = [];
  const t = await sequelize.transaction();

  try {
    let itemsProcesados = 0;
    let totalKilosRecepcionados = 0;

    for (const item of items) {
      const codigo = String(item.codigoProducto || item.codigo || '').trim();
      const cantRecibida = parseFloat(item.cantidadRecibida || 0);

      if (!codigo || cantRecibida <= 0) continue;

      const postData = new URLSearchParams({
        accion: 'guardar_recepcion',
        codigo_ordenes: ordenWms,
        id_ordenes: String(idOrdenes || ''),
        codigo_productos: codigo,
        cantidad_recibida: String(cantRecibida),
        lote: item.lote || '',
        fecha_vencimiento: item.fechaVencimiento || ''
      });

      console.log(`\n---> [WMS RECEPCIÓN HTTP REQUEST] Producto SKU: ${codigo} | Cantidad: ${cantRecibida}`);
      console.log(`URL: ${host}/proc_ordenes.php`);
      console.log(`Body Payload: ${postData.toString()}`);

      let wmsResData = null;
      let wmsResStatus = null;

      try {
        const resWms = await axios.post(`${host}/proc_ordenes.php`, postData, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Cookie': `PHPSESSID=${sessionId}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000,
          validateStatus: () => true
        });

        wmsResStatus = resWms.status;
        wmsResData = resWms.data;

        console.log(`<--- [WMS RECEPCIÓN HTTP RESPONSE] Status: ${resWms.status}`);
        console.log(`Data Content:`, typeof resWms.data === 'object' ? JSON.stringify(resWms.data) : String(resWms.data).substring(0, 1000));
      } catch (wmsErr) {
        console.error(`[WMS RECEPCIÓN ERROR HTTP]:`, wmsErr.message);
        wmsResData = { error: wmsErr.message };
      }

      // Intentar también actualización directa por SQL en BlockWMS por si el PHP lo requiere
      try {
        const sqlUpdateItem = `UPDATE i_Ordenes_Ingreso_Items SET Cantidad_recibida = ISNULL(Cantidad_recibida, 0) + ${cantRecibida} WHERE codigo_ordenes = '${ordenWms.replace(/'/g, "''")}' AND codigo_productos = '${codigo.replace(/'/g, "''")}'`;
        console.log(`[WMS RECEPCIÓN SQL UPDATE ITEM]: ${sqlUpdateItem}`);
        await consultarSqlWMS(sqlUpdateItem, opts);

        const sqlUpdateHeader = `UPDATE Ordenes SET status = 'Finalizada', id_status = 3 WHERE codigo_ordenes = '${ordenWms.replace(/'/g, "''")}'`;
        console.log(`[WMS RECEPCIÓN SQL UPDATE HEADER]: ${sqlUpdateHeader}`);
        await consultarSqlWMS(sqlUpdateHeader, opts);
      } catch (sqlErr) {
        console.warn(`[WMS RECEPCIÓN SQL UPDATE WARN]:`, sqlErr.message);
      }

      wmsLogs.push({
        codigoProducto: codigo,
        cantidadRecibida: cantRecibida,
        httpStatus: wmsResStatus,
        wmsResponse: wmsResData
      });

      // 2. Asegurar existencia del Producto local
      let productoObj = await Producto.findByPk(codigo, { transaction: t });
      if (!productoObj) {
        productoObj = await Producto.create({
          codigo,
          nombre: String(item.nombreProducto || `Producto ${codigo}`).trim(),
          activo: true
        }, { transaction: t });
      }

      // 3. Actualizar ProductoStock local en la ubicación seleccionada
      let [stockObj] = await ProductoStock.findOrCreate({
        where: {
          codigo_producto: codigo,
          id_ubicacion
        },
        defaults: {
          codigo_producto: codigo,
          id_ubicacion,
          stock: 0.0000,
          recorte: 0.000,
          decomiso: 0.000,
          kg_fraccionados: 0.000
        },
        transaction: t
      });

      const stockAnterior = parseFloat(stockObj.stock) || 0;
      const stockNuevo = stockAnterior + cantRecibida;
      stockObj.stock = stockNuevo;

      await stockObj.save({
        transaction: t,
        tipo_movimiento: 'INGRESO_PROVEEDOR',
        concepto: `Recepción Orden WMS Nº ${ordenWms}${item.lote ? ' (Lote: ' + item.lote + ')' : ''}`,
        usuario: usuarioEjecutor,
        cantidad_piezas: item.cantidadPiezas || 0
      });

      // 4. Registrar fecha de vencimiento/lote si fue provista
      if (item.fechaVencimiento || item.lote) {
        const { ProductoVencimiento } = sequelize.models;
        if (ProductoVencimiento) {
          const fVenc = item.fechaVencimiento ? new Date(item.fechaVencimiento) : new Date('2099-12-31');
          await ProductoVencimiento.create({
            codigo_producto: codigo,
            id_ubicacion,
            fecha_vencimiento: fVenc,
            lote: item.lote || null,
            piezas: item.cantidadPiezas || 1,
            kilos: cantRecibida
          }, { transaction: t });
        }
      }

      itemsProcesados++;
      totalKilosRecepcionados += cantRecibida;
    }

    await t.commit();

    console.log(`\n=================== [WMS LOG RECEPCIÓN: FINALIZADO CON ÉXITO] ===================\n`);

    return {
      ok: true,
      message: `Recepción de Orden WMS Nº ${ordenWms} procesada exitosamente (${itemsProcesados} ítems, ${totalKilosRecepcionados.toFixed(3)} kg/uds cargados).`,
      itemsProcesados,
      totalKilosRecepcionados: parseFloat(totalKilosRecepcionados.toFixed(3)),
      wmsLogs
    };
  } catch (error) {
    await t.rollback();
    console.error('[procesarRecepcionOrdenWMS] Error al procesar recepción:', error);
    throw error;
  }
};

/**
 * Obtiene el PDF binario generado directamente por Block WMS (pdf_export.php) usando el código de Orden ERP
 */
const obtenerPdfOrdenWMS = async (ordenErpId, opts = {}) => {
  const config = cargarConfiguracion();
  const host = (opts.host || config.host || process.env.WMS_HOST || 'http://192.168.10.2').replace(/\/+$/, '');
  const sessionId = await ensureValidWmsSession(opts);
  const siteId = String(opts.siteId || config.siteId || '194326').trim();
  const codeErpClean = String(ordenErpId || '').trim();

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Cookie': `PHPSESSID=${sessionId}`
  };

  // 1. Inicializar el motor de reportes de Block WMS en la sesión activa de PHP
  try {
    await axios.get(`${host}/reports.php?codigo_reportes=repoordenesingresodiferencias&idm=1957&idotnet=1149&parent_idm=1884`, { headers, timeout: 15000 });
    await axios.get(`${host}/reports_maker.php?t=repoordenesingresodiferencias`, { headers, timeout: 15000 });
  } catch (e) {
    console.warn('[wmsService] Advertencia al inicializar reporte en sesión WMS:', e.message);
  }

  // 2. Cargar el contexto/filtro de la orden en la sesión PHP ejecutando la consulta específica
  if (codeErpClean) {
    const cEscaped = codeErpClean.replace(/'/g, "''");
    const rawSql = `SELECT * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''${siteId}'' AND id_operaciones_tipos = 1 AND (codigo_ordenes LIKE ''%${cEscaped}%'' OR documento LIKE ''%${cEscaped}%'' OR codigo_ordenes_erp LIKE ''%${cEscaped}%'') ORDER BY codigo_ordenes DESC`;

    const queryPayload = new URLSearchParams({
      query: rawSql,
      start: '0',
      length: '500'
    });

    try {
      await axios.post(`${host}/proc_paginado_query.php`, queryPayload, {
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 20000
      });
    } catch (e) {
      console.warn('[wmsService] Advertencia al establecer consulta de orden en sesión WMS:', e.message);
    }
  }

  // 3. Invocamos pdf_export.php en Block WMS con el Referer correspondiente
  const pdfExportUrl = `${host}/pdf_export.php?tipo=pdf`;
  const exportRes = await axios.get(pdfExportUrl, {
    headers: {
      ...headers,
      'Referer': `${host}/reports_maker.php?t=`
    },
    timeout: 45000
  });
  const html = String(exportRes.data || '');

  // 4. Buscamos la ruta del PDF devuelto en el HTML (<embed src="/temp/export_pdf/export_...pdf">)
  const match = html.match(/embed\s+src=[\x22\x27](\/temp\/export_pdf\/[^\x22\x27\s>]+)[\x22\x27]/i);
  if (!match || !match[1]) {
    throw new Error('Block WMS no devolvió la ubicación del PDF generado para la Orden.');
  }

  const pdfRelativePath = match[1];
  const pdfFullUrl = `${host}${pdfRelativePath}`;

  // 5. Descargamos los bytes binarios del PDF original
  const pdfBinaryRes = await axios.get(pdfFullUrl, {
    headers,
    responseType: 'arraybuffer',
    timeout: 30000
  });

  return Buffer.from(pdfBinaryRes.data);
};

module.exports = {
  cargarConfiguracion,
  guardarConfiguracion,
  loginWMS,
  ensureValidWmsSession,
  obtenerProductosWMS,
  obtenerEntidadesWMS,
  obtenerSitesDisponiblesWMS,
  obtenerStockPorUbicacionWMS,
  obtenerReporteDiferenciasIngresoWMS,
  obtenerStockSucursalesWMS,
  obtenerOrdenesIngresoWMS,
  obtenerOrdenesIngresoPendientesWMS,
  procesarRecepcionOrdenWMS,
  obtenerOrdenesEgresoWMS,
  obtenerPdfOrdenWMS,
  obtenerTablasWMS,
  consultarSqlWMS,
  sincronizarStock,
  obtenerMotivosAjusteWMS,
  ejecutarAjusteCompletoWMS,
  ejecutarAjusteMultipleWMS
};
