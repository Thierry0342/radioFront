import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dasboard/Dashboard";
import DonPage from "./pages/donPage/donPage";
import DonorsPage from "./pages/Donateur/DonorsPage";
import StatePage from "./pages/StatistiquePage/StatistiquesPage";
import DonHistory from "./pages/DonHistory/DonHistory";
// 🎯 Import de la nouvelle page Type de Don
import TypeDonPage from "./pages/TypeDonPage/TypeDonPage"; 
import Report from "./pages/ReportPage/ReportPage"; 
import QuickSummary from "./pages/QuickSummary/QuickSummary"; 
import Maharitra from "./pages/Maharitra/Maharitra"; 



function App() {
  return (
    <Router>
      <Routes>
        
        {/* --- ROUTES PRINCIPALES AVEC LAYOUT (Sidebar Fixe) --- */}
        <Route path="/" element={<Layout />}>
          
            {/* Redirection vers le Dashboard au démarrage */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Pages du tableau de bord */}
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="saisie-don" element={<DonPage />} /> 
            <Route path="donateur" element={<DonorsPage />} /> 
            
            {/* 🎯 NOUVELLE ROUTE : Configuration des types de dons */}
            <Route path="type-don" element={<TypeDonPage />} /> 

            <Route path="statistique" element={<StatePage />} /> 
            <Route path="historique" element={<DonHistory />} />
            <Route path="Report" element={<Report />} />
            <Route path="QuickSummary" element={<QuickSummary />} />
            <Route path="Maharitra" element={<Maharitra />} />
            
        </Route>

      </Routes>
    </Router>
  );
}

export default App;