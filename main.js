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
        this.initialized = true;

        if(this.config.sync_time > 0) {        
            this.update();
        }
    }

    update() {
        var syncTime = Math.max(this.config.sync_time, 15);

        setTimeout(
            (function(self) {         //Self-executing func which takes 'this' as self
                return async function() {   //Return a function in the context of 'self'
                    if(!self.initialized)
                        return;
                    try {
                        await self.session.update();
                    } catch (e) {
                        self.log.error('error during update '+e+'\r\n'+e.stack);
                    }

                    if(self.initialized)
                        self.update();
                }
            })(this), syncTime * 1000);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        this.initialized = false;
        callback();
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

    async createProperty(_path, _name, _type, _read, _write, _role){
        await this.setObjectNotExistsAsync(_path+"."+_name, {
            type: 'state',
            common: {
                name: _name,
                type: _type,
                read: _read,
                write: _write,
                role: _role,
            },
            native: {},
        });
    }

    async createProperty(_path, _name, _type, _min, _max, _unit, _read, _write, _role){
        await this.setObjectNotExistsAsync(_path+"."+_name, {
            type: 'state',
            common: {
                name: _name,
                type: _type,
                read: _read,                
                write: _write,
                role: _role,
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

    async createPropertyAndInit(_path, _name, _type, _read, _write, _value, _role){
        await this.createProperty(_path, _name, _type, _read, _write, _role);
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