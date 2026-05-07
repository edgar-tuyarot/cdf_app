package com.cdfapp.app.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecorteRequestDTO {
    private String codigoProducto;
    private BigDecimal peso;
    private Long usuarioId;
    private Long ubicacionId; // Asumiremos 1 por defecto si no se envía, pero es bueno tenerlo
}
