package com.cdfapp.app.service;

import com.cdfapp.app.dto.EditarItemPreparadoDTO;
import com.cdfapp.app.dto.ItemPreparadoRespuestaDTO;
import com.cdfapp.app.dto.PrepararItemDTO;
import com.cdfapp.app.entity.Pedido;
import com.cdfapp.app.entity.PedidoFinal;
import com.cdfapp.app.entity.PedidoFinalItem;
import com.cdfapp.app.entity.PedidoProducto;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.enums.EstadoPedido;
import com.cdfapp.app.repository.PedidoFinalItemRepository;
import com.cdfapp.app.repository.PedidoFinalRepository;
import com.cdfapp.app.repository.PedidoRepository;
import com.cdfapp.app.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PedidoFinalService {

    private final PedidoRepository pedidoRepository;
    private final PedidoFinalRepository pedidoFinalRepository;
    private final PedidoFinalItemRepository pedidoFinalItemRepository;
    private final ProductoRepository productoRepository;

    public PedidoFinalService(PedidoRepository pedidoRepository, PedidoFinalRepository pedidoFinalRepository,
                              PedidoFinalItemRepository pedidoFinalItemRepository, ProductoRepository productoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.pedidoFinalRepository = pedidoFinalRepository;
        this.pedidoFinalItemRepository = pedidoFinalItemRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<ItemPreparadoRespuestaDTO> obtenerItemsPreparadosPorPedido(Long pedidoId) {
        Pedido pedidoOriginal = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido original no encontrado"));

        Optional<PedidoFinal> pedidoFinalOpt = pedidoFinalRepository.findByPedidoOriginalId(pedidoId);
        
        if (pedidoFinalOpt.isPresent()) {
            return obtenerListaItemsPreparados(pedidoFinalOpt.get(), pedidoOriginal);
        }
        
        // Si no hay PedidoFinal aún, devolvemos una lista vacía
        return new ArrayList<>();
    }

    @Transactional
    public List<ItemPreparadoRespuestaDTO> agregarItemPreparado(Long pedidoId, PrepararItemDTO dto) {
        Pedido pedidoOriginal = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido original no encontrado"));

        Producto producto = productoRepository.findByCodigo(dto.getProductoCodigo())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.getProductoCodigo()));

        // Buscar el PedidoFinal existente o crear uno nuevo si es el primer item que se prepara
        PedidoFinal pedidoFinal = pedidoFinalRepository.findByPedidoOriginalId(pedidoId)
                .orElseGet(() -> {
                    PedidoFinal nuevo = new PedidoFinal();
                    nuevo.setPedidoOriginal(pedidoOriginal);
                    // Actualizar el estado del pedido original a PREPARANDO la primera vez
                    if (pedidoOriginal.getEstado() == EstadoPedido.NUEVO || pedidoOriginal.getEstado() == EstadoPedido.INICIADO) {
                        pedidoOriginal.setEstado(EstadoPedido.PREPARANDO);
                        pedidoRepository.save(pedidoOriginal);
                    }
                    return pedidoFinalRepository.save(nuevo);
                });

        // Crear el nuevo item confirmado
        PedidoFinalItem nuevoItem = PedidoFinalItem.builder()
                .pedidoFinal(pedidoFinal)
                .producto(producto)
                .estado(dto.getEstado())
                .cantidad(dto.getCantidad())
                .pesoReal(dto.getPesoReal())
                .build();

        pedidoFinal.addItem(nuevoItem);
        pedidoFinalRepository.save(pedidoFinal);
        
        return obtenerListaItemsPreparados(pedidoFinal, pedidoOriginal);
    }

    @Transactional
    public List<ItemPreparadoRespuestaDTO> editarItemPreparado(Long itemId, EditarItemPreparadoDTO dto) {
        PedidoFinalItem itemFinal = pedidoFinalItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item preparado no encontrado con id: " + itemId));
                
        // Actualizamos los valores
        itemFinal.setCantidad(dto.getCantidad());
        itemFinal.setPesoReal(dto.getPesoReal());
        pedidoFinalItemRepository.save(itemFinal);
        
        PedidoFinal pedidoFinal = itemFinal.getPedidoFinal();
        Pedido pedidoOriginal = pedidoFinal.getPedidoOriginal();
        
        return obtenerListaItemsPreparados(pedidoFinal, pedidoOriginal);
    }
    
    private List<ItemPreparadoRespuestaDTO> obtenerListaItemsPreparados(PedidoFinal pedidoFinal, Pedido pedidoOriginal) {
        List<ItemPreparadoRespuestaDTO> respuesta = new ArrayList<>();
        
        for (PedidoFinalItem item : pedidoFinal.getItems()) {
            Integer cantidadPedida = 0;
            for (PedidoProducto pp : pedidoOriginal.getItems()) {
                if (pp.getProducto().getCodigo().equals(item.getProducto().getCodigo()) 
                        && pp.getEstado() == item.getEstado()) {
                    cantidadPedida = pp.getCantidad();
                    break;
                }
            }
            
            ItemPreparadoRespuestaDTO dto = new ItemPreparadoRespuestaDTO(
                    item.getId(),
                    item.getProducto().getCodigo(),
                    item.getEstado(),
                    item.getCantidad(),
                    item.getPesoReal(),
                    cantidadPedida
            );
            
            respuesta.add(dto);
        }
        
        return respuesta;
    }
}
