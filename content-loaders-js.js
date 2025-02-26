// Functions for loading different content sections
// In a real application, these would make API calls to fetch actual data

// Utility function to get formatted UTC time
function getCurrentUTCTime() {
    return new Date().toUTCString().split(' ')[4] + ' UTC';
}

// Error handling wrapper for content loaders
function safelyLoadContent(contentFunction) {
    try {
        return contentFunction();
    } catch (error) {
        console.error('Error loading content:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Content</h3>
                    <p>There was a problem loading the requested information. Please try again.</p>
                </div>
                <button class="nav-item" onclick="window.location.reload()">Reload Page</button>
            `;
        }
    }
}

function loadWeatherContent() {
    safelyLoadContent(() => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Current Conditions</h2>
                    <span id="weather-timestamp">Last updated: ${getCurrentUTCTime()}</span>
                </div>
                <div id="current-conditions">
                    <h3>KJFK - John F Kennedy Intl</h3>
                    <p>Wind: 270° at 15kt</p>
                    <p>Visibility: 10SM</p>
                    <p>Ceiling: FEW038 SCT120</p>
                    <p>Temperature: 24°C / Dew Point: 18°C</p>
                    <p>Altimeter: 29.92 inHg</p>
                    <p>Remarks: AO2 SLP132 T02390183</p>
                </div>
            </div>
            
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>3-Hour Forecast</h2>
                </div>
                <div class="forecast-grid" id="forecast-container">
                    <div class="forecast-item">
                        <h3>15:00 UTC</h3>
                        <p>Wind: 270° at 15kt</p>
                        <p>Visibility: 10SM</p>
                        <p>Ceiling: FEW038 SCT120</p>
                        <p>Temperature: 24°C</p>
                    </div>
                    <div class="forecast-item">
                        <h3>18:00 UTC</h3>
                        <p>Wind: 280° at 18kt</p>
                        <p>Visibility: 8SM</p>
                        <p>Ceiling: SCT035 BKN150</p>
                        <p>Temperature: 22°C</p>
                    </div>
                    <div class="forecast-item">
                        <h3>21:00 UTC</h3>
                        <p>Wind: 290° at 20kt</p>
                        <p>Visibility: 5SM</p>
                        <p>Ceiling: BKN030 OVC100</p>
                        <p>Temperature: 20°C</p>
                    </div>
                </div>
            </div>
            
            <div class="map-widget">
                <div class="widget-header">
                    <h2>National Radar</h2>
                </div>
                <div class="map-container" id="radar-map">
                    <img src="/api/placeholder/800/500" alt="National Weather Radar Map" style="width:100%; height:100%; object-fit:cover;">
                </div>
            </div>
        `;
    });
}

function loadNotamContent() {
    safelyLoadContent(() => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="notam-widget">
                <div class="widget-header">
                    <h2>NOTAMs</h2>
                    <span>Last updated: ${getCurrentUTCTime()}</span>
                </div>
                <div>
                    <h3>KJFK - John F Kennedy Intl</h3>
                    <p><strong>!KJFK 02/001</strong> JFK RWY 13L/31R CLSD WEF 2402171300-2403032359</p>
                    <p><strong>!KJFK 02/002</strong> JFK NAV ILS RWY 04R LOC/GS U/S WEF 2402180900-2402181700</p>
                    <p><strong>!KJFK 02/003</strong> JFK OBST TOWER LGT (ASR 1234567) 404213N 0735910W (5.2NM SE JFK) 1234.8FT (123.8FT AGL) U/S WEF 2402190000-2403010000</p>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3>KLGA - LaGuardia</h3>
                    <p><strong>!KLGA 02/004</strong> LGA TWY B BTN TWY A AND TWY C CLSD WEF 2402171300-2402192359</p>
                    <p><strong>!KLGA 02/005</strong> LGA AIRSPACE UAS WI AN AREA DEFINED AS 1NM RADIUS OF 404530N 0735751W (2.0NM SE LGA) SFC-400FT WEF 2402180900-2402181600</p>
                </div>
            </div>
        `;
    });
}

function loadRadarContent() {
    safelyLoadContent(() => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="map-widget" style="height: calc(100vh - 140px);">
                <div class="widget-header">
                    <h2>Interactive Radar</h2>
                    <div>
                        <button id="btn-zoom-in" class="nav-item" style="display:inline-block; padding:8px 15px; margin-right:10px;" tabindex="0">Zoom In</button>
                        <button id="btn-zoom-out" class="nav-item" style="display:inline-block; padding:8px 15px;" tabindex="0">Zoom Out</button>
                    </div>
                </div>
                <div class="map-container" id="interactive-radar-map" style="height: calc(100% - 60px);">
                    <img src="/api/placeholder/1200/800" alt="Interactive Weather Radar Map" style="width:100%; height:100%; object-fit:cover;">
                </div>
            </div>
        `;
        
        // Add event listeners for the zoom buttons
        const zoomInBtn = document.getElementById('btn-zoom-in');
        const zoomOutBtn = document.getElementById('btn-zoom-out');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                alert('Zooming in functionality would be implemented here');
            });
            
            zoomInBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alert('Zooming in functionality would be implemented here');
                }
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                alert('Zooming out functionality would be implemented here');
            });
            
            zoomOutBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alert('Zooming out functionality would be implemented here');
                }
            });
        }
    });
}

