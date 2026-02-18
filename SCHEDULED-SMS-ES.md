# Funcionamiento de SMS Programado (Scheduled SMS)

## Descripción General

El módulo de SMS programado permite enviar mensajes SMS masivos a través de la API de BitMessage. En lugar de enviar mensajes individuales, este proceso envía un archivo de texto que contiene múltiples destinatarios y mensajes.

## Flujo de Trabajo

### 1. Recepción de Datos

El sistema recibe un array de objetos JSON. Cada objeto representa un registro de contacto con sus datos personalizados.

**Ejemplo de entrada:**
- Array de objetos con información de contactos
- Cada objeto puede contener: teléfono, mensaje, nombre, etc.

### 2. Validación

El sistema valida que:
- Los datos recibidos sean un array (lista)
- El array no esté vacío
- Cada elemento del array sea un objeto válido

Si la validación falla, el proceso se detiene y retorna un error.

### 3. Generación del Archivo TXT

Una vez validados los datos, el sistema genera un archivo de texto plano con las siguientes características:

#### Formato del Archivo

- **Extensión:** .txt
- **Nombre:** `scheduled-sms-{timestamp}.txt`

#### Estructura del Contenido

Cada línea del archivo representa un mensaje SMS:

- Los valores de cada objeto se extraen en orden
- Se unen usando el carácter pipe `|` como separador
- Cada registro ocupa una línea diferente

**Ejemplo de contenido del archivo:**
```
34612345678|Hola Juan, tu cita es mañana|CAMPANYA-IBSALUT
34698765432|Hola María, recordatorio de cita|CAMPANYA-IBSALUT
34654321098|Hola Pedro, confirma tu asistencia|CAMPANYA-IBSALUT
```

### 4. Envío a BitMessage

Una vez generado el archivo, el sistema lo envía a la API de BitMessage:

#### Método de Envío

- **Protocolo:** HTTPS
- **Método:** POST
- **Tipo:** multipart/form-data (envío de archivos)
- **Autenticación:** Basic Authentication (usuario y contraseña)

#### Parámetros

- **file:** El archivo de texto generado
- **campanya:** Nombre de la campaña (incluido en la URL como parámetro)

#### Configuración

El sistema utiliza las siguientes variables de entorno:
- URL de la API de BitMessage para envío programado
- Credenciales de autenticación (usuario y password)
- Nombre de la campaña
