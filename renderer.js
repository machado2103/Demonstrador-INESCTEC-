// renderer.js - Version until the description page
document.addEventListener('DOMContentLoaded', function() {
  // Obtains Start Button reference
  var startButton = document.getElementById('start-app');
  
  // Adds click button reference
  if (startButton) {
    startButton.addEventListener('click', function() {
      // Redirection to the simulation page
      window.location.href = './description_page/index.html';
    });
  }
  
  console.log('App initialized succesfully!');
});