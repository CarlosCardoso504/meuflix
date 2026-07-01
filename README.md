# MeuFlix 🎬

Plataforma onde **qualquer pessoa cria sua própria página** de vídeos estilo Netflix, com fotos, títulos e vídeos que ela mesma sobe (não é embed do YouTube).

## Como funciona

1. A pessoa acessa o site e clica em **"Criar minha página grátis"**
2. Dá um nome para a página (ex: "Para Você", "Nosso Amor")
3. O site gera automaticamente **dois links diferentes**:
   - 🔒 **Link secreto de edição** — só ela tem. Usado para adicionar ou remover vídeos a qualquer momento.
   - 🎁 **Link público** — para compartilhar com quem vai receber o presente. Esse link só permite assistir, não permite editar.
4. Cada página é completamente isolada das outras — ninguém consegue ver ou mexer na página de outra pessoa sem o link secreto dela.

Não existe senha nem cadastro/login: a segurança é feita através de um código secreto e praticamente impossível de adivinhar, embutido no link de edição.

---

## Stack

- Front-end: HTML, CSS e JavaScript puro
- Back-end: Node.js + Express (API REST)
- Banco de dados: PostgreSQL
- Upload de arquivos: Multer

---

## 1. Rodando localmente

```bash
npm install
cp .env.example .env
# edite o .env e cole sua DATABASE_URL
npm start
```

Acesse **http://localhost:3000**

---

## 2. Deploy gratuito (Render)

### Passo 1 — Subir o código no GitHub
Crie um repositório e suba todos os arquivos do projeto (com `package.json`, `server.js` e a pasta `public` direto na raiz do repositório).

### Passo 2 — Criar o banco (PostgreSQL) na Render
1. [render.com](https://render.com) → **New +** → **PostgreSQL**
2. Nome: `meuflix-db`, plano **Free**
3. Depois de criado, copie a **Internal Database URL**

### Passo 3 — Criar o Web Service
1. **New +** → **Web Service** → conecte seu repositório do GitHub
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → cole a Internal Database URL do passo 2
   - `DB_SSL` → `true`
5. Crie o serviço. Quando o deploy terminar, você recebe o link (ex: `https://meuflix.onrender.com`) — esse é o link inicial do site, onde qualquer pessoa pode clicar em "Criar minha página".

> ⚠️ No plano gratuito da Render, o disco de uploads é apagado quando o serviço reinicia. Para o trabalho isso normalmente não é problema, mas vídeos enviados há muito tempo sem uso do site podem ser perdidos num redeploy. Veja a seção de upgrade opcional no final.

---

## 3. Estrutura do projeto

```
meuflix/
├── server.js               # servidor Express e rotas da API
├── package.json
├── db/
│   ├── db.js                 # conexão com o PostgreSQL
│   └── init.sql               # criação das tabelas "pages" e "videos"
├── uploads/                    # imagens/vídeos enviados
└── public/
    ├── index.html                 # landing page ("Criar minha página")
    ├── criar.html                  # formulário de criação da página
    ├── pagina.html                  # galeria de vídeos (estilo Netflix)
    ├── adicionar.html                # formulário de adicionar vídeo (exige link secreto)
    ├── assistir.html                  # player de vídeo
    ├── css/style.css
    └── js/ (paginaComum.js, criar.js, pagina.js, adicionar.js, assistir.js)
```

## 4. Como a segurança funciona (para explicar no trabalho)

Cada página no banco de dados tem duas colunas importantes: `slug` (um código curto, público, que aparece no link compartilhável) e `edit_token` (um código bem mais longo e aleatório, que fica só no link secreto de edição). Toda ação de adicionar ou remover vídeo no back-end exige que o `edit_token` correto seja enviado num cabeçalho da requisição (`x-edit-token`); sem ele, a API responde com erro 401 (não autorizado). Isso é o que garante que só quem tem o link secreto consegue editar aquela página específica.

## 5. Upgrade opcional — armazenamento permanente de vídeo

Para os vídeos não sumirem após um reinício do servidor, é possível trocar o armazenamento local por um serviço de mídia na nuvem, como o **Cloudinary** (plano gratuito, 25GB), salvando no banco apenas a URL do arquivo.
