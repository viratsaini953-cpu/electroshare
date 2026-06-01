import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';

// Helper functions for handling single or multiple images stored in a TEXT column
const getImages = (imageStr) => {
  if (!imageStr) return [];
  if (typeof imageStr === 'string' && imageStr.startsWith('[')) {
    try {
      return JSON.parse(imageStr);
    } catch (e) {
      return [imageStr];
    }
  }
  return [imageStr];
};

const getFirstImage = (imageStr) => {
  if (!imageStr) return "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400";
  if (typeof imageStr === 'string' && imageStr.startsWith('[')) {
    try {
      const arr = JSON.parse(imageStr);
      return arr[0] || "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400";
    } catch (e) {
      return imageStr;
    }
  }
  return imageStr;
};


// Inline SVGs for icons to keep project lightweight and zero-install
const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  Wallet: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  Verified: () => <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.167 11.233A8 8 0 0115.767 3.58l.43.43a1 1 0 01-1.414 1.415l-.43-.43a6 6 0 10-8.23 8.23l-.43.43a1 1 0 01-1.415-1.414l.43-.43zm7.07-7.07a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-2.293 2.293a1 1 0 01-1.414-1.414l3-3z" clipRule="evenodd"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>,
  Info: () => <svg className="w-4 h-4 text-brand-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Trash: () => <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>,
  Sparkles: () => <svg className="w-5 h-5 text-amber-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
  ArrowRight: () => <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>,
  Rent: () => <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

const categoryIcons = {
  1: '🔌', // Microcontrollers & Development Boards
  2: '🌡️', // Sensors & Modules
  3: '⚙️', // Actuators, Motors & Drivers
  4: '🔋', // Power, Cables & Prototyping
  5: '📦', // Pre-built Semester Projects
};

