// TAF decoder function
function decodeTaf(rawTaf) {
    if (!rawTaf) {
        return "No TAF data available";
    }
    
    // Split the TAF into sections
    const parts = rawTaf.split(/\s+(FM|BECMG|TEMPO|PROB)/);
    
    // Initialize HTML output
    let decodedHtml = '<div class="taf-decoded">';
    
    // Extract the header
    const header = parts[0].split(' ');
    const station = header[0];
    
    // Extract issue time and validity
    let issueTime = "";
    let validityPeriod = "";
    
    // Look for the issue time (format: DDHHMMZ)
    const issueTimeMatch = parts[0].match(/\d{6}Z/);
    if (issueTimeMatch) {
        const timeStr = issueTimeMatch[0].replace('Z', '');
        const day = timeStr.substr(0, 2);
        const hour = timeStr.substr(2, 2);
        const minute = timeStr.substr(4, 2);
        issueTime = `${day}${getOrdinalSuffix(parseInt(day))} at ${hour}:${minute} UTC`;
    }
    
    // Look for validity period (format: DDDD/DDDD)
    const validityMatch = parts[0].match(/\d{4}\/\d{4}/);
    if (validityMatch) {
        const validity = validityMatch[0];
        const start = validity.split('/')[0];
        const end = validity.split('/')[1];
        
        const startDay = start.substr(0, 2);
        const startHour = start.substr(2, 2);
        const endDay = end.substr(0, 2);
        const endHour = end.substr(2, 2);
        
        validityPeriod = `Valid from the ${startDay}${getOrdinalSuffix(parseInt(startDay))} at ${startHour}:00 UTC until the ${endDay}${getOrdinalSuffix(parseInt(endDay))} at ${endHour}:00 UTC`;
    }
    
    // Create header section
    decodedHtml += `
        <div class="taf-header">
            <h3>Terminal Aerodrome Forecast (TAF)</h3>
            <p><strong>Airport:</strong> ${station}</p>
            <p><strong>Issued:</strong> ${issueTime}</p>
            <p><strong>Validity:</strong> ${validityPeriod}</p>
        </div>
        <div class="taf-periods">
    `;
    
    // Function to decode a TAF section
    function decodeTafSection(section) {
        let result = {
            prefix: '',
            time: '',
            wind: '',
            visibility: '',
            weather: '',
            clouds: '',
            remarks: []
        };
        
        const words = section.trim().split(' ');
        
        // Check if it starts with FM, BECMG, TEMPO, PROB
        if (['FM', 'BECMG', 'TEMPO', 'PROB'].includes(words[0])) {
            result.prefix = words[0];
            
            // For FM sections, parse the time
            if (result.prefix === 'FM' && words[1] && words[1].length === 6) {
                const timeStr = words[1];
                const day = timeStr.substr(0, 2);
                const hour = timeStr.substr(2, 2);
                const minute = timeStr.substr(4, 2);
                result.time = `From the ${day}${getOrdinalSuffix(parseInt(day))} at ${hour}:${minute} UTC`;
                words.splice(0, 2); // Remove the prefix and time
            } else {
                words.splice(0, 1); // Just remove the prefix
            }
        }
        
        // Process the remaining words
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            // Wind information (format: dddssKT or dddssGssKT)
            if (word.match(/\d{3}\d{2}(G\d{2})?KT/)) {
                const dir = word.substring(0, 3);
                const speed = word.substring(3, 5);
                let gust = '';
                
                if (word.includes('G')) {
                    gust = word.substring(word.indexOf('G') + 1, word.indexOf('KT'));
                    result.wind = `Wind from ${dir}° at ${speed} knots, gusting to ${gust} knots`;
                } else {
                    result.wind = `Wind from ${dir}° at ${speed} knots`;
                }
            }
            
            // Visibility
            else if (word === 'P6SM') {
                result.visibility = 'Visibility greater than 6 statute miles';
            }
            else if (word.match(/\d+SM/)) {
                const vis = word.replace('SM', '');
                result.visibility = `Visibility ${vis} statute miles`;
            }
            
            // Cloud conditions
            else if (word.match(/(SKC|CLR|FEW|SCT|BKN|OVC)\d{3}/)) {
                const cover = word.substring(0, 3);
                const height = parseInt(word.substring(3)) * 100;
                
                let coverDesc = '';
                switch(cover) {
                    case 'SKC': coverDesc = 'Sky clear'; break;
                    case 'CLR': coverDesc = 'No clouds detected'; break;
                    case 'FEW': coverDesc = `Few clouds`; break;
                    case 'SCT': coverDesc = `Scattered clouds`; break;
                    case 'BKN': coverDesc = `Broken clouds`; break;
                    case 'OVC': coverDesc = `Overcast`; break;
                }
                
                if (cover !== 'SKC' && cover !== 'CLR') {
                    coverDesc += ` at ${height} feet`;
                }
                
                if (!result.clouds) {
                    result.clouds = coverDesc;
                } else {
                    result.clouds += `, ${coverDesc.toLowerCase()}`;
                }
            }
            
            // Weather phenomena
            else if (word.match(/([-+]?)([A-Z]{2,})/)) {
                const phenomena = {
                    'RA': 'rain',
                    'SN': 'snow',
                    'DZ': 'drizzle',
                    'SHRA': 'rain showers',
                    'SHSN': 'snow showers',
                    'TS': 'thunderstorm',
                    'TSRA': 'thunderstorm with rain',
                    'TSSN': 'thunderstorm with snow',
                    'FG': 'fog',
                    'BR': 'mist',
                    'HZ': 'haze',
                    'FU': 'smoke',
                    'SA': 'sand',
                    'DU': 'dust',
                    'BLDU': 'blowing dust',
                    'BLSA': 'blowing sand',
                    'PO': 'dust/sand whirls',
                    'SQ': 'squalls',
                    'FC': 'funnel cloud',
                    'SS': 'sandstorm',
                    'DS': 'duststorm'
                };
                
                const intensity = {
                    '-': 'light',
                    '+': 'heavy'
                };
                
                // Try to decode the weather
                const intensityChar = word.charAt(0);
                const phenom = intensityChar === '-' || intensityChar === '+' 
                    ? word.substring(1) 
                    : word;
                
                let weatherDesc = phenomena[phenom] || phenom;
                
                if (intensityChar === '-' || intensityChar === '+') {
                    weatherDesc = `${intensity[intensityChar]} ${weatherDesc}`;
                }
                
                if (!result.weather) {
                    result.weather = weatherDesc;
                } else {
                    result.weather += `, ${weatherDesc}`;
                }
            }
            
            // Wind shear (format: WSddd/dddssKT)
            else if (word.match(/WS\d{3}\/\d{5}KT/)) {
                const height = parseInt(word.substring(2, 5)) * 100;
                const dir = word.substring(6, 9);
                const speed = word.substring(9, 11);
                result.remarks.push(`Wind shear at ${height} feet: wind from ${dir}° at ${speed} knots`);
            }
        }
        
        return result;
    }
    
    // Decode the main (first) section
    const mainSection = decodeTafSection(parts[0]);
    decodedHtml += `
        <div class="taf-period">
            <h4>Initial Conditions</h4>
            ${mainSection.wind ? `<p><strong>Wind:</strong> ${mainSection.wind}</p>` : ''}
            ${mainSection.visibility ? `<p><strong>Visibility:</strong> ${mainSection.visibility}</p>` : ''}
            ${mainSection.weather ? `<p><strong>Weather:</strong> ${mainSection.weather}</p>` : ''}
            ${mainSection.clouds ? `<p><strong>Clouds:</strong> ${mainSection.clouds}</p>` : ''}
            ${mainSection.remarks.length > 0 ? 
                `<p><strong>Remarks:</strong> ${mainSection.remarks.join(', ')}</p>` : ''}
        </div>
    `;
    
    // Process FM (from), BECMG (becoming), TEMPO (temporary) sections
    for (let i = 1; i < parts.length; i += 2) {
        if (i + 1 < parts.length) {
            const prefix = parts[i];
            const content = parts[i + 1];
            
            const sectionDecoded = decodeTafSection(`${prefix} ${content}`);
            
            let sectionTitle = '';
            switch (prefix) {
                case 'FM': sectionTitle = 'Changing To'; break;
                case 'BECMG': sectionTitle = 'Gradually Becoming'; break;
                case 'TEMPO': sectionTitle = 'Temporarily'; break;
                case 'PROB': 
                    const probMatch = content.match(/\d{2}/);
                    const probability = probMatch ? probMatch[0] : '40';
                    sectionTitle = `Probability ${probability}%`; 
                    break;
            }
            
            decodedHtml += `
                <div class="taf-period">
                    <h4>${sectionTitle} ${sectionDecoded.time}</h4>
                    ${sectionDecoded.wind ? `<p><strong>Wind:</strong> ${sectionDecoded.wind}</p>` : ''}
                    ${sectionDecoded.visibility ? `<p><strong>Visibility:</strong> ${sectionDecoded.visibility}</p>` : ''}
                    ${sectionDecoded.weather ? `<p><strong>Weather:</strong> ${sectionDecoded.weather}</p>` : ''}
                    ${sectionDecoded.clouds ? `<p><strong>Clouds:</strong> ${sectionDecoded.clouds}</p>` : ''}
                    ${sectionDecoded.remarks.length > 0 ? 
                        `<p><strong>Remarks:</strong> ${sectionDecoded.remarks.join(', ')}</p>` : ''}
                </div>
            `;
        }
    }
    
    decodedHtml += `
        </div>
    </div>`;
    
    return decodedHtml;
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(number) {
    const j = number % 10,
          k = number % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}
