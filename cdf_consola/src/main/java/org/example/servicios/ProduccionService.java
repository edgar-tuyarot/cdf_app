package org.example.servicios;

import org.example.entidades.Producto;
import org.example.entidades.Proveedor;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import java.util.Scanner;

public class ProduccionService {

    private final SessionFactory sessionFactory;

    public ProduccionService(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    public void registrarProduccion(Scanner scanner) {
        System.out.print("Ingrese el nombre del proveedor: ");
        String nombreProveedor = scanner.nextLine();

        System.out.print("Ingrese el código del producto: ");
        String codigoProducto = scanner.nextLine();

        System.out.print("Ingrese el nombre del producto: ");
        String nombreProducto = scanner.nextLine();

        try (Session session = sessionFactory.openSession()) {
            session.beginTransaction();

            Proveedor proveedor = Proveedor.builder()
                    .nombre(nombreProveedor)
                    .build();

            Producto producto = Producto.builder()
                    .codigo(codigoProducto)
                    .nombre(nombreProducto)
                    .proveedor(proveedor)
                    .build();

            session.persist(proveedor);
            session.persist(producto);

            session.getTransaction().commit();
            System.out.println("\n¡Registro guardado con éxito!");
        } catch (Exception e) {
            System.out.println("\nError al guardar: " + e.getMessage());
        }
    }

    public void verProductos(Scanner scanner){

    }
}