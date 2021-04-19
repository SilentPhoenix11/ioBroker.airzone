const Constants = require('./Constants');

class Zone {
    constructor(airzone, zoneData)
    {
        this.airzone = airzone;

        this.id = zoneData["id"];
        this.name = zoneData["name"];                

        this.device_id = zoneData["device_id"];
        this.system_number = zoneData["system_number"];
        this.zone_number = zoneData["zone_number"];

        this.min_temp = zoneData["lower_conf_limit"];
        this.max_temp = zoneData["upper_conf_limit"];        

        this.updateData(zoneData);
    }

    updateData(zoneData)
    { 
        this.current_temperature = zoneData["temp"];
        this.current_humidity = zoneData["humidity"];
        this.target_temperature = zoneData["consign"];
        
        this.is_on = zoneData["state"] == "1";
                        
        this.mode_raw = zoneData["mode"];
        this.mode = Constants.MODES_CONVERTER[this.mode_raw]["name"];
        this.mode_description = Constants.MODES_CONVERTER[this.mode_raw]["description"];        
    }
}
module.exports = Zone;