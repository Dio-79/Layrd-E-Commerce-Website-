import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import { ROUTES } from "@/lib/Routes/Routes";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div>
          <h2 className="text-3xl font-serif font-extrabold tracking-widest mb-2">LÄYRD</h2>
          <p className="text-xs text-gray-400">
            Espresso Shots & Cake-in-a-Can.<br />
            Made fresh. Kept simple.
          </p>
        </div>

        {/* Support Links */}
        <div>
          <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-3">Support</h3>
          <ul className="space-y-1 text-xs text-gray-300">
            <li><Link href={`${ROUTES.info}#shipping`} className="hover:underline">Shipping</Link></li>
            <li><Link href={ROUTES.refund} className="hover:underline">Request Refund</Link></li>
            <li><Link href={ROUTES.contact} className="hover:underline">Contact Us</Link></li>
            <li><Link href={ROUTES.wholesale} className="hover:underline">Wholesale</Link></li>
          </ul>
        </div>

        {/* Information Links */}
        <div>
          <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-3">Information</h3>
          <ul className="space-y-1 text-xs text-gray-300">
            <li><Link href={`${ROUTES.info}#faq`} className="hover:underline">FAQ</Link></li>
            <li><Link href={`${ROUTES.info}#about`} className="hover:underline">About LÄYRD</Link></li>
            <li><Link href={`${ROUTES.info}#privacy`} className="hover:underline">Privacy Policy</Link></li>
            <li><Link href={`${ROUTES.info}#terms`} className="hover:underline">Terms of Service</Link></li>
            <li><Link href={`${ROUTES.info}#community`} className="hover:underline">Community</Link></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-3">Our Newsletter</h3>
          <p className="text-xs text-gray-400 mb-2">
            Join our newsletter to receive exclusive announcements, and offers!
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500">
        <p>©2026 LÄYRD. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-2 my-2 md:my-0">
          <span className="bg-white text-black px-2 py-0.5 font-bold rounded">VISA</span>
          <span className="bg-white text-black px-2 py-0.5 font-bold rounded">MC</span>
          <span className="bg-white text-black px-2 py-0.5 font-bold rounded">PayPal</span>
          <span className="bg-white text-black px-2 py-0.5 font-bold rounded">Pay</span>
          <span className="bg-white text-black px-2 py-0.5 font-bold rounded">GPay</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;