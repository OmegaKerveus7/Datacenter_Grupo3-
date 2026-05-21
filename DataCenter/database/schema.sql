-- =============================================
-- DataCenter - Esquema completo de base de datos
-- =============================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'empleado',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comandos_iot (
    id SERIAL PRIMARY KEY,
    comando VARCHAR(50) NOT NULL,
    parametros TEXT,
    ejecutado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ejecutado_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS area_servidores (
    id SERIAL PRIMARY KEY,
    temperatura INT DEFAULT 0,
    humo INT DEFAULT 0,
    humedad INT DEFAULT 0,
    alerta INT DEFAULT 0,
    fan INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS area_jardin (
    id SERIAL PRIMARY KEY,
    humedad_suelo INT DEFAULT 0,
    temperatura INT DEFAULT 0,
    humedad_aire INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS area_puertas (
    id SERIAL PRIMARY KEY,
    btn1 INT DEFAULT 0,
    btn2 INT DEFAULT 0,
    pir INT DEFAULT 0,
    puerta1 INT DEFAULT 0,
    puerta2 INT DEFAULT 0,
    alerta INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accesos_puertas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    puerta INTEGER NOT NULL CHECK (puerta IN (1, 2)),
    metodo VARCHAR(20) NOT NULL DEFAULT 'remoto',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitudes_visita (
    id SERIAL PRIMARY KEY,
    solicitante_id INTEGER REFERENCES usuarios(id) NOT NULL,
    motivo TEXT NOT NULL,
    hora_programada TIMESTAMPTZ NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    aprobado_por INTEGER REFERENCES usuarios(id),
    rechazado_por INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
