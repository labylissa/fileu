import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Spinner } from "./ui/index.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuthStore();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="w-8 h-8" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirige vers la bonne page d'accueil selon le rôle
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
