# Middleware de Actividades Personalizadas para Journey Builder

Documentación técnica del middleware que conecta Salesforce Marketing Cloud Journey Builder con las diferentes APIs de BitMessage para envío de SMS.

## Resumen General

Este middleware actúa como puente entre Journey Builder y los servicios de mensajería de BitMessage. Permite crear actividades personalizadas que los marketers pueden usar dentro de sus journeys para enviar SMS de diferentes tipos según las necesidades del negocio.

Stack tecnológico:

- Node.js + Express
- Pino para logging estructurado
- Autenticación JWT
- Axios para llamadas HTTP
- Desplegado en Northflank

## Arquitectura del Sistema

El sistema tiene tres componentes principales que se comunican entre sí:

```
┌──────────────────────────────────────────────────────────────────┐
│                    Salesforce Marketing Cloud                    │
│                      Journey Builder                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Token JWT (POST)
                       │ Configuración de Usuario
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│         Middleware Actividad Personalizada (Northflank)          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Servidor Express                                        │    │
│  │  - Decodificador JWT                                     │    │
│  │  - Rutas modulares por actividad                         │    │
│  │  - Registro Pino                                         │    │
│  │  - Headers prevención de caché                           │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Basic Auth (POST)
                       │ Payload SMS
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APIs BitMessage                               │
│                  (fundaciobit.org)                               │
│  - API SMS Instantáneo                                           │
│  - API SMS Programado                                            │
│  - Otras APIs según necesidad                                    │
└─────────────────────────────────────────────────────────────────┘
```

Journey Builder envía los datos de los contactos al middleware usando tokens JWT. El middleware decodifica esta información, la procesa y hace las llamadas correspondientes a las APIs de BitMessage usando autenticación básica. Dependiendo de la respuesta de BitMessage, el middleware informa a Journey Builder qué ruta debe seguir el contacto.

## Estructura del Proyecto

El proyecto está organizado para soportar múltiples actividades de forma modular:

```
public/
  instant-sms/              Actividad de SMS instantáneos
    config.json             Configuración para Journey Builder
    index.html              Modal de configuración
    css/
    js/
    images/
  scheduled-sms/            Actividad de SMS programados
    config.json
    index.html
    css/
    js/
    images/

routes/
  activities/
    instant-sms.js          Lógica backend SMS instantáneos
    scheduled-sms.js        Lógica backend SMS programados
```

Cada actividad es completamente independiente y se registra en Journey Builder con su propia URL. Por ejemplo:

- SMS Instantáneo: `https://tu-servidor.com/instant-sms`
- SMS Programado: `https://tu-servidor.com/scheduled-sms`

Cuando registras una URL en Journey Builder, automáticamente lee el config.json de ese subdirectorio y muestra el index.html como modal de configuración.

## Ciclo de Vida de una Actividad

El ciclo de vida tiene cuatro fases principales:

### Fase 1: Configuración

Se arrastra la actividad al canvas de Journey Builder y hace clic para configurarla. En ese momento:

1. Journey Builder carga el index.html de la actividad
2. El usuario completa el formulario (mensaje, campos de datos, campaña, etc.)
3. Al hacer clic en "Listo", se valida la configuración
4. Se envía un POST al endpoint /save que guarda la configuración

### Fase 2: Activación

Cuando se activa el journey:

1. Journey Builder hace un POST al endpoint /publish
2. El middleware puede hacer cualquier configuración necesaria
3. El journey queda activo y listo para procesar contactos

### Fase 3: Ejecución

Esta es la fase crítica donde se procesa cada contacto:

1. Un contacto entra en la actividad
2. Journey Builder hace POST al endpoint /execute con un token JWT
3. El middleware decodifica el JWT y extrae los datos del contacto
4. Se prepara el payload según la API correspondiente
5. Se llama a la API de BitMessage
6. Según la respuesta, se retorna un branchResult
7. Journey Builder enruta al contacto por la rama correspondiente

