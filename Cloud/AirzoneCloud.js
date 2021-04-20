'use strict';

const AsyncRequest = require('../Utils/asyncRequest');
const Constants = require('./Constants')
const Device = require('./Device')

// Allow to connect to AirzoneCloud API

let log;
let adapter;
class AirzoneCloud {
    constructor(a, username, password, base_url)
    {
        adapter = a;
        log = a.log;        
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
    
    async update() {
        if(!await this.login())
            return false;

        if(!await this.update_devices())
            return false;

        return true;
    }
    
    async login() {
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
        
        return true;
    }

    async load_devices() {
        var device_relations = await this.get_devices();
        if(device_relations == undefined)
            return false;
        
        this.devices = [];
        let deviceCount = 0;
        for (let index = 0; index < device_relations.length; index++) {
            var deviceData = device_relations[index]["device"];
            var device = new Device(adapter, this);
            if(await device.init(deviceData))
            {
                this.devices[deviceCount] = device;
                deviceCount++;
            }
        }
        return true;
    }

    async update_devices() {
        var device_relations = await this.get_devices();

        if(device_relations == undefined)
            return false;
        
        for (let index = 0; index < device_relations.length; index++) {
            var deviceData = device_relations[index]["device"];

            var dId = deviceData["id"];
            
            for(let i = 0;i<this.devices.length;i++) {
                if(this.devices[i].id == dId) {
                    await this.devices[i].update(deviceData);
                    break;
                }
            }                        
        }
        return true;
    }

    async get_devices() {
        var params = "/?format=json&user_email="+this.username.toLowerCase()+"&user_token="+this.token;
        var url = this.base_url.concat(Constants.API_DEVICE_RELATIONS, params);        
        var response = await AsyncRequest.jsonGetRequest(url);

        var errors = response["errors"];
        if(errors)
        {
            this.logError("Failed to load device relations: (statusCode: "+response["statusCode"]+") - "+response["errors"]);
            return undefined;
        }
        var body = response["body"];
        var device_relations = JSON.parse(body)["device_relations"];
        return device_relations;
    }

    logInfo(msg) {
        log.info(msg);
    }

    logError(msg) {
        log.error(msg);
    }

    async sendEvent(payload) {
        if(!await this.login())
            return;

        var params = "/?format=json&user_email="+this.username.toLowerCase()+"&user_token="+this.token;
        var url = this.base_url.concat(Constants.API_EVENTS, params);
        await AsyncRequest.jsonPostRequest(url, JSON.stringify(payload));
    }
}
module.exports = AirzoneCloud;