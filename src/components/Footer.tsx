import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-12 bg-[oklch(0.2_0.03_255)] text-white/80">
      <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="text-white/60 uppercase text-xs tracking-wider mb-3">About</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Contact Us</Link></li>
            <li><Link to="/" className="hover:text-white">About Us</Link></li>
            <li><Link to="/" className="hover:text-white">Careers</Link></li>
            <li><Link to="/" className="hover:text-white">Press</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white/60 uppercase text-xs tracking-wider mb-3">Help</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Payments</Link></li>
            <li><Link to="/orders" className="hover:text-white">Track Order</Link></li>
            <li><Link to="/" className="hover:text-white">Shipping</Link></li>
            <li><Link to="/" className="hover:text-white">Returns</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white/60 uppercase text-xs tracking-wider mb-3">Policy</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Return Policy</Link></li>
            <li><Link to="/" className="hover:text-white">Terms of Use</Link></li>
            <li><Link to="/" className="hover:text-white">Privacy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white/60 uppercase text-xs tracking-wider mb-3">Social</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Facebook</a></li>
            <li><a href="#" className="hover:text-white">Twitter</a></li>
            <li><a href="#" className="hover:text-white">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} ShopSphere. Built as a portfolio demo.
      </div>
    </footer>
  );
}
