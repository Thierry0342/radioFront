import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dasboard/Dashboard";
import DonPage from "./pages/donPage/donPage";
import  DonorsPage  from "./pages/Donateur/DonorsPage";
import StatePage from "./pages/StatistiquePage/StatistiquesPage"

// Import des autres pages


function App() {
  return (
    <Router>
      <Routes>
        
        {/* --- ROUTES PRINCIPALES AVEC LAYOUT (Sidebar Fixe) --- */}
        <Route path="/" element={<Layout />}>
          
            {/* Redirection vers le Dashboard au démarrage */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Pages du tableau de bord (s'affichent DANS l'<Outlet />) */}
            <Route path="dashboard" element={<Dashboard />} />
           
            
            {/* 🎯 NOUVEAU: La page de saisie de don est maintenant dans le Layout */}
            <Route path="saisie-don" element={<DonPage />} /> 
            <Route path="donateur" element={<DonorsPage />} /> 
            <Route path="statistique" element={<StatePage />} /> 


       
            
        </Route>
        
        {/* Si l'ancienne route /don était destinée à un usage public sans Sidebar,
           vous pouvez la garder, mais j'ai supposé que vous utiliserez maintenant /saisie-don. 
        <Route path="/don" element={<DonPage />} /> 
        */}

      </Routes>
    </Router>
  );
}

export default App;