Por ejemplo, para SMS instantáneos, si BitMessage responde con estado "ENVIADO" o "CONFIRMADO", el middleware retorna `{"branchResult": "sent"}` y el contacto sigue por la rama de éxito. Si hay error, retorna `{"branchResult": "notsent"}` y el contacto va por la rama de error.

### Fase 4: Desactivación

Cuando se detiene el journey:

1. Journey Builder hace POST al endpoint /stop
2. El middleware puede hacer limpieza de recursos si es necesario

## Endpoints Disponibles

Cada actividad tiene seis endpoints que Journey Builder llama en diferentes momentos:

| Endpoint    | Tipo          | Cuándo se llama              | Propósito                                |
| ----------- | ------------- | ---------------------------- | ---------------------------------------- |
| `/save`     | Configuración | Usuario hace clic en "Listo" | Guarda la configuración de la actividad  |
| `/validate` | Configuración | Antes de guardar (opcional)  | Valida los datos ingresados              |
| `/publish`  | Configuración | Journey se activa            | Inicialización y configuración           |
| `/edit`     | Configuración | Usuario edita actividad      | Carga configuración guardada previamente |
| `/stop`     | Configuración | Journey se desactiva         | Limpieza de recursos                     |
| `/execute`  | Ejecución     | Contacto entra en actividad  | Procesa el contacto y llama API externa  |

Todos los endpoints están prefijados por el nombre de la actividad. Por ejemplo, para SMS instantáneo:

- POST /instant-sms/execute
- POST /instant-sms/save
- POST /instant-sms/publish
- etc.

## Seguridad y Autenticación

Hay dos capas de autenticación en el sistema:

| Capa                         | Método     | Content-Type     | Datos                                | Storage                                  |
| ---------------------------- | ---------- | ---------------- | ------------------------------------ | ---------------------------------------- |
| Journey Builder → Middleware | JWT        | application/jwt  | Token firmado con secreto compartido | Variable entorno jwtSecret               |
| Middleware → BitMessage      | Basic Auth | application/json | Usuario y contraseña en header       | Variables BITMESSAGE_USERNAME y PASSWORD |

Detalles de implementación:

- El middleware verifica cada JWT antes de procesar la petición
- Si el token es inválido, se retorna 401 Unauthorized
- Las credenciales nunca se exponen en el código
- Cada petición a BitMessage incluye credenciales en header Authorization

## Actividades Disponibles

### Comparación de Actividades

| Característica      | SMS Instantáneo            | SMS Programado                           |
| ------------------- | -------------------------- | ---------------------------------------- |
| Estado              | Funcional                  | En desarrollo                            |
| URL Registro        | /instant-sms               | /scheduled-sms                           |
| Campos UI           | Mensaje, Teléfono          | Mensaje, Teléfono, Campaña, Fecha        |
| API Endpoint        | bitmessage.../mensaje/send | Por definir                              |
| Branch Results      | sent / notsent             | scheduled / failed                       |
| Variables Entorno   | BITMESSAGE_INSTANT_SMS_API | BITMESSAGE_SCHEDULED_SMS_API (pendiente) |
| Validación Frontend | Completa                   | Completa                                 |
| Backend             | Completo                   | Estructura lista                         |

### Actividad de SMS Instantáneo

Esta actividad envía SMS en tiempo real usando la API de mensajes instantáneos de BitMessage.

Configuración requerida:

- Cuerpo del mensaje (puede incluir data binding de Journey Builder)
- Campo de teléfono (vinculado a atributos del contacto)

Flujo de ejecución:

1. Extrae teléfono y mensaje del JWT
2. Prepara payload con telefono, texto y campanyaReferencia
3. Llama a API: POST https://bitmessage.fundaciobit.org/api/v1/envios/mensaje/send
4. Si estado es "ENVIADO" o "CONFIRMADO": rama "sent"
5. Si estado es "ERROR" o timeout: rama "notsent"

### Actividad de SMS Programado

Esta actividad permite programar SMS para envío posterior.

