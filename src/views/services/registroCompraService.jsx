// Archivo: src/services/registerPurchaseService.js (VERSIÓN FINAL Y CORRECTA)

import axios from 'axios';
// Asumo que tu archivo 'local.js' define 'apiurl' como 'http://localhost:3000'
import { apiurl } from '../../enviroments/local'; 

// <<< CORRECCIÓN CRÍTICA >>>
// La URL base debe coincidir EXACTAMENTE con la ruta del backend. 
// Si tu backend usa `app.use('/registerPurchase', ...)`, esta es la URL correcta.
const API_URL = `${apiurl}/registerPurchase`; 

const registerPurchaseService = {
    /**
     * Obtiene todas las compras registradas con sus detalles.
     * Ahora esta función llamará a la URL correcta: GET http://localhost:3000/registerPurchase
     */
    getAllRegisterPurchasesWithDetails: async () => {
        try {
            const response = await axios.get(API_URL);
            
            if (!Array.isArray(response.data)) {
                console.warn("La respuesta de la API no fue un array. Se devuelve un array vacío.", response.data);
                return [];
            }
            return response.data;
        } catch (error) {
            console.error(`Error al llamar a GET ${API_URL}:`, error.response?.data || error.message);
            throw error;
        }
    },

    // El resto de las funciones ahora también usarán la URL base correcta.
    // Por ejemplo, getRegisterPurchaseById llamará a http://localhost:3000/registerPurchase/:id
    
    getRegisterPurchaseById: async (idPurchase) => {
        try {
            const response = await axios.get(`${API_URL}/${idPurchase}`);
            return response.data;
        } catch (error) {
            console.error(`Error al llamar a GET ${API_URL}/${idPurchase}:`, error.response?.data || error.message);
            throw error;
        }
    },
    
    // ... (El resto de las funciones del servicio no necesitan cambios en su lógica interna)
    // ...
    // ... (código de las otras funciones como create, update, etc. va aquí)
    getMeatCategoryProviders: async () => {
        try {
            const response = await axios.get(`${API_URL}/providers/meat`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error al obtener proveedores de categoría carne:', error.response?.data || error.message);
            throw error;
        }
    },
    
    getProvidersByCategory: async (categoryName) => {
        if (categoryName && categoryName.toUpperCase() === 'CARNE') {
            return registerPurchaseService.getMeatCategoryProviders();
        }
        console.warn(`getProvidersByCategory: La funcionalidad para la categoría "${categoryName}" no está implementada.`);
        return Promise.resolve([]);
    },
    
    createRegisterPurchase: async (purchaseData) => {
        try {
            const response = await axios.post(API_URL, purchaseData);
            return response.data;
        } catch (error) {
            let errorMessage = "Error al crear el registro de compra.";
            if (error.response) {
                errorMessage = `Error ${error.response.status}: ` + (error.response.data?.message || JSON.stringify(error.response.data));
            } else if (error.request) {
                errorMessage = 'No se recibió respuesta del servidor.';
            } else {
                errorMessage = `Error al configurar la solicitud: ${error.message}`;
            }
            throw new Error(errorMessage);
        }
    },

    updateRegisterPurchaseHeader: async (idPurchase, purchaseData) => {
        try {
            const response = await axios.put(`${API_URL}/${idPurchase}`, purchaseData);
            return response.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || `Error actualizando compra ${idPurchase}.`;
            throw new Error(errorMsg);
        }
    },

    deleteRegisterPurchase: async (idPurchase) => {
        try {
            await axios.delete(`${API_URL}/${idPurchase}`);
        } catch (error) {
            throw new Error(error.response?.data?.message || `Error al eliminar la compra ${idPurchase}.`);
        }
    },

    updatePurchaseStatus: async (idPurchase, statusUpdate) => {
        try {
            if (!statusUpdate || (statusUpdate.status === undefined && statusUpdate.paymentStatus === undefined)) {
                throw new Error("Se debe proporcionar un estado para actualizar.");
            }
            const response = await axios.patch(`${API_URL}/${idPurchase}/status`, statusUpdate);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || `Error al cambiar el estado de la compra ${idPurchase}.`);
        }
    },
};

export default registerPurchaseService;