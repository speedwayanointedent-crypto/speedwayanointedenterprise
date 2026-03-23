import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Plus, Loader2 } from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import api from "../lib/api";
import { useToast } from "../components/ui/Toast";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

type Review = {
  id: number;
  rating: number;
  title?: string | null;
  body: string;
  created_at: string;
  users?: { full_name: string } | null;
};

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { push } = useToast();
  const navigate = useNavigate();
  const isAuthed = Boolean(localStorage.getItem("auth_token"));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Review[]>("/reviews");
      const list = Array.isArray(res.data) ? res.data : [];
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthed) {
      push("Please sign in to add a review.", "error");
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reviews", { rating, title: title || null, body });
      push("Review submitted", "success");
      setTitle("");
      setBody("");
      setRating(5);
      setShowForm(false);
      load();
    } catch (err) {
      const message =
        (err as any)?.response?.data?.error || "Failed to submit review.";
      push(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const safeReviews = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <PageHeader
          title="Customer reviews"
          subtitle="See what other customers are saying about Speedway."
          size="lg"
          actions={
            <button
              className="btn-primary h-10 w-full text-sm sm:w-auto"
              onClick={() => {
                if (!isAuthed) {
                  push("Please sign in to add a review.", "error");
                  navigate("/login");
                  return;
                }
                setShowForm((prev) => !prev);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Hide review form" : "Add review"}
            </button>
          }
        />

        <div className={`section-band mt-8 rounded-2xl p-4 sm:p-6`}>
          <div className={`grid gap-6 ${showForm ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)]" : "grid-cols-1"}`}>
            <div className="card p-6">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading reviews...</div>
              ) : safeReviews.length === 0 ? (
                <EmptyState
                  title="No reviews yet"
                  description="Be the first to share your experience with Speedway."
                />
              ) : (
                <div className="space-y-4">
                  {safeReviews.map((review) => (
                    <div key={review.id} className="card p-4">
                      <div className="flex items-center gap-2 text-amber-500">
                        {Array.from({ length: review.rating }).map((_, idx) => (
                          <Star key={idx} className="h-4 w-4" />
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title ? (
                        <h3 className="mt-2 text-sm font-semibold text-foreground">
                          {review.title}
                        </h3>
                      ) : null}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {review.body}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {review.users?.full_name || "Customer"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showForm ? (
              <aside className="card p-6">
                <h2 className="text-lg font-semibold">Add your review</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share your experience to help other customers.
                </p>
                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="form-label">Rating</label>
                    <select
                      className="form-input mt-2"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} stars
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Title (optional)</label>
                    <input
                      className="form-input mt-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Great service"
                    />
                  </div>
                  <div>
                    <label className="form-label">Review</label>
                    <textarea
                      className="form-input mt-2 min-h-[120px]"
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Tell us about your experience..."
                    />
                  </div>
<button className="btn-primary h-10 w-full" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit review"
                    )}
                  </button>
                </form>
              </aside>
            ) : null}
          </div>
        </div>
      </main>
      <PublicFooterCTA />
    </div>
  );
};

