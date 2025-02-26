// Weather API service module for Aviation Weather Center (NOAA) API

// Configuration
const API_CONFIG = {
    baseUrl: 'https://aviationweather.gov/api/data/',
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

// Weather API functions
const WeatherAPI = {
    // Get METAR data for an airport
    async getMetar(icao) {
        try {
            const response = await fetchWithTimeout(
                `${API_CONFIG.baseUrl}metar?ids=${icao}&format=json`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching METAR:', error);
            throw error;
        }
    },
    
    // Get TAF data for an airport
    async getTaf(icao) {
        try {
            const response = await fetchWithTimeout(
                `${API_CONFIG.baseUrl}taf?ids=${icao}&format=json`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching TAF:', error);
            throw error;
        }
    },
    
    // Get both METAR and TAF data in one call
    async getMetarAndTaf(icao) {
        try {
            const response = await fetchWithTimeout(
                `${API_CONFIG.baseUrl}metar?ids=${icao}&format=json&taf=true`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching METAR and TAF:', error);
            throw error;
        }
    },
    
    // Get NOTAMs for an airport
    async getNotams(icao) {
        try {
            // For NOTAMs, we would typically use a different API
            // For example FAA NOTAM API or a third-party service
            // This is a placeholder - you would need to implement a real NOTAM API integration
            
            // Simulating a NOTAM response for demonstration purposes
            return {
                data: [
                    {
                        icao: icao,
                        number: '01/001',
                        text: `${icao} RWY 13L/31R CLSD WEF 2502171300-2503032359`
                    },
                    {
                        icao: icao,
                        number: '01/002',
                        text: `${icao} NAV ILS RWY 04R LOC/GS U/S WEF 2502180900-2502181700`
                    }
                ]
            };
        } catch (error) {
            console.error('Error fetching NOTAMs:', error);
            throw error;
        }
    },
    
    // Get radar data (using NOAA's radar images)
    async getRadarUrl(region = 'conus') {
        // Return the URL for the NOAA radar image
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
    
    // Get airport information by ICAO code
    async getAirportInfo(icao) {
        try {
            // Since the NOAA API doesn't have a direct airport info endpoint,
            // we can extract it from the METAR data
            const metarData = await this.getMetar(icao);
            
            if (!metarData || metarData.length === 0) {
                throw new Error('Airport not found');
            }
            
            // Extract airport info from the METAR data
            const airport = metarData[0];
            
            return {
                icao: airport.icao_id || icao,
                name: airport.site || icao,
                lat: airport.latitude || null,
                lon: airport.longitude || null
            };
        } catch (error) {
            console.error('Error getting airport info:', error);
            throw error;
        }
    }
};

// Export the API service
window.WeatherAPI = WeatherAPI;
