"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { useSession, signOut } from "../../lib/auth-client";
import {
  Zap,
  History,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

/**
 * Top navigation bar for the authenticated dashboard.
 *
 * Shows the product name, primary nav links, credits balance,
 * and a user menu. Collapses to a hamburger menu on mobile.
 */
export function TopNav({
  availableCredits = 0,
  reservedCredits = 0,
}: {
  availableCredits?: number;
  reservedCredits?: number;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;

  const navLinks = [
    { href: "/generate", label: "Generate", icon: Zap },
    { href: "/generations", label: "History", icon: History },
    { href: "/usage", label: "Usage", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/generate" className="flex items-center gap-2">
          <span className="text-lg font-bold uppercase tracking-tight text-text-primary">
            Melotech
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-text-primary"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <>
              <div className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-glass px-3 py-1.5 text-xs">
                <Zap className="h-3.5 w-3.5 text-success" />
                <span className="font-mono font-medium text-text-primary">
                  {availableCredits}
                </span>
                {reservedCredits > 0 && (
                  <span className="text-text-tertiary">
                    /{reservedCredits} reserved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">
                  {user.name || user.email}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-text-tertiary hover:text-error"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-text-secondary hover:bg-white/[0.06] md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border-subtle bg-bg-primary px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/[0.08] text-text-primary"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Zap className="h-3.5 w-3.5 text-success" />
                <span className="font-mono font-medium text-text-primary">
                  {availableCredits}
                </span>
                {reservedCredits > 0 && (
                  <span className="text-text-tertiary">
                    /{reservedCredits} reserved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <User className="h-4 w-4" />
                <span>{user.name || user.email}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="justify-start text-text-tertiary hover:text-error"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
