# Sistema Etiquetas - Frontend

## Variables de entorno

Este frontend usa variables de entorno de Vite para la comunicacion con el backend.

1. Crea tu archivo `.env` basado en `.env.example`.
2. Ajusta los valores segun tu entorno.

Recomendado por entorno:

- Desarrollo: `VITE_API_BASE_URL=/api` y `VITE_API_PROXY_TARGET=http://127.0.0.1:50000` (por defecto en `vite.config.js` si no defines la variable).
- Produccion (Nginx en el mismo dominio): `VITE_API_BASE_URL=/api`; Nginx hace proxy de `/api` al Node en `127.0.0.1:50000` (puerto por defecto del backend).
- Produccion (IIS u otro host distinto al API): URL absoluta del backend en `VITE_API_BASE_URL` y CORS en el servidor.

Variables disponibles:

- `VITE_API_BASE_URL`: base URL que usa el cliente HTTP del front. Valor recomendado en desarrollo: `/api`.
- `VITE_API_PROXY_TARGET`: URL real del backend a la que apunta el proxy de Vite en desarrollo.
- `VITE_DEV_SERVER_PORT`: puerto del servidor de desarrollo de Vite.

## Desarrollo

Ejecuta:

```bash
npm run dev
```

## Produccion (build)

1. Con Nginx/VPS: deja `VITE_API_BASE_URL=/api` y configura Nginx para enrutar `/api` al backend (ver `deploy/nginx-etiquetas.conf`). El backend por defecto escucha en el puerto **50000**.
2. Ejecuta `npm run build`.
3. Publica la carpeta `dist` y el backend segun tu entorno.

Nota: el proxy de Vite solo existe en desarrollo. Sin Nginx (o reglas equivalentes en IIS), `/api` debe resolverse en el mismo sitio que sirve el front o usar URL absoluta al API.
