# Savings Rates Static Demo

Proyecto de aplicaciones estáticas en HTML, CSS y JavaScript para prototipar experiencias ligadas a análisis tarifario, consumo eléctrico, ahorro con solar y proyecciones energéticas/financieras.

Está pensado para publicarse en GitHub Pages y conectarse a un backend separado que resuelve la lógica de negocio.

## Estructura

El repositorio contiene varias apps estáticas dentro de `apps/`.

Hoy la aplicación principal y más avanzada es:

- `apps/copec-enel`

Esa app está orientada al flujo ENEL y consume el endpoint:

- `POST /cl/enel/analyze-bill-and-solar-from-pdf`

del backend del proyecto `utility-rates-dev`.

## Objetivo de la app `copec-enel`

La app permite simular ahorros energéticos con sistema solar para clientes ENEL, usando dos caminos de entrada:

1. `Cargar boleta PDF`
   Envía una boleta ENEL en PDF al backend para extracción, enriquecimiento tarifario y análisis completo.

2. `Cargar datos manualmente`
   Permite ingresar manualmente el payload ENEL equivalente al que normalmente sería extraído desde la boleta.

Ambos caminos convergen en el mismo endpoint de análisis.

## Qué hace el frontend

La app:

- captura parámetros solares y financieros comunes;
- permite analizar con PDF o con payload manual;
- muestra métricas resumen en tarjetas;
- grafica resultados mensuales y de largo plazo;
- expone un JSON de respuesta para depuración cuando se habilita visualmente;
- incluye branding con logos de Artemis, Copec Flux y Enel;
- incorpora favicon y metadatos para compartición.

## Inputs comunes del simulador

La app `copec-enel` comparte estos inputs entre ambos formularios:

- `annualSolarProductionKwh`
- `SOLAR_SYSTEM_ANNUAL_DEGRADATION`
- `termYears`
- `annualUtilityRateEscalator`
- `tarifa_inyeccion`
- `annualInjectionTariffEscalator`

## Modo 1: carga por boleta PDF

En este modo se envía:

- `filename`
- `pdfBase64`

junto con los parámetros comunes.

## Modo 2: carga manual del payload ENEL

En este modo se envía el payload ENEL directamente, sin PDF:

- `comuna`
- `etr`
- `periodo_lectura_inicio`
- `periodo_lectura_fin`
- `tipo_tarifa`
- `consumo_ultimos_12_meses`

Más todos los parámetros comunes del simulador.

### Importante sobre fechas

El formulario usa inputs HTML de tipo fecha, pero antes de enviar transforma los valores al formato esperado por backend:

- `dd/mm/yyyy`

Ejemplo:

- `2025-07-09` -> `09/07/2025`

### Importante sobre el orden mensual

En el formulario manual, el usuario llena consumos en orden calendario:

- Enero a Diciembre

Antes de enviar al backend, el frontend reorganiza internamente esa serie usando `periodo_lectura_inicio`, para alinearla con el orden esperado por el pipeline ENEL.

Esto permite que el modo manual sea consistente con el modo PDF.

## Outputs visibles en la app

La app muestra actualmente tarjetas resumen para:

- Producción solar anual
- Consumo total anual
- Ahorros totales largo plazo
- Ganancias por exportación de energía a largo plazo
- Nombre tarifa

## Gráficas actuales

La app `copec-enel` incluye cinco gráficas:

1. `Grafica 1 - Costos mensuales ($CLP)`
   - costo sin solar
   - costo con solar
   - ahorros con solar

2. `Grafica 2 - Consumos mensuales (kWh)`
   - producción solar
   - consumo con solar
   - exportación a red
   - consumo sin solar

3. `Grafica 3 - Proyeccion financiera del plazo completo`
   - ahorro estimado anual
   - utility rate estimado
   - crédito NEM estimado anual

4. `Grafica 4 - Proyeccion energetica del plazo completo`
   - producción solar estimada anual
   - consumo estimado anual sin solar
   - consumo estimado anual con solar
   - exportación anual estimada a red

5. `Grafica 5 - Utility rates mensuales`
   - utility rate sin solar
   - utility rate con solar

## Archivos principales de `apps/copec-enel`

- `index.html`
  Estructura de la UI, formularios, cards, header y canvases.

- `app.js`
  Lógica del formulario, transformación de payload, llamada al backend y render de métricas/gráficas.

- `styles.css`
  Estilos del layout, header, formularios y charts.

- `config.js`
  Define la base URL del backend.

- `images/`
  Logos y assets visuales.

- `boletas_ejemplo/`
  PDFs y paquetes de apoyo para pruebas.

## Configuración del backend

La web estática no puede leer `.env` directamente porque corre en navegador.

La URL del backend se controla desde:

- `apps/copec-enel/config.js`

Ejemplo local:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'http://127.0.0.1:8080',
};
```

Ejemplo productivo:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://api.tu-dominio.com',
};
```

## Integración esperada con backend

La app `copec-enel` está pensada para trabajar contra el backend ENEL que vive en el proyecto `utility-rates-dev`.

Ese backend hoy soporta:

- extracción desde PDF;
- enriquecimiento tarifario;
- análisis solar completo;
- modo directo con payload manual sin necesidad de PDF.

## Probar localmente

### Opción simple

1. Levanta el backend ENEL.
2. Abre:

```txt
apps/copec-enel/index.html
```

en el navegador.

### Opción recomendada

Sirve esta carpeta con cualquier servidor estático local para evitar limitaciones de `file://`.

## Publicación en GitHub Pages

El repositorio puede publicarse como sitio estático en GitHub Pages mediante GitHub Actions.

Configuración típica:

```txt
Settings -> Pages -> Source: GitHub Actions
```

## Favicon y compartición

La app `copec-enel` ya incluye:

- `favicon.ico`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`

También tiene metadatos de compartición en el `head`:

- `meta description`
- `Open Graph`
- `Twitter Card`

### Nota importante

Para que plataformas como WhatsApp, LinkedIn o similares muestren correctamente:

- título
- descripción
- imagen

la app debe estar publicada en una URL accesible por internet. Si se abre localmente como archivo, esas plataformas no podrán leer los metadatos.

## Convenciones útiles

- Los links a PDFs de ejemplo pueden abrirse en pestaña nueva o descargarse directamente según el caso.
- El bloque `Respuesta JSON` puede ocultarse con `d-none` sin eliminarlo del HTML.
- Cambios de labels dinámicos del botón principal se controlan desde `updateModeUi()` en `app.js`.

## Estado actual

Este repo ya no es solo una demo mínima de tarifa.

Actualmente documenta una experiencia estática bastante completa para:

- branding corporativo;
- envío de PDF;
- carga manual de payload ENEL;
- visualización de ahorro energético y financiero;
- proyección de largo plazo;
- y preparación para despliegue en GitHub Pages.
