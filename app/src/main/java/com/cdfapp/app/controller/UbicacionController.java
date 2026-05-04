package com.cdfapp.app.controller;

import com.cdfapp.app.dto.UbicacionDTO;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.service.UbicacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ubicaciones")
public class UbicacionController {

    private final UbicacionService ubicacionService;

    public UbicacionController(UbicacionService ubicacionService) {
        this.ubicacionService = ubicacionService;
    }

    @PostMapping
    public ResponseEntity<Ubicacion> crearUbicacion(@RequestBody UbicacionDTO dto) {
        Ubicacion nuevaUbicacion = ubicacionService.crearUbicacion(dto);
        return ResponseEntity.ok(nuevaUbicacion);
    }

    @GetMapping
    public ResponseEntity<List<Ubicacion>> getAllUbicaciones() {
        List<Ubicacion> ubicaciones = ubicacionService.getAllUbicaciones();
        return ResponseEntity.ok(ubicaciones);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ubicacion> getUbicacionById(@PathVariable Long id) {
        return ubicacionService.getUbicacionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ubicacion> actualizarUbicacion(@PathVariable Long id, @RequestBody UbicacionDTO dto) {
        Ubicacion ubicacionActualizada = ubicacionService.actualizarUbicacion(id, dto);
        return ResponseEntity.ok(ubicacionActualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUbicacion(@PathVariable Long id) {
        ubicacionService.eliminarUbicacion(id);
        return ResponseEntity.noContent().build();
    }
}
