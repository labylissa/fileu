import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, SlidersHorizontal, Building2,
  RefreshCw, X, ChevronDown,
} from "lucide-react";
import { propertiesApi } from "../api/client";
import PropertyCard from "../components/properties/PropertyCard.jsx";
import PropertyFormWizard from "../components/properties/PropertyFormWizard.jsx";
import PhotoManager from "../components/properties/PhotoManager.jsx";
import InventoryManager from "../components/properties/InventoryManager.jsx";
import { Modal, ConfirmDialog, EmptyState, Spinner, StatusBadge } from "../components/ui/index.jsx";

const TABS = ["Infos", "Photos", "Inventaire"];

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [detailProperty, setDetailProperty] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.min_rent) params.min_rent = filters.min_rent;
      if (filters.max_rent) params.max_rent = filters.max_rent;
      if (filters.is_furnished !== undefined && filters.is_furnished !== "")
        params.is_furnished = filters.is_furnished;
      const { data } = await propertiesApi.list(params);
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const openDetail = async (property) => {
    const { data } = await propertiesApi.get(property.id);
    setDetailProperty(data);
    setDetailTab(0);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await propertiesApi.delete(deleteId);
      setDeleteId(null);
      fetchProperties();
      if (detailProperty?.id === deleteId) setDetailProperty(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = properties.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.zip_code.includes(q)
    );
  });

  // Stats rapides
  const stats = {
    total: properties.length,
    disponible: properties.filter((p) => p.status === "disponible").length,
    loue: properties.filter((p) => p.status === "loué").length,
    revenus: properties
      .filter((p) => p.status === "loué")
      .reduce((s, p) => s + p.rent_price + p.charges, 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes biens</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} bien{stats.total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Ajouter un bien
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          { label: "Disponibles", value: stats.disponible, color: "text-green-600" },
          { label: "Loués", value: stats.loue, color: "text-blue-600" },
          {
            label: "Revenus/mois",
            value: `${stats.revenus.toLocaleString("fr-FR")} €`,
            color: "text-purple-600",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher par adresse, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn-secondary gap-2 ${showFilters ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} /> Filtres
          {Object.values(filters).some(Boolean) && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>
        <button className="btn-secondary" onClick={fetchProperties}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="card p-4 mb-6 grid grid-cols-4 gap-4">
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={filters.status ?? ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            >
              <option value="">Tous</option>
              <option value="disponible">Disponible</option>
              <option value="loué">Loué</option>
              <option value="en_travaux">En travaux</option>
              <option value="archivé">Archivé</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={filters.property_type ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, property_type: e.target.value || undefined })
              }
            >
              <option value="">Tous</option>
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="studio">Studio</option>
              <option value="loft">Loft</option>
            </select>
          </div>
          <div>
            <label className="label">Loyer min (€)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={filters.min_rent ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, min_rent: e.target.value || undefined })
              }
            />
          </div>
          <div>
            <label className="label">Loyer max (€)</label>
            <input
              type="number"
              className="input"
              placeholder="∞"
              value={filters.max_rent ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, max_rent: e.target.value || undefined })
              }
            />
          </div>
          <div className="col-span-4 flex justify-end">
            <button
              className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
              onClick={() => setFilters({})}
            >
              <X size={14} /> Réinitialiser
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
          icon={Building2}
          title="Aucun bien trouvé"
          description={
            properties.length === 0
              ? "Commencez par ajouter votre premier bien immobilier."
              : "Aucun bien ne correspond à vos filtres."
          }
          action={
            properties.length === 0 && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Ajouter un bien
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div key={p.id} onClick={() => openDetail(p)} className="cursor-pointer">
              <PropertyCard
                property={p}
                onEdit={(e) => { e?.stopPropagation(); setEditProperty(p); }}
                onDelete={(e) => { e?.stopPropagation(); setDeleteId(p.id); }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Ajouter un bien"
        size="lg"
      >
        <PropertyFormWizard
          onSuccess={() => { setShowCreate(false); fetchProperties(); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Modal édition */}
      <Modal
        open={!!editProperty}
        onClose={() => setEditProperty(null)}
        title="Modifier le bien"
        size="lg"
      >
        {editProperty && (
          <PropertyFormWizard
            initial={editProperty}
            onSuccess={() => { setEditProperty(null); fetchProperties(); }}
            onCancel={() => setEditProperty(null)}
          />
        )}
      </Modal>

      {/* Modal détail */}
      <Modal
        open={!!detailProperty}
        onClose={() => setDetailProperty(null)}
        title={detailProperty ? `${detailProperty.address} · ${detailProperty.city}` : ""}
        size="xl"
      >
        {detailProperty && (
          <div>
            {/* Status + badges */}
            <div className="flex items-center gap-2 mb-5 -mt-1">
              <StatusBadge status={detailProperty.status} />
              {detailProperty.is_furnished && (
                <span className="badge bg-purple-100 text-purple-700">Meublé</span>
              )}
              {detailProperty.dpe_class && (
                <span className="badge bg-green-100 text-green-800">
                  DPE {detailProperty.dpe_class}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-5">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(i)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    detailTab === i
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {tab === "Photos" && ` (${detailProperty.photos?.length ?? 0})`}
                  {tab === "Inventaire" && ` (${detailProperty.rooms?.length ?? 0})`}
                </button>
              ))}
            </div>

            {/* Tab: Infos */}
            {detailTab === 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  ["Adresse", `${detailProperty.address}${detailProperty.address2 ? ", " + detailProperty.address2 : ""}`],
                  ["Ville", `${detailProperty.zip_code} ${detailProperty.city}`],
                  ["Type", detailProperty.property_type],
                  ["Surface", `${detailProperty.surface} m²`],
                  ["Pièces", detailProperty.num_rooms ?? "—"],
                  ["Étage", detailProperty.floor !== null ? detailProperty.floor : "—"],
                  ["Loyer", `${detailProperty.rent_price.toLocaleString("fr-FR")} €`],
                  ["Charges", `${detailProperty.charges} €`],
                  ["Dépôt de garantie", detailProperty.deposit_amount ? `${detailProperty.deposit_amount} €` : "—"],
                  ["DPE", detailProperty.dpe_class ? `${detailProperty.dpe_class} (${detailProperty.dpe_value ?? "?"} kWh/m²/an)` : "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}

                {/* Équipements */}
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Équipements</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      [detailProperty.has_elevator, "Ascenseur"],
                      [detailProperty.has_parking, "Parking"],
                      [detailProperty.has_cellar, "Cave"],
                      [detailProperty.has_balcony, "Balcon"],
                      [detailProperty.has_garden, "Jardin"],
                    ]
                      .filter(([v]) => v)
                      .map(([, label]) => (
                        <span key={label} className="badge bg-gray-100 text-gray-700">{label}</span>
                      ))}
                  </div>
                </div>

                {detailProperty.description && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Description</p>
                    <p className="text-gray-700 whitespace-pre-line">{detailProperty.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Photos */}
            {detailTab === 1 && (
              <PhotoManager
                propertyId={detailProperty.id}
                photos={detailProperty.photos ?? []}
                onUpdate={async () => {
                  const { data } = await propertiesApi.get(detailProperty.id);
                  setDetailProperty(data);
                  fetchProperties();
                }}
              />
            )}

            {/* Tab: Inventaire */}
            {detailTab === 2 && (
              <InventoryManager
                propertyId={detailProperty.id}
                rooms={detailProperty.rooms ?? []}
                onUpdate={async () => {
                  const { data } = await propertiesApi.get(detailProperty.id);
                  setDetailProperty(data);
                }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer ce bien ?"
        message="Cette action est irréversible. Le bien et toutes ses photos seront définitivement supprimés."
        confirmLabel={deleting ? "Suppression…" : "Supprimer"}
        danger
      />
    </div>
  );
}
