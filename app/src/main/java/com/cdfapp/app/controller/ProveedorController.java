package com.cdfapp.app.controller;

import com.cdfapp.app.dto.ProveedorDTO;
import com.cdfapp.app.dto.ProveedorResponseDTO;
import com.cdfapp.app.service.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @PostMapping
    public ResponseEntity<ProveedorResponseDTO> crearProveedor(@RequestBody ProveedorDTO dto) {
        ProveedorResponseDTO nuevoProveedor = proveedorService.crearProveedor(dto);
        return ResponseEntity.ok(nuevoProveedor);
    }

    @GetMapping
    public ResponseEntity<List<ProveedorResponseDTO>> getAllProveedores() {
        List<ProveedorResponseDTO> proveedores = proveedorService.getAllProveedores();
        return ResponseEntity.ok(proveedores);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProveedorResponseDTO> getProveedorById(@PathVariable Long id) {
        return proveedorService.getProveedorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProveedorResponseDTO> actualizarProveedor(@PathVariable Long id, @RequestBody ProveedorDTO dto) {
        ProveedorResponseDTO proveedorActualizado = proveedorService.actualizarProveedor(id, dto);
        return ResponseEntity.ok(proveedorActualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProveedor(@PathVariable Long id) {
        proveedorService.eliminarProveedor(id);
        return ResponseEntity.noContent().build();
    }
}
