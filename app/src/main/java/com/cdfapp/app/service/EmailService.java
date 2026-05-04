package com.cdfapp.app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envía un correo electrónico simple.
     *
     * @param para      La dirección de correo del destinatario.
     * @param asunto    El asunto del correo.
     * @param texto     El cuerpo del correo.
     */
    public void enviarEmail(String para, String asunto, String texto) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            // El 'from' se toma automáticamente del 'spring.mail.username' en application.properties
            message.setTo(para);
            message.setSubject(asunto);
            message.setText(texto);

            mailSender.send(message);
            System.out.println("Correo enviado exitosamente a " + para);
        } catch (Exception e) {
            System.err.println("Error al enviar el correo: " + e.getMessage());
            // En una aplicación real, aquí deberías usar un logger en lugar de System.err
            // throw new RuntimeException("Error al enviar el correo", e);
        }
    }
}
