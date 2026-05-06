import { useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, Check, Building2, MapPin, Euro, FileText } from "lucide-react";
import { clsx } from "clsx";
import { propertiesApi } from "../../api/client";

const STEPS = [
  { id: 1, label: "Localisation", icon: MapPin },
  { id: 2, label: "Caractéristiques", icon: Building2 },
  { id: 3, label: "Financier", icon: Euro },
  { id: 4, label: "Description", icon: FileText },
];

export default function PropertyFormWizard({ initial, onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: initial ?? {
      property_type: "appartement",
      is_furnished: false,
      has_elevator: false,
      has_parking: false,
      has_cellar: false,
      has_balcony: false,
      has_garden: false,
      charges: 0,
      status: "disponible",
    },
  });

  const STEP_FIELDS = {
    1: ["address", "city", "zip_code"],
    2: ["property_type", "surface", "num_rooms"],
    3: ["rent_price"],
    4: [],
  };

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      // Convertit les strings numériques
      const payload = {
        ...data,
        surface: parseFloat(data.surface),
        num_rooms: data.num_rooms ? parseInt(data.num_rooms) : null,
        num_bedrooms: data.num_bedrooms ? parseInt(data.num_bedrooms) : null,
        floor: data.floor !== "" ? parseInt(data.floor) : null,
        rent_price: parseFloat(data.rent_price),
        charges: parseFloat(data.charges) || 0,
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
        dpe_value: data.dpe_value ? parseFloat(data.dpe_value) : null,
        ges_value: data.ges_value ? parseFloat(data.ges_value) : null,
      };

      if (initial?.id) {
        await propertiesApi.update(initial.id, payload);
      } else {
        await propertiesApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                    done
                      ? "bg-blue-600 border-blue-600 text-white"
                      : active
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-gray-200 text-gray-400 bg-white"
                  )}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={clsx("text-xs mt-1 font-medium", active ? "text-blue-600" : "text-gray-400")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx("flex-1 h-0.5 mx-2 mb-5", done ? "bg-blue-600" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1 — Localisation */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Adresse *</label>
              <input
                className={clsx("input", errors.address && "border-red-400")}
                placeholder="12 rue de la Paix"
                {...register("address", { required: "Champ requis" })}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="label">Complément d'adresse</label>
              <input className="input" placeholder="Apt 3B, Bât A..." {...register("address2")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Code postal *</label>
                <input
                  className={clsx("input", errors.zip_code && "border-red-400")}
                  placeholder="75001"
                  {...register("zip_code", { required: "Champ requis" })}
                />
                {errors.zip_code && <p className="text-xs text-red-500 mt-1">{errors.zip_code.message}</p>}
              </div>
              <div>
                <label className="label">Ville *</label>
                <input
                  className={clsx("input", errors.city && "border-red-400")}
                  placeholder="Paris"
                  {...register("city", { required: "Champ requis" })}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Caractéristiques */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type de bien *</label>
                <select className="input" {...register("property_type", { required: true })}>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="studio">Studio</option>
                  <option value="loft">Loft</option>
                  <option value="chambre">Chambre</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="label">Surface (m²) *</label>
                <input
                  type="number"
                  step="0.1"
                  className={clsx("input", errors.surface && "border-red-400")}
                  placeholder="45"
                  {...register("surface", { required: "Champ requis", min: 1 })}
                />
                {errors.surface && <p className="text-xs text-red-500 mt-1">{errors.surface.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Nb de pièces</label>
                <input type="number" className="input" placeholder="3" {...register("num_rooms", { min: 1 })} />
              </div>
              <div>
                <label className="label">Nb de chambres</label>
                <input type="number" className="input" placeholder="2" {...register("num_bedrooms", { min: 0 })} />
              </div>
              <div>
                <label className="label">Étage</label>
                <input type="number" className="input" placeholder="2" {...register("floor", { min: 0 })} />
              </div>
            </div>

            <div>
              <label className="label">Classe DPE</label>
              <div className="grid grid-cols-7 gap-1">
                {["A", "B", "C", "D", "E", "F", "G"].map((cls) => {
                  const colors = { A: "bg-green-500", B: "bg-lime-500", C: "bg-yellow-400", D: "bg-orange-400", E: "bg-orange-500", F: "bg-red-500", G: "bg-red-700" };
                  const current = watch("dpe_class");
                  return (
                    <label key={cls} className="cursor-pointer">
                      <input type="radio" className="sr-only" value={cls} {...register("dpe_class")} />
                      <div className={clsx("text-center py-2 rounded font-bold text-white text-sm transition-opacity", colors[cls], current !== cls && "opacity-40")}>
                        {cls}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">Équipements</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["is_furnished", "Meublé"],
                  ["has_elevator", "Ascenseur"],
                  ["has_parking", "Parking"],
                  ["has_cellar", "Cave"],
                  ["has_balcony", "Balcon"],
                  ["has_garden", "Jardin"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600" {...register(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Financier */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Loyer mensuel (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  className={clsx("input", errors.rent_price && "border-red-400")}
                  placeholder="800"
                  {...register("rent_price", { required: "Champ requis", min: 1 })}
                />
                {errors.rent_price && <p className="text-xs text-red-500 mt-1">{errors.rent_price.message}</p>}
              </div>
              <div>
                <label className="label">Charges mensuelles (€)</label>
                <input type="number" step="0.01" className="input" placeholder="0" {...register("charges")} />
              </div>
            </div>
            <div>
              <label className="label">Dépôt de garantie (€)</label>
              <input type="number" step="0.01" className="input" placeholder="1600" {...register("deposit_amount")} />
              <p className="text-xs text-gray-400 mt-1">Laissez vide pour auto (1 ou 2 mois selon le type de bail)</p>
            </div>
            <div>
              <label className="label">Statut du bien</label>
              <select className="input" {...register("status")}>
                <option value="disponible">Disponible</option>
                <option value="loué">Loué</option>
                <option value="en_travaux">En travaux</option>
                <option value="archivé">Archivé</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4 — Description */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label">Description du bien</label>
              <textarea
                rows={4}
                className="input resize-none"
                placeholder="Décrivez le bien : luminosité, vue, travaux récents, points forts..."
                {...register("description")}
              />
            </div>
            <div>
              <label className="label">Notes internes (non visibles par les locataires)</label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Notes privées : historique, contacts prestataires, remarques..."
                {...register("internal_notes")}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}
            className="btn-secondary"
          >
            <ChevronLeft size={16} />
            {step === 1 ? "Annuler" : "Précédent"}
          </button>

          {step < 4 ? (
            <button type="button" onClick={next} className="btn-primary">
              Suivant
              <ChevronRight size={16} />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enregistrement…" : initial?.id ? "Mettre à jour" : "Créer le bien"}
              {!loading && <Check size={16} />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
