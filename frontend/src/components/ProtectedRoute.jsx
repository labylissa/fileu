import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Spinner } from "./ui/index.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
