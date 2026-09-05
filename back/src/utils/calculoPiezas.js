function calcularPiezasProducto(stockPeso, producto) {
  if (stockPeso == null || stockPeso <= 0 || !producto) return 0;
  
  const tipo = producto.tipo_calculo_piezas || 'normal';
  const pesoPieza = parseFloat(producto.peso_pieza || producto.peso_pieza) || 0;
  const pesoFraccion = parseFloat(producto.peso_fraccion || producto.peso_fraccion) || 0;
  const pesoUnidad = parseFloat(producto.peso_unidad || producto.peso_unidad) || 1.000;
  const numStock = parseFloat(stockPeso) || 0;

  switch (tipo) {
    case 'fraccionado':
      if (pesoFraccion <= 0) return 0;
      return Math.floor(numStock / pesoFraccion);
    case 'unidad':
      if (pesoUnidad <= 0) return 0;
      return Math.floor(numStock / pesoUnidad);
    case 'normal':
    default:
      if (pesoPieza <= 0) return 0;
      return Math.floor(numStock / pesoPieza);
  }
}

module.exports = { calcularPiezasProducto };
