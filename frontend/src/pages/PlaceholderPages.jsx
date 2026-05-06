import { FileText, Wallet } from "lucide-react";

export function ContractsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <FileText size={28} className="text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Contrats de bail</h2>
      <p className="text-sm text-gray-400">Sprint 3 — Disponible prochainement</p>
    </div>
  );
}

export function FinancesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
        <Wallet size={28} className="text-purple-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Finances & Quittances</h2>
      <p className="text-sm text-gray-400">Sprint 4 — Disponible prochainement</p>
    </div>
  );
}
