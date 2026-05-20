import pg from "pg";

class Conection {

    constructor() {

        this.client = new pg.Client({
            host: "datacenterfk.cq3gc4ceq61b.us-east-1.rds.amazonaws.com",
            user: "adminfk",
            password: "Sql.postgresFK",
            database: "postgres",
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            }
        });

        this.connected = false;
    }

    async connect() {

        try {

            if (!this.connected) {

                await this.client.connect();

                this.connected = true;

                console.log("PostgreSQL conectado");
            }

            return this.client;

        } catch (error) {

            console.log("Error PostgreSQL:", error.message);

            throw error;
        }
    }

    async testConnection() {

        try {

            const client = await this.connect();

            const result = await client.query("SELECT version();");

            return { estado: "ok", postgres: result.rows[0] };

        } catch (error) {

            return { estado: "error", mensaje: error.message };
        }
    }

    async initDatabase() {

        const client = await this.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(20) NOT NULL DEFAULT 'empleado',
                codigo_nfc VARCHAR(100) UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS comandos_iot (
                id SERIAL PRIMARY KEY,
                comando VARCHAR(50) NOT NULL,
                parametros TEXT,
                ejecutado BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                ejecutado_at TIMESTAMPTZ
            )
        `);

        await client.query(`
             CREATE TABLE IF NOT EXISTS area_servidores (
                id SERIAL PRIMARY KEY,
                temperatura INT DEFAULT 0,
                humo INT DEFAULT 0,
                humedad INT DEFAULT 0,
                alerta INT DEFAULT 0,
                fan INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Migracion: agregar columna si la tabla ya existia sin ella
        try { await client.query(`ALTER TABLE area_servidores ADD COLUMN IF NOT EXISTS humedad INT DEFAULT 0`); } catch (e) {}
        try { await client.query(`ALTER TABLE area_servidores ADD COLUMN IF NOT EXISTS fan INT DEFAULT 0`); } catch (e) {}

        await client.query(`
            CREATE TABLE IF NOT EXISTS area_jardin (
                id SERIAL PRIMARY KEY,
                humedad_suelo INT DEFAULT 0,
                temperatura INT DEFAULT 0,
                humedad_aire INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS area_puertas (
                id SERIAL PRIMARY KEY,
                btn1 INT DEFAULT 0,
                btn2 INT DEFAULT 0,
                pir INT DEFAULT 0,
                puerta1 INT DEFAULT 0,
                puerta2 INT DEFAULT 0,
                alerta INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS accesos_puertas (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id),
                puerta INTEGER NOT NULL CHECK (puerta IN (1, 2)),
                metodo VARCHAR(20) NOT NULL DEFAULT 'remoto',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS solicitudes_visita (
                id SERIAL PRIMARY KEY,
                solicitante_id INTEGER REFERENCES usuarios(id) NOT NULL,
                motivo TEXT NOT NULL,
                hora_programada TIMESTAMPTZ NOT NULL,
                codigo_nfc VARCHAR(100),
                estado VARCHAR(20) DEFAULT 'pendiente',
                nfc_verificado BOOLEAN DEFAULT FALSE,
                aprobado_por INTEGER REFERENCES usuarios(id),
                rechazado_por INTEGER REFERENCES usuarios(id),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            )
        `);

        console.log("Base de datos inicializada");
    }

    async crearUsuario(nombre, email, passwordHash, rol = 'empleado') {

        const client = await this.connect();

        const result = await client.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol)
             VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, created_at`,
            [nombre, email, passwordHash, rol]
        );

        return result.rows[0];
    }

    async buscarUsuarioPorEmail(email) {

        const client = await this.connect();

        const result = await client.query(
            `SELECT id, nombre, email, password_hash, rol, codigo_nfc, created_at
             FROM usuarios WHERE email = $1`,
            [email]
        );

        return result.rows[0] || null;
    }

    async buscarUsuarioPorId(id) {

        const client = await this.connect();

        const result = await client.query(
            `SELECT id, nombre, email, rol, codigo_nfc, created_at
             FROM usuarios WHERE id = $1`,
            [id]
        );

        return result.rows[0] || null;
    }

    async listarUsuarios() {

        const client = await this.connect();

        const result = await client.query(
            `SELECT id, nombre, email, rol, codigo_nfc, created_at
             FROM usuarios ORDER BY created_at DESC`
        );

        return result.rows;
    }

    async actualizarUsuario(id, data) {

        const client = await this.connect();

        const sets = [];
        const valores = [];
        let idx = 1;

        if (data.nombre !== undefined) { sets.push(`nombre = $${idx++}`); valores.push(data.nombre); }
        if (data.email !== undefined) { sets.push(`email = $${idx++}`); valores.push(data.email); }
        if (data.rol !== undefined) { sets.push(`rol = $${idx++}`); valores.push(data.rol); }
        if (data.codigo_nfc !== undefined) { sets.push(`codigo_nfc = $${idx++}`); valores.push(data.codigo_nfc); }

        if (sets.length === 0) return null;

        valores.push(id);

        const result = await client.query(
            `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${idx}
             RETURNING id, nombre, email, rol, codigo_nfc, created_at`,
            valores
        );

        return result.rows[0] || null;
    }

    async eliminarUsuario(id) {

        const client = await this.connect();

        await client.query("DELETE FROM usuarios WHERE id = $1", [id]);

        return true;
    }

    // Comandos IoT

    async crearComando(comando, parametros = null) {

        const client = await this.connect();

        const result = await client.query(
            `INSERT INTO comandos_iot (comando, parametros)
             VALUES ($1, $2) RETURNING id, comando, parametros, ejecutado, created_at`,
            [comando, parametros]
        );

        return result.rows[0];
    }

    async obtenerComandosPendientes() {

        const client = await this.connect();

        const result = await client.query(
            `SELECT id, comando, parametros, created_at
             FROM comandos_iot WHERE ejecutado = FALSE
             ORDER BY id ASC LIMIT 10`
        );

        return result.rows;
    }

    async marcarComandoEjecutado(id) {

        const client = await this.connect();

        await client.query(
            `UPDATE comandos_iot SET ejecutado = TRUE, ejecutado_at = NOW()
             WHERE id = $1`,
            [id]
        );
    }

    // Accesos

    async registrarAcceso(usuarioId, puerta, metodo = 'remoto') {

        const client = await this.connect();

        await client.query(
            `INSERT INTO accesos_puertas (usuario_id, puerta, metodo)
             VALUES ($1, $2, $3)`,
            [usuarioId, puerta, metodo]
        );
    }

    async obtenerAccesos(limite = 50) {

        const client = await this.connect();

        const result = await client.query(
            `SELECT ap.*, u.nombre, u.email
             FROM accesos_puertas ap
             JOIN usuarios u ON u.id = ap.usuario_id
             ORDER BY ap.created_at DESC LIMIT $1`,
            [limite]
        );

        return result.rows;
    }

    // Solicitudes de visita

    async crearSolicitudVisita(solicitanteId, motivo, horaProgramada) {

        const client = await this.connect();

        const result = await client.query(
            `INSERT INTO solicitudes_visita (solicitante_id, motivo, hora_programada)
             VALUES ($1, $2, $3) RETURNING *`,
            [solicitanteId, motivo, horaProgramada]
        );

        return result.rows[0];
    }

    async obtenerSolicitudesPorUsuario(usuarioId) {

        const client = await this.connect();

        const result = await client.query(
            `SELECT sv.*, ap.nombre AS aprobado_por_nombre, rp.nombre AS rechazado_por_nombre
             FROM solicitudes_visita sv
             LEFT JOIN usuarios ap ON ap.id = sv.aprobado_por
             LEFT JOIN usuarios rp ON rp.id = sv.rechazado_por
             WHERE sv.solicitante_id = $1
             ORDER BY sv.created_at DESC`,
            [usuarioId]
        );

        return result.rows;
    }

    async obtenerSolicitudesPendientes() {

        const client = await this.connect();

        const result = await client.query(
            `SELECT sv.*, u.nombre AS solicitante_nombre, u.email AS solicitante_email
             FROM solicitudes_visita sv
             JOIN usuarios u ON u.id = sv.solicitante_id
             WHERE sv.estado = 'pendiente'
             ORDER BY sv.created_at DESC`
        );

        return result.rows;
    }

    async obtenerTodasSolicitudes() {

        const client = await this.connect();

        const result = await client.query(
            `SELECT sv.*, u.nombre AS solicitante_nombre, u.email AS solicitante_email,
                    ap.nombre AS aprobado_por_nombre, rp.nombre AS rechazado_por_nombre
             FROM solicitudes_visita sv
             JOIN usuarios u ON u.id = sv.solicitante_id
             LEFT JOIN usuarios ap ON ap.id = sv.aprobado_por
             LEFT JOIN usuarios rp ON rp.id = sv.rechazado_por
             ORDER BY sv.created_at DESC`
        );

        return result.rows;
    }

    async aprobarSolicitud(id, aprobadoPor) {

        const client = await this.connect();

        const codigoNfc = crypto.randomUUID().slice(0, 8).toUpperCase();

        const result = await client.query(
            `UPDATE solicitudes_visita
             SET estado = 'aprobada', aprobado_por = $1, codigo_nfc = $2,
                 updated_at = NOW()
             WHERE id = $3 RETURNING *`,
            [aprobadoPor, codigoNfc, id]
        );

        return result.rows[0] || null;
    }

    async rechazarSolicitud(id, rechazadoPor) {

        const client = await this.connect();

        const result = await client.query(
            `UPDATE solicitudes_visita
             SET estado = 'rechazada', rechazado_por = $1, updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [rechazadoPor, id]
        );

        return result.rows[0] || null;
    }

    async verificarNFC(id, codigoNfc) {

        const client = await this.connect();

        const solicitud = await client.query(
            `SELECT * FROM solicitudes_visita WHERE id = $1`,
            [id]
        );

        if (solicitud.rows.length === 0) return { valido: false, error: "Solicitud no encontrada" };

        const sv = solicitud.rows[0];

        if (sv.estado !== 'aprobada') return { valido: false, error: "La visita no está aprobada" };
        if (sv.codigo_nfc !== codigoNfc) return { valido: false, error: "Código NFC incorrecto" };

        const horaProgramada = new Date(sv.hora_programada);
        const ahora = new Date();
        const diffMs = Math.abs(ahora - horaProgramada);
        const diffMin = diffMs / 60000;

        if (diffMin > 5) return { valido: false, error: "Fuera de la ventana de 5 minutos" };

        await client.query(
            `UPDATE solicitudes_visita SET nfc_verificado = TRUE, updated_at = NOW() WHERE id = $1`,
            [id]
        );

        return { valido: true, mensaje: "NFC verificado correctamente", solicitud: sv };
    }

    async obtenerSolicitudPorId(id) {

        const client = await this.connect();

        const result = await client.query(
            `SELECT sv.*, u.nombre AS solicitante_nombre, u.email AS solicitante_email
             FROM solicitudes_visita sv
             JOIN usuarios u ON u.id = sv.solicitante_id
             WHERE sv.id = $1`,
            [id]
        );

        return result.rows[0] || null;
    }

    async obtenerVisitaAprobadaActiva(usuarioId) {

        const client = await this.connect();

        const result = await client.query(
            `SELECT * FROM solicitudes_visita
             WHERE solicitante_id = $1
               AND estado = 'aprobada'
               AND nfc_verificado = TRUE
               AND hora_programada BETWEEN NOW() - INTERVAL '5 minutes'
                                       AND NOW() + INTERVAL '5 minutes'
             ORDER BY hora_programada DESC LIMIT 1`,
            [usuarioId]
        );

        return result.rows[0] || null;
    }

    // Métodos existentes

    async guardarServidores(temperatura, humo, humedad, alerta, fan = 0) {

        try {

            const client = await this.connect();

            await client.query(
                `INSERT INTO area_servidores (temperatura, humo, humedad, alerta, fan)
                 VALUES ($1, $2, $3, $4, $5)`,
                [temperatura, humo, humedad, alerta, fan]
            );

            console.log("Servidores:", temperatura, humo, humedad, alerta, fan);

            return { estado: "ok", mensaje: "Guardado" };

        } catch (error) {

            console.log("Error servidores:", error.message);

            return { estado: "error", mensaje: error.message };
        }
    }

    async guardarPuertas(btn1, btn2, pir, puerta1, puerta2, alerta) {

        try {

            const client = await this.connect();

            await client.query(
                `INSERT INTO area_puertas (btn1, btn2, pir, puerta1, puerta2, alerta)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [btn1, btn2, pir, puerta1, puerta2, alerta]
            );

            console.log("Puertas:", btn1, btn2, pir, puerta1, puerta2, alerta);

            return { estado: "ok", mensaje: "Guardado" };

        } catch (error) {

            console.log("Error puertas:", error.message);

            return { estado: "error", mensaje: error.message };
        }
    }

    async guardarJardin(humedadSuelo, temperatura, humedadAire) {

        try {

            const client = await this.connect();

            await client.query(
                `INSERT INTO area_jardin (humedad_suelo, temperatura, humedad_aire)
                 VALUES ($1, $2, $3)`,
                [humedadSuelo, temperatura, humedadAire]
            );

            console.log("Jardin:", humedadSuelo, temperatura, humedadAire);

            return { estado: "ok", mensaje: "Guardado" };

        } catch (error) {

            console.log("Error jardin:", error.message);

            return { estado: "error", mensaje: error.message };
        }
    }
}

export default new Conection();
