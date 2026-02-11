import { ChevronDown, ChevronRight, Edit2, Folder, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  fetchCategories,
  updateCategory,
  updateSubcategory
} from '../api';
import Modal from '../components/Modal';

interface Subcategory {
  _id: string;
  name: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  picture: string;
  category: string;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

const Services = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'category' | 'subcategory'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<File | null>(null);
  const [categoryIconPreview, setCategoryIconPreview] = useState<string | null>(null);

  const [subcategoryName, setSubcategoryName] = useState('');
  const [subcategoryDesc, setSubcategoryDesc] = useState('');
  const [subcategoryMinPrice, setSubcategoryMinPrice] = useState('');
  const [subcategoryMaxPrice, setSubcategoryMaxPrice] = useState('');
  const [subcategoryPic, setSubcategoryPic] = useState<File | null>(null);
  const [subcategoryPicPreview, setSubcategoryPicPreview] = useState<string | null>(null);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const normalizedPath = path.replace(/\\/g, '/');
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `http://127.0.0.1:5000${cleanPath}`;
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Reset forms when modals open/close
  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name);
      setCategoryIconPreview(editingCategory.icon ? getImageUrl(editingCategory.icon) : null);
    } else {
      setCategoryName('');
      setCategoryIcon(null);
      setCategoryIconPreview(null);
    }
  }, [editingCategory, isCategoryModalOpen]);

  useEffect(() => {
    if (editingSubcategory) {
      setSubcategoryName(editingSubcategory.name);
      setSubcategoryDesc(editingSubcategory.description);
      setSubcategoryMinPrice(editingSubcategory.minPrice.toString());
      setSubcategoryMaxPrice(editingSubcategory.maxPrice.toString());
      setSubcategoryPicPreview(editingSubcategory.picture ? getImageUrl(editingSubcategory.picture) : null);
    } else {
      setSubcategoryName('');
      setSubcategoryDesc('');
      setSubcategoryMinPrice('');
      setSubcategoryMaxPrice('');
      setSubcategoryPic(null);
      setSubcategoryPicPreview(null);
    }
  }, [editingSubcategory, isSubcategoryModalOpen]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'category' | 'subcategory') => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'category') {
        setCategoryIcon(file);
        setCategoryIconPreview(previewUrl);
      } else {
        setSubcategoryPic(file);
        setSubcategoryPicPreview(previewUrl);
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', categoryName);
      if (categoryIcon) formData.append('icon', categoryIcon);

      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
      } else {
        await createCategory(formData);
      }
      
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    // Validation
    const min = parseFloat(subcategoryMinPrice);
    const max = parseFloat(subcategoryMaxPrice);

    if (min <= 0) {
      alert('Minimum price must be greater than 0');
      return;
    }

    if (max <= min) {
      alert('Maximum price must be greater than minimum price');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('categoryId', selectedCategoryId);
      formData.append('name', subcategoryName);
      formData.append('description', subcategoryDesc);
      formData.append('minPrice', subcategoryMinPrice);
      formData.append('maxPrice', subcategoryMaxPrice);
      if (subcategoryPic) formData.append('picture', subcategoryPic);

      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory._id, formData);
      } else {
        await createSubcategory(formData);
      }

      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      loadCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure? This will delete all subcategories.')) {
      try {
        await deleteCategory(id);
        loadCategories();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteSubcategory(id);
        loadCategories();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredCategories = categories.map(category => {
    const categoryName = category.name || '';
    
    // Search logic based on filter
    const isCategoryMatch = searchFilter === 'subcategory' ? false : (
      categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subcategories = category.subcategories || [];
    const matchingSubcategories = subcategories.filter(sub => {
      if (searchFilter === 'category') return false; // Don't search subcategories if filter is 'category'
      
      const subName = sub.name || '';
      return subName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // If searching for "Category" specifically
    if (searchFilter === 'category') {
      return isCategoryMatch ? category : null;
    }

    // If searching for "Subcategory" specifically
    if (searchFilter === 'subcategory') {
      if (matchingSubcategories.length > 0) {
        return { ...category, subcategories: matchingSubcategories };
      }
      return null;
    }

    // Default "All" search behavior
    if (isCategoryMatch) {
      return category;
    }

    if (matchingSubcategories.length > 0) {
      return { ...category, subcategories: matchingSubcategories };
    }

    return null;
  }).filter((cat): cat is Category => cat !== null);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">Error: {error}</div>
      <button 
        onClick={loadCategories}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Services</h1>
          <p className="text-slate-500 mt-1">Manage service categories and their pricing.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 flex gap-2">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${searchFilter === 'all' ? 'services' : searchFilter}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-700 text-sm"
              >
                <option value="all">All</option>
                <option value="category">Category</option>
                <option value="subcategory">Subcategory</option>
              </select>
            </div>

          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 whitespace-nowrap"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCategories.length === 0 && categories.length > 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No services found matching "{searchQuery}"</p>
          </div>
        )}

        {filteredCategories.map((category) => (
          <div key={category._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Category Header */}
            <div 
              className="p-5 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
              onClick={() => toggleExpand(category._id)}
            >
              <div className="flex items-center space-x-4">
                <button className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                  {expandedCategories.has(category._id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-2 shadow-sm">
                  {category.icon ? (
                    <img 
                      src={getImageUrl(category.icon)} 
                      alt={category.name} 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Folder className="h-6 w-6 text-indigo-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {category.name}
                    {category._id && <span className="ml-2 text-sm font-normal text-slate-400">#{category._id}</span>}
                  </h3>
                  <p className="text-sm text-slate-500">{category.subcategories.length} subcategories</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setSelectedCategoryId(category._id);
                    setEditingSubcategory(null);
                    setIsSubcategoryModalOpen(true);
                  }}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Add Subcategory"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category._id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Subcategories List */}
            {expandedCategories.has(category._id) && (
              <div className="border-t border-slate-100 bg-white">
                {category.subcategories.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {category.subcategories.map((sub) => (
                      <div key={sub._id} className="p-4 pl-16 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            {sub.picture ? (
                              <img 
                                src={getImageUrl(sub.picture)}
                                alt={sub.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {sub.name}
                              {sub._id && <span className="ml-2 text-xs font-normal text-slate-400">#{sub._id}</span>}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{sub.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <span className="flex items-center text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                            <span className="mr-1 text-slate-400 font-medium">Rs</span>
                            {sub.minPrice} - {sub.maxPrice}
                          </span>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingSubcategory(sub);
                                setIsSubcategoryModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(sub._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm italic">
                    No subcategories yet. Click + to add one.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Services Yet</h3>
            <p className="text-slate-500 mt-1">Get started by creating your first service category.</p>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Add Category
            </button>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Icon (Image)</label>
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                categoryIconPreview ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}>
                {categoryIconPreview ? (
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                    <img src={categoryIconPreview} alt="Preview" className="h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                      <p className="text-white text-sm font-medium">Change Icon</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500">Click to upload icon</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'category')}
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="mr-3 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
      >
        <form onSubmit={handleSubcategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={subcategoryDesc}
              onChange={(e) => setSubcategoryDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price Range (PKR)</label>
            <div className="flex items-center gap-4">
              <div className="relative w-full">
                <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">Rs</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={subcategoryMinPrice}
                  onChange={(e) => setSubcategoryMinPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative w-full">
                <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">Rs</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={subcategoryMaxPrice}
                  onChange={(e) => setSubcategoryMaxPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                subcategoryPicPreview ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}>
                {subcategoryPicPreview ? (
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                    <img src={subcategoryPicPreview} alt="Preview" className="h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                      <p className="text-white text-sm font-medium">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500">Click to upload image</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'subcategory')}
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsSubcategoryModalOpen(false)}
              className="mr-3 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {editingSubcategory ? 'Save Changes' : 'Create Subcategory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Services;
