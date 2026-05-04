package com.cdfapp.app.service;

import com.cdfapp.app.dto.CrearPedidoDTO;
import com.cdfapp.app.dto.PedidoItemDTO;
import com.cdfapp.app.dto.PedidoResponseDTO;
import com.cdfapp.app.entity.Pedido;
import com.cdfapp.app.entity.PedidoProducto;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.entity.Sucursal;
import com.cdfapp.app.enums.EstadoPedido;
import com.cdfapp.app.enums.EstadoProducto;
import com.cdfapp.app.repository.PedidoRepository;
import com.cdfapp.app.repository.ProductoRepository;
import com.cdfapp.app.repository.SucursalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final SucursalRepository sucursalRepository;

    @Autowired
    public PedidoService(PedidoRepository pedidoRepository, ProductoRepository productoRepository, SucursalRepository sucursalRepository) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.sucursalRepository = sucursalRepository;
    }

    @Transactional
    public PedidoResponseDTO crearPedido(CrearPedidoDTO dto) {
        Sucursal sucursal = sucursalRepository.findById(dto.getSucursalId())
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada con id: " + dto.getSucursalId()));

        Pedido pedido = Pedido.builder()
                .fecha(dto.getFecha())
                .sucursal(sucursal)
                .estado(EstadoPedido.NUEVO)
                .build();

        for (PedidoItemDTO itemDTO : dto.getItems()) {
            Producto producto = productoRepository.findByCodigo(itemDTO.getCodigo())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + itemDTO.getCodigo()));

            if (itemDTO.getCantidad_fraccion() > 0) {
                pedido.addItem(PedidoProducto.builder()
                        .producto(producto)
                        .cantidad(itemDTO.getCantidad_fraccion())
                        .estado(EstadoProducto.FETEADO)
                        .build());
            }

            if (itemDTO.getCantidad_piezas() > 0) {
                pedido.addItem(PedidoProducto.builder()
                        .producto(producto)
                        .cantidad(itemDTO.getCantidad_piezas())
                        .estado(EstadoProducto.PIEZA)
                        .build());
            }
        }

        Pedido pedidoGuardado = pedidoRepository.save(pedido);
        return mapToPedidoResponseDTO(pedidoGuardado);
    }

    public List<PedidoResponseDTO> obtenerTodosLosPedidos() {
        List<Pedido> pedidos = pedidoRepository.findAllWithDetails();
        return pedidos.stream()
                .map(this::mapToPedidoResponseDTO)
                .collect(Collectors.toList());
    }

    private PedidoResponseDTO mapToPedidoResponseDTO(Pedido pedido) {
        PedidoResponseDTO.SucursalInfo sucursalInfo = new PedidoResponseDTO.SucursalInfo(
                pedido.getSucursal().getId(),
                pedido.getSucursal().getNombre()
        );

        List<PedidoResponseDTO.ItemInfo> itemInfos = pedido.getItems().stream()
                .map(item -> new PedidoResponseDTO.ItemInfo(
                        item.getId(),
                        item.getProducto().getNombre(),
                        item.getProducto().getCodigo(),
                        item.getCantidad(),
                        item.getEstado()
                ))
                .collect(Collectors.toList());

        return new PedidoResponseDTO(
                pedido.getId(),
                pedido.getFecha(),
                pedido.getEstado(),
                sucursalInfo,
                itemInfos
        );
    }
}
