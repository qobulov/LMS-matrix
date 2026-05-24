import { useEffect, useState } from "react";
import { toast } from "sonner";
import { courseApi } from "../../api/endpoints";
import { useLms } from "../../data/LmsContext";
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

export function EditLessonModal({ open, onOpenChange, courseId, lesson, onSuccess }) {
  const { getToken } = useLms();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    videoUrl: "",
    durationMin: 15,
    isPreview: false,
  });

  useEffect(() => {
    if (!open || !lesson) return;
    setForm({
      title: lesson.title ?? "",
      videoUrl: lesson.resourceUrl ?? lesson.video_url ?? "",
      durationMin: lesson.durationMin ?? lesson.duration_min ?? 15,
      isPreview: Boolean(lesson.isPreview ?? lesson.is_preview),
    });
  }, [open, lesson]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!courseId || !lesson?.id) return;
    const token = getToken();
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    const videoUrl = form.videoUrl.trim();
    if (!videoUrl) {
      toast.error("Video URL is required");
      return;
    }
    setSaving(true);
    try {
      await courseApi.updateLesson(
        courseId,
        lesson.id,
        {
          title: form.title.trim(),
          video_url: videoUrl,
          duration_min: Number(form.durationMin) || 0,
          is_preview: form.isPreview,
        },
        { token },
      );
      toast.success("Lesson updated");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!lesson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <label className={labelClass}>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Video URL
              <input
                value={form.videoUrl}
                onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                required
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Duration (min)
              <input
                type="number"
                min="0"
                value={form.durationMin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationMin: Number(e.target.value) || 0 }))
                }
                className={inputClass}
              />
            </label>
            <label className={`${labelClass} flex items-center gap-2`}>
              <input
                type="checkbox"
                checked={form.isPreview}
                onChange={(e) => setForm((p) => ({ ...p, isPreview: e.target.checked }))}
                className="rounded border-gray-300 text-damiun-primary focus:ring-damiun-primary"
              />
              Preview lesson (free before enroll)
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
              {saving ? "Saving…" : "Save lesson"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
