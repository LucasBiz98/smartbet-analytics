# SmartBet Analytics Dashboard

Plataforma integral para la extracción automatizada de predicciones deportivas, gestión de cartera de apuestas y análisis de rendimiento con verificación automática de resultados.

## Características

### Sistema de Scraping Inteligente
- **FootyStats**: Extracción automática de predicciones matemáticas con cuotas y probabilidades
- **Sofascore**: Verificación automática de resultados de partidos
- **Clasificación por Stake**: Sistema de clasificación automática por nivel de confianza (1-10)
- **Manejo anti-bot**: Estrategias para evitar bloqueos incluyendo rotación de User-Agents y delays aleatorios

### Dashboard Principal
- **Panel de control**: Resumen en tiempo real de tu actividad de apuestas
- **Estadísticas de rendimiento**: Win Rate, ROI, Profit Total y más
- **Predicciones del día**: Vista rápida de las mejores oportunidades
- **Gráficos de rendimiento**: Visualización de tendencias y patrones

### Sistema Bet Assist
- **Un clic para copiar**: Copia todos los datos de la apuesta al portapapeles
- **Apertura directa**: Abre tu casa de apuestas favorita en una nueva pestaña
- **Registro automático**: Historial completo de todas tus apuestas

### Seguimiento y Análisis
- **Registro histórico**: Todas tus apuestas guardadas con detalle completo
- **Verificación automática**: Resultados actualizados vía Sofascore
- **Estadísticas por stake**: Analiza qué niveles de stake son más rentables
- **Análisis por mercado**: BTTS, Over/Under, 1X2 y más

## Requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## Instalación Local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd smartbet-analytics
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del proyecto y subproyectos
npm run install:all

# O manualmente:
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Configurar base de datos PostgreSQL

#### Opción A: Usando Docker

```bash
docker run --name smartbet-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=smartbet \
  -p 5432:5432 \
  -d postgres:14

# Ejecutar migraciones
cd server && npm run db:migrate
```

#### Opción B: Base de datos local

1. Crear una base de datos llamada `smartbet`
2. Configurar las variables de entorno en `server/.env`

### 4. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp server/.env.example server/.env

# Editar con tus configuraciones
nano server/.env
```

### 5. Ejecutar el proyecto

```bash
# Desarrollo (ambos frontend y backend)
npm run dev

# O单独:
npm run dev:server  # Backend en http://localhost:3001
npm run dev:client  # Frontend en http://localhost:5173
```

## Deployment en Railway

### Preparación

1. Crear cuenta en [Railway](https://railway.app)
2. Instalar CLI de Railway:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

### Deployment

1. **Conectar repositorio**: Conecta tu repositorio de GitHub a Railway
   
2. **Crear servicio de base de datos**:
   ```bash
   railway add
   # Seleccionar PostgreSQL
   ```

3. **Configurar variables de entorno** en el dashboard de Railway:
   - `DATABASE_URL`: Se configura automáticamente con PostgreSQL
   - `PORT`: 3001
   - `LOG_LEVEL`: info

4. **Deploy**:
   ```bash
   railway up
   ```

### Configuración Post-Deployment

1. Accede a `https://tu-app.up.railway.app/api/health` para verificar que el servidor está运行
2. Abre la aplicación en el navegador
3. Haz clic en "Actualizar Datos" para obtener las primeras predicciones

## Uso de la Aplicación

### Dashboard
El panel principal muestra:
- Profit total y ROI
- Win Rate general
- Predicciones del día con mejor stake
- Rendimiento por nivel de stake

### Predicciones
1. Haz clic en "Predicciones" en el menú lateral
2. Usa los filtros para encontrar partidos específicos
3. Haz clic en el icono de copiar para obtener los datos
4. Haz clic en el icono de casa de apuestas para ir directamente

### Registrar Apuestas
1. Ve a "Apuestas"
2. Clic en "Nueva Apuesta"
3. Completa los detalles (importe, cuota, mercado)
4. Guarda la apuesta

### Verificar Resultados
- Las apuestas pendientes se verifican automáticamente cada hora
- También puedes hacer clic en "Verificar Resultados" manualmente

## Estructura del Proyecto

```
smartbet-analytics/
├── client/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── services/      # Servicios API
│   │   ├── store/         # Estado global (Zustand)
│   │   └── types/         # Tipos TypeScript
│   └── tailwind.config.js # Configuración Tailwind
├── server/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── config/        # Configuraciones
│   │   ├── controllers/   # Controladores de API
│   │   ├── database/      # Migraciones y schema
│   │   ├── routes/        # Rutas de API
│   │   ├── scrapers/      # Módulos de scraping
│   │   └── utils/         # Utilidades
│   └── package.json
├── railway.json            # Configuración Railway
└── package.json            # Package raíz
```

## API Endpoints

### Scrapers
- `POST /api/scrapers/trigger` - Iniciar scraping de FootyStats
- `POST /api/scrapers/verify-results` - Verificar resultados en Sofascore
- `GET /api/scrapers/status` - Estado del scraper

### Predicciones
- `GET /api/predictions` - Obtener predicciones con filtros
- `GET /api/predictions/today` - Predicciones del día
- `GET /api/predictions/stake/:stake` - Filtrar por stake
- `GET /api/predictions/leagues` - Lista de ligas

### Apuestas
- `GET /api/bets` - Lista de apuestas
- `POST /api/bets` - Crear apuesta
- `PATCH /api/bets/:id` - Actualizar apuesta
- `DELETE /api/bets/:id` - Eliminar apuesta

### Estadísticas
- `GET /api/stats/dashboard` - Estadísticas del dashboard
- `GET /api/stats/markets` - Rendimiento por mercado
- `GET /api/stats/leagues` - Rendimiento por liga
- `GET /api/stats/history` - Historial de rendimiento

## Consideraciones Técnicas

### Rate Limiting
El scraper incluye delays aleatorios para evitar bloqueos:
- Delay mínimo: 1 segundo entre requests
- Delay máximo: 3 segundos entre requests
- Rotación de User-Agents

### Cloudflare
Los scrapers están configurados para manejar protecciones anti-bot:
- Espera automática de verificación Cloudflare
- Reintentos automáticos en caso de fallo
- Simulación de comportamiento humano

### Programación
Las tareas programadas incluyen:
- Scraping automático a las 6:00 AM
- Verificación de resultados cada hora

## Contribuir

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit de cambios (`git commit -m 'Add nueva caracteristica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Descargo de Responsabilidad

Esta herramienta es solo para fines educativos y de análisis. El uso de automatización para apuestas puede estar restringido por los términos de servicio de las casas de apuestas. Úsala bajo tu propia responsabilidad.
