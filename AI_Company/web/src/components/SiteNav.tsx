import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="wrap">
        <Link className="brand" href="/">
          App Company OS
        </Link>
        <div className="links">
          <Link href="/">Build</Link>
          <Link href="/history">History</Link>
        </div>
      </div>
    </nav>
  );
}
