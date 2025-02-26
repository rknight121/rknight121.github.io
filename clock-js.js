// Clock functionality
function updateClock() {
    try {
        const now = new Date();
        const utcString = now.toUTCString();
        const timeStr = utcString.split(' ')[4] + ' UTC';
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            clockElement.textContent = timeStr;
        }
    } catch (error) {
        console.error('Error updating clock:', error);
    }
}

// Start clock when page loads
document.addEventListener('DOMContentLoaded', function() {
    try {
        setInterval(updateClock, 1000);
        updateClock(); // Initial update
    } catch (error) {
        console.error('Error initializing clock:', error);
    }
});
