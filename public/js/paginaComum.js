// Lê o slug (identificador da página) e a chave secreta diretamente da URL atual.
// Nada é guardado no navegador: a edição só fica liberada enquanto o link
// completo (com a chave) estiver na barra de endereço. Isso evita que o modo
// de edição "vaze" para o link público, mesmo se aberto no mesmo navegador
// que criou a página.

function getSlugDaUrl() {
  return new URLSearchParams(window.location.search).get('slug');
}

function getChaveDaUrl() {
  return new URLSearchParams(window.location.search).get('chave') || '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
