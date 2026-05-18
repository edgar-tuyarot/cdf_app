package org.example;

import org.example.servicios.ProduccionService;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

        System.out.println("Iniciando conexión a la base de datos...");
        SessionFactory sessionFactory = null;

        try {
            sessionFactory = new Configuration().configure().buildSessionFactory();
            System.out.println("Conexión establecida con éxito.\n");

            // Instanciamos el servicio pasándole la conexión
            ProduccionService produccionService = new ProduccionService(sessionFactory);

            Scanner scanner = new Scanner(System.in);
            int opcion = 0;

            do {
                System.out.println("\n--- CDF APP ---");
                System.out.println("1. Registro de Producción");
                System.out.println("2. Feteados");
                System.out.println("3. Salir");
                System.out.print("Seleccione una opción: ");

                if (scanner.hasNextInt()) {
                    opcion = scanner.nextInt();
                    scanner.nextLine(); // Limpiar el buffer

                    switch (opcion) {
                        case 1:
                            System.out.println("\n--- Nuevo Registro de Producción ---");
                            // Llamamos al método desde el servicio
                            produccionService.registrarProduccion(scanner);
                            break;
                        case 2:
                            System.out.println("\n--- Módulo Feteados ---");
                            // Lógica de feteados
                            break;
                        case 3:
                            System.out.println("\nCerrando sistema...");
                            break;
                        default:
                            System.out.println("\nOpción no válida. Intente nuevamente.");
                    }
                } else {
                    System.out.println("\nError: Por favor, ingrese un número.");
                    scanner.next();
                }
            } while (opcion != 3);

            scanner.close();

        } catch (Exception e) {
            System.err.println("Error al conectar con la base de datos: " + e.getMessage());
        } finally {
            if (sessionFactory != null) {
                sessionFactory.close();
            }
        }
    }
}