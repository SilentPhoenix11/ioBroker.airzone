'use strict';

/**
 * Standalone test script for the Airzone adapter
 * Tests the LocalApi directly without ioBroker
 */

const AirzoneLocalApi = require('./LocalApi/AirzoneLocalApi');

// Mock adapter object
const mockAdapter = {
    log: {
        info: (msg) => console.log('[INFO]', msg),
        error: (msg) => console.error('[ERROR]', msg),
        debug: (msg) => console.log('[DEBUG]', msg),
        warn: (msg) => console.warn('[WARN]', msg)
    },
    config: {
        local_ip: '192.168.178.121',
        system_id: 1,
        sync_time: 30
    },
    namespace: 'airzone.0',

    // Mock state/object methods
    setObjectNotExistsAsync: async (id, obj) => {
        console.log(`[OBJECT] Creating: ${id}`, obj.common?.name || '');
        return Promise.resolve();
    },
    setStateAsync: async (id, state) => {
        console.log(`[STATE] ${id} = ${JSON.stringify(state.val)}`);
        return Promise.resolve();
    },
    subscribeStates: (pattern) => {
        console.log(`[SUBSCRIBE] ${pattern}`);
    },
    setState: (id, state) => {
        console.log(`[STATE] ${id} = ${JSON.stringify(state)}`);
    }
};

// Add helper methods that the adapter uses
mockAdapter.createProperty = async function(path, name, type, read, write, role) {
    await this.setObjectNotExistsAsync(path + '.' + name, {
        type: 'state',
        common: { name, type, read, write, role },
        native: {}
    });
};

mockAdapter.createUnitProperty = async function(path, name, type, min, max, unit, read, write, role) {
    await this.setObjectNotExistsAsync(path + '.' + name, {
        type: 'state',
        common: { name, type, read, write, role, min, max, unit },
        native: {}
    });
};

mockAdapter.updatePropertyValue = async function(path, name, value) {
    await this.setStateAsync(path + '.' + name, { val: value, ack: true });
};

mockAdapter.createPropertyAndInit = async function(path, name, type, read, write, value, role) {
    await this.createProperty(path, name, type, read, write, role);
    await this.updatePropertyValue(path, name, value);
};

mockAdapter.subscribeState = function(path, _obj, _callback) {
    this.subscribeStates(path);
};

async function main() {
    console.log('='.repeat(60));
    console.log('Airzone Adapter Standalone Test');
    console.log('='.repeat(60));
    console.log(`Target: http://${mockAdapter.config.local_ip}:3000`);
    console.log('');

    try {
        console.log('--- Initializing Airzone Local API ---');
        const api = new AirzoneLocalApi(mockAdapter, mockAdapter.config.local_ip);
        await api.init(mockAdapter.config.system_id);

        console.log('\n--- Initial data loaded successfully! ---\n');

        // Wait a bit and do an update
        console.log('--- Running update cycle ---');
        await api.update();

        console.log('\n--- Update completed successfully! ---\n');

        // Test webserver info
        console.log('--- Testing webserver endpoint ---');
        const webserverInfo = await api.getWebserverInfo();
        if (webserverInfo) {
            console.log('Webserver Info:', JSON.stringify(webserverInfo, null, 2));
        } else {
            console.log('Webserver endpoint not available');
        }

        console.log('\n' + '='.repeat(60));
        console.log('TEST PASSED - Adapter works with your Airzone device!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('TEST FAILED:', error.message);
        console.error(error.stack);
        console.error('='.repeat(60));
        process.exit(1);
    }
}

main();
