import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { courseApi } from "../api/endpoints";
import { categories } from "../data/mockData";
import { useLms } from "../data/LmsContext";

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
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    setSaving(true);
    try {
      await courseApi.create(
        {
          title: form.title,
          description: form.description,
          cover_image: form.coverImage,
          category: form.category,
          difficulty: form.difficulty,
          language: form.language,
          price: Number(form.price || 0),
          duration_hours: Number(form.durationHours || 1),
          status: form.status,
          what_you_will_learn: form.whatYouWillLearn.split("\n").map((s) => s.trim()).filter(Boolean),
          requirements: form.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
        },
        { token },
      );
      toast.success("Course created");
      navigate("/instructor");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2>Create Course</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Difficulty
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </label>

        <label>
          Language
          <input name="language" value={form.language} onChange={handleChange} required />
        </label>

        <label>
          Price
          <input name="price" value={form.price} onChange={handleChange} type="number" min="0" />
        </label>

        <label>
          Duration (hours)
          <input
            name="durationHours"
            value={form.durationHours}
            onChange={handleChange}
            type="number"
            min="1"
          />
        </label>

        <label className="full-row">
          Cover image URL
          <input name="coverImage" value={form.coverImage} onChange={handleChange} />
        </label>

        <label className="full-row">
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </label>

        <label className="full-row">
          What you&apos;ll learn (one line each)
          <textarea
            name="whatYouWillLearn"
            value={form.whatYouWillLearn}
            onChange={handleChange}
            rows={4}
          />
        </label>

        <label className="full-row">
          Requirements (one line each)
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            rows={3}
          />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Course"}
        </button>
      </form>
    </section>
  );
}
