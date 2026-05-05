package com.cdfapp.app.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EditarItemPreparadoDTO {
    private Integer cantidad;
    private BigDecimal pesoReal;
}
