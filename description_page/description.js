// JavaScript - Description page
document.addEventListener('DOMContentLoaded', function() {
   // Reference to the start simulation button
   const startSimulationBtn = document.getElementById('start-simulation-btn');
   
   // Add click event to the button
   if (startSimulationBtn) {
       startSimulationBtn.addEventListener('click', function() {
           console.log('Navigation button clicked!');
           
           // Use Electron API for navigation
           if (window.electronAPI) {
               console.log('Using Electron API for navigation');
               window.electronAPI.navigateTo('box_selection/index.html');
           } else {
               console.log('Electron API not found, using standard navigation');
               // Navigation to box selection page using absolute path
               const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
               const parentUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
               const newUrl = parentUrl + '/box_selection/index.html';
               console.log('Navigating to:', newUrl);
               window.location.href = newUrl;
           }
       });
   } else {
       console.error('start-simulation-btn button not found!');
   }
   
   console.log('Description page initialized successfully');
});