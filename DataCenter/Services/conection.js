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

                console.log(
                    "PostgreSQL conectado"
                );
            }

            return this.client;

        } catch (error) {

            console.log(
                "Error PostgreSQL:",
                error.message
            );

            throw error;
        }
    }

    async testConnection() {

        try {

            const client =
                await this.connect();

            const result =
                await client.query(
                    "SELECT version();"
                );

            return {
                estado: "ok",
                postgres: result.rows[0]
            };

        } catch (error) {

            return {
                estado: "error",
                mensaje: error.message
            };
        }
    }

    async guardarDatos(
        temperatura,
        humo
    ) {

        try {

            const client =
                await this.connect();

            await client.query(
                `
                INSERT INTO datos
                (
                    temperatura,
                    humo
                )
                VALUES ($1, $2)
                `,
                [
                    temperatura,
                    humo
                ]
            );

            console.log(
                "Datos guardados:",
                temperatura,
                humo
            );

            return {
                estado: "ok",
                mensaje: "Datos guardados"
            };

        } catch (error) {

            console.log(
                "Error guardando:",
                error.message
            );

            return {
                estado: "error",
                mensaje: error.message
            };
        }
    }

    async guardarLectura(
        areaId,
        temperatura,
        humo,
        alerta
    ) {

        try {

            const client =
                await this.connect();

            // Upsert en lecturas actuales
            await client.query(
                `
                INSERT INTO lecturas
                    (area_id, temperatura, humo, alerta, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (area_id)
                DO UPDATE SET
                    temperatura = $2,
                    humo = $3,
                    alerta = $4,
                    updated_at = NOW()
                `,
                [
                    areaId,
                    temperatura,
                    humo,
                    alerta
                ]
            );

            // Insertar en historial
            await client.query(
                `
                INSERT INTO historial_temperatura
                    (area_id, temperatura, humo, alerta)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    areaId,
                    temperatura,
                    humo,
                    alerta
                ]
            );

            return {
                estado: "ok",
                mensaje: "Lectura guardada"
            };

        } catch (error) {

            console.log(
                "Error guardando lectura:",
                error.message
            );

            return {
                estado: "error",
                mensaje: error.message
            };
        }
    }

    async guardarLecturasMultiples(areas) {

        const client =
            await this.connect();

        try {

            for (const a of areas) {

                await client.query(
                    `
                    INSERT INTO lecturas
                        (area_id, temperatura, humo, alerta, updated_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (area_id)
                    DO UPDATE SET
                        temperatura = $2,
                        humo = $3,
                        alerta = $4,
                        updated_at = NOW()
                    `,
                    [
                        a.area_id,
                        a.temperatura,
                        a.humo ?? 0,
                        a.alerta ?? 0
                    ]
                );

                await client.query(
                    `
                    INSERT INTO historial_temperatura
                        (area_id, temperatura, humo, alerta)
                    VALUES ($1, $2, $3, $4)
                    `,
                    [
                        a.area_id,
                        a.temperatura,
                        a.humo ?? 0,
                        a.alerta ?? 0
                    ]
                );
            }

            return {
                estado: "ok",
                mensaje: `${areas.length} areas actualizadas`
            };

        } catch (error) {

            console.log(
                "Error guardando lecturas:",
                error.message
            );

            return {
                estado: "error",
                mensaje: error.message
            };
        }
    }
}

export default new Conection();