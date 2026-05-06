import { clsx } from "clsx";
import { Loader2, X, AlertCircle, CheckCircle } from "lucide-react";

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ className }) {
  return <Loader2 className={clsx("animate-spin text-blue-600", className)} />;
}

// ── Badge statut bien ─────────────────────────────────────────────────────
const STATUS_STYLES = {
  disponible: "bg-green-100 text-green-800",
  "loué": "bg-blue-100 text-blue-800",
  en_travaux: "bg-yellow-100 text-yellow-800",
  archivé: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS = {
  disponible: "Disponible",
  "loué": "Loué",
  en_travaux: "En travaux",
  archivé: "Archivé",
};

export function StatusBadge({ status }) {
  return (
    <span className={clsx("badge", STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx("card w-full", widths[size], "max-h-[90vh] overflow-y-auto")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success", onClose }) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className={clsx("flex items-start gap-3 p-4 rounded-lg border", styles[type])}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Icon size={28} className="text-blue-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
