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

    async guardarServidores(
        temperatura,
        humo,
        alerta
    ) {

        try {

            const client =
                await this.connect();

            await client.query(
                `
                INSERT INTO area_servidores
                    (temperatura, humo, alerta)
                VALUES ($1, $2, $3)
                `,
                [
                    temperatura,
                    humo,
                    alerta
                ]
            );

            console.log(
                "Servidores:",
                temperatura,
                humo,
                alerta
            );

            return {
                estado: "ok",
                mensaje: "Guardado"
            };

        } catch (error) {

            console.log(
                "Error servidores:",
                error.message
            );

            return {
                estado: "error",
                mensaje: error.message
            };
        }
    }

    async guardarJardin(
        humedadSuelo,
        temperatura,
        humedadAire
    ) {

        try {

            const client =
                await this.connect();

            await client.query(
                `
                INSERT INTO area_jardin
                    (humedad_suelo, temperatura, humedad_aire)
                VALUES ($1, $2, $3)
                `,
                [
                    humedadSuelo,
                    temperatura,
                    humedadAire
                ]
            );

            console.log(
                "Jardin:",
                humedadSuelo,
                temperatura,
                humedadAire
            );

            return {
                estado: "ok",
                mensaje: "Guardado"
            };

        } catch (error) {

            console.log(
                "Error jardin:",
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
