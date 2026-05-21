import dotenv from 'dotenv';
dotenv.config();

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';

import Conection from './Services/conection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'datacenter-fk-secret-key-2026';

const app = new Elysia();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(
    jwt({
        name: 'jwt',
        secret: JWT_SECRET
    })
);

import { existsSync, readFileSync } from 'fs';

async function authGuard({ jwt, headers, set }) {

    const auth = headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {

        set.status = 401;
        return { error: "No autorizado" };
    }

    const payload = await jwt.verify(auth.slice(7));

    if (!payload) {

        set.status = 401;
        return { error: "Token inválido o expirado" };
    }

    return payload;
}

async function rolGuard(payload, roles, set) {

    if (!roles.includes(payload.rol)) {

        set.status = 403;
        return { error: "No tienes permisos para esta acción" };
    }

    return true;
}

// ============ HEALTH ============

app.get('/api/health', () => ({ api: "Funcionando" }));

app.get('/testconnection', async () => {

    return await Conection.testConnection();
});

// ============ DB INIT ============

app.post('/api/db/init', async () => {

    await Conection.initDatabase();

    const adminExistente = await Conection.buscarUsuarioPorEmail('admin@datacenter.com');

    if (!adminExistente) {

        const hash = await Bun.password.hash('admin123');

        await Conection.crearUsuario('Administrador', 'admin@datacenter.com', hash, 'admin');

        const hashGerente = await Bun.password.hash('gerente123');

        await Conection.crearUsuario('Gerente', 'gerente@datacenter.com', hashGerente, 'gerente');

        const hashEmpleado = await Bun.password.hash('empleado123');

        await Conection.crearUsuario('Empleado', 'empleado@datacenter.com', hashEmpleado, 'empleado');
    }

    return { estado: "ok", mensaje: "Base de datos inicializada" };
});

// ============ AUTH ============

