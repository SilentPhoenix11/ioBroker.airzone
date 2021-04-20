const System = require('./System')
const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants');

class Device {
    
    constructor(adapter, airzone)
    {       
        this.adapter = adapter;
        this.airzone = airzone;    
    }

    /**
     * Initialize the device with the data from the airzone cloud
     */
    async init(deviceData) {
        this.id = deviceData["id"];
        this.name = deviceData["name"];
        
        this.path = this.name;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'state',
            common: {
                name: 'Device_'+this.name,
                type: 'device',
                read: true,
                write: false,
            },
            native: {},
        });               

        await this.adapter.createPropertyAndInit(this.path, 'id', 'string', true, false, this.id);
        await this.adapter.createPropertyAndInit(this.path, 'name', 'string', true, false, this.name);
        await this.adapter.createProperty(this.path, 'status', 'string', true, false);
        await this.adapter.createProperty(this.path, 'mac', 'string', true, false);
        await this.adapter.createProperty(this.path, 'pin', 'string', true, false);
        await this.adapter.createProperty(this.path, 'target_temperature', 'number', 0, 100, '°C', true, true);
        
        await this.updateData(deviceData);

        if(!await this.load_systems(this.path))
            return false;

        return true;
    }

    /**
     * Synchronized the device data from airzone into the iobroker data points
     */
    async updateData(deviceData)
    {                
        this.status = deviceData["status"];
        await this.adapter.updatePropertyValue(this.path, 'status', this.status);

        this.mac = deviceData["mac"];
        await this.adapter.updatePropertyValue(this.path, 'mac', this.mac);

        this.pin = deviceData["pin"];
        await this.adapter.updatePropertyValue(this.path, 'pin', this.pin);

        this.target_temperature = deviceData["consign"];
        await this.adapter.updatePropertyValue(this.path, 'target_temperature', this.target_temperature);
    }

    /**
     * Synchronized the device data from airzone into the iobroker data points and call update for all sub systems
     */
    async update(deviceData) {
        
        await this.updateData(deviceData);
        await this.update_systems();        
    }

    /**
     * Load and initialize the systems of this device from airzone cloud
     */
    async load_systems(path) {
        var systems_relations = await this.get_systems();
        if(systems_relations == undefined)
            return false;

        this.systems = [];
        let systemsCount = 0;
        for (let index = 0; index < systems_relations.length; index++) {
            var systemData = systems_relations[index];
            var system = new System(this.adapter, this.airzone);
            if(await system.init(path, systemData))
            {
                this.systems[systemsCount] = system;
                systemsCount++;
            }
        }

        return true;
    }

    /**
     * Update systems with the current system data from airzone cloud
     */
    async update_systems() {
        var systems_relations = await this.get_systems();
        if(systems_relations == undefined)
            return false;

        for (let index = 0; index < systems_relations.length; index++) {
            var systemData = systems_relations[index];
            var sId = systemData["id"];
            
            for(let i = 0;i<this.systems.length;i++) {
                if(this.systems[i].id == sId) {
                    await this.systems[i].update(systemData);
                    break;
                }
            }                        
        }

        return true;
    }

    /**
     * Web request to get the systems of this system
     */
    async get_systems() {
        var params = "/?device_id="+this.id+"&format=json&user_email="+this.airzone.username.toLowerCase()+"&user_token="+this.airzone.token;
        var url = this.airzone.base_url.concat(Constants.API_SYSTEMS, params);
        var response = await AsyncRequest.jsonGetRequest(url);

        var errors = response["errors"];
        if(errors)
        {
            this.airzone.logError("Failed to load systems of "+this.name+": (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return false;
        }
        var body = response["body"];
        var systems_relations = JSON.parse(body)["systems"];
        return systems_relations;
    }    
}
module.exports = Device;