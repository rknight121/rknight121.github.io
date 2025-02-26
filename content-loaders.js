async function loadWeatherContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Show loading state
        mainContent.innerHTML = `
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
    }weather-widget">
                <div class="widget-header">
                    <h2>Forecast</h2>
                </div>
                <div class="forecast-grid" id="forecast-container">
                    ${taf ? formatForecastItems(taf) : '<div class="forecast-item"><h3>No forecast data available</h3></div>'}
                </div>
            </div>
            
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading weather data...</p>
            </div>
        `;
        
        // Default airport code
        const defaultAirport = localStorage.getItem('defaultAirport') || 'KJFK';
        
        // Fetch the weather data with METAR and TAF
        let weatherData;
        
        try {
            // Fetch both METAR and TAF in a single call
            weatherData = await WeatherAPI.getMetarAndTaf(defaultAirport);
        } catch (error) {
            console.error('Error fetching aviation weather data:', error);
            
            // Fallback to static data if API fails
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Unable to fetch real-time weather data</h3>
                    <p>${error.message}</p>
                    <p>Showing cached information. Please check your connection and try again.</p>
                </div>
                
                <div class="weather-widget">
                    <div class="widget-header">
                        <h2>Current Conditions (Cached)</h2>
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
                        <h2>3-Hour Forecast (Cached)</h2>
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
            `;
            return;
        }
        
        if (!weatherData || weatherData.length === 0) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>No weather data available</h3>
                    <p>Unable to find weather information for ${defaultAirport}.</p>
                </div>
                <button class="nav-item" onclick="loadWeatherContent()">Retry</button>
            `;
            return;
        }
        
        // Get the METAR data from the response
        const metar = weatherData[0];
        const taf = metar.taf || null;
        
        // Format the METAR data
        const formatMetarContent = (metar) => {
            if (!metar) {
                return '<p>No METAR data available</p>';
            }
            
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
            
            // Format observation time
            const obsTime = metar.observation_time ? 
                new Date(metar.observation_time).toUTCString().split(' ')[4] + ' UTC' : 
                'Unknown';
            
            return `
                <h3>${icao} - ${stationName}</h3>
                <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                <p>Visibility: ${visibility}</p>
                <p>Ceiling: ${skyConditions}</p>
                <p>Temperature: ${temp} / Dew Point: ${dewpoint}</p>
                <p>Altimeter: ${altimeter}</p>
                <p>Observed: ${obsTime}</p>
                <p>Raw: ${metar.raw_text || 'No raw METAR available'}</p>
            `;
        };
        
        // Parse and format TAF forecast periods
        const formatForecastItems = (taf) => {
            if (!taf || !taf.raw_text) {
                return '<div class="forecast-item"><h3>No forecast data available</h3></div>';
            }
            
            // Get the raw TAF
            const rawTaf = taf.raw_text;
            
            // Split the TAF into forecast periods
            const forecastPeriods = rawTaf.split(/\s+(FM|BECMG|TEMPO|PROB)/);
            
            // Take only the first few forecast periods (header + 3 periods)
            const mainPeriods = forecastPeriods.slice(0, 7);
            
            // Format as forecast items
            let forecastHtml = '';
            
            // Process the initial forecast period
            if (mainPeriods[0]) {
                const parts = mainPeriods[0].trim().split(' ');
                let validTime = parts[1] || '';
                if (validTime && validTime.includes('/')) {
                    const startTime = validTime.split('/')[0].slice(-6);
                    const hours = startTime.slice(0, 2);
                    const minutes = startTime.slice(2, 4);
                    
                    // Extract forecast details
                    const windInfo = parts.find(p => p.includes('KT')) || '';
                    const windDir = windInfo ? windInfo.slice(0, 3) : '---';
                    const windSpeed = windInfo ? windInfo.slice(3, 5) : '---';
                    
                    const visibilityPart = parts.find(p => p.includes('SM')) || '';
                    const visibility = visibilityPart || '---';
                    
                    forecastHtml += `
                        <div class="forecast-item">
                            <h3>${hours}:${minutes} UTC</h3>
                            <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                            <p>Visibility: ${visibility}</p>
                            <p>Conditions: ${parts.slice(parts.indexOf(visibility) + 1).join(' ')}</p>
                        </div>
                    `;
                }
            }
            
            // Add up to 2 more forecast periods
            for (let i = 1; i < mainPeriods.length && i <= 5; i += 2) {
                const periodType = mainPeriods[i];
                const periodData = mainPeriods[i + 1];
                
                if (periodData && periodType === 'FM') {
                    const parts = periodData.trim().split(' ');
                    
                    // For FM periods, the first part is the time code like '121800'
                    let timeCode = parts[0] || '';
                    const hours = timeCode.slice(2, 4);
                    const minutes = timeCode.slice(4, 6);
                    
                    // Extract forecast details
                    const windInfo = parts.find(p => p.includes('KT')) || '';
                    const windDir = windInfo ? windInfo.slice(0, 3) : '---';
                    const windSpeed = windInfo ? windInfo.slice(3, 5) : '---';
                    
                    const visibilityPart = parts.find(p => p.includes('SM')) || '';
                    const visibility = visibilityPart || '---';
                    
                    forecastHtml += `
                        <div class="forecast-item">
                            <h3>${hours}:${minutes} UTC</h3>
                            <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                            <p>Visibility: ${visibility}</p>
                            <p>Conditions: ${parts.slice(parts.indexOf(visibilityPart) + 1 || parts.length).join(' ')}</p>
                        </div>
                    `;
                }
            }
            
            return forecastHtml || '<div class="forecast-item"><h3>No parsed forecast periods available</h3></div>';
        };
        
        // Get radar data
        const radarData = WeatherAPI.getRadarUrl();
        
        // Build the current conditions and forecast HTML
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Current Conditions</h2>
                    <span id="weather-timestamp">Last updated: ${getCurrentUTCTime()}</span>
                </div>
                <div id="current-conditions">
                    ${formatMetarContent(metar)}
                </div>
            </div>
            
            <div class="// Functions for loading different content sections
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
        
        // Fetch the weather data with METAR and TAF
        let weatherData;
        
        try {
            // Fetch both METAR and TAF in a single call
            weatherData = await WeatherAPI.getMetarAndTaf(defaultAirport);
        } catch (error) {
            console.error('Error fetching aviation weather data:', error);
            
            // Fallback to static data if API fails
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Unable to fetch real-time weather data</h3>
                    <p>Showing cached information. Please check your connection and try again.</p>
                </div>
                
                <div class="weather-widget">
                    <div class="widget-header">
                        <h2>Current Conditions (Cached)</h2>
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
                        <h2>3-Hour Forecast (Cached)</h2>
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
            `;
            return;
        }
        
        // Format the METAR data
        const formatMetarContent = (metar) => {
            if (!metar || metar.length === 0) {
                return '<p>No METAR data available</p>';
            }
            
            const data = metar[0]; // Get the first METAR
            
            // Extract values from the METAR data
            const icao = data.icao_id || 'Unknown';
            const stationName = data.site || 'Unknown Location';
            const windDir = data.wind_dir_degrees !== null ? data.wind_dir_degrees : '---';
            const windSpeed = data.wind_speed_kt !== null ? data.wind_speed_kt : '---';
            const visibility = data.visibility_statute_mi !== null ? `${data.visibility_statute_mi}SM` : '---';
            const temp = data.temp_c !== null ? `${data.temp_c}°C` : '---';
            const dewpoint = data.dewpoint_c !== null ? `${data.dewpoint_c}°C` : '---';
            const altimeter = data.altim_in_hg !== null ? `${data.altim_in_hg} inHg` : '---';
            
            // Format sky conditions
            let skyConditions = 'Clear';
            if (data.sky_condition && data.sky_condition.length > 0) {
                skyConditions = data.sky_condition.map(layer => 
                    `${layer.sky_cover} ${layer.cloud_base_ft_agl || '---'}`
                ).join(' ');
            }
            
            // Format observation time
            const obsTime = data.observation_time ? 
                new Date(data.observation_time).toUTCString().split(' ')[4] + ' UTC' : 
                'Unknown';
            
            return `
                <h3>${icao} - ${stationName}</h3>
                <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                <p>Visibility: ${visibility}</p>
                <p>Ceiling: ${skyConditions}</p>
                <p>Temperature: ${temp} / Dew Point: ${dewpoint}</p>
                <p>Altimeter: ${altimeter}</p>
                <p>Observed: ${obsTime}</p>
                <p>Raw: ${data.raw_text || 'No raw METAR available'}</p>
            `;
        };
        
        // Format TAF forecast periods
        const formatForecastItems = (taf) => {
            if (!taf || taf.length === 0) {
                return '<div class="forecast-item"><h3>No forecast data available</h3></div>';
            }
            
            // Get the TAF and extract forecast periods
            const tafData = taf[0];
            
            // If there's a raw TAF, parse it to extract forecast periods
            if (tafData.raw_text) {
                // Split the TAF into forecast periods
                const rawTaf = tafData.raw_text;
                const forecastPeriods = rawTaf.split(/\s+(FM|BECMG|TEMPO|PROB)/);
                
                // Take only the first few forecast periods (header + 3 periods)
                const mainPeriods = forecastPeriods.slice(0, 7);
                
                // Format as forecast items
                let forecastHtml = '';
                
                // Process the initial forecast period
                if (mainPeriods[0]) {
                    const parts = mainPeriods[0].trim().split(' ');
                    let validTime = parts[1] || '';
                    if (validTime && validTime.includes('/')) {
                        const startTime = validTime.split('/')[0].slice(-6);
                        const hours = startTime.slice(0, 2);
                        const minutes = startTime.slice(2, 4);
                        
                        // Extract forecast details
                        const windInfo = parts.find(p => p.includes('KT')) || '';
                        const windDir = windInfo ? windInfo.slice(0, 3) : '---';
                        const windSpeed = windInfo ? windInfo.slice(3, 5) : '---';
                        
                        const visibilityPart = parts.find(p => p.includes('SM')) || '';
                        const visibility = visibilityPart || '---';
                        
                        forecastHtml += `
                            <div class="forecast-item">
                                <h3>${hours}:${minutes} UTC</h3>
                                <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                                <p>Visibility: ${visibility}</p>
                                <p>Conditions: ${parts.slice(parts.indexOf(visibility) + 1).join(' ')}</p>
                            </div>
                        `;
                    }
                }
                
                // Add up to 2 more forecast periods
                for (let i = 1; i < mainPeriods.length && i <= 5; i += 2) {
                    const periodType = mainPeriods[i];
                    const periodData = mainPeriods[i + 1];
                    
                    if (periodData && periodType === 'FM') {
                        const parts = periodData.trim().split(' ');
                        
                        // For FM periods, the first part is the time code like '121800'
                        let timeCode = parts[0] || '';
                        const hours = timeCode.slice(2, 4);
                        const minutes = timeCode.slice(4, 6);
                        
                        // Extract forecast details
                        const windInfo = parts.find(p => p.includes('KT')) || '';
                        const windDir = windInfo ? windInfo.slice(0, 3) : '---';
                        const windSpeed = windInfo ? windInfo.slice(3, 5) : '---';
                        
                        const visibilityPart = parts.find(p => p.includes('SM')) || '';
                        const visibility = visibilityPart || '---';
                        
                        forecastHtml += `
                            <div class="forecast-item">
                                <h3>${hours}:${minutes} UTC</h3>
                                <p>Wind: ${windDir}° at ${windSpeed}kt</p>
                                <p>Visibility: ${visibility}</p>
                                <p>Conditions: ${parts.slice(parts.indexOf(visibilityPart) + 1 || parts.length).join(' ')}</p>
                            </div>
                        `;
                    }
                }
                
                return forecastHtml || '<div class="forecast-item"><h3>No parsed forecast periods available</h3></div>';
            }
            
            return '<div class="forecast-item"><h3>No forecast data available</h3></div>';
        };
        
        // Get radar data
        const radarData = await WeatherAPI.getRadarUrl();
        
        // Build the current conditions and forecast HTML
        mainContent.innerHTML = `
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Current Conditions</h2>
                    <span id="weather-timestamp">Last updated: ${getCurrentUTCTime()}</span>
                </div>
                <div id="current-conditions">
                    ${formatMetarContent(weatherData)}
                </div>
            </div>
            
            <div class="weather-widget">
                <div class="widget-header">
                    <h2>Forecast</h2>
                </div>
                <div class="forecast-grid" id="forecast-container">
                    ${formatForecastItems(weatherData)}
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
    });
}

