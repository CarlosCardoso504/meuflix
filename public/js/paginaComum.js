// Lê o slug (identificador da página) e a chave secreta (se presente na URL) e
// guarda a chave no localStorage, associada a esse slug específico, para que
// a pessoa não precise carregar o link com a chave toda vez.

function getSlugDaUrl() {
  return new URLSearchParams(window.location.search).get('slug');
}

function getTokenSalvo(slug) {
  return localStorage.getItem('meuflix_token_' + slug) || '';
}

function salvarTokenDaUrlSeExistir(slug) {
  const params = new URLSearchParams(window.location.search);
  const chave = params.get('chave');
  if (chave) {
    localStorage.setItem('meuflix_token_' + slug, chave);
    // Limpa a chave da barra de endereço por segurança/estética, mantendo o slug
    params.delete('chave');
    const novaUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', novaUrl);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
