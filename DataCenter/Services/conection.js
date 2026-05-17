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
}

export default new Conection();