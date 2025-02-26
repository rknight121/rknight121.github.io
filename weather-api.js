// Weather API service module for NOAA Aviation Weather API
// Based on the official OpenAPI specifications

// Configuration
const API_CONFIG = {
    baseUrl: 'https://proxy-server4v.vercel.app/api/',
    timeout: 10000 // 10 seconds
};

// Error handling for fetch requests
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const { timeout = API_CONFIG.timeout } = options;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
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
}

// Weather API functions
const WeatherAPI = {
   // Get METAR data for airport(s)
async getMetar(icao, format = 'json') {
    try {
        const url = `${API_CONFIG.baseUrl}metar?ids=${icao}&format=${format}`;
        const response = await fetchWithTimeout(url);
        return await parseResponse(response, format);
    } catch (error) {
        console.error('Error fetching METAR:', error);
        throw error;
    }
},

// Get TAF data for airport(s)
async getTaf(icao, format = 'json') {
    try {
        const url = `${API_CONFIG.baseUrl}taf?ids=${icao}&format=${format}`;
        const response = await fetchWithTimeout(url);
        return await parseResponse(response, format);
    } catch (error) {
        console.error('Error fetching TAF:', error);
        throw error;
    }
},

// Get both METAR and TAF data in one call
async getMetarAndTaf(icao, format = 'json') {
    try {
        // Since our proxy doesn't have a combined endpoint, fetch both separately
        const [metarData, tafData] = await Promise.all([
            this.getMetar(icao, format),
            this.getTaf(icao, format)
        ]);
        
        // Add TAF data to the first METAR entry
        if (metarData.length > 0 && tafData.length > 0) {
            metarData[0].taf = tafData[0];
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
    }
};

// Export the API service
window.WeatherAPI = WeatherAPI;
