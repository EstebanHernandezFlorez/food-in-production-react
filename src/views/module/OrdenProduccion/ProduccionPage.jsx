// src/views/module/OrdenProduccion/ProduccionPage.jsx
import React, { useContext, useState } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'reactstrap';
import { ChefHat, PlusCircle, ServerCrash, Info as InfoIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import '../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA

import ActiveOrdersSidebar from './ActiveOrdersSidebar';
import { ActiveOrdersContext } from './ActiveOrdersContext';
import OrdenProduccionForm from './OrdenProduccion'; 

const NAVBAR_HEIGHT = '56px'; 

export const InstruccionesProduccion = () => (
    <Container
        fluid
        className="px-md-4 px-3 py-5 text-center d-flex flex-column justify-content-center align-items-center production-module"
        style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT} - 2rem)` }}
    >
        <ChefHat size={60} className="mb-4 text-primary" />
        <h2 className="mb-3 fw-normal">Gestión de Órdenes de Producción</h2>
        <p className="text-muted lead mb-4" style={{ maxWidth: '550px', fontSize: '1rem' }}>
            Bienvenido al módulo de producción.
        </p>
        <p className="text-muted" style={{ maxWidth: '500px', fontSize: '0.9rem' }}>
            Para comenzar, seleccione una orden activa del panel lateral o configure una nueva haciendo clic en "Nueva Orden".
        </p>
    </Container>
);

const ProduccionPageContent = () => {
    const context = useContext(ActiveOrdersContext);
    const [isInitiatingNewOrder, setIsInitiatingNewOrder] = useState(false);

    if (!context) {
        return ( <Container fluid className="d-flex justify-content-center align-items-center production-module" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT})` }}><Alert color="danger" className="text-center shadow-sm"><div className="d-flex flex-column align-items-center"><ServerCrash size={48} className="mb-3 text-danger" /><h4 className="alert-heading">Error Crítico</h4><p>Contexto de órdenes no disponible.</p><hr /><p className="mb-0 small">Asegúrese de que <code>ActiveOrdersProvider</code> envuelve esta aplicación.</p></div></Alert></Container>);
    }

    const { addOrFocusOrder, isLoadingOrderContext, currentViewedOrderId } = context;
    const shouldShowForm = !!currentViewedOrderId;

    const handleInitiateNewOrder = async () => {
        if (isInitiatingNewOrder || isLoadingOrderContext) return;
        setIsInitiatingNewOrder(true);
        try {
            await addOrFocusOrder(null, true, { navigateIfNeeded: true });
        } catch (error) { toast.error(`Error al iniciar nueva orden: ${error.message || "Error desconocido"}`);
        } finally { setIsInitiatingNewOrder(false); }
    };

    return (
        <Container fluid className="vh-100 d-flex flex-column p-0 production-module">
            <Row className="g-0 flex-grow-1" style={{ maxHeight: `calc(100vh - ${NAVBAR_HEIGHT})`, overflow: 'hidden' }}>
                
                {/* --- CAMBIO DE ORDEN AQUÍ --- */}

                {/* Columna Principal de Contenido (Formulario o Instrucciones) - AHORA PRIMERO */}
                <Col
                    xs={12} md={8} lg={9}
                    className="main-content-column"
                    style={{ 
                        height: `calc(100vh - ${NAVBAR_HEIGHT})`, 
                        overflowY: 'auto', 
                        padding: '1.25rem',
                        backgroundColor: '#fdfaf6', // O tu color de fondo de contenido
                        // El borde ahora estará a la izquierda si el sidebar está a la derecha
                        borderLeft: '1px solid #dee2e6', 
                    }}
                >
                    {shouldShowForm ? <OrdenProduccionForm /> : <InstruccionesProduccion />}
                </Col>

                {/* Sidebar Principal de Órdenes Activas - AHORA SEGUNDO (se renderizará a la derecha en desktop) */}
                <Col
                    xs={12} md={4} lg={3}
                    // Para que en móvil el sidebar aparezca después del contenido principal si se apilan:
                    // order-md-first (contenido) order-md-last (sidebar)
                    // O, si quieres que el sidebar siempre esté visible en desktop pero abajo en móvil:
                    // Usa d-none d-md-flex para el sidebar y ajusta el layout móvil.
                    // Por ahora, el orden simple en el DOM lo pondrá a la derecha en desktop.
                    className="sidebar-column-main border-start" // Ya no necesita border-end
                    style={{ 
                        height: `calc(100vh - ${NAVBAR_HEIGHT})`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '0px',
                        backgroundColor: 'var(--produccion-sider-bg)'
                    }}
                >
                    <div className="p-3 border-bottom shadow-sm bg-white flex-shrink-0">
                        <Button
                            color="primary"
                            className="w-100 d-flex align-items-center justify-content-center py-2 fw-semibold"
                            onClick={handleInitiateNewOrder} disabled={isLoadingOrderContext || isInitiatingNewOrder}
                            title="Configurar una nueva orden de producción"
                        >
                            {(isLoadingOrderContext || isInitiatingNewOrder) ? <Spinner size="sm" className="me-2" color="light" /> : <PlusCircle size={18} className="me-2" />}
                            Nueva Orden
                        </Button>
                    </div>
                    <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
                        <ActiveOrdersSidebar />
                    </div>
                </Col>
                {/* --- FIN CAMBIO DE ORDEN --- */}

            </Row>
        </Container>
    );
};

const ProduccionPage = () => <ProduccionPageContent />;
export default ProduccionPage;