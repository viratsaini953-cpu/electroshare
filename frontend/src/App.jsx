import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import logoImg from './assets/logo.png';

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

const FALLBACK_PRODUCTS = [
  {
    id: 'p1',
    title: 'Arduino Uno R3 Board (Original Rev3)',
    description: 'Used for 1 semester project in Block 34 lab. All digital and analog pins tested and working 100%. Comes with USB cable.',
    category_id: 1,
    category: { id: 1, name: 'Microcontrollers & Dev Boards' },
    condition: 'gently_used',
    price: 450.0,
    market_price: 650.0,
    age_months: 4,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400'
  },
  {
    id: 'p2',
    title: 'Ultrasonic Sensor HC-SR04 + Jumper Wires',
    description: 'Distance measuring sensor for obstacle avoidance robotics projects. Includes 10 female-to-female jumper wires.',
    category_id: 2,
    category: { id: 2, name: 'Sensors & Modules' },
    condition: 'like_new',
    price: 120.0,
    market_price: 200.0,
    age_months: 2,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400'
  },
  {
    id: 'p3',
    title: 'L298N Dual Motor Driver Module',
    description: 'Heavy duty motor driver module capable of driving 2 DC motors. Tested at Block 34 Hub.',
    category_id: 3,
    category: { id: 3, name: 'Actuators, Motors & Drivers' },
    condition: 'gently_used',
    price: 180.0,
    market_price: 300.0,
    age_months: 3,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400'
  },
  {
    id: 'p4',
    title: 'SG90 Micro Servo Motors (Pack of 2)',
    description: '9g mini micro servo motors for RC robot arm project. Brand new in box.',
    category_id: 3,
    category: { id: 3, name: 'Actuators, Motors & Drivers' },
    condition: 'new',
    price: 220.0,
    market_price: 380.0,
    age_months: 1,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400'
  },
  {
    id: 'p5',
    title: '0.96 inch I2C OLED Display Module (128x64)',
    description: 'Blue/Yellow dual color OLED screen module for microcontrollers. Crisp display output.',
    category_id: 2,
    category: { id: 2, name: 'Sensors & Modules' },
    condition: 'like_new',
    price: 250.0,
    market_price: 420.0,
    age_months: 2,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400'
  },
  {
    id: 'p6',
    title: 'Breadboard + 65 Pcs Jumper Wires Combo',
    description: 'Solderless MB-102 breadboard with 830 tie points and full pack of male-to-male jumper wires.',
    category_id: 4,
    category: { id: 4, name: 'Power, Cables & Prototyping' },
    condition: 'gently_used',
    price: 190.0,
    market_price: 350.0,
    age_months: 5,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400'
  },
  {
    id: 'p7',
    title: 'Smart Home Automation System (IoT & Bluetooth Control)',
    description: 'Complete pre-built 4th semester major project. Features NodeMCU ESP8266, 4-channel Relay board, Bluetooth HC-05 module, custom android app source code, circuit schematic diagram, and PPT presentation slides included!',
    category_id: 5,
    category: { id: 5, name: 'Pre-built Semester Projects' },
    condition: 'like_new',
    price: 2499.0,
    market_price: 3800.0,
    age_months: 3,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Admin Vansh Saini',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400'
  },
  {
    id: 'p8',
    title: 'Automatic Obstacle Avoiding & Line Follower Robot',
    description: 'Pre-assembled final semester robotics project with Arduino Uno, L298N driver, 2x IR sensors, HC-SR04 Ultrasonic sensor, acrylic chassis, and tested C++ source code.',
    category_id: 5,
    category: { id: 5, name: 'Pre-built Semester Projects' },
    condition: 'gently_used',
    price: 1850.0,
    market_price: 2900.0,
    age_months: 2,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Admin Vansh Saini',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400'
  },
  {
    id: 'p9',
    title: 'Automatic Smart Irrigation Controller System (Soil Moisture + Water Pump)',
    description: 'Complete pre-assembled 3rd/4th semester major project. Automatically detects soil dryness using capacitive soil moisture sensor and triggers 5V mini submersible water pump via relay module. Includes Arduino Uno board, soil sensor, 1-channel relay, 5V water pump + pipe, 16x2 LCD status display, tested C++ source code, circuit schematic diagram, and lab report documentation!',
    category_id: 5,
    category: { id: 5, name: 'Pre-built Semester Projects' },
    condition: 'like_new',
    price: 1650.0,
    market_price: 2500.0,
    age_months: 2,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Admin Vansh Saini',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400'
  },
  {
    id: 'p10',
    title: 'ESP32 Wi-Fi + Bluetooth Dual-Core Microcontroller Board',
    description: '30-pin ESP-WROOM-32 development board with built-in Wi-Fi and BLE Bluetooth for IoT projects. Fully pin-tested.',
    category_id: 1,
    category: { id: 1, name: 'Microcontrollers & Dev Boards' },
    condition: 'new',
    price: 380.0,
    market_price: 600.0,
    age_months: 1,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400'
  },
  {
    id: 'p11',
    title: 'DHT11 Temperature & Humidity Sensor Module',
    description: 'Digital humidity and temperature sensor with jumper cable. Ideal for weather station lab experiments.',
    category_id: 2,
    category: { id: 2, name: 'Sensors & Modules' },
    condition: 'like_new',
    price: 90.0,
    market_price: 160.0,
    age_months: 2,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400'
  },
  {
    id: 'p12',
    title: 'RFID RC522 Reader Module + Smart Cards & Key Fobs',
    description: '13.56MHz SPI RFID reader module with 1x S50 White Card and 1x Key Fob for security access projects.',
    category_id: 2,
    category: { id: 2, name: 'Sensors & Modules' },
    condition: 'gently_used',
    price: 220.0,
    market_price: 390.0,
    age_months: 3,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Rohan Verma (LPU Student)',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400'
  },
  {
    id: 'p13',
    title: 'RFID Attendance & Automated Door Lock Security System',
    description: 'Complete pre-built 5th semester major project. Features Arduino Uno, RFID RC522 Reader, 12V Solenoid Door Lock, I2C LCD Screen, Buzzer, and C++ source code.',
    category_id: 5,
    category: { id: 5, name: 'Pre-built Semester Projects' },
    condition: 'like_new',
    price: 1950.0,
    market_price: 3200.0,
    age_months: 2,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Admin Vansh Saini',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400'
  },
  {
    id: 'p14',
    title: 'IoT Air Quality & Weather Monitoring Station (Blynk Sync)',
    description: 'Pre-assembled major IoT project with ESP8266, DHT11, MQ-135 Gas Sensor, OLED display, and mobile app sync dashboard.',
    category_id: 5,
    category: { id: 5, name: 'Pre-built Semester Projects' },
    condition: 'like_new',
    price: 2200.0,
    market_price: 3500.0,
    age_months: 3,
    listing_type: 'sale',
    status: 'available',
    seller_name: 'Admin Vansh Saini',
    verification_status: 'verified',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400'
  }
];

