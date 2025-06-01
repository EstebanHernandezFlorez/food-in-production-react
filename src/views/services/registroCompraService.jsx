// src/services/registerPurchaseService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Ajusta si es diferente
const API_URL = `${API_BASE_URL}/registerPurchase`;

const registerPurchaseService = {
    /**
     * Obtiene todas las compras registradas con sus detalles.
     * Se espera que el backend incluya 'provider' y 'details'.
     * Dentro de cada 'detail', se espera el insumo asociado como 'supply'
     * (ej. detail.supply.name, detail.supply.idSupply, detail.supply.unitOfMeasure).
     */
    getAllRegisterPurchasesWithDetails: async () => {
        try {
            const response = await axios.get(API_URL);
            if (!Array.isArray(response.data)) {
                console.warn("getAllRegisterPurchasesWithDetails no devolvió un array. Respuesta:", response.data);
                return [];
            }
            return response.data;
        } catch (error) {
            console.error("Error al obtener compras con detalles:", error.response?.data || error.message);
            throw error;
        }
    },

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
        // Esta función es un placeholder. Implementar si es necesario.
        if (categoryName && categoryName.toUpperCase() === 'CARNE') {
            return registerPurchaseService.getMeatCategoryProviders();
        }
        console.warn(`getProvidersByCategory: La funcionalidad para la categoría "${categoryName}" no está implementada o requiere una ruta de backend dinámica.`);
        return Promise.resolve([]);
    },

    getRegisterPurchaseById: async (idPurchase) => {
        try {
            const response = await axios.get(`${API_URL}/${idPurchase}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener compra ${idPurchase}:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Crea un nuevo registro de compra.
     * @param {object} purchaseData - Datos de la compra.
     * Ejemplo de purchaseData:
     * {
     *   idProvider: 1,
     *   purchaseDate: "2023-10-27",
     *   category: "CARNE",
     *   invoiceNumber: "INV-123",
     *   receptionDate: "2023-10-28",
     *   observations: "Alguna observación",
     *   details: [
     *     { idSupply: 1, quantity: 10, unitPrice: 5.99 }, // idSupply es la FK al insumo
     *     { idSupply: 2, quantity: 5, unitPrice: 12.50 }
     *   ]
     * }
     */
    createRegisterPurchase: async (purchaseData) => {
        try {
            const response = await axios.post(API_URL, purchaseData);
            return response.data;
        } catch (error) {
            let errorMessage = "Error al crear el registro de compra.";
            if (error.response) {
                errorMessage = `Error ${error.response.status}: `;
                if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
                     errorMessage += error.response.data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
                } else if (error.response.data && error.response.data.message) {
                    errorMessage += error.response.data.message;
                } else if (typeof error.response.data === 'string' && error.response.data.length < 200) {
                    errorMessage += error.response.data;
                } else {
                    errorMessage += 'El servidor devolvió un error inesperado.';
                }
            } else if (error.request) {
                errorMessage = 'No se recibió respuesta del servidor. Verifique la conexión y la URL de la API.';
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
            let errorMessage = `Error actualizando compra ${idPurchase}.`;
             if (error.response) {
                errorMessage = `Error ${error.response.status}: `;
                if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
                     errorMessage += error.response.data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
                } else if (error.response.data && error.response.data.message) {
                    errorMessage += error.response.data.message;
                } else if (typeof error.response.data === 'string' && error.response.data.length < 200) {
                    errorMessage += error.response.data;
                } else {
                    errorMessage += 'El servidor devolvió un error inesperado al actualizar.';
                }
            }
            throw new Error(errorMessage);
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
                throw new Error("Se debe proporcionar al menos un estado (status o paymentStatus) para actualizar.");
            }
            const response = await axios.patch(`${API_URL}/${idPurchase}/status`, statusUpdate);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || `Error al cambiar el estado/pago de la compra ${idPurchase}.`);
        }
    },
};

export default registerPurchaseService;