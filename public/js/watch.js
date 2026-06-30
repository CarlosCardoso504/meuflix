function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function carregarVideo() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const area = document.getElementById('watch-area');

  if (!id) {
    area.innerHTML += '<p>Vídeo não especificado.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/videos/${id}`);
    if (!res.ok) throw new Error('Vídeo não encontrado');
    const v = await res.json();

    area.innerHTML = `
      <a href="index.html" class="back-link">&larr; Voltar para o início</a>
      <video class="video-player" src="${v.video_path}" controls autoplay></video>
      <div class="watch-info">
        <h1>${escapeHtml(v.title)}</h1>
        <p>${escapeHtml(v.description || 'Sem descrição.')}</p>
      </div>
    `;
  } catch (err) {
    area.innerHTML = `
      <a href="index.html" class="back-link">&larr; Voltar para o início</a>
      <p>Não foi possível carregar este vídeo.</p>
    `;
  }
}

carregarVideo();
