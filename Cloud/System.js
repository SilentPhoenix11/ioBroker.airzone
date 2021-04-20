const Zone = require('./Zone')
const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants');

class System {
    constructor(adapter, airzone)
    {
        this.adapter = adapter;
        this.airzone = airzone;                   
    }

    async updateData(systemData)
    {                               
        this.has_velocity = systemData["has_velocity"];
        await this.adapter.updatePropertyValue(this.path, 'has_velocity', this.has_velocity);
        this.velocity_raw = systemData["velocity"];
        await this.adapter.updatePropertyValue(this.path, 'velocity_raw', this.velocity_raw);
        this.velocity = this.has_velocity ? Constants.VELOCITIES_CONVERTER[this.velocity_raw]["name"] : undefined;
        await this.adapter.updatePropertyValue(this.path, 'velocity', this.velocity);
        this.velocity_description = this.has_velocity ? Constants.VELOCITIES_CONVERTER[this.velocity_raw]["description"] : undefined;
        await this.adapter.updatePropertyValue(this.path, 'velocity_description', this.velocity_description);

        this.has_airflow = systemData["has_airflow"];
        await this.adapter.updatePropertyValue(this.path, 'has_airflow', this.has_airflow);
        this.airflow_raw = systemData["airflow"];
        await this.adapter.updatePropertyValue(this.path, 'airflow_raw', this.airflow_raw);
        this.airflow = this.has_airflow ? Constants.AIRFLOW_CONVERTER[this.airflow_raw]["name"] : undefined;
        await this.adapter.updatePropertyValue(this.path, 'airflow', this.airflow);
        this.airflow_description = this.has_airflow ? Constants.AIRFLOW_CONVERTER[this.airflow_raw]["description"] : undefined;
        await this.adapter.updatePropertyValue(this.path, 'airflow_description', this.airflow_description);

        this.mode_raw = systemData["mode"];
        await this.adapter.updatePropertyValue(this.path, 'mode_raw', this.mode_raw);
        this.mode = Constants.MODES_CONVERTER[this.mode_raw]["name"];
        await this.adapter.updatePropertyValue(this.path, 'mode', this.mode);
        this.mode_description = Constants.MODES_CONVERTER[this.mode_raw]["description"];
        await this.adapter.updatePropertyValue(this.path, 'mode_description', this.mode_description);

        this.eco_raw = systemData["eco"];
        await this.adapter.updatePropertyValue(this.path, 'eco_raw', this.eco_raw);
        this.eco = Constants.ECO_CONVERTER[this.eco_raw]["name"];
        await this.adapter.updatePropertyValue(this.path, 'eco', this.eco);
        this.eco_description = Constants.ECO_CONVERTER[this.mode_raw]["description"];
        await this.adapter.updatePropertyValue(this.path, 'eco_description', this.eco_description);
    }

    async init(path, systemData) {
        this.id = systemData["id"];
        this.name = systemData["name"];        

        this.device_id = systemData["device_id"];   
        this.system_number = systemData["system_number"];   

        this.min_temp = systemData["min_limit"];   
        this.max_temp = systemData["max_limit"];
        
        this.path = path+"."+this.name;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'state',
            common: {
                name: 'System_'+this.name,
                type: 'device',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.adapter.createPropertyAndInit(this.path, 'id', 'string', true, false, this.id);
        await this.adapter.createPropertyAndInit(this.path, 'name', 'string', true, false, this.name);
        await this.adapter.createPropertyAndInit(this.path, 'min_limit', 'string', true, false, this.min_limit);
        await this.adapter.createPropertyAndInit(this.path, 'max_limit', 'string', true, false, this.max_limit);
        await this.adapter.createProperty(this.path, 'has_velocity', 'boolean', true, false);
        await this.adapter.createProperty(this.path, 'velocity_raw', 'string', true, false);
        await this.adapter.createProperty(this.path, 'velocity', 'string', true, false);
        await this.adapter.createProperty(this.path, 'velocity_description', 'string', true, false);
        await this.adapter.createProperty(this.path, 'has_airflow', 'boolean', true, false);
        await this.adapter.createProperty(this.path, 'airflow_raw', 'string', true, false);
        await this.adapter.createProperty(this.path, 'airflow', 'string', true, false);
        await this.adapter.createProperty(this.path, 'airflow_description', 'string', true, false);
        await this.adapter.createProperty(this.path, 'mode_raw', 'string', true, false);
        await this.adapter.createProperty(this.path, 'mode', 'string', true, false);
        await this.adapter.createProperty(this.path, 'mode_description', 'string', true, false);
        await this.adapter.createProperty(this.path, 'eco_raw', 'string', true, false);
        await this.adapter.createProperty(this.path, 'eco', 'string', true, false);
        await this.adapter.createProperty(this.path, 'eco_description', 'string', true, false);

        await this.updateData(systemData);

        if(!await this.load_zones(this.path))
            return false;

        return true;
    }

    async update(systemData) {
        
        await this.updateData(systemData);
        await this.update_zones();        
    }

    async load_zones(path) {

        var zones_relations = await this.get_zones();
        if(zones_relations == undefined)
            return false;

        this.zones = [];        
        for (let index = 0; index < zones_relations.length; index++) {
            var zoneData = zones_relations[index];
            var zone = new Zone(this.adapter, this.airzone, zoneData, path);
            await zone.init(path, zoneData)
            this.zones[index] = zone;            
        }

        return true;
    }

    async update_zones() {
        var zones_relations = await this.get_zones();
        if(zones_relations == undefined)
            return false;

        for (let index = 0; index < zones_relations.length; index++) {
            var zoneData = zones_relations[index];
            var zId = zoneData["id"];
            
            for(let i = 0;i<this.zones.length;i++) {
                if(this.zones[i].id == zId) {
                    await this.zones[i].updateData(zoneData);
                    break;
                }
            }                        
        }

        return true;
    }

    async get_zones() {
        var params = "/?system_id="+this.id+"&format=json&user_email="+this.airzone.username.toLowerCase()+"&user_token="+this.airzone.token;
        var url = this.airzone.base_url.concat(Constants.API_ZONES, params);
        var response = await AsyncRequest.jsonGetRequest(url);

        var errors = response["errors"];
        if(errors)
        {
            this.logError("Failed to load zones of system "+this.name+": (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return false;
        }
        var body = response["body"];
        var zones_relations = JSON.parse(body)["zones"];
        return zones_relations;
    }
}
module.exports = System;