import React from 'react';
import './SecondaryNavBar.css';

// Les éléments de navigation affichés dans la barre bleue
const navItems = [
    'Logistics',
    'Order Management',
    'Fleet Management',
    'Warehouse',
    'Orders & Income',
    'Reports'
];

const SecondaryNavBar = () => {
    // Simuler le lien actif (ici, 'Logistics' est actif)
    const activeItem = 'Logistics'; 

    return (
        <nav className="secondary-nav-bar">
            {navItems.map((item, index) => (
                <a 
                    key={index} 
                    href="#" // Utiliser '#' ou le path réel si vous routez cette barre
                    className={`secondary-nav-item ${item === activeItem ? 'active' : ''}`}
                >
                    {item}
                </a>
            ))}
        </nav>
    );
};

export default SecondaryNavBar;