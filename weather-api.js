// Weather API service module for NOAA Aviation Weather API
// Based on the official OpenAPI specifications

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
            const text = await response.text();
            return text; // Return as text, client can parse XML if needed
        case 'html':
            return await response.text();
        case 'raw':
        default:
            return await response.text();
    }
}

// Build URL with query parameters
function buildUrl(endpoint, params = {}) {
    const url = new URL(API_CONFIG.baseUrl + endpoint);
    
    // Add each parameter to the URL
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            url.searchParams.append(key, value);
        }
    });
    
    return url.toString();
}

// Weather API functions based on OpenAPI spec
const WeatherAPI = {
    // Get METAR data for airport(s)
    // OpenAPI Path: /api/data/metar
    async getMetar(options = {}) {
        try {
            const params = {
                ids: options.ids || '',
                format: options.format || 'json',
                hours: options.hours || null,
                taf: options.includeTaf || false,
                bbox: options.bbox || null,
                date: options.date || null
            };
            
            const url = buildUrl('metar', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching METAR:', error);
            throw error;
        }
    },
    
    // Get TAF data for airport(s)
    // OpenAPI Path: /api/data/taf
    async getTaf(options = {}) {
        try {
            const params = {
                ids: options.ids || '',
                format: options.format || 'json',
                metar: options.includeMetar || false,
                bbox: options.bbox || null,
                time: options.time || 'valid',
                date: options.date || null
            };
            
            const url = buildUrl('taf', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching TAF:', error);
            throw error;
        }
    },
    
    // Get both METAR and TAF data in one call
    // Uses the METAR endpoint with taf=true
    async getMetarAndTaf(icao, format = 'json') {
        try {
            return await this.getMetar({
                ids: icao,
                format: format,
                includeTaf: true
            });
        } catch (error) {
            console.error('Error fetching METAR and TAF:', error);
            throw error;
        }
    },
    
    // Get PIREP (Pilot Reports)
    // OpenAPI Path: /api/data/pirep
    async getPirep(options = {}) {
        try {
            const params = {
                id: options.id || '',
                format: options.format || 'json',
                age: options.hoursBack || 2,
                distance: options.distance || null,
                level: options.level || null,
                inten: options.intensity || null,
                date: options.date || null
            };
            
            const url = buildUrl('pirep', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching PIREPs:', error);
            throw error;
        }
    },
    
    // Get AIRMETs/SIGMETs
    // OpenAPI Path: /api/data/airsigmet
    async getAirSigmet(options = {}) {
        try {
            const params = {
                format: options.format || 'json',
                type: options.type || null,
                hazard: options.hazard || null,
                level: options.level || null,
                date: options.date || null
            };
            
            const url = buildUrl('airsigmet', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching AIRMETs/SIGMETs:', error);
            throw error;
        }
    },
    
    // Get International SIGMETs
    // OpenAPI Path: /api/data/isigmet
    async getInternationalSigmet(options = {}) {
        try {
            const params = {
                format: options.format || 'json',
                hazard: options.hazard || null,
                level: options.level || null,
                date: options.date || null
            };
            
            const url = buildUrl('isigmet', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching International SIGMETs:', error);
            throw error;
        }
    },
    
    // Get G-AIRMETs
    // OpenAPI Path: /api/data/gairmet
    async getGAirmet(options = {}) {
        try {
            const params = {
                type: options.type || null,
                format: options.format || 'json',
                hazard: options.hazard || null,
                date: options.date || null
            };
            
            const url = buildUrl('gairmet', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching G-AIRMETs:', error);
            throw error;
        }
    },
    
    // Get Station Info
    // OpenAPI Path: /api/data/stationinfo
    async getStationInfo(options = {}) {
        try {
            const params = {
                ids: options.ids || '',
                bbox: options.bbox || null,
                format: options.format || 'json'
            };
            
            const url = buildUrl('stationinfo', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching station info:', error);
            throw error;
        }
    },
    
    // Get Airport Info
    // OpenAPI Path: /api/data/airport
    async getAirportInfo(options = {}) {
        try {
            const params = {
                ids: options.ids || '',
                bbox: options.bbox || null,
                format: options.format || 'json'
            };
            
            const url = buildUrl('airport', params);
            const response = await fetchWithTimeout(url);
            
            return await parseResponse(response, params.format);
        } catch (error) {
            console.error('Error fetching airport info:', error);
            throw error;
        }
    },
    
    // Get NOTAMs
    // Since NOAA doesn't have a direct NOTAM API, this is a placeholder
    // In a real application, you would use the FAA NOTAM API or a third-party service
    async getNotams(icao) {
        try {
            // This is a mock implementation
            console.log(`Getting NOTAMs for ${icao} (mock data)`);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Return mock data
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
                    },
                    {
                        icao: icao,
                        number: '01/003',
                        text: `${icao} OBST TOWER LGT (ASR 1234567) 404213N 0735910W (5.2NM SE ${icao}) 1234.8FT (123.8FT AGL) U/S WEF 2502190000-2503010000`
                    }
                ]
            };
        } catch (error) {
            console.error('Error fetching NOTAMs:', error);
            throw error;
        }
    },
    
    // Get radar data URL
    // This is not directly in the NOAA Aviation Weather API but uses NOAA's radar imagery
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
    }
};

// Export the API service
window.WeatherAPI = WeatherAPI;
