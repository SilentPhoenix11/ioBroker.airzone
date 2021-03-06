'use strict';

const AsyncRequest = require('../Utils/asyncRequest');
const System = require('./System')

// Allow to connect to Airzone local API

let log;
let adapter;
class AirzoneLocalApi {
    constructor(a, local_ip)
    {
        adapter = a;
        log = a.log;        
        this.local_ip = local_ip;
    }

    async init(system_id) {
        
        this.system = new System(adapter, this, system_id);
        await this.system.init();
    }
    
    async update() {
        if(this.system == undefined)
            return;

        await this.system.update();
    }

    logInfo(msg) {
        log.info(msg);
    }

    logError(msg) {
        log.error(msg);
    }

    async getZoneState() {
        if(this.system == undefined)
            return undefined;
        
        var url = "http://"+this.local_ip+":3000/api/v1/hvac";
        var systemId = this.system.id;
        var data = '{\"systemID\":'+systemId+', \"ZoneID\":0}';
        var response = await AsyncRequest.jsonPostRequest(url, data);

        var errors = response["errors"];
        if(errors)
        {
            this.logError("Failed to get zone state: (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return undefined;
        }
        var body = response["body"];
        var zones = JSON.parse(body)["data"];
        
        return zones;
    }

    async sendUpdate(zoneid, key, value) 
    {
        if(this.system == undefined)
            return false;

        try
        {
            var url = "http://"+this.local_ip+":3000/api/v1/hvac";
            var systemId = this.system.id;
            var data = '{\"systemID\":'+systemId+', \"ZoneID\":'+zoneid+', \"'+key+'\":'+value+'}';
            var response = await AsyncRequest.jsonPutRequest(url, data);
            var errors = response["errors"];
            if(errors)
            {
                this.logError("Failed to update '"+key+"' with value '"+value+"': (statusCode: "+response["statusCode"]+") - "+response["errors"]);
                return undefined;
            }
            var body = response["body"];
            var responseData = JSON.parse(body)["data"];
            return responseData.hasOwnProperty(key);
        }
        catch (e) {
            this.logError('error during sendUpdate '+e+'\r\n'+e.stack);
        }
        return false;
    }
}
module.exports = AirzoneLocalApi;