import  { useEffect } from "react";
import axiosInstance from "../../services/axiosConfig";

const ProtectedData = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(""); // Cambia aquí el endpoint
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return <div>Protected Data</div>;
};

export default ProtectedData;
