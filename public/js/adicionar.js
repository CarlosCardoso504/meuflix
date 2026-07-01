const formArea = document.getElementById('form-area');
let slug = null;
let token = null;

async function iniciar() {
  slug = getSlugDaUrl();

  if (!slug) {
    formArea.innerHTML = '<h1>Link inválido</h1><p>Não foi possível identificar a página.</p>';
    return;
  }

  salvarTokenDaUrlSeExistir(slug);
  token = getTokenSalvo(slug);

  if (!token) {
    formArea.innerHTML = `
      <h1>Você não tem permissão para editar esta página</h1>
      <p class="subtitle">Cole abaixo o seu link secreto de edição (o que você recebeu ao criar a página) para continuar.</p>
      <div class="form-group">
        <input type="text" id="token-manual" placeholder="Cole aqui seu link ou chave secreta">
      </div>
      <button class="submit-btn" id="btn-confirmar-token">Confirmar</button>
    `;
    document.getElementById('btn-confirmar-token').addEventListener('click', () => {
      const valor = document.getElementById('token-manual').value.trim();
      // aceita tanto a chave sozinha quanto o link completo colado
      const match = valor.match(/chave=([a-f0-9]+)/);
      const chaveExtraida = match ? match[1] : valor;
      if (chaveExtraida) {
        localStorage.setItem('meuflix_token_' + slug, chaveExtraida);
        iniciar();
      }
    });
    return;
  }

  // valida o token com o servidor antes de mostrar o formulário
  try {
    const res = await fetch(`/api/pages/${slug}/verificar`, {
      method: 'POST',
      headers: { 'x-edit-token': token }
    });
    const data = await res.json();
    if (!data.valido) throw new Error('inválido');
  } catch (err) {
    localStorage.removeItem('meuflix_token_' + slug);
    formArea.innerHTML = '<h1>Link secreto inválido</h1><p>Verifique se você colou o link certo.</p>';
    return;
  }

  mostrarFormulario();
}

function mostrarFormulario() {
  formArea.innerHTML = `
    <h1>Adicionar novo vídeo</h1>
    <p class="subtitle">Suba seu próprio vídeo, com capa e título.</p>

    <form id="form-video">
      <div class="form-group">
        <label for="title">Título</label>
        <input type="text" id="title" name="title" required maxlength="200" placeholder="Ex: Nossa viagem à praia">
      </div>

      <div class="form-group">
        <label for="description">Descrição</label>
        <textarea id="description" name="description" placeholder="Conte um pouco sobre esse vídeo..."></textarea>
      </div>

      <div class="form-group">
        <label for="thumbnail">Capa (imagem)</label>
        <input type="file" id="thumbnail" name="thumbnail" accept="image/png, image/jpeg, image/webp" required>
        <p class="form-hint">Formatos aceitos: PNG, JPG, WEBP.</p>
      </div>

      <div class="form-group">
        <label for="video">Arquivo de vídeo</label>
        <input type="file" id="video" name="video" accept="video/mp4, video/webm, video/quicktime" required>
        <p class="form-hint">Formatos aceitos: MP4, WEBM, MOV. Tamanho máximo: 300MB.</p>
      </div>

      <button type="submit" class="submit-btn" id="submit-btn">Publicar vídeo</button>
      <div class="status-msg" id="status-msg"></div>
    </form>

    <a href="pagina.html?slug=${slug}" class="back-link" style="display:block; margin-top:16px;">&larr; Voltar para a página</a>
  `;

  const form = document.getElementById('form-video');
  const btn = document.getElementById('submit-btn');
  const statusMsg = document.getElementById('status-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusMsg.className = 'status-msg';
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/pages/${slug}/videos`, {
        method: 'POST',
        headers: { 'x-edit-token': token },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao publicar vídeo');

      statusMsg.className = 'status-msg success';
      statusMsg.textContent = 'Vídeo publicado com sucesso! Redirecionando...';

      setTimeout(() => {
        window.location.href = `pagina.html?slug=${slug}`;
      }, 1200);

    } catch (err) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Publicar vídeo';
    }
  });
}

iniciar();
