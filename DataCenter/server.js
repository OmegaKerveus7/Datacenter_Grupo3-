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

// ESP32 envia datos de un sensor (viejo, compatible)
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

// ESP32 envia lecturas de todas las areas
app.post('/lecturas', async ({ body }) => {

    const { areas } = body;

    if (!areas || !Array.isArray(areas)) {
        return {
            estado: "error",
            mensaje: "Se requiere un arreglo 'areas'"
        };
    }

    return await Conection.guardarLecturasMultiples(areas);
});

// Obtener ultimas lecturas por area
app.get('/lecturas', async () => {

    const client = await Conection.connect();

    const result = await client.query(
        `
        SELECT a.id, a.nombre,
               l.temperatura, l.humo, l.alerta, l.updated_at
        FROM areas a
        LEFT JOIN lecturas l ON l.area_id = a.id
        ORDER BY a.id
        `
    );

    return result.rows;
});

// Obtener historial de un area
app.get('/historial/:areaId', async ({ params }) => {

    const client = await Conection.connect();

    const result = await client.query(
        `
        SELECT temperatura, humo, alerta, created_at
        FROM historial_temperatura
        WHERE area_id = $1
        ORDER BY created_at DESC
        LIMIT 100
        `,
        [params.areaId]
    );

    return result.rows;
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
http://192.168.1.49:${port}`
);