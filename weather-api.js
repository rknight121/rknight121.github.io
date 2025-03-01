// Weather API service module for NOAA Aviation Weather API
// Structured based on official NOAA API schema

// Configuration
const API_CONFIG = {
    // URL of your proxy server
    baseUrl: 'https://proxy-server4v.vercel.app/api/',
    timeout: 15000 // 15 seconds
};

// Error handling for fetch requests
async function fetchWithTimeout(url, options = {}) {
    console.log('Fetching:', url);
    const controller = new AbortController();
    const { timeout = API_CONFIG.timeout } = options;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Fetch error details:', error.name, error.message);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        
        throw error;
    }
}

// Parse response based on requested format
async function parseResponse(response, format) {
    if (!response) {
        throw new Error('No response received');
    }
    
    try {
        switch(format) {
            case 'json':
            case 'geojson':
                return await response.json();
            case 'xml':
            case 'html':
            case 'raw':
            default:
                return await response.text();
        }
    } catch (error) {
        console.error('Error parsing response:', error);
        throw error;
    }
}

// Format cloud data into a readable string
function formatCloudData(clouds) {
    if (!clouds || clouds.length === 0) {
        return 'Clear';
    }
    
    return clouds.map(cloud => {
        const cover = cloud.cover || '';
        const base = cloud.base ? `${cloud.base}ft` : '';
        return `${cover} ${base}`.trim();
    }).join(', ');
}

// Format visibility for display
function formatVisibility(visib) {
    if (visib === null || visib === undefined) {
        return 'Unknown';
    }
    
    if (visib === '10+' || visib === '6+') {
        return `${visib}SM`;
    }
    
    return `${visib}SM`;
}

// Convert Unix timestamp to formatted date
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
        // Check if the timestamp is in seconds (standard Unix format)
        // or milliseconds (JavaScript standard)
        const date = new Date(
            timestamp > 9999999999 ? timestamp : timestamp * 1000
        );
        return date.toUTCString();
    } catch (error) {
        console.error('Error formatting timestamp:', timestamp, error);
        return 'Invalid date';
    }
}

// Format date strings from NOAA API
function formatDateString(dateStr) {
    if (!dateStr) return 'Unknown';
    
    try {
        if (typeof dateStr === 'string' && dateStr.includes('UTC')) {
            return dateStr; // Already formatted
        }
        const date = new Date(dateStr);
        return date.toUTCString();
    } catch (error) {
        console.error('Error formatting date string:', dateStr, error);
        return dateStr;
    }
}

// Debugging function to help identify TAF data structure
function debugTafData(data) {
    try {
        console.log('TAF DEBUG - Data type:', typeof data);
        
        if (!data) {
            console.log('TAF DEBUG - Data is null or undefined');
            return;
        }
        
        if (Array.isArray(data)) {
            console.log('TAF DEBUG - Data is an array of length:', data.length);
            if (data.length > 0) {
                console.log('TAF DEBUG - First item keys:', Object.keys(data[0]));
                
                if (data[0].taf) {
                    console.log('TAF DEBUG - TAF data found in first item');
                    console.log('TAF DEBUG - TAF keys:', Object.keys(data[0].taf));
                } else {
                    console.log('TAF DEBUG - No TAF property in first item');
                }
            }
        } else if (typeof data === 'object') {
            console.log('TAF DEBUG - Data is an object with keys:', Object.keys(data));
            
            if (data.taf) {
                console.log('TAF DEBUG - TAF property found with keys:', Object.keys(data.taf));
            } else {
                console.log('TAF DEBUG - No TAF property in object');
            }
        } else {
            console.log('TAF DEBUG - Unexpected data type');
        }
    } catch (e) {
        console.error('TAF DEBUG - Error analyzing data:', e);
    }
}

