// src/services/registerPurchaseService.js
import axios from 'axios';

// Ensure this matches your actual backend API URL
const API_URL = 'http://localhost:3000/registerPurchase';

const registerPurchaseService = {
    // OPTION 1: Modify existing function (if backend always includes relations or uses a specific param)
    // getAllRegisterPurchases: async () => {
    //     try {
    //         // Example: If your backend always includes relations or uses a default parameter
    //         // Or add the include parameter here:
    //         const response = await axios.get(API_URL, {
    //             params: { include: 'provider,purchaseDetails.insumo' } // ADJUST 'include' and values based on your API
    //         });
    //         console.log("API Response (getAllRegisterPurchases):", response.data); // Add logging
    //         return response.data;
    //     } catch (error) {
    //         console.error("Error fetching purchases:", error.response?.data || error.message);
    //         throw error;
    //     }
    // },

    // OPTION 2: Add the specific function used in the component (RECOMMENDED for clarity)
    getAllRegisterPurchasesWithDetails: async () => {
         try {
            // Use query parameters to tell the backend to include related data.
            // Common patterns: ?include=relation1,relation2 or ?_embed=relation1
            // **ADJUST 'include' and relation names ('provider', 'purchaseDetails', 'insumo') based on YOUR backend API design**
            const response = await axios.get(API_URL, {
                 params: {
                     // Example: nested include might require dot notation or specific handling
                     include: 'provider,purchaseDetails.insumo'
                     // Alternative example if details include insumos automatically:
                     // include: 'provider,purchaseDetails'
                 }
             });
             console.log("API Response (getAllRegisterPurchasesWithDetails):", response.data); // Add logging
             // **VERY IMPORTANT**: Check the console log here to see the actual structure
             // returned by your API. Does it contain `provider` objects and `purchaseDetails` arrays
             // with nested `insumo` objects?
             if (!Array.isArray(response.data)) {
                 console.warn("getAllRegisterPurchasesWithDetails did not return an array. Response:", response.data);
                 // Optionally return an empty array or throw a more specific error
                 return [];
             }
             return response.data;
         } catch (error) {
             console.error("Error fetching purchases with details:", error.response?.data || error.message);
             throw error; // Re-throw the error to be caught by the component
         }
     },


    getRegisterPurchaseById: async (id) => {
        try {
           // This looks reasonable, assuming the backend supports these includes for a single record
           const response = await axios.get(`${API_URL}/${id}`, {
                 params: {
                    include: 'provider,purchaseDetails.insumo' // Match include params with the list view if possible
                }
            });
           console.log(`API Response (getRegisterPurchaseById ${id}):`, response.data); // Add logging
           return response.data;
       } catch (error) {
           console.error(`Error fetching purchase ${id}:`, error.response?.data || error.message);
           throw error;
       }
   },

   createRegisterPurchase: async (purchaseData) => {
    try {
        console.log("Sending to API (createRegisterPurchase):", purchaseData);
        const response = await axios.post(API_URL, purchaseData);
        console.log("API Response (createRegisterPurchase):", response.data);
        return response.data;
    } catch (error) {
        // Log more details for debugging
        console.error("Error creating purchase Raw:", error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error Response Data:", error.response.data);
            console.error("Error Response Status:", error.response.status);
            console.error("Error Response Headers:", error.response.headers);
             // Try to create a more informative message
             let errorMessage = `Error ${error.response.status}: `;
             if (typeof error.response.data === 'string') {
                 errorMessage += error.response.data;
             } else if (error.response.data && error.response.data.message) {
                 errorMessage += error.response.data.message;
             } else {
                 errorMessage += (JSON.stringify(error.response.data) || 'Server returned an error');
             }
             throw new Error(errorMessage); // Throw more specific error
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error Request:", error.request);
            throw new Error('No response received from server.');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
            throw new Error(`Error setting up request: ${error.message}`);
        }
    }
},

    // update, delete, changeState remain the same unless they also need relation handling
     updateRegisterPurchase: async (idPurchase, purchaseData) => {
        try {
            const response = await axios.put(`${API_URL}/${idPurchase}`, purchaseData);
            return response.data;
        } catch (error) {
            console.error(`Error updating register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    },

    deleteRegisterPurchase: async (idPurchase) => {
        try {
            await axios.delete(`${API_URL}/${idPurchase}`);
        } catch (error) {
            console.error(`Error deleting register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    },

    changeStateRegisterPurchase: async (idPurchase, status) => {
        try {
            // Ensure the backend expects { status: value } in the PATCH body
            const response = await axios.patch(`${API_URL}/${idPurchase}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    }
};

export default registerPurchaseService;