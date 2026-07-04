import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { WaffleLogo, WaffleWordmark } from "../components/WaffleLogo";

export default function Landing() {
  const navigate = useNavigate();
  const [editLink, setEditLink] = useState("");
  const [error, setError] = useState("");

  const resume = (e: React.FormEvent) => {
    e.preventDefault();
    const value = editLink.trim();
    if (!value) return;
    const match = value.match(/\/edit\/([\w-]+)/);
    const token = match ? match[1] : /^[\w-]{16,}$/.test(value) ? value : null;
    if (!token) {
      setError("That doesn't look like an edit link. Paste the full URL ending in /edit/…");
      return;
    }
    navigate(`/edit/${token}`);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-md text-center">
        <WaffleLogo size={180} className="mx-auto mb-4 drop-shadow-sm" />
        <h1 className="text-6xl tracking-tight">
          <WaffleWordmark />
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/70">
          Bite-sized learning grids you swipe through — in any direction, at your own pace.
        </p>

        <Link
          to="/new"
          className="mt-10 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-lg font-bold text-ink transition-[filter] hover:brightness-95"
        >
          Create a grid
          <ArrowRight size={20} />
        </Link>

        <p className="mt-4">
          <Link to="/g/demo" className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink">
            or try the demo grid →
          </Link>
        </p>

        <form onSubmit={resume} className="mt-16 border-t border-ink/10 pt-8">
          <label htmlFor="edit-link" className="mb-3 block text-sm font-medium text-ink/60">
            Have an edit link? Paste it to keep working.
          </label>
          <div className="flex gap-2">
            <input
              id="edit-link"
              type="text"
              value={editLink}
              onChange={(e) => {
                setEditLink(e.target.value);
                setError("");
              }}
              placeholder="https://…/edit/…"
              className="min-h-[48px] w-full rounded-xl border border-ink/15 bg-white px-4 text-sm outline-none focus:border-accent-deep"
            />
            <button
              type="submit"
              className="min-h-[48px] shrink-0 rounded-xl bg-ink px-5 font-medium text-paper transition-colors hover:bg-ink/85"
            >
              Go
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-accent-deep">{error}</p>}
        </form>
      </main>
    </div>
  );
}