// Weather API functions
const WeatherAPI = {
    // Get METAR data for airport(s)
    async getMetar(icao, format = 'json') {
        try {
            const url = `${API_CONFIG.baseUrl}metar?ids=${icao}&format=${format}`;
            console.log('Requesting METAR from proxy:', url);
            
            const response = await fetchWithTimeout(url);
            const data = await parseResponse(response, format);
            
            console.log('Received METAR data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching METAR:', error);
            throw error;
        }
    },
    
    // Get TAF data for airport(s)
    async getTaf(icao, format = 'json') {
        try {
            // According to OpenAPI spec, use the dedicated TAF endpoint
            const url = `${API_CONFIG.baseUrl}taf?ids=${icao}&format=${format}`;
            console.log('Requesting TAF from API:', url);
            
            const response = await fetchWithTimeout(url);
            const data = await parseResponse(response, format);
            
            console.log('Received TAF data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching TAF:', error);
            throw error;
        }
    },
    
    // Get both METAR and TAF data in one call - Improved implementation
    async getMetarAndTaf(icao, format = 'json') {
        try {
            // Using the combined endpoint with the taf parameter as per OpenAPI spec
            const url = `${API_CONFIG.baseUrl}metar?ids=${icao}&format=${format}&taf=true`;
            console.log('Requesting METAR with TAF:', url);
            
            try {
                const response = await fetchWithTimeout(url);
                const data = await parseResponse(response, format);
                
                // Log the data structure for debugging
                console.log('Combined METAR+TAF data structure:', 
                    JSON.stringify(data).substring(0, 300) + '...');
                
                // Verify the response contains expected data
                if (!data || data.length === 0) {
                    throw new Error('No data returned from combined endpoint');
                }
                
                // Check if TAF data is included in the response
                if (data[0] && (data[0].taf || data[0].rawTaf)) {
                    console.log('TAF data found in combined response');
                    
                    // If we have rawTaf instead of taf, create a taf property for compatibility
                    if (data[0].rawTaf && !data[0].taf) {
                        data[0].taf = data[0].rawTaf;
                    }
                } else {
                    console.warn('TAF data not found in the combined response');
                }
                
                return data;
            } catch (combinedError) {
                console.warn('Combined endpoint failed:', combinedError.message);
                console.log('Falling back to separate requests...');
                
                // If combined endpoint fails, use separate requests
                const metarPromise = this.getMetar(icao, format).catch(e => {
                    console.error('METAR fallback error:', e);
                    return null;
                });
                
                const tafPromise = this.getTaf(icao, format).catch(e => {
                    console.error('TAF fallback error:', e);
                    return null;
                });
                
                const [metarData, tafData] = await Promise.all([metarPromise, tafPromise]);
                
                // Construct a combined response
                if (metarData && metarData.length > 0) {
                    // If we got METAR data but not TAF data
                    if (!tafData || tafData.length === 0) {
                        console.warn('TAF data not available for', icao);
                        return metarData;
                    }
                    
                    // Combine the data
                    const combined = JSON.parse(JSON.stringify(metarData));
                    if (combined[0]) {
                        combined[0].taf = tafData[0];
                    }
                    
                    return combined;
                } else if (tafData && tafData.length > 0) {
                    // If we only got TAF data (unlikely but handle it)
                    console.warn('Only TAF data available for', icao);
                    return [{ taf: tafData[0], icaoId: icao }];
                }
                
                // If we got neither
                throw new Error('Neither METAR nor TAF data available');
            }
        } catch (error) {
            console.error('Error fetching METAR and TAF:', error);
            throw error;
        }
    },
    
    // Placeholder for future NOTAM integration
    // This would require a separate API as NOAA doesn't provide NOTAMs
    async getNotams(icao) {
        throw new Error('NOTAM data requires a separate API integration');
    },
    
    // Get radar data URL
    getRadarUrl(region = 'conus') {
        // Map region names to NOAA's radar image regions
        const regions = {
            conus: 'CONUS',
            northeast: 'northeastern',
            southeast: 'southeastern',
            midwest: 'central',
            southern: 'southern',
            southwest: 'southwestern',
            northwest: 'northwestern'
        };
        
        const validRegion = regions[region.toLowerCase()] || regions.conus;
        
        return {
            imageUrl: `https://radar.weather.gov/ridge/standard/${validRegion}_loop.gif`,
            timestamp: new Date().toISOString()
        };
    },
    
    // Format METAR data for display
    formatMetarForDisplay(metar) {
        if (!metar) {
            return {
                stationName: 'Unknown Station',
                icao: 'Unknown',
                conditions: 'No data available',
                html: '<p>No METAR data available</p>'
            };
        }
        
        // Handle both API response formats (from schema)
        const icao = metar.icaoId || metar.station_id || 'Unknown';
        const stationName = metar.name || (metar.site ? `${metar.site}` : 'Unknown Location');
        
        // Extract all the values with fallbacks
        const windDir = metar.wdir !== undefined ? metar.wdir : 
                        (metar.wind_dir_degrees !== undefined ? metar.wind_dir_degrees : '---');
                        
        const windSpeed = metar.wspd !== undefined ? metar.wspd : 
                          (metar.wind_speed_kt !== undefined ? metar.wind_speed_kt : '---');
                          
        const visibility = metar.visib !== undefined ? formatVisibility(metar.visib) : 
                           (metar.visibility_statute_mi !== undefined ? `${metar.visibility_statute_mi}SM` : '---');
                           
        const temp = metar.temp !== undefined ? `${metar.temp}°C` : 
                     (metar.temp_c !== undefined ? `${metar.temp_c}°C` : '---');
                     
        const dewpoint = metar.dewp !== undefined ? `${metar.dewp}°C` : 
                         (metar.dewpoint_c !== undefined ? `${metar.dewpoint_c}°C` : '---');
                         
        const altimeter = metar.altim !== undefined ? `${(metar.altim / 33.86).toFixed(2)} inHg` : 
                          (metar.altim_in_hg !== undefined ? `${metar.altim_in_hg} inHg` : '---');
        
        // Format sky conditions
        let skyConditions = 'Clear';
        if (metar.clouds && metar.clouds.length > 0) {
            skyConditions = formatCloudData(metar.clouds);
        } else if (metar.sky_condition && metar.sky_condition.length > 0) {
            skyConditions = metar.sky_condition.map(layer => 
                `${layer.sky_cover} ${layer.cloud_base_ft_agl || '---'}`
            ).join(' ');
        }
        
        // Format observation time
        const obsTime = metar.reportTime ? formatDateString(metar.reportTime) : 
                        (metar.observation_time ? formatTimestamp(metar.observation_time) : 'Unknown');
        
        // Format raw METAR text
        const rawMetar = metar.rawOb || metar.raw_text || 'No raw METAR available';
        
        // Create HTML for display
        const html = `
            <h3>${icao} - ${stationName}</h3>
            <p>Wind: ${windDir}° at ${windSpeed}kt</p>
            <p>Visibility: ${visibility}</p>
            <p>Ceiling: ${skyConditions}</p>
            <p>Temperature: ${temp} / Dew Point: ${dewpoint}</p>
            <p>Altimeter: ${altimeter}</p>
            <p>Observed: ${obsTime}</p>
            <p>Raw: ${rawMetar}</p>
        `;
        
        return {
            stationName,
            icao,
            windDir,
            windSpeed,
            visibility,
            temp,
            dewpoint,
            altimeter,
            skyConditions,
            obsTime,
            rawMetar,
            html
        };
    },
    
// Enhanced Format TAF data for display with decoded information
formatTafForDisplay(taf) {
    if (!taf) {
        return {
            html: '<div class="forecast-item"><h3>No TAF data available</h3></div>',
            formattedTaf: 'No TAF data available'
        };
    }
    
    console.log('Formatting TAF data:', taf);
    
    // Get the raw TAF text, handling different API response formats
    let rawTaf = '';
    if (typeof taf === 'string') {
        // If the TAF is already a string (like rawTaf)
        rawTaf = taf;
    } else if (taf.rawTAF) {
        rawTaf = taf.rawTAF;
    } else if (taf.raw_text) {
        rawTaf = taf.raw_text;
    } else if (taf.fcsts && taf.fcsts.length > 0 && taf.fcsts[0].raw_text) {
        // Another possible format
        rawTaf = taf.fcsts[0].raw_text;
    } else {
        // Try to extract raw text from a different location in the object
        const tafStr = JSON.stringify(taf);
        const rawMatch = tafStr.match(/"raw_text":"([^"]+)"/);
        if (rawMatch && rawMatch[1]) {
            rawTaf = rawMatch[1];
        } else {
            // If all else fails, convert the object to a readable format
            try {
                rawTaf = 'TAF data format unrecognized: ' + JSON.stringify(taf);
            } catch (e) {
                rawTaf = 'TAF data available but format cannot be displayed';
            }
        }
    }
    
    // Format the TAF text with line breaks for readability
    const formattedTaf = rawTaf.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '<br>$&');
    
    // Decode the TAF into a human-readable format
    const decodedTaf = decodeTaf(rawTaf);
    
    // Create tabbed interface for both raw and decoded TAF
    const html = `
        <div class="forecast-item">
            <h3>TAF</h3>
            <div class="taf-tabs">
                <div class="taf-tab-header">
                    <button id="raw-tab-btn" class="taf-tab-btn active" onclick="switchTafTab('raw')">Raw Format</button>
                    <button id="decoded-tab-btn" class="taf-tab-btn" onclick="switchTafTab('decoded')">Human Readable</button>
                </div>
                <div id="raw-tab" class="taf-tab-content active">
                    <p style="font-family:monospace; font-size: 20px; white-space:pre-wrap;">${formattedTaf}</p>
                </div>
                <div id="decoded-tab" class="taf-tab-content">
                    ${decodedTaf}
                </div>
            </div>
        </div>
        <style>
            .taf-tabs {
                border: 1px solid #1d3557;
                border-radius: 8px;
                overflow: hidden;
            }
            .taf-tab-header {
                display: flex;
                background-color: #0a192f;
                border-bottom: 1px solid #1d3557;
            }
            .taf-tab-btn {
                background: none;
                border: none;
                color: #fff;
                padding: 12px 20px;
                cursor: pointer;
                flex: 1;
                font-size: 16px;
                transition: all 0.3s;
            }
            .taf-tab-btn.active {
                background-color: #64ffda;
                color: #0a192f;
                font-weight: bold;
            }
            .taf-tab-content {
                display: none;
                padding: 15px;
            }
            .taf-tab-content.active {
                display: block;
            }
            .taf-decoded h3 {
                color: #64ffda;
                margin-top: 0;
            }
            .taf-decoded h4 {
                color: #64ffda;
                margin-top: 15px;
                border-bottom: 1px solid #1d3557;
                padding-bottom: 5px;
            }
            .taf-period {
                margin-bottom: 15px;
            }
            .taf-period p {
                margin: 5px 0;
            }
        </style>
    `;
    
    return { html, rawTaf, formattedTaf };
}
};

// Log that the API is ready
console.log('Weather API module loaded');

// Export the API service
window.WeatherAPI = WeatherAPI;