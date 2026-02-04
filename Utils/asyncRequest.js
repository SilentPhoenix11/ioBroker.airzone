'use strict';

const axios = require('axios');

// Create axios instance with default config for Airzone API
const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

class AsyncRequest {

    /**
     * Perform a POST request to the Airzone API
     * @param {string} url - The URL to send the request to
     * @param {object} data - The data to send (will be serialized to JSON)
     * @returns {Promise<object>} - Response object with statusCode and body/errors
     */
    static async jsonPostRequest(url, data) {
        try {
            // Parse data if it's a string
            const requestData = typeof data === 'string' ? JSON.parse(data) : data;

            const response = await axiosInstance.post(url, requestData);

            // Check for API-level errors in response
            if (response.data && response.data.errors) {
                return {
                    statusCode: response.status,
                    errors: response.data.errors
                };
            }

            return {
                statusCode: response.status,
                body: JSON.stringify(response.data)
            };
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const errorData = error.response.data;
                return {
                    statusCode: error.response.status,
                    errors: errorData?.errors || errorData?.message || error.message
                };
            }
            // Network error or timeout
            return {
                statusCode: 0,
                errors: error.message
            };
        }
    }

    /**
     * Perform a PUT request to the Airzone API
     * @param {string} url - The URL to send the request to
     * @param {object} data - The data to send (will be serialized to JSON)
     * @returns {Promise<object>} - Response object with statusCode and body/errors
     */
    static async jsonPutRequest(url, data) {
        try {
            // Parse data if it's a string
            const requestData = typeof data === 'string' ? JSON.parse(data) : data;

            const response = await axiosInstance.put(url, requestData);

            // Check for API-level errors in response
            if (response.data && response.data.errors) {
                return {
                    statusCode: response.status,
                    errors: response.data.errors
                };
            }

            return {
                statusCode: response.status,
                body: JSON.stringify(response.data)
            };
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const errorData = error.response.data;
                return {
                    statusCode: error.response.status,
                    errors: errorData?.errors || errorData?.message || error.message
                };
            }
            // Network error or timeout
            return {
                statusCode: 0,
                errors: error.message
            };
        }
    }

    /**
     * Perform a GET request to the Airzone API
     * @param {string} url - The URL to send the request to
     * @returns {Promise<object>} - Response object with statusCode and body/errors
     */
    static async jsonGetRequest(url) {
        try {
            const response = await axiosInstance.get(url);

            // Check for API-level errors in response
            if (response.data && response.data.errors) {
                return {
                    statusCode: response.status,
                    errors: response.data.errors
                };
            }

            return {
                statusCode: response.status,
                body: JSON.stringify(response.data)
            };
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const errorData = error.response.data;
                return {
                    statusCode: error.response.status,
                    errors: errorData?.errors || errorData?.message || error.message
                };
            }
            // Network error or timeout
            return {
                statusCode: 0,
                errors: error.message
            };
        }
    }
}

module.exports = AsyncRequest;