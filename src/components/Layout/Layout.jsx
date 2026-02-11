import React from 'react';
import { Outlet } from 'react-router-dom'; // <--- TRES IMPORTANT
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import './Layout.css';

const Layout = () => {
  return (
    <div className="app-container">
      <Sidebar /> 
      <div className="main-content">
        <TopBar title="Radio Maria Dashboard" />
        <div className="page-content">
          
           {/* C'est ici que Dashboard, Orders, ou Fleet s'affichera */}
           {/* La Sidebar, elle, ne bougera pas ! */}
           <Outlet /> 

        </div>
      </div>
    </div>
  );
};

export default Layout;