"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calculator, Kanban, LayoutGrid, Images, LayoutDashboard, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { ProductMenu } from "./product-menu";

// "Products" is a button that opens the product menu; these are plain links.
const PUBLIC_LINKS = [
  { href: "/calculator", label: "Price calculator", icon: Calculator },
  { href: "/gallery", label: "Gallery", icon: Images },
];

/** Top bar: Products menu, page links with an active state, account chip, and a mobile drawer. */
export function Navbar() {
  const { role, user, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const closeProducts = useCallback(() => setProductsOpen(false), []);

  const links = [
    ...PUBLIC_LINKS,
    ...(role === "customer" ? [{ href: "/dashboard", label: "My orders", icon: LayoutDashboard }] : []),
    ...(role === "admin" ? [{ href: "/production", label: "Production", icon: Kanban }] : []),
  ];
  const isActive = (href: string) => (href.startsWith("/#") ? false : pathname === href || pathname.startsWith(`${href}/`));
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Account";
  const initial = firstName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="W2P home">
            <span className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center text-white font-sans font-extrabold text-xs tracking-tight transition-transform group-hover:scale-105">
              W2P
            </span>
            <span className="font-heading font-semibold text-xl tracking-tight text-brand-800">Print House</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Main">
            <button
              onClick={() => setProductsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
              aria-haspopup="dialog"
              aria-expanded={productsOpen}
              data-testid="nav-products"
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              Products
              <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
            </button>
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors duration-200",
                  isActive(href)
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {role === "visitor" ? (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-full bg-card border border-border pl-1 pr-3 py-1 shadow-sm" data-testid="nav-account">
                  <span className="w-7 h-7 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center" aria-hidden="true">
                    {initial}
                  </span>
                  <span className="text-sm font-semibold text-foreground max-w-[9rem] truncate">{firstName}</span>
                  <span className="hidden sm:inline text-[10px] font-semibold uppercase text-brand-600">{role}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden md:inline-flex">
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign Out
                </Button>
              </>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl hover:bg-muted text-foreground"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <button
              onClick={() => {
                setOpen(false);
                setProductsOpen(true);
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted text-left"
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              Products
            </button>
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium",
                  isActive(href) ? "bg-brand-50 text-brand-700" : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            {role === "visitor" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm"><Link href="/login" onClick={() => setOpen(false)}>Sign In</Link></Button>
                <Button asChild size="sm"><Link href="/signup" onClick={() => setOpen(false)}>Create account</Link></Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign Out
              </Button>
            )}
          </nav>
        </div>
      )}
      <ProductMenu open={productsOpen} onClose={closeProducts} />
    </header>
  );
}
