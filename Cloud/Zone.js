const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants');

class Zone {
    constructor(airzone, zoneData)
    {
        this.airzone = airzone;

        this.id = zoneData["id"];
        this.name = zoneData["name"]; 
        
        this.current_temperature = zoneData["temp"];
        this.current_humidity = zoneData["humidity"];
        this.target_temperature = zoneData["consign"];
        this.max_temp = zoneData["upper_conf_limit"];
        this.min_temp = zoneData["lower_conf_limit"];
        this.is_on = zoneData["state"] == "1";
        this.zone_number = zoneData["zone_number"];
        
        this.mode_raw = zoneData["mode"];
        this.mode = Constants.MODES_CONVERTER[this.mode_raw]["name"];
        this.mode_description = Constants.MODES_CONVERTER[this.mode_raw]["description"];        
    }
}
module.exports = Zone;