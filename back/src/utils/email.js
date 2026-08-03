const nodemailer = require('nodemailer');

// Crear transportador SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true para 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un correo con el detalle del pedido
 * @param {string} to - Destinatario
 * @param {object} pedido - Datos de la cabecera del pedido
 * @param {Array} items - Lista de productos en el pedido
 */
async function enviarMailConfirmacion(to, pedido, items) {
  if (!to) {
    console.log('No se envió correo: Sucursal sin email configurado.');
    return;
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('No se envió correo: Credenciales SMTP no configuradas en el servidor (.env).');
    return;
  }

  // Formatear items del pedido en una tabla HTML
  const rows = items.map(item => {
    return `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; font-size: 13px; color: #1e293b;">${item.codigo_producto}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 13px; font-weight: bold; color: #0f172a;">${item.nombre_producto || item.codigo_producto}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 13px; font-family: monospace; color: #0f172a;">${item.pieza || 0}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 13px; font-family: monospace; color: #059669; font-weight: bold;">${item.fraccion || 0}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #64748b; border-radius: 8px; background-color: #f8fafc;">
      <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 0; font-size: 20px;">📋 Pedido Confirmado Correctamente</h2>
      <p style="color: #334155; font-size: 14px;">Hola, queremos informarte que se ha recibido y procesado con éxito la solicitud de pedido para tu sucursal.</p>
      
      <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin: 16px 0; border: 1.5px solid #64748b;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px dashed #64748b; padding-bottom: 4px;">Detalles del Pedido</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #334155;">
          <tr>
            <td style="font-weight: bold; width: 100px; padding: 4px 0;">Código:</td>
            <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${pedido.codigo}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 4px 0;">Sucursal:</td>
            <td style="font-weight: bold; color: #0f172a;">${pedido.sucursal}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 4px 0;">Fecha:</td>
            <td>${pedido.fecha}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 4px 0;">Estado:</td>
            <td><span style="background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #34d399;">${pedido.estado}</span></td>
          </tr>
        </table>
      </div>

      <h3 style="color: #0f172a; font-size: 15px; border-bottom: 1.5px solid #64748b; padding-bottom: 4px; margin-top: 20px;">Detalle de Productos</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr style="background-color: #1e293b; color: white;">
            <th style="border: 1px solid #475569; padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase;">Código</th>
            <th style="border: 1px solid #475569; padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase;">Producto</th>
            <th style="border: 1px solid #475569; padding: 8px; text-align: center; width: 70px; font-size: 12px; text-transform: uppercase;">Piezas</th>
            <th style="border: 1px solid #475569; padding: 8px; text-align: center; width: 80px; font-size: 12px; text-transform: uppercase;">Frac.</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <p style="margin-top: 25px; font-size: 11px; color: #64748b; border-top: 1.5px solid #cbd5e1; padding-top: 12px; text-align: center;">
        Este es un correo automático generado por el Sistema de Gestión de CDF. Por favor no responder a este mensaje.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"CDF Gestión" <${process.env.SMTP_USER}>`,
    to: to,
    subject: `📋 Pedido Confirmado - Código: ${pedido.codigo} - Sucursal: ${pedido.sucursal}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo de confirmación enviado con éxito a ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
    throw error;
  }
}

module.exports = {
  enviarMailConfirmacion
};
