package com.cdfapp.app.controller;

import com.cdfapp.app.dto.FraccionadoDTO;
import com.cdfapp.app.service.FraccionadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fraccionados")
public class FraccionadoController {

    private final FraccionadoService fraccionadoService;

    @Autowired
    public FraccionadoController(FraccionadoService fraccionadoService) {
        this.fraccionadoService = fraccionadoService;
    }

    @PostMapping
    public ResponseEntity<FraccionadoDTO> crearFraccionado(@RequestBody FraccionadoDTO dto) {
        FraccionadoDTO nuevoFraccionado = fraccionadoService.crearFraccionado(dto);
        return new ResponseEntity<>(nuevoFraccionado, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FraccionadoDTO>> obtenerTodos() {
        List<FraccionadoDTO> fraccionados = fraccionadoService.obtenerTodos();
        return ResponseEntity.ok(fraccionados);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FraccionadoDTO> obtenerPorId(@PathVariable Long id) {
        try {
            FraccionadoDTO fraccionado = fraccionadoService.obtenerPorId(id);
            return ResponseEntity.ok(fraccionado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FraccionadoDTO> actualizarFraccionado(@PathVariable Long id, @RequestBody FraccionadoDTO dto) {
        try {
            FraccionadoDTO actualizado = fraccionadoService.actualizarFraccionado(id, dto);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarFraccionado(@PathVariable Long id) {
        try {
            fraccionadoService.eliminarFraccionado(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
