# Savings Rates Static Demo

Web plana en HTML, CSS y JavaScript que consume el backend Node.js del proyecto `savings-rates-prototype`.

## Flujo

```txt
index.html -> backend Node.js -> Lambda externa
```

La web plana nunca llama directamente a la Lambda. Llama al backend Node.js:

```txt
GET http://localhost:3000/api/tariff?masterTariffId=20000000000000&yearlyConsumptionKwh=12000
```

Tambien puede consultar por costo anual:

```txt
GET http://localhost:3000/api/tariff?masterTariffId=20000000000000&annualCost=130000
```

## Probar localmente

1. Levanta el backend Node.js desde `savings-rates-prototype`:

```bash
npm run start
```

2. Abre este archivo en el navegador:

```txt
index.html
```

Tambien puedes servir esta carpeta con cualquier servidor estatico.

## Configurar backend

La web plana no puede leer `.env` directamente porque corre en el navegador. Para cambiar la URL del backend, edita `config.js`:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'http://localhost:3000',
};
```

Para produccion, usa el dominio HTTPS de tu backend en Hostinger:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://api.tu-dominio.com',
};
```

Si esta pagina se publica en GitHub Pages, el backend en Hostinger debe estar en HTTPS para evitar bloqueo por mixed content.
