package com.cdfapp.app.controller;

import com.cdfapp.app.dto.CrearSucursalDTO;
import com.cdfapp.app.dto.SucursalResponseDTO;
import com.cdfapp.app.service.SucursalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sucursales")
public class SucursalController {

    private final SucursalService sucursalService;

    @Autowired
    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    @PostMapping
    public ResponseEntity<SucursalResponseDTO> crearSucursal(@RequestBody CrearSucursalDTO dto) {
        SucursalResponseDTO nuevaSucursal = sucursalService.crearSucursal(dto);
        return new ResponseEntity<>(nuevaSucursal, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SucursalResponseDTO>> obtenerTodasLasSucursales() {
        List<SucursalResponseDTO> sucursales = sucursalService.obtenerTodasLasSucursales();
        return ResponseEntity.ok(sucursales);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SucursalResponseDTO> obtenerSucursalPorId(@PathVariable Long id) {
        try {
            SucursalResponseDTO sucursal = sucursalService.obtenerSucursalPorId(id);
            return ResponseEntity.ok(sucursal);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SucursalResponseDTO> actualizarSucursal(@PathVariable Long id, @RequestBody CrearSucursalDTO dto) {
        try {
            SucursalResponseDTO sucursalActualizada = sucursalService.actualizarSucursal(id, dto);
            return ResponseEntity.ok(sucursalActualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSucursal(@PathVariable Long id) {
        try {
            sucursalService.eliminarSucursal(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
