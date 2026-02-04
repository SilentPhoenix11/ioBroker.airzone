'use strict';

module.exports = Object.freeze({
    // Operating modes - Mode 7 (Auto) added for newer firmware
    MODES_CONVERTER: {
        '1': { 'name': 'Stop' },
        '2': { 'name': 'Cooling' },
        '3': { 'name': 'Heating' },
        '4': { 'name': 'Fan' },
        '5': { 'name': 'Dry' },
        '7': { 'name': 'Auto' }
    },

    // Temperature units
    UNIT_CONVERTER: {
        '0': { 'name': 'Celsius', 'unit': '°C' },
        '1': { 'name': 'Fahrenheit', 'unit': '°F' }
    },

    // Fan speed levels (0 = Auto, 1-7 = Manual speeds)
    FAN_SPEED_CONVERTER: {
        '0': { 'name': 'Auto' },
        '1': { 'name': 'Speed 1 (Lowest)' },
        '2': { 'name': 'Speed 2' },
        '3': { 'name': 'Speed 3' },
        '4': { 'name': 'Speed 4' },
        '5': { 'name': 'Speed 5' },
        '6': { 'name': 'Speed 6' },
        '7': { 'name': 'Speed 7 (Highest)' }
    },

    // Indoor Air Quality score mapping
    IAQ_SCORE_CONVERTER: {
        '1': { 'name': 'Good', 'color': 'green' },
        '2': { 'name': 'Medium', 'color': 'yellow' },
        '3': { 'name': 'Bad', 'color': 'orange' },
        '4': { 'name': 'Very Bad', 'color': 'red' }
    },

    // API Endpoints
    API_ENDPOINTS: {
        HVAC: '/api/v1/hvac',
        SYSTEMS: '/api/v1/systems',
        ZONES: '/api/v1/zones',
        WEBSERVER: '/api/v1/webserver',
        VERSION: '/api/v1/version',
        IAQ: '/api/v1/iaq'
    },

    // Error codes from the API
    ERROR_CODES: {
        '-1': 'System error',
        '1': 'Invalid parameter',
        '2': 'Invalid value',
        '3': 'Out of range',
        '4': 'Permission denied'
    }
});