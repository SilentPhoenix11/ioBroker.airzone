const Constants = require('./Constants');

class Zone {
    constructor(adapter, airzone)
    {
        this.adapter = adapter;
        this.airzone = airzone;                       
    }

    /**
     * Initialize the zone with the data from the airzone cloud
     */
    async init(path, zoneData) {
        this.id = zoneData['id'];
        this.name = zoneData['name'];

        this.device_id = zoneData['device_id'];
        this.system_number = zoneData['system_number'];
        this.zone_number = zoneData['zone_number'];

        this.min_temp = zoneData['lower_conf_limit'];
        this.max_temp = zoneData['upper_conf_limit']; 
        
        this.path = path+'.'+this.name;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'device',
            common: {
                name: 'Zone_'+this.name,
                type: 'object',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.adapter.createPropertyAndInit(this.path, 'id', 'string', true, false, this.id, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'name', 'string', true, false, this.name, 'text');
        await this.adapter.createPropertyAndInit(this.path, 'min_temp', 'number', true, false, this.min_temp, 'value.min');
        await this.adapter.createPropertyAndInit(this.path, 'max_temp', 'number', true, false, this.max_temp, 'value.max');
        await this.adapter.createUnitProperty(this.path, 'current_temperature', 'number', 0, 100, '°C', true, false, 'value.temperature');
        await this.adapter.createUnitProperty(this.path, 'current_humidity', 'number', 0, 100, '%', true, false, 'value.humidity');
        await this.adapter.createUnitProperty(this.path, 'target_temperature', 'number', this.min_temp, this.max_temp, '°C', true, true, 'state');
        await this.adapter.createProperty(this.path, 'is_on', 'boolean', true, false, 'switch.power');
        await this.adapter.createProperty(this.path, 'mode_raw', 'number', true, false, 'value');
        await this.adapter.createProperty(this.path, 'mode', 'string', true, false, 'text');
        await this.adapter.createProperty(this.path, 'mode_description', 'string', true, false, 'text');

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
        this.current_temperature = zoneData['temp'];
        await this.adapter.updatePropertyValue(this.path, 'current_temperature', this.current_temperature);

        this.current_humidity = zoneData['humidity'];
        await this.adapter.updatePropertyValue(this.path, 'current_humidity', this.current_humidity);

        this.target_temperature = zoneData['consign'];
        await this.adapter.updatePropertyValue(this.path, 'target_temperature', this.target_temperature);
                                       
        this.mode_raw = zoneData['mode'];
        await this.adapter.updatePropertyValue(this.path, 'mode_raw', this.mode_raw);

        this.mode = Constants.MODES_CONVERTER[this.mode_raw]['name'];
        await this.adapter.updatePropertyValue(this.path, 'mode', this.mode);

        this.mode_description = Constants.MODES_CONVERTER[this.mode_raw]['description'];        
        await this.adapter.updatePropertyValue(this.path, 'mode_description', this.mode_description);

        this.is_on = zoneData['state'] == '1' && this.mode_raw > 0;
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

        await self.sendEvent('consign', temperature);
    }

    /**
     * Is called when the state of is_on was changed
     */
    async reactToIsOnChange(self, id, state) {        
        if(self.mode_raw < 1)
            return;

        if(state.val)
            await self.turn_on();
        else
            await self.turn_off();
    }

    /**
     * Send event to the airzone cloud
     */
    async sendEvent(option, value) {
        var payload = {
            'event': {
                'cgi': 'modzona',
                'device_id': this.device_id,
                'system_number': this.system_number,
                'zone_number': this.zone_number,
                'option': option,
                'value': value,
            }
        };
        await this.airzone.sendEvent(payload);
    }

    /**
     * Turn zone on
     */
    async turn_on() {
        await this.sendEvent('state', 1);
    }

    /**
     * Turn zone off
     */
     async turn_off() {
        await this.sendEvent('state', 0);
    }
}
module.exports = Zone;