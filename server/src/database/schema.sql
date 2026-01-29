-- Schema SmartBet Analytics Dashboard
-- Este archivo define la estructura completa de la base de datos

-- Tabla: Matches (Partidos)
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE,
    home_team VARCHAR(200) NOT NULL,
    away_team VARCHAR(200) NOT NULL,
    league VARCHAR(200),
    match_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    home_score INTEGER,
    away_score INTEGER,
    match_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Predictions (Predicciones extraídas de FootyStats)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    market VARCHAR(100) NOT NULL,
    odds DECIMAL(6,3) NOT NULL,
    probability DECIMAL(5,2),
    stake INTEGER CHECK (stake >= 1 AND stake <= 10),
    confidence_level VARCHAR(50),
    prediction_type VARCHAR(50),
    home_odds DECIMAL(6,3),
    draw_odds DECIMAL(6,3),
    away_odds DECIMAL(6,3),
    source VARCHAR(100) DEFAULT 'FootyStats',
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, market)
);

-- Tabla: Bets (Apuestas realizadas por el usuario)
CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE SET NULL,
    match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    odds_taken DECIMAL(6,3) NOT NULL,
    market VARCHAR(100) NOT NULL,
    selection VARCHAR(200),
    status VARCHAR(50) DEFAULT 'PENDING',
    profit_loss DECIMAL(10,2) DEFAULT 0,
    bookmaker VARCHAR(100),
    notes TEXT,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: Scraping Jobs (Registro de ejecuciones del scraper)
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'RUNNING',
    matches_found INTEGER DEFAULT 0,
    predictions_found INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Tabla: User Settings (Configuración del usuario)
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league);
CREATE INDEX IF NOT EXISTS idx_predictions_stake ON predictions(stake);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_placed ON bets(placed_at);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_date ON scraping_jobs(started_at);

-- Función para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración inicial
INSERT INTO user_settings (key, value) VALUES 
('default_stake_filter', '5'),
('bookmaker_url', 'https://www.bet365.com'),
('auto_refresh_enabled', 'false'),
('refresh_interval_minutes', '60')
ON CONFLICT (key) DO NOTHING;
