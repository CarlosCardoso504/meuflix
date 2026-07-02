require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const pool = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Pastas ----------
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ---------- Middlewares ----------
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Upload (multer) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

const allowedImage = ['.png', '.jpg', '.jpeg', '.webp'];
const allowedVideo = ['.mp4', '.webm', '.mov'];

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB por arquivo
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'thumbnail' && !allowedImage.includes(ext)) {
      return cb(new Error('Capa deve ser uma imagem (png, jpg, jpeg, webp)'));
    }
    if (file.fieldname === 'video' && !allowedVideo.includes(ext)) {
      return cb(new Error('Vídeo deve ser mp4, webm ou mov'));
    }
    cb(null, true);
  }
});

// ---------- Helpers ----------
function gerarSlug() {
  // string curta e amigável para URL pública, ex: "a1b2c3d4"
  return crypto.randomBytes(6).toString('hex');
}

function gerarEditToken() {
  // chave secreta bem maior, praticamente impossível de adivinhar
  return crypto.randomBytes(24).toString('hex');
}

// Confirma que quem está chamando a rota tem a chave secreta da página
async function requireEditToken(req, res, next) {
  try {
    const { slug } = req.params;
    const token = req.header('x-edit-token') || '';

    const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    const page = result.rows[0];
    if (!token || token !== page.edit_token) {
      return res.status(401).json({ error: 'Link de edição inválido' });
    }

    req.page = page;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao validar acesso' });
  }
}

// ---------- Inicialização do banco ----------
async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'db', 'init.sql'), 'utf8');
  await pool.query(sql);
  console.log('[OK] Tabelas "pages" e "videos" verificadas/criadas com sucesso.');
}

// ---------- Rotas da API ----------

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Criar uma nova página (gera slug público + token secreto de edição)
app.post('/api/pages', async (req, res) => {
  try {
    const { title } = req.body;
    const slug = gerarSlug();
    const editToken = gerarEditToken();

    const result = await pool.query(
      `INSERT INTO pages (slug, edit_token, title) VALUES ($1, $2, $3) RETURNING *`,
      [slug, editToken, (title || 'Minha página').slice(0, 200)]
    );

    const page = result.rows[0];
    res.status(201).json({
      slug: page.slug,
      editToken: page.edit_token,
      title: page.title
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar página' });
  }
});

// Buscar dados públicos de uma página (título + lista de vídeos) — sem expor o edit_token
app.get('/api/pages/:slug', async (req, res) => {
  try {
    const pageResult = await pool.query('SELECT id, slug, title, created_at FROM pages WHERE slug = $1', [req.params.slug]);
    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }
    const page = pageResult.rows[0];

    const videosResult = await pool.query(
      'SELECT id, title, description, thumbnail_path, video_path, created_at FROM videos WHERE page_id = $1 ORDER BY created_at DESC',
      [page.id]
    );

    res.json({ ...page, videos: videosResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar página' });
  }
});

// Confirma se um edit_token é válido para um slug (usado pelo front-end para liberar o modo de edição)
app.post('/api/pages/:slug/verificar', async (req, res) => {
  try {
    const token = req.header('x-edit-token') || '';
    const result = await pool.query('SELECT edit_token FROM pages WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ valido: false });
    }
    res.json({ valido: token === result.rows[0].edit_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valido: false });
  }
});

// Buscar um vídeo específico de uma página (público, usado na página de assistir)
app.get('/api/pages/:slug/videos/:videoId', async (req, res) => {
  try {
    const pageResult = await pool.query('SELECT id FROM pages WHERE slug = $1', [req.params.slug]);
    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }
    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1 AND page_id = $2',
      [req.params.videoId, pageResult.rows[0].id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
});

// Adicionar vídeo a uma página (exige o token secreto de edição)
app.post(
  '/api/pages/:slug/videos',
  requireEditToken,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!title || !req.files || !req.files.thumbnail || !req.files.video) {
        return res.status(400).json({ error: 'Título, capa e vídeo são obrigatórios' });
      }

      const thumbnailPath = '/uploads/' + req.files.thumbnail[0].filename;
      const videoPath = '/uploads/' + req.files.video[0].filename;

      const result = await pool.query(
        `INSERT INTO videos (page_id, title, description, thumbnail_path, video_path)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.page.id, title, description || '', thumbnailPath, videoPath]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar vídeo' });
    }
  }
);

// Remover vídeo de uma página (exige o token secreto de edição)
app.delete('/api/pages/:slug/videos/:videoId', requireEditToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM videos WHERE id = $1 AND page_id = $2 RETURNING *',
      [req.params.videoId, req.page.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    [result.rows[0].thumbnail_path, result.rows[0].video_path].forEach((p) => {
      const fullPath = path.join(__dirname, p);
      fs.unlink(fullPath, () => {});
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover vídeo' });
  }
});

// Tratamento de erro do multer (arquivo grande demais, tipo inválido, etc.)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ---------- Start ----------
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao iniciar o banco de dados:', err);
    process.exit(1);
  });
