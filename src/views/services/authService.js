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
        localStorage.setItem("access-token", accessToken);
        console.log("Token guardado en localStorage:", accessToken); // Verifica el token 
    },
    getAccessToken: () =>{
        return localStorage.getItem("access-token");
    },
    clearSession: () =>{
        localStorage.removeItem("access-token");
        window.location.href = "/";
    }
}