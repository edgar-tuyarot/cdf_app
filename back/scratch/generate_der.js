const fs = require('fs');
const PDFDocument = require('pdfkit');

function generatePDF() {
  const doc = new PDFDocument({ margin: 50, autoFirstPage: true, bufferPages: true });
  const outputPath = 'C:/cdf-app/DER_Plataforma_CDF.pdf';
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Colors
  const primaryColor = '#1e3a8a';   // Deep Blue
  const secondaryColor = '#0f766e'; // Teal
  const textColor = '#334155';      // Slate Grey
  const lightGrey = '#f1f5f9';      // Light slate background
  const borderGrey = '#cbd5e1';     // Slate border

  // --- PAGE 1: COVER PAGE ---
  doc.rect(0, 0, 612, 792).fill(lightGrey); // Background

  // Elegant top border stripe
  doc.rect(0, 0, 612, 20).fill(primaryColor);

  // Title block
  doc.fillColor(primaryColor);
  doc.font('Helvetica-Bold').fontSize(32).text('DIAGRAMA ENTIDAD-RELACIÓN', 50, 200, { align: 'left' });
  doc.fontSize(24).text('(DER)', { align: 'left' });
  
  // Divider line
  doc.moveTo(50, 300).lineTo(400, 300).strokeColor(secondaryColor).lineWidth(3).stroke();

  // Subtitle
  doc.fillColor(textColor);
  doc.font('Helvetica').fontSize(16).text('Especificación Técnica del Modelo de Datos', 50, 330);
  doc.fontSize(14).text('Plataforma CDF Gestión - Inventario y Producción Multidepósito', 50, 355);

  // Author and metadata at bottom
  doc.fontSize(11).fillColor('#64748b');
  doc.text('Generado por: Antigravity AI Coding Assistant', 50, 620);
  doc.text('Fecha de emisión: Julio 2026', 50, 640);
  doc.text('Estado: Aprobado para Producción', 50, 660);
  doc.text('Versión: 2.1 (Soporte Multidepósito y Stock de Piezas por Ubicación)', 50, 680);

  // --- PAGE 2: DIAGRAMA (LANDSCAPE) ---
  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 }); // A4 Landscape is 841.89 x 595.28 points
  
  // Title on landscape page
  doc.fillColor(primaryColor);
  doc.font('Helvetica-Bold').fontSize(20).text('DIAGRAMA DE ENTIDAD-RELACIÓN (VISTA GENERAL)', 30, 30);
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Modelo físico simplificado de las tablas principales y sus relaciones estructurales.', 30, 52);

  // Drawing tables (Boxes and fields)
  const tables = [
    {
      name: 'productos',
      x: 30, y: 80, w: 160, h: 220,
      fields: [
        'codigo (PK) [VARCHAR]',
        'nombre [VARCHAR]',
        'peso_x_pieza [DECIMAL]',
        'cantidad_piezas [INT]',
        'kg_fraccionados [DECIMAL]',
        'kg_recorte [DECIMAL]',
        'kg_decomiso [DECIMAL]',
        'permite_piezas [BOOL]',
        'permite_fracciones [BOOL]',
        'activo [BOOL]',
        'codigo_fraccionado (FK)'
      ]
    },
    {
      name: 'productos_stock',
      x: 320, y: 80, w: 160, h: 110,
      fields: [
        'id (PK) [INT]',
        'codigo_producto (FK) [VARCHAR]',
        'id_ubicacion (FK) [INT]',
        'stock (Kilos) [DECIMAL]',
        'piezas [INT]'
      ]
    },
    {
      name: 'ubicaciones',
      x: 610, y: 80, w: 160, h: 90,
      fields: [
        'id (PK) [INT]',
        'numero [INT]',
        'nombre [VARCHAR]'
      ]
    },
    {
      name: 'usuarios',
      x: 610, y: 220, w: 160, h: 110,
      fields: [
        'id (PK) [INT]',
        'nombre [VARCHAR]',
        'contrasena [VARCHAR]',
        'rol [VARCHAR]',
        'id_ubicacion (FK) [INT]'
      ]
    },
    {
      name: 'movimiento_stocks',
      x: 320, y: 230, w: 160, h: 240,
      fields: [
        'id (PK) [INT]',
        'codigo_producto (FK) [VARCHAR]',
        'id_ubicacion (FK) [INT]',
        'tipo_movimiento [VARCHAR]',
        'referencia_id [INT]',
        'concepto [VARCHAR]',
        'cantidad_piezas [INT]',
        'kg_recorte [DECIMAL]',
        'kg_decomiso [DECIMAL]',
        'stock [DECIMAL]',
        'kilos_calculado [DECIMAL]',
        'usuario [VARCHAR]',
        'fecha [DATETIME]'
      ]
    },
    {
      name: 'procesos',
      x: 30, y: 340, w: 160, h: 210,
      fields: [
        'id (PK) [INT]',
        'id_ubicacion (FK) [INT]',
        'generador_id (FK) [INT]',
        'proceso [VARCHAR]',
        'fecha [DATE]',
        'codigo (FK) [VARCHAR]',
        'piezas [INT]',
        'peso_bruto [DECIMAL]',
        'recorte [DECIMAL]',
        'decomiso [DECIMAL]',
        'kg_a_desc [DECIMAL]',
        'kg_a_sumar [DECIMAL]',
        'pendiente [BOOL]'
      ]
    },
    {
      name: 'pedidos',
      x: 610, y: 380, w: 160, h: 140,
      fields: [
        'id (PK) [INT]',
        'codigo [VARCHAR]',
        'sucursal [VARCHAR]',
        'fecha_alta [DATETIME]',
        'fecha_cierre [DATETIME]',
        'estado [VARCHAR]',
        'id_ubicacion (FK) [INT]'
      ]
    },
    {
      name: 'ingreso_proveedores',
      x: 320, y: 490, w: 160, h: 80,
      fields: [
        'id (PK) [INT]',
        'id_ubicacion (FK) [INT]',
        'proveedor_id (FK) [INT]',
        'fecha [DATETIME]'
      ]
    }
  ];

  // Draw relationship lines first (so they sit below box background fills)
  doc.lineWidth(1.2).strokeColor('#94a3b8');

  // Rel: productos -> productos_stock
  // Draw line from x: 190, y: 135 to x: 320, y: 135
  doc.moveTo(190, 135).lineTo(320, 135).stroke();
  doc.circle(190, 135, 3).fill('#475569'); // 1-end
  doc.circle(320, 135, 3.5).stroke();       // N-end

  // Rel: ubicaciones -> productos_stock
  // Draw line from x: 610, y: 125 to x: 480, y: 125
  doc.moveTo(610, 125).lineTo(480, 125).stroke();
  doc.circle(610, 125, 3).fill('#475569');
  doc.circle(480, 125, 3.5).stroke();

  // Rel: ubicaciones -> usuarios
  // Draw vertical line from x: 690, y: 170 to x: 690, y: 220
  doc.moveTo(690, 170).lineTo(690, 220).stroke();
  doc.circle(690, 170, 3).fill('#475569');
  doc.circle(690, 220, 3.5).stroke();

  // Rel: productos -> movimiento_stocks
  // Line from x: 190, y: 190 to x: 230, y: 190 to x: 230, y: 300 to x: 320, y: 300
  doc.moveTo(190, 190).lineTo(250, 190).lineTo(250, 300).lineTo(320, 300).stroke();
  doc.circle(190, 190, 3).fill('#475569');
  doc.circle(320, 300, 3.5).stroke();

  // Rel: ubicaciones -> movimiento_stocks
  // Line from x: 610, y: 150 to x: 530, y: 150 to x: 530, y: 350 to x: 480, y: 350
  doc.moveTo(610, 150).lineTo(530, 150).lineTo(530, 350).lineTo(480, 350).stroke();
  doc.circle(610, 150, 3).fill('#475569');
  doc.circle(480, 350, 3.5).stroke();

  // Rel: productos -> procesos
  // Vertical line from x: 110, y: 300 to x: 110, y: 340
  doc.moveTo(110, 300).lineTo(110, 340).stroke();
  doc.circle(110, 300, 3).fill('#475569');
  doc.circle(110, 340, 3.5).stroke();

  // Rel: ubicaciones -> pedidos
  // Vertical line from x: 740, y: 170 to x: 740, y: 380
  doc.moveTo(740, 170).lineTo(740, 380).stroke();
  doc.circle(740, 170, 3).fill('#475569');
  doc.circle(740, 380, 3.5).stroke();

  // Rel: ubicaciones -> procesos
  // Line from x: 610, y: 100 to x: 10, y: 100 to x: 10, y: 390 to x: 30, y: 390
  doc.moveTo(610, 100).lineTo(15, 100).lineTo(15, 390).lineTo(30, 390).stroke();
  doc.circle(610, 100, 3).fill('#475569');
  doc.circle(30, 390, 3.5).stroke();

  // Rel: ubicaciones -> ingreso_proveedores
  // Line from x: 550, y: 170 to x: 550, y: 510 to x: 480, y: 510
  doc.moveTo(610, 140).lineTo(550, 140).lineTo(550, 510).lineTo(480, 510).stroke();
  doc.circle(610, 140, 3).fill('#475569');
  doc.circle(480, 510, 3.5).stroke();

  // Draw table boxes
  tables.forEach(t => {
    // Fill background
    doc.fillColor('#ffffff').rect(t.x, t.y, t.w, t.h).fill();
    // Header background
    doc.fillColor(primaryColor).rect(t.x, t.y, t.w, 18).fill();
    
    // Border
    doc.lineWidth(1).strokeColor(borderGrey).rect(t.x, t.y, t.w, t.h).stroke();

    // Table Name Text
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(t.name.toUpperCase(), t.x + 8, t.y + 5);

    // Fields Text
    doc.fillColor(textColor).font('Helvetica').fontSize(7.5);
    t.fields.forEach((f, idx) => {
      const isPk = f.includes('(PK)');
      const isFk = f.includes('(FK)');
      if (isPk) {
        doc.font('Helvetica-Bold').fillColor(primaryColor);
      } else if (isFk) {
        doc.font('Helvetica-Bold').fillColor(secondaryColor);
      } else {
        doc.font('Helvetica').fillColor(textColor);
      }
      doc.text(f, t.x + 8, t.y + 24 + (idx * 16));
    });
  });

  // Legend at bottom
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(9).text('Leyenda:', 30, 560);
  doc.font('Helvetica').fontSize(8).text('  • PK = Primary Key (Clave Primaria)    • FK = Foreign Key (Clave Foránea)    • Punto Relleno = Extremo 1 (Uno)    • Círculo Vacío = Extremo N (Muchos)', 80, 561);


  // --- PAGE 3: DETALLE DE ENTIDADES (PORTRAIT) ---
  doc.addPage({ layout: 'portrait', size: 'LETTER', margin: 50 });

  // Header helper
  const addHeader = (title) => {
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(16).text(title);
    doc.moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).strokeColor(borderGrey).lineWidth(1).stroke();
    doc.moveDown(1.2);
  };

  addHeader('DICCIONARIO DE DATOS Y RELACIONES');

  doc.fillColor(textColor).font('Helvetica').fontSize(10);
  doc.text('A continuación se detallan las entidades representadas en la base de datos de CDF Gestión, con su propósito y restricciones de integridad:');
  doc.moveDown(1.5);

  const drawEntityDesc = (name, desc, relations) => {
    doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor).text(name);
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#4b5563').text(`Descripción: ${desc}`);
    doc.font('Helvetica').fontSize(9.5).fillColor(textColor);
    doc.text(`Relaciones clave: ${relations}`);
    doc.moveDown(1.5);
  };

  drawEntityDesc(
    '1. Producto (`productos`)',
    'Catálogo unificado de cortes y subproductos de carne. Almacena las configuraciones globales, tipos de transformación (peso por pieza, pesable, fraccionable) y los acumulados históricos de mermas (recortes, decomisos).',
    'Tiene una relación de uno a muchos (1:N) con `productos_stock` (control por almacén) y con `producto_vencimientos` (control FIFO por lotes de vencimiento).'
  );

  drawEntityDesc(
    '2. Ubicación (`ubicaciones`)',
    'Representa los depósitos físicos o centros de distribución (ej. CD Chaco, CD Corrientes). Es la dimensión base que segmenta la lógica de stocks, auditorías y trazabilidad.',
    'Tiene relación de uno a muchos (1:N) con `productos_stock` (stock de kilos y piezas por depósito) y con `usuarios` (operarios asignados a depósitos).'
  );

  drawEntityDesc(
    '3. Stock de Producto (`productos_stock`)',
    'Tabla de intersección de inventario físico. Almacena las cantidades físicas en tiempo real de kilos (`stock`) y piezas (`piezas`) existentes por producto en cada depósito.',
    'Clave única compuesta por (`codigo_producto`, `id_ubicacion`). FK a `productos` y `ubicaciones`.'
  );

  drawEntityDesc(
    '4. Movimiento de Stock (`movimiento_stocks`)',
    'Historial de auditoría física (kardex) que registra todos los incrementos y decrementos de peso y piezas, clasificados por tipo de movimiento (ingreso de proveedor, devolución, producción, ajuste, envío).',
    'Cada registro almacena el `id_ubicacion` donde ocurrió el cambio y el usuario que lo ejecutó. FK a `productos` y `ubicaciones`.'
  );

  drawEntityDesc(
    '5. Procesos (`procesos`)',
    'Registra las actividades del sector de producción. En particular, los procesos de Fraccionamiento de piezas brutas (origen) hacia productos envasados (destino), deduciendo kilos/piezas y agregando rendimiento.',
    'FK a `productos` (código de producto), `ubicaciones` (lugar de producción) y `generadores` (colaborador o sector que lo realiza).'
  );

  // --- PAGE 4: DETALLE DE ENTIDADES (PART 2) ---
  doc.addPage({ layout: 'portrait', size: 'LETTER', margin: 50 });
  addHeader('DICCIONARIO DE DATOS Y RELACIONES (CONT.)');

  drawEntityDesc(
    '6. Pedidos (`pedidos` y `pedidos_enviados`)',
    'Gestión de órdenes de despacho desde la planta central hacia las sucursales habilitadas. `pedidos` representa la orden de preparación con sus respectivos estados de flujo (Listo, Enviado), mientras que `pedidos_enviados` representa el comprobante final del despacho.',
    'FK a `ubicaciones` (punto de despacho) y a `sucursales` (punto de entrega).'
  );

  drawEntityDesc(
    '7. Lotes de Vencimiento (`producto_vencimientos`)',
    'Almacena la distribución de piezas de un producto ordenadas por fecha de caducidad. Se utiliza para ejecutar la deducción estricta bajo el criterio FIFO (First In, First Out) durante los despachos.',
    'FK a `productos`.'
  );

  drawEntityDesc(
    '8. Bultos y Cajas (`bultos`)',
    'Plantillas de empaque provistas por los proveedores de carne. Permite agilizar la carga de ingresos masivos calculando automáticamente el peso total a ingresar en base a la cantidad de bultos y el promedio de la plantilla.',
    'FK a `productos` y a `proveedores`.'
  );

  drawEntityDesc(
    '9. Log de Conversiones (`log_conversiones`)',
    'Registro histórico específico de la transformación de recortes acumulados en producción (ej. de grasa, hueso o carne) en productos derivados como carne picada.',
    'FK a `productos` (tanto de origen como destino) y a `ubicaciones` (donde se procesó la conversión).'
  );

  // Footer on all portrait pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    // Draw footer
    doc.fillColor('#64748b').font('Helvetica').fontSize(8);
    // Line above footer
    doc.moveTo(50, 750).lineTo(562, 750).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    
    doc.text('Confidencial - Plataforma CDF Gestión', 50, 758);
    doc.text(`Página ${i + 1} de ${totalPages}`, 500, 758, { align: 'right' });
  }

  doc.end();

  stream.on('finish', () => {
    console.log('PDF generado exitosamente en:', outputPath);
  });
}

generatePDF();
