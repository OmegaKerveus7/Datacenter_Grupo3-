import dotenv from 'dotenv';
dotenv.config();

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

import Conection from './Services/conection.js';

const app = new Elysia();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.get('/', () => ({
    api: 'Funcionando'
}));

app.get('/testconnection', async () => {

    return await Conection.testConnection();

});

app.post('/area/servidores', async ({ body }) => {

    const {
        temperatura,
        humo,
        alerta
    } = body;

    return await Conection.guardarServidores(
        temperatura,
        humo,
        alerta
    );
});

app.get('/area/servidores', async () => {

    const client = await Conection.connect();

    const result = await client.query(
        `
        SELECT temperatura, humo, alerta, created_at
        FROM area_servidores
        ORDER BY created_at DESC
        LIMIT 20
        `
    );

    return result.rows;
});

app.post('/area/jardin', async ({ body }) => {

    const {
        humedad_suelo,
        temperatura,
        humedad_aire
    } = body;

    return await Conection.guardarJardin(
        humedad_suelo,
        temperatura,
        humedad_aire
    );
});

app.get('/area/jardin', async () => {

    const client = await Conection.connect();

    const result = await client.query(
        `
        SELECT humedad_suelo, temperatura, humedad_aire, created_at
        FROM area_jardin
        ORDER BY created_at DESC
        LIMIT 20
        `
    );

    return result.rows;
});

const port =
    parseInt(process.env.APP_PORT || '3000');

app.listen({
    port: port,
    hostname: '0.0.0.0'
});

console.log(
    `Servidor ejecutandose en:
http://192.168.1.49:${port}`
);
