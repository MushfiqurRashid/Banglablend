import Link from "next/link";

export default function NotFound() {
  return <div className="shell section"><div className="empty-state"><span className="eyebrow">404</span><h1>This path has not been mapped</h1><p>Return to the collection or discover Bangladesh through another route.</p><Link className="button button-primary" href="/">Return home</Link></div></div>;
}
