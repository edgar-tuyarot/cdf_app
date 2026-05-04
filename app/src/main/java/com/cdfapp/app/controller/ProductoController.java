package com.cdfapp.app.controller;

import com.cdfapp.app.dto.*;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.service.ExcelService;
import com.cdfapp.app.service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;
    private final ExcelService excelService;

    @Autowired
    public ProductoController(ProductoService productoService, ExcelService excelService) {
        this.productoService = productoService;
        this.excelService = excelService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> subirExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo no puede estar vacío."));
        }

        try {
            List<ProductoExcelDTO> productosLeidos = excelService.leerDesdeExcel(file.getInputStream());
            productoService.procesarCargaMasiva(productosLeidos);
            return ResponseEntity.ok(Map.of(
                "message", "Archivo procesado exitosamente.",
                "registrosProcesados", productosLeidos.size()
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error al leer el archivo."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public List<ProductoDtoResponse> obtenerTodosLosProductos() {
        return productoService.obtenerTodosLosProductos();
    }

    @GetMapping("/feteados")
    public ResponseEntity<List<ProductoFeteadoDTO>> obtenerProductosFeteados() {
        List<ProductoFeteadoDTO> productos = productoService.obtenerProductosFeteados();
        return ResponseEntity.ok(productos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerProductoPorId(@PathVariable String id) {
        return productoService.obtenerProductoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@RequestBody CrearProductoDto producto) {
        Producto nuevoProducto = productoService.crearProducto(producto);
        return new ResponseEntity<>(nuevoProducto, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable String id, @RequestBody ActualizarProductoDTO productoDetails) {
        try {
            Producto productoActualizado = productoService.actualizarProducto(id, productoDetails);
            return ResponseEntity.ok(productoActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }
}