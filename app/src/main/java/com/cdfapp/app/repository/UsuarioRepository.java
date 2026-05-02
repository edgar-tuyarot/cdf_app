package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Busca un usuario por su nombre de usuario. Ideal para el proceso de login.
    Optional<Usuario> findByUsername(String username);


}