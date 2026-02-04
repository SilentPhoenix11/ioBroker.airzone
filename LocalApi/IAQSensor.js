'use strict';

const Constants = require('./Constants');

/**
 * Indoor Air Quality (IAQ) Sensor class
 * Handles air quality sensor data from the Airzone system
 */
class IAQSensor {
    constructor(adapter, localApi) {
        this.adapter = adapter;
        this.localApi = localApi;
    }

    /**
     * Initialize the IAQ sensor with data from the airzone local api
     * @param {string} path - Base path for the sensor objects
     * @param {object} iaqData - IAQ sensor data from the API
     */
    async init(path, iaqData) {
        this.systemId = parseInt(iaqData['system_id'] || iaqData['systemID'] || 1);
        this.zoneId = parseInt(iaqData['zone_id'] || iaqData['zoneID'] || 0);

        this.path = path + '.IAQ_Zone' + this.zoneId;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'device',
            common: {
                name: 'IAQ_Sensor_Zone_' + this.zoneId,
                type: 'object',
                read: true,
                write: false,
            },
            native: {},
        });

        // IAQ Index (overall air quality score 1-4)
        await this.adapter.createProperty(this.path, 'iaq_index', 'number', true, false, 'value');
        await this.adapter.createProperty(this.path, 'iaq_score_name', 'string', true, false, 'text');

        // CO2 level
        await this.adapter.createUnitProperty(this.path, 'co2', 'number', 0, 5000, 'ppm', true, false, 'value.co2');

        // Temperature from IAQ sensor
        await this.adapter.createUnitProperty(this.path, 'temperature', 'number', -50, 100, '°C', true, false, 'value.temperature');

        // Humidity from IAQ sensor
        await this.adapter.createUnitProperty(this.path, 'humidity', 'number', 0, 100, '%', true, false, 'value.humidity');

        // PM2.5 (Particulate Matter)
        await this.adapter.createUnitProperty(this.path, 'pm2_5', 'number', 0, 1000, 'µg/m³', true, false, 'value');

        // PM10 (Particulate Matter)
        await this.adapter.createUnitProperty(this.path, 'pm10', 'number', 0, 1000, 'µg/m³', true, false, 'value');

        // TVOC (Total Volatile Organic Compounds)
        await this.adapter.createUnitProperty(this.path, 'tvoc', 'number', 0, 10000, 'ppb', true, false, 'value');

        // Atmospheric pressure
        await this.adapter.createUnitProperty(this.path, 'pressure', 'number', 800, 1200, 'hPa', true, false, 'value.pressure');

        // Ventilation mode
        await this.adapter.createProperty(this.path, 'ventilation_mode', 'number', true, false, 'value');

        await this.updateData(iaqData);
    }

    /**
     * Update the IAQ sensor data
     * @param {object} iaqData - IAQ sensor data from the API
     */
    async updateData(iaqData) {
        // IAQ Index
        if (iaqData.hasOwnProperty('iaq_index')) {
            const iaqIndex = iaqData['iaq_index'];
            await this.adapter.updatePropertyValue(this.path, 'iaq_index', iaqIndex);

            const scoreName = Constants.IAQ_SCORE_CONVERTER[iaqIndex.toString()]?.name || 'Unknown';
            await this.adapter.updatePropertyValue(this.path, 'iaq_score_name', scoreName);
        }

        // CO2
        if (iaqData.hasOwnProperty('co2_value')) {
            await this.adapter.updatePropertyValue(this.path, 'co2', iaqData['co2_value']);
        }

        // Temperature
        if (iaqData.hasOwnProperty('iaq_temp_value')) {
            await this.adapter.updatePropertyValue(this.path, 'temperature', iaqData['iaq_temp_value']);
        }

        // Humidity
        if (iaqData.hasOwnProperty('iaq_humidity_value')) {
            await this.adapter.updatePropertyValue(this.path, 'humidity', iaqData['iaq_humidity_value']);
        }

        // PM2.5
        if (iaqData.hasOwnProperty('pm2_5_value')) {
            await this.adapter.updatePropertyValue(this.path, 'pm2_5', iaqData['pm2_5_value']);
        }

        // PM10
        if (iaqData.hasOwnProperty('pm10_value')) {
            await this.adapter.updatePropertyValue(this.path, 'pm10', iaqData['pm10_value']);
        }

        // TVOC
        if (iaqData.hasOwnProperty('tvoc_value')) {
            await this.adapter.updatePropertyValue(this.path, 'tvoc', iaqData['tvoc_value']);
        }

        // Pressure
        if (iaqData.hasOwnProperty('pressure_value')) {
            await this.adapter.updatePropertyValue(this.path, 'pressure', iaqData['pressure_value']);
        }

        // Ventilation mode
        if (iaqData.hasOwnProperty('iaq_mode_vent')) {
            await this.adapter.updatePropertyValue(this.path, 'ventilation_mode', iaqData['iaq_mode_vent']);
        }
    }
}

module.exports = IAQSensor;
