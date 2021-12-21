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

        var unitRaw = zoneData['units']; 
        var unitName = Constants.UNIT_CONVERTER[unitRaw]["name"];
        var unitUnit = Constants.UNIT_CONVERTER[unitRaw]["unit"];

        await this.adapter.createPropertyAndInit(this.path, 'id', 'number', true, false, this.id, 'number');
        await this.adapter.createPropertyAndInit(this.path, 'name', 'string', true, false, this.name, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'min_temp', 'number', true, false, this.min_temp, 'value.min');
        await this.adapter.createPropertyAndInit(this.path, 'max_temp', 'number', true, false, this.max_temp, 'value.max');
        await this.adapter.createPropertyAndInit(this.path, 'unitRaw', 'string', true, false, unitRaw, 'number');
        await this.adapter.createPropertyAndInit(this.path, 'unitName', 'string', true, false, unitName, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'unit', 'string', true, false, unitUnit, 'text');
        await this.adapter.createProperty(this.path, 'is_on', 'boolean', true, false, 'switch.power');
        await this.adapter.createUnitProperty(this.path, 'current_temperature', 'number', 0, 100, unitUnit, true, false, 'value.temperature');
        await this.adapter.createUnitProperty(this.path, 'current_humidity', 'number', 0, 100, '%', true, false, 'value.humidity');
        await this.adapter.createUnitProperty(this.path, 'target_temperature', 'number', this.min_temp, this.max_temp, unitUnit, true, true, 'state');
        
        // Register callbacks to react on value changes
        this.adapter.subscribeState(this.path+'.target_temperature', this, this.reactToTargetTemperatureChange);
        this.adapter.subscribeState(this.path+'.is_on', this, this.reactToIsOnChange);

        await this.updateData(zoneData);
    }

    /**
     * Synchronized the zone data from airzone into the iobroker data points
     */
    async updateData(zoneData)
    { 
        this.current_temperature = zoneData['roomTemp'];
        await this.adapter.updatePropertyValue(this.path, 'current_temperature', this.current_temperature);

        this.current_humidity = zoneData['humidity'];
        await this.adapter.updatePropertyValue(this.path, 'current_humidity', this.current_humidity);

        this.target_temperature = zoneData['setpoint'];
        await this.adapter.updatePropertyValue(this.path, 'target_temperature', this.target_temperature);

        this.is_on = zoneData['on'] == '1';
        await this.adapter.updatePropertyValue(this.path, 'is_on', this.is_on);
    }    

    /**
     * Is called when the state of target_temperature was changed
     */
    async reactToTargetTemperatureChange(self, id, state) {
        var temperature = state.val;
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
     * Send event to the airzone cloud
     */
    async sendEvent(option, value) {
        await this.localApi.sendUpdate(this.id, option, value)        
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