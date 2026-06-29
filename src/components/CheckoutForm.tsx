import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Truck, Check, ChevronRight, AlertCircle, ShoppingCart } from 'lucide-react';
import { CartItem, ShippingAddress } from '../types';

interface CheckoutFormProps {
  cart: CartItem[];
  totalPrice: number;
  discountAmount: number;
  couponCode: string;
  onPlaceOrder: (shippingAddress: ShippingAddress, couponCode?: string) => Promise<boolean>;
}

export default function CheckoutForm({
  cart,
  totalPrice,
  discountAmount,
  couponCode,
  onPlaceOrder,
}: CheckoutFormProps) {
  // Shipping form state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // General flow state
  const [step, setStep] = useState<1 | 2>(1); // 1: Shipping, 2: Payment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value).slice(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardExpiry(value.slice(0, 5));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/[^0-9]/gi, '').slice(0, 4));
  };

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !city || !postalCode || !country) {
      setCheckoutError('Please populate all shipping address fields before proceeding.');
      return;
    }
    setCheckoutError(null);
    setStep(2);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || cardNumber.length < 16 || !cardExpiry || cardCvv.length < 3) {
      setCheckoutError('Please enter valid credit card details to complete the payment simulation.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    const shippingDetails: ShippingAddress = { address, city, postalCode, country };
    const success = await onPlaceOrder(shippingDetails, couponCode || undefined);
    setIsSubmitting(false);

    if (!success) {
      setCheckoutError('Payment failed or stock ran out. Please verify items in your cart and try again.');
    }
  };

  const itemsSubtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Checkout Steps Form (8 columns) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Checkout Header Navigation Tracker */}
        <div className="flex items-center space-x-4 bg-white px-5 py-4 border border-slate-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
              step === 1 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              1
            </div>
            <span>Shipping</span>
          </button>
          
          <ChevronRight className="w-4 h-4 text-slate-300" />
          
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
            step === 2 ? 'text-indigo-600' : 'text-slate-400'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              2
            </div>
            <span>Secure Checkout</span>
          </div>
        </div>

        {/* Dynamic form steps */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              key="shipping-step"
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5"
            >
              <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Shipping Address</span>
              </h3>

              <form onSubmit={handleGoToPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                    placeholder="123 tech parkway, suite 100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                      placeholder="San Jose"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Postal / ZIP Code</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                      placeholder="95112"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>

                {checkoutError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{checkoutError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Secure Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              key="payment-step"
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6"
            >
              <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Secure Credit Card Settlement</span>
              </h3>

              {/* Visual Mock Credit Card */}
              <div className="relative w-full h-44 sm:h-48 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-purple-600 text-white p-5 sm:p-6 shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                
                {/* Chip and Type */}
                <div className="flex items-center justify-between">
                  {/* Microchip */}
                  <div className="w-10 h-7 rounded bg-amber-300/80 border border-amber-400/30 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-x-2 border-y border-amber-900/10"></div>
                    <div className="absolute inset-y-1.5 border-x border-amber-900/10"></div>
                  </div>
                  {/* Visa/Mastercard Mock Icon */}
                  <div className="font-display font-bold italic tracking-wider text-sm opacity-90 select-none">
                    SECURECARD
                  </div>
                </div>

                {/* Number */}
                <div className="font-mono text-base sm:text-lg tracking-[0.15em] py-2 drop-shadow-md select-none">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                {/* Footer Details */}
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="text-[9px] uppercase tracking-wider opacity-60">Cardholder</span>
                    <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase truncate select-none">
                      {cardName || 'YOUR FULL NAME'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider opacity-60">Expires</span>
                      <p className="text-xs sm:text-sm font-semibold tracking-wide select-none">
                        {cardExpiry || 'MM/YY'}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider opacity-60">CVV</span>
                      <p className="text-xs sm:text-sm font-semibold tracking-wide select-none">
                        {focusedField === 'cvv' ? cardCvv : '•••'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSubmitCheckout} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onFocus={() => setFocusedField('number')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white font-mono"
                    placeholder="4111 2222 3333 4444"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      onFocus={() => setFocusedField('expiry')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white font-mono"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">CVV Security Code</label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={handleCvvChange}
                      onFocus={() => setFocusedField('cvv')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white font-mono"
                      placeholder="123"
                    />
                  </div>
                </div>

                {checkoutError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{checkoutError}</span>
                  </p>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-3 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-grow py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Simulating Settlement...' : `Pay & Settle $${totalPrice.toFixed(2)}`}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checkout Sidebar Summary (5 columns) */}
      <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm self-start h-full space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-3 mb-4">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            <span>Order Summary ({cart.reduce((sum, item) => sum + item.qty, 0)} items)</span>
          </h3>

          {/* Itemized scrollable area */}
          <div className="max-h-56 overflow-y-auto space-y-4 pr-1.5">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 text-slate-700">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-slate-800 text-xs truncate">{item.name}</h4>
                  <span className="text-[10px] text-slate-400">Qty {item.qty} × ${item.price.toFixed(2)}</span>
                </div>
                <span className="font-bold text-slate-900 text-xs shrink-0">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Items Subtotal</span>
            <span>${itemsSubtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs font-semibold text-emerald-600">
              <span>Coupon Code Applied ({couponCode})</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Shipping & Delivery</span>
            <span className="text-emerald-600 font-bold">FREE</span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-800">Total Price</span>
            <span className="text-xl font-extrabold text-indigo-600">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
