package com.cdfapp.app.controller;

import com.cdfapp.app.dto.AuthResponse;
import com.cdfapp.app.dto.LoginRequest;
import com.cdfapp.app.entity.Usuario;
import com.cdfapp.app.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;

    @Autowired
    public AuthController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(loginRequest.getUsername());

        // --- ¡ADVERTENCIA DE SEGURIDAD! ---
        // Esta es una comparación de texto plano, NO es segura para producción.
        // Debes usar un PasswordEncoder para comparar la contraseña hasheada.
        if (usuarioOpt.isPresent() && usuarioOpt.get().getPassword().equals(loginRequest.getPassword())) {
            // Si las credenciales son correctas, en el futuro aquí generarías un token JWT.
            return ResponseEntity.ok(new AuthResponse("Login exitoso"));
        }

        return ResponseEntity.status(401).body(new AuthResponse("Credenciales inválidas"));
    }
}