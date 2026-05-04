package com.cdfapp.app.service;

import com.cdfapp.app.dto.ExistenciaRequestDTO;
import com.cdfapp.app.dto.ExistenciaSummaryDTO;
import com.cdfapp.app.entity.Existencia;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.repository.ExistenciaRepository;
import com.cdfapp.app.repository.ProductoRepository;
import com.cdfapp.app.repository.UbicacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExistenciaService {

    private final ExistenciaRepository existenciaRepository;
    private final ProductoRepository productoRepository;
    private final UbicacionRepository ubicacionRepository;

    public ExistenciaService(ExistenciaRepository existenciaRepository, ProductoRepository productoRepository, UbicacionRepository ubicacionRepository) {
        this.existenciaRepository = existenciaRepository;
        this.productoRepository = productoRepository;
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional
    public Existencia crearExistencia(ExistenciaRequestDTO dto) {
        Producto producto = (Producto) productoRepository.findByCodigo(dto.getCodigo_producto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.getCodigo_producto()));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));

        Existencia existencia = new Existencia();
        existencia.setProducto(producto);
        existencia.setEstado(dto.getEstado());
        existencia.setKilos(dto.getKilos());
        existencia.setUnidades(dto.getUnidades());
        existencia.setUbicacion(ubicacion);

        return existenciaRepository.save(existencia);
    }

    @Transactional(readOnly = true)
    public List<ExistenciaSummaryDTO> getExistenciaSummary() {
        return existenciaRepository.getExistenciaSummary();
    }

    // --- Método de Diagnóstico ---
    @Transactional(readOnly = true)
    public List<Existencia> getRawExistencias() {
        return existenciaRepository.findAllWithDetails();
    }
}
