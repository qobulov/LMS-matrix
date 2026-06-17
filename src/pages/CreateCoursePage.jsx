import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, ChevronRight, DollarSign, Globe, Image, Info, Layers, Tag } from "lucide-react";
import { courseApi } from "../api/endpoints";
import { categories } from "../data/mockData";
import { useLms } from "../data/LmsContext";

const ic = "mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20";
const lc = "block text-sm font-medium text-damiun-wordmark";

const STEPS = [
  { id: 1, label: "Asosiy ma'lumot", icon: Info },
  { id: 2, label: "Tafsilotlar",     icon: Layers },
  { id: 3, label: "Kontent",         icon: BookOpen },
];

const initialForm = {
  title: "",
  description: "",
  coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
  category: "Programming",
  difficulty: "beginner",
  language: "Uzbek",
  price: "",
  durationHours: "",
  status: "draft",
  whatYouWillLearn: "",
  requirements: "",
};

export function CreateCoursePage() {
  const { getToken } = useLms();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const handle = (e) => set(e.target.name, e.target.value);

  const canNext1 = form.title.trim() && form.description.trim();
  const canNext2 = true;

  const onSubmit = async () => {
    const token = getToken();
    if (!token) { toast.error("Sign in required"); return; }
    setSaving(true);
    try {
      const res = await courseApi.create(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          cover_image: form.coverImage.trim(),
          category: form.category,
          difficulty: form.difficulty,
          language: form.language.trim(),
          price: Number(form.price || 0),
          duration_hours: Number(form.durationHours || 1),
          status: form.status,
          what_you_will_learn: form.whatYouWillLearn.split("\n").map((s) => s.trim()).filter(Boolean),
          requirements: form.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
        },
        { token },
      );
      const newId = res?.course?.id ?? res?.id;
      toast.success("Kurs yaratildi!");
      navigate(newId ? `/instructor/courses/${newId}` : "/instructor/courses", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xato yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-damiun-wordmark">Yangi kurs yaratish</h1>
        <p className="mt-1 text-sm text-damiun-muted">3 qadamda kursni sozlang.</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => done && setStep(s.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-damiun-primary text-white shadow-sm"
                    : done
                    ? "cursor-pointer text-damiun-primary hover:bg-damiun-nav-tint"
                    : "cursor-default text-damiun-muted"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  active ? "bg-white/20" : done ? "bg-damiun-primary/10" : "bg-gray-100"
                }`}>
                  {done ? "✓" : <Icon size={12} />}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-px flex-1 ${done ? "bg-damiun-primary" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">

        {/* Step 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Info size={16} className="text-damiun-primary" />
              <h2 className="font-semibold text-damiun-wordmark">Asosiy ma'lumot</h2>
            </div>

            <label className={lc}>
              Kurs nomi <span className="text-red-500">*</span>
              <input name="title" value={form.title} onChange={handle}
                className={ic} placeholder="Masalan: Python dasturlash asoslari" required />
            </label>

            <label className={lc}>
              Tavsif <span className="text-red-500">*</span>
              <textarea name="description" value={form.description} onChange={handle}
                rows={4} className={ic} placeholder="Kurs haqida qisqacha..." required />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lc}>
                <span className="flex items-center gap-1.5"><Tag size={13} /> Kategoriya</span>
                <select name="category" value={form.category} onChange={handle} className={ic}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className={lc}>
                Daraja
                <select name="difficulty" value={form.difficulty} onChange={handle} className={ic}>
                  <option value="beginner">Boshlang'ich</option>
                  <option value="intermediate">O'rta</option>
                  <option value="advanced">Yuqori</option>
                </select>
              </label>
              <label className={lc}>
                <span className="flex items-center gap-1.5"><Globe size={13} /> Til</span>
                <input name="language" value={form.language} onChange={handle} className={ic} />
              </label>
              <label className={lc}>
                Status
                <select name="status" value={form.status} onChange={handle} className={ic}>
                  <option value="draft">Qoralama</option>
                  <option value="published">Nashr etilgan</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Layers size={16} className="text-damiun-primary" />
              <h2 className="font-semibold text-damiun-wordmark">Tafsilotlar</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lc}>
                <span className="flex items-center gap-1.5"><DollarSign size={13} /> Narx (so'm)</span>
                <input type="number" name="price" min="0" value={form.price} onChange={handle}
                  className={ic} placeholder="0 — bepul" />
              </label>
              <label className={lc}>
                Davomiyligi (soat)
                <input type="number" name="durationHours" min="1" value={form.durationHours} onChange={handle}
                  className={ic} placeholder="Masalan: 20" />
              </label>
            </div>

            <label className={lc}>
              <span className="flex items-center gap-1.5"><Image size={13} /> Muqova URL</span>
              <input name="coverImage" value={form.coverImage} onChange={handle} className={ic}
                placeholder="https://..." />
              {form.coverImage && (
                <img src={form.coverImage} alt="" onError={(e) => { e.target.style.display = "none"; }}
                  className="mt-2 h-28 w-full rounded-xl object-cover" />
              )}
            </label>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <BookOpen size={16} className="text-damiun-primary" />
              <h2 className="font-semibold text-damiun-wordmark">Kontent</h2>
            </div>

            <label className={lc}>
              Nima o'rganiladi? <span className="text-xs font-normal text-damiun-muted">(har bir qator — alohida band)</span>
              <textarea name="whatYouWillLearn" value={form.whatYouWillLearn} onChange={handle}
                rows={5} className={ic}
                placeholder={"Python sintaksisi\nO'zgaruvchilar va ma'lumot turlari\nFunksiyalar va modullar"} />
            </label>

            <label className={lc}>
              Talablar <span className="text-xs font-normal text-damiun-muted">(ixtiyoriy, har qator alohida)</span>
              <textarea name="requirements" value={form.requirements} onChange={handle}
                rows={3} className={ic}
                placeholder={"Kompyuter yoki noutbuk\nInternet aloqasi"} />
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-gray-50">
              ← Orqaga
            </button>
          ) : <div />}

          {step < 3 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !canNext1}
              className="inline-flex items-center gap-1.5 rounded-full bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover disabled:opacity-50">
              Keyingi <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={onSubmit} disabled={saving}
              className="rounded-full bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover disabled:opacity-60">
              {saving ? "Saqlanmoqda…" : "Kurs yaratish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
