// Functions for loading different content sections

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

// Load weather content
async function loadWeatherContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Show loading state
        mainContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading weather data...</p>
            </div>
        `;
        
        // Default airport code
        const defaultAirport = localStorage.getItem('defaultAirport') || 'KJFK';
        
        // Fetch the weather data
        let weatherData;
        
        try {
            // Fetch both METAR and TAF in a single call
            weatherData = await WeatherAPI.getMetarAndTaf(defaultAirport);
            
            if (!weatherData || weatherData.length === 0) {
                throw new Error('No data returned from API');
            }
        } catch (error) {
            console.error('Error fetching aviation weather data:', error);
            
            // Show error message instead of static data
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Unable to fetch real-time weather data</h3>
                    <p>${error.message}</p>
                    <p>Please check your internet connection and try again.</p>
                </div>
                <button class="nav-item" onclick="loadWeatherContent()">Retry</button>
            `;
            return;
        }
        
        // Get the METAR and TAF data
        const metar = weatherData[0];
        const taf = metar.taf || null;
        
        // Extract values from the METAR data
        const icao = metar.icao_id || 'Unknown';
        const stationName = metar.site || 'Unknown Location';
        const windDir = metar.wind_dir_degrees !== null ? metar.wind_dir_degrees : '---';
        const windSpeed = metar.wind_speed_kt !== null ? metar.wind_speed_kt : '---';
        const visibility = metar.visibility_statute_mi !== null ? `${metar.visibility_statute_mi}SM` : '---';
        const temp = metar.temp_c !== null ? `${metar.temp_c}°C` : '---';
        const dewpoint = metar.dewpoint_c !== null ? `${metar.dewpoint_c}°C` : '---';
        const altimeter = metar.altim_in_hg !== null ? `${metar.altim_in_hg} inHg` : '---';
        
        // Format sky conditions
        let skyConditions = 'Clear';
        if (metar.sky_condition && metar.sky_condition.length > 0) {
            skyConditions = metar.sky_condition.map(layer => 
                `${layer.sky_cover} ${layer.cloud_base_ft_agl || '---'}`
            ).join(' ');
        }
        
        // Get radar data
        const radarData = WeatherAPI.getRadarUrl();
        
        // Build the HTML content
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Current Conditions</h2>
                    <span id="weather-timestamp">Last updated: ${getCurrentUTCTime()}</span>
                </div>
                <div id="current-conditions">
                    <h3>${icao} - ${stationName}</h3>
                    <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                    <p>Visibility: ${visibility}</p>
                    <p>Ceiling: ${skyConditions}</p>
                    <p>Temperature: ${temp} / Dew Point: ${dewpoint}</p>
                    <p>Altimeter: ${altimeter}</p>
                    <p>Raw: ${metar.raw_text || 'No raw METAR available'}</p>
                </div>
            </div>
            
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Forecast</h2>
                </div>
                <div class="forecast-grid" id="forecast-container">
                    ${taf && taf.raw_text ? 
                        `<div class="forecast-item">
                            <h3>TAF</h3>
                            <p style="font-family:monospace; white-space:pre-wrap;">${taf.raw_text.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '\n$&')}</p>
                        </div>` : 
                        '<div class="forecast-item"><h3>No forecast data available</h3></div>'
                    }
                </div>
            </div>
            
            <div class="map-widget">
                <div class="widget-header">
                    <h2>Weather Radar</h2>
                </div>
                <div class="map-container" id="radar-map">
                    <img src="${radarData.imageUrl}" alt="National Weather Radar Map" style="width:100%; height:100%; object-fit:cover;">
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error in loadWeatherContent:', error);
        const mainContent = document.getElementById('main-content');
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Weather Data</h3>
                    <p>${error.message || 'An unexpected error occurred while loading weather data.'}</p>
                </div>
                <button class="nav-item" onclick="loadWeatherContent()">Retry</button>
            `;
        }
    }
}

// Load METAR/TAF content
async function loadMetarContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Show search interface with loading state
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>METAR/TAF Reports</h2>
                    <div>
                        <input type="text" id="airport-search" placeholder="Enter airport code" style="padding:12px; margin-right:10px; font-size: 18px; width: 200px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                        <button id="search-button" class="nav-item" style="display:inline-block; padding:12px 20px;" tabindex="0">Search</button>
                    </div>
                </div>
                <div id="airport-data" style="margin-top:20px;">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading weather reports...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Default airports to load
        const defaultAirports = ['KJFK', 'KLGA'];
        const airportResults = document.getElementById('airport-data');
        
        // Function to load METAR and TAF for an airport
        const loadAirportData = async (icao) => {
            try {
                // Fetch METAR with TAF included
                const weatherData = await WeatherAPI.getMetarAndTaf(icao);
                
                if (!weatherData || weatherData.length === 0) {
                    return `
                        <div style="margin-bottom:30px;">
                            <h3>${icao}</h3>
                            <div class="error-message">
                                <p>No weather data available for this airport.</p>
                            </div>
                        </div>
                    `;
                }
                
                // Get METAR and TAF info
                const metar = weatherData[0];
                const taf = metar.taf || null;
                
                // Format airport name
                const airportName = metar.site || 'Unknown Airport';
                
                // Format raw METAR text
                const metarText = metar.raw_text || 'No METAR available';
                
                // Format TAF text with line breaks for readability
                const tafText = taf && taf.raw_text ? 
                    taf.raw_text.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '<br>$&') : 
                    'No TAF available';
                
                return `
                    <div style="margin-bottom:30px;">
                        <h3>${icao} - ${airportName}</h3>
                        <div style="background:#112240; padding:20px; border-radius:8px; margin-bottom:20px;">
                            <h4>METAR</h4>
                            <p style="font-family:monospace; font-size: 20px;">${metarText}</p>
                        </div>
                        <div style="background:#112240; padding:20px; border-radius:8px;">
                            <h4>TAF</h4>
                            <p style="font-family:monospace; font-size: 20px;">${tafText}</p>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading data for ${icao}:`, error);
                return `
                    <div style="margin-bottom:30px;">
                        <h3>${icao}</h3>
                        <div class="error-message">
                            <p>Unable to load weather data for this airport. Please try again later.</p>
                        </div>
                    </div>
                `;
            }
        };
        
        // Load data for default airports
        try {
            const airportDataPromises = defaultAirports.map(icao => loadAirportData(icao));
            const airportDataResults = await Promise.all(airportDataPromises);
            
            airportResults.innerHTML = airportDataResults.join('');
        } catch (error) {
            console.error('Error loading default airport data:', error);
            airportResults.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Airport Data</h3>
                    <p>Unable to load weather reports. Please check your connection and try again.</p>
                </div>
            `;
        }
        
        // Set up search functionality
        const searchInput = document.getElementById('airport-search');
        const searchButton = document.getElementById('search-button');
        
        if (searchButton && searchInput) {
            const handleSearch = async () => {
                const airport = searchInput.value.trim().toUpperCase();
                if (!airport) {
                    alert('Please enter an airport code');
                    searchInput.focus();
                    return;
                }
                
                // Show loading state
                airportResults.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Searching for ${airport}...</p>
                    </div>
                `;
                
                try {
                    // Load data for the searched airport
                    const airportData = await loadAirportData(airport);
                    
                    // Show the result
                    airportResults.innerHTML = airportData;
                } catch (error) {
                    console.error('Error searching for airport:', error);
                    airportResults.innerHTML = `
                        <div class="error-message">
                            <h3>Search Error</h3>
                            <p>Unable to find weather data for "${airport}". Please check the airport code and try again.</p>
                        </div>
                    `;
                }
            };
            
            searchButton.addEventListener('click', handleSearch);
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
            
            // TV remote navigation support for the search button
            searchButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }
    } catch (error) {
        console.error('Error in loadMetarContent:', error);
        const mainContent = document.getElementById('main-content');
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading METAR/TAF Data</h3>
                    <p>${error.message || 'An unexpected error occurred.'}</p>
                </div>
                <button class="nav-item" onclick="loadMetarContent()">Retry</button>
            `;
        }
    }
}

