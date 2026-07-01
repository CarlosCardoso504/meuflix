const form = document.getElementById('form-criar');
const btn = document.getElementById('submit-btn');
const statusMsg = document.getElementById('status-msg');
const area = document.getElementById('criar-area');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  statusMsg.className = 'status-msg';
  btn.disabled = true;
  btn.textContent = 'Criando...';

  const title = document.getElementById('title').value.trim();

  try {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar página');

    // Guarda o token de edição localmente, associado a este slug
    localStorage.setItem('meuflix_token_' + data.slug, data.editToken);

    const origin = window.location.origin;
    const linkPublico = `${origin}/pagina.html?slug=${data.slug}`;
    const linkEdicao = `${origin}/pagina.html?slug=${data.slug}&chave=${data.editToken}`;

    area.innerHTML = `
      <h1>Sua página foi criada! 🎉</h1>
      <p class="subtitle">Guarde esses dois links. Eles não aparecerão de novo depois que você sair desta tela.</p>

      <div class="link-box">
        <h3>🔒 Seu link secreto (só você deve ter)</h3>
        <p class="form-hint">Use este link sempre que quiser voltar para adicionar ou remover vídeos.</p>
        <div class="link-copy">
          <input type="text" readonly value="${linkEdicao}" id="link-edicao">
          <button type="button" onclick="copiarLink('link-edicao')">Copiar</button>
        </div>
      </div>

      <div class="link-box">
        <h3>🎁 Link para compartilhar</h3>
        <p class="form-hint">Envie este link para a pessoa que vai receber o presente. Ela só poderá assistir.</p>
        <div class="link-copy">
          <input type="text" readonly value="${linkPublico}" id="link-publico">
          <button type="button" onclick="copiarLink('link-publico')">Copiar</button>
        </div>
      </div>

      <a href="${linkEdicao}" class="btn btn-primary" style="margin-top: 20px; display:inline-block;">Ir para minha página e adicionar vídeos</a>
    `;

  } catch (err) {
    statusMsg.className = 'status-msg error';
    statusMsg.textContent = err.message;
    btn.disabled = false;
    btn.textContent = 'Criar página';
  }
});

function copiarLink(id) {
  const input = document.getElementById(id);
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value);
  event.target.textContent = 'Copiado!';
  setTimeout(() => { event.target.textContent = 'Copiar'; }, 1500);
}
