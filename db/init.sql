-- Cada "página" representa o presente de uma pessoa (ex: para o namorado, para o casal)
-- slug: identifica a página no link público (que pode ser compartilhado)
-- edit_token: chave secreta que só o criador da página possui, usada para adicionar/remover vídeos
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(20) UNIQUE NOT NULL,
    edit_token VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'Minha página',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Corrige bancos que já foram criados antes com a coluna menor (40 caracteres)
ALTER TABLE pages ALTER COLUMN edit_token TYPE VARCHAR(64);

-- Cada vídeo pertence a uma única página (page_id)
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_path VARCHAR(500) NOT NULL,
    video_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Corrige bancos que já tinham a tabela "videos" criada antes de existir a coluna page_id
ALTER TABLE videos ADD COLUMN IF NOT EXISTS page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE;
-- Remove vídeos antigos que ficaram sem página associada (dados de teste da versão anterior)
DELETE FROM videos WHERE page_id IS NULL;
ALTER TABLE videos ALTER COLUMN page_id SET NOT NULL;