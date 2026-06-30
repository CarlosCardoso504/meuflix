require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// ---------- Inicialização do banco ----------
async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'db', 'init.sql'), 'utf8');
  await pool.query(sql);
  console.log('[OK] Tabela "videos" verificada/criada com sucesso.');
}

// ---------- Rotas da API ----------

// Health check (útil para monitoramento do provedor de nuvem)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Listar todos os vídeos
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

// Buscar um vídeo específico
app.get('/api/videos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
});

// Cadastrar novo vídeo (título + descrição + capa + arquivo de vídeo)
app.post(
  '/api/videos',
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
        `INSERT INTO videos (title, description, thumbnail_path, video_path)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, description || '', thumbnailPath, videoPath]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar vídeo' });
    }
  }
);

// Remover vídeo
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    // remove os arquivos físicos do disco
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
