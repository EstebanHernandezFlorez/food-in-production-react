// src/views/module/Insumos/components/InsumosTable.jsx
import React from 'react';
import { Table, Button, Spinner } from 'reactstrap';
import { Edit, Trash2 } from 'lucide-react';

const InsumosTable = ({
    isLoading,
    currentItems, // Array de objetos, cada objeto debe tener: idSupply, supplyName, unitOfMeasure, status, (opcionalmente description)
    dataLength,
    tableSearchText,
    getUnitLabel,
    requestChangeStatusConfirmation,
    openEditModal,
    requestDeleteConfirmation,
    isConfirmActionLoading,
}) => {
    const colSpanValue = 5; // Ajusta si añades/quitas columnas

    return (
        <div className="table-responsive shadow-sm custom-table-container mb-3">
            <Table hover striped size="sm" className="mb-0 custom-table align-middle">
                <thead className="table-light">
                    <tr>
                        <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                        <th scope="col" style={{ width: '40%' }}>Nombre Insumo</th>
                        {/* Si añades descripción:
                        <th scope="col" style={{ width: '25%' }}>Descripción</th> 
                        Ajusta los widths de las otras columnas
                        */}
                        <th scope="col" style={{ width: '20%' }}>Unidad Medida</th>
                        <th scope="col" className="text-center" style={{ width: '15%' }}>Estado</th>
                        <th scope="col" className="text-center" style={{ width: '15%' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && dataLength === 0 ? (
                        <tr><td colSpan={colSpanValue} className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                    ) : currentItems.length > 0 ? (
                        currentItems.map((item) => (
                            // Asegúrate que item.idSupply exista y sea único
                            <tr key={item.idSupply || `item-${Math.random()}`}> 
                                <th scope="row" className="text-center">{item.idSupply || '-'}</th>
                                <td>{item.supplyName || '-'}</td>
                                {/* Si añades descripción:
                                <td title={item.description || ''}>
                                    {item.description ? (item.description.length > 50 ? item.description.substring(0, 47) + "..." : item.description) : '-'}
                                </td>
                                */}
                                <td>{getUnitLabel(item.unitOfMeasure)}</td>
                                <td className="text-center">
                                    <Button
                                        size="sm"
                                        className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`}
                                        onClick={() => requestChangeStatusConfirmation(item)}
                                        disabled={isConfirmActionLoading}
                                        title={item.status ? "Activo (Click para Desactivar)" : "Inactivo (Click para Activar)"}
                                    >
                                        {item.status ? "Activo" : "Inactivo"}
                                    </Button>
                                </td>
                                <td className="text-center">
                                    <div className="d-inline-flex gap-1 action-cell-content">
                                        <Button
                                            disabled={isConfirmActionLoading}
                                            size="sm"
                                            onClick={() => openEditModal(item)} // openEditModal recibe el 'item' completo
                                            title="Editar"
                                            className="action-button action-edit"
                                            color="secondary" outline
                                        >
                                            <Edit size={18} />
                                        </Button>
                                        <Button
                                            disabled={isConfirmActionLoading}
                                            size="sm"
                                            onClick={() => requestDeleteConfirmation(item)} // requestDeleteConfirmation recibe el 'item' completo
                                            title="Eliminar"
                                            className="action-button action-delete"
                                            color="danger" outline
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={colSpanValue} className="text-center fst-italic p-4">
                            {tableSearchText ? "No se encontraron insumos con los criterios de búsqueda." : "No hay insumos registrados."}
                        </td></tr>
                    )}
                    {isLoading && dataLength > 0 && (
                        <tr><td colSpan={colSpanValue} className="text-center p-2"><Spinner size="sm" color="secondary" /> Actualizando lista...</td></tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default InsumosTable;