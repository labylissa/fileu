import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  User, Building2, Euro, FileText, ChevronLeft, ChevronRight,
  Check, Plus, Trash2, Info,
} from "lucide-react";
import { clsx } from "clsx";
import { contractsApi, propertiesApi } from "../../api/client";

const STEPS = [
  { id: 1, label: "Locataire",   icon: User },
  { id: 2, label: "Bien & bail", icon: Building2 },
  { id: 3, label: "Financier",   icon: Euro },
  { id: 4, label: "Clauses",     icon: FileText },
];

const CONTRACT_TYPES = [
  { value: "meublé",     label: "Meublé" },
  { value: "non meublé", label: "Non meublé" },
  { value: "mobilité",   label: "Mobilité" },
  { value: "étudiant",   label: "Étudiant" },
  { value: "colocation", label: "Colocation" },
];

const PAYMENT_METHODS = ["virement", "prélèvement", "chèque", "espèces", "autre"];

const STEP_FIELDS = {
  1: ["tenant_firstname", "tenant_lastname", "tenant_email"],
  2: ["property_id", "contract_type", "start_date"],
  3: ["rent_amount"],
  4: [],
};

export default function ContractFormWizard({ initial, onSuccess, onCancel }) {
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [properties, setProperties] = useState([]);

  const isEdit = !!initial?.id;

  const { register, handleSubmit, watch, formState: { errors }, trigger, control } = useForm({
    defaultValues: initial
      ? {
          ...initial,
          start_date: initial.start_date?.slice(0, 10) ?? "",
          end_date:   initial.end_date?.slice(0, 10) ?? "",
          tenant_birth_date: initial.tenant_birth_date?.slice(0, 10) ?? "",
          cotenants: initial.cotenants ?? [],
        }
      : {
          contract_type:          "meublé",
          start_date:             "",
          end_date:               "",
          notice_period:          1,
          charges_amount:         0,
          deposit_amount:         0,
          payment_day:            1,
          payment_method:         "virement",
          rent_revision_enabled:  true,
          rent_revision_index:    "IRL",
          rent_revision_month:    1,
          cotenants:              [],
          status:                 "actif",
        },
  });

  const { fields: coFields, append: appendCo, remove: removeCo } = useFieldArray({
    control,
    name: "cotenants",
  });

  useEffect(() => {
    propertiesApi.list().then(({ data }) => setProperties(data)).catch(() => {});
  }, []);

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step] ?? []);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...data,
        property_id:    parseInt(data.property_id),
        notice_period:  parseInt(data.notice_period),
        rent_amount:    parseFloat(data.rent_amount),
        charges_amount: parseFloat(data.charges_amount) || 0,
        deposit_amount: parseFloat(data.deposit_amount) || 0,
        payment_day:    parseInt(data.payment_day) || 1,
        rent_revision_month: parseInt(data.rent_revision_month) || 1,
        end_date:       data.end_date || null,
        tenant_birth_date: data.tenant_birth_date || null,
      };

      if (isEdit) {
        await contractsApi.update(initial.id, payload);
      } else {
        await contractsApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const rentRevisionEnabled = watch("rent_revision_enabled");

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const done    = step > s.id;
          const active  = step === s.id;
          const Icon    = s.icon;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={clsx(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm font-semibold",
                  done   && "bg-blue-600 text-white",
                  active && "bg-blue-600 text-white ring-4 ring-blue-100",
                  !done && !active && "bg-gray-100 text-gray-400",
                )}>
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={clsx(
                  "text-xs mt-1 font-medium whitespace-nowrap",
                  active ? "text-blue-600" : "text-gray-400",
                )}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx(
                  "flex-1 h-px mx-2 mb-4",
                  done ? "bg-blue-600" : "bg-gray-200",
                )} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── Step 1 : Locataire ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom *</label>
                <input
                  className={clsx("input", errors.tenant_firstname && "border-red-400")}
                  placeholder="Jean"
                  {...register("tenant_firstname", { required: "Requis" })}
                />
                {errors.tenant_firstname && (
                  <p className="text-xs text-red-500 mt-1">{errors.tenant_firstname.message}</p>
                )}
              </div>
              <div>
                <label className="label">Nom *</label>
                <input
                  className={clsx("input", errors.tenant_lastname && "border-red-400")}
                  placeholder="Dupont"
                  {...register("tenant_lastname", { required: "Requis" })}
                />
                {errors.tenant_lastname && (
                  <p className="text-xs text-red-500 mt-1">{errors.tenant_lastname.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className={clsx("input", errors.tenant_email && "border-red-400")}
                  placeholder="jean.dupont@mail.com"
                  {...register("tenant_email", {
                    required: "Requis",
                    pattern: { value: /\S+@\S+\.\S+/, message: "Email invalide" },
                  })}
                />
                {errors.tenant_email && (
                  <p className="text-xs text-red-500 mt-1">{errors.tenant_email.message}</p>
                )}
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  placeholder="+33 6 00 00 00 00"
                  {...register("tenant_phone")}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Date de naissance</label>
                <input type="date" className="input" {...register("tenant_birth_date")} />
              </div>
              <div>
                <label className="label">Lieu de naissance</label>
                <input className="input" placeholder="Paris" {...register("tenant_birth_place")} />
              </div>
              <div>
                <label className="label">Profession</label>
                <input className="input" placeholder="Ingénieur" {...register("tenant_profession")} />
              </div>
            </div>

            {/* Co-locataires */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Co-locataires</p>
                <button
                  type="button"
                  onClick={() => appendCo({ firstname: "", lastname: "", email: "", phone: "" })}
                  className="btn-secondary text-xs py-1.5"
                >
                  <Plus size={13} /> Ajouter
                </button>
              </div>
              {coFields.length === 0 ? (
                <p className="text-sm text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded-lg">
                  Aucun co-locataire
                </p>
              ) : (
                <div className="space-y-3">
                  {coFields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-5 gap-2 items-center bg-gray-50 rounded-lg p-3">
                      <input className="input col-span-1" placeholder="Prénom"
                        {...register(`cotenants.${idx}.firstname`)} />
                      <input className="input col-span-1" placeholder="Nom"
                        {...register(`cotenants.${idx}.lastname`)} />
                      <input className="input col-span-1" placeholder="Email" type="email"
                        {...register(`cotenants.${idx}.email`)} />
                      <input className="input col-span-1" placeholder="Tél."
                        {...register(`cotenants.${idx}.phone`)} />
                      <button type="button" onClick={() => removeCo(idx)}
                        className="text-red-400 hover:text-red-600 flex justify-center">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2 : Bien & bail ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Bien *</label>
                <select
                  className={clsx("input", errors.property_id && "border-red-400")}
                  {...register("property_id", { required: "Requis" })}
                  disabled={isEdit}
                >
                  <option value="">Sélectionner un bien</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address} — {p.city} ({p.status})
                    </option>
                  ))}
                </select>
                {errors.property_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.property_id.message}</p>
                )}
              </div>
              <div>
                <label className="label">Type de contrat *</label>
                <select className="input" {...register("contract_type")}>
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Date de début *</label>
                <input
                  type="date"
                  className={clsx("input", errors.start_date && "border-red-400")}
                  {...register("start_date", { required: "Requis" })}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>
                )}
              </div>
              <div>
                <label className="label">Date de fin <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input type="date" className="input" {...register("end_date")} />
              </div>
              <div>
                <label className="label">Préavis (mois)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  className="input"
                  {...register("notice_period", { min: 0, max: 24 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Statut du contrat</label>
                <select className="input" {...register("status")}>
                  <option value="actif">Actif</option>
                  <option value="brouillon">Brouillon</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 : Financier ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Loyer HC (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={clsx("input", errors.rent_amount && "border-red-400")}
                  {...register("rent_amount", { required: "Requis", min: 1 })}
                />
                {errors.rent_amount && (
                  <p className="text-xs text-red-500 mt-1">{errors.rent_amount.message}</p>
                )}
              </div>
              <div>
                <label className="label">Charges (€)</label>
                <input type="number" min="0" step="0.01" className="input"
                  {...register("charges_amount")} />
              </div>
              <div>
                <label className="label">Dépôt de garantie (€)</label>
                <input type="number" min="0" step="0.01" className="input"
                  {...register("deposit_amount")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Jour de paiement (du mois)</label>
                <input type="number" min="1" max="28" className="input"
                  {...register("payment_day")} />
              </div>
              <div>
                <label className="label">Moyen de paiement</label>
                <select className="input" {...register("payment_method")}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Révision loyer */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Révision annuelle du loyer</p>
                  <p className="text-xs text-gray-400 mt-0.5">Indexation selon IRL, ILC ou ILAT</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" {...register("rent_revision_enabled")} />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
              {rentRevisionEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Indice</label>
                    <select className="input" {...register("rent_revision_index")}>
                      <option value="IRL">IRL (résidentiel)</option>
                      <option value="ILC">ILC (commercial)</option>
                      <option value="ILAT">ILAT (activités tertiaires)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Mois de révision</label>
                    <select className="input" {...register("rent_revision_month")}>
                      {["Janvier","Février","Mars","Avril","Mai","Juin",
                        "Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
                        .map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4 : Clauses & notes ────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="label">Clauses particulières</label>
              <textarea
                className="input min-h-[120px] resize-none"
                placeholder="Interdiction d'animaux, travaux autorisés, etc."
                {...register("special_clauses")}
              />
            </div>
            <div>
              <label className="label">Notes internes <span className="text-gray-400 font-normal">(non imprimées)</span></label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder="Remarques privées sur le locataire ou le bail…"
                {...register("internal_notes")}
              />
            </div>

            {/* Récap */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Info size={13} /> Récapitulatif
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div className="text-gray-500">Locataire</div>
                <div className="font-medium text-gray-800">
                  {watch("tenant_firstname")} {watch("tenant_lastname")}
                </div>
                <div className="text-gray-500">Type de bail</div>
                <div className="font-medium text-gray-800">
                  {CONTRACT_TYPES.find(t => t.value === watch("contract_type"))?.label}
                </div>
                <div className="text-gray-500">Début</div>
                <div className="font-medium text-gray-800">{watch("start_date") || "—"}</div>
                <div className="text-gray-500">Loyer CC</div>
                <div className="font-medium text-gray-800">
                  {((parseFloat(watch("rent_amount")) || 0) +
                    (parseFloat(watch("charges_amount")) || 0)
                  ).toLocaleString("fr-FR")} €/mois
                </div>
                <div className="text-gray-500">Dépôt de garantie</div>
                <div className="font-medium text-gray-800">
                  {(parseFloat(watch("deposit_amount")) || 0).toLocaleString("fr-FR")} €
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <p className="text-sm text-red-600 mt-4 p-3 bg-red-50 rounded-lg">{error}</p>
        )}

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}
            className="btn-secondary"
          >
            {step === 1 ? "Annuler" : <><ChevronLeft size={16} /> Précédent</>}
          </button>

          {step < 4 ? (
            <button type="button" onClick={next} className="btn-primary">
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le contrat"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
