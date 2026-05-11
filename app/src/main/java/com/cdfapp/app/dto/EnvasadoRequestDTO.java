package com.cdfapp.app.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EnvasadoRequestDTO {
    private String codigo;
    private Long ubicacionId;
    private Long usuarioId;
    private Integer cantidad;
    private BigDecimal kilos;
}
