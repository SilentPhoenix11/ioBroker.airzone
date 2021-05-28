const util = require('util');
const request = require("request");
const asyncRequest = util.promisify(request);

class AsyncRequest {

    static async jsonPostRequest(url, data) {
        
        const response = await asyncRequest({
            method: 'POST',
            uri: url,
            headers: {
                'Content-Type': 'application/json'
            },            
            body: data
        });

        var result;
        
        if(response.error)
        {
            result = JSON.stringify({statusCode:response.statusCode,errors:error});
        }
        else
        {
            var body = response.body;
            var errorMsg = JSON.parse(body)["errors"];
            if(errorMsg)
                result = JSON.stringify({statusCode:response.statusCode,errors:errorMsg});
            else
                result = JSON.stringify({statusCode:response.statusCode,body:response.body});
        }        

        return JSON.parse(result);        
    }

    static async jsonGetRequest(url) {
        
        const response = await asyncRequest({
            method: 'GET',
            uri: url
        });

        var result;
        
        if(response.error)
        {
            result = JSON.stringify({statusCode:response.statusCode,errors:error});
        }
        else
        {
            var body = response.body;
            var errorMsg = JSON.parse(body)["errors"];
            if(errorMsg)
                result = JSON.stringify({statusCode:response.statusCode,errors:errorMsg});
            else
                result = JSON.stringify({statusCode:response.statusCode,body:response.body});
        }        

        return JSON.parse(result);        
    }
}

module.exports = AsyncRequest;