import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ShoppingCart, User, ShieldAlert, Package, LogOut, Heart, Home } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  cartCount: number;
  currentView: string;
  onNavigate: (view: any, params?: any) => void;
  onLogout: () => void;
}

export default function Navbar({ user, cartCount, currentView, onNavigate, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button
          onClick={() => {
            window.location.hash = '#/';
            onNavigate('catalog');
          }}
          className="flex items-center space-x-2.5 text-xl font-bold font-display tracking-tight text-indigo-600 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span>ElectroStore</span>
        </button>

        {/* Navigation Actions */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => {
              window.location.hash = '#/';
              onNavigate('catalog');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
              currentView === 'catalog'
                ? 'text-indigo-600 bg-indigo-50/50'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Products</span>
          </button>

          {/* Cart with Badge */}
          <button
            onClick={() => {
              window.location.hash = '#/cart';
              onNavigate('cart');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg relative flex items-center space-x-1.5 transition-colors cursor-pointer ${
              currentView === 'cart'
                ? 'text-indigo-600 bg-indigo-50/50'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={cartCount}
                  className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold text-white bg-indigo-600 rounded-full min-w-[18px] text-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
          </button>

          {/* User Dependent Actions */}
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-2 pl-2 border-l border-slate-200">
              {user.role === 'admin' ? (
                <button
                  onClick={() => {
                    window.location.hash = '#/admin';
                    onNavigate('admin');
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    currentView === 'admin'
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50/50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden md:inline">Admin Panel</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    window.location.hash = '#/orders';
                    onNavigate('orders');
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    currentView === 'orders'
                      ? 'text-indigo-600 bg-indigo-50/50'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden md:inline">My Orders</span>
                </button>
              )}

              <div className="hidden lg:flex flex-col items-start px-2 text-left">
                <span className="text-xs text-slate-400 font-medium">Hello,</span>
                <span className="text-sm font-semibold text-slate-800 line-clamp-1">{user.name}</span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <button
                onClick={() => {
                  window.location.hash = '#/login';
                  onNavigate('login');
                }}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  window.location.hash = '#/register';
                  onNavigate('register');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </nav>

      </div>
    </header>
  );
}
