package com.cdfapp.app.controller;

import com.cdfapp.app.dto.EditarItemPreparadoDTO;
import com.cdfapp.app.dto.ItemPreparadoRespuestaDTO;
import com.cdfapp.app.dto.PrepararItemDTO;
import com.cdfapp.app.service.PedidoFinalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoFinalController {

    private final PedidoFinalService pedidoFinalService;

    public PedidoFinalController(PedidoFinalService pedidoFinalService) {
        this.pedidoFinalService = pedidoFinalService;
    }

    @GetMapping("/{pedidoId}/items-preparados")
    public ResponseEntity<List<ItemPreparadoRespuestaDTO>> obtenerItemsPreparadosPorPedido(@PathVariable Long pedidoId) {
        try {
            List<ItemPreparadoRespuestaDTO> items = pedidoFinalService.obtenerItemsPreparadosPorPedido(pedidoId);
            return ResponseEntity.ok(items);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{pedidoId}/preparar-item")
    public ResponseEntity<List<ItemPreparadoRespuestaDTO>> agregarItemPreparado(@PathVariable Long pedidoId, @RequestBody PrepararItemDTO dto) {
        List<ItemPreparadoRespuestaDTO> itemsActualizados = pedidoFinalService.agregarItemPreparado(pedidoId, dto);
        return ResponseEntity.ok(itemsActualizados);
    }

    @PutMapping("/items-preparados/{itemId}")
    public ResponseEntity<List<ItemPreparadoRespuestaDTO>> editarItemPreparado(@PathVariable Long itemId, @RequestBody EditarItemPreparadoDTO dto) {
        try {
            List<ItemPreparadoRespuestaDTO> itemsActualizados = pedidoFinalService.editarItemPreparado(itemId, dto);
            return ResponseEntity.ok(itemsActualizados);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