function loadMetarContent() {
    safelyLoadContent(() => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>METAR/TAF Reports</h2>
                    <div>
                        <input type="text" placeholder="Enter airport code" style="padding:12px; margin-right:10px; font-size: 18px; width: 200px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                        <button class="nav-item" style="display:inline-block; padding:12px 20px;" tabindex="0">Search</button>
                    </div>
                </div>
                <div style="margin-top:20px;">
                    <h3>KJFK - John F Kennedy Intl</h3>
                    <div style="background:#112240; padding:20px; border-radius:8px; margin-bottom:20px;">
                        <h4>METAR</h4>
                        <p style="font-family:monospace; font-size: 20px;">KJFK 171753Z 27015KT 10SM FEW038 SCT120 24/18 A2992 RMK AO2 SLP132 T02390183</p>
                    </div>
                    <div style="background:#112240; padding:20px; border-radius:8px;">
                        <h4>TAF</h4>
                        <p style="font-family:monospace; font-size: 20px;">KJFK 171720Z 1718/1824 27015KT 10SM FEW038 SCT120 <br>
                        FM172100 29020KT 5SM HZ BKN030 OVC100 <br>
                        FM180300 31015KT 6SM HZ SCT035 BKN100 <br>
                        FM180900 32012KT P6SM SCT040 BKN150</p>
                    </div>
                </div>
                
                <div style="margin-top:30px;">
                    <h3>KLGA - LaGuardia</h3>
                    <div style="background:#112240; padding:20px; border-radius:8px; margin-bottom:20px;">
                        <h4>METAR</h4>
                        <p style="font-family:monospace; font-size: 20px;">KLGA 171753Z 26012KT 8SM FEW035 SCT150 23/17 A2991 RMK AO2 SLP130 T02330172</p>
                    </div>
                    <div style="background:#112240; padding:20px; border-radius:8px;">
                        <h4>TAF</h4>
                        <p style="font-family:monospace; font-size: 20px;">KLGA 171720Z 1718/1824 26012KT 8SM FEW035 SCT150 <br>
                        FM172200 28018KT 6SM HZ BKN030 OVC100 <br>
                        FM180400 30012KT 7SM HZ SCT035 BKN120 <br>
                        FM181000 32010KT P6SM SCT045 BKN150</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener for the search button
        const searchButton = mainContent.querySelector('.nav-item');
        const searchInput = mainContent.querySelector('input');
        
        if (searchButton && searchInput) {
            const handleSearch = () => {
                const airport = searchInput.value.trim().toUpperCase();
                if (airport) {
                    alert(`Searching for ${airport} data. In a real app, this would fetch data from an aviation weather API.`);
                } else {
                    alert('Please enter an airport code');
                    searchInput.focus();
                }
            };
            
            searchButton.addEventListener('click', handleSearch);
            
            searchButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSearch();
                }
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }
    });
}

function loadSettingsContent() {
    safelyLoadContent(() => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Settings</h2>
                </div>
                <div style="margin-top:20px;">
                    <h3>Display Settings</h3>
                    <div style="margin:20px 0;">
                        <label style="display:block; margin-bottom:10px;">Default Airport:</label>
                        <input type="text" value="KJFK" style="padding:12px; width:250px; font-size: 18px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                    </div>
                    
                    <div style="margin:20px 0;">
                        <label style="display:block; margin-bottom:10px;">Units:</label>
                        <select style="padding:12px; width:250px; font-size: 18px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                            <option>Imperial (°F, inHg, SM)</option>
                            <option>Metric (°C, hPa, km)</option>
                            <option>Mixed (°C, inHg, SM)</option>
                        </select>
                    </div>
                    
                    <div style="margin:20px 0;">
                        <label style="display:block; margin-bottom:10px;">Auto-refresh Interval:</label>
                        <select style="padding:12px; width:250px; font-size: 18px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                            <option>1 minute</option>
                            <option>5 minutes</option>
                            <option>10 minutes</option>
                            <option>30 minutes</option>
                            <option>Never</option>
                        </select>
                    </div>
                    
                    <button id="save-settings" class="nav-item" style="margin-top:30px; display:inline-block; padding:15px 25px;" tabindex="0">Save Settings</button>
                </div>
            </div>
            
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>TV Remote Controls</h2>
                </div>
                <div style="margin:20px 0;">
                    <p><strong>Arrow Keys:</strong> Navigate between items</p>
                    <p><strong>Enter/OK:</strong> Select or activate items</p>
                    <p><strong>Back Button:</strong> Return to navigation menu</p>
                    <p><strong>Home Button:</strong> Return to Weather Briefing</p>
                </div>
            </div>
        `;
        
        // Add event listener for the save button
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                alert('Settings saved successfully!');
                
                // In a real app, you would save to localStorage here
                try {
                    const defaultAirport = document.querySelector('input[type="text"]').value;
                    const units = document.querySelectorAll('select')[0].value;
                    const refreshInterval = document.querySelectorAll('select')[1].value;
                    
                    // Example of how you would save to localStorage
                    // localStorage.setItem('settings', JSON.stringify({
                    //     defaultAirport,
                    //     units,
                    //     refreshInterval
                    // }));
                    
                    console.log('Would save settings:', { defaultAirport, units, refreshInterval });
                } catch (error) {
                    console.error('Error saving settings:', error);
                }
            });
            
            saveButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    saveButton.click();
                }
            });
        }
    });
}
