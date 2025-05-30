// src/views/module/OrdenProduccion/ActiveOrdersContext.jsx
import React, { createContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import productionOrderService from '../../services/productionOrderService'; // VERIFICA RUTA
import '../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA

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
    const [currentViewedOrderId, _setCurrentViewedOrderIdInternal] = useState(null);
    const [isLoadingOrderContext, setIsLoadingOrderContext] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const transformFetchedOrderToContextFormat = useCallback((fetchedOrder) => {
        if (!fetchedOrder || !fetchedOrder.idProductionOrder) {
            console.warn(`%c[CONTEXT ${instanceId.current}] transformFetchedOrderToContextFormat: Datos de orden inválidos.`, "color: orange", fetchedOrder);
            return null;
        }

        const {
            idProductionOrder, orderNumber, idProduct, Product, idSpecSheet, SpecSheet,
            initialAmount, inputInitialWeight, inputInitialWeightUnit,
            finalQuantityProduct, finishedProductWeight, finishedProductWeightUnit,
            inputFinalWeightUnused, inputFinalWeightUnusedUnit,
            orderDate, idEmployeeRegistered, /* EmployeeRegistered, */ idProvider, /* Provider, */ observations, status,
            ProductionOrderDetails, dateTimeCreation, createdAt, dateTimeLastModified, updatedAt,
            isBaseDataValidated,
            productNameSnapshot: backendProductNameSnapshot
        } = fetchedOrder;

        const formOrderMapped = {
            ...defaultOrderStructure.formOrder, // Start with defaults
            idProduct: idProduct?.toString() || '',
            productNameSnapshot: backendProductNameSnapshot || Product?.productName || '',
            idSpecSheet: idSpecSheet?.toString() || '',
            initialAmount: initialAmount?.toString() || '',
            inputInitialWeight: inputInitialWeight?.toString() || '',
            inputInitialWeightUnit: inputInitialWeightUnit || 'kg',
            finalQuantityProduct: finalQuantityProduct?.toString() || '',
            finishedProductWeight: finishedProductWeight?.toString() || '',
            finishedProductWeightUnit: finishedProductWeightUnit || 'kg',
            inputFinalWeightUnused: inputFinalWeightUnused?.toString() || '',
            inputFinalWeightUnusedUnit: inputFinalWeightUnusedUnit || 'kg',
            orderDate: orderDate ? new Date(orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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

        const processStepsFormatted = (ProductionOrderDetails || []).map(detail => ({
            idProductionOrderDetail: String(detail.idProductionOrderDetail),
            idProcess: String(detail.idProcess || detail.idProcessSnapshot || ''),
            processOrder: detail.processOrder,
            processName: detail.processNameSnapshot || detail.Process?.processName || 'Proceso Desconocido',
            processDescription: detail.processDescriptionSnapshot || detail.Process?.description || '',
            idEmployee: String(detail.idEmployeeAssigned || ''),
            startDate: detail.startDate ? new Date(detail.startDate).toISOString().slice(0, 16) : '',
            endDate: detail.endDate ? new Date(detail.endDate).toISOString().slice(0, 16) : '',
            status: detail.status || 'PENDING',
            statusDisplay: detail.status || 'Pendiente',
            observations: detail.observations || '',
            estimatedTimeMinutes: detail.Process?.estimatedTimeMinutes || null,
            isNewStep: false,
        })).sort((a, b) => (a.processOrder || 0) - (b.processOrder || 0));

        let calculatedActiveStepIndex = null;
        if (localStatus === 'IN_PROGRESS' || localStatus === 'PAUSED') {
            const firstNonCompletedStepIndex = processStepsFormatted.findIndex(p => p.status !== 'COMPLETED');
            calculatedActiveStepIndex = firstNonCompletedStepIndex !== -1 ? firstNonCompletedStepIndex : (processStepsFormatted.length > 0 ? processStepsFormatted.length -1 : null) ;
        } else if (localStatus === 'ALL_STEPS_COMPLETED' && processStepsFormatted.length > 0) {
            calculatedActiveStepIndex = processStepsFormatted.length - 1;
        }
        
        return {
            id: String(idProductionOrder),
            orderNumberDisplay: orderNumber || `OP-${idProductionOrder}`,
            formOrder: formOrderMapped,
            localOrderStatus: localStatus,
            localOrderStatusDisplay: localStatusDisplay,
            processSteps: processStepsFormatted,
            activeStepIndex: calculatedActiveStepIndex,
            selectedSpecSheetData: SpecSheet || null,
            baseDataValidated: !!isBaseDataValidated || (localStatus !== 'PENDING' && localStatus !== 'SETUP'),
            isNewForForm: false,
            formErrors: {},
            productNameSnapshot: backendProductNameSnapshot || Product?.productName || '',
            creationDate: dateTimeCreation || createdAt,
            lastModifiedDate: dateTimeLastModified || updatedAt,
        };
    }, []); // No tiene dependencias externas directas, solo usa defaultOrderStructure y lo que se le pasa.

    const loadInitialActiveOrders = useCallback(async () => {
        console.log(`%c[CONTEXT ${instanceId.current}] loadInitialActiveOrders: Iniciando...`, "color: brown");
        setIsLoadingOrderContext(true);
        try {
            const filters = { status_not_in: ['COMPLETED', 'CANCELLED'].join(',') };
            const response = await productionOrderService.getAllProductionOrders(filters);
            const loadedOrders = {};
            if (response && Array.isArray(response.data || response)) {
                const ordersArray = response.data || response;
                ordersArray.forEach(orderData => {
                    const transformed = transformFetchedOrderToContextFormat(orderData);
                    if (transformed) loadedOrders[transformed.id] = transformed;
                });
            }
            setActiveOrders(loadedOrders);
        } catch (error) {
            console.error(`[CONTEXT ${instanceId.current}] Error cargando órdenes iniciales:`, error);
            toast.error("Error al cargar órdenes activas.");
            setActiveOrders({});
        } finally {
            setIsLoadingOrderContext(false);
            setInitialLoadComplete(true);
            console.log(`%c[CONTEXT ${instanceId.current}] loadInitialActiveOrders: Finalizado. Órdenes cargadas:`, Object.keys(activeOrders).length, "color: brown");
        }
    }, [transformFetchedOrderToContextFormat]); // Depende de transformFetchedOrderToContextFormat

    useEffect(() => {
        console.log(`%c[CONTEXT ${instanceId.current}] Provider: MONTADO`, "color: green; font-weight: bold;");
        loadInitialActiveOrders();
        return () => console.log(`%c[CONTEXT ${instanceId.current}] Provider: DESMONTÁNDOSE`, "color: red; font-weight: bold;");
    }, [loadInitialActiveOrders]); // Este efecto solo debe correr una vez al montar gracias a la dependencia estable.

    const setCurrentViewedOrderId = useCallback((id) => {
        _setCurrentViewedOrderIdInternal(id ? String(id) : null);
    }, []); // _setCurrentViewedOrderIdInternal es estable

    const navigateToOrderPath = useCallback((orderIdOrNew) => {
        const basePath = '/home/produccion/orden-produccion';
        let targetPath = orderIdOrNew === null ? basePath : String(orderIdOrNew).startsWith('NEW_') ? `${basePath}/crear` : `${basePath}/${orderIdOrNew}`;
        
        // Solo navegar si la ruta actual es diferente para evitar bucles o navegaciones innecesarias
        if (location.pathname.toLowerCase() !== targetPath.toLowerCase()) {
            console.log(`%c[CONTEXT ${instanceId.current}] navigateToOrderPath: Navegando a ${targetPath}`, "color: blue", { current: location.pathname, target: targetPath });
            navigate(targetPath, { replace: true });
        }
    }, [navigate, location.pathname]); // location.pathname es una dependencia necesaria aquí.

    const addOrFocusOrder = useCallback(async (orderIdToFocus, isNew = false, options = {}) => {
        console.log(`%c[CONTEXT ${instanceId.current}] addOrFocusOrder: id=${orderIdToFocus}, isNew=${isNew}`, "color: purple", options);
        const finalOptions = {
            fetchIfNeeded: options.fetchIfNeeded !== undefined ? options.fetchIfNeeded : true,
            navigateIfNeeded: options.navigateIfNeeded !== undefined ? options.navigateIfNeeded : true
        };

        let needsLoading = !isNew && orderIdToFocus && !activeOrders[String(orderIdToFocus)] && finalOptions.fetchIfNeeded;
        if (needsLoading) setIsLoadingOrderContext(true);

        let finalTargetOrderId = null;
        let orderDataForCvo = null;

        if (isNew) {
            const newDraftId = `NEW_${Date.now()}`;
            orderDataForCvo = { ...defaultOrderStructure, id: newDraftId };
            setActiveOrders(prev => ({ ...prev, [newDraftId]: orderDataForCvo }));
            finalTargetOrderId = newDraftId;
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
                        } else finalTargetOrderId = null; // Falló la transformación
                    } else {
                        toast.error(`Orden de producción ${idStr} no encontrada.`);
                        finalTargetOrderId = null;
                    }
                } catch (err) {
                    toast.error(`Error cargando orden de producción ${idStr}.`);
                    finalTargetOrderId = null;
                }
            } else {
                // No fetch, y no está en activeOrders, mantener el actual o null
                finalTargetOrderId = currentViewedOrderId;
                orderDataForCvo = currentViewedOrderId ? activeOrders[currentViewedOrderId] : null;
            }
        } else { // Ni nuevo, ni ID para enfocar (ej. navegar a la base /orden-produccion)
            finalTargetOrderId = null;
        }

        if (currentViewedOrderId !== finalTargetOrderId) {
            _setCurrentViewedOrderIdInternal(finalTargetOrderId);
        }

        if (finalOptions.navigateIfNeeded) {
            navigateToOrderPath(finalTargetOrderId);
        }
        if (needsLoading) setIsLoadingOrderContext(false);
        return orderDataForCvo;
    }, [currentViewedOrderId, activeOrders, transformFetchedOrderToContextFormat, navigateToOrderPath]); // Asegurar dependencias correctas

    const updateOrderState = useCallback((orderIdToUpdate, partialNewState, newIdIfChanged = null) => {
        const idToUpdateStr = String(orderIdToUpdate);
        const newIdStr = newIdIfChanged ? String(newIdIfChanged) : null;
        
        console.log(`%c[CONTEXT ${instanceId.current}] updateOrderState: id=${idToUpdateStr}, newId=${newIdStr}`, "color: darkcyan", partialNewState);

        setActiveOrders(prevActiveOrders => {
            const orderToUpdate = prevActiveOrders[idToUpdateStr];
            const isReplacingNewDraft = newIdStr && newIdStr !== idToUpdateStr && idToUpdateStr.startsWith("NEW_");

            if (!orderToUpdate && !isReplacingNewDraft) { // Si no existe la orden y no estamos reemplazando un borrador, no hacer nada
                console.warn(`%c[CONTEXT ${instanceId.current}] updateOrderState: Orden ${idToUpdateStr} no encontrada para actualizar y no es reemplazo de borrador.`, "color: orange");
                return prevActiveOrders;
            }

            let updatedOrder;
            if (isReplacingNewDraft) { // Reemplazando un borrador con una orden guardada
                updatedOrder = {
                    ...defaultOrderStructure, // Empezar con la base para asegurar todos los campos
                    ...partialNewState,       // Aplicar el estado completo de la nueva orden guardada
                    id: newIdStr,             // Asegurar el nuevo ID
                    isNewForForm: false,      // Ya no es un nuevo borrador
                };
            } else { // Actualizando una orden existente (borrador o guardada)
                updatedOrder = {
                    ...orderToUpdate,
                    ...partialNewState,
                    id: newIdStr || orderToUpdate.id, // Mantener ID si no cambia
                    // Merge profundo para formOrder y formErrors si es necesario
                    formOrder: { ...(orderToUpdate.formOrder || defaultOrderStructure.formOrder), ...(partialNewState.formOrder || {}) },
                    formErrors: { ...(orderToUpdate.formErrors || {}), ...(partialNewState.formErrors || {}) },
                };
                if (newIdStr && newIdStr !== orderToUpdate.id) { // Esto no debería pasar a menos que sea el reemplazo de borrador
                     updatedOrder.isNewForForm = false;
                }
            }

            let newActiveOrdersState = { ...prevActiveOrders };
            if (isReplacingNewDraft) {
                delete newActiveOrdersState[idToUpdateStr]; // Eliminar el antiguo ID de borrador
            }
            newActiveOrdersState[updatedOrder.id] = updatedOrder; // Añadir/actualizar con el ID correcto

            // Actualizar currentViewedOrderId y navegar solo si el ID que se estaba viendo cambió
            if (currentViewedOrderId === idToUpdateStr && newIdStr && newIdStr !== idToUpdateStr) {
                _setCurrentViewedOrderIdInternal(newIdStr); // Esto NO debe estar dentro de setActiveOrders
                // La navegación se maneja fuera si es necesario, o si es una consecuencia directa, se podría llamar aquí
                // pero es mejor que la página que guarda la orden maneje la navegación post-guardado si el ID cambia.
                // navigateToOrderPath(newIdStr); // Opcional, considerar quién debe manejar la navegación
            }
            return newActiveOrdersState;
        });
         // Si se cambió el ID de un borrador a uno real, y era el actual, navegar.
        if (currentViewedOrderId === idToUpdateStr && newIdStr && newIdStr !== idToUpdateStr) {
            navigateToOrderPath(newIdStr);
        }
    }, [currentViewedOrderId, navigateToOrderPath]); // _setCurrentViewedOrderIdInternal es estable

    const removeOrder = useCallback((orderIdToRemove) => {
        const idStr = String(orderIdToRemove);
        console.log(`%c[CONTEXT ${instanceId.current}] removeOrder: id=${idStr}`, "color: orangered");
        setActiveOrders(prev => {
            const { [idStr]: _, ...rest } = prev;
            return rest;
        });
        if (currentViewedOrderId === idStr) {
            _setCurrentViewedOrderIdInternal(null);
            navigateToOrderPath(null); // Navegar a la vista base si se elimina la orden actual
        }
    }, [currentViewedOrderId, navigateToOrderPath]); // _setCurrentViewedOrderIdInternal es estable

    // Efecto para sincronizar el estado del contexto con la URL
    useEffect(() => {
        if (!initialLoadComplete || isLoadingOrderContext) return;

        const pathSegments = location.pathname.toLowerCase().split('/').filter(Boolean);
        const moduleBase = "orden-produccion";
        let action = null;
        let paramId = null;

        const moduleIndex = pathSegments.indexOf(moduleBase);

        if (moduleIndex !== -1) { // Estamos dentro de /orden-produccion
            if (moduleIndex + 1 < pathSegments.length) { // Hay algo después de /orden-produccion
                const nextSeg = pathSegments[moduleIndex + 1];
                if (nextSeg === 'crear') {
                    action = 'crear';
                } else if (!isNaN(parseInt(nextSeg))) { // Es un número, asumimos ID de orden
                    action = 'ver';
                    paramId = nextSeg;
                } else {
                    // Subruta desconocida después de /orden-produccion, ej /orden-produccion/otracosa
                    action = 'base_unknown_subpath';
                }
            } else { // Estamos en /orden-produccion exactamente
                action = 'base';
            }
        }
        
        // console.log(`%c[CONTEXT ${instanceId.current}] URL Sync Effect: action=${action}, paramId=${paramId}, cvoid=${currentViewedOrderId}`, "color: sienna");

        if (action === 'crear') {
            // Si la URL es /crear y no tenemos un borrador activo, o el activo no es un borrador, crear uno.
            if (!currentViewedOrderId || !String(currentViewedOrderId).startsWith('NEW_')) {
                addOrFocusOrder(null, true, { navigateIfNeeded: false });
            }
        } else if (action === 'ver' && paramId) {
            // Si la URL es /:id y el currentViewedOrderId no coincide, enfocar/cargar esa orden.
            if (String(currentViewedOrderId) !== paramId) {
                addOrFocusOrder(paramId, false, { fetchIfNeeded: !activeOrders[paramId], navigateIfNeeded: false });
            }
        } else if (action === 'base' && currentViewedOrderId) {
            // Si estamos en la ruta base /orden-produccion pero hay una orden seleccionada, deseleccionarla.
            // O podría ser una decisión de diseño mantenerla seleccionada. Por ahora, la deseleccionamos.
            // _setCurrentViewedOrderIdInternal(null); // Esto podría ser demasiado agresivo.
        } else if (action === 'base_unknown_subpath') {
            // Si la URL es algo como /orden-produccion/subruta-rara, redirigir a la base.
            // Esto evita que el usuario se quede en una URL inválida que no limpia el estado.
            // navigateToOrderPath(null); // Descomentar si se quiere este comportamiento
        }

    }, [location.pathname, currentViewedOrderId, addOrFocusOrder, isLoadingOrderContext, initialLoadComplete, activeOrders, navigateToOrderPath]);


    // MEMOIZAR EL VALOR DEL CONTEXTO
    const contextValue = useMemo(() => ({
        activeOrders,
        currentViewedOrderId,
        isLoadingOrderContext,
        addOrFocusOrder,
        setCurrentViewedOrderId,
        updateOrderState,
        removeOrder,
        transformFetchedOrderToContextFormat
    }), [
        activeOrders,
        currentViewedOrderId,
        isLoadingOrderContext,
        addOrFocusOrder,          // Estas son estables (useCallback)
        setCurrentViewedOrderId,  // Estas son estables (useCallback)
        updateOrderState,         // Estas son estables (useCallback)
        removeOrder,              // Estas son estables (useCallback)
        transformFetchedOrderToContextFormat // Esta es estable (useCallback)
    ]);

    return <ActiveOrdersContext.Provider value={contextValue}>{children}</ActiveOrdersContext.Provider>;
};