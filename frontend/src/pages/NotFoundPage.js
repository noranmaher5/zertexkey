import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-enter min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="relative">
        <p className="font-display font-black text-[10rem] leading-none gradient-text opacity-20 select-none">404</p>
        <div className="-mt-16 relative">
          <h1 className="font-display font-bold text-4xl text-white mb-4">Page Not Found</h1>
          <p className="text-gray-400 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/"        className="btn-primary">Go Home</Link>
            <Link to="/products" className="btn-secondary">Browse Products</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
