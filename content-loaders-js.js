// Functions for loading different content sections
// In a real application, these would make API calls to fetch actual data

function loadWeatherContent() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="weather-widget">
            <div class="widget-header">
                <h2>Current Conditions</h2>
                <span id="weather-timestamp">Last updated: ${new Date().toUTCString().split(' ')[4]} UTC</span>
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
}

function loadNotamContent() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="notam-widget">
            <div class="widget-header">
                <h2>NOTAMs</h2>
                <span>Last updated: ${new Date().toUTCString().split(' ')[4]} UTC</span>
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
}

function loadRadarContent() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="map-widget" style="height: calc(100vh - 140px);">
            <div class="widget-header">
                <h2>Interactive Radar</h2>
                <div>
                    <button id="btn-zoom-in" class="nav-item" style="display:inline-block; padding:8px 15px; margin-right:10px;">Zoom In</button>
                    <button id="btn-zoom-out" class="nav-item" style="display:inline-block; padding:8px 15px;">Zoom Out</button>
                </div>
            </div>
            <div class="map-container" id="interactive-radar-map" style="height: calc(100% - 60px);">
                <img src="/api/placeholder/1200/800" alt="Interactive Weather Radar Map" style="width:100%; height:100%; object-fit:cover;">
            </div>
        </div>
    `;
    
    // Add event listeners for the zoom buttons
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        alert('Zooming in functionality would be implemented here');
    });
    
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        alert('Zooming out functionality would be implemented here');
    });
}

function loadMetarContent() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="weather-widget">
            <div class="widget-header">
                <h2>METAR/TAF Reports</h2>
                <div>
                    <input type="text" placeholder="Enter airport code" style="padding:8px; margin-right:10px;">
                    <button class="nav-item" style="display:inline-block; padding:8px 15px;">Search</button>
                </div>
            </div>
            <div style="margin-top:20px;">
                <h3>KJFK - John F Kennedy Intl</h3>
                <div style="background:#112240; padding:15px; border-radius:5px; margin-bottom:20px;">
                    <h4>METAR</h4>
                    <p style="font-family:monospace;">KJFK 171753Z 27015KT 10SM FEW038 SCT120 24/18 A2992 RMK AO2 SLP132 T02390183</p>
                </div>
                <div style="background:#112240; padding:15px; border-radius:5px;">
                    <h4>TAF</h4>
                    <p style="font-family:monospace;">KJFK 171720Z 1718/1824 27015KT 10SM FEW038 SCT120 <br>
                    FM172100 29020KT 5SM HZ BKN030 OVC100 <br>
                    FM180300 31015KT 6SM HZ SCT035 BKN100 <br>
                    FM180900 32012KT P6SM SCT040 BKN150</p>
                </div>
            </div>
            
            <div style="margin-top:30px;">
                <h3>KLGA - LaGuardia</h3>
                <div style="background:#112240; padding:15px; border-radius:5px; margin-bottom:20px;">
                    <h4>METAR</h4>
                    <p style="font-family:monospace;">KLGA 171753Z 26012KT 8SM FEW035 SCT150 23/17 A2991 RMK AO2 SLP130 T02330172</p>
                </div>
                <div style="background:#112240; padding:15px; border-radius:5px;">
                    <h4>TAF</h4>
                    <p style="font-family:monospace;">KLGA 171720Z 1718/1824 26012KT 8SM FEW035 SCT150 <br>
                    FM172200 28018KT 6SM HZ BKN030 OVC100 <br>
                    FM180400 30012KT 7SM HZ SCT035 BKN120 <br>
                    FM181000 32010KT P6SM SCT045 BKN150</p>
                </div>
            </div>
        </div>
    `;
}

function loadSettingsContent() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="weather-widget">
            <div class="widget-header">
                <h2>Settings</h2>
            </div>
            <div style="margin-top:20px;">
                <h3>Display Settings</h3>
                <div style="margin:20px 0;">
                    <label style="display:block; margin-bottom:10px;">Default Airport:</label>
                    <input type="text" value="KJFK" style="padding:8px; width:200px;">
                </div>
                
                <div style="margin:20px 0;">
                    <label style="display:block; margin-bottom:10px;">Units:</label>
                    <select style="padding:8px; width:200px;">
                        <option>Imperial (°F, inHg, SM)</option>
                        <option>Metric (°C, hPa, km)</option>
                        <option>Mixed (°C, inHg, SM)</option>
                    </select>
                </div>
                
                <div style="margin:20px 0;">
                    <label style="display:block; margin-bottom:10px;">Auto-refresh Interval:</label>
                    <select style="padding:8px; width:200px;">
                        <option>1 minute</option>
                        <option>5 minutes</option>
                        <option>10 minutes</option>
                        <option>30 minutes</option>
                        <option>Never</option>
                    </select>
                </div>
                
                <button class="nav-item" style="margin-top:30px; display:inline-block; padding:10px 20px;">Save Settings</button>
            </div>
        </div>
    `;
}
