// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Flight Planning Dashboard initialized');
        
        // Load saved settings if available
        loadSavedSettings();
        
        // Initially load weather content when the app starts
        loadWeatherContent();
        
        // Add error handling for any unhandled errors
        window.addEventListener('error', function(e) {
            console.error('Global error:', e.error);
            showErrorMessage('An unexpected error occurred. Please try refreshing the page.');
            return false;
        });
    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorMessage('Failed to initialize the application. Please try refreshing the page.');
    }
    
    function loadSavedSettings() {
        // In a real app, you would load from localStorage here
        // For example:
        // try {
        //     const savedSettings = localStorage.getItem('settings');
        //     if (savedSettings) {
        //         const settings = JSON.parse(savedSettings);
        //         console.log('Loaded settings:', settings);
        //     }
        // } catch (error) {
        //     console.error('Error loading settings:', error);
        // }
    }
    
    function showErrorMessage(message) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
                <button class="nav-item" onclick="window.location.reload()">Reload Page</button>
            `;
        }
    }
});

// Add offline detection for better user experience
window.addEventListener('offline', function() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-message">
                <h3>Connection Lost</h3>
                <p>You are currently offline. Some features may not work properly until your connection is restored.</p>
            </div>
        `;
    }
});

// Add online detection to restore functionality
window.addEventListener('online', function() {
    alert('Connection restored! Reloading latest data...');
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
        // Trigger click on the active navigation item to reload content
        activeNav.click();
    } else {
        // Default to weather if no active nav
        loadWeatherContent();
    }
});