package com.cdfapp.app.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Controller
public class SpaFallbackController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, HttpServletResponse response) {
        if (response.getStatus() == 404) {
            String uri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
            // Si es un 404 y no es una llamada a la API, redirigir a index.html (es una ruta de Vue)
            if (uri != null && !uri.startsWith("/api/")) {
                response.setStatus(200);
                return "forward:/index.html";
            }
        }
        // Para otros errores (o 404 de la API), usar el manejo por defecto
        return "error"; 
    }
}
