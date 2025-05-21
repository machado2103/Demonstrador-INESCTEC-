// renderer.js - Version until the description page
document.addEventListener('DOMContentLoaded', function() {
  // Obter referência ao botão de start
  var startButton = document.getElementById('start-app');
  
  // Adicionar evento de clique se o botão existir
  if (startButton) {
    startButton.addEventListener('click', function() {
      // Redirection to the simulation page
      window.location.href = 'description_page/index.html';
    });
  }
  
  console.log('App initialized succesfully!');
});