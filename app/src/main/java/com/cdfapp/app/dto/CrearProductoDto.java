package com.cdfapp.app.dto;

import java.math.BigDecimal;

public record CrearProductoDto(
        String codigo,
        String nombre,
        Boolean picable,
        Boolean feteable,
        BigDecimal kilosPorBolsita,
        Long proveedorId
) {
}
