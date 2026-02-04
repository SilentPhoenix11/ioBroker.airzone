const Zone = require('./Zone');
const Constants = require('./Constants');

class System {
    constructor(adapter, localApi, id)
    {
        this.adapter = adapter;
        this.localApi = localApi;
        this.id = id;
    }

    /**
     * Initialize the system with the data from the airzone local api
     */
    async init() {
        this.path = 'System'+this.id;
        await this.adapter.setObjectNotExistsAsync(this.path, {
            type: 'device',
            common: {
                name: this.path,
                type: 'object',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.adapter.createProperty(this.path, 'mode_raw', 'number', true, true, 'state');
        await this.adapter.createProperty(this.path, 'mode', 'string', true, false, 'text');

        this.adapter.subscribeState(this.path+'.mode_raw', this, this.reactToModeRawChange);

        const masterZone = await this.load_zones(this.path);
        if(masterZone == undefined)
            return false;

        await this.updateData(masterZone);

        return true;
    }

    /**
     * Synchronized the system data from airzone into the iobroker data points
     */
    async updateData(masterZoneData)
    {
        if(masterZoneData == undefined)
        {
            this.localApi.logError('Missing master Zone');
            return;
        }

        this.mode_raw = masterZoneData['mode'];
        await this.adapter.updatePropertyValue(this.path, 'mode_raw', this.mode_raw);
        this.mode = Constants.MODES_CONVERTER[this.mode_raw]['name'];
        await this.adapter.updatePropertyValue(this.path, 'mode', this.mode);
    }

    /**
     * Synchronized the system data from airzone into the iobroker data points and call update for all sub zones
     */
    async update() {
        const masterZoneData = await this.update_zones();

        await this.updateData(masterZoneData);
    }

    /**
     * Load and initialize the zones of this system from airzone local api
     */
    async load_zones(path) {

        const zones_relations = await this.localApi.getZoneState();
        if(zones_relations == undefined)
            return undefined;

        let masterZoneData = undefined;
        this.zones = [];
        for (let index = 0; index < zones_relations.length; index++) {
            const zoneData = zones_relations[index];
            const zone = new Zone(this.adapter, this.localApi);
            await zone.init(path, zoneData);
            this.zones[index] = zone;

            if(zoneData.hasOwnProperty('mode'))
            {
                masterZoneData = zoneData;
                this.masterZoneId =  this.zones[index].id;
            }
        }

        return masterZoneData;
    }

    /**
     * Update zones with the current zone data from airzone local api
     */
    async update_zones() {

        const zones_relations = await this.localApi.getZoneState();
        if(zones_relations == undefined)
            return undefined;

        if(this.zones == undefined)
            return undefined;

        let masterZoneData = undefined;

        for (let index = 0; index < zones_relations.length; index++) {
            const zoneData = zones_relations[index];
            const zId = zoneData['zoneID'];

            if(zoneData.hasOwnProperty('mode'))
                masterZoneData = zoneData;

            for(let i = 0;i<this.zones.length;i++) {
                if(this.zones[i].id == zId) {
                    await this.zones[i].updateData(zoneData);
                    break;
                }
            }
        }

        return masterZoneData;
    }

    /**
     * Is called when the state of mode was changed
     */
    async reactToModeRawChange(self, id, state) {

        if(state.val == 0)
        {
            self.zones.forEach(zone => {
                zone.turn_off();
            });
        }

        self.sendEvent('mode', state.val);
    }

    /**
     * Send event to the airzone local api
     */
    async sendEvent(option, value) {
        await this.localApi.sendUpdate(this.masterZoneId, option, value);
    }
}
module.exports = System;