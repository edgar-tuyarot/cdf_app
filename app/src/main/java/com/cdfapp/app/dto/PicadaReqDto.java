package com.cdfapp.app.dto;

import java.math.BigDecimal;

public record PicadaReqDto(
        String codigo,
        BigDecimal peso,
        Long ubicacionId,
        Long usuarioId
) {
}
