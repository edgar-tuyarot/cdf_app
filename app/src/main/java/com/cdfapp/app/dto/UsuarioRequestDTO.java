package com.cdfapp.app.dto;

import lombok.Data;

@Data
public class UsuarioRequestDTO {
    private String username;
    private String password;
    private Long rolId;
}
