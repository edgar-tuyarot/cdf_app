package com.cdfapp.app.controller;

import com.cdfapp.app.dto.CrearPedidoDTO;
import com.cdfapp.app.dto.PedidoItemDTO;
import com.cdfapp.app.dto.PedidoResponseDTO;
import com.cdfapp.app.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    @Autowired
    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    public ResponseEntity<?> crearPedido(@RequestBody CrearPedidoDTO dto) {
        try {
            PedidoResponseDTO nuevoPedido = pedidoService.crearPedido(dto);
            return new ResponseEntity<>(nuevoPedido, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @PostMapping("/{pedidoId}/items")
    public ResponseEntity<?> agregarItemAdicional(@PathVariable Long pedidoId, @RequestBody PedidoItemDTO dto) {
        try {
            PedidoResponseDTO pedidoActualizado = pedidoService.agregarItemAdicional(pedidoId, dto);
            return ResponseEntity.ok(pedidoActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<PedidoResponseDTO>> obtenerTodosLosPedidos() {
        List<PedidoResponseDTO> pedidos = pedidoService.obtenerTodosLosPedidos();
        return ResponseEntity.ok(pedidos);
    }
}
