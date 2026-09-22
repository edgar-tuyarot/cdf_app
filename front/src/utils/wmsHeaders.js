/**
 * Helper para obtener headers de sesión WMS desde localStorage.
 */
export function getWmsHeaders() {
  const savedSession = localStorage.getItem('wms_session');
  if (!savedSession) return {};
  try {
    const sess = JSON.parse(savedSession);
    if (sess.sessionId) {
      return {
        'X-WMS-Session-Id': sess.sessionId,
        'X-WMS-Site-Id': sess.siteId || '194326',
        'X-WMS-Host': sess.host || 'http://192.168.10.2'
      };
    }
  } catch (e) {}
  return {};
}
