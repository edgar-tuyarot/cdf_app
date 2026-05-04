package com.cdfapp.app.dto;

import com.cdfapp.app.enums.EstadoPedido;
import com.cdfapp.app.enums.EstadoProducto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PedidoResponseDTO {
    private Long id;
    private Date fecha;
    private EstadoPedido estado;
    private SucursalInfo sucursal;
    private List<ItemInfo> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SucursalInfo {
        private Long id;
        private String nombre;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemInfo {
        private Long id;
        private String productoNombre;
        private String productoCodigo;
        private Integer cantidad;
        private EstadoProducto tipo;
    }
}
