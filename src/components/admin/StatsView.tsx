import React from 'react';
import { DollarSign, Briefcase, Users, Layers, ShoppingBag, ArrowRight } from 'lucide-react';
import { AdminStats } from '../../types';

interface StatsViewProps {
  stats: AdminStats;
  onNavigateOrder: () => void;
}

export default function StatsView({ stats, onNavigateOrder }: StatsViewProps) {
  const cards = [
    {
      title: 'Gross Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: Briefcase,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Active Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Seeded Catalog Items',
      value: stats.totalProducts.toString(),
      icon: Layers,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    }
  ];

  return (
    <div className="space-y-8">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
              <p className="text-2xl font-extrabold text-slate-900 font-display">{c.value}</p>
            </div>
            <div className={`p-3 rounded-xl border ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Share Distribution (5 columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Category Catalog Share</h4>
            <p className="text-xs text-slate-400">Total proportion of loaded products by categories</p>
          </div>

          <div className="space-y-4">
            {Object.entries(stats.categoryCounts).map(([cat, count]) => {
              const percentage = stats.totalProducts > 0 ? (count / stats.totalProducts) * 100 : 0;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-slate-400">
                      {count} {count === 1 ? 'item' : 'items'} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(stats.categoryCounts).length === 0 && (
              <p className="text-slate-400 text-xs py-4 text-center">No categories loaded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions list (7 columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Recent Transactions</h4>
                <p className="text-xs text-slate-400">Chronological list of checkout purchases</p>
              </div>
              <button
                onClick={onNavigateOrder}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {stats.recentOrders.slice(0, 4).map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{o.customerName}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">({o.id.slice(-6)})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(o.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-slate-950 text-sm">${o.totalPrice.toFixed(2)}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      o.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : o.status === 'shipped'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}

              {stats.recentOrders.length === 0 && (
                <div className="text-center py-10">
                  <ShoppingBag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">No orders have been submitted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
