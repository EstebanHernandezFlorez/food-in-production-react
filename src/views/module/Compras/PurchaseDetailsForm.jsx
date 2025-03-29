// PurchaseDetailsForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, message } from 'antd';

const { Option } = Select;

const PurchaseDetailsForm = ({ insumos, details, onChange }) => {
    const [detailList, setDetailList] = useState(details);

    useEffect(() => {
        onChange(detailList); // Notify the parent component when detailList changes
    }, [detailList, onChange]);

    const addDetail = () => {
        setDetailList([...detailList, { idInsumo: null, quantity: 0, unitPrice: 0, subtotal: 0 }]);
    };

    const removeDetail = (index) => {
        const newDetails = [...detailList];
        newDetails.splice(index, 1);
        setDetailList(newDetails);
    };

    const handleDetailChange = (index, field, value) => {
        const newDetails = [...detailList];
        newDetails[index][field] = value;

        // Calculate subtotal when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
            const quantity = newDetails[index].quantity || 0;
            const unitPrice = newDetails[index].unitPrice || 0;
            newDetails[index].subtotal = quantity * unitPrice;
        }

        setDetailList(newDetails);
    };

    return (
        <div>
            {detailList.map((detail, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Form.Item label={`Insumo ${index + 1}`}>
                        <Select
                            placeholder="Selecciona un insumo"
                            style={{ width: 200 }}
                            value={detail.idInsumo}
                            onChange={(value) => handleDetailChange(index, 'idInsumo', value)}
                        >
                            {insumos.map((insumo) => (
                                <Option key={insumo.idInsumo} value={insumo.idInsumo}>
                                    {insumo.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="Cantidad">
                        <InputNumber
                            min={0}
                            value={detail.quantity}
                            onChange={(value) => handleDetailChange(index, 'quantity', value)}
                        />
                    </Form.Item>
                    <Form.Item label="Precio Unitario">
                        <InputNumber
                            min={0}
                            value={detail.unitPrice}
                            formatter={(value) => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            onChange={(value) => handleDetailChange(index, 'unitPrice', value)}
                        />
                    </Form.Item>
                    <Form.Item label="Subtotal">
                        <Input
                            value={detail.subtotal}
                            readOnly
                        />
                    </Form.Item>
                    <Button type="danger" onClick={() => removeDetail(index)}>
                        Eliminar
                    </Button>
                </div>
            ))}
            <Button type="dashed" onClick={addDetail} block>
                Agregar Insumo
            </Button>
        </div>
    );
};

export default PurchaseDetailsForm;