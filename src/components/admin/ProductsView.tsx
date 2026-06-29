import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Save, AlertCircle, Eye, RefreshCw, Check } from 'lucide-react';
import { Product } from '../../types';

interface ProductsViewProps {
  products: Product[];
  token: string | null;
  onAddProduct: (p: Omit<Product, 'id' | 'reviews' | 'rating' | 'numReviews' | 'createdAt'>) => Promise<boolean>;
  onUpdateProduct: (id: string, p: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
}

export default function ProductsView({
  products,
  token,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductsViewProps) {
  // Form view toggling
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form input fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Search filter inside admin view
  const [searchQuery, setSearchQuery] = useState('');

  // Status message
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Electronics', 'Wearables', 'Accessories', 'Mobiles', 'Home Appliances'];

  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setCategory('Electronics');
    setStock('');
    setImage('');
    setFormError(null);
    setEditingProduct(null);
    setUploadSuccess(false);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setDescription(p.description);
    setCategory(p.category);
    setStock(p.stock.toString());
    setImage(p.image);
    setFormError(null);
    setUploadSuccess(false);
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    setUploadSuccess(false);
    setFormError(null);

    try {
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setImage(data.imageUrl);
        setUploadSuccess(true);
      } else {
        setFormError(data.message || 'Image upload failed. Verify image file extension.');
      }
    } catch (err: any) {
      setFormError('Network connection error during image upload.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !description || !category || !stock) {
      setFormError('Please fill out all product details.');
      return;
    }

    const priceVal = parseFloat(price);
    const stockVal = parseInt(stock);

    if (isNaN(priceVal) || priceVal <= 0) {
      setFormError('Product price must be a valid positive number.');
      return;
    }

    if (isNaN(stockVal) || stockVal < 0) {
      setFormError('Product stock quantity cannot be a negative number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const productPayload = {
      name,
      price: priceVal,
      description,
      category,
      stock: stockVal,
      image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
    };

    let success = false;
    if (editingProduct) {
      success = await onUpdateProduct(editingProduct.id, productPayload);
    } else {
      success = await onAddProduct(productPayload);
    }

    setIsSubmitting(false);

    if (success) {
      setIsFormOpen(false);
      resetForm();
    } else {
      setFormError('Failed to commit product adjustments. Try again.');
    }
  };

  // Filter list
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Manage Catalog Inventory</h3>
          <p className="text-xs text-slate-400">Total of {products.length} items currently loaded in the store</p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Forms Overlay Modal (Rendered conditionally) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 font-display">
                {editingProduct ? 'Edit Catalog Product' : 'Create New Product'}
              </h4>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-grow">
              
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                  placeholder="e.g. Over-Ear Active Wireless Headset"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                    placeholder="249.99"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* File Upload / Image Link */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-semibold">Product Image File</label>
                  <div className="flex gap-2">
                    <label className="flex-grow flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer">
                      {uploadingImage ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : uploadSuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingImage ? 'Uploading...' : uploadSuccess ? 'Uploaded!' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    {image && (
                      <div className="w-10 h-10 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* URL String Input Backup */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Image URL (Alternate)</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white font-mono"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                  placeholder="Detail user benefits and functional features of the product..."
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search filtration */}
      <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter catalog products by name or category..."
          className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs"
        />
      </div>

      {/* Product Table List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Price</th>
                <th className="px-6 py-3.5 text-center">Stock</th>
                <th className="px-6 py-3.5 text-center">Reviews</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-100 bg-slate-50 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{p.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase border border-slate-200/40">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-950">${p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.stock > 10
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : p.stock > 0
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-[10px] text-slate-400">
                    {p.numReviews > 0 ? `${p.rating.toFixed(1)}★ (${p.numReviews})` : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(p)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:border-indigo-600 hover:text-indigo-600 bg-white transition-all cursor-pointer"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg hover:border-red-500 hover:text-red-500 bg-white transition-all cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No catalog items found matching your filter selection.
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
