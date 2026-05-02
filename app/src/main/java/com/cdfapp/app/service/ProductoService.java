package com.cdfapp.app.service;

import com.cdfapp.app.dto.CrearProductoDto;
import com.cdfapp.app.dto.ProductoDtoResponse;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    @Autowired
    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<ProductoDtoResponse> obtenerTodosLosProductos() {
        List<ProductoDtoResponse> productos = new ArrayList<>();

        productoRepository.findAll().forEach(producto -> {
            ProductoDtoResponse dto = new ProductoDtoResponse(
                    producto.getCodigo(),
                    producto.getNombre(),
                    producto.getPicable(),
                    producto.getFeteable(),
                    producto.getKilosPorBolsita()
            );
            productos.add(dto);
        });

        return productos;
    }

    public Optional<Producto> obtenerProductoPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto crearProducto(CrearProductoDto producto) {

        if(productoRepository.findByCodigo(producto.codigo()).isPresent()){
            return null;
        };

        Producto nuevoProducto = Producto.builder()
                .nombre(producto.nombre())
                .codigo(producto.codigo())
                .picable(producto.picable())
                .feteable(producto.feteable())
                .kilosPorBolsita(producto.kilosPorBolsita())
                .build();
        return productoRepository.save(nuevoProducto);
    }

    public Producto actualizarProducto(Long id, Producto productoDetails) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        producto.setCodigo(productoDetails.getCodigo());
        producto.setNombre(productoDetails.getNombre());
        producto.setPicable(productoDetails.getPicable());
        producto.setFeteable(productoDetails.getFeteable());
        producto.setKilosPorBolsita(productoDetails.getKilosPorBolsita());
        // La actualización del proveedor puede ser más compleja, pero para un CRUD simple, esto es suficiente.
        producto.setProveedor(productoDetails.getProveedor());
        
        return productoRepository.save(producto);
    }

    public void eliminarProducto(Long id) {
        productoRepository.deleteById(id);
    }
}