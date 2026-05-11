import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/sqlite.js';
import empleadoRoutes from './routes/empleados.js';
import entregaRoutes from './routes/entregas.js';
import ajusteRoutes from './routes/ajustes.js';
import reporteRoutes from './routes/reportes.js';
import configRoutes from './routes/config.js';
import sys21Routes from './routes/sys21.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 50000;
const HOST = process.env.HOST || 'localhost';

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/empleados', empleadoRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/ajustes', ajusteRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/config', configRoutes);
app.use('/api/sys21', sys21Routes);

app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'Sistema de Control de Etiquetas API',
    version: '1.0.0',
    estado: 'Activo'
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});
