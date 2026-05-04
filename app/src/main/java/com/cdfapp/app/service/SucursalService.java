package com.cdfapp.app.service;

import com.cdfapp.app.dto.CrearSucursalDTO;
import com.cdfapp.app.dto.SucursalResponseDTO;
import com.cdfapp.app.entity.Sucursal;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.repository.SucursalRepository;
import com.cdfapp.app.repository.UbicacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;
    private final UbicacionRepository ubicacionRepository;

    @Autowired
    public SucursalService(SucursalRepository sucursalRepository, UbicacionRepository ubicacionRepository) {
        this.sucursalRepository = sucursalRepository;
        this.ubicacionRepository = ubicacionRepository;
    }

    @Transactional
    public SucursalResponseDTO crearSucursal(CrearSucursalDTO dto) {
        Ubicacion ubicacion;

        if (dto.getUbicacionId() != null) {
            ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                    .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));
        } else {
            ubicacion = Ubicacion.builder()
                    .nombre(dto.getNombre())
                    .descripcion("Ubicación de la sucursal " + dto.getNombre())
                    .numero(dto.getNumero())
                    .build();
            ubicacion = ubicacionRepository.save(ubicacion);
        }

        Sucursal nuevaSucursal = Sucursal.builder()
                .nombre(dto.getNombre())
                .numero(dto.getNumero())
                .direccion(dto.getDireccion())
                .telefono(dto.getTelefono())
                .ubicacion(ubicacion)
                .build();

        Sucursal sucursalGuardada = sucursalRepository.save(nuevaSucursal);
        return mapToSucursalResponseDTO(sucursalGuardada);
    }

    public List<SucursalResponseDTO> obtenerTodasLasSucursales() {
        // Usamos el nuevo método optimizado
        return sucursalRepository.findAllWithUbicacion().stream()
                .map(this::mapToSucursalResponseDTO)
                .collect(Collectors.toList());
    }

    public SucursalResponseDTO obtenerSucursalPorId(Long id) {
        Sucursal sucursal = sucursalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada con id: " + id));
        return mapToSucursalResponseDTO(sucursal);
    }

    @Transactional
    public SucursalResponseDTO actualizarSucursal(Long id, CrearSucursalDTO dto) {
        Sucursal sucursal = sucursalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada con id: " + id));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));

        sucursal.setNombre(dto.getNombre());
        sucursal.setNumero(dto.getNumero());
        sucursal.setDireccion(dto.getDireccion());
        sucursal.setTelefono(dto.getTelefono());
        sucursal.setUbicacion(ubicacion);

        Sucursal sucursalActualizada = sucursalRepository.save(sucursal);
        return mapToSucursalResponseDTO(sucursalActualizada);
    }

    public void eliminarSucursal(Long id) {
        if (!sucursalRepository.existsById(id)) {
            throw new RuntimeException("Sucursal no encontrada con id: " + id);
        }
        sucursalRepository.deleteById(id);
    }

    private SucursalResponseDTO mapToSucursalResponseDTO(Sucursal sucursal) {
        SucursalResponseDTO.UbicacionDTO ubicacionDTO = new SucursalResponseDTO.UbicacionDTO(sucursal.getUbicacion());
        return new SucursalResponseDTO(
                sucursal.getId(),
                sucursal.getNombre(),
                sucursal.getNumero(),
                sucursal.getDireccion(),
                sucursal.getTelefono(),
                ubicacionDTO
        );
    }
}