Configuración requerida:

- Referencia de campaña (campo de texto configurable por usuario)
- Cuerpo del mensaje
- Fecha/hora de envío (pendiente de implementar)

El frontend está completamente desarrollado con validación de ambos campos obligatorios. El backend tiene la estructura lista pero necesita la URL correcta de la API de SMS programados de BitMessage.

## Agregar Nuevas Actividades

El sistema está diseñado para agregar fácilmente nuevas actividades. Los pasos son:

1. Crear subdirectorio en public/ copiando una actividad existente
2. Modificar config.json: cambiar key, name, URLs y outcomes
3. Actualizar index.html con los campos necesarios
4. Ajustar customActivity.js para capturar y validar los nuevos campos
5. Crear archivo en routes/activities/ con la lógica específica
6. Importar y registrar rutas en app.js
7. Agregar variables de entorno si la API es diferente
8. Registrar en Journey Builder con la nueva URL

Cada actividad puede tener sus propios branch results. Por ejemplo:

- instant-sms: sent / notsent
- scheduled-sms: scheduled / failed
- otras-apis: success / error / pending

## Logging y Monitoreo

El sistema usa Pino para logging estructurado con cuatro niveles:

| Nivel | Cuándo se usa                      | Ejemplos                                       |
| ----- | ---------------------------------- | ---------------------------------------------- |
| INFO  | Operaciones normales               | Endpoints llamados, operaciones exitosas       |
| WARN  | Situaciones anómalas no críticas   | Datos inválidos, respuestas inesperadas de API |
| ERROR | Errores que impiden operación      | Fallos JWT, errores críticos de API            |
| DEBUG | Información detallada (desarrollo) | Tokens JWT decodificados, payloads completos   |

Logs importantes a monitorear:

| Mensaje en log               | Significado                     | Acción requerida                        |
| ---------------------------- | ------------------------------- | --------------------------------------- |
| "Execute endpoint called"    | Contacto entró en actividad     | Ninguna (normal)                        |
| "Calling BitMessage API"     | Iniciando llamada a API externa | Ninguna (normal)                        |
| "SMS sent successfully"      | Confirmación de entrega         | Ninguna (éxito)                         |
| "BitMessage API call failed" | Error en llamada API            | Revisar estado de API y logs detallados |
| "JWT verification failed"    | Token inválido recibido         | Verificar configuración jwtSecret       |

Los logs se pueden ver en tiempo real en Northflank o localmente en la consola con formato colorizado.

## Escalabilidad y Rendimiento

Configuración actual:

- Northflank proporciona auto-escalado según carga
- Pino es uno de los loggers más rápidos para Node.js
- Cache completamente deshabilitado para siempre tener datos frescos
- Número de peticiones concurrentes configurable en config.json

El sistema puede manejar:

- Múltiples journeys activos simultáneamente
- Miles de contactos procesándose en paralelo
- Múltiples actividades diferentes al mismo tiempo
- Picos de tráfico con auto-escalado automático

## Variables de Entorno

### Variables Comunes

| Variable            | Propósito                                                    | Ejemplo             | Requerida |
| ------------------- | ------------------------------------------------------------ | ------------------- | --------- |
| jwtSecret           | Secreto compartido con Journey Builder para verificar tokens | tu_secreto_jwt_aqui | Sí        |
| BITMESSAGE_USERNAME | Usuario para autenticación en APIs BitMessage                | usuario_api         | Sí        |
| BITMESSAGE_PASSWORD | Contraseña para autenticación                                | password_segura     | Sí        |
| BITMESSAGE_CAMPANYA | Referencia de campaña por defecto                            | SOIB                | Sí        |
| PORT                | Puerto del servidor                                          | 3000                | No        |

### Variables Específicas por Actividad