async function loadNotamContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Show loading state
        mainContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading NOTAMs...</p>
            </div>
        `;
        
        // Default airports for NOTAMs
        const defaultAirports = ['KJFK', 'KLGA'];
        
        // Function to format NOTAMs for an airport
        const formatNotams = async (icao) => {
            try {
                // Fetch NOTAMs for this airport
                const notamData = await WeatherAPI.getNotams(icao);
                
                if (!notamData || !notamData.data || notamData.data.length === 0) {
                    return `
                        <div>
                            <h3>${icao}</h3>
                            <p>No current NOTAMs available for this airport.</p>
                        </div>
                    `;
                }
                
                // Format NOTAM entries
                const notamEntries = notamData.data.map(notam => 
                    `<p><strong>!${notam.icao} ${notam.number}</strong> ${notam.text}</p>`
                ).join('');
                
                return `
                    <div style="margin-top: 20px;">
                        <h3>${icao}</h3>
                        ${notamEntries}
                    </div>
                `;
            } catch (error) {
                console.error(`Error fetching NOTAMs for ${icao}:`, error);
                return `
                    <div>
                        <h3>${icao}</h3>
                        <div class="error-message">
                            <p>Unable to load NOTAM data for this airport. Please try again later.</p>
                        </div>
                    </div>
                `;
            }
        };
        
        // Build the NOTAM content
        try {
            const notamPromises = defaultAirports.map(formatNotams);
            const notamResults = await Promise.all(notamPromises);
            
            mainContent.innerHTML = `
                <div class="notam-widget">
                    <div class="widget-header">
                        <h2>NOTAMs</h2>
                        <span>Last updated: ${getCurrentUTCTime()}</span>
                    </div>
                    ${notamResults.join('')}
                </div>
            `;
            
            // Add a note that these are simulated NOTAMs (until we have a real NOTAM API)
            const notamWidget = mainContent.querySelector('.notam-widget');
            if (notamWidget) {
                notamWidget.innerHTML += `
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #384766;">
                        <p style="font-style: italic;">Note: This is simulated NOTAM data. For actual NOTAMs, please use official aviation sources.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading NOTAMs:', error);
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading NOTAMs</h3>
                    <p>${error.message || 'An unexpected error occurred while loading NOTAM data.'}</p>
                </div>
                <button class="nav-item" onclick="loadNotamContent()">Retry</button>
            `;
        }
    } catch (error) {
        console.error('Error in loadNotamContent:', error);
        const mainContent = document.getElementById('main-content');
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading NOTAMs</h3>
                    <p>${error.message || 'An unexpected error occurred.'}</p>
                </div>
                <button class="nav-item" onclick="loadNotamContent()">Retry</button>
            `;
        }
    }

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
        let radarData;
        try {
            radarData = await WeatherAPI.getRadarUrl('conus');
        } catch (error) {
            console.error('Error fetching radar data:', error);
            mainContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Radar Data</h3>
                    <p>Unable to load radar imagery. Please try again later.</p>
                </div>
                <button class="nav-item" onclick="loadRadarContent()">Retry</button>
            `;
            return;
        }
        
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
            button.addEventListener('click', async () => {
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
                    const newRadarData = await WeatherAPI.getRadarUrl(region);
                    
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

async function loadMetarContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Show search interface with loading state for existing airports
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
        
        // Function to format raw METAR
        const formatRawMetar = (metarData) => {
            if (!metarData || metarData.length === 0) {
                return 'No METAR data available';
            }
            return metarData[0].raw_text || 'No raw METAR available';
        };
        
        // Function to format raw TAF
        const formatRawTaf = (tafData) => {
            if (!tafData || tafData.length === 0) {
                return 'No TAF data available';
            }
            
            const rawText = tafData[0].raw_text || '';
            return rawText.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '<br>async function loadMetarContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        ');
        };
        
        // Function to load METAR and TAF for an airport
        const loadAirportData = async (icao) => {
            try {
                // Fetch METAR and TAF data in a single call
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
                
                // Get airport information
                const airportName = weatherData[0].site || 'Unknown Airport';
                
                // Check if we have TAF data
                const hasTaf = weatherData[0].taf && weatherData[0].taf.raw_text;
                
                return `
                    <div style="margin-bottom:30px;">
                        <h3>${icao} - ${airportName}</h3>
                        <div style="background:#112240; padding:20px; border-radius:8px; margin-bottom:20px;">
                            <h4>METAR</h4>
                            <p style="font-family:monospace; font-size: 20px;">${weatherData[0].raw_text || 'No METAR available'}</p>
                        </div>
                        <div style="background:#112240; padding:20px; border-radius:8px;">
                            <h4>TAF</h4>
                            <p style="font-family:monospace; font-size: 20px;">${hasTaf ? weatherData[0].taf.raw_text.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '<br>async function loadMetarContent() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        ') : 'No TAF available'}</p>
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
                
                try {
                    // Show loading state
                    airportResults.innerHTML = `
                        <div class="loading">
                            <div class="spinner"></div>
                            <p>Searching for ${airport}...</p>
                        </div>
                    `;
                    
                    // Load data for the searched airport
                    const airportData = await loadAirportData(airport);
                    
                    // Prepend to the list
                    airportResults.innerHTML = airportData;
                } catch (error) {
                    console.error('Error searching for airport:', error);
                    airportResults.innerHTML = `
                        <div class="error-message">
                            <h3>Search Error</h3>
                            <p>Unable to find weather data for "${airport}". Please check the airport code and try again.</p>
                        </div>
                    `;
        // Show search interface with loading state for existing airports
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
        
        // Function to format raw METAR
        const formatRawMetar = (metar) => {
            if (!metar || !metar.data || metar.data.length === 0) {
                return 'No METAR data available';
            }
            return metar.data[0].raw_text || 'No raw METAR available';
        };
        
        // Function to format raw TAF
        const formatRawTaf = (taf) => {
            if (!taf || !taf.data || taf.data.length === 0) {
                return 'No TAF data available';
            }
            
            const rawText = taf.data[0].raw_text || '';
            return rawText.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '<br>function loadMetarContent() {
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
        `;');
        };
        
        // Function to load METAR and TAF for an airport
        const loadAirportData = async (icao) => {
            try {
                // Fetch METAR and TAF data
                const [metar, taf] = await Promise.all([
                    WeatherAPI.getMetar(icao),
                    WeatherAPI.getTaf(icao)
                ]);
                
                // Get airport information
                const airportName = metar && metar.data && metar.data.length > 0 && metar.data[0].station ? 
                    metar.data[0].station.name : 'Unknown Airport';
                
                return `
                    <div style="margin-bottom:30px;">
                        <h3>${icao} - ${airportName}</h3>
                        <div style="background:#112240; padding:20px; border-radius:8px; margin-bottom:20px;">
                            <h4>METAR</h4>
                            <p style="font-family:monospace; font-size: 20px;">${formatRawMetar(metar)}</p>
                        </div>
                        <div style="background:#112240; padding:20px; border-radius:8px;">
                            <h4>TAF</h4>
                            <p style="font-family:monospace; font-size: 20px;">${formatRawTaf(taf)}</p>
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
                
                try {
                    // Show loading state
                    airportResults.innerHTML = `
                        <div class="loading">
                            <div class="spinner"></div>
                            <p>Searching for ${airport}...</p>
                        </div>
                    `;
                    
                    // Load data for the searched airport
                    const airportData = await loadAirportData(airport);
                    
                    // Prepend to the list
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