// Load NOTAMs content - removed mock data, now shows API limitation message
function loadNotamContent() {
    safelyLoadContent(() => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="notam-widget">
                <div class="widget-header">
                    <h2>NOTAMs</h2>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p>NOTAMs are not available through the NOAA Aviation Weather API.</p>
                    <p>To access NOTAMs, you would need to integrate with a separate service such as:</p>
                    <ul style="text-align: left; margin: 20px auto; max-width: 500px;">
                        <li>FAA NOTAM System API</li>
                        <li>Commercial aviation data providers</li>
                        <li>Direct integration with official aviation sources</li>
                    </ul>
                    <p>For flight planning purposes, always check official sources for current NOTAMs.</p>
                </div>
            </div>
        `;
    });
}

// Load radar content
async function loadRadarContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Show loading state
        mainContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading radar data...</p>
            </div>
        `;
        
        // Get radar data from the API
        const radarData = WeatherAPI.getRadarUrl('conus');
        
        // Define available regions for selection
        const regions = [
            { id: 'conus', name: 'National (CONUS)' },
            { id: 'northeast', name: 'Northeast' },
            { id: 'southeast', name: 'Southeast' },
            { id: 'midwest', name: 'Midwest' },
            { id: 'southern', name: 'Southern' },
            { id: 'southwest', name: 'Southwest' },
            { id: 'northwest', name: 'Northwest' }
        ];
        
        // Create region options
        const regionOptions = regions.map(region => 
            `<button class="nav-item region-btn" data-region="${region.id}" style="display:inline-block; padding:8px 15px; margin-right:10px; margin-bottom:10px;" tabindex="0">${region.name}</button>`
        ).join('');
        
        mainContent.innerHTML = `
            <div class="map-widget" style="height: calc(100vh - 140px);">
                <div class="widget-header">
                    <h2>Weather Radar</h2>
                    <span>Last updated: ${getCurrentUTCTime()}</span>
                </div>
                <div style="margin:15px 0;">
                    <h3>Select Region:</h3>
                    <div id="region-selector" style="margin-top:10px;">
                        ${regionOptions}
                    </div>
                </div>
                <div class="map-container" id="interactive-radar-map" style="height: calc(100% - 120px); position:relative;">
                    <img id="radar-image" src="${radarData.imageUrl}" alt="Weather Radar Map" style="width:100%; height:100%; object-fit:contain;">
                    <div id="loading-overlay" style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(10,25,47,0.7); justify-content:center; align-items:center;">
                        <div class="spinner"></div>
                    </div>
                </div>
                <div style="margin-top:15px; font-size:14px; font-style:italic;">
                    Source: NOAA/National Weather Service
                </div>
            </div>
        `;
        
        // Add event listeners for the region buttons
        const regionButtons = document.querySelectorAll('.region-btn');
        const radarImage = document.getElementById('radar-image');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        regionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const region = button.getAttribute('data-region');
                if (!region) return;
                
                // Highlight selected button
                regionButtons.forEach(btn => btn.style.backgroundColor = '');
                button.style.backgroundColor = '#64ffda';
                button.style.color = '#112240';
                
                // Show loading state
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'flex';
                }
                
                try {
                    // Get radar data for the selected region
                    const newRadarData = WeatherAPI.getRadarUrl(region);
                    
                    // Update the radar image
                    if (radarImage) {
                        radarImage.src = newRadarData.imageUrl;
                    }
                } catch (error) {
                    console.error(`Error loading radar for region ${region}:`, error);
                    alert(`Unable to load radar for the selected region. Please try again.`);
                } finally {
                    // Hide loading overlay
                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                    }
                }
            });
            
            // Add keyboard navigation support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
        
        // Set initial selected region
        const conusButton = document.querySelector('.region-btn[data-region="conus"]');
        if (conusButton) {
            conusButton.style.backgroundColor = '#64ffda';
            conusButton.style.color = '#112240';
        }
        
        // Handle radar image load event
        if (radarImage) {
            radarImage.onload = () => {
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
            };
            
            radarImage.onerror = () => {
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                radarImage.alt = 'Error loading radar image';
                radarImage.style.display = 'none';
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = '<h3>Error loading radar image</h3><p>Unable to load the selected radar image. Please try another region.</p>';
                
                radarImage.parentNode.appendChild(errorDiv);
            };
        }
    } catch (error) {
        console.error('Error in loadRadarContent:', error);
        const mainContent = document.getElementById('main-content');
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Radar Data</h3>
                    <p>${error.message || 'An unexpected error occurred.'}</p>
                </div>
                <button class="nav-item" onclick="loadRadarContent()">Retry</button>
            `;
        }
    }
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
                        <input type="text" id="default-airport" value="${localStorage.getItem('defaultAirport') || 'KJFK'}" style="padding:12px; width:250px; font-size: 18px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                    </div>
                    
                    <div style="margin:20px 0;">
                        <label style="display:block; margin-bottom:10px;">Units:</label>
                        <select id="units-selector" style="padding:12px; width:250px; font-size: 18px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                            <option value="imperial" ${localStorage.getItem('units') === 'imperial' ? 'selected' : ''}>Imperial (°F, inHg, SM)</option>
                            <option value="metric" ${localStorage.getItem('units') === 'metric' ? 'selected' : ''}>Metric (°C, hPa, km)</option>
                            <option value="mixed" ${localStorage.getItem('units') === 'mixed' ? 'selected' : ''}>Mixed (°C, inHg, SM)</option>
                        </select>
                    </div>
                    
                    <div style="margin:20px 0;">
                        <label style="display:block; margin-bottom:10px;">Auto-refresh Interval:</label>
                        <select id="refresh-interval" style="padding:12px; width:250px; font-size: 18px; background-color: #112240; color: white; border: 1px solid #64ffda; border-radius: 4px;">
                            <option value="60000" ${localStorage.getItem('refreshInterval') === '60000' ? 'selected' : ''}>1 minute</option>
                            <option value="300000" ${localStorage.getItem('refreshInterval') === '300000' ? 'selected' : ''}>5 minutes</option>
                            <option value="600000" ${localStorage.getItem('refreshInterval') === '600000' ? 'selected' : ''}>10 minutes</option>
                            <option value="1800000" ${localStorage.getItem('refreshInterval') === '1800000' ? 'selected' : ''}>30 minutes</option>
                            <option value="0" ${localStorage.getItem('refreshInterval') === '0' ? 'selected' : ''}>Never</option>
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
            
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>About</h2>
                </div>
                <div style="margin:20px 0;">
                    <p>Flight Planning Dashboard</p>
                    <p>Weather data provided by NOAA Aviation Weather Center</p>
                    <p>Radar imagery from the National Weather Service</p>
                    <p><a href="https://aviationweather.gov/data/api/" style="color: #64ffda;" target="_blank">Aviation Weather API Documentation</a></p>
                </div>
            </div>
        `;
        
        // Add event listener for the save button
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const defaultAirport = document.getElementById('default-airport').value.trim().toUpperCase();
                const units = document.getElementById('units-selector').value;
                const refreshInterval = document.getElementById('refresh-interval').value;
                
                // Save to localStorage
                localStorage.setItem('defaultAirport', defaultAirport);
                localStorage.setItem('units', units);
                localStorage.setItem('refreshInterval', refreshInterval);
                
                alert('Settings saved successfully!');
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
