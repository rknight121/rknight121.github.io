// Clock functionality
function updateClock() {
    const now = new Date();
    const utcString = now.toUTCString();
    const timeStr = utcString.split(' ')[4] + ' UTC';
    document.getElementById('clock').textContent = timeStr;
}

setInterval(updateClock, 1000);
updateClock();
