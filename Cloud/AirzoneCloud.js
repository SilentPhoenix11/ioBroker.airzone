'use strict';

const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants')
const Device = require('./Device')

// Allow to connect to AirzoneCloud API

let log;
class AirzoneCloud {
    constructor(l, username, password, base_url)
    {
        log = l;
        this.username = username;
        this.password = password;
        this.base_url = base_url;        
    }

    async init() {
        
        if(!await this.login())
            return false;

        if(!await this.load_devices())
            return false;

        return true;
    }   
    
    async login() {
        this.logInfo("Login at AirzoneCloud ");

        var url = this.base_url.concat(Constants.API_LOGIN);
        const data = JSON.stringify({"email":this.username, "password":this.password});        
        var response = await AsyncRequest.jsonPostRequest(url, data);

        var errors = response["errors"];        
        if(errors)
        {
            if(errors == "invalid")
                this.logError("Failed to login at AirzoneCloud: (statusCode: "+response["statusCode"]+") - Invalid email or password");
            else 
                this.logError("Failed to login at AirzoneCloud: (statusCode: "+response["statusCode"]+") - "+errors);
            return false;
        }

        var body = response["body"];   
        var user = JSON.parse(body)["user"];  
        this.token = user["authentication_token"];        
                                    
        this.logInfo("AirzoneCloud login successful");
        return true;
    }

    async load_devices() {
        this.logInfo("Load all devices");
        var params = "/?format=json&user_email="+this.username.toLowerCase()+"&user_token="+this.token;
        var url = this.base_url.concat(Constants.API_DEVICE_RELATIONS, params);
        var response = await AsyncRequest.jsonGetRequest(url);

        var errors = response["errors"];
        if(errors)
        {
            this.logError("Failed to load device relations: (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return false;
        }
        var body = response["body"];
        var device_relations = JSON.parse(body)["device_relations"];
        
        this.devices = [];
        let deviceCount = 0;
        for (let index = 0; index < device_relations.length; index++) {
            var deviceData = device_relations[index]["device"];
            var device = new Device(this, deviceData);
            if(await device.init())
            {
                this.devices[deviceCount] = device;
                deviceCount++;
            }
        }

        return true;
    }

    logInfo(msg) {
        log.info(msg);
    }

    logError(msg) {
        log.error(msg);
    }

}
module.exports = AirzoneCloud;