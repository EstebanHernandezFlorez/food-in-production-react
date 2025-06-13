// src/views/module/OrdenProduccion/ActiveOrdersContext.jsx

import React, { createContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import productionOrderService from '../../services/productionOrderService';
import '../../../assets/css/produccion/ProduccionStyles.css';

let providerInstanceCounter = 0;

const defaultOrderStructure = {
    id: null,
    isNewForForm: true,
    localOrderStatus: 'PENDING',
    localOrderStatusDisplay: 'Nuevo Borrador',
    orderNumberDisplay: 'N/A',
    productNameSnapshot: '',
    formOrder: {
        orderDate: new Date().toISOString().split('T')[0],
        idEmployeeRegistered: '',
        idProduct: '',
        productNameSnapshot: '',
        idSpecSheet: '',
        initialAmount: '',
        idProvider: '',
        observations: '',
        inputInitialWeight: '',
        inputInitialWeightUnit: 'kg',
        finalQuantityProduct: '',
        finishedProductWeight: '',
        finishedProductWeightUnit: 'kg',
        inputFinalWeightUnused: '',
        inputFinalWeightUnusedUnit: 'kg',
    },
    processSteps: [],
    activeStepIndex: null,
    selectedSpecSheetData: null,
    baseDataValidated: false,
    formErrors: {},
    creationDate: null,
    lastModifiedDate: null,
};

export const ActiveOrdersContext = createContext(null);

export const ActiveOrdersProvider = ({ children }) => {
    const instanceId = useRef(++providerInstanceCounter);
    const [activeOrders, setActiveOrders] = useState({});
    const [_currentViewedOrderIdInternal, _setCurrentViewedOrderIdInternal] = useState(null);
    const [isLoadingOrderContext, setIsLoadingOrderContext] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const currentViewedOrderIdRef = useRef(_currentViewedOrderIdInternal);
    useEffect(() => {
        currentViewedOrderIdRef.current = _currentViewedOrderIdInternal;
    }, [_currentViewedOrderIdInternal]);
    
    const setCurrentViewedOrderId = useCallback((id) => {
        _setCurrentViewedOrderIdInternal(id);
    }, []);

    const transformFetchedOrderToContextFormat = useCallback((fetchedOrder) => {
        if (!fetchedOrder || !fetchedOrder.idProductionOrder) {
            console.warn(`[CONTEXT] Transformación fallida: datos de orden inválidos.`, fetchedOrder);
            return null;
        }
        
        const Product = fetchedOrder.Product || fetchedOrder.product;
        const SpecSheet = fetchedOrder.SpecSheet || fetchedOrder.specSheet;
        
        const {
            idProductionOrder, orderNumber, idProduct, idSpecSheet,
            initialAmount, inputInitialWeight, inputInitialWeightUnit,
            finalQuantityProduct, finishedProductWeight, finishedProductWeightUnit,
            inputFinalWeightUnused, inputFinalWeightUnusedUnit,
            orderDate, idEmployeeRegistered, idProvider, observations, status,
            productionOrderDetails,
            dateTimeCreation, createdAt, dateTimeLastModified, updatedAt,
            isBaseDataValidated,
            productNameSnapshot: backendProductNameSnapshot
        } = fetchedOrder;

        const formOrderMapped = {
            ...defaultOrderStructure.formOrder,
            idProduct: idProduct?.toString() || '',
            productNameSnapshot: backendProductNameSnapshot || Product?.productName || '',
            idSpecSheet: idSpecSheet?.toString() || '',
            initialAmount: initialAmount?.toString() || '',
            inputInitialWeight: inputInitialWeight !== null && inputInitialWeight !== undefined ? inputInitialWeight.toString() : '',
            inputInitialWeightUnit: inputInitialWeightUnit || defaultOrderStructure.formOrder.inputInitialWeightUnit,
            finalQuantityProduct: finalQuantityProduct?.toString() || '',
            finishedProductWeight: finishedProductWeight?.toString() || '',
            finishedProductWeightUnit: finishedProductWeightUnit || defaultOrderStructure.formOrder.finishedProductWeightUnit,
            inputFinalWeightUnused: inputFinalWeightUnused?.toString() || '',
            inputFinalWeightUnusedUnit: inputFinalWeightUnusedUnit || defaultOrderStructure.formOrder.inputFinalWeightUnusedUnit,
            orderDate: orderDate ? new Date(orderDate).toISOString().split('T')[0] : defaultOrderStructure.formOrder.orderDate,
            idEmployeeRegistered: idEmployeeRegistered?.toString() || '',
            idProvider: idProvider?.toString() || '',
            observations: observations || '',
        };

        let localStatus = 'PENDING';
        let localStatusDisplay = 'Pendiente';
        switch (status?.toUpperCase()) {
            case 'PENDING': localStatus = 'PENDING'; localStatusDisplay = 'Pendiente'; break;
            case 'SETUP': localStatus = 'SETUP'; localStatusDisplay = 'En Configuración'; break;
            case 'SETUP_COMPLETED': localStatus = 'SETUP_COMPLETED'; localStatusDisplay = 'Config. Validada'; break;
            case 'IN_PROGRESS': localStatus = 'IN_PROGRESS'; localStatusDisplay = 'En Proceso'; break;
            case 'PAUSED': localStatus = 'PAUSED'; localStatusDisplay = 'Pausada'; break;
            case 'ALL_STEPS_COMPLETED': localStatus = 'ALL_STEPS_COMPLETED'; localStatusDisplay = 'Procesos Finalizados'; break;
            case 'COMPLETED': localStatus = 'COMPLETED'; localStatusDisplay = 'Completada'; break;
            case 'CANCELLED': localStatus = 'CANCELLED'; localStatusDisplay = 'Cancelada'; break;
            default: localStatus = status || 'UNKNOWN'; localStatusDisplay = status || 'Desconocido';
        }

        const processStepsFormatted = (productionOrderDetails || []).map(detail => {
            const processInfo = detail.processDetails || detail.Process;
            return {
                idProductionOrderDetail: detail.idProductionOrderDetail ? String(detail.idProductionOrderDetail) : null,
                idProcess: String(detail.idProcess || detail.idProcessSnapshot || processInfo?.idProcess || ''),
                processOrder: detail.processOrder,
                processName: detail.processNameSnapshot || processInfo?.processName || 'Proceso Desconocido',
                processDescription: detail.processDescriptionSnapshot || processInfo?.description || '',
                idEmployee: String(detail.idEmployeeAssigned || detail.idEmployee || ''),
                startDate: detail.startDate ? new Date(detail.startDate).toISOString() : '',
                endDate: detail.endDate ? new Date(detail.endDate).toISOString() : '',
                status: detail.status || 'PENDING',
                statusDisplay: detail.status || 'Pendiente',
                observations: detail.observations || '',
                estimatedTimeMinutes: processInfo?.estimatedTimeMinutes || detail.estimatedTimeMinutes || null,
                isNewStep: !detail.idProductionOrderDetail,
            };
        }).sort((a, b) => (a.processOrder || 0) - (b.processOrder || 0));
        
        let calculatedActiveStepIndex = null;
        if (localStatus === 'IN_PROGRESS' || localStatus === 'PAUSED') {
            const firstNonCompletedStepIndex = processStepsFormatted.findIndex(p => p.status !== 'COMPLETED');
            calculatedActiveStepIndex = firstNonCompletedStepIndex !== -1 ? firstNonCompletedStepIndex : (processStepsFormatted.length > 0 ? processStepsFormatted.length -1 : null) ;
        } else if (localStatus === 'ALL_STEPS_COMPLETED' && processStepsFormatted.length > 0) {
            calculatedActiveStepIndex = processStepsFormatted.length - 1;
        }
        
        const transformedOrder = {
            id: String(idProductionOrder),
            isNewForForm: false,
            localOrderStatus: localStatus,
            localOrderStatusDisplay: localStatusDisplay,
            orderNumberDisplay: orderNumber || `OP-${idProductionOrder}`,
            productNameSnapshot: backendProductNameSnapshot || Product?.productName || '',
            formOrder: formOrderMapped,
            processSteps: processStepsFormatted,
            activeStepIndex: calculatedActiveStepIndex,
            selectedSpecSheetData: SpecSheet || null,
            baseDataValidated: !!isBaseDataValidated || (localStatus !== 'PENDING' && localStatus !== 'SETUP' && localStatus !== 'UNKNOWN'),
            formErrors: {},
            creationDate: dateTimeCreation || createdAt,
            lastModifiedDate: dateTimeLastModified || updatedAt,
        };
        return transformedOrder;
    }, []);

    const loadInitialActiveOrders = useCallback(async () => {
        setIsLoadingOrderContext(true);
        try {
            const filters = { status_not_in: ['COMPLETED', 'CANCELLED'].join(',') };
            const response = await productionOrderService.getAllProductionOrders(filters);
            const loadedOrders = {};
            
            let ordersToProcess = [];
            if (Array.isArray(response)) {
                ordersToProcess = response;
            } else if (response && Array.isArray(response.rows)) {
                ordersToProcess = response.rows;
            } else {
                console.warn(`[CONTEXT] La respuesta de órdenes iniciales no tiene un formato reconocible.`, response);
            }

            ordersToProcess.forEach(orderData => {
                const status = orderData.status?.toUpperCase();
                if (status === 'COMPLETED' || status === 'CANCELLED') {
                    return;
                }
                const transformed = transformFetchedOrderToContextFormat(orderData);
                if (transformed) {
                    loadedOrders[transformed.id] = transformed;
                }
            });

            setActiveOrders(loadedOrders);
        } catch (error) {
            console.error(`[CONTEXT] Error cargando órdenes iniciales:`, error);
            toast.error("Error al cargar órdenes activas.");
            setActiveOrders({});
        } finally {
            setIsLoadingOrderContext(false);
            setInitialLoadComplete(true);
        }
    }, [transformFetchedOrderToContextFormat]); 

    useEffect(() => {
        loadInitialActiveOrders();
    }, [loadInitialActiveOrders]);

    const navigateToOrderPath = useCallback((orderIdOrNew) => {
        const basePath = '/home/produccion/orden-produccion'; let targetPath = basePath;
        const searchParams = new URLSearchParams(location.search);
        if (orderIdOrNew === null) { searchParams.delete('action'); searchParams.delete('orderId'); }
        else if (String(orderIdOrNew).startsWith('NEW_')) { searchParams.set('action', 'crear'); searchParams.delete('orderId'); }
        else if (orderIdOrNew) { searchParams.set('orderId', String(orderIdOrNew)); searchParams.delete('action'); }
        const searchString = searchParams.toString(); if (searchString) targetPath += `?${searchString}`;
        const currentFullPath = location.pathname.toLowerCase() + location.search.toLowerCase();
        const targetFullPath = targetPath.toLowerCase();
        if (currentFullPath !== targetFullPath) { 
            navigate(targetPath, { replace: true }); 
        }
    }, [navigate, location.pathname, location.search]);

    const addOrFocusOrder = useCallback(async (orderIdToFocus, isNew = false, options = {}) => {
        const cvo = currentViewedOrderIdRef.current;
        const finalOptions = { fetchIfNeeded: options.fetchIfNeeded !== false, navigateIfNeeded: options.navigateIfNeeded !== false, isUrlSyncCall: !!options.isUrlSyncCall };
        let needsLoading = !isNew && orderIdToFocus && !activeOrders[String(orderIdToFocus)] && finalOptions.fetchIfNeeded;
        if (needsLoading) setIsLoadingOrderContext(true);
        let finalTargetOrderId = null; let orderDataForCvo = null;

        if (isNew) {
            if (finalOptions.isUrlSyncCall && cvo && String(cvo).startsWith('NEW_')) {
                finalTargetOrderId = cvo; 
                orderDataForCvo = activeOrders[cvo];
                if (!orderDataForCvo) { 
                    const newId = `NEW_${Date.now()}_SYNC`; 
                    orderDataForCvo = { ...defaultOrderStructure, id: newId, formOrder: {...defaultOrderStructure.formOrder} }; 
                    setActiveOrders(prev => ({ ...prev, [newId]: orderDataForCvo })); 
                    finalTargetOrderId = newId; 
                }
            } else { 
                const newId = `NEW_${Date.now()}`; 
                orderDataForCvo = { ...defaultOrderStructure, id: newId, formOrder: {...defaultOrderStructure.formOrder} }; 
                setActiveOrders(prev => ({ ...prev, [newId]: orderDataForCvo })); 
                finalTargetOrderId = newId; 
            }
        } else if (orderIdToFocus) {
            const idStr = String(orderIdToFocus);
            if (activeOrders[idStr]) { 
                orderDataForCvo = activeOrders[idStr]; 
                finalTargetOrderId = idStr; 
            } else if (finalOptions.fetchIfNeeded) {
                try { 
                    const fetched = await productionOrderService.getProductionOrderById(idStr);
                    if (fetched) { 
                        orderDataForCvo = transformFetchedOrderToContextFormat(fetched); 
                        if (orderDataForCvo) { 
                            setActiveOrders(prev => ({ ...prev, [orderDataForCvo.id]: orderDataForCvo })); 
                            finalTargetOrderId = orderDataForCvo.id; 
                        } else {
                            finalTargetOrderId = null; 
                            toast.error(`No se pudieron procesar los datos para la orden ${idStr}.`);
                        }
                    } else { 
                        toast.error(`Orden ${idStr} no encontrada en el servidor.`); 
                        finalTargetOrderId = null; 
                    }
                } catch (err) { 
                    toast.error(`Error cargando orden ${idStr}: ${err.message}`); 
                    finalTargetOrderId = null; 
                }
            } else { 
                finalTargetOrderId = cvo; 
                orderDataForCvo = cvo ? activeOrders[cvo] : null; 
            }
        } else { 
            finalTargetOrderId = null; 
            orderDataForCvo = null; 
        }

        if (cvo !== finalTargetOrderId) { 
            setCurrentViewedOrderId(finalTargetOrderId); 
        }
        if (finalOptions.navigateIfNeeded) {
            navigateToOrderPath(finalTargetOrderId);
        }
        if (needsLoading) setIsLoadingOrderContext(false);
        return orderDataForCvo;
    }, [activeOrders, transformFetchedOrderToContextFormat, navigateToOrderPath, setCurrentViewedOrderId]);

    const publicSetCurrentViewedOrderId = useCallback((id) => {
        if (id) {
            addOrFocusOrder(id, false, { navigateIfNeeded: true, fetchIfNeeded: true });
        } else {
            addOrFocusOrder(null, false, { navigateIfNeeded: true });
        }
    }, [addOrFocusOrder]); 

    const updateOrderState = useCallback((orderIdToUpdate, partialNewState, newIdIfChanged = null) => {
        const idToUpdateStr = String(orderIdToUpdate);
        const newIdStr = newIdIfChanged ? String(newIdIfChanged) : null;
    
        setActiveOrders(prevActiveOrders => {
            const orderToUpdate = prevActiveOrders[idToUpdateStr];
            if (!orderToUpdate) {
                return prevActiveOrders;
            }
            
            const isReplacingDraft = newIdStr && newIdStr !== idToUpdateStr && idToUpdateStr.startsWith("NEW_");
    
            const potentialNextState = {
                ...orderToUpdate,
                ...partialNewState,
                formOrder: {
                    ...orderToUpdate.formOrder,
                    ...(partialNewState.formOrder || {})
                },
                formErrors: partialNewState.formOrder?.hasOwnProperty('idProduct')
                    ? { ...orderToUpdate.formErrors, idProduct: null, ...(partialNewState.formErrors || {}) }
                    : { ...orderToUpdate.formErrors, ...(partialNewState.formErrors || {}) }
            };

            let updatedOrder;
            if (isReplacingDraft) {
                updatedOrder = {
                    ...defaultOrderStructure,
                    ...partialNewState,
                    id: newIdStr,
                    isNewForForm: false,
                    formOrder: {
                        ...defaultOrderStructure.formOrder,
                        ...(partialNewState.formOrder || {}),
                        ...(orderToUpdate.formOrder || {})
                    },
                    formErrors: potentialNextState.formErrors,
                };
            } else { 
                updatedOrder = { 
                    ...potentialNextState,
                    id: newIdStr || orderToUpdate.id,
                    processSteps: partialNewState.processSteps !== undefined ? partialNewState.processSteps : orderToUpdate.processSteps,
                };
            }
    
            const newActiveOrders = { ...prevActiveOrders };
            if (isReplacingDraft) {
                delete newActiveOrders[idToUpdateStr];
            }
            newActiveOrders[updatedOrder.id] = updatedOrder;
            return newActiveOrders;
        });
    
        if (currentViewedOrderIdRef.current === idToUpdateStr && newIdStr && newIdStr !== idToUpdateStr) {
            setCurrentViewedOrderId(newIdStr);
            navigateToOrderPath(newIdStr);
        }
    }, [navigateToOrderPath, setCurrentViewedOrderId]);

    const removeOrder = useCallback((orderIdToRemove) => {
        const idStr = String(orderIdToRemove); 
        setActiveOrders(prev => { 
            const { [idStr]: _, ...rest } = prev; 
            return rest; 
        });
        if (currentViewedOrderIdRef.current === idStr) { 
            setCurrentViewedOrderId(null); 
            navigateToOrderPath(null);
        }
    }, [navigateToOrderPath, setCurrentViewedOrderId]);

    useEffect(() => { 
        if (!initialLoadComplete || isLoadingOrderContext) return;
        const currentPathname = location.pathname.toLowerCase(); 
        const moduleBasePath = "/home/produccion/orden-produccion";
        if (currentPathname !== moduleBasePath) return;

        const queryParams = new URLSearchParams(location.search); 
        const actionQueryParam = queryParams.get('action'); 
        const orderIdQueryParam = queryParams.get('orderId');
        
        const getCurrentCVO = () => currentViewedOrderIdRef.current;
        
        if (actionQueryParam === 'crear') {
            if (!getCurrentCVO() || !String(getCurrentCVO()).startsWith('NEW_')) {
                 addOrFocusOrder(null, true, { navigateIfNeeded: false, isUrlSyncCall: true });
            }
        } else if (orderIdQueryParam) {
            if (String(getCurrentCVO()) !== orderIdQueryParam || !activeOrders[orderIdQueryParam]) {
                 addOrFocusOrder(orderIdQueryParam, false, { 
                     fetchIfNeeded: !activeOrders[orderIdQueryParam], 
                     navigateIfNeeded: false, 
                     isUrlSyncCall: true 
                 });
            }
        } else if (!actionQueryParam && !orderIdQueryParam) { 
            if (getCurrentCVO() !== null) { 
                setCurrentViewedOrderId(null);
            }
        }
    }, [location.pathname, location.search, addOrFocusOrder, isLoadingOrderContext, initialLoadComplete, activeOrders, setCurrentViewedOrderId]);

    const contextValue = useMemo(() => ({
        activeOrders, 
        currentViewedOrderId: _currentViewedOrderIdInternal, 
        isLoadingOrderContext,
        addOrFocusOrder, 
        setCurrentViewedOrderId: publicSetCurrentViewedOrderId, 
        updateOrderState, 
        removeOrder,
        transformFetchedOrderToContextFormat
    }), [ activeOrders, _currentViewedOrderIdInternal, isLoadingOrderContext, addOrFocusOrder, publicSetCurrentViewedOrderId, updateOrderState, removeOrder, transformFetchedOrderToContextFormat ]);

    return <ActiveOrdersContext.Provider value={contextValue}>{children}</ActiveOrdersContext.Provider>;
};