export default function App() {
  // Navigation & Page routing state
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'dashboard', 'list-product', 'admin', 'combos'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Auth Modal & Password Authentication State
  const [authOpen, setAuthOpen] = useState(!localStorage.getItem('token'));
  const [authTarget, setAuthTarget] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conditionFilter, setConditionFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Listing creation form state
  const [listTitle, setListTitle] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listCategory, setListCategory] = useState('1');
  const [listCondition, setListCondition] = useState('gently_used');
  const [listPrice, setListPrice] = useState('');
  const [listMarketPrice, setListMarketPrice] = useState('');
  const [listAge, setListAge] = useState('0');
  const [listType, setListType] = useState('sale');
  const [listRentPrice, setListRentPrice] = useState('');
  const [listImage, setListImage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  // Profile Editor Modal State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Pricing Recommendation Box State
  const [pricingSuggestion, setPricingSuggestion] = useState(null);

  // Rental date selection state
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');

  // Checkout overlay state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState('buy'); // 'buy' or 'rent'
  const [checkoutDelivery, setCheckoutDelivery] = useState('hub_pickup'); // 'hub_pickup' or 'p2p'
  const [checkoutHub, setCheckoutHub] = useState('Campus Engineering Hub');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('cod'); // only 'cod'
  
  // Payment simulator state
  const [paymentSimulating, setPaymentSimulating] = useState(false);
  const [paymentStep, setPaymentStep] = useState(''); // 'method', 'pin', 'processing', 'success'
  const [selectedUPI, setSelectedUPI] = useState('gpay'); // 'gpay', 'phonepe', 'paytm'
  const [upiPin, setUpiPin] = useState('');

  // Dashboard orders
  const [myPurchases, setMyPurchases] = useState([]);
  const [mySales, setMySales] = useState([]);

  // Admin section
  const [allOrders, setAllOrders] = useState([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [combos, setCombos] = useState([]);
  const [comboSelectedProducts, setComboSelectedProducts] = useState([]);
  const [comboTitle, setComboTitle] = useState('');
  const [comboDesc, setComboDesc] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [comboImage, setComboImage] = useState('');
  const [comboComponents, setComboComponents] = useState('');

  // Toast / feedback message state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  // Camera & Image handling
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setCameraActive(true);
      setTimeout(() => {
        const videoEl = document.getElementById('camera-preview');
        if (videoEl) videoEl.srcObject = mediaStream;
      }, 300);
    } catch (err) {
      showToast('Could not access camera. Try uploading a file from your device.', 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const videoEl = document.getElementById('camera-preview');
    if (videoEl) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg');
      
      const existingImages = getImages(listImage);
      setListImage(JSON.stringify([...existingImages, base64Data]));
      stopCamera();
      showToast('Photo captured successfully!');
    }
  };

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imagesArray = [];
      let loadedCount = 0;
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          imagesArray.push(reader.result);
          loadedCount++;
          if (loadedCount === files.length) {
            const existingImages = getImages(listImage);
            const allImages = [...existingImages, ...imagesArray];
            setListImage(JSON.stringify(allImages));
            showToast(`${files.length} photo(s) selected successfully!`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };


  // 1. Fetch startup details
  useEffect(() => {
    fetchCategories();
    fetchCombos();
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // Refetch products whenever selectedCategory changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedProduct]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || activeTab === 'dashboard') {
        fetchDashboardData();
      }
    }
  }, [user, activeTab]);

  // Search Autocomplete Suggestion Logic
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      const filtered = products
        .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5);
      setSearchSuggestions(filtered);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, products]);

  // Live pricing recommendations
  useEffect(() => {
    if (listMarketPrice && listCondition) {
      fetchPriceSuggestion();
    } else {
      setPricingSuggestion(null);
    }
  }, [listMarketPrice, listCondition, listAge]);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiRequest('/auth/me', 'GET', null, token);
      setUser(data);
    } catch (err) {
      console.error(err);
      logout();
    }
  };

  const fetchProducts = async () => {
    try {
      let url = '/products';
      const params = [];
      if (selectedCategory) params.push(`category_id=${selectedCategory}`);
      if (conditionFilter) params.push(`condition=${conditionFilter}`);
      if (verifiedFilter) params.push(`verification_status=verified`);
      if (typeFilter) params.push(`listing_type=${typeFilter}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const data = await apiRequest(url);
      setProducts(data);
    } catch (err) {
      showToast('Error loading products. Check server.', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/products/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCombos = async () => {
    try {
      const data = await apiRequest('/admin/combos');
      setCombos(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const purchases = await apiRequest('/orders/my-purchases');
      setMyPurchases(purchases);

      const sales = await apiRequest('/orders/my-sales');
      setMySales(sales);

      if (user?.role === 'admin') {
        const adminOrders = await apiRequest('/admin/orders');
        setAllOrders(adminOrders);
      }
    } catch (err) {
      console.error('Error fetching dashboard listings:', err);
    }
  };

  const fetchPriceSuggestion = async () => {
    try {
      const res = await apiRequest('/products/suggest-price', 'POST', {
        category_id: parseInt(listCategory),
        condition: listCondition,
        market_price: parseFloat(listMarketPrice),
        age_months: parseInt(listAge) || 0
      });
      setPricingSuggestion(res);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Authentication routines
  const handleCheckPhone = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    try {
      const res = await apiRequest('/auth/check-phone', 'POST', { phone: authTarget });
      setIsRegistered(res.registered);
      setIsPhoneChecked(true);
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    try {
      const res = await apiRequest('/auth/login', 'POST', {
        phone: authTarget,
        password: authPassword
      });
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setAuthPassword('');
      setAuthTarget('');
      setIsPhoneChecked(false);
      showToast('Logged in successfully!');
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    if (authPassword !== authConfirmPassword) {
      setAuthMsg('Passwords do not match');
      return;
    }
    try {
      const res = await apiRequest('/auth/register', 'POST', {
        phone: authTarget,
        password: authPassword
      });
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthTarget('');
      setIsPhoneChecked(false);
      showToast('Registered and logged in successfully!');
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setActiveTab('explore');
    showToast('Signed out successfully.');
  };



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await apiRequest('/auth/update-profile', 'POST', {
        full_name: profileName,
        email: profileEmail
      }, token);
      setUser(updatedUser);
      setEditProfileOpen(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 4. Product listings creator
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!listImage) {
      showToast('Please capture or upload a photo of the component.', 'error');
      return;
    }
    try {
      const prodBody = {
        title: listTitle,
        description: listDesc,
        category_id: parseInt(listCategory),
        condition: listCondition,
        price: parseFloat(listPrice),
        market_price: parseFloat(listMarketPrice),
        age_months: parseInt(listAge) || 0,
        listing_type: listType,
        rent_price_per_day: listType !== 'sale' ? parseFloat(listRentPrice) : null,
        image_url: listImage,
        amazon_url: null,
        flipkart_url: null,
        other_url: null
      };

      await apiRequest('/products/create', 'POST', prodBody);
      showToast('Listing uploaded successfully!');
      
      // Reset form
      setListTitle('');
      setListDesc('');
      setListPrice('');
      setListMarketPrice('');
      setListAge('0');
      setListRentPrice('');
      setListImage('');
      
      setActiveTab('explore');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently delete this product listing?")) return;
    try {
      await apiRequest(`/admin/products/${productId}`, 'DELETE');
      showToast('Product listing deleted successfully!');
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCombo = async (comboId) => {
    if (!window.confirm("Are you sure you want to permanently delete this combo kit?")) return;
    try {
      await apiRequest(`/admin/combos/${comboId}`, 'DELETE');
      showToast('Combo kit deleted successfully!');
      fetchCombos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 5. Checkout and payment flow
  const handleOrderInitiation = (type) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    
    setCheckoutType('buy');
    setCheckoutOpen(true);
  };

  const confirmCheckoutOrder = async () => {
    setCheckoutOpen(false);
    setPaymentSimulating(true);
    setPaymentStep('processing');
    
    const orderBody = {
      product_id: selectedProduct.id,
      order_type: 'buy',
      delivery_type: checkoutDelivery,
      hub_location: checkoutDelivery === 'hub_pickup' ? checkoutHub : null,
      start_date: null,
      end_date: null,
      payment_method: checkoutPaymentMethod
    };

    setTimeout(async () => {
      try {
        await apiRequest('/orders/create', 'POST', orderBody);
        showToast('Order placed successfully! Transaction secured in escrow.', 'success');
        setSelectedProduct(null);
        fetchProducts();
        fetchCurrentUser();
        setPaymentStep('success');
      } catch (err) {
        showToast(err.message, 'error');
        setPaymentSimulating(false);
      }
    }, 1200);
  };

  const handleProcessPayment = async () => {
    // Kept for backward compatibility
  };

  // Confirm receipt as buyer
  const handleConfirmReceipt = async (orderId) => {
    try {
      await apiRequest(`/orders/${orderId}/confirm-receipt`, 'POST');
      showToast('Delivery confirmed! Escrow funds released to the seller.');
      fetchCurrentUser();
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Admin order status update
  const handleAdminUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/update-status?order_status=${newStatus}&admin_notes=${encodeURIComponent(adminNotes)}`, 'POST');
      showToast(`Order status updated to ${newStatus}`);
      setAdminNotes('');
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Admin combo kit creation
  const handleCreateCombo = async (e) => {
    e.preventDefault();
    if (comboSelectedProducts.length < 2 && !comboComponents.trim()) {
      showToast('Select at least 2 components OR specify the components list.', 'error');
      return;
    }
    try {
      const comboBody = {
        title: comboTitle,
        description: comboDesc,
        price: parseFloat(comboPrice),
        product_ids: comboSelectedProducts,
        image_url: comboImage,
        components: comboComponents
      };

      await apiRequest('/admin/combos/create', 'POST', comboBody);
      showToast('New Project Combo Kit listed successfully!');
      setComboTitle('');
      setComboDesc('');
      setComboPrice('');
      setComboImage('');
      setComboComponents('');
      setComboSelectedProducts([]);
      fetchCombos();
      fetchProducts();
      setActiveTab('explore');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleComboProductSelection = (prodId) => {
    if (comboSelectedProducts.includes(prodId)) {
      setComboSelectedProducts(comboSelectedProducts.filter(id => id !== prodId));
    } else {
      setComboSelectedProducts([...comboSelectedProducts, prodId]);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

        {/* Toast Alert */}
        {toast.message && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl transition-all duration-300 transform scale-100 flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-900/90 text-rose-100 border border-rose-500' : 'bg-emerald-950/90 text-emerald-100 border border-emerald-500'
          }`}>
            {toast.type === 'error' ? '⚠️' : '✅'}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="glass-panel border border-dark-800 rounded-3xl p-8 w-full max-w-md space-y-6 relative z-10 shadow-2xl">
          <div className="text-center space-y-3">
            <span className="text-4xl bg-brand-500/10 p-4 rounded-2xl inline-block">🔑</span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In to ElectroShare</h2>
            <p className="text-xs text-dark-400 max-w-xs mx-auto">
              Hyperlocal Campus Hardware Marketplace. Enter your mobile phone number (or admin email) to continue.
            </p>
          </div>

          {authMsg && (
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center font-medium">
              {authMsg}
            </div>
          )}

          {!isPhoneChecked ? (
            /* PHASE 1: Enter Phone Number or Admin Email */
            <form onSubmit={handleCheckPhone} className="space-y-5">
              <div>
                <label className="text-xs text-dark-300 font-semibold block mb-2">Phone Number / Admin Email</label>
                <input 
                  type="text"
                  required
                  value={authTarget}
                  onChange={(e) => setAuthTarget(e.target.value)}
                  placeholder="Enter phone number or email"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <span className="text-[10px] text-dark-500 mt-2 block">
                  Students use standard 10-digit mobile numbers; admins can use their email.
                </span>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/15 cursor-pointer flex items-center justify-center gap-2 glow-btn"
              >
                Continue ➜
              </button>
            </form>
          ) : (
            /* PHASE 2: Login or Register (Set Password) */
            <div className="space-y-5">
              <div className="bg-dark-900/60 border border-dark-850 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-dark-500 font-bold uppercase block">Identifier</span>
                  <span className="text-sm font-bold text-white font-mono">{authTarget}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsPhoneChecked(false);
                    setAuthPassword('');
                    setAuthConfirmPassword('');
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {!isRegistered ? (
                /* Register Flow (Set Password) */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl">
                    <span className="text-xs text-brand-300 font-semibold block">🆕 First-time logging in?</span>
                    <span className="text-[10px] text-dark-400 block mt-0.5">Please set a secure password for your account.</span>
                  </div>

                  <div>
                    <label className="text-xs text-dark-300 font-semibold block mb-1.5">Set Password</label>
                    <input 
                      type="password"
                      required
                      minLength="6"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dark-300 font-semibold block mb-1.5">Confirm Password</label>
                    <input 
                      type="password"
                      required
                      minLength="6"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/15 cursor-pointer glow-btn"
                  >
                    Set Password & Sign In
                  </button>
                </form>
              ) : (
                /* Login Flow */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-300 font-semibold block mb-1.5">Enter Password</label>
                    <input 
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/15 cursor-pointer glow-btn"
                  >
                    Sign In
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Alert */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl transition-all duration-300 transform scale-100 flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-rose-900/90 text-rose-100 border border-rose-500' : 'bg-emerald-950/90 text-emerald-100 border border-emerald-500'
        }`}>
          {toast.type === 'error' ? '⚠️' : '✅'}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="glass-panel border-b border-dark-800 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('explore'); setSelectedCategory(null); }}>
            <span className="bg-brand-500 text-white p-2 rounded-xl font-bold tracking-tight shadow-lg shadow-brand-500/20">
              ES
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-wider text-white flex items-center gap-1">
                ElectroShare <Icons.Sparkles />
              </h1>
              <p className="text-[10px] text-dark-400">Hyperlocal Campus Escrow Market</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => { setActiveTab('explore'); setSelectedProduct(null); }}
              className={`text-sm font-medium transition-colors ${activeTab === 'explore' ? 'text-brand-500' : 'text-dark-300 hover:text-white'}`}
            >
              Catalog
            </button>
            <button 
              onClick={() => { setActiveTab('combos'); setSelectedProduct(null); }}
              className={`text-sm font-medium transition-colors ${activeTab === 'combos' ? 'text-brand-500' : 'text-dark-300 hover:text-white'}`}
            >
              Combo Kits
            </button>
            {user && (
              <button 
                onClick={() => { setActiveTab('list-product'); setSelectedProduct(null); }}
                className={`text-sm font-medium transition-colors ${activeTab === 'list-product' ? 'text-brand-500' : 'text-dark-300 hover:text-white'}`}
              >
                Sell Component
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                onClick={() => { setActiveTab('admin'); setSelectedProduct(null); }}
                className={`text-sm font-medium px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 transition-all hover:bg-amber-500/20`}
              >
                Admin Control
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Dashboard Profile */}
                <button 
                  onClick={() => { setActiveTab('dashboard'); setSelectedProduct(null); }}
                  className={`flex items-center gap-2 bg-dark-900 border rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'dashboard' ? 'border-brand-500 text-brand-500' : 'border-dark-800 text-dark-300 hover:text-white'
                  }`}
                >
                  <span>👋 {user?.full_name || 'User'}</span>
                </button>

                <button 
                  onClick={logout}
                  className="text-xs text-dark-400 hover:text-rose-400 underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-lg shadow-brand-500/20 glow-btn"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: PRODUCT CATALOG DIRECTORY */}
        {activeTab === 'explore' && !selectedProduct && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-dark-800 p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4 max-w-xl text-center md:text-left">
                <span className="bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Hyperlocal Campus Network
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  Stop Buying Brand-New Hardware at Full Price.
                </h2>
                <p className="text-dark-300 text-sm md:text-base leading-relaxed">
                  Sell your unused Arduino controllers, or buy pre-assembled robotics components. Safely escrowed on campus.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button 
                    onClick={() => {
                      if (!user) setAuthOpen(true);
                      else setActiveTab('list-product');
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20"
                  >
                    Start Selling
                  </button>
                  <button 
                    onClick={() => { setSelectedCategory(null); fetchProducts(); }}
                    className="bg-dark-900/60 hover:bg-dark-850 text-dark-200 border border-dark-800 font-medium text-sm px-6 py-2.5 rounded-xl transition-all"
                  >
                    Browse Catalog
                  </button>
                </div>
              </div>
              <div className="w-full max-w-[280px] bg-dark-900/50 rounded-2xl border border-dark-800 p-5 space-y-4 text-xs">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Icons.Verified /> Campus Escrow Safety
                </h4>
                <p className="text-dark-400 leading-relaxed">
                  1. Buyer reserves component.<br />
                  2. Seller drops item at Campus Hub.<br />
                  3. Admin tests pins & connections.<br />
                  4. Buyer collects; money transfers to Seller!
                </p>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-400 flex items-start gap-1.5">
                  <span>💡</span>
                  <span>100% verified working or refund guaranteed.</span>
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="glass-panel border border-dark-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 flex">
                <div className="relative flex-grow">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                    placeholder="Search components (e.g. Ultrasonic sensor, Servo motor)..." 
                    className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-l-xl py-2 px-10 text-sm placeholder-dark-500 text-dark-800 outline-none transition-colors"
                  />
                  <div className="absolute left-3.5 top-2.5 text-dark-500">
                    <Icons.Search />
                  </div>
                  
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-2xl z-30">
                      {searchSuggestions.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setSearchQuery(item.title);
                            setShowSuggestions(false);
                            setSelectedProduct(item);
                          }}
                          className="px-4 py-2.5 hover:bg-dark-850 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="font-semibold text-white">{item.title}</span>
                          <span className="text-[10px] text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded font-mono">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={fetchProducts}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 rounded-r-xl transition-all shadow-md flex items-center justify-center cursor-pointer text-white-btn"
                >
                  Search
                </button>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="bg-dark-900 border border-dark-800 rounded-xl px-3 py-2 text-xs text-dark-300 outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">Any Condition</option>
                  <option value="new">New</option>
                  <option value="gently_used">Gently Used</option>
                  <option value="heavily_used">Heavily Used</option>
                </select>



                <label className="flex items-center gap-2 cursor-pointer select-none border border-dark-800 bg-dark-900/40 rounded-xl px-3 py-2 text-xs text-dark-300 hover:bg-dark-800/40 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={verifiedFilter}
                    onChange={(e) => setVerifiedFilter(e.target.checked)}
                    className="accent-brand-500 cursor-pointer"
                  />
                  <span>Verified Hub Listings</span>
                </label>

                <button 
                  onClick={fetchProducts}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <div 
                onClick={() => setSelectedCategory(null)}
                className={`glass-panel p-4 rounded-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-2 border transition-all hover:scale-102 hover:border-brand-500/50 ${
                  selectedCategory == null 
                    ? 'border-brand-500 bg-brand-500/5 shadow-md shadow-brand-500/5' 
                    : 'border-dark-800 bg-dark-900/35 text-dark-300 hover:bg-dark-900/65'
                }`}
              >
                <span className="text-3xl">🎛️</span>
                <span className="text-xs font-bold text-white block mt-1">All Components</span>
              </div>
              {categories.map((cat) => {
                const icon = categoryIcons[cat.id] || '🔌';
                return (
                  <div 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`glass-panel p-4 rounded-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-2 border transition-all hover:scale-102 hover:border-brand-500/50 ${
                      selectedCategory == cat.id 
                        ? 'border-brand-500 bg-brand-500/5 shadow-md shadow-brand-500/5' 
                        : 'border-dark-800 bg-dark-900/35 text-dark-300 hover:bg-dark-900/65'
                    }`}
                  >
                    <span className="text-3xl">{icon}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-white block mt-1 leading-snug">{cat.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Catalog Grid */}
            {products.filter(prod => !selectedCategory || prod.category?.id == selectedCategory).length === 0 ? (
              <div className="text-center py-16 bg-dark-900/20 border border-dark-800 rounded-3xl space-y-3">
                <span className="text-3xl">🔌</span>
                <h3 className="text-lg font-bold text-white">No hardware listings match your criteria</h3>
                <p className="text-dark-400 text-xs max-w-xs mx-auto">Try clearing search phrases, changing filters, or upload your own component to sell/rent!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.filter(prod => !selectedCategory || prod.category?.id == selectedCategory).map((prod) => (
                  <div 
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col group"
                  >
                    {/* Image panel */}
                    <div className="h-44 bg-dark-950 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={getFirstImage(prod.image_url)} 
                        alt={prod.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400";
                        }}
                      />

                      {/* Admin Delete Option */}
                      {user?.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(prod.id);
                          }}
                          className="absolute top-2.5 left-2.5 bg-red-600/90 hover:bg-red-700 text-white border border-red-500 text-[10px] font-bold px-2.5 py-1 rounded-lg z-20 flex items-center gap-1 transition-colors duration-150 cursor-pointer"
                          title="Delete product listing"
                        >
                          🗑️ Delete
                        </button>
                      )}
                      
                      {/* Price Banner */}
                      <div className="absolute bottom-2.5 left-2.5 bg-dark-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-dark-800 flex flex-col">
                        <span className="text-sm font-extrabold text-brand-400">₹{prod.price}</span>
                      </div>

                      {/* Verification Status Badge */}
                      {prod.verification_status === 'verified' && (
                        <div className="absolute top-2.5 right-2.5 bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Verified Working
                        </div>
                      )}
                    </div>

                    {/* Meta Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-dark-400 font-semibold mb-1">
                          <span>{prod.category.name}</span>
                          <span className="capitalize">{prod.condition.replace('_', ' ')}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors line-clamp-1">
                          {prod.title}
                        </h4>
                        <p className="text-xs text-dark-300 line-clamp-2 mt-1">
                          {prod.description}
                        </p>
                      </div>

                      <div className="border-t border-dark-850 pt-2.5 flex items-center justify-between">
                        <span className="text-[10px] text-dark-400">Seller: {prod.seller_name}</span>
                        <span className="text-brand-500 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Details <Icons.ArrowRight />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: PRODUCT DETAIL PAGE VIEW */}
        {selectedProduct && (
          <div className="space-y-6">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-sm font-semibold text-dark-300 hover:text-white flex items-center gap-2 bg-dark-900 border border-dark-800 rounded-xl px-4 py-2 w-fit transition-all"
            >
              ⬅️ Back to Catalog
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Product Media Column */}
              <div className="glass-panel border border-dark-800 rounded-3xl overflow-hidden">
                <div className="h-96 bg-dark-950 flex items-center justify-center relative">
                  <img 
                    src={getImages(selectedProduct.image_url)[activeImageIdx] || getFirstImage(selectedProduct.image_url)} 
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400";
                    }}
                  />
                  {selectedProduct.verification_status === 'verified' && (
                    <div className="absolute top-4 right-4 bg-emerald-950/95 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Verified Working by Admin Hub
                    </div>
                  )}
                </div>
                
                {/* Thumbnail selector row (rendered only if multiple images exist) */}
                {getImages(selectedProduct.image_url).length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto p-4 bg-dark-900/10 border-t border-dark-800/40">
                    {getImages(selectedProduct.image_url).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                          activeImageIdx === idx ? 'border-brand-500 scale-95' : 'border-dark-800 hover:border-dark-600'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-5 bg-dark-900/30 border-t border-dark-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Original Purchase Value:</span>
                    <span className="font-semibold text-dark-200">₹{selectedProduct.market_price}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Usage Age:</span>
                    <span className="font-semibold text-dark-200">{selectedProduct.age_months} months</span>
                  </div>
                </div>
              </div>

              {/* Details & Transaction Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold px-3 py-1 rounded-full">
                    {selectedProduct.category.name}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-dark-300 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Condition tags */}
                <div className="flex gap-4">
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-3 flex-1">
                    <span className="text-[10px] text-dark-500 font-semibold block uppercase">Condition</span>
                    <span className="text-sm font-bold text-white capitalize">{selectedProduct.condition.replace('_', ' ')}</span>
                  </div>
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-3 flex-1">
                    <span className="text-[10px] text-dark-500 font-semibold block uppercase">Transaction Type</span>
                    <span className="text-sm font-bold text-white capitalize">
                      {selectedProduct.listing_type === 'both' ? 'Buy or Rent' : selectedProduct.listing_type}
                    </span>
                  </div>
                </div>

                {/* Price suggestion description overlay */}
                <div className="bg-brand-500/5 border border-brand-500/10 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Icons.Sparkles /> Smart Value Helper
                  </h4>
                  <p className="text-[11px] text-dark-300 leading-relaxed">
                    The price was suggestion-optimized based on initial retail price (₹{selectedProduct.market_price}), {selectedProduct.age_months} months of use, and '{selectedProduct.condition.replace('_', ' ')}' condition state.
                  </p>
                </div>

                {/* Buy Options Card */}
                <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-dark-400 font-medium">Buy component outright</span>
                    <h3 className="text-2xl font-black text-white mt-0.5">₹{selectedProduct.price}</h3>
                  </div>
                  <button 
                    onClick={() => handleOrderInitiation('buy')}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/10 glow-btn"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Admin Delete Action */}
                {user?.role === 'admin' && (
                  <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xs text-red-400 font-semibold">Admin Panel Action</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">Incorrect or invalid listing?</h3>
                    </div>
                    <button 
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                      className="bg-red-650 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                    >
                      🗑️ Delete Listing
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PROJECT COMBO KITS */}
        {activeTab === 'combos' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-white">Project Combo Kits 📦</h2>
              <p className="text-sm text-dark-300">
                Premium starter kits bundled by hub admins from individual student components. Get basic project accessories at highly discounted package prices.
              </p>
            </div>

            {combos.length === 0 ? (
              <div className="text-center py-16 bg-dark-900/20 border border-dark-800 rounded-3xl">
                <span className="text-3xl">📦</span>
                <h3 className="text-lg font-bold text-white mt-2">No combo kits created yet</h3>
                <p className="text-xs text-dark-400 max-w-xs mx-auto mt-1">Check back soon! Admin bundles Arduino starter modules during first-year projects.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {combos.map((combo) => (
                  <div key={combo.id} className="relative glass-panel border border-dark-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCombo(combo.id);
                        }}
                        className="absolute top-4 right-4 bg-red-650 hover:bg-red-750 text-white border border-red-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg z-20 flex items-center gap-1 transition-all duration-150 cursor-pointer shadow-md"
                        title="Delete Combo Kit"
                      >
                        🗑️ Delete Combo
                      </button>
                    )}
                    <div className="space-y-3">
                      {combo.image_url ? (
                        <div className="h-44 w-full rounded-2xl overflow-hidden border border-dark-800 relative bg-dark-950">
                          <img src={combo.image_url} alt={combo.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="h-32 w-full rounded-2xl overflow-hidden border border-dark-800 relative bg-gradient-to-tr from-brand-500/10 to-amber-500/10 flex items-center justify-center">
                          <span className="text-3xl">📦</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                          Starter Kit Bundle
                        </span>
                        <span className="text-2xl font-black text-brand-400">₹{combo.price}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{combo.title}</h3>
                      <p className="text-xs text-dark-300 leading-relaxed">{combo.description}</p>
                      
                      <div className="border-t border-dark-850 pt-3">
                        <span className="text-[10px] text-dark-400 font-semibold block uppercase mb-2">Included Components</span>
                        {combo.components ? (
                          <div className="text-xs bg-dark-950/50 p-3 rounded-xl border border-dark-900 text-white whitespace-pre-line leading-relaxed">
                            {combo.components}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {combo.products.map((p) => (
                              <div key={p.id} className="flex items-center justify-between text-xs bg-dark-950/50 p-2 rounded-xl border border-dark-900">
                                <span className="text-white font-medium">{p.title}</span>
                                <span className="text-[10px] bg-dark-900 px-2 py-0.5 rounded text-dark-300 capitalize">{p.condition.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        // Quick purchase of combo by selecting first item for checkout
                        if (combo.products.length > 0) {
                          setSelectedProduct(combo.products[0]);
                          handleOrderInitiation('buy');
                        } else {
                          showToast('This custom combo kit is compiled by the Hub. Please visit the admin desk to purchase.', 'info');
                        }
                      }}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-4"
                    >
                      {combo.products.length > 0 ? 'Purchase Bundle Kit' : 'Available at Admin Hub 🏢'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CREATE PRODUCT LISTING FORM */}
        {activeTab === 'list-product' && (
          <div className="max-w-2xl mx-auto glass-panel border border-dark-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="space-y-2 border-b border-dark-800 pb-4">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                Sell or Rent Components <Icons.Plus />
              </h2>
              <p className="text-xs text-dark-300">
                Submit details of your microcontroller boards, wires, sensors or completed major/minor projects.
              </p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 font-semibold block mb-1.5">Category</label>
                  <select 
                    value={listCategory}
                    onChange={(e) => setListCategory(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 font-semibold block mb-1.5">Component Condition</label>
                  <select 
                    value={listCondition}
                    onChange={(e) => setListCondition(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="new">New / Never Used</option>
                    <option value="gently_used">Gently Used (Minor scratches, working)</option>
                    <option value="heavily_used">Heavily Used (Soldered, tested working)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1.5">Component / Project Name</label>
                <input 
                  type="text"
                  required
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  placeholder="e.g. Arduino Uno R3, DHT22 Sensor, Major IoT Kit"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1.5">Description (Mention key details like headers, pins soldered, accessories included)</label>
                <textarea 
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  rows="3"
                  placeholder="Describe pins condition, breadboard availability, cables included, and any testing notes..."
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                ></textarea>
              </div>

              {/* Price Suggestion input cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-950/50 p-4 rounded-2xl border border-dark-850">
                <div>
                  <label className="text-xs text-dark-400 font-semibold block mb-1.5">Original Price (Market ₹)</label>
                  <input 
                    type="number"
                    required
                    value={listMarketPrice}
                    onChange={(e) => setListMarketPrice(e.target.value)}
                    placeholder="Original new price"
                    className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 font-semibold block mb-1.5">Age of Component (Months)</label>
                  <input 
                    type="number"
                    value={listAge}
                    onChange={(e) => setListAge(e.target.value)}
                    placeholder="Months since purchase"
                    className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Pricing Suggestion Box */}
              {pricingSuggestion && (
                <div className="bg-brand-500/10 border border-brand-500/25 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Icons.Sparkles /> Recommended Selling Value
                    </span>
                    <span className="text-sm font-black text-brand-400">₹{pricingSuggestion.recommended_price}</span>
                  </div>
                  <p className="text-[10px] text-dark-300 leading-relaxed">
                    {pricingSuggestion.explanation}
                  </p>
                  <div className="flex gap-2 text-[10px] font-semibold text-dark-400">
                    <span>Suggested Range: ₹{pricingSuggestion.suggested_price_min} - ₹{pricingSuggestion.suggested_price_max}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setListPrice(pricingSuggestion.recommended_price);
                    }}
                    className="text-[10px] font-bold text-brand-400 border border-brand-500/30 hover:bg-brand-500/25 rounded-lg px-2.5 py-1 transition-all"
                  >
                    Apply Recommended Price Suggestion
                  </button>
                </div>
              )}

              {/* Final Selling Prices */}
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1.5">Your Selling Price (₹)</label>
                <input 
                  type="number"
                  required
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1.5">Component Actual Photo (Required)</label>
                
                {/* Image Preview / Input Selection */}
                <div className="space-y-4">
                  {listImage ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {getImages(listImage).map((img, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-dark-800 bg-dark-950 aspect-square flex items-center justify-center group">
                            <img src={img} alt={`Preview ${idx + 1}`} className="max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                const currentImages = getImages(listImage);
                                const updatedImages = currentImages.filter((_, i) => i !== idx);
                                setListImage(updatedImages.length > 0 ? JSON.stringify(updatedImages) : '');
                              }}
                              className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors shadow-lg cursor-pointer"
                              title="Remove this photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setListImage('')}
                          className="text-xs text-rose-500 hover:text-rose-400 font-bold"
                        >
                          🗑️ Clear All Photos
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-dark-850 hover:border-brand-500/50 rounded-3xl p-6 text-center space-y-4 bg-dark-900/10 transition-colors">
                      <div className="text-4xl text-dark-500">📸</div>
                      <div>
                        <p className="text-sm font-bold text-white">No image selected</p>
                        <p className="text-[11px] text-dark-400">Capture the actual component pins, board quality, and connections.</p>
                      </div>

                      {cameraActive ? (
                        <div className="space-y-4">
                          <div className="relative rounded-2xl overflow-hidden bg-black max-w-sm mx-auto aspect-video border border-dark-800">
                            <video id="camera-preview" autoPlay playsInline className="w-full h-full object-cover"></video>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
                            >
                              📸 Snap Photo
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="bg-dark-800 hover:bg-dark-700 text-dark-200 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-brand-500/10 border border-brand-500/30 hover:bg-brand-500/20 text-brand-400 text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            📷 Take Photo with Webcam
                          </button>
                          <label className="bg-dark-900 hover:bg-dark-800 border border-dark-800 text-dark-200 text-xs font-bold px-5 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5">
                            📁 Upload File(s) / Use Phone Camera
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 glow-btn"
              >
                Publish Listing
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: USER PROFILE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="glass-panel border border-dark-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-brand-500 text-white text-3xl font-bold w-16 h-16 rounded-2xl flex items-center justify-center">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {user?.full_name || 'User'}
                    <button
                      onClick={() => {
                        setProfileName(user?.full_name || '');
                        setProfileEmail(user?.email || '');
                        setEditProfileOpen(true);
                      }}
                      className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-0.5 bg-dark-950 border border-dark-850 rounded-lg transition-colors ml-2"
                    >
                      ✏️ Edit Profile
                    </button>
                  </h2>
                  <p className="text-xs text-dark-400 mt-0.5">{user?.email}</p>
                  <div className="flex gap-2 items-center mt-2">
                    <span className="text-[10px] bg-dark-900 border border-dark-800 text-brand-400 px-2 py-0.5 rounded-full capitalize font-semibold">
                      Campus Member ({user?.role})
                    </span>
                    {user?.phone && (
                      <span className="text-[10px] bg-dark-900 border border-dark-800 text-indigo-400 px-2 py-0.5 rounded-full font-semibold font-mono">
                        📞 +91 {user?.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>


            </div>

            {/* Dashboard Subtabs */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-dark-850 pb-2">Active Campus Transactions</h3>
              
              {/* Purchases Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider">My Purchases</h4>
                
                {myPurchases.length === 0 ? (
                  <p className="text-xs text-dark-400 bg-dark-900/20 border border-dark-800 p-4 rounded-xl">You have not bought any components yet.</p>
                ) : (
                  <div className="space-y-4">
                    {myPurchases.map((ord) => (
                      <div key={ord.id} className="bg-dark-900/60 border border-dark-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] bg-dark-950 border border-dark-850 px-2.5 py-0.5 rounded text-dark-300 capitalize font-medium">
                              Outright Purchase
                            </span>
                            <h4 className="font-bold text-white text-sm mt-2">{ord.product_title}</h4>
                            <p className="text-xs text-dark-400 mt-0.5">Seller: {ord.seller_name}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-white block">₹{ord.total_amount}</span>
                            <span className="text-[10px] text-dark-400 font-semibold block capitalize">{ord.payment_status} via {ord.payment_method?.toUpperCase() || 'UPI'}</span>
                          </div>
                        </div>

                        {/* Order status tracking stepper */}
                        <div className="border-t border-dark-850 pt-4">
                          <span className="text-[10px] text-dark-500 font-bold block uppercase mb-3">Campus Logistics Progress</span>
                          <div className="flex items-center justify-between gap-2 max-w-lg">
                            {[
                              { key: 'placed', label: 'Ordered' },
                              { key: 'dropped_at_hub', label: 'At Campus Hub' },
                              { key: 'verified_by_admin', label: 'Quality Checked' },
                              { key: 'completed', label: 'Completed' }
                            ].map((step, idx, arr) => {
                              const orderSteps = ['placed', 'dropped_at_hub', 'verified_by_admin', 'completed'];
                              const currentIdx = orderSteps.indexOf(ord.order_status);
                              const stepIdx = orderSteps.indexOf(step.key);
                              const isPassed = stepIdx <= currentIdx;
                              
                              return (
                                <React.Fragment key={step.key}>
                                  <div className="flex flex-col items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isPassed ? 'bg-brand-500 text-white' : 'bg-dark-950 text-dark-500 border border-dark-800'
                                    }`}>
                                      {idx + 1}
                                    </div>
                                    <span className="text-[9px] text-dark-400 mt-1">{step.label}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <div className={`flex-1 h-0.5 ${
                                      stepIdx < currentIdx ? 'bg-brand-500' : 'bg-dark-850'
                                    }`}></div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Buyer action button: Release escrow money */}
                        {ord.order_status === 'verified_by_admin' && (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <h5 className="text-xs font-bold text-white flex items-center gap-1">
                                <Icons.Verified /> Component Ready & Tested!
                              </h5>
                              <p className="text-[10px] text-dark-300">
                                Campus Hub verified the hardware works. Pick it up from the Hub, inspect it, and click below to release payment to the seller.
                              </p>
                            </div>
                            <button 
                              onClick={() => handleConfirmReceipt(ord.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap self-end md:self-auto"
                            >
                              Verify & Release Escrow Funds
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales Table */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">My Component Sales</h4>
                
                {mySales.length === 0 ? (
                  <p className="text-xs text-dark-400 bg-dark-900/20 border border-dark-800 p-4 rounded-xl">No active sales listings yet.</p>
                ) : (
                  <div className="space-y-4">
                    {mySales.map((ord) => (
                      <div key={ord.id} className="bg-dark-900/60 border border-dark-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">{ord.product_title}</h4>
                            <span className="text-[10px] text-dark-400">Order: {ord.id.substring(0, 8)}...</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-white block">₹{ord.total_amount}</span>
                            <span className={`text-[10px] font-semibold ${
                              ord.order_status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                            } capitalize`}>
                              {ord.order_status === 'placed' ? 'Drop-off Pending' : ord.order_status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {ord.order_status === 'placed' && (
                          <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-[10px] text-amber-300 leading-relaxed">
                            ⚠️ Please deliver this component to the **Block 34 Hub / Dead-drop location** for admin testing. Keep the escrow active. Once tested and handed over to the buyer, payment will be completed!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: ADMIN CONTROL PANEL */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <div className="space-y-8">
            <div className="border-b border-dark-800 pb-4">
              <h2 className="text-2xl font-extrabold text-white">ElectroShare Hub Admin Console 🛠️</h2>
              <p className="text-xs text-dark-300 mt-1">
                Verify engineering components dropped off at the campus hub, log testing details, trigger refunds, or package combos.
              </p>
            </div>

            {/* List active trade orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Order Verification Hub */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-extrabold text-brand-400 uppercase tracking-wider">Active Campus Trades</h3>
                
                {allOrders.length === 0 ? (
                  <p className="text-xs text-dark-400 bg-dark-900/20 border border-dark-800 p-4 rounded-xl">No active campus orders to inspect.</p>
                ) : (
                  <div className="space-y-4">
                    {allOrders.map((ord) => (
                      <div key={ord.id} className="bg-dark-900/80 border border-dark-800 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-dark-950 border border-dark-850 px-2 py-0.5 rounded text-dark-300 font-semibold">{ord.id.substring(0,8)}...</span>
                            <h4 className="font-bold text-white text-sm mt-2">{ord.product_title}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-dark-850">
                              {/* Buyer details card */}
                              <div className="bg-dark-950 p-3 rounded-xl border border-dark-800/80 space-y-1">
                                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Buyer</span>
                                <h5 className="font-bold text-white text-xs mt-1">{ord.buyer_name || 'Anonymous User'}</h5>
                                <p className="text-[11px] text-dark-300">📞 Call: <a href={`tel:${ord.buyer_phone}`} className="text-brand-400 font-bold hover:underline">{ord.buyer_phone || 'No Phone'}</a></p>
                                <p className="text-[10px] text-dark-400 truncate">📧 Email: {ord.buyer_email || 'No Email'}</p>
                              </div>

                              {/* Seller details card */}
                              <div className="bg-dark-950 p-3 rounded-xl border border-dark-800/80 space-y-1">
                                <span className="text-[9px] bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Seller</span>
                                <h5 className="font-bold text-white text-xs mt-1">{ord.seller_name || 'Anonymous Seller'}</h5>
                                <p className="text-[11px] text-dark-300">📞 Call: <a href={`tel:${ord.seller_phone}`} className="text-brand-400 font-bold hover:underline">{ord.seller_phone || 'No Phone'}</a></p>
                                <p className="text-[10px] text-dark-400 truncate">📧 Email: {ord.seller_email || 'No Email'}</p>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-brand-400 capitalize bg-dark-950 px-2.5 py-1 rounded border border-dark-800">
                            {ord.order_status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Status updates buttons */}
                        <div className="pt-3 border-t border-dark-850 space-y-3">
                          <label className="text-[10px] text-dark-400 font-bold block uppercase">Hub Testing Actions</label>
                          
                          <div className="flex flex-wrap gap-2">
                            <button 
                              disabled={ord.order_status === 'completed' || ord.order_status === 'cancelled'}
                              onClick={() => handleAdminUpdateStatus(ord.id, 'dropped_at_hub')}
                              className="bg-dark-950 hover:bg-dark-900 border border-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold text-white px-3.5 py-2 rounded-xl transition-all"
                            >
                              📦 Mark Dropped Off
                            </button>
                            <button 
                              disabled={ord.order_status === 'completed' || ord.order_status === 'cancelled'}
                              onClick={() => handleAdminUpdateStatus(ord.id, 'verified_by_admin')}
                              className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-all"
                            >
                              ✅ Quality Tested OK
                            </button>
                            <button 
                              disabled={ord.order_status === 'completed' || ord.order_status === 'cancelled'}
                              onClick={() => handleAdminUpdateStatus(ord.id, 'cancelled')}
                              className="bg-rose-950 hover:bg-rose-900 border border-rose-500/20 text-rose-400 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-all"
                            >
                              ❌ Cancel & Refund
                            </button>
                          </div>

                          <div className="pt-2">
                            <input 
                              type="text" 
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add testing log notes (e.g., tested with multimeter, all pins working)..." 
                              className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-xs placeholder-dark-500 text-white outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Combo Kit Creator */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider">Pack Combo Kit 📦</h3>
                
                <form onSubmit={handleCreateCombo} className="glass-panel border border-dark-800 rounded-3xl p-5 space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 font-semibold block mb-1">Combo Title</label>
                    <input 
                      type="text"
                      required
                      value={comboTitle}
                      onChange={(e) => setComboTitle(e.target.value)}
                      placeholder="e.g. IoT Starter Kit, Basic Robotics Kit"
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 font-semibold block mb-1">Description</label>
                    <textarea 
                      required
                      value={comboDesc}
                      onChange={(e) => setComboDesc(e.target.value)}
                      rows="2"
                      placeholder="Combine breadboard, jumper cables and microcontroller for freshers..."
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-white outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 font-semibold block mb-1">Bundle Offer Price (₹)</label>
                    <input 
                      type="number"
                      required
                      value={comboPrice}
                      onChange={(e) => setComboPrice(e.target.value)}
                      placeholder="Discounted combo price"
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 font-semibold block mb-1.5">Combo Cover Photo (Optional)</label>
                    <div className="flex items-center gap-3">
                      {comboImage ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-dark-800 bg-dark-950 flex items-center justify-center">
                          <img src={comboImage} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setComboImage('')}
                            className="absolute top-1 right-1 bg-red-600/85 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="combo-image-input"
                          className="w-20 h-20 border border-dashed border-dark-800 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center text-dark-400 hover:text-brand-400 cursor-pointer transition-colors"
                        >
                          <span className="text-xl">📷</span>
                          <span className="text-[8px] font-semibold uppercase mt-1">Upload</span>
                        </label>
                      )}
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setComboImage(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="combo-image-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 font-semibold block mb-1.5">
                      Included Components List
                    </label>
                    <textarea 
                      value={comboComponents}
                      onChange={(e) => setComboComponents(e.target.value)}
                      placeholder="e.g., 1x Arduino Uno, 1x 16x2 LCD, 20x Jumper Wires, 1x Breadboard"
                      rows={2.5}
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-dark-500 mt-1">
                      Specify the list of all materials included in this combo package.
                    </p>
                  </div>

                  {/* Pick from catalog list */}
                  <div className="space-y-2 border-t border-dark-850 pt-3">
                    <label className="text-[10px] text-dark-400 font-bold block uppercase mb-2">Select Available Products</label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {products.map((p) => (
                        <div 
                          key={p.id} 
                          onClick={() => toggleComboProductSelection(p.id)}
                          className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer border ${
                            comboSelectedProducts.includes(p.id) 
                              ? 'border-indigo-500 bg-indigo-500/5 text-indigo-300' 
                              : 'border-dark-800 bg-dark-950/40 text-dark-400 hover:border-dark-700'
                          }`}
                        >
                          <span>{p.title}</span>
                          <span className="font-semibold text-white">₹{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                  >
                    Assemble & List Combo Kit
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="glass-panel border-t border-dark-800 py-6 text-center text-xs text-dark-500 mt-12">
        <p>© 2026 ElectroShare. Hyperlocal Campus Hardware Marketplace.</p>
        <p className="mt-1 text-xs font-semibold text-brand-400">Developed by Vansh Saini</p>
        <p className="mt-1 text-[10px] text-dark-600">Restricted secure marketplace supporting engineering projects and submissions.</p>
      </footer>

      {/* MODAL 2: CHECKOUT ESCROW DETAIL MODAL */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-40 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-dark-800 rounded-3xl p-6 w-full max-w-lg space-y-5 relative">
            <button 
              onClick={() => setCheckoutOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 border-b border-dark-800 pb-3">
              Confirm Escrow Trade <Icons.Verified />
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-start text-sm">
                <div>
                  <h4 className="font-bold text-white">{selectedProduct.title}</h4>
                  <span className="text-xs text-dark-400">Seller: {selectedProduct.seller_name}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-brand-400">
                    ₹{selectedProduct.price}
                  </span>
                </div>
              </div>

              {/* Delivery method toggle */}
              <div className="space-y-2">
                <label className="text-xs text-dark-400 font-semibold block">Campus Handover Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setCheckoutDelivery('hub_pickup')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      checkoutDelivery === 'hub_pickup' 
                        ? 'border-brand-500 bg-brand-500/5 text-white' 
                        : 'border-dark-800 bg-dark-900/35 text-dark-400'
                    }`}
                  >
                    <span className="font-bold block">🏫 Hub Drop-off</span>
                    <span className="text-[10px] text-dark-500 mt-1 block">Tested at Block 34 (Escrow Safe)</span>
                  </button>
                  <button 
                    onClick={() => setCheckoutDelivery('p2p')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      checkoutDelivery === 'p2p' 
                        ? 'border-brand-500 bg-brand-500/5 text-white' 
                        : 'border-dark-800 bg-dark-900/35 text-dark-400'
                    }`}
                  >
                    <span className="font-bold block">🤝 Peer-to-Peer</span>
                    <span className="text-[10px] text-dark-500 mt-1 block">Verify directly on campus</span>
                  </button>
                </div>
              </div>

              {checkoutDelivery === 'hub_pickup' && (
                <div>
                  <label className="text-xs text-dark-400 font-semibold block mb-1.5">Select Drop-off / Pickup Hub</label>
                  <select 
                    value={checkoutHub}
                    onChange={(e) => setCheckoutHub(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-xs outline-none"
                  >
                    <option value="Campus Engineering Hub">Campus Engineering Hub</option>
                    <option value="Student Center Hub">Student Center Hub</option>
                    <option value="Main ECE Lab Hub">Main ECE Lab Hub</option>
                  </select>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="text-xs text-dark-400 font-semibold block">Select Payment Option</label>
                <div className="bg-dark-900 border border-dark-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💵</span>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Cash on Delivery / Pay at Hub</span>
                      <span className="text-[10px] text-dark-400">Pay cash when dropping/picking up at the Hub</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-brand-500/10 border border-brand-500/30 text-brand-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">COD Only</span>
                </div>
              </div>

              {/* Escrow warning banner */}
              <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-[10px] text-amber-300 leading-relaxed">
                ℹ️ **Escrow Protection**: Your payment remains held safely by ElectroShare. Funds are only released to the seller after the component quality is tested and received.
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  onClick={() => setCheckoutOpen(false)}
                  className="flex-1 bg-dark-900 hover:bg-dark-800 text-dark-200 border border-dark-800 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmCheckoutOrder}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  {checkoutPaymentMethod === 'cod' ? 'Place COD Order' : 'Confirm & Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* PAYMENT GATEWAY INTERACTIVE OVERLAY */}
      {paymentSimulating && (
        <div className="fixed inset-0 z-50 bg-dark-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl">
            {/* Step 3: Processing */}
            {paymentStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <h4 className="font-bold text-white">Connecting to secure gateway...</h4>
                  <p className="text-xs text-slate-400">Verifying secure escrow vault integration.</p>
                </div>
              </div>
            )}

            {/* Step 4: Success Receipt */}
            {paymentStep === 'success' && (
              <div className="text-center space-y-5 py-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
                  ✓
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-white">Order Confirmed!</h3>
                  <p className="text-xs text-slate-400">Escrow funds secured safely. Transaction is now active.</p>
                </div>

                <button 
                  onClick={() => {
                    setPaymentSimulating(false);
                    setActiveTab('dashboard');
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold w-full py-3 rounded-xl text-xs transition-all shadow-lg shadow-brand-500/20"
                >
                  Proceed to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE EDIT MODAL */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-dark-800 rounded-3xl p-6 w-full max-w-sm space-y-4 relative">
            <button 
              onClick={() => setEditProfileOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-3xl">👤</span>
              <h3 className="text-lg font-bold text-white font-sans">Update Profile Details</h3>
              <p className="text-xs text-dark-400">Complete your profile to customize notifications.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Vansh Saini"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
