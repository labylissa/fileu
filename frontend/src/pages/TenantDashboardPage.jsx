import { useAuthStore } from "../store/authStore";
import { FileText, Euro, CalendarDays, Phone, MapPin } from "lucide-react";

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function TenantDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
      </div>

      <div className="card p-8 flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <FileText size={28} className="text-blue-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Espace locataire</h2>
        <p className="text-sm text-gray-500 mb-4">
          Votre bailleur vous a ajouté à un contrat. Retrouvez vos informations de location dans l'onglet <strong>Mon contrat</strong>.
        </p>
        <p className="text-xs text-gray-400">
          Pour toute question, contactez directement votre bailleur.
        </p>
      </div>
    </div>
  );
}
