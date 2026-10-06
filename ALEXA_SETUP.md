# 🎙️ Integración de VallaBus con Amazon Alexa

Esta guía te explica cómo conectar **VallaBus AUVASA Valladolid** con cualquier altavoz Amazon Echo, Echo Show o la app de Alexa en tu móvil en menos de 5 minutos.

---

## 🚀 Paso 1: Crear la Skill en Amazon Alexa Developer

1. Entra en la [Consola de Desarrolladores de Alexa](https://developer.amazon.com/alexa/console/ask) e inicia sesión con tu cuenta de Amazon (la misma que usas en tus altavoces Echo).
2. Pulsa en **Create Skill** (Crear Skill).
3. Configuración inicial:
   - **Skill name**: `VallaBus`
   - **Primary locale**: `Spanish (ES)` (Español)
   - **Experience / Model**: `Custom`
   - **Hosting**: `Provision your own` (Provisión propia / Webhook HTTPS)
4. Pulsa en **Create Skill** (arriba a la derecha) y selecciona la plantilla **Start from Scratch** (Empezar de cero).

---

## 📝 Paso 2: Importar el Modelo de Interacción

1. En el menú lateral izquierdo, ve a **Interaction Model** -> **JSON Editor**.
2. Abre el archivo local [`server/alexa/model_es-ES.json`](file:///c:/Users/Celia/Desktop/JLH/AUVASA/server/alexa/model_es-ES.json) de este proyecto.
3. Copia todo su contenido y pégalo reemplazando lo que haya en el editor de la consola de Alexa.
4. Pulsa en **Save Model** (Guardar) y luego en **Build Model** (Compilar Modelo). Tardará unos 30-60 segundos.

---

## 🌐 Paso 3: Configurar el Endpoint

1. En el menú lateral, ve a **Endpoint**.
2. Selecciona **HTTPS**.
3. En **Default Region**, introduce la URL pública de tu servidor apuntando a `/api/alexa`:
   - **Producción (Vercel / VPS / Railway)**: `https://tu-dominio.vercel.app/api/alexa`
   - **Desarrollo local (ngrok)**: Si pruebas en tu PC, ejecuta `npx ngrok http 3001` y pon la URL HTTPS que te dé (ej. `https://xxxx.ngrok-free.app/api/alexa`).
4. En el desplegable de certificado SSL:
   - Selecciona: *"My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority"* (si usas Vercel/ngrok).
5. Pulsa en **Save Endpoints**.

---

## 🗣️ Paso 4: ¡Probar y Hablar con Alexa!

1. Ve a la pestaña **Test** en la consola de Alexa y cambia el desplegable superior a **Development**.
2. Prueba escribiendo o diciendo:
   - *"Alexa, abre VallaBus"*
   - *"Alexa, pide a VallaBus los tiempos de la parada 550"*
   - *"Alexa, pregunta a VallaBus cuándo pasa la línea C1 por la parada 550"*
   - *"Alexa, pregunta a VallaBus si hay avisos o incidencias"*

### 📱 Activación automática en tus dispositivos reales:
Al estar conectado con tu misma cuenta de Amazon, la Skill **ya está disponible automáticamente en todos los dispositivos Echo de tu casa y en la app de Alexa de tu teléfono** sin necesidad de publicar nada.
