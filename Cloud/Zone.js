const Constants = require('./Constants');

class Zone {
    constructor(adapter, airzone)
    {
        this.adapter = adapter;
        this.airzone = airzone;                       
    }

    async init(path, zoneData) {
        this.id = zoneData["id"];
        this.name = zoneData["name"];

        this.device_id = zoneData["device_id"];
        this.system_number = zoneData["system_number"];
        this.zone_number = zoneData["zone_number"];

        this.min_temp = zoneData["lower_conf_limit"];
        this.max_temp = zoneData["upper_conf_limit"]; 
        
        this.path = path+"."+this.name;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'state',
            common: {
                name: 'Zone_'+this.name,
                type: 'device',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.adapter.createPropertyAndInit(this.path, 'id', 'string', true, false, this.id);
        await this.adapter.createPropertyAndInit(this.path, 'name', 'string', true, false, this.name);
        await this.adapter.createPropertyAndInit(this.path, 'min_temp', 'number', true, false, this.min_temp);
        await this.adapter.createPropertyAndInit(this.path, 'max_temp', 'number', true, false, this.max_temp);
        await this.adapter.createProperty(this.path, 'current_temperature', 'number', 0, 100, '°C', true, false);
        await this.adapter.createProperty(this.path, 'current_humidity', 'number', 0, 100, '%', true, false);
        await this.adapter.createProperty(this.path, 'target_temperature', 'number', this.min_temp, this.max_temp, '°C', true, true);
        await this.adapter.createProperty(this.path, 'is_on', 'boolean', true, false);
        await this.adapter.createProperty(this.path, 'mode_raw', 'number', true, false);
        await this.adapter.createProperty(this.path, 'mode', 'string', true, false);
        await this.adapter.createProperty(this.path, 'mode_description', 'string', true, false);

        await this.updateData(zoneData);
    }

    async updateData(zoneData)
    { 
        this.current_temperature = zoneData["temp"];
        await this.adapter.updatePropertyValue(this.path, 'current_temperature', this.current_temperature);

        this.current_humidity = zoneData["humidity"];
        await this.adapter.updatePropertyValue(this.path, 'current_humidity', this.current_humidity);

        this.target_temperature = zoneData["consign"];
        await this.adapter.updatePropertyValue(this.path, 'target_temperature', this.target_temperature);
        
        this.is_on = zoneData["state"] == "1";
        await this.adapter.updatePropertyValue(this.path, 'is_on', this.is_on);
                        
        this.mode_raw = zoneData["mode"];
        await this.adapter.updatePropertyValue(this.path, 'mode_raw', this.mode_raw);

        this.mode = Constants.MODES_CONVERTER[this.mode_raw]["name"];
        await this.adapter.updatePropertyValue(this.path, 'mode', this.mode);

        this.mode_description = Constants.MODES_CONVERTER[this.mode_raw]["description"];        
        await this.adapter.updatePropertyValue(this.path, 'mode_description', this.mode_description);
    }    
}
module.exports = Zone;