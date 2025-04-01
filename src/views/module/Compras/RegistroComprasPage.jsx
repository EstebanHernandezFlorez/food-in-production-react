// src/components/RegistroComprasPage.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, message } from 'antd';
import SupplierSelect from './SupplierSelect';
import PurchaseDetailsForm from './PurchaseDetailsForm';
import PurchaseDetailsTable from './PurchaseDetailsTable';
import registerPurchaseService from '../../services/registroCompraService';
import insumoService from '../../services/insumoService'; // This insumoService remains to get the Insumos for the PurchaseDetailsForm
import providerService from '../../services/proveedorSevice'; // Import the new providerService

const RegistroComprasPage = () => {
    const [form] = Form.useForm();
    const [suppliers, setSuppliers] = useState([]); //Suppliers from supplierService
    const [insumos, setInsumos] = useState([]); // Insumos from insumoService (for details)
    const [providers, setProviders] = useState([]); // New state for providers
    const [loading, setLoading] = useState(false);
    const [purchase, setPurchase] = useState({
        idProvider: null, // Add idProvider to the purchase state
        idSupplier: null,
        purchaseDate: new Date().toISOString().slice(0, 10),
        details: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const insumosData = await insumoService.getAllInsumos();
                setInsumos(insumosData);
                const providersData = await providerService.getAllProveedores(); // Fetch providers
                setProviders(providersData);
            } catch (error) {
                console.error('Error fetching data:', error);
                message.error('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSupplierChange = (value) => {
        setPurchase({ ...purchase, idSupplier: value });
    };

    const handleProviderChange = (value) => {
        setPurchase({ ...purchase, idProvider: value }); // Handle provider change
    };


    const handleDetailsChange = (newDetails) => {
        setPurchase({ ...purchase, details: newDetails });
    };

    const handleSubmit = async () => {
        try {
            if (!purchase.idSupplier) {
                message.error('Por favor, seleccione un proveedor.');
                return;
            }
            if (!purchase.idProvider) {
                message.error('Por favor, seleccione un proveedor.');
                return;
            }

            if (purchase.details.length === 0) {
                message.error('Por favor, agregue al menos un detalle de compra.');
                return;
            }

            setLoading(true);

            // Prepare purchase data for the backend
            const purchaseData = {
                idSupplier: purchase.idSupplier,
                idProvider: purchase.idProvider,
                purchaseDate: purchase.purchaseDate,
                totalAmount: purchase.details.reduce((acc, detail) => acc + detail.subtotal, 0),
                purchaseDetails: purchase.details.map(detail => ({
                    idInsumo: detail.idInsumo,
                    quantity: detail.quantity,
                    unitPrice: detail.unitPrice,
                    subtotal: detail.subtotal,
                    idSupplier: purchase.idSupplier
                })),
            };

            // Call the registerPurchaseService to create the purchase
            await registerPurchaseService.createRegisterPurchase(purchaseData);

            message.success('Compra registrada con éxito');
            form.resetFields();
            setPurchase({
                idSupplier: null,
                idProvider: null,
                purchaseDate: new Date().toISOString().slice(0, 10),
                details: [],
            });
        } catch (error) {
            console.error('Error saving purchase:', error);
            message.error('Error al guardar la compra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Registro de Compras</h1>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item label="Proveedor">
                    <SupplierSelect
                        suppliers={suppliers}
                        onChange={handleSupplierChange}
                        value={purchase.idSupplier}
                    />
                </Form.Item>
                <Form.Item label="Providers">
                    <SupplierSelect // You might need to rename or create a separate component for providers
                        suppliers={providers} // Use providers data
                        onChange={handleProviderChange}
                        value={purchase.idProvider}
                    />
                </Form.Item>

                <PurchaseDetailsForm
                    insumos={insumos}
                    details={purchase.details}
                    onChange={handleDetailsChange}
                />

                <PurchaseDetailsTable details={purchase.details} />

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Guardar Compra
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default RegistroComprasPage;