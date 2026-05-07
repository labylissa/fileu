import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, SlidersHorizontal, FileText,
  RefreshCw, X, User, Euro, CalendarDays, MapPin,
  XCircle, CheckCircle, Clock, AlertTriangle,
} from "lucide-react";
import { contractsApi } from "../api/client";
import ContractCard from "../components/contracts/ContractCard.jsx";
import ContractFormWizard from "../components/contracts/ContractFormWizard.jsx";
import { Modal, ConfirmDialog, EmptyState, Spinner } from "../components/ui/index.jsx";
import { clsx } from "clsx";

const STATUS_LABELS = {
  brouillon: "Brouillon",
  actif:     "Actif",
  "expiré":  "Expiré",
  "résilié": "Résilié",
};

const TYPE_LABELS = {
  "meublé":     "Meublé",
  "non meublé": "Non meublé",
  "mobilité":   "Mobilité",
  "étudiant":   "Étudiant",
  "colocation": "Colocation",
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function ContractsPage() {
  const [contracts, setContracts]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filters, setFilters]         = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showCreate, setShowCreate]       = useState(false);
  const [editContract, setEditContract]   = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [resilierTarget, setResilierTarget] = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]                 = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.property_id) params.property_id = filters.property_id;
      const { data } = await contractsApi.list(params);
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleResilier = async () => {
    setActionLoading(true);
    try {
      await contractsApi.resilier(resilierTarget.id);
      setResilierTarget(null);
      fetchContracts();
      if (detailContract?.id === resilierTarget.id) setDetailContract(null);
      showToast("Contrat résilié — le bien est remis en disponible");
    } catch (err) {
      showToast(err.response?.data?.detail ?? "Erreur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await contractsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchContracts();
      if (detailContract?.id === deleteTarget.id) setDetailContract(null);
      showToast("Contrat supprimé");
    } catch (err) {
      showToast(err.response?.data?.detail ?? "Erreur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrage local par recherche texte
  const filtered = contracts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.tenant_firstname.toLowerCase().includes(q) ||
      c.tenant_lastname.toLowerCase().includes(q) ||
      c.tenant_email.toLowerCase().includes(q) ||
      c.property?.address?.toLowerCase().includes(q) ||
      c.property?.city?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total:    contracts.length,
    actif:    contracts.filter((c) => c.status === "actif").length,
    brouillon: contracts.filter((c) => c.status === "brouillon").length,
    expire:   contracts.filter((c) => c.status === "expiré" || c.status === "résilié").length,
    revenus:  contracts
      .filter((c) => c.status === "actif")
      .reduce((s, c) => s + c.rent_amount + (c.charges_amount ?? 0), 0),
    expiringSoon: contracts.filter((c) => {
      if (!c.end_date || c.status !== "actif") return false;
      const days = (new Date(c.end_date) - new Date()) / 86400000;
      return days >= 0 && days <= 60;
    }).length,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={clsx(
          "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
        )}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contrats de bail</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} contrat{stats.total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Nouveau contrat
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Revenus/mois",
            value: `${stats.revenus.toLocaleString("fr-FR")} €`,
            color: "text-purple-600",
            bg:    "bg-purple-50",
            icon:  Euro,
          },
          {
            label: "Actifs",
            value: stats.actif,
            color: "text-emerald-600",
            bg:    "bg-emerald-50",
            icon:  CheckCircle,
          },
          {
            label: "Brouillons",
            value: stats.brouillon,
            color: "text-gray-600",
            bg:    "bg-gray-100",
            icon:  Clock,
          },
          {
            label: "Terminés",
            value: stats.expire,
            color: "text-red-500",
            bg:    "bg-red-50",
            icon:  XCircle,
          },
          {
            label: "Expirent bientôt",
            value: stats.expiringSoon,
            color: "text-amber-600",
            bg:    "bg-amber-50",
            icon:  AlertTriangle,
          },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="card px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center", bg)}>
                <Icon size={14} className={color} />
              </div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className={clsx("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher par locataire, adresse…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={clsx("btn-secondary gap-2", showFilters && "ring-2 ring-blue-500")}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={15} /> Filtres
          {Object.values(filters).some(Boolean) && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>
        <button className="btn-secondary" onClick={fetchContracts}>
          <RefreshCw size={15} />
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 mb-5 grid grid-cols-3 gap-4">
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={filters.status ?? ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="brouillon">Brouillon</option>
              <option value="expiré">Expiré</option>
              <option value="résilié">Résilié</option>
            </select>
          </div>
          <div className="col-span-2 flex items-end justify-end">
            <button
              className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1"
              onClick={() => setFilters({})}
            >
              <X size={13} /> Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-8 h-8" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun contrat trouvé"
          description={
            contracts.length === 0
              ? "Créez votre premier contrat de bail pour commencer."
              : "Aucun contrat ne correspond à vos critères."
          }
          action={
            contracts.length === 0 && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Créer un contrat
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              onClick={() => setDetailContract(c)}
              onEdit={(e) => { e?.stopPropagation(); setEditContract(c); }}
              onResilier={(e) => { e?.stopPropagation(); setResilierTarget(c); }}
              onDelete={(e) => { e?.stopPropagation(); setDeleteTarget(c); }}
            />
          ))}
        </div>
      )}

      {/* ── Modal : Créer ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau contrat" size="xl">
        <ContractFormWizard
          onSuccess={() => { setShowCreate(false); fetchContracts(); showToast("Contrat créé avec succès"); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* ── Modal : Éditer ── */}
      <Modal open={!!editContract} onClose={() => setEditContract(null)} title="Modifier le contrat" size="xl">
        {editContract && (
          <ContractFormWizard
            initial={editContract}
            onSuccess={() => {
              setEditContract(null);
              fetchContracts();
              showToast("Contrat mis à jour");
            }}
            onCancel={() => setEditContract(null)}
          />
        )}
      </Modal>

      {/* ── Modal : Détail ── */}
      <Modal
        open={!!detailContract}
        onClose={() => setDetailContract(null)}
        title={detailContract
          ? `${detailContract.tenant_firstname} ${detailContract.tenant_lastname}`
          : ""}
        size="lg"
      >
        {detailContract && (
          <div className="space-y-6 text-sm">
            {/* Status badges */}
            <div className="flex gap-2 -mt-1">
              <span className={clsx("badge", {
                "bg-emerald-100 text-emerald-800": detailContract.status === "actif",
                "bg-gray-100 text-gray-600":       detailContract.status === "brouillon",
                "bg-amber-100 text-amber-700":     detailContract.status === "expiré",
                "bg-red-100 text-red-700":         detailContract.status === "résilié",
              })}>
                {STATUS_LABELS[detailContract.status]}
              </span>
              <span className="badge bg-blue-50 text-blue-700">
                {TYPE_LABELS[detailContract.contract_type]}
              </span>
            </div>

            {/* Bien */}
            {detailContract.property && (
              <div>
                <p className="label mb-1">Bien loué</p>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-2 text-gray-700">
                  <MapPin size={14} className="text-gray-400" />
                  {detailContract.property.address} — {detailContract.property.city}
                  <span className="text-gray-400">·</span>
                  {detailContract.property.surface} m² · {detailContract.property.property_type}
                </div>
              </div>
            )}

            {/* Locataire */}
            <div>
              <p className="label mb-2">Locataire principal</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[
                  ["Email",         detailContract.tenant_email],
                  ["Téléphone",     detailContract.tenant_phone ?? "—"],
                  ["Date de naissance", fmt(detailContract.tenant_birth_date)],
                  ["Lieu de naissance", detailContract.tenant_birth_place ?? "—"],
                  ["Profession",    detailContract.tenant_profession ?? "—"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{l}</p>
                    <p className="text-gray-800 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              {detailContract.cotenants?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Co-locataires</p>
                  <div className="space-y-1">
                    {detailContract.cotenants.map((ct, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700">
                        <User size={13} className="text-gray-400" />
                        {ct.firstname} {ct.lastname}
                        {ct.email && <span className="text-gray-400">· {ct.email}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bail */}
            <div>
              <p className="label mb-2">Durée du bail</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["Début",    fmt(detailContract.start_date)],
                  ["Fin",      fmt(detailContract.end_date)],
                  ["Préavis",  `${detailContract.notice_period} mois`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-gray-400">{l}</p>
                    <p className="font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financier */}
            <div>
              <p className="label mb-2">Finances</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[
                  ["Loyer HC",           `${detailContract.rent_amount.toLocaleString("fr-FR")} €`],
                  ["Charges",            `${(detailContract.charges_amount ?? 0).toLocaleString("fr-FR")} €`],
                  ["Total CC",           `${(detailContract.rent_amount + (detailContract.charges_amount ?? 0)).toLocaleString("fr-FR")} €`],
                  ["Dépôt de garantie",  `${(detailContract.deposit_amount ?? 0).toLocaleString("fr-FR")} €`],
                  ["Jour de paiement",   `Le ${detailContract.payment_day} du mois`],
                  ["Mode de paiement",   detailContract.payment_method],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{l}</p>
                    <p className="text-gray-800 font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Révision */}
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium text-blue-800 mb-1">Révision annuelle du loyer</p>
              {detailContract.rent_revision_enabled ? (
                <p className="text-blue-700">
                  Activée — Indice {detailContract.rent_revision_index},
                  révision en {["Janvier","Février","Mars","Avril","Mai","Juin",
                    "Juillet","Août","Septembre","Octobre","Novembre","Décembre"][
                      detailContract.rent_revision_month - 1]}
                </p>
              ) : (
                <p className="text-blue-600">Désactivée</p>
              )}
            </div>

            {/* Clauses */}
            {detailContract.special_clauses && (
              <div>
                <p className="label mb-1">Clauses particulières</p>
                <p className="text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                  {detailContract.special_clauses}
                </p>
              </div>
            )}

            {/* Notes internes */}
            {detailContract.internal_notes && (
              <div>
                <p className="label mb-1">Notes internes</p>
                <p className="text-gray-600 whitespace-pre-line bg-amber-50 border border-amber-100 rounded-lg p-3">
                  {detailContract.internal_notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                className="btn-secondary"
                onClick={() => { setDetailContract(null); setEditContract(detailContract); }}
              >
                Modifier
              </button>
              {detailContract.status === "actif" && (
                <button
                  className="btn-danger"
                  onClick={() => { setDetailContract(null); setResilierTarget(detailContract); }}
                >
                  Résilier le contrat
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm résiliation ── */}
      <ConfirmDialog
        open={!!resilierTarget}
        onClose={() => setResilierTarget(null)}
        onConfirm={handleResilier}
        title="Résilier ce contrat ?"
        message={`Le contrat de ${resilierTarget?.tenant_firstname} ${resilierTarget?.tenant_lastname} sera marqué comme résilié et le bien remis en "disponible".`}
        confirmLabel={actionLoading ? "En cours…" : "Résilier"}
        danger
      />

      {/* ── Confirm suppression ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce contrat ?"
        message="Cette action est irréversible. Le contrat sera définitivement supprimé."
        confirmLabel={actionLoading ? "Suppression…" : "Supprimer"}
        danger
      />
    </div>
  );
}
