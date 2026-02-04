'use strict';

const AsyncRequest = require('../Utils/asyncRequest');
const System = require('./System');
const Constants = require('./Constants');

// Allow to connect to Airzone local API

let log;
let adapter;
class AirzoneLocalApi {
    constructor(a, local_ip)
    {
        adapter = a;
        log = a.log;
        this.local_ip = local_ip;
        this.baseUrl = `http://${local_ip}:3000`;
    }

    async init(system_id) {
        this.system = new System(adapter, this, system_id);
        await this.system.init();

        // Try to get version info
        try {
            const version = await this.getVersion();
            if (version) {
                this.logInfo(`Airzone API Version: ${JSON.stringify(version)}`);
            }
        } catch (_e) {
            this.logInfo('Version endpoint not available');
        }
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

    /**
     * Get the API version information
     * @returns {Promise<object|undefined>} Version info or undefined on error
     */
    async getVersion() {
        const url = this.baseUrl + Constants.API_ENDPOINTS.VERSION;
        const response = await AsyncRequest.jsonGetRequest(url);

        if (response['errors']) {
            return undefined;
        }

        const body = response['body'];
        return body ? JSON.parse(body) : undefined;
    }

    /**
     * Get webserver information (if available)
     * @returns {Promise<object|undefined>} Webserver info or undefined on error
     */
    async getWebserverInfo() {
        const url = this.baseUrl + Constants.API_ENDPOINTS.WEBSERVER;
        const data = {};
        const response = await AsyncRequest.jsonPostRequest(url, data);

        if (response['errors']) {
            return undefined;
        }

        const body = response['body'];
        return body ? JSON.parse(body) : undefined;
    }

    async getZoneState() {
        if(this.system == undefined)
            return undefined;

        const url = this.baseUrl + Constants.API_ENDPOINTS.HVAC;
        const systemId = this.system.id;
        const data = { systemID: systemId, ZoneID: 0 };
        const response = await AsyncRequest.jsonPostRequest(url, data);

        const errors = response['errors'];
        if(errors)
        {
            this.logError('Failed to get zone state: (statusCode: '+response['statusCode']+') - '+response['errors']);
            return undefined;
        }
        const body = response['body'];
        const zones = JSON.parse(body)['data'];

        return zones;
    }

    /**
     * Get IAQ sensor data (if available)
     * @returns {Promise<Array|undefined>} IAQ data array or undefined on error
     */
    async getIAQData() {
        if(this.system == undefined)
            return undefined;

        const url = this.baseUrl + Constants.API_ENDPOINTS.IAQ;
        const systemId = this.system.id;
        const data = { systemID: systemId };
        const response = await AsyncRequest.jsonPostRequest(url, data);

        const errors = response['errors'];
        if (errors) {
            // IAQ endpoint may not be available on all devices
            return undefined;
        }

        const body = response['body'];
        const iaqData = body ? JSON.parse(body)['data'] : undefined;

        return iaqData;
    }

    async sendUpdate(zoneid, key, value)
    {
        if(this.system == undefined)
            return false;

        try
        {
            const url = this.baseUrl + Constants.API_ENDPOINTS.HVAC;
            const systemId = this.system.id;
            const data = { systemID: systemId, zoneID: zoneid, [key]: value };
            const response = await AsyncRequest.jsonPutRequest(url, data);
            const errors = response['errors'];
            if(errors)
            {
                this.logError("Failed to update '"+key+"' with value '"+value+"': (statusCode: "+response['statusCode']+') - '+response['errors']);
                return false;
            }
            const body = response['body'];
            const responseData = JSON.parse(body)['data'];
            return responseData && responseData.hasOwnProperty(key);
        }
        catch (e) {
            this.logError('error during sendUpdate '+e+'\r\n'+e.stack);
        }
        return false;
    }
}
module.exports = AirzoneLocalApi;