import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import { clsx } from "clsx";
import { propertiesApi } from "../../api/client";

const ROOM_TYPE_LABELS = {
  salon: "Salon", chambre: "Chambre", cuisine: "Cuisine",
  salle_de_bain: "Salle de bain", wc: "WC", couloir: "Couloir",
  bureau: "Bureau", cave: "Cave", parking: "Parking", autre: "Autre",
};

const CONDITION_LABELS = {
  neuf: "Neuf", bon: "Bon état", use: "Usé", a_remplacer: "À remplacer",
};

const CONDITION_COLORS = {
  neuf: "text-green-600 bg-green-50",
  bon: "text-blue-600 bg-blue-50",
  use: "text-yellow-600 bg-yellow-50",
  a_remplacer: "text-red-600 bg-red-50",
};

function RoomItemRow({ item, onChange, onDelete }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-1.5">
      <input
        className="input col-span-5 text-sm py-1.5"
        placeholder="Élément (ex: lit double)"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
      />
      <select
        className="input col-span-3 text-sm py-1.5"
        value={item.condition}
        onChange={(e) => onChange({ ...item, condition: e.target.value })}
      >
        {Object.entries(CONDITION_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        className="input col-span-2 text-sm py-1.5"
        value={item.quantity}
        onChange={(e) => onChange({ ...item, quantity: parseInt(e.target.value) || 1 })}
      />
      <button
        onClick={onDelete}
        className="col-span-2 flex justify-center text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function RoomCard({ room, propertyId, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(room.items || []);
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([...items, { name: "", condition: "bon", quantity: 1 }]);
  };

  const updateItem = (i, val) => {
    const next = [...items];
    next[i] = val;
    setItems(next);
  };

  const removeItem = (i) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    setSaving(true);
    try {
      await propertiesApi.updateRoom(propertyId, room.id, { items });
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <Package size={16} className="text-gray-400" />
          <div>
            <span className="font-medium text-sm text-gray-900">
              {room.name || ROOM_TYPE_LABELS[room.room_type]}
            </span>
            <span className="text-xs text-gray-400 ml-2">
              {items.length} élément{items.length !== 1 ? "s" : ""}
              {room.surface ? ` · ${room.surface} m²` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
            className="text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {items.length > 0 && (
            <div className="mb-2 mt-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase mb-1 px-0">
                <span className="col-span-5">Élément</span>
                <span className="col-span-3">État</span>
                <span className="col-span-2">Qté</span>
              </div>
              {items.map((item, i) => (
                <RoomItemRow
                  key={i}
                  item={item}
                  onChange={(val) => updateItem(i, val)}
                  onDelete={() => removeItem(i)}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={addItem}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus size={14} /> Ajouter un élément
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary py-1.5 text-xs"
            >
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryManager({ propertyId, rooms = [], onUpdate }) {
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ room_type: "salon", name: "", surface: "" });
  const [saving, setSaving] = useState(false);

  const handleAddRoom = async () => {
    setSaving(true);
    try {
      await propertiesApi.addRoom(propertyId, {
        room_type: newRoom.room_type,
        name: newRoom.name || null,
        surface: newRoom.surface ? parseFloat(newRoom.surface) : null,
        items: [],
      });
      setAddingRoom(false);
      setNewRoom({ room_type: "salon", name: "", surface: "" });
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    await propertiesApi.deleteRoom(propertyId, roomId);
    onUpdate();
  };

  return (
    <div>
      <div className="space-y-2 mb-4">
        {rooms.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">
            Aucune pièce. Ajoutez des pièces pour créer l'inventaire.
          </p>
        )}
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            propertyId={propertyId}
            onUpdate={onUpdate}
            onDelete={handleDeleteRoom}
          />
        ))}
      </div>

      {addingRoom ? (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Nouvelle pièce</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="label text-xs">Type *</label>
              <select
                className="input text-sm"
                value={newRoom.room_type}
                onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
              >
                {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Nom (optionnel)</label>
              <input
                className="input text-sm"
                placeholder="ex: Chambre principale"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-xs">Surface (m²)</label>
              <input
                type="number"
                className="input text-sm"
                placeholder="12"
                value={newRoom.surface}
                onChange={(e) => setNewRoom({ ...newRoom, surface: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddRoom} disabled={saving} className="btn-primary py-1.5 text-sm">
              {saving ? "Ajout…" : "Ajouter"}
            </button>
            <button onClick={() => setAddingRoom(false)} className="btn-secondary py-1.5 text-sm">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingRoom(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> Ajouter une pièce
        </button>
      )}
    </div>
  );
}
