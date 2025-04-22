    // src/services/proveedorService.js
    // Note: Renamed from .jsx as this file typically doesn't contain React components/JSX.

    import axios from 'axios';

    // Consider using environment variables for the API URL in real applications
    // Example: const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/provider';
    const API_URL = 'http://localhost:3000/provider'; // Base URL for provider endpoints

    /**
     * Service object containing methods for interacting with the provider API.
     */
    const proveedorService = {

        /**
         * Fetches all providers from the API.
         * @returns {Promise<Array>} A promise that resolves to an array of provider objects.
         * @throws {Error} If the API request fails.
         */
        getAllProveedores: async () => {
            try {
                console.log(`[Service] GET ${API_URL}`);
                const response = await axios.get(API_URL);
                return response.data;
            } catch (error) {
                console.error("[Service Error] Fetching all providers failed:", error.response?.data || error.message);
                throw error; // Re-throw for component-level handling
            }
        },

        /**
         * Creates a new provider.
         * @param {object} proveedorData - The data for the new provider.
         * @returns {Promise<object>} A promise that resolves to the newly created provider object.
         * @throws {Error} If the API request fails.
         */
        createProveedor: async (proveedorData) => {
            try {
                console.log(`[Service] POST ${API_URL} with data:`, proveedorData);
                const response = await axios.post(API_URL, proveedorData);
                return response.data;
            } catch (error) {
                console.error("[Service Error] Creating provider failed:", error.response?.data || error.message);
                throw error;
            }
        },

        /**
         * Fetches a single provider by its ID.
         * @param {string|number} idProvider - The ID of the provider to fetch.
         * @returns {Promise<object>} A promise that resolves to the provider object.
         * @throws {Error} If the API request fails or the provider is not found.
         */
        getProveedorById: async (idProvider) => {
            const url = `${API_URL}/${idProvider}`;
            try {
                console.log(`[Service] GET ${url}`);
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                console.error(`[Service Error] Fetching provider ID ${idProvider} failed:`, error.response?.data || error.message);
                throw error;
            }
        },

        /**
         * Updates an existing provider.
         * @param {string|number} idProvider - The ID of the provider to update.
         * @param {object} proveedorData - An object containing the fields to update.
         * @returns {Promise<object>} A promise that resolves to the updated provider object.
         * @throws {Error} If the API request fails.
         */
        updateProveedor: async (idProvider, proveedorData) => {
            const url = `${API_URL}/${idProvider}`;
            try {
                console.log(`[Service] PUT ${url} with data:`, proveedorData);
                const response = await axios.put(url, proveedorData);
                return response.data;
            } catch (error) {
                console.error(`[Service Error] Updating provider ID ${idProvider} failed:`, error.response?.data || error.message);
                throw error;
            }
        },

        /**
         * Deletes a provider by its ID.
         * @param {string|number} idProvider - The ID of the provider to delete.
         * @returns {Promise<void>} A promise that resolves when the deletion is successful.
         * @throws {Error} If the API request fails.
         */
        deleteProveedor: async (idProvider) => {
            const url = `${API_URL}/${idProvider}`;
            try {
                console.log(`[Service] DELETE ${url}`);
                await axios.delete(url);
                // No return value needed for successful delete
            } catch (error) {
                console.error(`[Service Error] Deleting provider ID ${idProvider} failed:`, error.response?.data || error.message);
                throw error;
            }
        },

        /**
         * Changes the status (active/inactive) of a provider.
         * @param {string|number} idProvider - The ID of the provider to update.
         * @param {boolean} status - The new status value (true for active, false for inactive).
         * @returns {Promise<object>} A promise that resolves to the updated provider object (or relevant response from API).
         * @throws {Error} If the API request fails.
         */
        changeStateProveedor: async (idProvider, status) => {
            const url = `${API_URL}/${idProvider}`; // Assuming PATCH updates the main resource URL
            try {
                console.log(`[Service] PATCH ${url} with status:`, { status });
                // Using PATCH is common for partial updates like changing status
                const response = await axios.patch(url, { status });
                return response.data;
            } catch (error) {
                console.error(`[Service Error] Changing status for provider ID ${idProvider} failed:`, error.response?.data || error.message);
                throw error;
            }
        },

        /**
         * Checks if a provider is associated with any purchases (or other critical entities).
         * **Note:** You need to implement the corresponding backend endpoint for this.
         * @param {string|number} idProvider - The ID of the provider to check.
         * @returns {Promise<boolean>} True if associated, false otherwise.
         * @throws {Error} If the check request itself fails.
         */
        isProviderAssociatedWithPurchases: async (idProvider) => {
            // *** Adjust this URL to match your actual backend endpoint for the check ***
            // Examples: '/check-association', '/purchases-count', '/is-deletable'
            const checkUrl = `${API_URL}/${idProvider}/is-associated`;
            console.log(`[Service] GET ${checkUrl} (Checking association)`);

            try {
                // Assume the backend returns something like { isAssociated: true/false }
                const response = await axios.get(checkUrl);

                // Adapt based on your API's response structure
                if (response.data && typeof response.data.isAssociated === 'boolean') {
                    console.log(`[Service] Association check result for ID ${idProvider}:`, response.data.isAssociated);
                    return response.data.isAssociated;
                } else {
                    // Handle unexpected response format
                    console.warn(`[Service Warn] Unexpected association check response format for ID ${idProvider}:`, response.data);
                    // Decide default behavior: maybe assume associated to be safe? Or not associated?
                    // Or throw an error indicating a contract mismatch with the API.
                    // Returning false here assumes not associated if format is wrong.
                    return false;
                }

            } catch (error) {
                // Handle specific errors if needed (e.g., 404 might mean "not found" -> not associated)
                if (error.response && error.response.status === 404) {
                    console.log(`[Service] Association check for ID ${idProvider}: Resource not found (assuming not associated).`);
                    return false; // Treat 404 as not associated
                }

                // Log and re-throw other errors
                console.error(`[Service Error] Checking provider association failed for ID ${idProvider}:`, error.response?.data || error.message);
                // Throwing an error here means the *check itself* failed,
                // the component should probably prevent deletion just in case.
                throw new Error("Association check failed");
            }
        }
    };

    export default proveedorService;