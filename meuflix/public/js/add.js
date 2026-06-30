const form = document.getElementById('form-video');
const btn = document.getElementById('submit-btn');
const statusMsg = document.getElementById('status-msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  statusMsg.className = 'status-msg';
  statusMsg.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const formData = new FormData(form);

  try {
    const res = await fetch('/api/videos', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao publicar vídeo');
    }

    statusMsg.className = 'status-msg success';
    statusMsg.textContent = 'Vídeo publicado com sucesso! Redirecionando...';

    setTimeout(() => {
      window.location.href = `watch.html?id=${data.id}`;
    }, 1200);

  } catch (err) {
    statusMsg.className = 'status-msg error';
    statusMsg.textContent = err.message;
    btn.disabled = false;
    btn.textContent = 'Publicar vídeo';
  }
});
