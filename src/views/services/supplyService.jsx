// src/services/supplyService.js
import axios from 'axios';
// Asegúrate que este import sea correcto y que `apiurl` esté definido en ese archivo.
// Ejemplo: export const apiurl = 'http://localhost:3000';
import { apiurl } from '../../enviroments/local';

const SUPPLY_API_URL = `${apiurl}/supplies`;

// Se ASUME que este servicio devuelve insumos con la siguiente estructura mínima:
// [{ idSupply: 1, name: "Harina", unitOfMeasure: "KG", status: true, ...otrosCampos },
//  { idSupply: 2, supplyName: "Azucar", unitOfMeasure: "GR", status: true, ...otrosCampos }]
// Es decir, PK = idSupply, Nombre = name O supplyName, Unidad Medida = unitOfMeasure

const supplyService = {
    getAllSupplies: async (params = {}) => {
        try {
            const response = await axios.get(SUPPLY_API_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching supplies:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSupplyById: async (idSupply) => {
        try {
            const response = await axios.get(`${SUPPLY_API_URL}/${idSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    createSupply: async (supplyData) => {
        try {
            const response = await axios.post(SUPPLY_API_URL, supplyData);
            return response.data;
        } catch (error) {
            console.error('Error creating supply:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateSupply: async (idSupply, supplyData) => {
        try {
            const response = await axios.put(`${SUPPLY_API_URL}/${idSupply}`, supplyData);
            return response.data;
        } catch (error) {
            console.error(`Error updating supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteSupply: async (idSupply) => {
        try {
            await axios.delete(`${SUPPLY_API_URL}/${idSupply}`);
            return { message: "Insumo eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    changeSupplyStatus: async (idSupply, status) => {
        try {
            const response = await axios.patch(`${SUPPLY_API_URL}/${idSupply}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default supplyService;