import { useState } from "react";
import { Building2, MapPin, Bed, Maximize2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { StatusBadge } from "../ui/index.jsx";

const TYPE_LABELS = {
  appartement: "Appartement",
  maison: "Maison",
  studio: "Studio",
  loft: "Loft",
  chambre: "Chambre",
  autre: "Autre",
};

function PropertyMenu({ onEdit, onDelete }) {
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
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} /> Modifier
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PropertyCard({ property, onEdit, onDelete }) {
  const hasPhoto = !!property.cover_photo_url;

  return (
    <div className="card hover:shadow-md transition-shadow overflow-hidden">
      {/* Photo */}
      <div className="h-44 bg-gray-100 relative">
        {hasPhoto ? (
          <img
            src={property.cover_photo_url}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={40} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={property.status} />
        </div>
        {property.is_furnished && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-purple-100 text-purple-700">Meublé</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              {TYPE_LABELS[property.property_type] ?? property.property_type}
            </p>
            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-1">
              {property.address}
            </h3>
          </div>
          <PropertyMenu onEdit={onEdit} onDelete={onDelete} />
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{property.zip_code} {property.city}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <Maximize2 size={13} />
            {property.surface} m²
          </span>
          {property.num_rooms && (
            <span className="flex items-center gap-1">
              <Bed size={13} />
              {property.num_rooms} pièce{property.num_rooms > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {property.rent_price.toLocaleString("fr-FR")} €
            </span>
            <span className="text-xs text-gray-400">/mois</span>
          </div>
          {property.charges > 0 && (
            <span className="text-xs text-gray-400">
              + {property.charges} € charges
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
