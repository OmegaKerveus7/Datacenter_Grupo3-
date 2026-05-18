-- ============================================
-- Tablas para DataCenter
-- ============================================

CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO areas (id, nombre) VALUES
(1, 'sala_servidores'),
(2, 'puertas_acceso'),
(3, 'jardin')
ON CONFLICT (id) DO NOTHING;

-- Tabla de lecturas actuales (1 fila por area, se actualiza)
CREATE TABLE IF NOT EXISTS lecturas (
    id SERIAL PRIMARY KEY,
    area_id INT NOT NULL UNIQUE REFERENCES areas(id),
    temperatura INT,
    humo INT DEFAULT 0,
    alerta INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Historial de cambios de temperatura
CREATE TABLE IF NOT EXISTS historial_temperatura (
    id SERIAL PRIMARY KEY,
    area_id INT NOT NULL REFERENCES areas(id),
    temperatura INT,
    humo INT,
    alerta INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_area
    ON historial_temperatura (area_id, created_at DESC);
