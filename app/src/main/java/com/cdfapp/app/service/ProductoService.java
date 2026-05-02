package com.cdfapp.app.service;

import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    @Autowired
    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> obtenerTodosLosProductos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> obtenerProductoPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto crearProducto(Producto producto) {
        // Aquí podrías añadir lógica para validar que el 'codigo' no exista ya
        return productoRepository.save(producto);
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