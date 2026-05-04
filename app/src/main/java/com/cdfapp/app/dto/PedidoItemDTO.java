package com.cdfapp.app.dto;

import lombok.Data;

@Data
public class PedidoItemDTO {
    private String codigo;
    private int cantidad_fraccion;
    private int cantidad_piezas;
}
