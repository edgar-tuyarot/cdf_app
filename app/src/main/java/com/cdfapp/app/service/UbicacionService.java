package com.cdfapp.app.service;

import com.cdfapp.app.dto.UbicacionDTO;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.repository.UbicacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UbicacionService {

    private final UbicacionRepository ubicacionRepository;

    public UbicacionService(UbicacionRepository ubicacionRepository) {
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional
    public Ubicacion crearUbicacion(UbicacionDTO dto) {
        Ubicacion ubicacion = new Ubicacion();
        ubicacion.setNombre(dto.getNombre());
        ubicacion.setDescripcion(dto.getDescripcion());
        ubicacion.setNumero(dto.getNumero());
        return ubicacionRepository.save(ubicacion);
    }

    @Transactional(readOnly = true)
    public List<Ubicacion> getAllUbicaciones() {
        return ubicacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Ubicacion> getUbicacionById(Long id) {
        return ubicacionRepository.findById(id);
    }

    @Transactional
    public Ubicacion actualizarUbicacion(Long id, UbicacionDTO dto) {
        Ubicacion ubicacion = ubicacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + id));
        
        ubicacion.setNombre(dto.getNombre());
        ubicacion.setDescripcion(dto.getDescripcion());
        ubicacion.setNumero(dto.getNumero());
        
        return ubicacionRepository.save(ubicacion);
    }

    @Transactional
    public void eliminarUbicacion(Long id) {
        if (!ubicacionRepository.existsById(id)) {
            throw new RuntimeException("Ubicación no encontrada con id: " + id);
        }
        ubicacionRepository.deleteById(id);
    }
}
