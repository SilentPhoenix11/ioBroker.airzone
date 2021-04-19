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
            var errorMsg = JSON.parse(response.body)["errors"];
            if(errorMsg)
                result = JSON.stringify({statusCode:response.statusCode,errors:errorMsg});
            else
                result = JSON.stringify({statusCode:response.statusCode,body:response.body});
        }        

        return JSON.parse(result);        
    }
}

module.exports = AsyncRequest;