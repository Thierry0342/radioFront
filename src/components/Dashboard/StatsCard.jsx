import React from 'react';
import './StatsCard.css'; // Nous créerons ce CSS juste après

const StatsCard = ({ title, value, subtitle, icon, theme }) => {
    // Gestion des couleurs selon le thème (blue, green, orange, purple)
    const getThemeColor = () => {
        switch (theme) {
            case 'blue': return '#0d6efd';
            case 'green': return '#198754';
            case 'orange': return '#fd7e14';
            case 'purple': return '#6f42c1';
            default: return '#6c757d';
        }
    };

    const themeColor = getThemeColor();

    return (
        <div className={`stats-card theme-${theme}`}>
            <div className="stats-card-body">
                <div className="stats-content">
                    <h6 className="stats-title" style={{ color: themeColor }}>{title}</h6>
                    <h3 className="stats-value">{value}</h3>
                    {/* C'est ici que les badges s'affichent */}
                    <div className="stats-subtitle">
                        {subtitle}
                    </div>
                </div>
                <div className="stats-icon-container" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                    <div className="stats-icon">
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;