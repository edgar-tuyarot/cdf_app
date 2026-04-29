const fs = require('fs');
const csv = require('csv-parser');
const { Producto } = require('../models');

exports.uploadProductosCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Por favor, sube un archivo CSV' });
  }

  const results = [];
  const errors = [];

  // Parsear el CSV (indicando el separador ';')
  fs.createReadStream(req.file.path)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => {
      // Mapeamos a las cabeceras reales de tu archivo
      const codigo_interno = data.codigo_productos ? data.codigo_productos.trim() : null;
      const descripcion = data.producto ? data.producto.trim() : null;
      
      if (codigo_interno && descripcion) {
        // Formatear el número (ej: "3,255" -> 3.255)
        let stock = 0;
        if (data.cantidad_fisica) {
          stock = parseFloat(data.cantidad_fisica.replace(',', '.')) || 0;
        }

        results.push({
          codigo_interno,
          codigo_proveedor: data.codigo_ean ? data.codigo_ean.trim() : null,
          descripcion,
          categoria: descripcion.split(' ')[0] || '',
          stock
        });
      } else {
        errors.push(data); // Fila inválida
      }
    })
    .on('end', async () => {
      // Eliminar el archivo temporal
      fs.unlinkSync(req.file.path);

      try {
        // Insertar los registros y si ya existen, actualizar su stock
        await Producto.bulkCreate(results, { 
          updateOnDuplicate: ['stock', 'codigo_proveedor', 'descripcion', 'categoria'] 
        });
        
        res.status(200).json({
          mensaje: 'Archivo procesado exitosamente',
          filas_insertadas: results.length,
          filas_ignoradas_por_error: errors.length,
          filas_error_ejemplo: errors.slice(0, 5) // Mostrar hasta 5 ejemplos de filas malas
        });
      } catch (error) {
        console.error('Error insertando desde CSV:', error);
        res.status(500).json({ error: 'Error al insertar en la base de datos' });
      }
    });
};

exports.uploadPedidosCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Por favor, sube un archivo CSV de pedidos' });
  }

  const { Sucursal, PedidoSucursal, ItemPedido, Producto } = require('../models');
  const results = [];

  // Usamos separador punto y coma según indicaste
  fs.createReadStream(req.file.path)
    .pipe(csv({ separator: ';' })) 
    .on('data', (data) => {
      const normalizedRow = {};
      Object.keys(data).forEach(key => {
        // Normalización agresiva: solo letras y números
        const cleanKey = key.toLowerCase().replace(/[^a-z0-0]/g, '');
        normalizedRow[cleanKey] = data[key] ? data[key].trim() : '';
      });
      results.push(normalizedRow);
    })
    .on('end', async () => {
      fs.unlinkSync(req.file.path);

      try {
        let creados = 0;
        let errores = 0;

        for (const row of results) {
          // Mapeo exacto según tus cabeceras
          const codPedido = row.codigopedido;
          const nombreSucursal = row.suc;
          const codProducto = row.cod;
          const fechaStr = row.fecha;
          
          if (!codPedido || !nombreSucursal || !codProducto) {
            errores++;
            continue;
          }

          // 1. Buscar o crear la sucursal
          const [sucursal] = await Sucursal.findOrCreate({
            where: { nombre: nombreSucursal }
          });

          // 2. Procesar fecha
          let fechaFormateada = new Date();
          if (fechaStr) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              // Manejo de años de 2 o 4 dígitos
              const año = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
              fechaFormateada = new Date(`${año}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`);
            }
          }

          // 3. Crear cabecera usando el código como ID principal
          const [pedido] = await PedidoSucursal.findOrCreate({
            where: { id_pedido: codPedido },
            defaults: {
              codigo_pedido: codPedido,
              id_sucursal: sucursal.id_sucursal,
              fecha_pedido: fechaFormateada,
              estado: 'Pendiente'
            }
          });

          // 4. Buscar el producto
          const producto = await Producto.findOne({ 
            where: { codigo_interno: String(codProducto) } 
          });
          
          if (producto) {
            await ItemPedido.create({
              id_pedido: pedido.id_pedido, // Aquí viaja el código tipo "PED-..."
              id_producto: producto.id_producto,
              cantidad_piezas: parseInt(row.pieza) || 0,
              cantidad_fraccionado: parseFloat(String(row.fraccionado).replace(',', '.')) || 0
            });
            creados++;
          } else {
            errores++;
          }
        }

        res.status(200).json({
          mensaje: 'Carga de pedidos completada',
          items_creados: creados,
          filas_omitidas: errores
        });

      } catch (error) {
        console.error('Error al procesar CSV:', error);
        res.status(500).json({ error: 'Error al procesar el archivo' });
      }
    });
};
