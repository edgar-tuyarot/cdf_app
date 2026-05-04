package com.cdfapp.app.dto;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class CrearPedidoDTO {
    private Long sucursalId;
    private Date fecha;
    private List<PedidoItemDTO> items;
}
