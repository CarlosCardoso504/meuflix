let modoEdicao = false;
let slugAtual = null;
let tokenAtual = null;

async function iniciar() {
  const heroArea = document.getElementById('hero-area');
  const row = document.getElementById('video-row');
  const navLinks = document.getElementById('nav-links');
  const sharePanel = document.getElementById('share-panel');

  slugAtual = getSlugDaUrl();

  if (!slugAtual) {
    heroArea.innerHTML = `
      <div class="hero-empty">
        <h1>Página não encontrada</h1>
        <p>O link parece estar incompleto. Confira se você copiou o endereço certinho.</p>
      </div>
    `;
    return;
  }

  salvarTokenDaUrlSeExistir(slugAtual);
  tokenAtual = getTokenSalvo(slugAtual);

  // Busca dados públicos da página
  let pagina;
  try {
    const res = await fetch(`/api/pages/${slugAtual}`);
    if (!res.ok) throw new Error();
    pagina = await res.json();
  } catch (err) {
    heroArea.innerHTML = `
      <div class="hero-empty">
        <h1>Esta página não existe (mais)</h1>
        <p>Verifique se o link está correto.</p>
      </div>
    `;
    return;
  }

  document.title = pagina.title + ' - MeuFlix';

  // Confirma se o token salvo realmente é válido para esta página
  if (tokenAtual) {
    try {
      const res = await fetch(`/api/pages/${slugAtual}/verificar`, {
        method: 'POST',
        headers: { 'x-edit-token': tokenAtual }
      });
      const data = await res.json();
      modoEdicao = !!data.valido;
    } catch (err) {
      modoEdicao = false;
    }
  }

  if (modoEdicao) {
    navLinks.innerHTML = `<li><a href="adicionar.html?slug=${slugAtual}" class="btn-add">+ Adicionar vídeo</a></li>`;

    const linkPublico = `${window.location.origin}/pagina.html?slug=${slugAtual}`;
    sharePanel.innerHTML = `
      <div class="link-box">
        <h3>🎁 Link para compartilhar com quem vai ganhar o presente</h3>
        <div class="link-copy">
          <input type="text" readonly value="${linkPublico}" id="link-publico">
          <button type="button" id="btn-copiar-link">Copiar</button>
        </div>
      </div>
    `;
    document.getElementById('btn-copiar-link').addEventListener('click', (e) => {
      const input = document.getElementById('link-publico');
      input.select();
      navigator.clipboard.writeText(input.value);
      e.target.textContent = 'Copiado!';
      setTimeout(() => { e.target.textContent = 'Copiar'; }, 1500);
    });
  }

  renderizar(pagina);
}

function renderizar(pagina) {
  const heroArea = document.getElementById('hero-area');
  const row = document.getElementById('video-row');
  const gridTitle = document.getElementById('grid-title');

  gridTitle.textContent = pagina.title;

  if (!pagina.videos.length) {
    heroArea.innerHTML = `
      <div class="hero-empty">
        <h1>${escapeHtml(pagina.title)}</h1>
        <p>${modoEdicao ? 'Nenhum vídeo por aqui ainda. Clique em "+ Adicionar vídeo" no menu para começar!' : 'Essa página ainda não tem vídeos.'}</p>
        ${modoEdicao ? `<a href="adicionar.html?slug=${slugAtual}" class="btn btn-primary">+ Adicionar vídeo</a>` : ''}
      </div>
    `;
    row.innerHTML = '';
    return;
  }

  const destaque = pagina.videos[0];
  heroArea.innerHTML = `
    <section class="hero" style="background-image: url('${destaque.thumbnail_path}')">
      <div class="hero-content">
        <h1 class="hero-title">${escapeHtml(destaque.title)}</h1>
        <p class="hero-desc">${escapeHtml(destaque.description || '')}</p>
        <div class="hero-buttons">
          <a href="assistir.html?slug=${slugAtual}&v=${destaque.id}" class="btn btn-primary">▶ Assistir</a>
        </div>
      </div>
    </section>
  `;

  row.innerHTML = pagina.videos.map(v => `
    <div class="card">
      <a href="assistir.html?slug=${slugAtual}&v=${v.id}">
        <img src="${v.thumbnail_path}" alt="${escapeHtml(v.title)}" loading="lazy">
        <div class="card-overlay"><span>${escapeHtml(v.title)}</span></div>
      </a>
      ${modoEdicao ? `<button class="btn-remove" data-id="${v.id}" title="Remover vídeo">🗑</button>` : ''}
    </div>
  `).join('');

  if (modoEdicao) {
    row.querySelectorAll('.btn-remove').forEach(botao => {
      botao.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Remover este vídeo? Essa ação não pode ser desfeita.')) return;

        const res = await fetch(`/api/pages/${slugAtual}/videos/${botao.dataset.id}`, {
          method: 'DELETE',
          headers: { 'x-edit-token': tokenAtual }
        });

        if (res.ok) {
          iniciar();
        } else {
          alert('Não foi possível remover o vídeo.');
        }
      });
    });
  }
}

iniciar();
