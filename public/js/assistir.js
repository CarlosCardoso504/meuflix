async function iniciar() {
  const area = document.getElementById('watch-area');
  const slug = getSlugDaUrl();
  const videoId = new URLSearchParams(window.location.search).get('v');

  if (!slug || !videoId) {
    area.innerHTML = '<p>Vídeo não especificado.</p>';
    return;
  }

  const token = getTokenSalvo(slug);
  const modoEdicao = false; // verificado abaixo, se necessário

  try {
    const res = await fetch(`/api/pages/${slug}/videos/${videoId}`);
    if (!res.ok) throw new Error();
    const v = await res.json();

    let podeEditar = false;
    if (token) {
      try {
        const verifRes = await fetch(`/api/pages/${slug}/verificar`, {
          method: 'POST',
          headers: { 'x-edit-token': token }
        });
        const verifData = await verifRes.json();
        podeEditar = !!verifData.valido;
      } catch (e) { /* ignora */ }
    }

    area.innerHTML = `
      <a href="pagina.html?slug=${slug}" class="back-link">&larr; Voltar para a página</a>
      <video class="video-player" src="${v.video_path}" controls autoplay></video>
      <div class="watch-info">
        <h1>${escapeHtml(v.title)}</h1>
        <p>${escapeHtml(v.description || 'Sem descrição.')}</p>
        ${podeEditar ? '<button class="btn btn-secondary" id="btn-remover" style="margin-top:18px;">🗑 Remover este vídeo</button>' : ''}
      </div>
    `;

    if (podeEditar) {
      document.getElementById('btn-remover').addEventListener('click', async () => {
        if (!confirm('Remover este vídeo? Essa ação não pode ser desfeita.')) return;
        const delRes = await fetch(`/api/pages/${slug}/videos/${videoId}`, {
          method: 'DELETE',
          headers: { 'x-edit-token': token }
        });
        if (delRes.ok) {
          window.location.href = `pagina.html?slug=${slug}`;
        } else {
          alert('Não foi possível remover o vídeo.');
        }
      });
    }

  } catch (err) {
    area.innerHTML = `
      <a href="pagina.html?slug=${slug}" class="back-link">&larr; Voltar</a>
      <p>Não foi possível carregar este vídeo.</p>
    `;
  }
}

iniciar();
