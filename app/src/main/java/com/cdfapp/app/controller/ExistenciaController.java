package com.cdfapp.app.controller;

import com.cdfapp.app.dto.ExistenciaRequestDTO;
import com.cdfapp.app.dto.ExistenciaSummaryDTO;
import com.cdfapp.app.dto.PicadaReqDto;
import com.cdfapp.app.dto.PicadaResDto;
import com.cdfapp.app.entity.Existencia;
import com.cdfapp.app.service.ExistenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/existencias")
public class ExistenciaController {

    private final ExistenciaService existenciaService;

    public ExistenciaController(ExistenciaService existenciaService) {
        this.existenciaService = existenciaService;
    }

    @PostMapping
    public ResponseEntity<Existencia> crearExistencia(@RequestBody ExistenciaRequestDTO dto) {
        Existencia nuevaExistencia = existenciaService.crearExistencia(dto);
        return ResponseEntity.ok(nuevaExistencia);
    }

    @GetMapping("/summary")
    public ResponseEntity<List<ExistenciaSummaryDTO>> getExistenciaSummary() {
        List<ExistenciaSummaryDTO> summary = existenciaService.getExistenciaSummary();
        return ResponseEntity.ok(summary);
    }

    // --- Endpoint de Diagnóstico ---
    @GetMapping("/raw")
    public ResponseEntity<List<Existencia>> getRawExistencias() {
        List<Existencia> rawData = existenciaService.getRawExistencias();
        return ResponseEntity.ok(rawData);
    }

    //Alta de codigo para picada, es decir, pasar a recorte un codigo.
    @PostMapping("/picadas/alta")
    public ResponseEntity<PicadaResDto> altaPicada(@RequestBody PicadaReqDto dto) {
        PicadaResDto nuevaExistencia = existenciaService.altaPicadas(dto);
        return ResponseEntity.ok(nuevaExistencia);

    }
}
