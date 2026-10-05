# 🚍 VallaBus — Control en Tiempo Real de AUVASA Valladolid

Una aplicación web moderna, ultrarrápida, certera e infalible para monitorizar la red de autobuses urbanos **AUVASA de Valladolid**, diseñada para superar radicalmente la experiencia de la app oficial.

Cumple rigurosamente con todas las directrices de **React Doctor**, alcanzando una puntuación de **100/100 (Cero errores, cero advertencias)**.

---

## 🌟 Características Principales

### 1. ⚡ Estética de Nueva Generación
- **Diseño Transit-First**: Interfaz inspirada en las mejores apps de movilidad del mundo (*Apple Maps Transit*, *Citymapper*).
- **Colores Oficiales de Línea**: Distinción visual auténtica para las 54 líneas de Valladolid (Línea 1 Verde `#36AD30`, Línea 2 Amarilla `#F5C636`, Línea 3 Magenta `#EE4BA4`, Línea 8 Naranja `#EA5D00`, Circulares C1 y C2, Búhos B1-B5, etc.).
- **Diseño Ultra-Responsivo**: Barra de navegación adaptativa en escritorio y barra inferior estilo aplicación nativa en dispositivos móviles.

### 2. 🎯 Precisión e Infalibilidad (Más Certera y Rápida)
- **Telemetría GPS en Vivo (GTFS-RT)**: Conexión directa a los feeds oficiales de posicionamiento de vehículos (`vehicleposition`) y estimaciones de viaje (`tripupdate`) de AUVASA.
- **Sistema Híbrido Infalible**:
  - 🟢 **En directo (GPS)**: Si el autobús emite señal satelital, muestra cuenta atrás exacta, matrícula del vehículo (ej. `4685HCM`) y nivel de ocupación.
  - 🟡 **Horario Programado Oficial**: Si una expedición aún no ha salido de cabecera o el servidor de AUVASA sufre una micro-desconexión, el sistema recurre al horario oficial estático de la parada. El usuario **nunca** se queda sin respuesta.
- **Caché en Memoria y Microsegundos**: Indexación de todas las 581 paradas y 54 líneas en memoria para búsquedas instantáneas a 0 ms.

### 3. 🔍 Buscador Universal Inteligente
- Búsqueda en tiempo real por:
  - **Número de parada**: (ej. `1002`, `550`, `733`).
  - **Nombre de calle o plaza**: (ej. `Zorrilla`, `Plaza Mayor`, `Delicias`, `Covaresa`).
  - **Línea**: (ej. `1`, `C1`, `C2`, `B2`, `LP`).

### 4. 📍 "Cerca de Mí" (Geolocalización GPS)
- Detecta tu posición exacta en Valladolid mediante la API de geolocalización.
- Ordena las paradas más próximas por distancia en metros y calcula el **tiempo estimado caminando**.

### 5. 🗺️ Mapa en Vivo de Alta Velocidad (Leaflet)
- Visualización de autobuses en ruta moviéndose en tiempo real por el mapa de Valladolid.
- Pines personalizados con los colores de cada línea y tooltip con matrícula y velocidad.
- Trazado geométrico oficial de las líneas con sentidos Ida y Vuelta.

### 6. 📋 Explorador de Líneas & Diagrama Estilo Metro
- Clasificación por categorías: *Ordinarias*, *Circulares*, *Nocturnas (Búho)*, *Lanzaderas* y *Especiales*.
- Visualizador interactivo de recorrido con línea cronológica de paradas e indicación de autobuses acercándose.

### 7. ⭐ Favoritos & ⚠️ Avisos de Servicio
- Guarda paradas y líneas habituales con un solo toque (persistido en almacenamiento local).
- Pestaña de avisos en directo con cortes de tráfico, obras y desvíos reportados por AUVASA.

---

## 🩺 Cumplimiento de React Doctor (100 / 100)

El proyecto fue auditado y optimizado según los estándares de **React Doctor**:
- **0 Errores, 0 Advertencias** (`npx -y react-doctor@latest .`).
- Uso semántico de `<dialog>` con accesibilidad completa (`prefer-html-dialog`).
- Transiciones CSS específicas (`transition-colors`, `transition-transform`) evitando el anti-patrón `transition-all` (`no-transition-all`).
- Componentes modulares y desacoplados con hooks dedicados (`no-giant-component`).
- Limpieza garantizada de listeners y suscripciones de eventos (`effect-needs-cleanup`).
- Llaves compuestas y estables sin usar índices volátiles de array (`no-array-index-as-key`).

---

## 🚀 Puesta en Marcha

### Requisitos
- Node.js >= 18 (Probado en v24)
- npm >= 9

### Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo (Servidor API + Vite)
npm run dev
```

La aplicación estará disponible en:
- Frontend (Vite): [http://localhost:5173](http://localhost:5173)
- Backend API (Proxy GTFS-RT): [http://localhost:3001](http://localhost:3001)

### Producción

```bash
# Construir frontend
npm run build

# Iniciar servidor Express completo (Sirve API + Web)
npm run server
```
Disponible directamente en: [http://localhost:3001](http://localhost:3001)

### Auditoría React Doctor

```bash
npm run doctor
```

---

## 🛠️ Estructura del Proyecto

```text
Autobus/
├── server/
│   ├── index.mjs             # Servidor Express proxy con decodificación Protobuf GTFS-RT
│   └── data/                 # Datos estáticos optimizados (líneas, paradas, formas, horarios)
├── scripts/
│   └── process-gtfs.mjs      # Extractor y optimizador de los ficheros GTFS oficiales
├── src/
│   ├── types/bus.ts          # Tipos estrictos TypeScript para el sistema de transportes
│   ├── hooks/                # Hooks puros optimizados (useRealtime, useStops, useGeolocation...)
│   ├── components/           # Componentes modulares accesibles (Map, Search, Lines, Modal...)
│   ├── App.tsx               # Orquestador principal de vistas y estado
│   └── main.tsx              # Punto de entrada con React.StrictMode y ErrorBoundary
└── vite.config.ts            # Configuración de Vite con Tailwind CSS v4
```
