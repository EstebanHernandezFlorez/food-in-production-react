// src/views/module/OrdenProduccion/components/EstimatedSuppliesSection.jsx
import React from 'react';
import { Col, Card, CardHeader, CardBody, Spinner, ListGroup, ListGroupItem } from 'reactstrap';
import { FileText } from 'lucide-react';
// Opcional: Crear y importar un archivo CSS para este componente

import '../../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA
// import './EstimatedSuppliesSection.css';

const EstimatedSuppliesSection = ({
    isLoadingFichas,
    selectedSpecSheetData,
    initialAmount // Recibe la cantidad de la orden directamente
}) => {
    const calculateIngredients = () => {
        if (!selectedSpecSheetData || !selectedSpecSheetData.specSheetSupplies || !initialAmount) {
            return [];
        }
        const orderQuantity = parseFloat(initialAmount) || 0;
        if (orderQuantity === 0) return [];

        return selectedSpecSheetData.specSheetSupplies.map(ing => {
            const fichaQuantityBase = parseFloat(selectedSpecSheetData.quantityBase) || 1;
            const ingredientQuantityPerBase = parseFloat(ing.quantity) || 0;
            const totalQuantity = (ingredientQuantityPerBase / fichaQuantityBase) * orderQuantity;
            return {
                supplyName: ing.supply?.supplyName || 'Insumo Desconocido',
                unitOfMeasure: ing.unitOfMeasure,
                calculatedQuantity: totalQuantity.toFixed(3)
            };
        });
    };

    const calculatedIngredients = calculateIngredients();

    return (
        <Col md={4} className="mb-3 mb-md-0 d-flex">
            <Card className="h-100 shadow-sm flex-fill">
                <CardHeader className="py-2 px-3 bg-light d-flex align-items-center">
                    <FileText size={16} className="me-2"/> Insumos Estimados
                </CardHeader>
                {/* Aplicar clase CSS en lugar de style inline si se crea EstimatedSuppliesSection.css */}
                <CardBody style={{maxHeight:'350px', overflowY:'auto'}} /* className="estimated-supplies-body" */ >
                    {isLoadingFichas && !selectedSpecSheetData && (
                        <div className="text-center py-3">
                            <Spinner size="sm" color="secondary"/> <span className="ms-2 text-muted">Cargando...</span>
                        </div>
                    )}
                    {!isLoadingFichas && calculatedIngredients.length > 0 && (
                        <ListGroup flush>{calculatedIngredients.map((ing,idx)=>(
                            <ListGroupItem key={idx} className="small py-1 px-0 d-flex justify-content-between align-items-center">
                                <span>{ing.supplyName}:</span>
                                <strong className="text-primary">{ing.calculatedQuantity} {ing.unitOfMeasure}</strong>
                            </ListGroupItem>
                        ))}</ListGroup>
                     )}
                    {!isLoadingFichas && calculatedIngredients.length === 0 && (
                         <p className="text-muted small m-0 py-3 text-center">
                            {(!selectedSpecSheetData || !selectedSpecSheetData.specSheetSupplies) && "Ficha no cargada o sin insumos definidos."}
                            {selectedSpecSheetData && selectedSpecSheetData.specSheetSupplies && !initialAmount && "Ingrese cantidad a producir."}
                         </p>
                    )}
                </CardBody>
            </Card>
        </Col>
    );
};

export default EstimatedSuppliesSection;