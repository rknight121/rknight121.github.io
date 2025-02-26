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
        return 'Invalid date';
    }
}

// Convert string date to formatted date
function formatDateString(dateStr) {
    if (!dateStr) return 'Unknown';
    
    try {
        const date = new Date(dateStr);
        return date.toUTCString();
    } catch (error) {
        return dateStr;
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
            const url = `${API_CONFIG.baseUrl}taf?ids=${icao}&format=${format}`;
            console.log('Requesting TAF from proxy:', url);
            
            const response = await fetchWithTimeout(url);
            const data = await parseResponse(response, format);
            
            console.log('Received TAF data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching TAF:', error);
            throw error;
        }
    },
    
// Get both METAR and TAF data
async getMetarAndTaf(icao, format = 'json') {
    try {
        // First get METAR data
        const metarUrl = `${API_CONFIG.baseUrl}metar?ids=${icao}&format=${format}`;
        const metarResponse = await fetchWithTimeout(metarUrl);
        const metarData = await parseResponse(metarResponse, format);
        
        console.log('METAR data received:', metarData);
        
        // Then get TAF data
        try {
            const tafUrl = `${API_CONFIG.baseUrl}taf?ids=${icao}&format=${format}`;
            const tafResponse = await fetchWithTimeout(tafUrl);
            const tafData = await parseResponse(tafResponse, format);
            
            console.log('TAF data received:', tafData);
            
            // Combine the data
            if (metarData && metarData.length > 0 && tafData && tafData.length > 0) {
                // Check if we need to add the TAF to the METAR object or if it's already there
                if (!metarData[0].taf && !metarData[0].rawTaf) {
                    metarData[0].taf = tafData[0];
                }
            }
        } catch (error) {
            console.warn('Error getting TAF data:', error);
            // Continue with just METAR data
        }
        
        return metarData;
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
    
// Format TAF data for display
formatTafForDisplay(taf) {
    if (!taf) {
        return {
            html: '<div class="forecast-item"><h3>No TAF data available</h3></div>'
        };
    }
    
    // Format the TAF text with line breaks for readability
    const rawTaf = taf.rawTaf || taf.rawTAF || taf.raw_text || '';
    const formattedTaf = rawTaf.replace(/\s(FM|BECMG|TEMPO|PROB)/g, '<br>$&');
    
    const html = `
        <div class="forecast-item">
            <h3>TAF</h3>
            <p style="font-family:monospace; white-space:pre-wrap;">${formattedTaf}</p>
        </div>
    `;
    
    return { html, rawTaf, formattedTaf };
}
};

// Log that the API is ready
console.log('Weather API module loaded');

// Export the API service
window.WeatherAPI = WeatherAPI;