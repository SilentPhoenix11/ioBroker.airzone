'use strict';

const adaptername = 'airzone';

const utils = require('@iobroker/adapter-core');
const AirzoneLocalApi = require('./LocalApi/AirzoneLocalApi');


class Airzone extends utils.Adapter {

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
        this.updateTimer = null;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        // Set initial connection state to false
        await this.setStateAsync('info.connection', false, true);

        try
        {
            this.log.info('Init Airzone local api...');
            this.session = new AirzoneLocalApi(this, this.config.local_ip);
            await this.session.init(parseInt(this.config.system_id));
            this.log.info('Init Airzone local api succeeded.');

            // Set connection state to true on successful init
            await this.setStateAsync('info.connection', true, true);
        }
        catch (e)
        {
            this.log.error('Init Airzone local api failed: '+e+'\r\n'+e.stack);
            await this.setStateAsync('info.connection', false, true);
        }
        this.initialized = true;

        if(this.config.sync_time > 0) {
            this.scheduleUpdate();
        }
    }

    /**
     * Schedule the next update using adapter timers (cleared automatically on unload)
     */
    scheduleUpdate() {
        const syncTime = Math.max(this.config.sync_time, 1);

        // Use adapter's setTimeout which is automatically cleared on unload
        this.updateTimer = this.setTimeout(async () => {
            if(!this.initialized) {
                return;
            }

            try {
                await this.session.update();
                // Update connection state on successful update
                await this.setStateAsync('info.connection', true, true);
            } catch (e) {
                this.log.error('error during update '+e+'\r\n'+e.stack);
                // Set connection state to false on error
                await this.setStateAsync('info.connection', false, true);
            }

            if(this.initialized) {
                this.scheduleUpdate();
            }
        }, syncTime * 1000);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        this.initialized = false;
        // Clear the update timer if it exists
        if (this.updateTimer) {
            this.clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
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
            const callback = this.stateChangeCallbacks[id];
            if(callback != undefined) {
                const method = callback['method'];
                const target = callback['target'];
                await method(target, id, state);
            }
        }
    }

    async createProperty(_path, _name, _type, _read, _write, _role){
        await this.setObjectNotExistsAsync(_path+'.'+_name, {
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

    async createUnitProperty(_path, _name, _type, _min, _max, _unit, _read, _write, _role){
        await this.setObjectNotExistsAsync(_path+'.'+_name, {
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
        await this.setStateAsync(_path+'.'+_name, { val: _value, ack: true } );
    }

    async createPropertyAndInit(_path, _name, _type, _read, _write, _value, _role){
        await this.createProperty(_path, _name, _type, _read, _write, _role);
        await this.updatePropertyValue(_path, _name, _value);
    }

    subscribeState(path, obj, callback) {
        this.subscribeStates(path);
        const id = this.namespace+'.'+path;
        this.stateChangeCallbacks[id] = {target: obj, method : callback};
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Airzone(options);
} else {
    // otherwise start the instance directly
    new Airzone();
}