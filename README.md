# Sistema Etiquetas - Frontend

## Variables de entorno

Este frontend usa variables de entorno de Vite para la comunicacion con el backend.

1. Crea tu archivo `.env` basado en `.env.example`.
2. Ajusta los valores segun tu entorno.

Recomendado por entorno:

- Desarrollo: usa `.env.development` con `VITE_API_BASE_URL=/api`.
- Produccion (IIS): usa `.env.production` con `VITE_API_BASE_URL=http://192.168.9.169:55000/api`.

Variables disponibles:

- `VITE_API_BASE_URL`: base URL que usa el cliente HTTP del front. Valor recomendado en desarrollo: `/api`.
- `VITE_API_PROXY_TARGET`: URL real del backend a la que apunta el proxy de Vite en desarrollo.
- `VITE_DEV_SERVER_PORT`: puerto del servidor de desarrollo de Vite.

## Desarrollo

Ejecuta:

```bash
npm run dev
```

## IIS / Produccion

1. Verifica que `VITE_API_BASE_URL` apunte al backend real (puerto 55000).
2. Ejecuta `npm run build`.
3. Publica la carpeta `dist` en IIS.

Nota: el proxy de Vite solo existe en desarrollo. En IIS, si dejas `/api`, las peticiones se haran al mismo puerto del frontend y pueden devolver 404.
