'use strict';

const Constants = require('./Constants');

class Zone {
    constructor(adapter, localApi)
    {
        this.adapter = adapter;
        this.localApi = localApi;
    }

    /**
     * Initialize the zone with the data from the airzone local api
     */
    async init(path, zoneData) {
        this.id = parseInt(zoneData['zoneID']);
        this.name = zoneData.hasOwnProperty('name') ? zoneData['name'] : '';
        this.min_temp = zoneData['minTemp'];
        this.max_temp = zoneData['maxTemp'];
        this.isMaster = zoneData['master'] === 1;

        this.path = path+'.Zone'+this.id;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'device',
            common: {
                name: 'Zone_'+this.id,
                type: 'object',
                read: true,
                write: false,
            },
            native: {},
        });

        const unitRaw = zoneData['units'];
        const unitName = Constants.UNIT_CONVERTER[unitRaw]?.['name'] || 'Unknown';
        const unitUnit = Constants.UNIT_CONVERTER[unitRaw]?.['unit'] || '°C';

        await this.adapter.createPropertyAndInit(this.path, 'id', 'number', true, false, this.id, 'number');
        // Name is writable so user can set custom zone names (API may not return names)
        await this.adapter.createPropertyAndInit(this.path, 'name', 'string', true, true, this.name || `Zone ${this.id}`, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'min_temp', 'number', true, false, this.min_temp, 'value.min');
        await this.adapter.createPropertyAndInit(this.path, 'max_temp', 'number', true, false, this.max_temp, 'value.max');
        await this.adapter.createPropertyAndInit(this.path, 'unitRaw', 'number', true, false, unitRaw, 'value');
        await this.adapter.createPropertyAndInit(this.path, 'unitName', 'string', true, false, unitName, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'unit', 'string', true, false, unitUnit, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'master', 'boolean', true, false, this.isMaster, 'indicator');
        await this.adapter.createProperty(this.path, 'is_on', 'boolean', true, true, 'switch.power');
        await this.adapter.createUnitProperty(this.path, 'current_temperature', 'number', 0, 100, unitUnit, true, false, 'value.temperature');
        await this.adapter.createUnitProperty(this.path, 'current_humidity', 'number', 0, 100, '%', true, false, 'value.humidity');
        await this.adapter.createUnitProperty(this.path, 'target_temperature', 'number', this.min_temp, this.max_temp, unitUnit, true, true, 'value.temperature');

        // Mode property
        await this.adapter.createProperty(this.path, 'mode', 'number', true, true, 'level.mode.hvac');
        await this.adapter.createProperty(this.path, 'modeName', 'string', true, false, 'text');

        // Double setpoint support (if available)
        if (zoneData.hasOwnProperty('setpoint_air_cool')) {
            await this.adapter.createUnitProperty(this.path, 'setpoint_cool', 'number', this.min_temp, this.max_temp, unitUnit, true, true, 'value.temperature');
            await this.adapter.createUnitProperty(this.path, 'setpoint_heat', 'number', this.min_temp, this.max_temp, unitUnit, true, true, 'value.temperature');
            this.adapter.subscribeState(this.path+'.setpoint_cool', this, this.reactToSetpointCoolChange);
            this.adapter.subscribeState(this.path+'.setpoint_heat', this, this.reactToSetpointHeatChange);
        }

        // Fan speed (if available)
        if (zoneData.hasOwnProperty('speed')) {
            await this.adapter.createProperty(this.path, 'fan_speed', 'number', true, true, 'level');
            await this.adapter.createProperty(this.path, 'fan_speed_name', 'string', true, false, 'text');
            this.adapter.subscribeState(this.path+'.fan_speed', this, this.reactToFanSpeedChange);
        }

        // Sleep timer (if available)
        if (zoneData.hasOwnProperty('sleep')) {
            await this.adapter.createProperty(this.path, 'sleep_timer', 'number', true, true, 'level.timer');
            this.adapter.subscribeState(this.path+'.sleep_timer', this, this.reactToSleepTimerChange);
        }

        // Air quality (if available)
        if (zoneData.hasOwnProperty('air_quality')) {
            await this.adapter.createProperty(this.path, 'air_quality', 'number', true, false, 'value');
            await this.adapter.createProperty(this.path, 'air_quality_name', 'string', true, false, 'text');
        }

        // Error indicators
        await this.adapter.createProperty(this.path, 'errors', 'string', true, false, 'text');

        // Register callbacks to react on value changes
        this.adapter.subscribeState(this.path+'.target_temperature', this, this.reactToTargetTemperatureChange);
        this.adapter.subscribeState(this.path+'.is_on', this, this.reactToIsOnChange);
        this.adapter.subscribeState(this.path+'.mode', this, this.reactToModeChange);

        await this.updateData(zoneData);
    }

    /**
     * Synchronized the zone data from airzone into the iobroker data points
     */
    async updateData(zoneData)
    {
        // Only update name if API returns one (don't overwrite user-set names)
        if (zoneData['name']) {
            await this.adapter.updatePropertyValue(this.path, 'name', zoneData['name']);
        }

        this.current_temperature = zoneData['roomTemp'];
        await this.adapter.updatePropertyValue(this.path, 'current_temperature', this.current_temperature);

        this.current_humidity = zoneData['humidity'];
        await this.adapter.updatePropertyValue(this.path, 'current_humidity', this.current_humidity);

        this.target_temperature = zoneData['setpoint'];
        await this.adapter.updatePropertyValue(this.path, 'target_temperature', this.target_temperature);

        this.is_on = zoneData['on'] === 1;
        await this.adapter.updatePropertyValue(this.path, 'is_on', this.is_on);

        // Update mode
        const mode = zoneData['mode'];
        if (mode !== undefined) {
            await this.adapter.updatePropertyValue(this.path, 'mode', mode);
            const modeName = Constants.MODES_CONVERTER[String(mode)]?.['name'] || 'Unknown';
            await this.adapter.updatePropertyValue(this.path, 'modeName', modeName);
        }

        // Update double setpoint values (if available)
        if (zoneData.hasOwnProperty('setpoint_air_cool')) {
            await this.adapter.updatePropertyValue(this.path, 'setpoint_cool', zoneData['setpoint_air_cool']);
        }
        if (zoneData.hasOwnProperty('setpoint_air_heat')) {
            await this.adapter.updatePropertyValue(this.path, 'setpoint_heat', zoneData['setpoint_air_heat']);
        }

        // Update fan speed (if available)
        if (zoneData.hasOwnProperty('speed')) {
            const speed = zoneData['speed'];
            await this.adapter.updatePropertyValue(this.path, 'fan_speed', speed);
            const speedName = Constants.FAN_SPEED_CONVERTER[String(speed)]?.['name'] || 'Unknown';
            await this.adapter.updatePropertyValue(this.path, 'fan_speed_name', speedName);
        }

        // Update sleep timer (if available)
        if (zoneData.hasOwnProperty('sleep')) {
            await this.adapter.updatePropertyValue(this.path, 'sleep_timer', zoneData['sleep']);
        }

        // Update air quality (if available)
        if (zoneData.hasOwnProperty('air_quality')) {
            const quality = zoneData['air_quality'];
            await this.adapter.updatePropertyValue(this.path, 'air_quality', quality);
            const qualityName = Constants.IAQ_SCORE_CONVERTER[String(quality)]?.['name'] || 'Unknown';
            await this.adapter.updatePropertyValue(this.path, 'air_quality_name', qualityName);
        }

        // Update errors (if present)
        if (zoneData.hasOwnProperty('errors')) {
            const errors = zoneData['errors'];
            const errorStr = Array.isArray(errors) ? errors.join(', ') : String(errors);
            await this.adapter.updatePropertyValue(this.path, 'errors', errorStr);
        } else {
            await this.adapter.updatePropertyValue(this.path, 'errors', '');
        }
    }

    /**
     * Is called when the state of target_temperature was changed
     */
    async reactToTargetTemperatureChange(self, id, state) {
        let temperature = state.val;
        if(self.min_temp != undefined && temperature < self.min_temp)
            temperature = self.min_temp;
        if(self.max_temp != undefined && temperature > self.max_temp)
            temperature = self.max_temp;

        await self.sendEvent('setpoint', temperature);
    }

    /**
     * Is called when the state of is_on was changed
     */
    async reactToIsOnChange(self, id, state) {
        if(state.val)
            await self.turn_on();
        else
            await self.turn_off();
    }

    /**
     * Is called when the mode was changed
     */
    async reactToModeChange(self, id, state) {
        await self.sendEvent('mode', state.val);
    }

    /**
     * Is called when the cooling setpoint was changed
     */
    async reactToSetpointCoolChange(self, id, state) {
        let temperature = state.val;
        if(self.min_temp != undefined && temperature < self.min_temp)
            temperature = self.min_temp;
        if(self.max_temp != undefined && temperature > self.max_temp)
            temperature = self.max_temp;
        await self.sendEvent('setpoint_air_cool', temperature);
    }

    /**
     * Is called when the heating setpoint was changed
     */
    async reactToSetpointHeatChange(self, id, state) {
        let temperature = state.val;
        if(self.min_temp != undefined && temperature < self.min_temp)
            temperature = self.min_temp;
        if(self.max_temp != undefined && temperature > self.max_temp)
            temperature = self.max_temp;
        await self.sendEvent('setpoint_air_heat', temperature);
    }

    /**
     * Is called when the fan speed was changed
     */
    async reactToFanSpeedChange(self, id, state) {
        const speed = Math.max(0, Math.min(7, Math.round(state.val)));
        await self.sendEvent('speed', speed);
    }

    /**
     * Is called when the sleep timer was changed
     */
    async reactToSleepTimerChange(self, id, state) {
        // Sleep timer values: 0 = off, 30, 60, 90 minutes
        const validValues = [0, 30, 60, 90];
        let value = state.val;
        if (!validValues.includes(value)) {
            // Find the closest valid value
            value = validValues.reduce((prev, curr) =>
                Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
            );
        }
        await self.sendEvent('sleep', value);
    }

    /**
     * Send event to the airzone cloud
     */
    async sendEvent(option, value) {
        await this.localApi.sendUpdate(this.id, option, value);
    }

    /**
     * Turn zone on
     */
    async turn_on() {
        await this.sendEvent('on', 1);
    }

    /**
     * Turn zone off
     */
    async turn_off() {
        await this.sendEvent('on', 0);
    }
}
module.exports = Zone;