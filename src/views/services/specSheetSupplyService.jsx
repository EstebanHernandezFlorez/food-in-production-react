// src/services/specSheetSupplyService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local'; // CORREGIDO

const SPEC_SHEET_SUPPLY_API_URL = `${apiurl}/spec-sheet-supplies`; // CORREGIDO

// ... resto del código del servicio (sin cambios en la lógica interna) ...
const specSheetSupplyService = {
    addSupplyToSpecSheet: async (supplyData) => {
        try {
            const response = await axios.post(SPEC_SHEET_SUPPLY_API_URL, supplyData);
            return response.data;
        } catch (error) {
            console.error('Error adding supply to spec sheet:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSuppliesBySpecSheetId: async (idSpecSheet) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_SUPPLY_API_URL}/by-spec-sheet/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching supplies for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetSupplyById: async (idSpecSheetSupply) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_SUPPLY_API_URL}/${idSpecSheetSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheet supply ID ${idSpecSheetSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateSupplyInSpecSheet: async (idSpecSheetSupply, supplyUpdateData) => {
        try {
            const response = await axios.put(`${SPEC_SHEET_SUPPLY_API_URL}/${idSpecSheetSupply}`, supplyUpdateData);
            return response.data;
        } catch (error) {
            console.error(`Error updating supply in spec sheet (ID: ${idSpecSheetSupply}):`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    removeSupplyFromSpecSheet: async (idSpecSheetSupply) => {
        try {
            await axios.delete(`${SPEC_SHEET_SUPPLY_API_URL}/${idSpecSheetSupply}`);
            return { message: "Insumo eliminado de la ficha técnica exitosamente." };
        } catch (error) {
            console.error(`Error removing supply from spec sheet (ID: ${idSpecSheetSupply}):`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetsBySupplyId: async (idSupply) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_SUPPLY_API_URL}/by-supply/${idSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheets using supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetSupplyService;