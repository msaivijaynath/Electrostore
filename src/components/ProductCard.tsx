import React from 'react';
import { motion } from 'motion/react';
import { Star, ShoppingCart, Eye, Heart, Lock, CheckCircle2 } from 'lucide-react';
import { Product, User } from '../types';

interface ProductCardProps {
  product: Product;
  user: User | null;
  onProductClick: (id: string) => void;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => any;
  isWishlisted: boolean;
}

export default function ProductCard({
  product,
  user,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: ProductCardProps): any {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full group"
    >
      {/* Image Gallery Container */}
      <div className="relative bg-slate-50 h-52 w-full overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Category Label */}
        <span className="absolute top-3 left-3 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm text-slate-700 border border-slate-200/50">
          {product.category}
        </span>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl transition-all duration-200 shadow-sm border ${
            isWishlisted
              ? 'bg-red-50 text-red-500 border-red-100'
              : 'bg-white/95 backdrop-blur-sm text-slate-400 hover:text-red-500 hover:scale-105 border-slate-200/50'
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Details Quick Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={() => onProductClick(product.id)}
            className="p-3 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg font-medium text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            {product.rating > 0 ? (
              <div className="flex items-center text-amber-500 gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold text-slate-700">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({product.numReviews})</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">New Arrival</span>
            )}
          </div>

          <button
            onClick={() => onProductClick(product.id)}
            className="text-left font-bold font-display text-slate-900 text-base hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5 block cursor-pointer w-full"
          >
            {product.name}
          </button>

          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Price</span>
              <span className="text-lg font-extrabold text-slate-950">${product.price.toFixed(2)}</span>
            </div>

            <div className="text-right">
              {product.stock > 0 ? (
                <span className="text-[11px] text-emerald-600 bg-emerald-50 font-semibold px-2 py-1 rounded-lg inline-flex items-center gap-1 border border-emerald-100/50">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  {product.stock} in stock
                </span>
              ) : (
                <span className="text-[11px] text-red-500 bg-red-50 font-semibold px-2 py-1 rounded-lg inline-flex items-center border border-red-100/50">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Card Button */}
          <div className="mt-4">
            {product.stock > 0 ? (
              <button
                onClick={() => onAddToCart(product)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Unavailable</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
