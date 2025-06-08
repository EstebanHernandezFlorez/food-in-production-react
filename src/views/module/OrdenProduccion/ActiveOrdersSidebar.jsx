// src/views/module/OrdenProduccion/ActiveOrdersSidebar.jsx
import React, { useContext } from 'react';
import { ListGroup, ListGroupItem, Badge, Spinner } from 'reactstrap';
import { ActiveOrdersContext } from './ActiveOrdersContext';
// import { useNavigate, useParams } from 'react-router-dom'; // No se usan directamente
import { ChefHat, Inbox, Edit3 } from 'lucide-react';
import '../../../assets/css/produccion/ProduccionStyles.css'; // VERIFICA ESTA RUTA


// --- Estilos (como los tenías) ---
const COLOR_BASE_TEXT_ICON = '#5C4033';
const COLOR_ACCENT_SELECTED_BG = '#7e2d2d';
const COLOR_NOTIFICATION_BADGE_BG = '#E53E3E';
const COLOR_NOTIFICATION_BADGE_TEXT = '#FFFFFF';
const COLOR_LIST_ITEM_HOVER_BG = '#f8f9fa';
const COLOR_LIST_ITEM_ACTIVE_BG = 'rgba(126, 45, 45, 0.1)';

const styles = {
    sidebarContainer: { display: 'flex', flexDirection: 'column', height: '100%' },
    listGroup: { flexGrow: 1, overflowY: 'auto', borderTop: '1px solid #dee2e6' },
    listItem: {
        display: 'flex', alignItems: 'center', cursor: 'pointer',
        padding: '10px 15px', borderBottom: '1px solid #e9ecef',
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
        backgroundColor: '#fff',
    },
    listItemHover: { backgroundColor: COLOR_LIST_ITEM_HOVER_BG, },
    listItemActive: {
        backgroundColor: COLOR_LIST_ITEM_ACTIVE_BG,
        borderLeft: `4px solid ${COLOR_ACCENT_SELECTED_BG}`,
        paddingLeft: '11px',
    },
    iconWrapper: {
        position: 'relative', marginRight: '12px', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '5px', borderRadius: '50%',
        border: `2px solid transparent`,
        transition: 'border-color 0.2s ease-in-out, background-color 0.2s ease-in-out',
        width: '38px', height: '38px',
        backgroundColor: '#e9ecef',
    },
    iconWrapperActive: {
        borderColor: COLOR_ACCENT_SELECTED_BG,
        backgroundColor: '#fff',
    },
    iconItself: {
        width: '20px', height: '20px',
        color: COLOR_BASE_TEXT_ICON,
        transition: 'color 0.2s ease-in-out',
    },
    iconItselfActive: { color: COLOR_ACCENT_SELECTED_BG, },
    stepNumberBadge: {
        position: 'absolute', top: '-2px', right: '-4px',
        backgroundColor: COLOR_NOTIFICATION_BADGE_BG, color: COLOR_NOTIFICATION_BADGE_TEXT,
        borderRadius: '50%', padding: '2px', fontSize: '0.65rem', fontWeight: 'bold',
        lineHeight: '1', minWidth: '16px', minHeight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid white`,
        zIndex: 1,
    },
    orderDetails: { overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 },
    mainDisplayLine: {
        fontSize: '0.875rem', color: COLOR_BASE_TEXT_ICON, fontWeight: '500',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3',
    },
    mainDisplayLineActive: { fontWeight: '600', color: COLOR_ACCENT_SELECTED_BG, },
    secondaryDisplayLine: {
        fontSize: '0.75rem', color: '#6c757d',
        lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    secondaryDisplayLineActive: { color: COLOR_ACCENT_SELECTED_BG }
};


const ActiveOrdersSidebar = () => {
    const context = useContext(ActiveOrdersContext);

    if (!context) {
        return <p className="p-3 text-muted small">Contexto de órdenes no disponible.</p>;
    }

    const { activeOrders, currentViewedOrderId, setCurrentViewedOrderId, isLoadingOrderContext } = context;
    // addOrFocusOrder fue reemplazado por setCurrentViewedOrderId para uso externo del sidebar

    const displayableOrderKeys = Object.keys(activeOrders)
        .filter(orderId => {
            const order = activeOrders[orderId];
            if (!order) return false;
            return !['COMPLETED', 'CANCELLED'].includes(order.localOrderStatus);
        })
        .sort((aKey, bKey) => {
            const orderA = activeOrders[aKey];
            const orderB = activeOrders[bKey];
            if (orderA.isNewForForm && !orderB.isNewForForm) return -1;
            if (!orderA.isNewForForm && orderB.isNewForForm) return 1;
            if (orderA.isNewForForm && orderB.isNewForForm) {
                if (orderA.localOrderStatus === 'PENDING' && orderB.localOrderStatus !== 'PENDING') return -1;
                if (orderA.localOrderStatus !== 'PENDING' && orderB.localOrderStatus === 'PENDING') return 1;
            }
            const idNumA = parseInt(String(orderA.id).replace(/\D/g, ''), 10);
            const idNumB = parseInt(String(orderB.id).replace(/\D/g, ''), 10);
            if (!isNaN(idNumA) && !isNaN(idNumB)) {
                if (idNumA !== idNumB) return idNumB - idNumA;
            }
            if (String(orderA.id).startsWith('NEW_') && String(orderB.id).startsWith('NEW_')) {
                return String(orderB.id).localeCompare(String(orderA.id));
            }
            return String(orderB.id).localeCompare(String(orderA.id));
        });
    
    const handleSelectOrder = (orderId) => {
        if (isLoadingOrderContext || currentViewedOrderId === orderId) {
            return;
        }
        // Usar la función exportada setCurrentViewedOrderId que ahora llama a addOrFocusOrder
        setCurrentViewedOrderId(orderId);
    };

    if (isLoadingOrderContext && displayableOrderKeys.length === 0) {
        return (
            <div className="p-3 text-center text-muted small d-flex align-items-center justify-content-center" style={{minHeight: '100px'}}>
                <Spinner size="sm" className="me-2"/> Cargando órdenes...
            </div>
        );
    }

    if (displayableOrderKeys.length === 0) {
        return (
            <div className="p-4 text-center text-muted d-flex flex-column align-items-center justify-content-center" style={{minHeight: '200px'}}>
                <Inbox size={40} className="mb-3 text-secondary" />
                <p className="h6 mb-1">No hay órdenes activas</p>
                <p className="small">Cree una nueva para comenzar.</p>
            </div>
        );
    }
    
    return (
        <ListGroup flush className="active-orders-list" style={styles.listGroup}>
            {displayableOrderKeys.map(orderId => {
                const order = activeOrders[orderId];
                if (!order) return null; 

                const isActive = currentViewedOrderId === orderId;
                
                let mainDisplayText = order.productNameSnapshot || `Orden #${order.orderNumberDisplay || String(order.id).substring(0,15)}`;
                if (order.isNewForForm && !order.productNameSnapshot) {
                     mainDisplayText = order.localOrderStatus === 'PENDING' ? "Nuevo Borrador" : "Configurando Orden";
                }

                let secondaryDisplayText = order.orderNumberDisplay ? `OP: ${order.orderNumberDisplay}` : `ID: ${String(order.id).substring(0,15)}`;
                if (order.isNewForForm && (order.localOrderStatus === 'PENDING' || order.localOrderStatus === 'SETUP')) {
                    secondaryDisplayText = order.localOrderStatus === 'PENDING' ? "Pendiente de guardar" : "En configuración";
                }
                
                let statusBadgeText = order.localOrderStatusDisplay || order.localOrderStatus;
                if (order.isNewForForm && (order.localOrderStatus === 'PENDING' || order.localOrderStatus === 'SETUP') && !order.productNameSnapshot) {
                    statusBadgeText = null; 
                }

                let stepNumberIndicator = null;
                if (order.localOrderStatus === 'IN_PROGRESS' &&
                    order.activeStepIndex !== null &&
                    order.processSteps &&
                    order.processSteps.length > 0) {
                    const currentStepNumber = order.activeStepIndex + 1;
                    stepNumberIndicator = <span style={styles.stepNumberBadge}>{currentStepNumber}</span>;
                }

                const IconComponent = (order.isNewForForm && order.localOrderStatus === 'PENDING') ? Edit3 : ChefHat;
                const iconWrapperCurrentStyles = { ...styles.iconWrapper, ...(isActive ? styles.iconWrapperActive : {}) };
                const iconItselfCurrentStyles = { ...styles.iconItself, ...(isActive ? styles.iconItselfActive : {}) };
                const mainDisplayLineCurrentStyles = { ...styles.mainDisplayLine, ...(isActive ? styles.mainDisplayLineActive : {}) };
                const secondaryDisplayLineCurrentStyles = { ...styles.secondaryDisplayLine, ...(isActive ? styles.secondaryDisplayLineActive : {}) };

                return (
                    <ListGroupItem
                        key={orderId}
                        action
                        onClick={() => handleSelectOrder(orderId)}
                        disabled={isLoadingOrderContext}
                        style={{
                            ...styles.listItem,
                            ...(isActive ? styles.listItemActive : {}),
                            cursor: isLoadingOrderContext ? 'wait' : 'pointer'
                        }}
                        title={mainDisplayText + (secondaryDisplayText ? ` - ${secondaryDisplayText}` : '')}
                    >
                        <div style={iconWrapperCurrentStyles}>
                            <IconComponent style={iconItselfCurrentStyles} />
                            {stepNumberIndicator}
                        </div>
                        <div style={styles.orderDetails}>
                            <div className="d-flex justify-content-between align-items-start">
                                <span style={mainDisplayLineCurrentStyles} title={mainDisplayText}>
                                    {mainDisplayText}
                                </span>
                                {statusBadgeText && (
                                    <Badge
                                        color={
                                            order.localOrderStatus === 'COMPLETED' ? 'success' :
                                            order.localOrderStatus === 'CANCELLED' ? 'danger' :
                                            order.localOrderStatus === 'IN_PROGRESS' ? 'warning' :
                                            order.localOrderStatus === 'PAUSED' ? 'secondary' :
                                            order.localOrderStatus === 'ALL_STEPS_COMPLETED' ? 'info' :
                                            order.localOrderStatus === 'SETUP_COMPLETED' ? 'primary' :
                                            order.localOrderStatus === 'SETUP' ? 'info' : 
                                            order.localOrderStatus === 'PENDING' ? 'light' : 
                                            'light' 
                                        }
                                        pill
                                        className="ms-2 small flex-shrink-0 align-self-center"
                                        style={{fontSize: '0.7rem', padding: '0.25em 0.6em'}}
                                    >
                                        {statusBadgeText}
                                    </Badge>
                                )}
                            </div>
                            {secondaryDisplayText && (
                                <span style={secondaryDisplayLineCurrentStyles} title={secondaryDisplayText}>
                                    {secondaryDisplayText}
                                </span>
                            )}
                        </div>
                    </ListGroupItem>
                );
            })}
        </ListGroup>
    );
};

export default ActiveOrdersSidebar;