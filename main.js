'use strict';

const adaptername = "airzone"

const utils = require('@iobroker/adapter-core');
const AirzoneCloud = require("./Cloud/AirzoneCloud");


class Template extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: adaptername,
        });        
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));        
        this.stateChangeCallbacks = {};
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */    
    async onReady() {
        // Initialize your adapter here
        this.session = new AirzoneCloud(this, this.config.username, this.config.password, this.config.base_url);
        await this.session.init();        

        if(this.config.sync_time > 0) {
        this.callReadAirzone = setInterval(
            (function(self) {         //Self-executing func which takes 'this' as self
                return async function() {   //Return a function in the context of 'self'
                    await self.session.update();
                }
            })(this),
             this.config.sync_time * 1000);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (this.callReadAirzone !== null) {
                clearInterval(this.callReadActuator);
                adapter.log.debug('update timer cleared');
            }
            
            callback();
        } catch (e) {
            callback();
        }
    }
    
    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {

        if (state.from.search (adaptername) != -1) {return;}  // do not process self generated state changes

        if (state) {
            var callback = this.stateChangeCallbacks[id];
            if(callback != undefined) {
                var method = callback['method'];
                var target = callback['target'];
                await method(target, id, state);
            }
        }
    }

    async createProperty(_path, _name, _type, _read, _write){
        await this.setObjectNotExistsAsync(_path+"."+_name, {
            type: 'state',
            common: {
                name: _name,
                type: _type,
                read: _read,
                write: _write,
            },
            native: {},
        });
    }

    async createProperty(_path, _name, _type, _min, _max, _unit, _read, _write){
        await this.setObjectNotExistsAsync(_path+"."+_name, {
            type: 'state',
            common: {
                name: _name,
                type: _type,
                read: _read,
                write: _write,
                min : _min,
                max : _max,
                unit : _unit
            },
            native: {},
        });
    }

    async updatePropertyValue(_path, _name, _value) {
        await this.setStateAsync(_path+"."+_name, { val: _value, ack: true } );
    }

    async createPropertyAndInit(_path, _name, _type, _read, _write, _value){
        await this.createProperty(_path, _name, _type, _read, _write);
        await this.updatePropertyValue(_path, _name, _value);
    }
    
    subscribeState(path, obj, callback) {
        this.subscribeStates(path);       
        var id = this.namespace+'.'+path;
        this.stateChangeCallbacks[id] = {target: obj, method : callback};
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Template(options);
} else {
    // otherwise start the instance directly
    new Template();
}