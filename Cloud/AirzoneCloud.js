'use strict';

const AsyncRequest = require('./asyncRequest');
const Constants = require('./Constants')

// const Device = require('./Device')

// Allow to connect to AirzoneCloud API

let log;
class AirzoneCloud {
    constructor(l, username, password,base_url)
    {
        log = l;
        this.username = username;
        this.password = password;
        this.base_url = base_url;
    }

    async init() {
        
        if(!await this.login())
            return false;

        await this.load_devices();
        return true;
    }   
    
    async login() {
        log.info("Login at AirzoneCloud ");

        var url = this.base_url.concat(Constants.API_LOGIN);
        const data = JSON.stringify({"email":this.username, "password":this.password});        
        var response = await AsyncRequest.jsonPostRequest(url, data);

        var errors = response["errors"];        
        if(errors)
        {
            if(errors == "invalid")
                log.error("Failed to login at AirzoneCloud: (statusCode: "+response["statusCode"]+") - Invalid email or password");                
            else 
                log.error("Failed to login at AirzoneCloud: (statusCode: "+response["statusCode"]+") - "+errors);
            return false;
        }

        var body = response["body"];   
        var user = JSON.parse(body)["user"];  
        this.token = user["authentication_token"];        
                                    
        log.info("AirzoneCloud login successful");
        return true;
    }

    async load_devices() {
        log.info("Load all devices");        
    }
}
module.exports = AirzoneCloud;