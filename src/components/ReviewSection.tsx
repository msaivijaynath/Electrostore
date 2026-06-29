import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, Send, Calendar, Check } from 'lucide-react';
import { Product, User } from '../types';

interface ReviewSectionProps {
  product: Product;
  user: User | null;
  onAddReview: (productId: string, rating: number, comment: string) => Promise<boolean>;
}

export default function ReviewSection({ product, user, onAddReview }: ReviewSectionProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please write a short comment about your purchase.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const success = await onAddReview(product.id, rating, comment);
    setIsSubmitting(false);

    if (success) {
      setSuccessMsg('Thank you! Your feedback was submitted successfully.');
      setComment('');
      setRating(5);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('Failed to submit review. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-t border-slate-100 pt-8">
        <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <span>Customer Reviews ({product.reviews.length})</span>
        </h3>

        {/* Breakdown Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-slate-950">{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
            <div className="flex text-amber-500 gap-0.5 mt-2 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(product.rating || 0) ? 'fill-current text-amber-500' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium">Out of 5 stars average</span>
          </div>

          <div className="md:col-span-2 flex flex-col justify-center space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = product.reviews.filter(r => r.rating === stars).length;
              const percent = product.reviews.length > 0 ? (count / product.reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center text-sm gap-3">
                  <span className="w-12 text-slate-500 font-medium text-xs flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 fill-current text-amber-400" />
                  </span>
                  <div className="flex-grow bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span className="w-8 text-right text-slate-400 text-xs font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Review Form */}
        {user ? (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-8">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Write a Product Review</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Your Rating:</span>
                <div className="flex text-amber-500 gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= (hoverRating ?? rating) ? 'fill-current text-amber-500' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Your Review Comment:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Share your experience using this product..."
                  required
                />
              </div>

              {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Submit Review'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center mb-8">
            <p className="text-xs text-slate-500 mb-2">You must be logged in to leave a review.</p>
            <a
              href="#/login"
              className="inline-block text-xs text-indigo-600 font-semibold hover:underline"
            >
              Sign in to write a review
            </a>
          </div>
        )}

        {/* Review List */}
        <div className="space-y-4">
          {product.reviews.length > 0 ? (
            product.reviews.map((rev) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={rev.id}
                className="p-5 border border-slate-100 bg-white rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-sm"
              >
                {/* Initials Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold font-display text-sm shrink-0 border border-indigo-100/30">
                  {rev.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>

                {/* Comment Body */}
                <div className="space-y-1.5 flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 text-sm">{rev.name}</span>
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rev.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-current' : 'text-slate-100'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-sm">No reviews yet. Be the first to try and review this gear!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
