// Example SupplierSelect.jsx (Potential Issue)
import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import supplierService from '../../services/insumoService';

const { Option } = Select;

const SupplierSelect = ({ onChange, value }) => {
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await supplierService.getAllSuppliers();
                setSuppliers(data);
            } catch (error) {
                console.error("Error fetching suppliers:", error);
                // Handle error appropriately
            }
        };

        fetchSuppliers();
    }, []); // Missing dependency array!

    return (
        <Select
            placeholder="Selecciona un proveedor"
            onChange={onChange}
            value={value}
        >
            {suppliers.map(supplier => (
                <Option key={supplier.idSupplier} value={supplier.idSupplier}>
                    {supplier.supplierName}
                </Option>
            ))}
        </Select>
    );
};

export default SupplierSelect;