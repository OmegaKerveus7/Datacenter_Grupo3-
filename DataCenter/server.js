import dotenv from 'dotenv';
dotenv.config();

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

import Conection from './Services/conection.js';

const app = new Elysia();

// Permitir cualquier conexión
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Ruta principal
app.get('/', () => ({
    api: 'Funcionando'
}));

// Test conexión PostgreSQL
app.get('/testconnection', async () => {

    return await Conection.testConnection();

});

// ESP32 envia datos
app.post('/sensores', async ({ body }) => {

    const {
        temperatura,
        humo
    } = body;

    return await Conection.guardarDatos(
        temperatura,
        humo
    );
});

const port =
    parseInt(process.env.APP_PORT || '3000');

// ACEPTAR CONEXIONES DE TODA LA RED
app.listen({
    port: port,
    hostname: '0.0.0.0'
});

console.log(
    `Servidor ejecutandose en:
http://10.132.21.72:${port}`
);