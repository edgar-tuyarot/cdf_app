package com.cdfapp.app.service;

import com.cdfapp.app.dto.*;
import com.cdfapp.app.entity.Existencia;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.entity.Proveedor;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.enums.EstadoProducto;
import com.cdfapp.app.repository.ExistenciaRepository;
import com.cdfapp.app.repository.ProductoRepository;
import com.cdfapp.app.repository.ProveedorRepository;
import com.cdfapp.app.repository.UbicacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final ExistenciaRepository existenciaRepository;
    private final UbicacionRepository ubicacionRepository;

    @Autowired
    public ProductoService(ProductoRepository productoRepository, ProveedorRepository proveedorRepository, ExistenciaRepository existenciaRepository, UbicacionRepository ubicacionRepository) {
        this.productoRepository = productoRepository;
        this.proveedorRepository = proveedorRepository;
        this.existenciaRepository = existenciaRepository;
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional
    public void procesarCargaMasiva(List<ProductoExcelDTO> productosExcel) {
        Ubicacion ubicacionPorDefecto = ubicacionRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("La ubicación con ID 1 no fue encontrada. Asegúrese de que exista."));

        for (ProductoExcelDTO dto : productosExcel) {
            if (dto.getCodigo_productos() == null || dto.getCodigo_productos().trim().isEmpty() ||
                dto.getProducto() == null || dto.getProducto().trim().isEmpty()) {
                continue;
            }

            Producto producto = productoRepository.findByCodigo(dto.getCodigo_productos())
                    .orElseGet(() -> {
                        Producto nuevoProducto = Producto.builder()
                                .codigo(dto.getCodigo_productos())
                                .nombre(dto.getProducto())
                                .picable(false)
                                .feteable(false)
                                .proveedor(null)
                                .build();
                        return productoRepository.save(nuevoProducto);
                    });

            BigDecimal cantidad;
            try {
                String cantidadStr = dto.getCantidad_fisica().replace(',', '.');
                cantidad = new BigDecimal(cantidadStr);
            } catch (NumberFormatException | NullPointerException e) {
                System.err.println("Formato de número inválido o nulo para el producto " + dto.getCodigo_productos() + ": " + dto.getCantidad_fisica() + ". Omitiendo fila.");
                continue;
            }

            Optional<Existencia> existenciaOpt = existenciaRepository.findByProductoAndEstadoAndUbicacion(
                    producto, EstadoProducto.KILOS, ubicacionPorDefecto);

            Existencia existencia;
            if (existenciaOpt.isPresent()) {
                existencia = existenciaOpt.get();
                // REEMPLAZA el valor actual con el del Excel
                existencia.setKilos(cantidad);
            } else {
                // Si no existe, crea una nueva con el valor del Excel
                existencia = Existencia.builder()
                        .producto(producto)
                        .estado(EstadoProducto.KILOS)
                        .ubicacion(ubicacionPorDefecto)
                        .kilos(cantidad)
                        .unidades(0)
                        .build();
            }
            existenciaRepository.save(existencia);
        }
    }

    @Transactional
    public Producto actualizarProducto(String id, ActualizarProductoDTO dto) {
        Producto producto = productoRepository.findByCodigo(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        producto.setCodigo(dto.getCodigo());
        producto.setNombre(dto.getNombre());
        producto.setPicable(dto.getPicable());
        producto.setFeteable(dto.getFeteable());
        producto.setKilosPorBolsita(dto.getKilosPorBolsita());

        if (dto.getProveedorId() != null) {
            Proveedor proveedor = proveedorRepository.findById(dto.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + dto.getProveedorId()));
            producto.setProveedor(proveedor);
        } else {
            producto.setProveedor(null);
        }
        
        return productoRepository.save(producto);
    }

    public List<ProductoDtoResponse> obtenerTodosLosProductos() {
        return productoRepository.findAllWithProveedor().stream()
                .map(producto -> new ProductoDtoResponse(
                        producto.getCodigo(),
                        producto.getNombre(),
                        producto.getPicable(),
                        producto.getFeteable(),
                        producto.getKilosPorBolsita()
                ))
                .collect(Collectors.toList());
    }

    public List<ProductoFeteadoDTO> obtenerProductosFeteados() {
        return existenciaRepository.getProductosFeteadosStatus();
    }

    public Optional<Producto> obtenerProductoPorId(String id) {
        return productoRepository.findByCodigo(id);
    }

    public Producto crearProducto(CrearProductoDto producto) {
        if(productoRepository.findByCodigo(producto.codigo()).isPresent()){
            return null;
        };
        Proveedor proveedor = proveedorRepository.getById(producto.proveedorId());
        Producto nuevoProducto = Producto.builder()
                .nombre(producto.nombre())
                .codigo(producto.codigo())
                .picable(producto.picable())
                .feteable(producto.feteable())
                .kilosPorBolsita(producto.kilosPorBolsita())
                .proveedor(proveedor)
                .build();
        return productoRepository.save(nuevoProducto);
    }

    public void eliminarProducto(Long id) {
        productoRepository.deleteById(id);
    }
}
