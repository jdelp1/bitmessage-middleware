# ¿Qué es una Custom Activity en Salesforce Marketing Cloud?

Una Custom Activity es una extensión personalizada que se integra en Salesforce Marketing Cloud Journey Builder para ejecutar acciones específicas dentro de un recorrido de cliente. Permite conectar sistemas externos, realizar procesos personalizados o enviar datos a otros servicios desde el flujo de Journey Builder.

## ¿Cómo se integra una Custom Activity?

Las Custom Activities se configuran y visualizan como bloques dentro de Journey Builder. Al crear una actividad personalizada, se define su comportamiento y se conecta mediante la API de Marketing Cloud. El usuario puede arrastrar la actividad al recorrido y configurarla según las necesidades del negocio.

## ¿Por qué debe estar alojada en un servidor externo?

Salesforce Marketing Cloud (SMC) no permite alojar ni ejecutar el código de una Custom Activity directamente en su plataforma. Por eso, la lógica de la actividad debe estar hospedada en un servidor o servicio web externo, que se comunica con SMC mediante peticiones HTTP (API REST).

Esto garantiza flexibilidad y permite usar cualquier tecnología o lenguaje de programación (Node.js, Express, Python, Java, etc.), siempre que el servicio sea accesible por internet.

## ¿Por qué no se puede hacer una petición HTTP directa desde SMC?

Journey Builder está diseñado para orquestar recorridos y ejecutar actividades, pero no para realizar peticiones HTTP arbitrarias a servicios externos. Las Custom Activities actúan como "middleware" entre SMC y el sistema externo:

- **Custom Activity**: Recibe datos de SMC, los procesa, valida, transforma o adapta según la lógica del negocio, y luego puede enviar esos datos a otros sistemas.
- **Seguridad y control**: El middleware permite controlar la autenticación, la validación de datos, el registro de logs, la gestión de errores y la integración con APIs externas.
- **Flexibilidad**: Permite adaptar la integración a los requisitos del cliente, realizar transformaciones, almacenar archivos, o implementar lógica adicional.

Sin una Custom Activity, SMC no puede interactuar directamente con sistemas externos de forma segura y controlada. El middleware es necesario para garantizar la robustez y la trazabilidad de la integración.

## Estructura básica de una Custom Activity

Una Custom Activity requiere una pequeña aplicación web (frontend) que se carga dentro de Journey Builder para la configuración visual y la comunicación con SMC. Los archivos principales suelen ser:

- **index.html**: Página principal de la actividad, donde se muestra la interfaz de usuario para configurar la actividad.
- **customActivity.js**: Lógica JavaScript específica de la actividad, maneja la interacción con el usuario y la comunicación con SMC.
- **postmonger.js**: Librería de Salesforce utilizada para la comunicación entre la Custom Activity y Journey Builder (envío y recepción de mensajes/events).
- **config.json**: Archivo de configuración donde se definen los parámetros, endpoints y metadatos de la actividad.
- **styles.css**: Estilos visuales para la interfaz de la actividad.

Estos archivos deben estar accesibles públicamente en el servidor donde se aloja la Custom Activity, ya que SMC los carga en un iframe dentro de Journey Builder.

## Arquitectura básica del proyecto

- **Journey Builder**: Plataforma de SMC donde se configuran los recorridos y se integran las Custom Activities.
- **Custom Activity (Middleware)**: Bloque personalizado que se comunica con un servidor externo, recibe datos, los procesa y los envía a otros sistemas.
- **Servidor/Web Service**: Donde se ejecuta la lógica de la Custom Activity. En este proyecto usamos Node.js y Express, pero se puede usar cualquier lenguaje.
- **Comunicación**: SMC envía datos al servidor mediante HTTP (POST/GET), y el servidor responde según la lógica definida.

## Tecnologías utilizadas en este proyecto

- Node.js
- Express
- Axios
- Pino (logger)
- FormData
- dotenv
- helmet
- compression
- errorhandler

> Nota: Una Custom Activity puede ser desarrollada en cualquier lenguaje o framework, siempre que exponga endpoints accesibles por SMC.

---

Este README es una guía básica para entender la integración, arquitectura y motivos por los que se requiere un middleware (Custom Activity) en Salesforce Marketing Cloud, así como la estructura mínima necesaria para su funcionamiento.
