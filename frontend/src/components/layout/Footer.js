import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0a0d08] border-t border-[#1e2517] mt-auto">

      <div className="max-w-[1200px] mx-auto px-4 py-10">

        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded bg-[#567245] flex items-center justify-center text-white">
                ⚡
              </div>
              <span className="font-bold text-[18px] text-white">ZetrexKeys</span>
            </Link>

            <p className="text-[#889679] text-[13px]">
              Gaming marketplace for digital products 🎮
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase">Explore</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/products" className="link">Games</Link></li>
              <li><Link to="/products" className="link">Store</Link></li>
              <li><Link to="/" className="link">Community</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase">Support</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link to="/" className="link">Contact</Link></li>
              <li><Link to="/" className="link">FAQ</Link></li>
            </ul>
          </div>

        </div>

     

        {/* Bottom */}
        <div className="border-t border-[#1e2517] mt-6 pt-4 text-center text-[12px] text-[#647454]">
          © {new Date().getFullYear()} ZetrexKeys
        </div>

      </div>

      {/* Styles */}
      <style >{`
        .link {
          color: #889679;
          transition: 0.2s;
        }
        .link:hover {
          color: #c4d6a1;
        }
      `}</style>

    </footer>
  );
}