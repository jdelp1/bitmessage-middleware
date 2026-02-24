# BitMessage Middleware - Multiple Activities Setup

## 📁 Estructura del Proyecto

```
public/
  instant-sms/              ← Actividad de SMS instantáneos
    config.json
    index.html
    css/
    js/
    images/
  scheduled-sms/            ← Actividad de SMS programados
    config.json
    index.html
    css/
    js/
    images/

routes/
  activities/
    instant-sms.js          ← Lógica de SMS instantáneos
    scheduled-sms.js        ← Lógica de SMS programados
```

## 🔧 Variables de Entorno Necesarias

Agregar a `.env` y Northflank:

```env
# Existentes
jwtSecret=your_jwt_secret
BITMESSAGE_USERNAME=your_username
BITMESSAGE_PASSWORD=your_password
BITMESSAGE_CAMPANYA=SOIB
PORT=3000

# APIs específicas
BITMESSAGE_INSTANT_SMS_API=https://bitmessage.fundaciobit.org/api/v1/envios/mensaje/send
BITMESSAGE_SCHEDULED_SMS_API=https://bitmessage.fundaciobit.org/bitmessage/api/v1/envios/sendfile
```

## 📝 Cómo Registrar Actividades en Journey Builder

### Actividad 1: Instant SMS

**URL a registrar:** `https://site--custom-activity--974pyfp922mc.code.run/instant-sms`

Journey Builder automáticamente:

- Leerá `public/instant-sms/config.json`
- Mostrará `public/instant-sms/index.html` como modal de configuración
- Llamará a endpoints `/instant-sms/execute`, `/instant-sms/save`, etc.

### Actividad 2: Scheduled SMS

**URL a registrar:** `https://site--custom-activity--974pyfp922mc.code.run/scheduled-sms`

Journey Builder automáticamente:

- Leerá `public/scheduled-sms/config.json`
- En esta versión no se usa modal HTML/CSS de configuración para Scheduled SMS
- Llamará a endpoints `/scheduled-sms/execute`, `/scheduled-sms/save`, etc.

## ➕ Agregar Nuevas Actividades

### Paso 1: Crear estructura de carpetas

```powershell
mkdir public\nueva-actividad
Copy-Item public\instant-sms\* public\nueva-actividad\ -Recurse
```

### Paso 2: Crear archivo de rutas

Copiar `routes/activities/instant-sms.js` → `routes/activities/nueva-actividad.js`

- Actualizar nombre de funciones en logs
- Modificar lógica de `sendAPI()` según API correspondiente
- Ajustar branch results según necesidades

### Paso 3: Actualizar config.json

Editar `public/nueva-actividad/config.json`:

- `key`: "nueva-actividad-unique-key"
- `name`: "Nombre de Nueva Actividad"
- `description`: "Descripción clara"
- URLs: reemplazar `/instant-sms/` por `/nueva-actividad/`
- `outcomes`: ajustar según branch results

### Paso 4: Actualizar app.js

```javascript
import * as nuevaActividad from "./routes/activities/nueva-actividad.js";

// Servir archivos estáticos
app.use(
  "/nueva-actividad",
  express.static(path.join(__dirname, "public/nueva-actividad")),
);

// Rutas
app.post("/nueva-actividad/save", nuevaActividad.save);
app.post("/nueva-actividad/validate", nuevaActividad.validate);
app.post("/nueva-actividad/publish", nuevaActividad.publish);
app.post("/nueva-actividad/execute", nuevaActividad.execute);
app.post("/nueva-actividad/stop", nuevaActividad.stop);
app.post("/nueva-actividad/edit", nuevaActividad.edit);
```

### Paso 5: Agregar variables de entorno

Si la nueva actividad requiere URL de API diferente:

```env
BITMESSAGE_NUEVA_API=https://api-url-here.com
```

### Paso 6: Registrar en Journey Builder

URL: `https://site--custom-activity--974pyfp922mc.code.run/nueva-actividad`

## 🧪 Testing

### Probar Instant SMS localmente:

```
URL: http://localhost:3000/instant-sms
Execute: POST http://localhost:3000/instant-sms/execute
```

### Probar Scheduled SMS localmente:

```
URL: http://localhost:3000/scheduled-sms
Execute: POST http://localhost:3000/scheduled-sms/execute
```

## ✅ Estado Actual

- ✅ Instant SMS: Totalmente funcional
- ✅ Scheduled SMS: Estructura completa, URL de API definida
- 🔄 Otras actividades: Plantilla lista para replicar

## 📌 Notas Importantes

1. Cada actividad es **completamente independiente**
2. Cada actividad tiene su propio `config.json` único
3. Las URLs en config.json deben incluir el prefijo de la actividad (`/instant-sms/`, `/scheduled-sms/`, etc.)
4. El `key` en config.json debe ser único por actividad
5. Los branch results pueden ser diferentes por actividad (sent/notsent, scheduled/failed, etc.)
