// Puedes poner este componente al inicio de GestionComprasPage.jsx o en un archivo separado

import { Warehouse } from 'lucide-react'; // Importa un nuevo ícono

const SupplyStockTable = ({ supplies, isLoading }) => {
    const getStockStatusColor = (stock, minStock, maxStock) => {
        if (stock <= (minStock || 0)) return 'text-danger fw-bold';
        if (stock > (maxStock || Infinity)) return 'text-warning fw-bold';
        return 'text-success';
    };

    return (
        <Card className="shadow-sm mb-4">
            <CardHeader>
                <CardTitle tag="h5" className="mb-0 d-flex align-items-center">
                    <Warehouse size={20} className="me-2 text-primary" />
                    Inventario Actual de Insumos
                </CardTitle>
            </CardHeader>
            <CardBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {isLoading ? (
                    <div className="text-center p-5"><Spinner /> Cargando inventario...</div>
                ) : (
                    <Table hover size="sm" className="mb-0 align-middle">
                        <thead className="table-light sticky-top">
                            <tr>
                                <th>Insumo</th>
                                <th className="text-center">Unidad</th>
                                <th className="text-end">Stock Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplies.length > 0 ? (
                                supplies.map(supply => (
                                    <tr key={supply.idSupply}>
                                        <td>{supply.supplyName}</td>
                                        <td className="text-center">{supply.unitOfMeasure}</td>
                                        <td className={`text-end ${getStockStatusColor(supply.stock, supply.minStock, supply.maxStock)}`}>
                                            {Number(supply.stock).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-center fst-italic p-4">No hay insumos para mostrar.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </CardBody>
        </Card>
    );
};