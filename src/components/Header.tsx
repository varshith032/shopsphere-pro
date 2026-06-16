import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, User, LogOut, LayoutDashboard, Package, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

export function Header() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { q: q || undefined } as never });
  };

  return (
    <header className="sticky top-0 z-50 bg-nav text-nav-foreground shadow-md">
      <div className="container mx-auto flex items-center gap-3 px-4 py-2.5">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-nav-foreground hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav className="mt-8 flex flex-col gap-2 text-base">
              <Link to="/" className="px-2 py-2 rounded hover:bg-muted">Home</Link>
              <Link to="/products" className="px-2 py-2 rounded hover:bg-muted">All Products</Link>
              <Link to="/wishlist" className="px-2 py-2 rounded hover:bg-muted">Wishlist</Link>
              <Link to="/orders" className="px-2 py-2 rounded hover:bg-muted">My Orders</Link>
              <Link to="/profile" className="px-2 py-2 rounded hover:bg-muted">Profile</Link>
              {isAdmin && <Link to="/admin" className="px-2 py-2 rounded hover:bg-muted">Admin</Link>}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-baseline gap-1 shrink-0">
          <span className="text-2xl font-bold tracking-tight">Shop</span>
          <span className="text-2xl font-bold tracking-tight text-accent">Sphere</span>
        </Link>

        <form onSubmit={submitSearch} className="flex-1 max-w-2xl mx-2 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products, brands and more"
              className="pl-10 h-10 bg-white text-foreground border-0 rounded-sm"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto">
          <Button asChild variant="ghost" size="sm" className="text-nav-foreground hover:bg-white/10 hidden md:inline-flex relative">
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
              <span className="ml-1 hidden lg:inline">Wishlist</span>
              {wishCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-accent text-accent-foreground">{wishCount}</Badge>
              )}
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="text-nav-foreground hover:bg-white/10 relative">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-1 hidden lg:inline">Cart</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-accent text-accent-foreground">{cartCount}</Badge>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-nav-foreground hover:bg-white/10">
                  <User className="h-5 w-5" />
                  <span className="ml-1 hidden lg:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  <Package className="h-4 w-4 mr-2" /> My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/wishlist" })}>
                  <Heart className="h-4 w-4 mr-2" /> Wishlist
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary" size="sm" className="ml-1">
              <Link to="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <form onSubmit={submitSearch} className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="pl-10 h-10 bg-white text-foreground border-0 rounded-sm"
          />
        </div>
      </form>
    </header>
  );
}
