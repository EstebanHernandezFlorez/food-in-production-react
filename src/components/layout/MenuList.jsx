// MenuList.js
import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
import {
    Home, BadgeInfo, User, Package, Calendar, Wrench, Users,
    Building, Box, ShoppingBag, ClipboardList, Factory,
    ConciergeBell, CalendarCheck, Boxes
} from 'lucide-react';
import '../../menu.css'; // Importante que se cargue
import routes from "../../views/module/pages.routes"; // Import routes

const ICON_SIZE = 18;
const SUB_ICON_SIZE = ICON_SIZE - 2;

// Recibe textColor como prop
const MenuList = ({ collapsed, backgroundColor, textColor }) => {
    const [openKeys, setOpenKeys] = useState([]);
    const menuRef = useRef(null);
    const rootSubmenuKeys = ['produccion_submenu', 'reservas_submenu'];

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
          setOpenKeys(keys);
        } else {
          setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
      };

    const transformRoutesToMenuItems = (routes) => {
        return routes.map((route) => {
            const menuItem = {
                key: route.path,
                icon: route.icon,
                label: route.label,
                path: `/home/${route.path}`,
            };

            if (route.children) {
                menuItem.children = transformRoutesToMenuItems(route.children);
            }

            return menuItem;
        });
    };

    const menuItems = transformRoutesToMenuItems(routes);

    const renderMenuItem = (item) => {
        if (item.children) {
            return (
                <Menu.SubMenu key={item.key} icon={item.icon} title={item.label} className="submenu-item">
                    {item.children.map(renderMenuItem)}
                </Menu.SubMenu>
            );
        }
        return (
            <Menu.Item key={item.key} icon={item.icon}>
                <Link to={item.path} style={{ textDecoration: 'none' }}>
                    {item.label}
                </Link>
            </Menu.Item>
        );
    };

    return (
        <Menu
            ref={menuRef}
            mode="inline"
            theme="light" // Mantenemos light, los estilos CSS hacen el trabajo
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent', // Fondo transparente para ver el del Sider
                paddingBottom: '48px'
            }}
            // Pasamos el textColor como una variable CSS para usar en menu.css
            // Esto es opcional, también podrías definir el color directamente en menu.css
            // como lo hacíamos antes, pero así es más dinámico si alguna vez cambia.
            css={{ '--menu-text-icon-color-base': textColor }}
            className="menu-list-container"
            inlineCollapsed={collapsed}
        >
            {menuItems.map(renderMenuItem)}
        </Menu>
    );
};

export default MenuList;