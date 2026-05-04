package com.cdfapp.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/success")
    public ResponseEntity<String> loginSuccess() {
        return ResponseEntity.ok("Login exitoso!");
    }

    @GetMapping("/failure")
    public ResponseEntity<String> loginFailure() {
        return ResponseEntity.badRequest().body("Credenciales inválidas.");
    }
}