const FALLBACK_COMBOS = [
  {
    id: 'c1',
    title: 'Basic Robotics Starter Combo Kit',
    description: 'Includes Arduino Uno R3, L298N Motor Driver, 2x BO Motors, Robotic Chassis, and Jumper Wires package.',
    price: 850.0,
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
    components: '1x Arduino Uno R3\n1x L298N Motor Driver Module\n2x Dual-Shaft BO Motors + Wheels\n1x 2WD Robot Chassis\n1x 40-pin Jumper Wire Ribbon'
  },
  {
    id: 'c2',
    title: 'IoT Home Automation Starter Kit',
    description: 'Includes NodeMCU ESP8266 Wi-Fi Module, 4-Channel Relay Board, Ultrasonic Sensor, OLED Display, and Breadboard Wire Bundle.',
    price: 1450.0,
    image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400',
    components: '1x NodeMCU ESP8266 Wi-Fi Board\n1x 4-Channel 5V Relay Module\n1x 0.96 OLED Display (I2C)\n1x HC-SR04 Ultrasonic Distance Sensor\n1x Breadboard + 65 Wire Jumper Bundle'
  }
];

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Microcontrollers & Dev Boards', description: 'Arduino, ESP32, Raspberry Pi' },
  { id: 2, name: 'Sensors & Modules', description: 'Ultrasonic, Temperature, RFID' },
  { id: 3, name: 'Actuators, Motors & Drivers', description: 'Servo Motors, L298N Drivers' },
  { id: 4, name: 'Power, Cables & Prototyping', description: 'Breadboards, Jumper Wires' },
  { id: 5, name: 'Pre-built Semester Projects', description: 'IoT, Robotics, Automation Projects' }
];

const ElectroShareLogo = ({ className = "w-10 h-10" }) => (
  <div className={`relative flex items-center justify-center ${className} rounded-2xl overflow-hidden shadow-sm group hover:scale-105 transition-all duration-300 select-none bg-white p-0.5 border border-slate-200`}>
    <img src={logoImg} alt="ElectroShare Logo" className="w-full h-full object-contain rounded-xl" />
  </div>
);

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('electroshare_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export default function App() {
  // Navigation & Page routing state
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'dashboard', 'list-product', 'admin', 'combos'
  const [dashTab, setDashTab] = useState('purchases'); // 'purchases', 'sales', 'requests'
  const [user, setUserState] = useState(getInitialUser());
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const setUser = (userObj) => {
    setUserState(userObj);
    if (userObj) {
      localStorage.setItem('electroshare_user', JSON.stringify(userObj));
    } else {
      localStorage.removeItem('electroshare_user');
    }
  };

  // Auth Modal & Password Authentication State
  const [authOpen, setAuthOpen] = useState(false);
  const [authTarget, setAuthTarget] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [authMsg, setAuthMsg] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Catalog State
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [combos, setCombos] = useState(FALLBACK_COMBOS);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortBy, setSortBy] = useState('featured');
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
  const [comboSelectedProducts, setComboSelectedProducts] = useState([]);
  const [comboTitle, setComboTitle] = useState('');
  const [comboDesc, setComboDesc] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [comboImage, setComboImage] = useState('');
  const [comboComponents, setComboComponents] = useState('');

  // Custom Kit Requests
  const [kitRequests, setKitRequests] = useState([]);
  const [allKitRequests, setAllKitRequests] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqProjectName, setReqProjectName] = useState('');
  const [reqComponents, setReqComponents] = useState('');
  const [reqBudget, setReqBudget] = useState('');
  const [reqNotes, setReqNotes] = useState('');

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


  // 1. Fetch startup details & load saved user session
  useEffect(() => {
    fetchProducts();
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

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCheckoutOpen(false);
        setAuthOpen(false);
        setEditProfileOpen(false);
        setIsRequestModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live pricing recommendations
  useEffect(() => {
    if (listMarketPrice && listCondition) {
      fetchPriceSuggestion();
    } else {
      setPricingSuggestion(null);
    }
  }, [listMarketPrice, listCondition, listAge]);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

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
    const userCustomProds = JSON.parse(localStorage.getItem('electroshare_user_products') || '[]');
    let allProdsList = [...userCustomProds, ...FALLBACK_PRODUCTS];

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
      if (Array.isArray(data) && data.length > 0) {
        setProducts([...userCustomProds, ...data]);
      } else {
        setProducts(allProdsList);
      }
    } catch (err) {
      setProducts(allProdsList);
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
      if (Array.isArray(data) && data.length > 0) {
        setCombos(data);
      } else {
        setCombos(FALLBACK_COMBOS);
      }
    } catch (err) {
      setCombos(FALLBACK_COMBOS);
    }
  };

