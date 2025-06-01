// src/views/module/Insumos/components/InsumosPageHeader.jsx
import React from 'react';
import { Row, Col, Input, Button } from 'reactstrap';
import { Plus } from 'lucide-react';

const InsumosPageHeader = ({
    tableSearchText,
    handleTableSearch,
    openAddModal,
    isLoading,
    dataLength,
}) => {
    return (
        <>
            <h2 className="mb-4">Gestión de Insumos</h2>
            <Row className="mb-3 align-items-center">
                <Col md={6} lg={4}>
                    <Input
                        type="text"
                        bsSize="sm"
                        placeholder="Buscar por nombre, unidad o ID..."
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        disabled={isLoading && dataLength === 0} // Deshabilitar solo si está cargando Y no hay datos aún
                        style={{ borderRadius: '0.25rem' }}
                        aria-label="Buscar insumos"
                    />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        <Plus size={18} className="me-1" /> Agregar Insumo
                    </Button>
                </Col>
            </Row>
        </>
    );
};

export default InsumosPageHeader;