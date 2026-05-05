package com.cdfapp.app.controller;

import com.cdfapp.app.dto.EnvasadoRequestDTO;
import com.cdfapp.app.dto.ProcesamientoRequestDTO;
import com.cdfapp.app.dto.ProcesoRespuestaDTO;
import com.cdfapp.app.entity.Proceso;
import com.cdfapp.app.service.ProcesoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/procesos")
public class ProcesoController {

    private final ProcesoService procesoService;

    public ProcesoController(ProcesoService procesoService) {
        this.procesoService = procesoService;
    }

    @PostMapping("/fraccionar")
    public ResponseEntity<Proceso> procesarStock(@RequestBody ProcesamientoRequestDTO dto) {
        Proceso nuevoProceso = procesoService.procesarStock(dto);
        return ResponseEntity.ok(nuevoProceso);
    }

    @PostMapping("/envasar")
    public ResponseEntity<Proceso> procesarEnvasado(@RequestBody EnvasadoRequestDTO dto) {
        Proceso nuevoProceso = procesoService.procesarEnvasado(dto);
        return ResponseEntity.ok(nuevoProceso);
    }

    @GetMapping
    public ResponseEntity<List<ProcesoRespuestaDTO>> getTodosLosProcesos() {
        List<ProcesoRespuestaDTO> procesos = procesoService.getTodosLosProcesos();
        return ResponseEntity.ok(procesos);
    }
}
