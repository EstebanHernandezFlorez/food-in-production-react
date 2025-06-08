import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'reactstrap';
import { ChefHat, PlusCircle, ServerCrash } from 'lucide-react';
import toast from 'react-hot-toast';

import '../../../assets/css/produccion/ProduccionStyles.css'; 

import ActiveOrdersSidebar from './ActiveOrdersSidebar';
import { ActiveOrdersContext } from './ActiveOrdersContext'; // No es necesario importar ActiveOrdersProvider aquí
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
    
    const [productosMaestros, setProductosMaestros] = useState([]);
    const [empleadosMaestros, setEmpleadosMaestros] = useState([]);
    const [proveedoresMaestros, setProveedoresMaestros] = useState([]);
    const [masterDataLoadedPage, setMasterDataLoadedPage] = useState(false);
    const [isLoadingMasterDataPage, setIsLoadingMasterDataPage] = useState(false);
    const [masterDataErrorPage, setMasterDataErrorPage] = useState(null);

    const loadMasterDataForPage = useCallback(async () => {
        console.log("ProduccionPageContent: Iniciando carga de datos maestros a nivel de página...");
        setIsLoadingMasterDataPage(true);
        setMasterDataErrorPage(null);
        let success = false;
        try {
            const productService = (await import('../../services/productService')).default;
            const employeeService = (await import('../../services/empleadoService')).default;
            const registroCompraService = (await import('../../services/registroCompraService')).default;

            const [pRes, eRes, provRes] = await Promise.all([
                productService.getAllProducts({ status: true, includeSpecSheetCount: true }).catch(err => ({ error: true, source: 'productos', data: [] })),
                employeeService.getAllEmpleados({ status: true }).catch(err => ({ error: true, source: 'empleados', data: [] })),
                registroCompraService.getMeatCategoryProviders().catch(err => ({ error: true, source: 'proveedores', data: [] })),
            ]);

            if (pRes.error || eRes.error || provRes.error) {
                const errors = [pRes, eRes, provRes].filter(r => r.error).map(r => r.source).join(', ');
                const errorMsg = `Error cargando: ${errors}`;
                console.error("ProduccionPageContent: Error en carga de datos maestros:", errorMsg);
                setMasterDataErrorPage(errorMsg);
                toast.error(errorMsg, {id: 'master-data-page-error', duration: 5000});
            } else {
                const getSafeData = (r) => (Array.isArray(r) ? r : (r?.data && Array.isArray(r.data) ? r.data : []));
                
                const productosDataRaw = getSafeData(pRes);
                const productosFiltrados = productosDataRaw.filter(p => p?.status === true);
                setProductosMaestros(productosFiltrados);

                const empleadosDataRaw = getSafeData(eRes);
                const empleadosFiltrados = empleadosDataRaw.filter(e => e?.status === true && (e.Role === undefined || e.Role?.idRole !== 1));
                setEmpleadosMaestros(empleadosFiltrados);

                const proveedoresDataRaw = getSafeData(provRes);
                const proveedoresFiltrados = proveedoresDataRaw.filter(p => (p?.company || p?.providerName) && (p.status === undefined || p.status === true));
                setProveedoresMaestros(proveedoresFiltrados);
                
                success = true;
            }
        } catch (error) {
            console.error("ProduccionPageContent: Error crítico en carga de datos maestros:", error);
            setMasterDataErrorPage("Error crítico al cargar datos.");
            toast.error("Error crítico al cargar datos.", {id: 'master-data-page-critical-error'});
        } finally {
            setIsLoadingMasterDataPage(false);
            if (success) {
                setMasterDataLoadedPage(true);
            } else {
                 console.warn("ProduccionPageContent: La carga de datos maestros a nivel de página no fue completamente exitosa.");
            }
        }
    }, []);

    useEffect(() => {
        if (!masterDataLoadedPage && !isLoadingMasterDataPage && !masterDataErrorPage) {
            loadMasterDataForPage();
        }
    }, [loadMasterDataForPage, masterDataLoadedPage, isLoadingMasterDataPage, masterDataErrorPage]);


    if (!context) {
        return ( <Container fluid className="d-flex justify-content-center align-items-center production-module" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT})` }}><Alert color="danger" className="text-center shadow-sm"><div className="d-flex flex-column align-items-center"><ServerCrash size={48} className="mb-3 text-danger" /><h4 className="alert-heading">Error Crítico</h4><p>Contexto de órdenes no disponible.</p><hr /><p className="mb-0 small">Asegúrese de que <code>ActiveOrdersProvider</code> envuelve esta aplicación.</p></div></Alert></Container>);
    }

    const { addOrFocusOrder, isLoadingOrderContext, currentViewedOrderId } = context;
    const shouldShowForm = !!currentViewedOrderId;

    const handleInitiateNewOrder = async () => {
        if (isInitiatingNewOrder || isLoadingOrderContext) return;
        setIsInitiatingNewOrder(true);
        try {
            if (!masterDataLoadedPage && !isLoadingMasterDataPage) {
                await loadMasterDataForPage();
                if (masterDataErrorPage) {
                     toast.error(`No se pueden cargar los datos necesarios para crear una orden: ${masterDataErrorPage}`);
                     setIsInitiatingNewOrder(false);
                     return;
                }
            } else if (isLoadingMasterDataPage) {
                toast.info("Espere a que los datos maestros terminen de cargar.", {icon: "⏳"});
                setIsInitiatingNewOrder(false);
                return;
            }
            await addOrFocusOrder(null, true, { navigateIfNeeded: true });
        } catch (error) { 
            toast.error(`Error al iniciar nueva orden: ${error.message || "Error desconocido"}`);
            console.error("Error en handleInitiateNewOrder:", error);
        } finally { 
            setIsInitiatingNewOrder(false); 
        }
    };
    
    // <<<--- INICIO DE LA CORRECCIÓN DE LA KEY --- >>>
    // Esta función crea una key estable para el formulario.
    const getFormKey = () => {
        if (!currentViewedOrderId) {
            // Key estática para cuando no hay ninguna orden seleccionada.
            return 'no-order-selected';
        }
        if (String(currentViewedOrderId).startsWith('NEW_')) {
            // Usamos una key estática para TODOS los borradores.
            // Esto evita que el formulario se remonte cada vez que se crea un nuevo borrador.
            return 'new-order-draft';
        }
        // Para órdenes existentes, su ID es la key perfecta y estable.
        return currentViewedOrderId;
    };
    
    const formKey = getFormKey();
    // <<<--- FIN DE LA CORRECCIÓN DE LA KEY --- >>>
    
    if (isLoadingMasterDataPage) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center production-module" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT})` }}>
                <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
                <span className="ms-3">Cargando datos esenciales de producción...</span>
            </Container>
        );
    }

    if (masterDataErrorPage && !masterDataLoadedPage) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center production-module" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT})` }}>
                <Alert color="danger" className="text-center shadow-sm">
                    <div className="d-flex flex-column align-items-center">
                        <ServerCrash size={48} className="mb-3 text-danger" />
                        <h4 className="alert-heading">Error al Cargar Datos</h4>
                        <p>{masterDataErrorPage}</p>
                        <Button color="primary" onClick={loadMasterDataForPage}>Reintentar</Button>
                    </div>
                </Alert>
            </Container>
        );
    }


    return (
        <Container fluid className="vh-100 d-flex flex-column p-0 production-module">
            <Row className="g-0 flex-grow-1" style={{ maxHeight: `calc(100vh - ${NAVBAR_HEIGHT})`, overflow: 'hidden' }}>
                <Col
                    xs={12} md={8} lg={9}
                    className="main-content-column"
                    style={{ 
                        height: `calc(100vh - ${NAVBAR_HEIGHT})`, 
                        overflowY: 'auto', 
                        padding: '1.25rem',
                        backgroundColor: '#fdfaf6',
                        borderLeft: '1px solid #dee2e6', 
                    }}
                >
                    {shouldShowForm ? (
                        <OrdenProduccionForm
                            key={formKey} // Usamos la key estable
                            productosMaestrosProps={productosMaestros}
                            empleadosMaestrosProps={empleadosMaestros}
                            proveedoresMaestrosProps={proveedoresMaestros}
                            masterDataLoadedPageProps={masterDataLoadedPage}
                        />
                    ) : <InstruccionesProduccion />}
                </Col>
                <Col
                    xs={12} md={4} lg={3}
                    className="sidebar-column-main"
                    style={{ 
                        height: `calc(100vh - ${NAVBAR_HEIGHT})`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '0px',
                        backgroundColor: 'var(--produccion-sider-bg, #f8f9fa)'
                    }}
                >
                    <div className="p-3 border-bottom shadow-sm bg-white flex-shrink-0">
                        <Button
                            color="primary"
                            className="w-100 d-flex align-items-center justify-content-center py-2 fw-semibold"
                            onClick={handleInitiateNewOrder} 
                            disabled={isLoadingOrderContext || isInitiatingNewOrder || isLoadingMasterDataPage}
                            title="Configurar una nueva orden de producción"
                        >
                            {(isLoadingOrderContext || isInitiatingNewOrder || isLoadingMasterDataPage) ? <Spinner size="sm" className="me-2" color="light" /> : <PlusCircle size={18} className="me-2" />}
                            Nueva Orden
                        </Button>
                    </div>
                    <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
                        <ActiveOrdersSidebar />
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

// Se asume que ActiveOrdersProvider ya envuelve esta página en un nivel superior,
// por lo que no es necesario volver a ponerlo aquí.
const ProduccionPage = () => (
    <ProduccionPageContent />
);

export default ProduccionPage;