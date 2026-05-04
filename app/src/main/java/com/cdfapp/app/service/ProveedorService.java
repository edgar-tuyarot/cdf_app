package com.cdfapp.app.service;

import com.cdfapp.app.dto.ProveedorDTO;
import com.cdfapp.app.dto.ProveedorResponseDTO;
import com.cdfapp.app.entity.Proveedor;
import com.cdfapp.app.repository.ProveedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    @Transactional
    public ProveedorResponseDTO crearProveedor(ProveedorDTO dto) {
        Proveedor proveedor = new Proveedor();
        proveedor.setNombre(dto.getNombre());
        proveedor.setDireccion(dto.getDireccion());
        proveedor.setTelefono(dto.getTelefono());
        Proveedor nuevoProveedor = proveedorRepository.save(proveedor);
        return toResponseDTO(nuevoProveedor);
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponseDTO> getAllProveedores() {
        return proveedorRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ProveedorResponseDTO> getProveedorById(Long id) {
        return proveedorRepository.findById(id).map(this::toResponseDTO);
    }

    @Transactional
    public ProveedorResponseDTO actualizarProveedor(Long id, ProveedorDTO dto) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + id));
        
        proveedor.setNombre(dto.getNombre());
        proveedor.setDireccion(dto.getDireccion());
        proveedor.setTelefono(dto.getTelefono());
        
        Proveedor proveedorActualizado = proveedorRepository.save(proveedor);
        return toResponseDTO(proveedorActualizado);
    }

    @Transactional
    public void eliminarProveedor(Long id) {
        if (!proveedorRepository.existsById(id)) {
            throw new RuntimeException("Proveedor no encontrado con id: " + id);
        }
        proveedorRepository.deleteById(id);
    }

    private ProveedorResponseDTO toResponseDTO(Proveedor proveedor) {
        ProveedorResponseDTO dto = new ProveedorResponseDTO();
        dto.setId(proveedor.getId());
        dto.setNombre(proveedor.getNombre());
        dto.setDireccion(proveedor.getDireccion());
        dto.setTelefono(proveedor.getTelefono());
        return dto;
    }
}
