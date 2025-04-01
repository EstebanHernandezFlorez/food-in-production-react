// PurchaseDetailsTable.jsx
import React from 'react';
import { Table } from 'antd';

const PurchaseDetailsTable = ({ details }) => {
    const columns = [
        {
            title: 'Insumo',
            dataIndex: 'idInsumo',
            key: 'idInsumo',
            render: (idInsumo) => `Insumo ID: ${idInsumo}`, // Replace with actual insumo name if available
        },
        {
            title: 'Cantidad',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Precio Unitario',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
        },
    ];

    return <Table columns={columns} dataSource={details} rowKey={(record,index) => index} />;
};

export default PurchaseDetailsTable;