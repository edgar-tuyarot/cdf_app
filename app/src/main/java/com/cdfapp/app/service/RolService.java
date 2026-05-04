package com.cdfapp.app.service;

import com.cdfapp.app.dto.RolDTO;
import com.cdfapp.app.entity.Rol;
import com.cdfapp.app.repository.RolRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class RolService {

    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    @Transactional
    public Rol crearRol(RolDTO dto) {
        Rol rol = new Rol();
        rol.setNombre(dto.getNombre());
        return rolRepository.save(rol);
    }

    @Transactional(readOnly = true)
    public List<Rol> getAllRoles() {
        return rolRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Rol> getRolById(Long id) {
        return rolRepository.findById(id);
    }

    @Transactional
    public Rol actualizarRol(Long id, RolDTO dto) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado con id: " + id));
        
        rol.setNombre(dto.getNombre());
        
        return rolRepository.save(rol);
    }

    @Transactional
    public void eliminarRol(Long id) {
        if (!rolRepository.existsById(id)) {
            throw new RuntimeException("Rol no encontrado con id: " + id);
        }
        rolRepository.deleteById(id);
    }
}
