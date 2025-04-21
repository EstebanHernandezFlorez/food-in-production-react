import axios from "axios";
import {apiurl} from '../../enviroments/local';

export const authService = {
    login: async (email, password) => {
        try {
            const response = await axios.post(apiurl, {email, password});
            if(!response) throw new Error("Credential error")
            authService.setTokens(response.data.token)
            return response.data;
        } catch (error) {
            console.error("Error during login:", error);
            throw error;
            
        }
        
    },
    logout: async (email, password) => {
        try {
            const response = await axios.post(apiurl, {email, password});
            return response.data;
        } catch (error) {
            console.error("Error during login:", error);
            throw error;

        }
    },
    setTokens: (accessToken) => {
        localStorage.setItem("token", accessToken);
        console.log("Token guardado en localStorage:", accessToken); // Verifica el token 
    },
    getAccessToken: () =>{
        return localStorage.getItem("token");
    },
    clearSession: () =>{
        localStorage.removeItem("token");
        window.location.href = "/";
    }
}