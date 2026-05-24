import { useEffect, useState } from "react";
import { toast } from "sonner";
import { courseApi } from "../../api/endpoints";
import { categories } from "../../data/mockData";
import { useLms } from "../../data/LmsContext";
import { mapCourseDetail } from "../../utils/gatewayMappers";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20";
const labelClass = "block text-sm font-medium text-damiun-wordmark";

function courseToForm(course) {
  return {
    title: course.title ?? "",
    description: course.description ?? "",
    coverImage: course.coverImage ?? "",
    category: course.category ?? categories[0],
    difficulty: course.difficulty ?? "beginner",
    language: course.language ?? "",
    price: String(course.price ?? 0),
    durationHours: String(course.durationHours ?? 1),
    status: course.status ?? "draft",
    whatYouWillLearn: (course.whatYouWillLearn ?? []).join("\n"),
    requirements: (course.requirements ?? []).join("\n"),
  };
}

export function EditCourseModal({ open, onOpenChange, courseId, onSuccess }) {
  const { getToken } = useLms();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open || !courseId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setForm(null);
      try {
        const token = getToken();
        const raw = await courseApi.getById(courseId, token ? { token } : {});
        const mapped = mapCourseDetail(raw);
        if (!cancelled && mapped) setForm(courseToForm(mapped));
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Could not load course");
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, courseId, getToken, onOpenChange]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form || !courseId) return;
    const token = getToken();
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    setSaving(true);
    try {
      await courseApi.update(
        courseId,
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
          what_you_will_learn: form.whatYouWillLearn
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          requirements: form.requirements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        { token },
      );
      toast.success("Course updated");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
        </DialogHeader>
        {loading || !form ? (
          <DialogBody>
            <p className="text-sm text-damiun-muted">Loading course…</p>
          </DialogBody>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogBody className="grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Category
                <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Difficulty
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </label>
              <label className={labelClass}>
                Language
                <input name="language" value={form.language} onChange={handleChange} className={inputClass} />
              </label>
              <label className={labelClass}>
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Duration (hours)
                <input
                  name="durationHours"
                  type="number"
                  min="1"
                  value={form.durationHours}
                  onChange={handleChange}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Status
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Cover image URL
                <input name="coverImage" value={form.coverImage} onChange={handleChange} className={inputClass} />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                What you&apos;ll learn (one per line)
                <textarea
                  name="whatYouWillLearn"
                  value={form.whatYouWillLearn}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Requirements (one per line)
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              </label>
            </DialogBody>
            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-damiun-wordmark"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-damiun-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
