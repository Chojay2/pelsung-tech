"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const path = usePathname();
  const links = [
    { href: "/counsellor", label: "Counsellor board" },
    { href: "/supervisor", label: "Supervisor view" },
  ];
  return (
    <>
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </>
  );
}
