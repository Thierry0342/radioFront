import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dasboard/Dashboard";
import DonPage from "./pages/donPage/donPage";
import DonorsPage from "./pages/Donateur/DonorsPage";
import StatePage from "./pages/StatistiquePage/StatistiquesPage";
import DonHistory from "./pages/DonHistory/DonHistory";
import TypeDonPage from "./pages/TypeDonPage/TypeDonPage"; 
import Auth from "./pages/auth/LoginPage"; 
import UserRequests from "./pages/adminPage/UserRequests";

// --- IMPORTS DES NOUVELLES PAGES ---
import ReportPage from "./pages/ReportPage/ReportPage"; // Vérifie bien le chemin
import QuickSummary from "./pages/QuickSummary/QuickSummary"; 
import Maharitra from "./pages/Maharitra/Maharitra";

// Vérifie si l'utilisateur est connecté
const PrivateRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? children : <Navigate to="/login" replace />;
};

// 🛡️ Protège les routes réservées à l'ADMIN
const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return <Navigate to="/login" replace />;
    
    // Si l'utilisateur n'est pas ADMIN, on le redirige vers le dashboard
    if (user.user?.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Auth />} />

        {/* Routes protégées par connexion */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* ✅ ACCESSIBLE À TOUS (Admin + Consultant) */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="statistique" element={<StatePage />} /> 
          <Route path="historique" element={<DonHistory />} />
          <Route path="donateur" element={<DonorsPage />} /> 
          
          {/* Nouvelles routes accessibles par tous */}
          <Route path="Report" element={<ReportPage />} />
          <Route path="QuickSummary" element={<QuickSummary />} />
          <Route path="Maharitra" element={<Maharitra />} />

          {/* 🔒 ACCESSIBLE UNIQUEMENT AUX ADMINS */}
          <Route path="saisie-don" element={<AdminRoute><DonPage /></AdminRoute>} /> 
          <Route path="type-don" element={<AdminRoute><TypeDonPage /></AdminRoute>} /> 
          <Route path="validation-comptes" element={<AdminRoute><UserRequests /></AdminRoute>} />
        </Route>

        {/* Redirection automatique si la route n'existe pas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;