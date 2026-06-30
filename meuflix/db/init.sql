-- Tabela que armazena cada vídeo postado na plataforma
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_path VARCHAR(500) NOT NULL,
    video_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
