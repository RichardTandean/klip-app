'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            Klip
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Projects
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <button
            onClick={logout}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