app.post('/auth/registro', async ({ body, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const soloAdmin = await rolGuard(payload, ['admin'], set);

        if (soloAdmin && soloAdmin.error) return soloAdmin;

        const { nombre, email, password, rol } = body;

        if (!nombre || !email || !password) {

            set.status = 400;
            return { error: "Nombre, email y password son requeridos" };
        }

        const existente = await Conection.buscarUsuarioPorEmail(email);

        if (existente) {

            set.status = 400;
            return { error: "El email ya está registrado" };
        }

        const rolFinal = rol || 'empleado';
        const hash = await Bun.password.hash(password);
        const usuario = await Conection.crearUsuario(nombre, email, hash, rolFinal);

        return { estado: "ok", usuario };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.post('/auth/login', async ({ body, jwt, set }) => {

    try {
        const { email, password } = body;

        if (!email || !password) {

            set.status = 400;
            return { error: "Email y password son requeridos" };
        }

        const usuario = await Conection.buscarUsuarioPorEmail(email);

        if (!usuario) {

            set.status = 401;
            return { error: "Credenciales inválidas" };
        }

        const valido = await Bun.password.verify(password, usuario.password_hash);

        if (!valido) {

            set.status = 401;
            return { error: "Credenciales inválidas" };
        }

        const token = await jwt.sign({
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.post('/auth/me', async ({ jwt, headers, set }) => {

    const payload = await authGuard({ jwt, headers, set });

    if (payload && payload.error) return payload;

    const usuario = await Conection.buscarUsuarioPorId(payload.id);

    if (!usuario) {

        set.status = 404;
        return { error: "Usuario no encontrado" };
    }

    return { usuario };
});

// ============ PUERTA 1 ============

app.post('/api/acceso/puerta-1', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const comando = await Conection.crearComando('OPEN_DOOR_1', null);

        await Conection.registrarAcceso(payload.id, 1, 'remoto');

        return {
            estado: "ok",
            mensaje: "Puerta 1 abierta",
            comandoId: comando.id
        };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ PUERTA 2 (temporal: igual que puerta 1 para pruebas) ============

app.post('/api/acceso/puerta-2', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const comando = await Conection.crearComando('OPEN_DOOR_2', null);

        await Conection.registrarAcceso(payload.id, 2, 'remoto');

        return {
            estado: "ok",
            mensaje: "Puerta 2 abierta",
            comandoId: comando.id
        };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ ACCESO NFC (valida key de puerta + visita del usuario autenticado) ============

const PUERTA2_KEY = '7C:B3:70:51';

app.post('/api/acceso/nfc', async ({ body, jwt, headers, set, request }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const { codigo_nfc } = body;

        if (codigo_nfc !== PUERTA2_KEY) {
            set.status = 403;
            return { error: "No tiene acceso" };
        }

        const visita = await Conection.obtenerVisitaAprobadaPorUsuario(payload.id);

        if (!visita) {
            await Conection.expirarVisitasVencidas(payload.id);
            set.status = 403;
            return { error: "No tiene visita programada para esta hora" };
        }

        const comando = await Conection.crearComando('OPEN_DOOR_2');

        await Conection.registrarAcceso(payload.id, 2, 'nfc');

        return {
            estado: "ok",
            mensaje: `Bienvenido ${payload.nombre}, puerta 2 abierta`,
            comandoId: comando.id
        };

    } catch (error) {
        set.status = 500;
        return { error: error.message };
    }
});

// ============ VISITAS ============

app.post('/api/visitas', async ({ body, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const { motivo, hora_programada } = body;

        if (!motivo || !hora_programada) {

            set.status = 400;
            return { error: "Motivo y hora_programada son requeridos" };
        }

        const solicitud = await Conection.crearSolicitudVisita(payload.id, motivo, hora_programada);

        return { estado: "ok", solicitud };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.get('/api/visitas', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const visitas = await Conection.obtenerSolicitudesPorUsuario(payload.id);

        return visitas;

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.get('/api/visitas/pendientes', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin', 'gerente'], set);

        if (check && check.error) return check;

        const visitas = await Conection.obtenerSolicitudesPendientes();

        return visitas;

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.get('/api/visitas/todas', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin'], set);

        if (check && check.error) return check;

        const visitas = await Conection.obtenerTodasSolicitudes();

        return visitas;

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.post('/api/visitas/:id/aprobar', async ({ params, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin', 'gerente'], set);

        if (check && check.error) return check;

        const solicitud = await Conection.aprobarSolicitud(parseInt(params.id), payload.id);

        if (!solicitud) {

            set.status = 404;
            return { error: "Solicitud no encontrada" };
        }

        return { estado: "ok", solicitud };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.post('/api/visitas/:id/rechazar', async ({ params, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin', 'gerente'], set);

        if (check && check.error) return check;

        const solicitud = await Conection.rechazarSolicitud(parseInt(params.id), payload.id);

        if (!solicitud) {

            set.status = 404;
            return { error: "Solicitud no encontrada" };
        }

        return { estado: "ok", solicitud };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.put('/api/visitas/:id/fecha', async ({ params, body, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin', 'gerente'], set);

        if (check && check.error) return check;

        const { hora_programada } = body;

        if (!hora_programada) {

            set.status = 400;
            return { error: "hora_programada es requerida" };
        }

        const solicitud = await Conection.actualizarFechaSolicitud(parseInt(params.id), hora_programada);

        if (!solicitud) {

            set.status = 404;
            return { error: "Solicitud no encontrada" };
        }

        return { estado: "ok", solicitud };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ USUARIOS (Admin) ============

app.get('/api/usuarios', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin'], set);

        if (check && check.error) return check;

        const usuarios = await Conection.listarUsuarios();

        return usuarios;

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.post('/api/usuarios', async ({ body, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin'], set);

        if (check && check.error) return check;

        const { nombre, email, password, rol } = body;

        if (!nombre || !email || !password) {

            set.status = 400;
            return { error: "Nombre, email y password son requeridos" };
        }

        const existente = await Conection.buscarUsuarioPorEmail(email);

        if (existente) {

            set.status = 400;
            return { error: "El email ya existe" };
        }

        const hash = await Bun.password.hash(password);
        const usuario = await Conection.crearUsuario(nombre, email, hash, rol || 'empleado');

        return { estado: "ok", usuario };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.put('/api/usuarios/:id', async ({ params, body, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin'], set);

        if (check && check.error) return check;

        const usuario = await Conection.actualizarUsuario(parseInt(params.id), body);

        if (!usuario) {

            set.status = 404;
            return { error: "Usuario no encontrado" };
        }

        return { estado: "ok", usuario };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.delete('/api/usuarios/:id', async ({ params, jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin'], set);

        if (check && check.error) return check;

        await Conection.eliminarUsuario(parseInt(params.id));

        return { estado: "ok", mensaje: "Usuario eliminado" };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ COMANDOS IoT (para ESP32) ============

app.get('/api/comandos/pendientes', async ({ set }) => {

    try {
        const comandos = await Conection.obtenerComandosPendientes();

        return comandos;

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

app.post('/api/comandos/:id/ejecutar', async ({ params, set }) => {

    try {
        await Conection.marcarComandoEjecutado(parseInt(params.id));

        return { estado: "ok" };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ ACCESOS (historial) ============

app.get('/api/accesos', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const check = await rolGuard(payload, ['admin'], set);

        if (check && check.error) return check;

        const accesos = await Conection.obtenerAccesos();

        return accesos;

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ MONITOREO (unifica ultimos datos de todas las areas) ============

app.get('/api/monitoreo', async ({ jwt, headers, set }) => {

    try {
        const payload = await authGuard({ jwt, headers, set });

        if (payload && payload.error) return payload;

        const client = await Conection.connect();

        const srv = await client.query(`SELECT temperatura, humo, humedad, alerta, fan, created_at FROM area_servidores ORDER BY created_at DESC LIMIT 1`);
        const pue = await client.query(`SELECT btn1, btn2, pir, puerta1, puerta2, alerta, created_at FROM area_puertas ORDER BY created_at DESC LIMIT 1`);
        const jar = await client.query(`SELECT humedad_suelo, temperatura, humedad_aire, created_at FROM area_jardin ORDER BY created_at DESC LIMIT 1`);

        return {
            servidores: srv.rows[0] || null,
            puertas: pue.rows[0] || null,
            jardin: jar.rows[0] || null
        };

    } catch (error) {

        set.status = 500;
        return { error: error.message };
    }
});

// ============ EXISTENTES ============

app.post('/area/servidores', async ({ body }) => {

    const { temperatura, humo, humedad, alerta, fan } = body;

    return await Conection.guardarServidores(temperatura, humo, humedad, alerta, fan);
});

app.get('/area/servidores', async () => {

    const client = await Conection.connect();

    const result = await client.query(
        `SELECT temperatura, humo, humedad, alerta, fan, created_at
         FROM area_servidores ORDER BY created_at DESC LIMIT 20`
    );

    return result.rows;
});

app.post('/area/puertas', async ({ body }) => {

    const { btn1, btn2, pir, puerta1, puerta2, alerta } = body;

    return await Conection.guardarPuertas(btn1, btn2, pir, puerta1, puerta2, alerta);
});

app.get('/area/puertas', async () => {

    const client = await Conection.connect();

    const result = await client.query(
        `SELECT btn1, btn2, pir, puerta1, puerta2, alerta, created_at
         FROM area_puertas ORDER BY created_at DESC LIMIT 20`
    );

    return result.rows;
});

app.post('/area/jardin', async ({ body }) => {

    const { humedad_suelo, temperatura, humedad_aire } = body;

    return await Conection.guardarJardin(humedad_suelo, temperatura, humedad_aire);
});

app.get('/area/jardin', async () => {

    const client = await Conection.connect();

    const result = await client.query(
        `SELECT humedad_suelo, temperatura, humedad_aire, created_at
         FROM area_jardin ORDER BY created_at DESC LIMIT 20`
    );

    return result.rows;
});

// ============ TELEGRAM ============

app.post('/api/telegram/enviar', async ({ body }) => {

    const { mensaje } = body;

    if (!mensaje) {

        return { estado: "error", mensaje: "Mensaje requerido" };
    }

    return await Conection.enviarTelegram(mensaje);
});

// ============ SPA FALLBACK (FRONTEND) ============

import { staticPlugin } from '@elysiajs/static';

const frontendDist = '../Frontend/dist';

if (existsSync(frontendDist)) {

    app.use(staticPlugin({ assets: frontendDist, prefix: '/' }));

    app.get('*', ({ set }) => {

        set.headers['Content-Type'] = 'text/html';

        return readFileSync(frontendDist + '/index.html', 'utf-8');
    });
}

// ============ LISTEN ============

const port = parseInt(process.env.APP_PORT || '3000');

app.listen({ port, hostname: '0.0.0.0' });

console.log(`Servidor ejecutandose en: http://192.168.1.49:${port}`);
