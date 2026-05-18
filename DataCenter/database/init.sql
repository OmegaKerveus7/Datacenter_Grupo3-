DROP TABLE IF EXISTS lecturas, historial_temperatura, datos, areas, area_puertas, area_jardin, area_servidores CASCADE;

CREATE TABLE area_servidores (
    id SERIAL PRIMARY KEY,
    temperatura INT,
    humo INT DEFAULT 0,
    alerta INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
