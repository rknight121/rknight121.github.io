// Navigation with keyboard support for TV remote
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    let isNavigating = false;

    navItems.forEach(item => {
        // Click handling
        item.addEventListener('click', function() {
            if (isNavigating) return;
            activateNavItem(this);
        });
        
        // Keyboard handling for TV remote
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateNavItem(this);
            }
        });
    });

    function activateNavItem(item) {
        isNavigating = true;
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        updateMainContent(item.id);
        
        // Reset navigation lock after content is loaded
        setTimeout(() => {
            isNavigating = false;
        }, 1200); // Slightly longer than content load animation
    }

    function updateMainContent(navId) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Clear previous content and show loading indicator
        mainContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        
        // Load content with shorter timeout for better responsiveness
        setTimeout(() => {
            try {
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
                    default:
                        loadWeatherContent();
                }
            } catch (error) {
                showErrorMessage(mainContent, 'Failed to load content. Please try again.');
                console.error('Error loading content:', error);
            }
        }, 500); // Reduced from 1000ms for better responsiveness
    }

    function showErrorMessage(container, message) {
        container.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
            <button class="nav-item" id="retry-button">Retry</button>
        `;
        
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                const activeNav = document.querySelector('.nav-item.active');
                if (activeNav) {
                    updateMainContent(activeNav.id);
                } else {
                    updateMainContent('nav-weather');
                }
            });
        }
    }

    // TV remote navigation support
    document.addEventListener('keydown', function(e) {
        if (isNavigating) return;
        
        const activeElement = document.activeElement;
        const isNavItem = activeElement && activeElement.classList.contains('nav-item');
        
        const navItems = Array.from(document.querySelectorAll('.nav-item'));
        const currentIndex = isNavItem ? navItems.indexOf(activeElement) : -1;
        
        let nextIndex;
        
        switch(e.key) {
            case 'ArrowUp':
                if (currentIndex > 0) {
                    nextIndex = currentIndex - 1;
                    navItems[nextIndex].focus();
                }
                break;
                
            case 'ArrowDown':
                if (currentIndex < navItems.length - 1 && currentIndex !== -1) {
                    nextIndex = currentIndex + 1;
                    navItems[nextIndex].focus();
                } else if (currentIndex === -1) {
                    // If nothing is focused, focus the first item
                    navItems[0].focus();
                }
                break;
                
            case 'ArrowLeft':
                // If main content is focused, move focus to sidebar
                if (!isNavItem) {
                    // Focus the active nav item or the first one
                    const activeNav = document.querySelector('.nav-item.active');
                    if (activeNav) {
                        activeNav.focus();
                    } else if (navItems.length > 0) {
                        navItems[0].focus();
                    }
                }
                break;
                
            case 'Backspace':
            case 'Back':
                // Handle back button for TV remotes
                if (!isNavItem) {
                    const activeNav = document.querySelector('.nav-item.active');
                    if (activeNav) {
                        activeNav.focus();
                    }
                }
                break;
                
            case 'Home':
                // Home button support
                if (navItems.length > 0) {
                    activateNavItem(navItems[0]);
                    navItems[0].focus();
                }
                break;
        }
    });

    // Start with weather content and focus on first nav item for TV navigation
    if (navItems.length > 0) {
        navItems[0].focus();
    }
});
