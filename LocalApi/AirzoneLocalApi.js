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
        var url = "http://"+this.local_ip+":3000/api/v1/hvac";
        //const data = JSON.stringify({"systemID":this.system?.id, "ZoneID":0});
        var data = '{\"systemID\":'+this.system?.id+', \"ZoneID\":0}';
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
        try
        {
            var url = "http://"+this.local_ip+":3000/api/v1/hvac";
            var payload = '{\"systemID\":'+this.system?.id+', \"ZoneID\":'+zoneid+', \"'+key+'\":'+value+'}';
            var response = await AsyncRequest.jsonPutRequest(url, payload);
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
    }
}
module.exports = AirzoneLocalApi;