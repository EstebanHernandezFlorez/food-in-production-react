import React from 'react';
import { Table, Button, Spinner } from 'reactstrap';
import { Edit, Trash2 } from 'lucide-react';

const InsumosTable = ({
    isLoading,
    currentItems,
    dataLength,
    tableSearchText,
    getUnitLabel,
    requestChangeStatusConfirmation,
    openEditModal,
    requestDeleteConfirmation,
    isConfirmActionLoading,
}) => {
    const colSpanValue = 5;

    return (
        <div className="table-responsive shadow-sm custom-table-container mb-3">
            <Table hover striped size="sm" className="mb-0 custom-table align-middle">
                <thead className="table-light">
                    <tr>
                        <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                        <th scope="col" style={{ width: '40%' }}>Nombre Insumo</th>
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
                            <tr key={item.idSupply}>
                                <th scope="row" className="text-center">{item.idSupply}</th>
                                <td>{item.supplyName}</td>
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
                                            onClick={() => openEditModal(item)}
                                            title="Editar"
                                            className="action-button action-edit"
                                            color="info" outline
                                        >
                                            <Edit size={18} />
                                        </Button>
                                        <Button
                                            disabled={isConfirmActionLoading}
                                            size="sm"
                                            onClick={() => requestDeleteConfirmation(item)}
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