const getStoredOrders = () => {
  const stored = localStorage.getItem('electroshare_orders');
  if (stored === null) {
    const initialSeed = [
      {
        id: 'ORD-882104',
        product_title: 'Smart Home Automation System (IoT & Bluetooth Control)',
        product_price: 2499.0,
        buyer_name: 'Aman Kumar (LPU Student)',
        buyer_phone: '9876543210',
        seller_name: 'Admin Vansh Saini',
        seller_phone: '9389047361',
        delivery_type: 'hub_pickup',
        hub_location: 'Campus Engineering Hub (Block 34)',
        payment_method: 'Direct UPI (PhonePe)',
        payment_status: 'escrow_locked',
        order_status: 'placed',
        created_at: new Date().toISOString()
      },
      {
        id: 'ORD-774912',
        product_title: 'Arduino Uno R3 Board (Original Rev3)',
        product_price: 450.0,
        buyer_name: 'Priya Sharma (LPU Student)',
        buyer_phone: '9123456789',
        seller_name: 'Rohan Verma',
        seller_phone: '9259558081',
        delivery_type: 'p2p',
        hub_location: 'Direct Peer Exchange',
        payment_method: 'Cash on Delivery',
        payment_status: 'escrow_locked',
        order_status: 'placed',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('electroshare_orders', JSON.stringify(initialSeed));
    return initialSeed;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

  const fetchDashboardData = async () => {
    const displayOrders = getStoredOrders();

    if (user?.role === 'admin') {
      setAllOrders(displayOrders);
      try {
        const adminOrders = await apiRequest('/admin/orders');
        if (Array.isArray(adminOrders) && adminOrders.length > 0) {
          setAllOrders([...displayOrders, ...adminOrders]);
        }
      } catch (err) {
        console.warn('Backend API offline, displaying local orders in Admin Console');
      }
    } else if (user) {
      const myUserPurchases = displayOrders.filter(o => o.buyer_phone === user.phone || o.buyer_id === user.id);
      setMyPurchases(myUserPurchases);
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

  const ADMIN_NUMBERS = ['9389047361'];

  // 2. Authentication routines
  const handleCheckPhone = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    const targetTrimmed = authTarget.trim();

    if (ADMIN_NUMBERS.includes(targetTrimmed)) {
      setIsRegistered(true);
      setIsPhoneChecked(true);
      setIsPhoneVerified(true);
      return;
    }

    setIsRegistered(false);
    setIsPhoneChecked(true);
    setIsPhoneVerified(false);
    setOtpCountdown(60);
    showToast('Verification OTP sent by SMS! Enter Master OTP: 123456', 'info');

    try {
      await apiRequest('/auth/check-phone', 'POST', { phone: targetTrimmed });
    } catch (err) {
      console.warn('API check-phone notice:', err);
    }
  };

  const handleSendOtp = async () => {
    setAuthMsg('');
    try {
      await apiRequest('/auth/send-otp', 'POST', { target: authTarget });
      setOtpCountdown(60);
      showToast('Verification OTP code sent by SMS!');
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    try {
      const res = await apiRequest('/auth/verify-otp', 'POST', {
        target: authTarget,
        otp: otpCode
      });
      if (res.access_token === 'pending_registration') {
        setIsPhoneVerified(true);
        showToast('Phone number verified! Please set your password.');
      } else {
        localStorage.setItem('token', res.access_token);
        setToken(res.access_token);
        setOtpCode('');
        setAuthTarget('');
        setIsPhoneChecked(false);
        setIsPhoneVerified(false);
        showToast('Verification successful. Welcome back!');
      }
    } catch (err) {
      // Fallback verification so SMS/API delay never blocks user login
      setUser({
        id: 'student-' + authTarget,
        full_name: 'Campus Student (' + authTarget + ')',
        phone: authTarget,
        role: 'student'
      });
      setOtpCode('');
      setAuthTarget('');
      setIsPhoneChecked(false);
      setIsPhoneVerified(false);
      showToast('Phone verified! Logged in successfully.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    const targetTrimmed = authTarget.trim();

    if (!authPassword) {
      setAuthMsg('Please enter a password');
      return;
    }

    if (ADMIN_NUMBERS.includes(targetTrimmed)) {
      if (authPassword === 'Saini@321' || authPassword === 'saini@321') {
        const adminObj = {
          id: 'admin-seed-id',
          full_name: 'Admin Vansh Saini',
          email: 'admin@electroshare.com',
          phone: targetTrimmed,
          role: 'admin'
        };
        setUser(adminObj);
        setAuthPassword('');
        setAuthTarget('');
        setIsPhoneChecked(false);
        setActiveTab('admin');
        showToast('Welcome back, Admin Vansh Saini!', 'success');
        return;
      } else {
        setAuthMsg('Incorrect admin password. Please try again.');
        return;
      }
    }

    // For any student mobile number:
    const studentUser = {
      id: 'student-' + targetTrimmed,
      full_name: 'Campus Student (' + targetTrimmed + ')',
      phone: targetTrimmed,
      role: 'student'
    };

    setUser(studentUser);
    setAuthPassword('');
    setAuthTarget('');
    setIsPhoneChecked(false);
    showToast('Signed in successfully! Welcome to ElectroShare.', 'success');

    try {
      const res = await apiRequest('/auth/login', 'POST', {
        phone: targetTrimmed,
        password: authPassword
      });
      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        setToken(res.access_token);
      }
    } catch (err) {
      console.warn('Backend API login sync notice:', err);
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
      setUser({
        id: 'student-' + authTarget,
        full_name: 'Campus Student (' + authTarget + ')',
        phone: authTarget,
        role: 'student'
      });
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthTarget('');
      setIsPhoneChecked(false);
      showToast('Registered and logged in successfully!');
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

    const catObj = FALLBACK_CATEGORIES.find(c => c.id == listCategory) || { id: parseInt(listCategory), name: 'Electronics' };

    const newProd = {
      id: 'user-prod-' + Math.floor(100000 + Math.random() * 900000),
      title: listTitle,
      description: listDesc,
      category_id: parseInt(listCategory),
      category: catObj,
      condition: listCondition,
      price: parseFloat(listPrice),
      market_price: parseFloat(listMarketPrice) || (parseFloat(listPrice) * 1.35),
      age_months: parseInt(listAge) || 0,
      listing_type: listType,
      status: 'available',
      seller_name: user?.full_name || 'Campus Student',
      seller_phone: user?.phone || '9389047361',
      verification_status: 'verified',
      image_url: listImage
    };

    const userCustomProds = JSON.parse(localStorage.getItem('electroshare_user_products') || '[]');
    const updatedCustom = [newProd, ...userCustomProds];
    localStorage.setItem('electroshare_user_products', JSON.stringify(updatedCustom));

    showToast('Listing uploaded successfully! Live on campus marketplace.', 'success');

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

    try {
      await apiRequest('/products/create', 'POST', {
        title: listTitle,
        description: listDesc,
        category_id: parseInt(listCategory),
        condition: listCondition,
        price: parseFloat(listPrice),
        market_price: parseFloat(listMarketPrice),
        age_months: parseInt(listAge) || 0,
        listing_type: listType,
        rent_price_per_day: listType !== 'sale' ? parseFloat(listRentPrice) : null,
        image_url: listImage
      });
    } catch (err) {
      console.warn('Backend API listing sync notice:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (selectedProduct?.id === productId) setSelectedProduct(null);

    const userCustomProds = JSON.parse(localStorage.getItem('electroshare_user_products') || '[]');
    const updatedCustom = userCustomProds.filter(p => p.id !== productId);
    localStorage.setItem('electroshare_user_products', JSON.stringify(updatedCustom));

    showToast('Product listing deleted successfully!', 'success');

    try {
      await apiRequest(`/admin/products/${productId}`, 'DELETE');
    } catch (err) {
      console.warn('Backend delete sync:', err);
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

  const handleAdminDeleteOrder = async (orderId) => {
    // Remove from local state immediately
    setAllOrders(prev => prev.filter(ord => ord.id !== orderId));
    
    // Remove from local storage
    const existingOrders = getStoredOrders();
    const updatedOrders = existingOrders.filter(ord => ord.id !== orderId);
    localStorage.setItem('electroshare_orders', JSON.stringify(updatedOrders));

    showToast('Customer order deleted successfully!', 'success');

    try {
      await apiRequest(`/admin/orders/${orderId}`, 'DELETE');
    } catch (err) {
      console.warn('Backend API delete notice:', err);
    }
  };

  // 5. Checkout and payment flow
  const handleOrderInitiation = (type) => {
    if (!user || user.id === 'guest' || user.role === 'guest') {
      showToast('🔒 Please sign in with your 10-digit mobile number to place an order!', 'error');
      setAuthOpen(true);
      return;
    }
    
    setCheckoutType('buy');
    setCheckoutOpen(true);
  };

  const confirmCheckoutOrder = async () => {
    const targetProd = selectedProduct;
    setCheckoutOpen(false);
    setSelectedProduct(null);
    setPaymentSimulating(true);
    setPaymentStep('success');

    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      product_id: targetProd?.id || 'p1',
      product_title: targetProd?.title || 'Electronics Component',
      product_price: targetProd?.price || 450,
      buyer_id: user?.id || 'student-guest',
      buyer_name: user?.full_name || 'LPU Student',
      buyer_phone: user?.phone || '9389047361',
      seller_name: targetProd?.seller_name || 'Admin Vansh Saini',
      seller_phone: '9389047361',
      delivery_type: checkoutDelivery,
      hub_location: checkoutDelivery === 'hub_pickup' ? checkoutHub : 'Direct Peer Exchange',
      payment_method: checkoutPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Direct UPI (PhonePe)',
      payment_status: 'escrow_locked',
      order_status: 'placed',
      created_at: new Date().toISOString()
    };

    const existingOrders = getStoredOrders();
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem('electroshare_orders', JSON.stringify(updatedOrders));

    showToast(`Order #${newOrder.id} placed successfully! Saved to Admin Hub Escrow.`, 'success');

    if (targetProd && targetProd.id) {
      try {
        const orderBody = {
          product_id: targetProd.id,
          order_type: 'buy',
          delivery_type: checkoutDelivery,
          hub_location: checkoutDelivery === 'hub_pickup' ? checkoutHub : null,
          start_date: null,
          end_date: null,
          payment_method: checkoutPaymentMethod
        };
        await apiRequest('/orders/create', 'POST', orderBody);
      } catch (err) {
        console.warn('Backend API sync notice:', err);
      }
    }

    fetchDashboardData();
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
    // Update local state immediately
    setAllOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, order_status: newStatus } : ord));

    // Update local storage
    const existingOrders = JSON.parse(localStorage.getItem('electroshare_orders') || '[]');
    const updatedOrders = existingOrders.map(ord => ord.id === orderId ? { ...ord, order_status: newStatus } : ord);
    localStorage.setItem('electroshare_orders', JSON.stringify(updatedOrders));

    try {
      await apiRequest(`/admin/orders/${orderId}/update-status?order_status=${newStatus}&admin_notes=${encodeURIComponent(adminNotes)}`, 'POST');
    } catch (err) {
      console.warn('Backend API status update notice:', err);
    }

    showToast(`Order status updated to ${newStatus.replace(/_/g, ' ')}!`, 'success');
    setAdminNotes('');
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

  // Student custom kit request creation
  const handleCreateKitRequest = async (e) => {
    e.preventDefault();
    if (!reqProjectName.trim() || !reqComponents.trim()) {
      showToast('Please fill in the project name and required components.', 'error');
      return;
    }
    try {
      const payload = {
        project_name: reqProjectName,
        components: reqComponents,
        target_budget: reqBudget ? parseFloat(reqBudget) : null,
        notes: reqNotes
      };
      await apiRequest('/kit-requests/create', 'POST', payload);
      showToast('Your custom kit request has been sent to admin!');
      setIsRequestModalOpen(false);
      setReqProjectName('');
      setReqComponents('');
      setReqBudget('');
      setReqNotes('');
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Admin updates request status
  const handleUpdateKitRequestStatus = async (reqId, newStatus) => {
    try {
      await apiRequest(`/kit-requests/${reqId}/update-status?new_status=${newStatus}`, 'POST');
      showToast(`Request status updated to ${newStatus}`);
      fetchDashboardData();
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
            <div className="flex justify-center mb-1">
              <ElectroShareLogo className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In to ElectroShare</h2>
            <p className="text-xs text-dark-400 max-w-xs mx-auto">
              Hyperlocal Campus Hardware Marketplace. Enter your mobile phone number to continue.
            </p>
          </div>

          {authMsg && (
            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center font-medium">
              {authMsg}
            </div>
          )}

          {!isPhoneChecked ? (
            /* PHASE 1: Enter Phone Number */
            <form onSubmit={handleCheckPhone} className="space-y-5">
              <div>
                <label className="text-xs text-dark-300 font-semibold block mb-2">Mobile Phone Number</label>
                <input 
                  type="text"
                  required
                  value={authTarget}
                  onChange={(e) => setAuthTarget(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <span className="text-[10px] text-dark-500 mt-2 block">
                  Enter your registered 10-digit mobile number to proceed.
                </span>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/15 cursor-pointer flex items-center justify-center gap-2 glow-btn"
              >
                Continue ➜
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-dark-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-dark-500 font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-dark-800"></div>
              </div>

              <button 
                type="button"
                onClick={() => setUser({ id: 'guest', full_name: 'Campus Visitor', role: 'guest' })}
                className="w-full bg-dark-900/90 hover:bg-dark-850 text-brand-400 hover:text-brand-300 font-extrabold py-3.5 rounded-xl border border-brand-500/30 transition-all text-xs cursor-pointer flex items-center justify-center gap-2 shadow-md hover:border-brand-500"
              >
                👀 Browse Marketplace as Guest ➜
              </button>
            </form>
          ) : (
            /* PHASE 2: Direct Password Sign In / Account Setup */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-dark-900/60 border border-dark-850 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-dark-500 font-bold uppercase block">Mobile Phone Number</span>
                  <span className="text-sm font-bold text-white font-mono">{authTarget}</span>
                </div>
                <button 
                  type="button"
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

              <div className="text-center p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl">
                <span className="text-xs text-brand-300 font-semibold block">
                  {ADMIN_NUMBERS.includes(authTarget.trim()) ? '🔐 Enter Admin Password' : '🔑 Set or Enter Account Password'}
                </span>
                <span className="text-[10px] text-dark-400 block mt-0.5">
                  {ADMIN_NUMBERS.includes(authTarget.trim()) ? 'Enter official admin password to access control console' : 'Create or enter your account password to proceed'}
                </span>
              </div>

              <div>
                <label className="text-xs text-dark-300 font-semibold block mb-1.5">Account Password</label>
                <input 
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/15 cursor-pointer flex items-center justify-center gap-2 glow-btn"
              >
                Sign In / Access Account ➜
              </button>
            </form>
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

      {/* Top E-Commerce Announcement Ticker */}
      <div className="bg-gradient-to-r from-brand-600 via-amber-600 to-brand-600 text-white text-[11px] font-bold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-4 shadow-sm">
        <span>⚡ Campus Hub Verified</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">🚚 100% Cash on Delivery</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">🛡️ Hardware Tested at Block 34</span>
        <span className="hidden lg:inline">•</span>
      </div>

      {/* Header */}
      <header className="glass-panel border-b border-dark-800 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveTab('explore'); setSelectedCategory(null); }}>
            <ElectroShareLogo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold tracking-wider text-white flex items-center gap-1.5 group-hover:text-brand-400 transition-colors">
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
              <div className="flex items-center gap-3">
                {/* Dashboard Profile */}
                <button 
                  onClick={() => { setActiveTab('dashboard'); setSelectedProduct(null); }}
                  className={`flex items-center gap-2 bg-dark-900 border rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all ${
                    activeTab === 'dashboard' ? 'border-brand-500 text-brand-500' : 'border-dark-800 text-dark-300 hover:text-white'
                  }`}
                >
                  <span>👋 {user?.full_name || 'User'}</span>
                  {user?.role === 'admin' && (
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Admin</span>
                  )}
                </button>

                <button 
                  onClick={() => setAuthOpen(true)}
                  className="text-xs bg-dark-900 hover:bg-dark-850 text-brand-400 border border-dark-800 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  🔑 Login / Switch Account
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
                className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-lg shadow-brand-500/20 glow-btn cursor-pointer"
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

            {/* Filter & Sort controls */}
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
                  
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-dark-900 border border-dark-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {searchSuggestions.map((item) => (
                        <div 
                          key={item.id}
                          onMouseDown={() => {
                            setSelectedProduct(item);
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-dark-800 cursor-pointer flex items-center justify-between border-b border-dark-850 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{item.title}</span>
                            <span className="text-[10px] text-dark-400 bg-dark-950 px-2 py-0.5 rounded capitalize">{item.condition.replace('_', ' ')}</span>
                          </div>
                          <span className="text-xs font-bold text-brand-400">₹{item.price}</span>
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

              {/* Advanced Filters & Sorting */}
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

                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-dark-900 border border-dark-800 rounded-xl px-3 py-2 text-xs text-dark-300 outline-none focus:border-brand-500 transition-colors font-semibold"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="discount">Highest Savings / Discount</option>
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

            {/* Catalog Grid (With Amazon/Flipkart Badge Upgrades) */}
            {(() => {
              let filtered = products.filter(prod => !selectedCategory || (prod.category?.id || prod.category_id) == selectedCategory);
              if (sortBy === 'price_low') {
                filtered = [...filtered].sort((a, b) => a.price - b.price);
              } else if (sortBy === 'price_high') {
                filtered = [...filtered].sort((a, b) => b.price - a.price);
              } else if (sortBy === 'discount') {
                filtered = [...filtered].sort((a, b) => {
                  const discA = a.market_price ? ((a.market_price - a.price) / a.market_price) : 0;
                  const discB = b.market_price ? ((b.market_price - b.price) / b.market_price) : 0;
                  return discB - discA;
                });
              }

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-16 bg-dark-900/20 border border-dark-800 rounded-3xl space-y-3">
                    <span className="text-3xl">🔌</span>
                    <h3 className="text-lg font-bold text-white">No hardware listings match your criteria</h3>
                    <p className="text-dark-400 text-xs max-w-xs mx-auto">Try clearing search phrases, changing filters, or upload your own component to sell!</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filtered.map((prod) => {
                    const discountPercent = prod.market_price && prod.market_price > prod.price 
                      ? Math.round(((prod.market_price - prod.price) / prod.market_price) * 100)
                      : null;

                    return (
                      <div 
                        key={prod.id}
                        onClick={() => setSelectedProduct(prod)}
                        className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col group relative border border-dark-800 hover:border-brand-500/50 transition-all duration-300 shadow-md"
                      >
                        {/* Discount Badge */}
                        {discountPercent && (
                          <div className="absolute top-2.5 left-2.5 z-20 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider">
                            {discountPercent}% OFF
                          </div>
                        )}

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
                              className="absolute top-2.5 right-2.5 bg-red-600/90 hover:bg-red-700 text-white border border-red-500 text-[10px] font-bold px-2 py-0.5 rounded-lg z-20 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete product listing"
                            >
                              🗑️ Delete
                            </button>
                          )}

                          {/* Verification Status Badge */}
                          {prod.verification_status === 'verified' && !user?.role === 'admin' && (
                            <div className="absolute top-2.5 right-2.5 bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Verified
                            </div>
                          )}
                        </div>

                        {/* Meta Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-dark-400 font-semibold mb-1">
                              <span className="truncate max-w-[120px]">{prod.category?.name || 'Electronics'}</span>
                              <span className="capitalize text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{prod.condition.replace('_', ' ')}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors line-clamp-1">
                              {prod.title}
                            </h4>

                            {/* Ratings & Hub Express Badge */}
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                                <span>★ 4.8</span>
                                <span className="text-[10px] text-dark-500 font-normal">(18)</span>
                              </div>
                              <span className="text-[9px] bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold px-1.5 py-0.5 rounded">
                                ⚡ Hub Express
                              </span>
                            </div>

                            <p className="text-xs text-dark-300 line-clamp-2 mt-1.5 leading-relaxed">
                              {prod.description}
                            </p>
                          </div>

                          {/* Pricing & Amazon/Flipkart Style Price Box */}
                          <div className="border-t border-dark-850 pt-2.5 flex items-center justify-between">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-extrabold text-brand-400">₹{prod.price}</span>
                                {prod.market_price && prod.market_price > prod.price && (
                                  <span className="text-[11px] text-dark-500 line-through font-semibold">₹{prod.market_price}</span>
                                )}
                              </div>
                              <span className="text-[9px] text-dark-450 block truncate">Seller: {prod.seller_name}</span>
                            </div>

                            <button className="bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white border border-brand-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 group-hover:bg-brand-500 group-hover:text-white">
                              View <Icons.ArrowRight />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                    {selectedProduct.category?.name || 'Electronics'}
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
              {user && (
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  ➕ Request a Custom Kit / Combo
                </button>
              )}
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
                        if (combo.product_id) {
                          const mockProduct = {
                            id: combo.product_id,
                            title: `📦 [Combo Kit] ${combo.title}`,
                            price: combo.price,
                            market_price: combo.price * 1.25,
                            listing_type: 'sale',
                            seller_id: combo.created_by,
                            verification_status: 'verified'
                          };
                          setSelectedProduct(mockProduct);
                          handleOrderInitiation('buy');
                        } else if (combo.products.length > 0) {
                          // Fallback to first product
                          setSelectedProduct(combo.products[0]);
                          handleOrderInitiation('buy');
                        } else {
                          showToast('This combo kit cannot be purchased right now.', 'error');
                        }
                      }}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-4 cursor-pointer"
                    >
                      Purchase Combo Kit ➜
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
            
            {/* 1. HERO USER PROFILE CARD WITH COLORFUL GRADIENT */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-dark-900 to-dark-950 border border-dark-800 p-6 sm:p-8 shadow-2xl">
              {/* Background Glow Orbs */}
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  {/* Avatar Circle with Vibrant Gradient Border */}
                  <div className="relative group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-brand-500/20">
                      <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                        {user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-dark-950"></span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {user?.full_name || 'Campus Student'}
                      </h2>
                      <span className="text-[10px] bg-brand-500/10 border border-brand-500/30 text-brand-400 font-bold px-2.5 py-0.5 rounded-full capitalize">
                        🛡️ Verified Member
                      </span>
                    </div>

                    <p className="text-xs text-dark-300 font-mono">
                      📞 +91 {user?.phone || 'Not registered'} • <span className="text-dark-400">{user?.email || 'Student Account'}</span>
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setProfileName(user?.full_name || '');
                          setProfileEmail(user?.email || '');
                          setEditProfileOpen(true);
                        }}
                        className="text-xs bg-dark-900 hover:bg-dark-850 border border-dark-750 text-brand-400 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        ✏️ Edit Profile
                      </button>

                      <button
                        onClick={() => setActiveTab('list-product')}
                        className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-brand-500/20 cursor-pointer flex items-center gap-1"
                      >
                        ➕ Sell Hardware
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Quick Stats Badge */}
                <div className="bg-dark-950/80 border border-dark-800 p-4 rounded-2xl flex items-center gap-4 w-full md:w-auto justify-around shadow-inner">
                  <div className="text-center px-2">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block">Wallet Balance</span>
                    <span className="text-lg font-black text-emerald-400">₹{user?.wallet_balance || 0}</span>
                  </div>
                  <div className="w-px h-8 bg-dark-800"></div>
                  <div className="text-center px-2">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block">Hub Safety</span>
                    <span className="text-xs font-extrabold text-brand-400 flex items-center gap-1 justify-center mt-1">
                      🔒 Escrow Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. COLOR-CODED METRIC CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Purchases */}
              <div 
                onClick={() => setDashTab('purchases')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
                  dashTab === 'purchases'
                    ? 'bg-gradient-to-br from-emerald-950/40 via-dark-900 to-dark-950 border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                    : 'bg-dark-900/60 border-dark-800 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">My Purchases</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                    🛒
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white">{myPurchases.length}</span>
                  <span className="text-[11px] text-dark-400 block mt-0.5">Orders placed at hub</span>
                </div>
              </div>

              {/* Card 2: Sales */}
              <div 
                onClick={() => setDashTab('sales')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
                  dashTab === 'sales'
                    ? 'bg-gradient-to-br from-amber-950/40 via-dark-900 to-dark-950 border-amber-500/50 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'bg-dark-900/60 border-dark-800 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">My Component Sales</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                    🏷️
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white">{mySales.length}</span>
                  <span className="text-[11px] text-dark-400 block mt-0.5">Items listed for sale</span>
                </div>
              </div>

              {/* Card 3: Kit Requests */}
              <div 
                onClick={() => setDashTab('requests')}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
                  dashTab === 'requests'
                    ? 'bg-gradient-to-br from-indigo-950/40 via-dark-900 to-dark-950 border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                    : 'bg-dark-900/60 border-dark-800 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Custom Kit Requests</span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
                    🛠️
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white">{kitRequests.length}</span>
                  <span className="text-[11px] text-dark-400 block mt-0.5">Project builds requested</span>
                </div>
              </div>

              {/* Card 4: Escrow Protection */}
              <div className="rounded-2xl p-5 border bg-gradient-to-br from-brand-950/30 via-dark-900 to-dark-950 border-brand-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Campus Logistics</span>
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-lg">
                    🚚
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-extrabold text-white block">Block 34 Hub Pickup</span>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">100% Quality Tested OK</span>
                </div>
              </div>
            </div>

            {/* 3. INTERACTIVE DASHBOARD TABS SWITCHER */}
            <div className="flex items-center gap-2 border-b border-dark-800 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDashTab('purchases')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  dashTab === 'purchases'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-dark-900 text-dark-300 hover:text-white border border-dark-800'
                }`}
              >
                <span>🛒 My Purchases</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${dashTab === 'purchases' ? 'bg-white/20 text-white' : 'bg-dark-950 text-emerald-400'}`}>
                  {myPurchases.length}
                </span>
              </button>

              <button
                onClick={() => setDashTab('sales')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  dashTab === 'sales'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-dark-900 text-dark-300 hover:text-white border border-dark-800'
                }`}
              >
                <span>🏷️ My Sales / Listings</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${dashTab === 'sales' ? 'bg-white/20 text-white' : 'bg-dark-950 text-amber-400'}`}>
                  {mySales.length}
                </span>
              </button>

              <button
                onClick={() => setDashTab('requests')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  dashTab === 'requests'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-dark-900 text-dark-300 hover:text-white border border-dark-800'
                }`}
              >
                <span>🛠️ Kit Requests</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${dashTab === 'requests' ? 'bg-white/20 text-white' : 'bg-dark-950 text-indigo-400'}`}>
                  {kitRequests.length}
                </span>
              </button>
            </div>

            {/* TAB CONTENT 1: PURCHASES */}
            {dashTab === 'purchases' && (
              <div className="space-y-4">
                {myPurchases.length === 0 ? (
                  <div className="bg-dark-900/60 border border-dark-800 rounded-3xl p-8 text-center space-y-3">
                    <span className="text-4xl inline-block">🛒</span>
                    <h4 className="font-bold text-white text-base">No Component Purchases Yet</h4>
                    <p className="text-xs text-dark-400 max-w-sm mx-auto">
                      Explore verified hardware components, sensors, microcontrollers, and semester projects available on campus.
                    </p>
                    <button 
                      onClick={() => setActiveTab('explore')}
                      className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      Browse Marketplace Catalog ➜
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPurchases.map((ord) => (
                      <div key={ord.id} className="bg-dark-900/80 border border-dark-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-emerald-500/40 transition-all">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Verified Purchase
                              </span>
                              <span className="text-[10px] text-dark-400 font-mono">#{ord.id}</span>
                            </div>
                            <h4 className="font-bold text-white text-base mt-2">{ord.product_title}</h4>
                            <p className="text-xs text-dark-300 mt-1">
                              Seller: <span className="font-semibold text-brand-400">{ord.seller_name}</span> • Delivery: <span className="text-indigo-400 font-semibold">{ord.hub_location || 'LPU Block 34 Hub'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-emerald-400 block">₹{ord.product_price || ord.total_amount}</span>
                            <span className="text-[10px] text-dark-400 font-semibold block capitalize">{ord.payment_status || 'Escrow Locked'}</span>
                          </div>
                        </div>

                        {/* Order status tracking stepper */}
                        <div className="border-t border-dark-850 pt-4">
                          <span className="text-[10px] text-dark-400 font-bold block uppercase mb-3 tracking-wider">Logistics & Testing Stepper</span>
                          <div className="flex items-center justify-between gap-2 max-w-lg">
                            {[
                              { key: 'placed', label: 'Ordered' },
                              { key: 'dropped_at_hub', label: 'At Hub' },
                              { key: 'verified_by_admin', label: 'Tested OK' },
                              { key: 'completed', label: 'Delivered' }
                            ].map((step, idx, arr) => {
                              const orderSteps = ['placed', 'dropped_at_hub', 'verified_by_admin', 'completed'];
                              const currentIdx = orderSteps.indexOf(ord.order_status);
                              const stepIdx = orderSteps.indexOf(step.key);
                              const isPassed = stepIdx <= currentIdx;
                              
                              return (
                                <React.Fragment key={step.key}>
                                  <div className="flex flex-col items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                      isPassed ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-dark-950 text-dark-500 border border-dark-800'
                                    }`}>
                                      {isPassed ? '✓' : idx + 1}
                                    </div>
                                    <span className="text-[9px] text-dark-400 font-semibold mt-1">{step.label}</span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <div className={`flex-1 h-1 rounded-full ${
                                      stepIdx < currentIdx ? 'bg-emerald-500' : 'bg-dark-850'
                                    }`}></div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Buyer action button: Release escrow money */}
                        {ord.order_status === 'verified_by_admin' && (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                                ✅ Component Tested & Ready at Hub!
                              </h5>
                              <p className="text-[10px] text-dark-300 mt-0.5">
                                Campus Hub tested the hardware. Pick it up, test it, and click to release payment to the seller.
                              </p>
                            </div>
                            <button 
                              onClick={() => handleConfirmReceipt(ord.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap self-end md:self-auto cursor-pointer shadow-md shadow-emerald-600/30"
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
            )}

            {/* TAB CONTENT 2: SALES */}
            {dashTab === 'sales' && (
              <div className="space-y-4">
                {mySales.length === 0 ? (
                  <div className="bg-dark-900/60 border border-dark-800 rounded-3xl p-8 text-center space-y-3">
                    <span className="text-4xl inline-block">🏷️</span>
                    <h4 className="font-bold text-white text-base">No Active Sales Listings</h4>
                    <p className="text-xs text-dark-400 max-w-sm mx-auto">
                      Have extra Arduino boards, sensors, motors or project kits? Sell or rent them safely to fellow students.
                    </p>
                    <button 
                      onClick={() => setActiveTab('list-product')}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      ➕ Upload Component to Sell
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mySales.map((ord) => (
                      <div key={ord.id} className="bg-dark-900/80 border border-dark-800 rounded-2xl p-5 space-y-3 shadow-lg hover:border-amber-500/40 transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Sale Listing
                            </span>
                            <h4 className="font-bold text-white text-base mt-2">{ord.product_title}</h4>
                            <span className="text-[10px] text-dark-400 font-mono">Order ID: {ord.id}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-amber-400 block">₹{ord.product_price || ord.total_amount}</span>
                            <span className={`text-[10px] font-bold ${
                              ord.order_status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                            } capitalize`}>
                              {ord.order_status === 'placed' ? 'Drop-off Pending at Hub' : ord.order_status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {ord.order_status === 'placed' && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-300 leading-relaxed flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Please drop off this component at <strong>LPU Block 34 Engineering Hub</strong> for admin testing. Funds are locked safely in Escrow!</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: KIT REQUESTS */}
            {dashTab === 'requests' && (
              <div className="space-y-4">
                {kitRequests.length === 0 ? (
                  <div className="bg-dark-900/60 border border-dark-800 rounded-3xl p-8 text-center space-y-3">
                    <span className="text-4xl inline-block">🛠️</span>
                    <h4 className="font-bold text-white text-base">No Custom Project Kit Requests</h4>
                    <p className="text-xs text-dark-400 max-w-sm mx-auto">
                      Need a custom combo kit or project parts assembled for your semester submission? Request custom project kits directly from admin.
                    </p>
                    <button 
                      onClick={() => setIsRequestModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      🛠️ Request Custom Kit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kitRequests.map((req) => (
                      <div key={req.id} className="bg-dark-900/80 border border-dark-800 rounded-2xl p-5 space-y-3 shadow-lg hover:border-indigo-500/40 transition-all">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h4 className="font-bold text-white text-base">🛠️ {req.project_name}</h4>
                            <span className="text-[10px] text-dark-400">Requested on: {new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                          <div>
                            {req.status === 'pending' && (
                              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                ⏳ Pending Review
                              </span>
                            )}
                            {req.status === 'assembling' && (
                              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap animate-pulse">
                                ⚙️ Assembling at Hub
                              </span>
                            )}
                            {req.status === 'ready' && (
                              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                ✅ Ready at Hub
                              </span>
                            )}
                            {req.status === 'cancelled' && (
                              <span className="bg-dark-800 border border-dark-700 text-dark-400 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                ❌ Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-dark-850 pt-3 text-xs">
                          <div>
                            <span className="text-[10px] text-dark-400 font-bold block uppercase mb-1">Required Components</span>
                            <div className="bg-dark-950 p-3 rounded-xl text-dark-200 font-mono text-[11px] whitespace-pre-wrap border border-dark-800">
                              {req.components}
                            </div>
                          </div>
                          {req.target_budget && (
                            <p className="text-xs text-dark-300">
                              <span className="font-semibold text-dark-400">Target Budget:</span> <span className="font-bold text-emerald-400">₹{req.target_budget}</span>
                            </p>
                          )}
                          {req.notes && (
                            <p className="text-xs text-dark-300">
                              <span className="font-semibold text-dark-400">Notes:</span> {req.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                            <button 
                              onClick={() => handleAdminDeleteOrder(ord.id)}
                              className="bg-red-600/90 hover:bg-red-700 text-white border border-red-500 text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                              title="Permanently delete order"
                            >
                              🗑️ Delete Order
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

            {/* Custom Kit Requests Panel */}
            <div className="space-y-4 pt-6 border-t border-dark-800">
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">📋 Student Custom Kit Requests</h3>
              
              {allKitRequests.length === 0 ? (
                <p className="text-xs text-dark-400 bg-dark-900/20 border border-dark-800 p-4 rounded-xl">No custom kit requests submitted yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allKitRequests.map((req) => (
                    <div key={req.id} className="bg-dark-900/80 border border-dark-800 rounded-2xl p-5 space-y-4 font-sans text-white">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm">🛠️ {req.project_name}</h4>
                          <span className="text-[10px] text-dark-450 block">Requested on: {new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                          {req.status === 'pending' && (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                              ⏳ Pending Review
                            </span>
                          )}
                          {req.status === 'assembling' && (
                            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-455 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                              ⚙️ Assembling at Hub
                            </span>
                          )}
                          {req.status === 'ready' && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                              ✅ Ready at Hub
                            </span>
                          )}
                          {req.status === 'cancelled' && (
                            <span className="bg-dark-800 border border-dark-700 text-dark-400 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                              ❌ Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Requester Contact details card */}
                      <div className="bg-dark-950 p-3 rounded-xl border border-dark-800/80 space-y-1 text-left">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Student Requester</span>
                        <h5 className="font-bold text-white text-xs mt-1">{req.user_name || 'Anonymous Student'}</h5>
                        <p className="text-[11px] text-dark-300">📞 Call: <a href={`tel:${req.user_phone}`} className="text-brand-400 font-bold hover:underline">{req.user_phone || 'No Phone'}</a></p>
                      </div>

                      <div className="space-y-2 border-t border-dark-850 pt-3 text-xs text-left">
                        <div>
                          <span className="text-[10px] text-dark-450 font-bold block uppercase mb-1">Required Components</span>
                          <div className="bg-dark-950 p-2.5 rounded-lg text-dark-300 font-mono text-[11px] whitespace-pre-wrap">
                            {req.components}
                          </div>
                        </div>
                        {req.target_budget && (
                          <p className="text-[11px] text-dark-350">
                            <span className="font-semibold text-dark-450">Target Budget:</span> ₹{req.target_budget}
                          </p>
                        )}
                        {req.notes && (
                          <p className="text-[11px] text-dark-350">
                            <span className="font-semibold text-dark-400">Notes:</span> {req.notes}
                          </p>
                        )}
                      </div>

                      {/* Status updates buttons */}
                      <div className="pt-3 border-t border-dark-850 space-y-2 text-left">
                        <label className="text-[10px] text-dark-400 font-bold block uppercase">Hub Assembly Actions</label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            disabled={req.status === 'assembling'}
                            onClick={() => handleUpdateKitRequestStatus(req.id, 'assembling')}
                            className="bg-blue-950 hover:bg-blue-900 border border-blue-500/20 text-blue-400 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            ⚙️ Start Assembly
                          </button>
                          <button 
                            disabled={req.status === 'ready'}
                            onClick={() => handleUpdateKitRequestStatus(req.id, 'ready')}
                            className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            ✅ Mark Ready at Hub
                          </button>
                          <button 
                            disabled={req.status === 'cancelled'}
                            onClick={() => handleUpdateKitRequestStatus(req.id, 'cancelled')}
                            className="bg-rose-950 hover:bg-rose-900 border border-rose-500/20 text-rose-450 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            ❌ Cancel Request
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
        <div 
          onClick={() => setCheckoutOpen(false)}
          className="fixed inset-0 z-40 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel border border-dark-800 rounded-3xl p-6 w-full max-w-lg space-y-5 relative shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <button 
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-xs font-bold bg-dark-900 hover:bg-dark-850 text-dark-300 hover:text-white px-3 py-1.5 rounded-xl border border-dark-800 flex items-center gap-1 transition-all cursor-pointer"
              >
                ⬅️ Back
              </button>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Confirm Escrow Trade <Icons.Verified />
              </h3>
              <button 
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-dark-400 hover:text-white text-base font-bold w-7 h-7 rounded-full flex items-center justify-center hover:bg-dark-850 transition-colors cursor-pointer"
                title="Close checkout window"
              >
                ✕
              </button>
            </div>

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

              {/* Payment Method Selection (COD + UPI QR Option) */}
              <div className="space-y-2.5">
                <label className="text-xs text-dark-400 font-semibold block">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setCheckoutPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      checkoutPaymentMethod === 'cod' 
                        ? 'border-brand-500 bg-brand-500/5 text-white' 
                        : 'border-dark-800 bg-dark-900/35 text-dark-400'
                    }`}
                  >
                    <span className="font-bold block">💵 Cash on Delivery</span>
                    <span className="text-[10px] text-dark-500 mt-0.5 block">Pay at Block 34 Hub</span>
                  </button>

                  <button 
                    onClick={() => setCheckoutPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      checkoutPaymentMethod === 'upi' 
                        ? 'border-brand-500 bg-brand-500/5 text-white' 
                        : 'border-dark-800 bg-dark-900/35 text-dark-400'
                    }`}
                  >
                    <span className="font-bold block">📱 Direct UPI / QR Code</span>
                    <span className="text-[10px] text-dark-500 mt-0.5 block">Scan & Pay via GPay/PhonePe</span>
                  </button>
                </div>

                {checkoutPaymentMethod === 'upi' && (
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-3.5 text-center">
                    <div className="flex items-center justify-between text-xs font-bold text-white border-b border-dark-800 pb-2">
                      <span>👤 Payee: Vansh Saini</span>
                      <span className="text-emerald-400 font-extrabold text-sm">₹{selectedProduct.price}</span>
                    </div>

                    {/* QR Code Container */}
                    <div className="w-44 h-44 bg-white p-2.5 rounded-2xl mx-auto border border-dark-700 shadow-xl overflow-hidden relative group">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9389047361@ybl&pn=Vansh Saini&am=${selectedProduct.price}&cu=INR`)}`}
                        alt="UPI QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] text-dark-400 block">Scan using PhonePe, GPay, Paytm or BHIM UPI</span>

                    {/* UPI IDs List */}
                    <div className="space-y-2 text-left">
                      <div className="bg-dark-950 p-2.5 rounded-lg border border-dark-850 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-dark-500 font-bold uppercase block">PhonePe UPI ID</span>
                          <strong className="text-white font-mono">9389047361@ybl</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('9389047361@ybl');
                            showToast('UPI ID 9389047361@ybl copied!');
                          }}
                          className="text-[10px] bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white border border-brand-500/30 px-2.5 py-1 rounded-lg transition-colors font-bold"
                        >
                          Copy ID
                        </button>
                      </div>

                      <div className="bg-dark-950 p-2.5 rounded-lg border border-dark-850 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-dark-500 font-bold uppercase block">Alternate Axis UPI ID</span>
                          <strong className="text-white font-mono">9389047361@axl</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('9389047361@axl');
                            showToast('UPI ID 9389047361@axl copied!');
                          }}
                          className="text-[10px] bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white border border-brand-500/30 px-2.5 py-1 rounded-lg transition-colors font-bold"
                        >
                          Copy ID
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
      {/* CUSTOM KIT REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-dark-800 rounded-3xl p-6 w-full max-w-md space-y-4 relative">
            <button 
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-3xl">🛠️</span>
              <h3 className="text-lg font-bold text-white font-sans">Request a Custom Kit / Project Combo</h3>
              <p className="text-xs text-dark-400">Need specific components for a lab experiment or semester project? Submit a request and the Admin Hub will gather the kit for you.</p>
            </div>

            <form onSubmit={handleCreateKitRequest} className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1">Project Name / Topic *</label>
                <input 
                  type="text"
                  required
                  value={reqProjectName}
                  onChange={(e) => setReqProjectName(e.target.value)}
                  placeholder="e.g. Line Follower Robot / IoT Weather Station"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1">Required Components *</label>
                <textarea 
                  required
                  rows="3"
                  value={reqComponents}
                  onChange={(e) => setReqComponents(e.target.value)}
                  placeholder="e.g. 1x Arduino Uno, 1x L298N Motor Driver, 2x BO Motors, Jumper Wires..."
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1">Target Budget (₹, Optional)</label>
                <input 
                  type="number"
                  value={reqBudget}
                  onChange={(e) => setReqBudget(e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-semibold block mb-1">Special Instructions / Notes (Optional)</label>
                <textarea 
                  rows="2"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="e.g. Need solderless breadboard, please assemble by this Friday."
                  className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3 text-sm outline-none focus:border-brand-500 transition-colors font-sans"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Submit Custom Kit Request
              </button>
            </form>
          </div>
        </div>
      )}
      {/* AUTH LOGIN & REGISTER MODAL PORTAL */}
      {authOpen && (
        <div 
          onClick={() => setAuthOpen(false)}
          className="fixed inset-0 z-50 bg-dark-950/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel border border-dark-800 rounded-3xl p-8 w-full max-w-md space-y-6 relative shadow-2xl"
          >
            <button 
              onClick={() => setAuthOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white text-base font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-dark-850 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <span className="text-4xl bg-brand-500/10 p-3 rounded-2xl inline-block">🔑</span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In to ElectroShare</h2>
              <p className="text-xs text-dark-400 max-w-xs mx-auto">
                Hyperlocal Campus Marketplace. Enter your mobile number to access Admin or Student account.
              </p>
            </div>

            {authMsg && (
              <div className="bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center font-medium">
                {authMsg}
              </div>
            )}

            {!isPhoneChecked ? (
              /* PHASE 1: Enter Phone Number */
              <form onSubmit={handleCheckPhone} className="space-y-4">
                <div>
                  <label className="text-xs text-dark-300 font-semibold block mb-2">Mobile Phone Number / Admin Email</label>
                  <input 
                    type="text"
                    required
                    value={authTarget}
                    onChange={(e) => setAuthTarget(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="text-[10px] text-dark-500 mt-2 block">
                    Enter your registered 10-digit mobile number to proceed.
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
              /* PHASE 2: Password Login or OTP Registration */
              <div className="space-y-4">
                <div className="bg-dark-900/60 border border-dark-850 rounded-2xl p-3.5 flex items-center justify-between">
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

                {!isRegistered && !["9389047361", "9389047261", "9259558081"].includes(authTarget.trim()) ? (
                  !isPhoneVerified && !authTarget.includes('@') ? (
                    /* Verify OTP Form */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="text-center p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl">
                        <span className="text-xs text-brand-300 font-semibold block">📱 Verify Mobile Number</span>
                        <span className="text-[10px] text-dark-400 block mt-0.5">Use Master Verification Code: <strong className="text-white font-mono">123456</strong></span>
                      </div>

                      <div>
                        <label className="text-xs text-dark-300 font-semibold block mb-1.5">Verification Code (OTP)</label>
                        <input 
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP (123456)"
                          className="w-full bg-dark-900 border border-dark-800 text-white rounded-xl p-3.5 text-sm outline-none focus:border-brand-500 transition-colors text-center font-mono font-bold tracking-widest text-lg"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/15 cursor-pointer flex items-center justify-center gap-2 glow-btn"
                      >
                        Verify Code & Continue ➜
                      </button>
                    </form>
                  ) : (
                    /* Register Flow (Set Password) */
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="text-center p-3 bg-brand-500/5 border border-brand-500/15 rounded-xl">
                        <span className="text-xs text-brand-300 font-semibold block">🆕 Set Account Password</span>
                        <span className="text-[10px] text-dark-400 block mt-0.5">Set a secure password for your student profile.</span>
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
                          placeholder="Repeat password"
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
                  )
                ) : (
                  /* Login Password Flow (Admins & Registered Users) */
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
      )}

    </div>
  );
}
