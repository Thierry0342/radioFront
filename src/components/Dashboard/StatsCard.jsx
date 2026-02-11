// src/components/Dashboard/StatsCard.jsx
import React from 'react';
import './StatsCard.css';

// Exemple d'utilisation : <StatsCard title="Total Shipments" value="869" icon={<FaTruck />} theme="blue" />

const StatsCard = ({ title, value, icon, theme }) => {
  // 'theme' pourrait être une classe CSS comme 'card-blue', 'card-red', etc.
  return (
    <div className={`stats-card card-${theme}`}>
      <div className="card-icon-wrapper">
        {icon}
      </div>
      <div className="card-content">
        <h3 className="card-value">{value}</h3>
        <p className="card-title">{title}</p>
      </div>
      {/* Effet visuel de vague/cercle en arrière-plan (optionnel) */}
      <div className="card-bg-effect"></div>
    </div>
  );
};

export default StatsCard;