| Variable                     | Actividad       | Estado      | URL Ejemplo                                                   |
| ---------------------------- | --------------- | ----------- | ------------------------------------------------------------- |
| BITMESSAGE_INSTANT_SMS_API   | SMS Instantáneo | Configurada | https://bitmessage.fundaciobit.org/api/v1/envios/mensaje/send |
| BITMESSAGE_SCHEDULED_SMS_API | SMS Programado  | Pendiente   | Por definir                                                   |

Las mismas variables deben estar configuradas tanto en .env local como en Northflank para que funcione en ambos entornos.

## Despliegue

Checklist para despliegue completo:

Código:

- Código subido a repositorio
- Cambios desplegados en Northflank
- Servidor reiniciado si es necesario

Variables:

- Todas las variables de entorno configuradas en Northflank
- jwtSecret coincide con el configurado en Journey Builder
- Credenciales de BitMessage correctas y con permisos

Journey Builder:

- Actividad registrada con URL de producción correcta
- config.json apunta a URLs de producción (no localhost)
- Actividad probada en journey de prueba

Monitoreo:

- Logs de Northflank accesibles
- Alertas configuradas para errores críticos
- Métricas de rendimiento monitoreadas

## Ejemplo Real de Flujo de Datos

Veamos un ejemplo concreto de cómo funciona todo el sistema:

Escenario: Un cliente nuevo se registra y debe recibir un SMS de bienvenida.

1. El cliente completa el registro en el sitio web
2. Journey Builder detecta el evento y el contacto entra en el journey
3. El contacto llega a la actividad de SMS instantáneo

4. Journey Builder envía al middleware:

```json
{
  "inArguments": [
    {
      "telefono": "654162594",
      "texto": "Bienvenido a nuestro servicio, {{FirstName}}!"
    }
  ]
}
```

5. El middleware decodifica el JWT, sustituye las variables y llama a BitMessage:

```json
{
  "telefono": "654162594",
  "texto": "Bienvenido a nuestro servicio, María!",
  "campanyaReferencia": "SOIB"
}
```

6. BitMessage procesa el envío y responde:

```json
{
  "id": 16312,
  "estado": "ENVIADO",
  "telefono": "654162594",
  "texto": "Bienvenido a nuestro servicio, María!",
  "fechaEnvio": "2026-01-29T14:30:00"
}
```

7. El middleware interpreta el estado y retorna a Journey Builder:

```json
{
  "branchResult": "sent"
}
```

8. Journey Builder enruta al contacto por la rama de éxito y el cliente recibe el SMS en su teléfono.

Todo este proceso ocurre en pocos segundos y queda registrado en los logs para auditoría.

## Problemas Comunes y Soluciones

Error de autenticación JWT:

- Verificar que jwtSecret sea idéntico en .env y en Northflank
- Revisar logs para ver el token decodificado (solo en desarrollo)
- Confirmar que Journey Builder esté usando el secreto correcto

Timeouts de API:

- Revisar estado de las APIs de BitMessage
- Verificar conectividad de red desde Northflank
- Aumentar timeout en config.json si es necesario

Números de teléfono inválidos:

- Validar formato en el frontend antes de guardar
- Verificar data binding en Journey Builder
- Revisar logs para ver qué número se está enviando

Problemas de caché:

- Verificar headers de cache en respuestas
- Limpiar caché del navegador
- Cambiar versión en config.json si es necesario

## Beneficios de Esta Arquitectura

Separación de responsabilidades:

- UI completamente separada del backend
- Cada actividad tiene su propia lógica aislada
- Fácil agregar nuevas actividades sin afectar las existentes

Mantenibilidad:

- Código organizado y bien estructurado
- Logging comprensivo facilita debugging
- Configuración mediante variables de entorno

Escalabilidad:

- Arquitectura preparada para múltiples actividades
- Puede manejar alto volumen de tráfico
- Fácil agregar nuevas APIs de BitMessage

Seguridad:

- Doble capa de autenticación
- Credenciales nunca expuestas en código
- Validación en frontend y backend

Experiencia de usuario:

- Marketers configuran actividades sin ayuda técnica
- Validación en tiempo real de datos
- Mensajes de error claros y útiles
