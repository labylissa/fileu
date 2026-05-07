import { useState, useEffect } from "react";
import { contractsApi } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { Spinner, EmptyState } from "../components/ui/index.jsx";
import { FileText, MapPin, CalendarDays, Euro, Phone, Mail, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

const STATUS_STYLES = {
  actif:     "bg-emerald-100 text-emerald-800",
  brouillon: "bg-gray-100 text-gray-600",
  "expiré":  "bg-amber-100 text-amber-700",
  "résilié": "bg-red-100 text-red-700",
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function TenantContractPage() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    // Le locataire voit les contrats qui le concernent (via son email)
    contractsApi.listTenant()
      .then(({ data }) => setContracts(data))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  );

  if (contracts.length === 0) return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon contrat</h1>
      <EmptyState
        icon={FileText}
        title="Aucun contrat trouvé"
        description="Votre bailleur n'a pas encore enregistré de contrat associé à votre adresse email."
      />
    </div>
  );

  const contract = contracts[0];
  const total = contract.rent_amount + (contract.charges_amount ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon contrat</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte principale */}
        <div className="lg:col-span-2 space-y-5">

          {/* Statut */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={clsx("badge", STATUS_STYLES[contract.status])}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </span>
              <span className="badge bg-blue-50 text-blue-700">{contract.contract_type}</span>
            </div>

            {contract.property && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <MapPin size={15} className="text-gray-400" />
                <span className="font-medium">
                  {contract.property.address}, {contract.property.zip_code} {contract.property.city}
                </span>
              </div>
            )}
          </div>

          {/* Durée */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-500" /> Durée du bail
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                ["Début",   fmt(contract.start_date)],
                ["Fin",     fmt(contract.end_date)],
                ["Préavis", `${contract.notice_period} mois`],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{l}</p>
                  <p className="font-semibold text-gray-800 text-sm">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Finances */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Euro size={16} className="text-blue-500" /> Détail financier
            </h3>
            <div className="space-y-3">
              {[
                ["Loyer hors charges",  `${contract.rent_amount.toLocaleString("fr-FR")} €`],
                ["Charges",             `${(contract.charges_amount ?? 0).toLocaleString("fr-FR")} €`],
                ["Dépôt de garantie",   `${(contract.deposit_amount ?? 0).toLocaleString("fr-FR")} €`],
                ["Paiement le",         `${contract.payment_day} du mois · ${contract.payment_method}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-gray-900">Total charges comprises</span>
                <span className="text-blue-600">{total.toLocaleString("fr-FR")} €/mois</span>
              </div>
            </div>
          </div>

          {/* Clauses */}
          {contract.special_clauses && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Clauses particulières</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                {contract.special_clauses}
              </p>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-5">
          {/* Mes infos */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Mes informations</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">
                {contract.tenant_firstname} {contract.tenant_lastname}
              </p>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail size={13} /> {contract.tenant_email}
              </div>
              {contract.tenant_phone && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone size={13} /> {contract.tenant_phone}
                </div>
              )}
              {contract.tenant_profession && (
                <p className="text-gray-500">{contract.tenant_profession}</p>
              )}
            </div>

            {/* Co-locataires */}
            {contract.cotenants?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Co-locataires
                </p>
                {contract.cotenants.map((ct, i) => (
                  <p key={i} className="text-sm text-gray-700">
                    {ct.firstname} {ct.lastname}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Révision loyer */}
          {contract.rent_revision_enabled && (
            <div className="card p-5 bg-blue-50 border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Révision annuelle</h3>
              <p className="text-xs text-blue-700">
                Indice {contract.rent_revision_index} · révision en{" "}
                {["Janvier","Février","Mars","Avril","Mai","Juin",
                  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"][
                    contract.rent_revision_month - 1]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
