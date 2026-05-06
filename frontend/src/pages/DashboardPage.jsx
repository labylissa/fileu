import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, Home, AlertCircle, ArrowRight, Plus } from "lucide-react";
import { propertiesApi } from "../api/client";
import { StatusBadge, Spinner } from "../components/ui/index.jsx";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesApi.list().then(({ data }) => setProperties(data)).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: properties.length,
    loue: properties.filter((p) => p.status === "loué").length,
    disponible: properties.filter((p) => p.status === "disponible").length,
    en_travaux: properties.filter((p) => p.status === "en_travaux").length,
    revenus: properties
      .filter((p) => p.status === "loué")
      .reduce((s, p) => s + p.rent_price + p.charges, 0),
    revenusPotentiels: properties.reduce((s, p) => s + p.rent_price + p.charges, 0),
  };

  const txOccupation = stats.total > 0 ? Math.round((stats.loue / stats.total) * 100) : 0;

  if (loading) return (
    <div className="flex justify-center py-24"><Spinner className="w-8 h-8" /></div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Voici un aperçu de votre portefeuille</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Revenus du mois",
            value: `${stats.revenus.toLocaleString("fr-FR")} €`,
            sub: `sur ${stats.revenusPotentiels.toLocaleString("fr-FR")} € potentiels`,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Taux d'occupation",
            value: `${txOccupation} %`,
            sub: `${stats.loue} bien${stats.loue > 1 ? "s" : ""} loué${stats.loue > 1 ? "s" : ""}`,
            icon: Home,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Biens disponibles",
            value: stats.disponible,
            sub: "à mettre en location",
            icon: Building2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "En travaux",
            value: stats.en_travaux,
            sub: "biens indisponibles",
            icon: AlertCircle,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Occupation bar */}
      {stats.total > 0 && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Répartition du portefeuille</h2>
            <span className="text-xs text-gray-400">{stats.total} bien{stats.total > 1 ? "s" : ""}</span>
          </div>
          <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
            {stats.loue > 0 && (
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(stats.loue / stats.total) * 100}%` }}
                title={`${stats.loue} loué${stats.loue > 1 ? "s" : ""}`}
              />
            )}
            {stats.disponible > 0 && (
              <div
                className="bg-green-400 transition-all"
                style={{ width: `${(stats.disponible / stats.total) * 100}%` }}
                title={`${stats.disponible} disponible${stats.disponible > 1 ? "s" : ""}`}
              />
            )}
            {stats.en_travaux > 0 && (
              <div
                className="bg-yellow-400 transition-all"
                style={{ width: `${(stats.en_travaux / stats.total) * 100}%` }}
                title={`${stats.en_travaux} en travaux`}
              />
            )}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { label: "Loués", color: "bg-blue-500", count: stats.loue },
              { label: "Disponibles", color: "bg-green-400", count: stats.disponible },
              { label: "En travaux", color: "bg-yellow-400", count: stats.en_travaux },
            ].map(({ label, color, count }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent properties */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Biens récents</h2>
          <Link
            to="/properties"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-8">
            <Building2 size={40} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">Aucun bien encore</p>
            <p className="text-xs text-gray-400 mb-4">
              Ajoutez votre premier bien pour commencer à gérer votre portefeuille
            </p>
            <Link to="/properties" className="btn-primary text-sm">
              <Plus size={15} /> Ajouter un bien
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {properties.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to="/properties"
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                {/* Miniature */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {p.cover_photo_url ? (
                    <img src={p.cover_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={18} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.address}</p>
                  <p className="text-xs text-gray-400">{p.zip_code} {p.city} · {p.surface} m²</p>
                </div>

                {/* Prix + statut */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {p.rent_price.toLocaleString("fr-FR")} €
                  </p>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
