package com.cdfapp.app.service;

import com.cdfapp.app.dto.FraccionadoDTO;
import com.cdfapp.app.entity.Fraccionado;
import com.cdfapp.app.repository.FraccionadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FraccionadoService {

    private final FraccionadoRepository fraccionadoRepository;

    @Autowired
    public FraccionadoService(FraccionadoRepository fraccionadoRepository) {
        this.fraccionadoRepository = fraccionadoRepository;
    }

    public FraccionadoDTO crearFraccionado(FraccionadoDTO dto) {
        Fraccionado fraccionado = new Fraccionado();
        fraccionado.setCodigoProducto(dto.getCodigoProducto());
        fraccionado.setCodigoProductoOriginal(dto.getCodigoProductoOriginal());
        Fraccionado guardado = fraccionadoRepository.save(fraccionado);
        return mapToDTO(guardado);
    }

    public List<FraccionadoDTO> obtenerTodos() {
        return fraccionadoRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public FraccionadoDTO obtenerPorId(Long id) {
        Fraccionado fraccionado = fraccionadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Regla de fraccionado no encontrada con id: " + id));
        return mapToDTO(fraccionado);
    }

    public FraccionadoDTO actualizarFraccionado(Long id, FraccionadoDTO dto) {
        Fraccionado fraccionado = fraccionadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Regla de fraccionado no encontrada con id: " + id));
        fraccionado.setCodigoProducto(dto.getCodigoProducto());
        fraccionado.setCodigoProductoOriginal(dto.getCodigoProductoOriginal());
        Fraccionado actualizado = fraccionadoRepository.save(fraccionado);
        return mapToDTO(actualizado);
    }

    public void eliminarFraccionado(Long id) {
        if (!fraccionadoRepository.existsById(id)) {
            throw new RuntimeException("Regla de fraccionado no encontrada con id: " + id);
        }
        fraccionadoRepository.deleteById(id);
    }

    private FraccionadoDTO mapToDTO(Fraccionado fraccionado) {
        FraccionadoDTO dto = new FraccionadoDTO();
        dto.setId(fraccionado.getId());
        dto.setCodigoProducto(fraccionado.getCodigoProducto());
        dto.setCodigoProductoOriginal(fraccionado.getCodigoProductoOriginal());
        return dto;
    }
}
