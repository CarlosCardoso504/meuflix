# MeuFlix 🎬

Plataforma de streaming de **vídeos próprios** (não é YouTube embutido — o usuário sobe o arquivo de vídeo dele mesmo), com visual estilo Netflix. Projeto feito para simular a infraestrutura de tecnologia de uma startup/empresa.

- Front-end: HTML, CSS e JavaScript puro
- Back-end: Node.js + Express (API REST)
- Banco de dados: PostgreSQL
- Upload de arquivos: Multer

---

## 1. Rodando localmente (para testar antes do deploy)

Pré-requisitos: [Node.js 18+](https://nodejs.org) instalado e um banco PostgreSQL (pode ser local ou já na nuvem, ver passo 2).

```bash
# dentro da pasta do projeto
npm install
cp .env.example .env
# edite o .env e cole sua DATABASE_URL
npm start
```

Acesse **http://localhost:3000**

---

## 2. Colocando o site no ar de verdade (deploy gratuito)

A stack abaixo é 100% gratuita e é a que está descrita na página "Sobre" do site. Leva uns 15-20 minutos.

### Passo 1 — Subir o código no GitHub
1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Crie um repositório novo (ex: `meuflix`) e suba a pasta inteira deste projeto para ele.

### Passo 2 — Criar o banco de dados (PostgreSQL) na Render
1. Crie uma conta em [render.com](https://render.com) (dá para entrar com GitHub).
2. No painel, clique em **New +** → **PostgreSQL**.
3. Dê um nome (ex: `meuflix-db`), escolha a região mais próxima e o plano **Free**.
4. Após criar, copie o campo **Internal Database URL** (ou **External Database URL** se for testar localmente) — você vai usar isso na variável `DATABASE_URL`.

### Passo 3 — Criar o Web Service (o servidor da aplicação)
1. No painel da Render, clique em **New +** → **Web Service**.
2. Conecte o repositório do GitHub que você criou no passo 1.
3. Configure:
   - **Name**: `meuflix`
   - **Region**: a mesma do banco de dados
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → cole a Internal Database URL copiada no passo 2
   - `DB_SSL` → `true`
5. Clique em **Create Web Service**. A Render vai instalar as dependências e ligar o servidor automaticamente.
6. Quando o deploy terminar, a Render te dá um link tipo `https://meuflix.onrender.com` — **esse é o link que você vai entregar no trabalho**.

> ⚠️ No plano gratuito da Render, o disco onde ficam os vídeos enviados (`/uploads`) é apagado quando o serviço reinicia ou faz um novo deploy. Para o trabalho da faculdade isso normalmente não é problema (você sobe os vídeos de demonstração e já entrega o link). Se quiser armazenamento permanente, veja a seção "Upgrade opcional" abaixo.

### Passo 4 (opcional, mas recomendado para o item "Firewall" e "DNS" do trabalho) — Cloudflare
1. Crie uma conta gratuita em [cloudflare.com](https://cloudflare.com).
2. Se você tiver um domínio próprio, aponte o DNS dele para a Cloudflare e crie um registro `CNAME` apontando para `meuflix.onrender.com`.
3. Ative o modo de proxy (ícone de nuvem laranja) — isso liga automaticamente o **firewall/WAF e a proteção contra DDoS** da Cloudflare na frente do seu site.
4. Caso não tenha domínio próprio, não tem problema: o link `onrender.com` já funciona e já passa pela proteção de borda da própria Render. Nesse caso, no relatório, explique que o "firewall" usado foi o da própria Render (isolamento de rede do container) e a opção Cloudflare fica como evolução futura.

---

## 3. Estrutura do projeto

```
meuflix/
├── server.js          # servidor Express e rotas da API
├── package.json
├── .env.example
├── db/
│   ├── db.js           # conexão com o PostgreSQL
│   └── init.sql        # criação da tabela "videos"
├── uploads/             # onde ficam as imagens/vídeos enviados
└── public/
    ├── index.html        # página inicial (estilo Netflix)
    ├── add.html           # formulário para subir um novo vídeo
    ├── watch.html          # página de reprodução do vídeo
    ├── sobre.html           # equipe, tecnologias e infraestrutura
    ├── css/style.css
    └── js/ (main.js, add.js, watch.js)
```

## 4. Antes de entregar, não esqueça de:

1. Editar `public/sobre.html` e preencher o nome da equipe e dos integrantes (procure por `[PREENCHER]`).
2. Subir pelo menos 1 ou 2 vídeos de teste pelo formulário "Adicionar vídeo" no site já no ar, para a tela não ficar vazia.
3. Conferir se o link `https://seu-app.onrender.com` abre normalmente (a primeira vez pode demorar ~30s para "acordar", pois o plano free hiberna o serviço quando ele fica sem uso).
4. Entregar o link do site funcionando, como pedido no enunciado.

## 5. Upgrade opcional — armazenamento permanente de vídeo

Se quiser que os vídeos não somem após um reinício do servidor, é possível trocar o armazenamento local por um serviço de mídia na nuvem, como o **Cloudinary** (plano gratuito, 25GB), e salvar no banco apenas a URL do arquivo em vez do caminho local. Isso não é obrigatório para o trabalho, mas é uma boa evolução para citar na apresentação.
