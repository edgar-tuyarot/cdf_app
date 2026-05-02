package com.cdfapp.app.dto;

import java.math.BigDecimal;

public record ProductoDtoResponse(
        String codigo,
        String nombre,
        Boolean picable,
        Boolean feteable,
        BigDecimal pesoPorBolsita
) {
}
