import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="font-display text-4xl font-semibold">Nothing here</h1>
      <p className="text-ink/60">That page doesn't exist.</p>
      <Link to="/" className="text-accent-deep underline underline-offset-4">
        Back to Waffle
      </Link>
    </div>
  );
}
