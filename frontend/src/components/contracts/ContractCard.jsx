import { useState } from "react";
import {
  User, MapPin, CalendarDays, Euro, MoreVertical,
  Pencil, Trash2, XCircle, FileText, AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";

const TYPE_LABELS = {
  "meublé":       "Meublé",
  "non meublé":   "Non meublé",
  "mobilité":     "Mobilité",
  "étudiant":     "Étudiant",
  "colocation":   "Colocation",
};

const STATUS_STYLES = {
  brouillon: "bg-gray-100 text-gray-600",
  actif:     "bg-emerald-100 text-emerald-800",
  "expiré":  "bg-amber-100 text-amber-700",
  "résilié": "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  brouillon: "Brouillon",
  actif:     "Actif",
  "expiré":  "Expiré",
  "résilié": "Résilié",
};

function ContractMenu({ contract, onEdit, onResilier, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} /> Modifier
            </button>
            {contract.status === "actif" && (
              <button
                onClick={(e) => { e.stopPropagation(); onResilier(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                <XCircle size={14} /> Résilier
              </button>
            )}
            {contract.status !== "actif" && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function ContractCard({ contract, onClick, onEdit, onResilier, onDelete }) {
  const total = contract.rent_amount + (contract.charges_amount ?? 0);
  const isExpiringSoon = (() => {
    if (!contract.end_date || contract.status !== "actif") return false;
    const days = (new Date(contract.end_date) - new Date()) / 86400000;
    return days >= 0 && days <= 60;
  })();

  return (
    <div
      onClick={onClick}
      className="card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Top strip — statut */}
      <div className={clsx("h-1 w-full", {
        "bg-emerald-400": contract.status === "actif",
        "bg-amber-400":   contract.status === "expiré",
        "bg-red-400":     contract.status === "résilié",
        "bg-gray-300":    contract.status === "brouillon",
      })} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx("badge text-xs", STATUS_STYLES[contract.status])}>
                {STATUS_LABELS[contract.status]}
              </span>
              <span className="badge bg-blue-50 text-blue-700 text-xs">
                {TYPE_LABELS[contract.contract_type] ?? contract.contract_type}
              </span>
              {isExpiringSoon && (
                <span className="badge bg-amber-50 text-amber-700 text-xs flex items-center gap-1">
                  <AlertTriangle size={10} /> Expire bientôt
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 leading-tight">
              {contract.tenant_firstname} {contract.tenant_lastname}
            </h3>
            {contract.cotenants?.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                +{contract.cotenants.length} co-locataire{contract.cotenants.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <ContractMenu
            contract={contract}
            onEdit={onEdit}
            onResilier={onResilier}
            onDelete={onDelete}
          />
        </div>

        {/* Bien */}
        {contract.property && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <MapPin size={13} className="shrink-0 text-gray-400" />
            <span className="truncate">
              {contract.property.address} · {contract.property.city}
            </span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <CalendarDays size={13} className="shrink-0 text-gray-400" />
          <span>
            Du {fmt(contract.start_date)}
            {contract.end_date ? ` au ${fmt(contract.end_date)}` : " · Durée indéterminée"}
          </span>
        </div>

        {/* Footer financier */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {total.toLocaleString("fr-FR")} €
            </span>
            <span className="text-xs text-gray-400">/mois CC</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {contract.rent_amount.toLocaleString("fr-FR")} € HC
            </p>
            {contract.deposit_amount > 0 && (
              <p className="text-xs text-gray-400">
                DG : {contract.deposit_amount.toLocaleString("fr-FR")} €
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
