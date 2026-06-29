import React from 'react';
import { ShoppingBag, Eye, Calendar, Package, ArrowRight, CheckCircle2, Truck, HelpCircle } from 'lucide-react';
import { Order } from '../../types';

interface OrdersViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: 'pending' | 'shipped' | 'delivered') => Promise<boolean>;
}

export default function OrdersView({ orders, onUpdateStatus }: OrdersViewProps) {
  const handleCycleStatus = async (order: Order) => {
    let nextStatus: 'pending' | 'shipped' | 'delivered' = 'shipped';
    if (order.status === 'pending') {
      nextStatus = 'shipped';
    } else if (order.status === 'shipped') {
      nextStatus = 'delivered';
    } else {
      return; // Already delivered
    }
    await onUpdateStatus(order.id, nextStatus);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <h3 className="text-base font-bold text-slate-900">Manage Checkout Transactions</h3>
        <p className="text-xs text-slate-400">Total of {orders.length} orders successfully processed</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Customer details</th>
                <th className="px-6 py-3.5">Items Purchased</th>
                <th className="px-6 py-3.5 text-right">Settled Amount</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {orders.map((o) => {
                // Cast to get safe user details (backend attaches populated user as an object or we find by id)
                const customer = (o as any).user || { name: 'Customer', email: 'N/A' };
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 uppercase">
                      #{o.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(o.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{customer.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{customer.email}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      <span className="font-semibold text-slate-800">
                        {o.items.map(item => `${item.qty}x ${item.name}`).join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-950">${o.totalPrice.toFixed(2)}</p>
                        {o.discountAmount > 0 && (
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 font-semibold px-1.5 py-0.5 rounded border border-emerald-100/50 uppercase">
                            -{o.couponCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        o.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : o.status === 'shipped'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {o.status !== 'delivered' ? (
                        <button
                          onClick={() => handleCycleStatus(o)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-indigo-600 bg-white hover:bg-slate-50 text-[10px] font-bold rounded-lg transition-all text-indigo-600 flex items-center gap-1 cursor-pointer float-right"
                        >
                          {o.status === 'pending' ? (
                            <>
                              <Truck className="w-3.5 h-3.5" />
                              <span>Ship Cargo</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Deliver</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Fulfilled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <span>No customer orders have been processed yet.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
