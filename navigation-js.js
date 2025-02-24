// Navigation with keyboard support for TV remote
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        updateMainContent(this.id);
    });
    
    item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            updateMainContent(this.id);
        }
    });
});

function updateMainContent(navId) {
    const mainContent = document.getElementById('main-content');
    
    // Clear previous content
    mainContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // Simulate loading content (replace with actual API calls)
    setTimeout(() => {
        switch(navId) {
            case 'nav-weather':
                loadWeatherContent();
                break;
            case 'nav-notams':
                loadNotamContent();
                break;
            case 'nav-radar':
                loadRadarContent();
                break;
            case 'nav-metar':
                loadMetarContent();
                break;
            case 'nav-settings':
                loadSettingsContent();
                break;
        }
    }, 1000);
}

// TV remote navigation support
document.addEventListener('keydown', function(e) {
    const activeElement = document.activeElement;
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const currentIndex = navItems.indexOf(activeElement);
    
    if (currentIndex !== -1) {
        let nextIndex;
        
        switch(e.key) {
            case 'ArrowUp':
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
                nextIndex = Math.min(navItems.length - 1, currentIndex + 1);
                break;
            default:
                return;
        }
        
        navItems[nextIndex].focus();
    } else if (e.key === 'ArrowLeft') {
        // If not focused on a nav item and pressing left, focus on first nav item
        navItems[0].focus();
    }
});
