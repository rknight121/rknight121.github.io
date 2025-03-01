// Define switchTafTab as a global function
window.switchTafTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.taf-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.taf-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    document.getElementById(tabName + '-tab-btn').classList.add('active');
};