async function carregarVideos() {
  const heroArea = document.getElementById('hero-area');
  const row = document.getElementById('video-row');

  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();

    if (!videos.length) {
      heroArea.innerHTML = `
        <div class="hero-empty">
          <h1>Nenhum vídeo por aqui ainda</h1>
          <p>Seja o primeiro a publicar! Clique em "Adicionar vídeo" no menu acima e suba seu título, capa e vídeo.</p>
          <a href="add.html" class="btn btn-primary">+ Adicionar vídeo</a>
        </div>
      `;
      row.innerHTML = '';
      return;
    }

    // Hero = vídeo mais recente
    const destaque = videos[0];
    heroArea.innerHTML = `
      <section class="hero" style="background-image: url('${destaque.thumbnail_path}')">
        <div class="hero-content">
          <h1 class="hero-title">${escapeHtml(destaque.title)}</h1>
          <p class="hero-desc">${escapeHtml(destaque.description || '')}</p>
          <div class="hero-buttons">
            <a href="watch.html?id=${destaque.id}" class="btn btn-primary">▶ Assistir</a>
            <a href="add.html" class="btn btn-secondary">+ Adicionar vídeo</a>
          </div>
        </div>
      </section>
    `;

    // Grade com todos os vídeos
    row.innerHTML = videos.map(v => `
      <a class="card" href="watch.html?id=${v.id}">
        <img src="${v.thumbnail_path}" alt="${escapeHtml(v.title)}" loading="lazy">
        <div class="card-overlay"><span>${escapeHtml(v.title)}</span></div>
      </a>
    `).join('');

  } catch (err) {
    console.error(err);
    heroArea.innerHTML = `
      <div class="hero-empty">
        <h1>Não foi possível carregar os vídeos</h1>
        <p>Verifique se o servidor e o banco de dados estão rodando corretamente.</p>
      </div>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

carregarVideos();
