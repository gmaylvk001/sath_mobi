"use client";

import Link from "next/link";
import Image from 'next/image';
import { FiSearch, FiMapPin, FiHeart, FiShoppingCart, FiUser, FiMenu, FiX, FiPhoneCall, FiMessageSquare, FiChevronRight } from "react-icons/fi";
import { FaBars, FaShoppingBag, FaUserShield, FaSearch } from "react-icons/fa";
import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { IoLogOut } from "react-icons/io5";
import { useCart } from '@/context/CartContext';
import { useWishlist } from "@/context/WishlistContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { useRouter } from 'next/navigation';
import { Play } from "lucide-react";
import { Navigation } from 'swiper/modules';
import { useHeaderdetails } from "@/context/HeaderContext";
import HeaderNav from "@/components/HeaderNav";
import { Menu, X, ChevronDown } from "lucide-react";

// ADD: alphaSortString - case-insensitive, null-safe string comparator
const alphaSortString = (a, b) => {
  const sa = (a ?? '').toString().trim();
  const sb = (b ?? '').toString().trim();
  if (sa === sb) return 0;
  return sa.localeCompare(sb, undefined, { sensitivity: 'base' });
};

// ADD: prepareFlatListAlpha - level-aware alphabetical ordering
const prepareFlatListAlpha = (flatList = []) => {
  const list = Array.isArray(flatList) ? flatList.filter(Boolean) : [];

  // Split into categories vs brands
  const brandsHeader = list.find((i) => i.type === 'brands-header');
  const brands = list.filter((i) => i.type === 'brand');
  const categories = list.filter((i) => i.type !== 'brand' && i.type !== 'brands-header');

  // Headers are top-level categories (level 0)
  const headers = categories.filter((i) => Number(i.level) === 0);

  // Group by rootCategory (slug of the top-level)
  const byRoot = new Map();
  categories.forEach((item) => {
    const root = item.rootCategory || item.category_slug || '';
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(item);
  });

  const result = [];

  // Sort headers A-Z and then their children by (level asc, name A-Z)
  headers
    .sort((a, b) => alphaSortString(a.category_name, b.category_name))
    .forEach((header) => {
      const root = header.rootCategory || header.category_slug || '';
      const group = (byRoot.get(root) || []).filter((i) => i !== header);

      group.sort((a, b) => {
        const la = Number(a.level) || 0;
        const lb = Number(b.level) || 0;
        if (la !== lb) return la - lb;
        return alphaSortString(a.category_name, b.category_name);
      });

      result.push(header, ...group);
    });

  // Append any leftover categories (edge cases)
  const used = new Set(result.map((i) => i.uniqueKey || i._id));
  const leftovers = categories.filter((i) => !used.has(i.uniqueKey || i._id));
  if (leftovers.length) {
    leftovers.sort((a, b) => {
      const la = Number(a.level) || 0;
      const lb = Number(b.level) || 0;
      if (la !== lb) return la - lb;
      return alphaSortString(a.category_name, b.category_name);
    });
    result.push(...leftovers);
  }

  // Brands section at the end
  if (brandsHeader) result.push(brandsHeader);
  if (brands.length) {
    brands.sort((a, b) => alphaSortString(a.brand_name, b.brand_name));
    result.push(...brands);
  }

  return result;
};

export default function Header() {

const router = useRouter();
    // REMOVED: unused pathname
    // const pathname = usePathname();
    const [category, setCategory] = useState('All Category');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { wishlistCount } = useWishlist();
    const { cartCount, updateCartCount } = useCart();
    useEffect(() => {
         window.scrollTo(0, 0);
      }, []);
    // ADD: Cross-tab cart sync helpers
    const CART_COUNT_KEY = 'cartCount';
    // ADD: new key for cart data list
    const CART_DATA_KEY = 'cartData';

    // ADD: track latest cartCount for safe comparisons in effects/handlers
    const cartCountRef = useRef(cartCount);
    useEffect(() => {
      cartCountRef.current = cartCount;
    }, [cartCount]);

    // ADD: local cartData + ref
    const [cartData, setCartData] = useState(null);
    const cartDataRef = useRef(null);
    useEffect(() => { cartDataRef.current = cartData; }, [cartData]);

    const setCartCountSynced = useCallback((count) => {
      // Update context + propagate to other tabs
      updateCartCount(count);
      try {
        localStorage.setItem(CART_COUNT_KEY, String(Number.isFinite(count) ? count : 0));
      } catch { /* ignore quota */ }
    }, [updateCartCount]);

    // ADD: helpers for cartData storage + compare
    const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
    const isSameCartObj = (a, b) => {
      try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    };
    const persistCartData = (data) => {
      try {
        const nextStr = JSON.stringify(data ?? null);
        const prevStr = localStorage.getItem(CART_DATA_KEY);
        if (nextStr !== prevStr) {
          localStorage.setItem(CART_DATA_KEY, nextStr);
        }
      } catch { /* ignore */ }
    };
    const ensureGuestCartId = () => {
      try {
        let id = localStorage.getItem('guestCartId');
        if (!id) {
          id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
          localStorage.setItem('guestCartId', id);
        }
        return id;
      } catch {
        return 'guest-' + Date.now();
      }
    };

    // ADD: fetch latest cart from API (auth or guest), sync cartData and cartCount
    const fetchCartLatest = useCallback(async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : { guestCartId: ensureGuestCartId() };

        const res = await fetch('/api/cart', { method: 'GET', headers });
        if (!res.ok) {
          // if token invalid, do not overwrite local cartData here
          return;
        }
        const payload = await res.json();
        const latestCart = payload?.cart || null;

        // Sync cartCount if server value differs
        if (typeof latestCart?.totalItems === 'number' && latestCart.totalItems !== (cartCountRef.current ?? 0)) {
          setCartCountSynced(latestCart.totalItems);
        }

        // Only update state if changed
        if (!isSameCartObj(latestCart, cartDataRef.current)) {
          setCartData(latestCart);
          persistCartData(latestCart);
        }
      } catch (e) {
        // ignore fetch errors
      }
    }, [setCartCountSynced]);

    // Initialize from localStorage on mount (so tabs align immediately)
    useEffect(() => {
      try {
        const raw = localStorage.getItem(CART_COUNT_KEY);
        if (raw != null) {
          const val = parseInt(raw, 10);
          if (!Number.isNaN(val)) {
            if (val !== (typeof cartCount === 'number' ? cartCount : 0)) {
              updateCartCount(val);
            }
          }
        }
      } catch { /* ignore */ }
      // run only once
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ADD: init cartData from storage; if missing but count > 0 fetch latest
    useEffect(() => {
      try {
        const raw = localStorage.getItem(CART_DATA_KEY);
        const cached = safeParse(raw);
        if (cached && !isSameCartObj(cached, cartDataRef.current)) {
          setCartData(cached);
        } else if (!cached && (cartCountRef.current ?? 0) > 0) {
          // no cached cart but we have items -> fetch once
          fetchCartLatest();
        }
      } catch { /* ignore */ }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist to localStorage whenever cartCount changes in this tab (existing)
    useEffect(() => {
      try {
        const next = String(Number.isFinite(cartCount) ? cartCount : 0);
        // avoid redundant writes
        if (localStorage.getItem(CART_COUNT_KEY) !== next) {
          localStorage.setItem(CART_COUNT_KEY, next);
        }
      } catch { /* ignore quota */ }
    }, [cartCount]);

    // ADD: whenever cartCount changes, refresh latest cart (covers add/remove/order)
    useEffect(() => {
      fetchCartLatest();
    }, [cartCount, fetchCartLatest]);

    // ADD: persist cartData on change (avoid redundant writes)
    useEffect(() => {
      if (cartData !== undefined) {
        persistCartData(cartData);
      }
    }, [cartData]);

    // Listen to other tabs' updates
    useEffect(() => {
      const onStorage = (e) => {
        if (e.key === CART_COUNT_KEY) {
          const next = parseInt(e.newValue || '0', 10);
          if (!Number.isNaN(next) && next !== cartCountRef.current) {
            updateCartCount(next);
          }
        }
        if (e.key === CART_DATA_KEY) {
          const nextCart = e.newValue ? safeParse(e.newValue) : null;
          if (!isSameCartObj(nextCart, cartDataRef.current)) {
            setCartData(nextCart);
          }
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }, [updateCartCount]);

const handleCategoryClick = useCallback((categorySlug, categoryName) => {
        const path = `/category/${categorySlug}`;
        setSelectedCategory(categoryName);
        setIsMobileMenuOpen(false);
        router.push(path);
    }, [router]);
    const dropdownRef = useRef(null);
    const [activeTab, setActiveTab] = useState('login');
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    // const [userData, setUserData] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);
    const { userData, isLoggedIn, setIsLoggedIn, setUserData, isAdmin, setIsAdmin } = useHeaderdetails();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All Category");
    const [searchQuery, setSearchQuery] = useState("");
    const [placeholder, setPlaceholder] = useState("Search for");
    const [typedPreview, setTypedPreview] = useState("");
    const [words, setWords] = useState([]);
    const [categorieslist, setCategorieslist] = useState([]);
    const wordIndex = useRef(0);
    const charIndex = useRef(0);
    const isDeleting = useRef(false);
    const getSortedProducts = () => {
    const sortedProducts = [...products];
    switch(sortOption) {
      case 'price-low-high':
          return sortedProducts.sort((a, b) => (a.special_price ?? a.price) - (b.special_price ?? b.price));
      case 'price-high-low':
          return sortedProducts.sort((a, b) => (b.special_price ?? b.price) - (a.special_price ?? a.price));
      case 'name-a-z':
          return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-z-a':
          return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      default:
          return sortedProducts;
      }
    };

    const [openMenu, setOpenMenu] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);

    const [categoriesMenu, setCategoriesMenu] = useState([]);

  useEffect(() => {
    fetch("/api/categories/menu")
      .then(res => res.json())
      .then(data => setCategoriesMenu(data));
  }, []);

  const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

    // --- Add cache helpers after your state declarations (place near other consts) ---
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const loadCache = (key) => {
      // returns null if not found or parse error
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || !obj.ts || !obj.data) return null;
        return obj;
      } catch (e) {
        console.warn('Cache parse error for', key, e);
        return null;
      }
    };
    const saveCache = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {
        // ignore storage errors (quota)
        console.warn('Cache save failed for', key, e);
      }
    };

    useEffect(() => {
  function handleClickOutside(event) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  }

  if (dropdownOpen) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [dropdownOpen]);

    // ADD: robust extractors + fallback words
    const extractCategoryArray = (payload) => {
      try {
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.data)) return payload.data;
        if (payload && Array.isArray(payload.categories)) return payload.categories;
      } catch {}
      return [];
    };
    const ensureWordsNotEmpty = (names) => {
      const cleaned = (names || []).filter(Boolean);
      if (cleaned.length > 0) return cleaned;
      return ['Mobiles', 'Laptops', 'Television', 'Air Conditioner', 'Refrigerator'];
    };

    useEffect(() => {
      const key = 'categories_raw_cache';
      let mounted = true;

      const useCachedOrFetch = async () => {
        // try cache first
        try {
          const cached = loadCache(key);
          if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            if (!mounted) return;
            const data = cached.data;
            // CHANGED: extract array safely + fallback
            const arr = extractCategoryArray(data);
            setCategorieslist(arr);
            setWords(ensureWordsNotEmpty(arr.map((cat) => cat.category_name)));
            return;
          }
        } catch (err) {
          console.warn('Error reading categories cache', err);
        }

        // fallback to fetch and then cache
        try {
          const response = await fetch("/api/categories/get");
          const raw = await response.json();
          if (!mounted) return;
          // CHANGED: extract array safely + fallback
          const arr = extractCategoryArray(raw);
          setCategorieslist(arr);
          setWords(ensureWordsNotEmpty(arr.map((cat) => cat.category_name)));
          saveCache(key, raw);
        } catch (error) {
          console.error("Error fetching categories:", error);
          // Fallback words if fetch fails
          if (mounted) setWords(ensureWordsNotEmpty([]));
        }
      };

      useCachedOrFetch();
      return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const rawKey = 'categories_raw_cache';
        const nestedKey = 'categories_nested_cache';
        let mounted = true;

        const buildNestedAndCache = (rawData) => {
        // Keep only active categories
          const activeCategories = Array.isArray(rawData) ? rawData.filter(cat => cat.status === "Active") : [];

          const categoryMap = {};
          activeCategories.forEach((cat) => {
            // ensure subcategories array exists
            categoryMap[cat._id] = { ...cat, subcategories: [] };
          });

          const nestedCategories = [];
          activeCategories.forEach((cat) => {
            if (cat.parentid === "none") {
              // use the mapped object to ensure same reference
              nestedCategories.push(categoryMap[cat._id]);
            } else if (categoryMap[cat.parentid]) {
              categoryMap[cat.parentid].subcategories.push(categoryMap[cat._id]);
            }
          });

          // cache nested structure
          saveCache(nestedKey, nestedCategories);
          return nestedCategories;
        };

        const setupCategories = async () => {
          try {
            // Try nested cache first
            const nestedCached = loadCache(nestedKey);
            if (nestedCached && (Date.now() - nestedCached.ts) < CACHE_TTL_MS) {
              if (!mounted) return;
              setCategories(nestedCached.data);
            } else {
              // Get raw data from cache or fetch
              let raw = null;
              const rawCached = loadCache(rawKey);
              if (rawCached && (Date.now() - rawCached.ts) < CACHE_TTL_MS) {
                raw = rawCached.data;
              } else {
                const res = await fetch("/api/categories/get");
                raw = await res.json();
                saveCache(rawKey, raw);
              }

              if (!mounted) return;
              const nested = buildNestedAndCache(raw);
              setCategories(nested);
            }
          } catch (err) {
            console.error("Failed to fetch or build categories:", err);
            // fallback: ensure auth check still runs
          }
          // always check auth status after categories settled
          try { checkAuthStatus(); } catch (e) { /* ignore */ }
        };

      setupCategories();
      return () => { mounted = false; };
      }, []);

    useEffect(() => {
      // CHANGED: add cancellation to avoid orphaned timers
      let cancelled = false;

      const typeEffect = () => {
        if (cancelled || words.length === 0) return;

        const currentWord = words[wordIndex.current] || '';
        const updatedText = isDeleting.current
          ? currentWord.substring(0, Math.max(0, charIndex.current - 1))
          : currentWord.substring(0, Math.min(currentWord.length, charIndex.current + 1));

        // Count words in updatedText
        const wordCount = updatedText.trim().split(/\s+/).filter(Boolean).length;

        if (wordCount <= 2) {
          setTypedPreview(updatedText || "");
        }

        charIndex.current = isDeleting.current
          ? Math.max(0, charIndex.current - 1)
          : Math.min(currentWord.length, charIndex.current + 1);

        let delay = isDeleting.current ? 60 : 100;

        if (!isDeleting.current && charIndex.current === currentWord.length) {
          isDeleting.current = true;
          delay = 1000; // pause before deleting
        } else if (isDeleting.current && charIndex.current === 0) {
          isDeleting.current = false;
          wordIndex.current = (wordIndex.current + 1) % words.length;
          delay = 1000; // pause before typing next
        }

        setTimeout(() => {
          if (!cancelled) typeEffect();
        }, delay);
      };


      typeEffect();
      return () => { cancelled = true; };
    }, [words]);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const { headerdetails, updateHeaderdetails } = useHeaderdetails();

    const [offers, setOffers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [sortOption, setSortOption] = useState('');
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [dropdownTop, setDropdownTop] = useState(0);
    const [dropdownCenterX, setDropdownCenterX] = useState(null);
    const [dropdownUseTranslate, setDropdownUseTranslate] = useState(false);
    const slideRefs = useRef({});
    const [suggestions, setSuggestions] = useState([]);
    // refs & state for search dropdown positioning
    const searchInputRef = useRef(null);
    // ADD missing state
    const [searchContext, setSearchContext] = useState(null);
    const debounceRef = useRef(null);
    const searchDropdownRef = useRef(null);
    const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
    const [searchDropdownLeft, setSearchDropdownLeft] = useState(0);
    const [searchDropdownTop, setSearchDropdownTop] = useState(0);
    const [searchDropdownWidth, setSearchDropdownWidth] = useState(0);
    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    // Track step
    const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter OTP and new password
    const [resetStep, setResetStep] = useState(1);// 1: enter email, 2: enter OTP, 3: new password
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    // OTP input
    const [forgotOTP, setForgotOTP] = useState('');

    // New password inputs
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Close mobile menu when clicking outside

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setDropdownOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/auth/check', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsLoggedIn(true);
                if (data.role == "admin") {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                setUserData(data.user);
            } else {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
        }
    };
    const handleSearch = () => {

      if (!searchQuery.trim() && selectedCategory === "All Category") return;

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
        if (selectedCategory !== "All Category") {
          params.append("category", selectedCategory);
        }
        router.push(`/search?${params.toString()}`);
    };
    const handleSearchBtnClick = () => {
        if (!searchQuery.trim() && selectedCategory === "All Category") return;
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append("query", searchQuery.trim());
        if (selectedCategory !== "All Category") {
          params.append("category", selectedCategory);
        }
        router.push(`/search?${params.toString()}`);
    };

    // Memoized sorted products using existing getSortedProducts flow
    const sortedProducts = useMemo(() => getSortedProducts(), [products, sortOption]);

    // ADD: clearSearch helper for new mobile search design (from reference mobile view)
    const clearSearch = useCallback(() => {
      setSearchQuery('');
      setSuggestions([]);
      setTypedPreview('');
      setSearchDropdownVisible(false);
      if (searchInputRef.current) searchInputRef.current.blur();
    }, []);

    // helper to fetch suggestions (safe JSON handling) - now uses local products for instant results
    const fetchSuggestions = useCallback(async (q) => {
      if (!q || q.trim().length < 1) {
        setSuggestions([]);
        return;
      }

      // Use local products (sorted) for instant client-side suggestions
      try {
        if (Array.isArray(sortedProducts) && sortedProducts.length > 0) {
          const ql = q.toLowerCase();
          const filtered = sortedProducts.filter(p => {
            const name = (p.name || '').toLowerCase();
            const code = (p.item_code || '').toLowerCase();
            const brand = ((p.brand_name || p.brand || '') + '').toLowerCase();
            return name.includes(ql) || code.includes(ql) || brand.includes(ql);
          }).slice(0, 12);

          setSuggestions(filtered);
          setSearchDropdownVisible(true);

          if (searchInputRef.current) {
            const rect = searchInputRef.current.getBoundingClientRect();
            setSearchDropdownLeft(rect.left);
            setSearchDropdownTop(rect.bottom + window.scrollY);
            setSearchDropdownWidth(rect.width);
          }
          return;
        }
      } catch (err) {
        console.error('Local filter error', err);
      }

      // Fallback: server-side suggestions
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const text = await res.text();
        if (!text) { setSuggestions([]); return; }
        let data;
        try { data = JSON.parse(text); } catch { setSuggestions([]); return; }
        const items = Array.isArray(data) ? data : (data?.results || []);
        setSuggestions(items.slice(0, 12));
        setSearchDropdownVisible(true);

        if (searchInputRef.current) {
          const rect = searchInputRef.current.getBoundingClientRect();
          setSearchDropdownLeft(rect.left);
          setSearchDropdownTop(rect.bottom + window.scrollY);
          setSearchDropdownWidth(rect.width);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      }
    }, [sortedProducts]);
  
    // Debounced effect: call fetchSuggestions while typing
    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = searchQuery.trim();
      if (!q) {
        setSuggestions([]);
        setSearchDropdownVisible(false);
        return;
      }

      // Ensure dropdown becomes visible as soon as user types (even for one char)
      setSearchDropdownVisible(true);

      // Immediate fetch for the first character, otherwise debounce for performance
      if (q.length === 1) {
        fetchSuggestions(q);
        return;
      }

      debounceRef.current = setTimeout(() => fetchSuggestions(q), 200);
      return () => clearTimeout(debounceRef.current);
    }, [searchQuery, fetchSuggestions]);
  
    // Close search dropdown when clicking outside input or dropdown
    useEffect(() => {
      const handler = (e) => {
        const target = e.target;
        if (
          searchDropdownVisible &&
          searchInputRef.current &&
          searchDropdownRef.current &&
          !searchInputRef.current.contains(target) &&
          !searchDropdownRef.current.contains(target)
        ) {
          setSearchDropdownVisible(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [searchDropdownVisible]);
    // Modify the search button to use the handler
    // Also make the search work when pressing Enter in the input field
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: ''
    });
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [formError, setFormError] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({
      login: { email: "", password: "" },
      register: { name: "", email: "", mobile: "", password: "" },
    });

    // ADD: define missing auth states to avoid ReferenceError
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({ name: "", email: "", mobile: "", password: "" });

    const handleAuthSubmit = async (e) => {
      e.preventDefault();
      setLoadingAuth(false);

      // SAFE CHECKS: prevent "ReferenceError: loginData is not defined"
      if (activeTab === "login" && !(typeof loginData !== "undefined" && loginData)) {
        setFormError("Login form is not ready. Please try again.");
        return;
      }
      if (activeTab === "register" && !(typeof registerData !== "undefined" && registerData)) {
        setFormError("Register form is not ready. Please try again.");
        return;
      }

      // pick correct state depending on tab
      const currentData = activeTab === "login" ? loginData : registerData;

      // reset errors for current tab only
      setErrors((prev) => ({
        ...prev,
        [activeTab]: { name: "", email: "", mobile: "", password: "" },
      }));

      let newErrors = {};

      // ---------- REGISTER VALIDATION ----------
      if (activeTab === "register") {
        if (!currentData.name) newErrors.name = "Name must be filled";

        if (!currentData.mobile) {
          newErrors.mobile = "Mobile must be filled";
        } else if (!isValidMobile(currentData.mobile)) {
          newErrors.mobile = "Enter a valid mobile number";
        }
      }

      // ---------- COMMON (LOGIN + REGISTER) ----------
      if (!currentData.email) {
        newErrors.email = "Email must be filled";
      } else if (!isValidEmail(currentData.email)) {
        newErrors.email = "Enter a valid email";
      }

      if (currentData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      // If errors exist, update state and stop
      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], ...newErrors },
        }));
        return;
      }


      // ---------- API CALL ----------
      if (
        (activeTab === "login" &&
          currentData.email &&
          currentData.password.length >= 6) ||
        (activeTab === "register" &&
          currentData.name &&
          currentData.email &&
          currentData.mobile &&
          currentData.password.length >= 6)
      ) {
        try {
          setLoadingAuth(true);
          setFormError("");
          setError("");
          const guestId = localStorage.getItem("guestCartId");
          const endpoint =
            activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...currentData, guestId }), 
          });

          const data = await response.json();

          if (!response.ok) {
            setError(
              <span className="text-red-500">
                {data.message || "Password Mismatch"}
              </span>
            );
            return;
          }

          if (data.token) {
            localStorage.setItem("token", data.token);
            setIsLoggedIn(true);
            setIsAdmin(data.user.role === "admin");
            setUserData(data.user);
            setShowAuthModal(false);

            // reset states
            setLoginData({ email: "", password: "" });
            setRegisterData({ name: "", email: "", mobile: "", password: "" });

            // update cart
            const cartResponse = await fetch("/api/cart/count", {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (cartResponse.ok) {
              const cartDataCount = await cartResponse.json();
              // CHANGE: broadcast count to all tabs
              setCartCountSynced(cartDataCount.count);
            }

            // ADD: fetch and broadcast latest cartData after login/merge
            try { await fetchCartLatest(); } catch {}

            // ðŸ‘‡ Optional: clear guestId after merge
            localStorage.removeItem("guestCartId");
            location.reload();
          } else {
            setShowAuthModal(true);
            setActiveTab("login");
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoadingAuth(false);
        }
      } else {
        return;
      }
    };
    useEffect(() => {
        setHasMounted(true);
    }, []);
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserData(null);
        // CHANGE: broadcast clear to all tabs
        setCartCountSynced(0);
        // ADD: clear cartData everywhere
        try { localStorage.removeItem(CART_DATA_KEY); } catch {}
        setCartData(null);
        location.reload();
    };
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const response = await fetch("/api/offers/get");
                const result = await response.json();

                // Process and format dates before setting state
                const activeOffers = result.data
                    .filter((offer) => offer.fest_offer_status === "active")
                setOffers(activeOffers);
            } catch (err) {
                console.error("Failed to fetch offers", err);
            }
        };
        fetchOffers();
    }, []);
    const hideTimeout = useRef(null);
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories/get");
                const data = await response.json();

                // Keep only active categories
                const activeCategories = data.filter(cat => cat.status === "Active");

                const categoryMap = {};
                activeCategories.forEach((cat) => {
                    cat.subcategories = [];
                    categoryMap[cat._id] = cat;
                });

                const nestedCategories = [];
                activeCategories.forEach((cat) => {
                    if (cat.parentid === "none") {
                        nestedCategories.push(cat);
                    } else if (categoryMap[cat.parentid]) {
                        categoryMap[cat.parentid].subcategories.push(cat);
                    }
                });

                setCategories(nestedCategories);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };

        fetchCategories();
        checkAuthStatus();
    }, []);
    const flattenTree = (cat, rootCategory, level = 0) => {
        let result = [];
        
        // Add the category itself
        result.push({ ...cat, rootCategory, level, type: 'category' });

        // Add subcategories
        if (cat.subcategories?.length > 0) {
            cat.subcategories.forEach(child => {
                result = result.concat(flattenTree(child, rootCategory, level + 1));
            });
        }
        
        return result;
    };

    useEffect(() => {
  if (openMenu) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}, [openMenu]);

    // Flatten all starting from actual visible categories (like Refrigerator, ACâ€¦)
    const flattenAllCategories = (cats) => {
        let result = [];
        let brandCounter = 0; // Counter for unique keys

        // Use a Map to dedupe brands by a normalized key (slug/name/id)
        const brandMap = new Map();

        const normalizeKey = (s) => {
            if (!s && s !== 0) return '';
            return String(s).toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9]/g, '');
        };

        cats.forEach(cat => {
            // Add the category and its subcategories
            result = result.concat(flattenTree(cat, cat.category_slug, 0));

            // Collect brands for this category and add to map if unique
            if (Array.isArray(cat.brands) && cat.brands.length > 0) {
                cat.brands.forEach(brand => {
                    // try multiple fields for a stable identifier
                    const candidate = brand.brand_slug || brand.slug || brand.brand_name || brand.name || brand._id || '';
                    const key = normalizeKey(candidate);
                    if (!key) return; // skip invalid

                    if (!brandMap.has(key)) {
                        // store first occurrence and include a stable uniqueKey
                        brandMap.set(key, {
                            ...brand,
                            type: 'brand',
                            sourceCategory: cat.category_name,
                            uniqueKey: `${brand._id || key}-${brandCounter++}`
                        });
                    } else {
                        // already present: optionally we could merge sourceCategory info
                        const existing = brandMap.get(key);
                        if (existing && existing.sourceCategory !== cat.category_name) {
                            existing.sourceCategory = existing.sourceCategory + ", " + cat.category_name;
                        }
                    }
                });
            }
        });

        const allBrands = Array
          .from(brandMap.values())
          // ADDED: alphabetical sort (case-insensitive) for brand listing
          .sort((a, b) =>
            (a.brand_name || '').localeCompare(b.brand_name || '', undefined, { sensitivity: 'base' })
          );

        // Add a single brands header at the end
        if (allBrands.length > 0) { 
            result.push({
                _id: 'all-brands-header',
                type: 'brands-header',
                category_name: 'Brands',
                level: 0,
                uniqueKey: 'all-brands-header'
            });

            result = result.concat(allBrands.map(brand => ({
                ...brand,
                level: 1,
                uniqueKey: brand.uniqueKey
            })));
        }

        return result;
    };
    const chunkFlatList = (flatList, size = 11) => {
        const chunks = [];
        if (!Array.isArray(flatList) || flatList.length === 0) return chunks;

        for (let i = 0; i < flatList.length; i += size) {
            chunks.push(flatList.slice(i, i + size));
        }

        return chunks;
    };
    const cancelHide = () => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }
    };
    const startHide = (delay = 100) => {
        cancelHide();
        hideTimeout.current = setTimeout(() => {
            setHoveredCategory(null);
        }, delay);
    };
    const handleMouseEnter = (categoryId) => {
        cancelHide();
        const cat = categories.find((c) => c._id === categoryId);
        if (!cat) return;
        setHoveredCategory(cat);

        const el = slideRefs.current[categoryId];
        if (!el) return;

        const rect = el.getBoundingClientRect();
        // Using fixed positioning => use viewport coords (rect.left / rect.bottom)
        setDropdownLeft(rect.left);
        setDropdownTop(rect.bottom);
        setDropdownCenterX(rect.left + rect.width / 2);
    };
    // After dropdown mounts, measure and adjust so it never overflows screen or hides under arrows
    useLayoutEffect(() => {
        if (!hoveredCategory || !dropdownRef.current) return;
        const ddRect = dropdownRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        let left = dropdownLeft;

        // Center dropdown based on parent center when available
        if (dropdownCenterX != null && ddRect.width) {
            left = dropdownCenterX - ddRect.width / 2;
            // Clamp to viewport
            if (left < 8) left = 8;
            if (left + ddRect.width > screenWidth - 10) left = Math.max(10, screenWidth - ddRect.width - 10);
        } else {
            // If dropdown would overflow right edge, shift it left
            if (left + ddRect.width > screenWidth - 10) {
                left = Math.max(10, screenWidth - ddRect.width - 10);
            }
        }

        // Ensure dropdown is at least after prev arrow
        const prevBtn = document.querySelector(".custom-swiper-prev");
        const prevRight = prevBtn?.getBoundingClientRect().right || 0;
        if (left < prevRight + 8) left = prevRight + 8;

        // Ensure dropdown doesn't go too far left
        if (left < 8) left = 8;

        // Only update if it actually changes (prevents render thrash)
        if (Math.round(left) !== Math.round(dropdownLeft)) setDropdownLeft(left);
        // include dropdownLeft so we compare against current value
    }, [hoveredCategory, dropdownCenterX, dropdownLeft]);
    // cleanup hide timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, []);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    // Add this function to handle forgot password submission
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordError('');
        setForgotPasswordMessage('');
        setForgotPasswordLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotPasswordEmail }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset link');
            }
            setForgotPasswordMessage(data.message || 'Password reset link sent to your email');
        } catch (err) {
            setForgotPasswordError(err.message);
        } finally {
            setForgotPasswordLoading(false);
        }
    };
    // Render flattened category/brand item
    const renderFlatItem = (item, hoveredCategory) => {
        const itemKey = item.uniqueKey || item._id;
        const paddingLeft = `${(item.level || 0) * 12}px`;
        let content = null;
        if (item.type === "brands-header") {
          content = (
              <h3 className="flex items-center justify-between mb-1 text-sm font-semibold text-red-600 ml-1">
                  {item.category_name}
              </h3>
          );
        }else if (item.type === "brand") {
          const href = `/category/brand/${encodeURIComponent(hoveredCategory.category_slug)}/${encodeURIComponent(item.brand_slug)}`;
              

          content = (
            <Link
              href={href}
              className="flex items-center mb-1 text-sm text-[#8c8c8c] p-[5px] hover:text-[#0e54e6]"
            >
              <span className="font-normal">{item.brand_name}</span>
            </Link>
          );
        }else {
          const href =
            item.level === 0
              ? `/category/${encodeURIComponent(hoveredCategory?.category_slug || "")}/${encodeURIComponent(item.category_slug || "")}`
              : `/category/${encodeURIComponent(hoveredCategory?.category_slug || "")}/${encodeURIComponent(item.rootCategory || "")}/${encodeURIComponent(item.category_slug || "")}`;
            content = (
              <Link
                href={href}
                className={`flex items-center justify-between mb-1 text-sm ${
                  item.level === 0
                    ? "font-semibold text-red-600"
                    : "text-[#8c8c8c] !p-[5px] hover:text-[#0e54e6]"
                }`}
              >
                <span className={item.level === 0 ? "font-bold" : "font-normal"}>
                  {item.category_name}
                </span>
                {item.level === 0 && (
                  <Play
                    size={14}
                    strokeWidth={0}
                    className="text-red-600 fill-red-600"
                  />
                )}
              </Link>
            );
        }
        return (
          <div key={itemKey} style={{ paddingLeft }}>
            {content}
          </div>
        );
    };

    // Price formatter
    const formatPrice = (value) => {
      if (value === undefined || value === null || value === '') return '';
      const num = Number(value);
      if (Number.isNaN(num)) return '';
      return 'â‚¹' + num.toLocaleString('en-IN');
    };
    // FIX: renderSuggestionItem slug bug
    const renderSuggestionItem = useCallback((item, idx) => {
      const id = item._id || item.id || idx;
      const slug = item.slug || item._id || item.id || ''; // added slug definition
      const price = item.special_price ?? item.price;
      const imageSrc = item.image || (Array.isArray(item.images) && item.images.length > 0 ? `/uploads/products/${item.images[0]}` : null);
      return (
        <Link
          key={id}
          href={`/product/${encodeURIComponent(slug)}`}
          onClick={() => setSearchDropdownVisible(false)}
          className="group block mb-2 last:mb-0 rounded-lg bg-[#ffe9e9] hover:bg-white border border-transparent hover:border-red-300 shadow-sm hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/40"
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={imageSrc || 'Product'}
                  className="object-contain w-full h-full"
                  loading="lazy"
                />
              ) : (
                <span className="text-[10px] text-gray-400">NO IMG</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2 uppercase group-hover:text-red-700">
                {item.name || 'Unnamed'}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {price !== undefined && price !== null && (
                  <span className="text-[12px] font-medium text-gray-700 group-hover:text-red-700">
                    {formatPrice(price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      );
    }, [setSearchDropdownVisible]);

    // ADD state (place with other useState declarations)
    const [activeSuggestion, setActiveSuggestion] = useState(-1);

    // RESET active suggestion when list changes or dropdown closes
    useEffect(() => {
      if (!searchDropdownVisible) setActiveSuggestion(-1);
      else setActiveSuggestion(-1);
    }, [suggestions, searchDropdownVisible]);

    // SELECT helper
    const selectSuggestion = useCallback((index) => {
      if (index < 0 || index >= suggestions.length) return;
      const item = suggestions[index];
      const slug = item.slug || item._id || item.id;
      if (!slug) return;
      setSearchDropdownVisible(false);
      router.push(`/product/${encodeURIComponent(slug)}`);
    }, [suggestions, router]);

    // DESKTOP key handling (keep existing handleKeyPress for mobile inputs)
    const handleDesktopKeyDown = (e) => {
      if (!suggestions.length) {
        if (e.key === 'Enter') handleSearch();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(p => (p + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(p => (p - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        if (activeSuggestion >= 0) {
          e.preventDefault();
          selectSuggestion(activeSuggestion);
        } else {
          handleSearch();
        }
      } else if (e.key === 'Escape') {
        setSearchDropdownVisible(false);
      }
    };

    // DESKTOP specific renderer (keep existing renderSuggestionItem for mobile contexts)
    function renderDesktopSuggestionItem(item, idx) {
      const id = item._id || item.id || idx;
      const price = item.special_price ?? item.price;
      const isActive = idx === activeSuggestion;
      const imageSrc =
        item.image ||
        (Array.isArray(item.images) && item.images.length > 0
          ? `/uploads/products/${item.images[0]}`
          : null);

      return (
        <div
          key={id}
          role="option"
          aria-selected={isActive}
          onMouseEnter={() => setActiveSuggestion(idx)}
          onMouseDown={() => selectSuggestion(idx)}
          className={`flex gap-4 px-4 py-3 cursor-pointer rounded-md transition-colors group bg-[#f2f2f2]`}
        >
          <div className="w-[50px] h-[50px] rounded-md overflow-hidden bg-white flex items-center justify-center border border-gray-200 shrink-0">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={item.name || 'Product'}
                className="object-contain w-full h-full"
                loading="lazy"
              />
            ) : (
              <span className="text-[10px] text-gray-400">NO IMG</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[14px] font-medium leading-snug line-clamp-2 ${
                isActive ? 'text-red-700' : 'text-gray-800 group-hover:text-gray-900'
              }`}
            >
              {item.name || 'Unnamed'}
            </div>
            {price && (
              <div className="text-[14px] font-semibold text-red-600 mt-1">
               ₹ {price.toLocaleString('en-IN')}
              </div>
            )}
          
          </div>
        </div>
      );
    };
    // ADD: mobile accordion open-state + helpers
    // FIX: replace wrong useState with real loader function + tracking map
    const [loadedCategoryIds, setLoadedCategoryIds] = useState({});
    const [openCategories, setOpenCategories] = useState({});

    // NEW: unified nodes for mobile = categories + hoveredCategory.subcategories
    const nodes = useMemo(() => {
      const base = Array.isArray(categories) ? categories : [];
      const extra = (hoveredCategory && Array.isArray(hoveredCategory.subcategories))
        ? hoveredCategory.subcategories
        : [];

      if (!extra.length) return base;

      const map = new Map();
      base.forEach(n => { if (n && n._id) map.set(n._id, n); });
      extra.forEach(n => { if (n && n._id && !map.has(n._id)) map.set(n._id, n); });
      return Array.from(map.values());
    }, [categories, hoveredCategory]);

    // Ensures the subcategories for a category are present by rebuilding from cache/API if needed
    const ensureSubcategories = useCallback(async (categoryId) => {
      if (!categoryId) return;

      // already ensured this id in this session
      if (loadedCategoryIds[categoryId]) return;

      // find node in current nested tree
      const findNodeById = (list, id) => {
        for (const n of list || []) {
          if (n?._id === id) return n;
          const hit = findNodeById(n?.subcategories || [], id);
          if (hit) return hit;
        }
        return null;
      };

      const node = findNodeById(categories, categoryId);
      if (node && Array.isArray(node.subcategories) && node.subcategories.length > 0) {
        setLoadedCategoryIds((m) => ({ ...m, [categoryId]: true }));
        return;
      }

      try {
        // use raw cache if available, otherwise fetch
        let raw = loadCache('categories_raw_cache')?.data;
        if (!Array.isArray(raw) || raw.length === 0) {
          const res = await fetch('/api/categories/get');
          raw = await res.json();
          saveCache('categories_raw_cache', raw);
        }

        // rebuild nested tree
        const active = Array.isArray(raw) ? raw.filter((c) => c.status === 'Active') : [];
        const map = {};
        active.forEach((c) => { map[c._id] = { ...c, subcategories: [] }; });
        active.forEach((c) => {
          if (c.parentid && map[c.parentid]) map[c.parentid].subcategories.push(map[c._id]);
        });

        const nested = [];
        active.forEach((c) => {
          if (c.parentid === 'none' || !map[c.parentid]) nested.push(map[c._id]);
        });

        setCategories(nested);
        saveCache('categories_nested_cache', nested);
      } catch (e) {
        console.error('ensureSubcategories failed:', e);
      } finally {
        setLoadedCategoryIds((m) => ({ ...m, [categoryId]: true }));
      }
    }, [categories, loadedCategoryIds]);

    const toggleMobileCategory = useCallback(async (id) => {
      await ensureSubcategories(id);
      setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
    }, [ensureSubcategories]);

    // Add missing slug helpers used by renderCategoryLevel
    const safeSlugify = (s, fallback = "") => {
      const base = (s || "").toString().trim();
      if (!base) return fallback;
      return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    };
    const getCategorySlug = (cat) =>cat?.category_slug || cat?.slug || safeSlugify(cat?.category_name, cat?._id || "category");
    // NEW: compute href for node based on level (parent/child)
    const getNodeHref = (ancestorSlugs = [], nodeSlug) => {
      // Join all ancestors + current node
      const fullPath = [...ancestorSlugs, nodeSlug]
        .map((slug) => encodeURIComponent(slug))
        .join("/");

      return `/category/${fullPath}`;
    };
    // NEW: recursive renderer for unlimited category levels
    function renderCategoryLevel(nodes, ancestorSlugs = [], level = 0) {
      if (!Array.isArray(nodes) || nodes.length === 0) return null;
      return (
        <div className="divide-y divide-gray-100">
         {nodes
  .slice() // make a shallow copy to avoid mutating original
  .sort((a, b) => {
    const nameA = (a.category_name || "").toLowerCase();
    const nameB = (b.category_name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  })
  .map((node) => {
    const hasChildren =
      Array.isArray(node.subcategories) && node.subcategories.length > 0;
    const isOpen = !!openCategories[node._id];
    const nodeSlug = getCategorySlug(node);
    const slugs = [...ancestorSlugs, nodeSlug];
    const href = getNodeHref(ancestorSlugs, nodeSlug, level);
    const rowJustify = hasChildren ? "justify-between" : "justify-start";
    
    return (
      <div
        key={node._id}
        className={`${isOpen ? "bg-red-50/40" : "bg-white"} hover:bg-[#f2f2f2]`}
      >
        <div
          className={`w-full flex items-center ${rowJustify} ${
            level === 0 ? "px-3 py-3 text-sm" : "pl-5 pr-3 py-2 text-[13px]"
          } ${isOpen ? "text-red-700 bg-[#f2f2f2]" : "text-gray-800 hover:bg-[#f2f2f2]"}`}
        >
          <Link
            href={href}
            onClick={async (e) => {
              if (level === 0 || hasChildren) {
                e.preventDefault();
                e.stopPropagation();
                await ensureSubcategories(node._id);
                setOpenCategories((prev) => {
                  const next = { ...prev };
                  const willOpen = !prev[node._id];
                  if (level === 0) {
                    Object.keys(next).forEach((k) => delete next[k]);
                    if (willOpen) next[node._id] = true;
                    return next;
                  }
                  next[node._id] = willOpen;
                  return next;
                });
                setIsMobileMenuOpen(true);
                return;
              }
              setIsMobileMenuOpen(false);
            }}
            className="flex-1 text-left truncate"
            style={{ paddingLeft: level > 0 ? Math.min(level * 8, 24) : 0 }}
          >
            {node.category_name || "Category"}
          </Link>

          {hasChildren && (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await ensureSubcategories(node._id);
                setOpenCategories((prev) => {
                  const next = { ...prev };
                  const willOpen = !prev[node._id];
                  if (level === 0) {
                    Object.keys(next).forEach((k) => delete next[k]);
                    if (willOpen) next[node._id] = true;
                    return next;
                  }
                  next[node._id] = willOpen;
                  return next;
                });
              }}
              aria-label="Toggle"
              className="ml-2"
            >
              <FiChevronRight
                className={`text-white rounded-full p-1 transition-transform duration-200 bg-[#2453D3] ${
                  isOpen ? "rotate-90" : "rotate-0"
                }`}
                size={18}
              />
            </button>
          )}
        </div>

        {isOpen && hasChildren && (
          <div className="pb-2">
            {renderCategoryLevel(node.subcategories, slugs, level + 1)}
          </div>
        )}
      </div>
    );
  })}

        </div>
      );
    }
    useEffect(() => {
      if (!isMobileMenuOpen) return;
      const ids = (Array.isArray(categories) ? categories : []).slice(0, 5).map(c => c._id);
      ids.forEach((id) => { ensureSubcategories(id); });
    }, [isMobileMenuOpen, categories, ensureSubcategories]);



  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="bg-linear-to-r w-full from-linearyellow from-0% via-white via-50% to-linearyellow to-100%">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/">
            <Image
              src="/assets/images/sm-logo.png"
              alt="Sathya Mobiles"
              width={80}
              height={40}
              priority
            />
            </Link>
          </div>

          {/* Search (Desktop) */}
          <div className="flex-1 hidden lg:flex max-w-2xl">
            <div className="relative w-full mx-auto">
             
              <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          setSearchContext("desktop");
                          if (searchQuery.trim().length >= 1) fetchSuggestions(searchQuery);
                          setSearchDropdownVisible(true);
                        }}
                        className="w-full pl-5 pr-12 py-2 rounded-full border-2 bg-white text-gray font-bold border-gray-400/80 outline-none"
                        placeholder="Search for products..."
                      />

              
              {/* Search Icon */}
                                    <button onClick={handleSearchBtnClick} className="text-red-600 ">
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600">
                <i className="fi fi-br-search flex font-bold text-primary"></i>
              </span>
                                    </button>
            </div>
          </div>

          {/* Deal Badge */}
          {/*
          <div className="deals">
            <a
              href="#"
              className="hidden md:inline-block px-1 text-white text-md font-bold"
            >
              Republic Day Deals
            </a>
          </div>
*/}
          {/* Right Actions */}
          <div className="flex items-center gap-4 shrink-0">

            {/* Store Locator */}
            <div className="max-sm:hidden flex items-center gap-1 text-sm px-1.5 py-0.5 border-2 border-primary rounded-2xl">
              <Link href="/all-stores" className="flex">
              <i className="fi fi-rr-marker flex text-primary text-xl"></i>
              <span className="w-min text-center text-[0.7rem] leading-none font-bold text-primary">
                Store Locator
              </span>
              </Link>
            </div>

            {/* Account */}
            <div className="max-sm:hidden flex items-center gap-1 text-sm px-1.5 py-0.5 border-2 border-primary rounded-2xl">

                    {isLoggedIn ? (
                              <>
                                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-black ">
                                  <FiUser size={18} className="text-red-600" />
                                  <span className="w-min text-center text-[0.7rem] leading-none font-bold text-primary">
                                      Hi, 
                                      {userData?.name?.length > 8 ? userData?.name.slice(0, 8) + "..." : userData?.name || (userData?.username?.length > 13 ? userData?.username.slice(0, 8) + "..." : userData?.username || "User")} 
                                  </span>
                                </button>
      
                                {dropdownOpen && (
                                  <div className="absolute right-0 mt-10 w-48 bg-white rounded-xl shadow-xl z-50 py-2 px-2" style={{
                                        top: `40px`,
                                        right: `5%`,
                                        width: `20%`,
                                        maxHeight: '220px'
                                      }}>
                                      {isAdmin && (
                                        <>
                                          <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                              <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-600 text-white">
                                                  <FaUserShield className="w-3 h-3 sm:w-4 sm:h-4" />
                                              </span>
                                              Admin Panel
                                          </Link>
                                        </>
                                      )}
                                    <Link href="/order" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                      <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-600 text-white">
                                        <FaShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </span>My Orders
                                    </Link>
                                    <hr className="my-2 border-gray-200" />
                                    <button onClick={handleLogout} className="flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                        <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-600 text-white">
                                            <IoLogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </span>Logout
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <button
                            onClick={() => setShowAuthModal(true)}
                            className="flex"
                          >
                            <i className="fi fi-sr-sign-in-alt flex text-primary text-xl"></i>
                            <span className="w-min text-center text-[0.7rem] leading-none font-bold text-primary">
                              Account Login
                            </span>
                          </button>
                            )}
            </div>

            {/* Mobile Icons */}
            <div className="max-sm:block hidden">
              <Link href="/all-stores" className="flex">
                <i className="fi fi-rr-marker flex text-primary font-bold text-2xl"></i>
              </Link>
            </div>

            <div className="max-sm:block hidden">
              {isLoggedIn ? (
                              <>
                                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-black ">
                                  <FiUser size={18} className="text-red-600" />
                                  <span className="w-min text-center text-[0.7rem] leading-none font-bold text-primary">
                                      Hi, 
                                    
                                  </span>
                                </button>
      
                                {dropdownOpen && (
                                  <div className="absolute right-0 mt-10 w-48 bg-white rounded-xl shadow-xl z-50 py-2 px-2" style={{
                                        top: `40px`,
                                        right: `5%`,
                                        width: `40%`,
                                        maxHeight: '220px'
                                      }}>
                                      {isAdmin && (
                                        <>
                                          <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                              <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-600 text-white">
                                                  <FaUserShield className="w-3 h-3 sm:w-4 sm:h-4" />
                                              </span>
                                              Admin Panel
                                          </Link>
                                        </>
                                      )}
                                    <Link href="/order" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                      <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-600 text-white">
                                        <FaShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </span>My Orders
                                    </Link>
                                    <hr className="my-2 border-gray-200" />
                                    <button onClick={handleLogout} className="flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                        <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-600 text-white">
                                            <IoLogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </span>Logout
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <button
                            onClick={() => setShowAuthModal(true)}
                            className="flex"
                          >
                            <i className="fi fi-sr-sign-in-alt flex text-primary font-bold text-2xl"></i>
                           
                          </button>
                            )}
            </div>

            

            {/* Wishlist */}
            <div className="relative flex items-center gap-1 text-sm">
              <Link href="/wishlist" className="flex">
              <i className="fi fi-rs-heart flex text-primary font-bold text-2xl"></i>
              <span className="absolute -top-2 -right-2 bg-primary text-white w-4 h-4 text-[0.6rem] flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
              </Link>
            </div>

            {/* Cart */}
            <div className="relative flex items-center gap-1 text-sm">
              <Link href="/cart" className="flex">
              <i className="fi fi-rs-shopping-cart flex text-primary font-bold text-2xl"></i>
              <span className="absolute -top-2 -right-2 bg-primary text-white w-4 h-4 text-[0.6rem] flex items-center justify-center rounded-full">
                {cartCount}
              </span>
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="max-md:block hidden">
              <i className="fi fi-bs-menu-burger flex text-primary font-bold text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden max-w-2xl px-4 mx-auto pb-2.5">
          <div className="relative w-full">
            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Search for products..."
                                className="w-full pl-5 pr-12 py-2 rounded-full border-2 bg-white text-gray font-bold border-gray-400/80 outline-none"
                                ref={searchInputRef}
                                onFocus={() => {
                                  setSearchContext('mobileTop'); // ADDED
                                  if (searchInputRef.current) {
                                    const rect = searchInputRef.current.getBoundingClientRect();
                                    setSearchDropdownLeft(rect.left);
                                    setSearchDropdownTop(rect.bottom + window.scrollY);
                                    setSearchDropdownWidth(rect.width);
                                  }
                                  if (searchQuery.trim().length >= 1) fetchSuggestions(searchQuery);
                                  setSearchDropdownVisible(true);
                                }}
                              />
                              
                              <button onClick={handleSearchBtnClick} className="text-red-600 ">
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600">
                <i className="fi fi-br-search flex font-bold text-primary"></i>
              </span>
                                    </button>
          </div>
        </div>


      </header>

      {/* ================= CATEGORY NAV ================= */}
      <nav className="bg-primary text-white md:block hidden">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center gap-8 py-3 font-semibold text-sm justify-between">
          {categoriesMenu.map((cat) => (
            <li key={cat._id} className="relative group">
  {/* Main Category */}
  <Link
    href={`/category/${cat.category_slug}`}
    className="flex items-center gap-2 text-[16px] font-black hover:text-yellow-300"
  >
    <Image
      src={cat.image}
      alt={cat.category_name}
      width={28}
      height={28}
      className="object-contain"
    />
    <span>{cat.category_name}</span>
  </Link>

  {/* Submenu */}
  {cat.subcategories?.length > 0 && (
  <div className="absolute left-0 top-full mt-2 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 bg-linear-to-r from-linearyellow via-white to-linearyellow text-black rounded-lg shadow-lg p-4 z-50">
    
    <div className="flex gap-10 items-start">
  
  {/* LEFT SIDE - Subcategories */}
  <div className="flex gap-8">
    {chunkArray(cat.subcategories, 10).map((group, index) => (
      <ul key={index} className="space-y-2 min-w-[180px]">
        {group.map((sub) => (
          <li key={sub._id}>
            <Link
              href={`/category/${sub.category_slug}`}
              className="block hover:text-primary hover:underline"
            >
              {sub.category_name}
            </Link>
          </li>
        ))}
      </ul>
    ))}
  </div>

  {/* RIGHT SIDE - Category Image */}
  {cat.image && (
    <div className="min-w-[180px]">
      <Image
        src={cat.image}
        alt={cat.category_name}
        width={180}
        height={180}
        className="object-contain rounded-lg"
      />
    </div>
  )}

</div>

  </div>
)}
</li>
          ))}
        </ul>
      </div>
    </nav>

      {/* NEW MOBILE SEARCH BAR */}
        {/* 
                      <div className="sm:hidden mt-2 -mx-4 px-0">
                        <div className="bg-gradient-to-r from-[#ed3237] to-[#c11116] w-full px-3 py-3">
                          <div className="flex items-center bg-white h-12 rounded-xl border border-gray-300 shadow-sm overflow-hidden w-full transition-all duration-150 focus-within:border-[#2453d3] focus-within:shadow-[0_0_0_2px_rgba(36,83,211,0.15)] flex-nowrap">
                            
                            
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="h-full text-[11px] xs:text-xs bg-white  border-r border-gray-300 outline-none flex-shrink-0 min-w-[120px] w-auto"
                              aria-label="Category"
                            >
                              <option value="All Category">All Category</option>
                              {categories.map((cat) => (
                                <option key={cat._id} value={cat.category_name} title={cat.category_name}>
                                  {cat.category_name}
                                </option>
                              ))}
                            </select>
                            <div className="flex-1 relative h-full flex items-center">
                              <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder=" "
                                className="w-full h-full text-sm outline-none bg-transparent px-1 focus:text-[#111] placeholder-transparent"
                                ref={searchInputRef}
                                onFocus={() => {
                                  setSearchContext('mobileTop'); // ADDED
                                  if (searchInputRef.current) {
                                    const rect = searchInputRef.current.getBoundingClientRect();
                                    setSearchDropdownLeft(rect.left);
                                    setSearchDropdownTop(rect.bottom + window.scrollY);
                                    setSearchDropdownWidth(rect.width);
                                  }
                                  if (searchQuery.trim().length >= 1) fetchSuggestions(searchQuery);
                                  setSearchDropdownVisible(true);
                                }}
                              />
                              {searchQuery.trim() === "" && (
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] pointer-events-none z-10">
                                  <span className="text-gray-400">Search for</span>
                                  <span className="text-gray-900">"{typedPreview }"</span>
                                </div>
                              )}
                            </div>
                        
                            <button
                              onClick={handleSearch}
                              aria-label="Search"
                              className="h-full px-4 bg-red-600 text-white flex items-center justify-center active:scale-[0.97] transition"
                            >
                              <FaSearch size={16} />
                            </button>
                          </div>
                        </div>
                      </div> 
                       */}

                      {/* MOBILE TOP SUGGESTIONS (outside menu) */}
                                      {searchDropdownVisible && searchContext === 'mobileTop' && !isMobileMenuOpen && (
                                        <div ref={searchDropdownRef} className="sm:hidden absolute z-[70] left-0 right-0 px-3 mt-1">
                                          <div className="bg-white rounded-lg shadow-lg border max-h-72 overflow-y-auto">
                                            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-gray-500">
                                              PRODUCTS
                                            </div>
                                            <div className="px-3 pb-2">
                                              {suggestions.length > 0
                                                ? suggestions.map(renderSuggestionItem)
                                                : (searchQuery.trim() && (
                                                    <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                                                      {/* Icon */}
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-12 h-12 mb-3 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                      </svg>
                      
                                                      {/* Message */}
                                                      <p className="text-sm font-medium">No products found</p>
                                                      <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                                                    </div>
                      
                                                  ))
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Mobile Menu (Hidden on desktop) */}
                                      {isMobileMenuOpen && (
                                        <div className="sm:hidden bg-white fixed inset-0 z-50 p-4 pt-3 rounded-lg shadow-lg overflow-y-auto transition-all duration-300"
                                          style={{ touchAction: 'auto', userSelect: 'auto', WebkitUserSelect: 'auto' }}
                                        >
                                          {/* Internal sticky header */}
                                          <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b">
                                            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                                              <FiMenu size={18} />
                                              <span>Menu</span>
                                            </div>
                                            <button
                                              onClick={() => setIsMobileMenuOpen(false)}
                                              aria-label="Close menu"
                                              className="p-2 rounded-full text-red-600 hover:bg-red-50 active:bg-red-100 focus:outline-none focus:ring focus:ring-red-200"
                                            >
                                              <FiX size={22} />
                                            </button>
                                          </div>
                              
                                          {/* Mobile Category Block (accordion) */}
                                            <div className=" bg-white rounded-md border border-gray-200 overflow-hidden">
                                                <div className="px-3 py-4 text-[14px] font-semibold tracking-wide text-white  bg-[#2453D3]">
                                                  Browse Category
                                                </div>
                                                {/* Use unified nodes (categories + hoveredCategory subcategories when available) */}
                                                {Array.isArray(nodes) && nodes.length > 0 ? (
                                                  renderCategoryLevel(nodes, [], 0)
                                                ) : (
                                                  <div className="px-3 py-4 text-sm text-gray-500">
                                                    Loading categoriesâ€¦
                                                  </div>
                                                )}
                                              </div>
                                        </div>
                                      )}
{/* Auth Modal */}
                {showAuthModal && (
                    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
                            <button onClick={() => { setShowAuthModal(false); setFormError(''); setError(''); setErrors({ login: {}, register: {} }); setLoginData({ email: "", password: "" }); setRegisterData({ name: "", email: "", mobile: "", password: "" }); }} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">
                                &times;
                            </button>
                            <div className="flex gap-4 mb-6 border-b">
                                <button className={`pb-2 px-1 ${activeTab === 'login' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('login')}>
                                    Login
                                </button>
                                <button className={`pb-2 px-1 ${activeTab === 'register' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('register')}>
                                    Register
                                </button>
                            </div>
                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                              {/* Register Name Field */}
                              {activeTab === "register" && (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Name"
                                    value={registerData.name}
                                    onChange={(e) =>
                                      setRegisterData({ ...registerData, name: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                      errors?.register?.name ? "border-red-500" : ""
                                    }`}
                                  />
                                  {errors?.register?.name && (
                                    <p className="text-red-500 text-sm">{errors.register.name}</p>
                                  )}
                                </>
                              )}

                              {/* Email Field */}
                              <input
                                type="text"
                                placeholder="Email"
                                value={
                                  activeTab === "login" ? loginData.email : registerData.email
                                }
                                onChange={(e) =>
                                  activeTab === "login"
                                    ? setLoginData({ ...loginData, email: e.target.value })
                                    : setRegisterData({ ...registerData, email: e.target.value })
                                }
                                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                  errors?.[activeTab]?.email ? "border-red-500" : ""
                                }`}
                              />
                              {errors?.[activeTab]?.email && (
                                <p className="text-red-500 text-sm">{errors[activeTab].email}</p>
                              )}

                              {/* Register Mobile Field */}
                              {activeTab === "register" && (
                                <>
                                  <input
                                    type="tel"
                                    placeholder="Mobile"
                                    value={registerData.mobile}
                                    onChange={(e) =>
                                      setRegisterData({ ...registerData, mobile: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                      errors?.register?.mobile ? "border-red-500" : ""
                                    }`}
                                  />
                                  {errors?.register?.mobile && (
                                    <p className="text-red-500 text-sm">{errors.register.mobile}</p>
                                  )}
                                </>
                              )}

                              {/* Password Field */}
                              <input
                                type="password"
                                placeholder="Password"
                                value={
                                  activeTab === "login" ? loginData.password : registerData.password
                                }
                                onChange={(e) =>
                                  activeTab === "login"
                                    ? setLoginData({ ...loginData, password: e.target.value })
                                    : setRegisterData({ ...registerData, password: e.target.value })
                                }
                                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                  errors?.[activeTab]?.password ? "border-red-500" : ""
                                }`}
                                minLength={6}
                              />
                              {errors?.[activeTab]?.password && (
                                <p className="text-red-500 text-sm">{errors[activeTab].password}</p>
                              )}

                              {/* Global Form Error */}
                              {(formError || error) && (
                                <div className="text-red-500 text-sm">{formError || error}</div>
                              )}

                              {/* Submit Button */}
                              <button
                                type="submit"
                                disabled={loadingAuth}
                                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400 transition-colors duration-200"
                              >
                                {loadingAuth
                                  ? "Processing..."
                                  : activeTab === "login"
                                  ? "Login"
                                  : "Register"}
                              </button>

                              {/* Forgot Password (only in login) */}
                              {activeTab === "login" && (
                                <div className="text-center mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAuthModal(false);
                                      setShowForgotPasswordModal(true);
                                      setForgotStep(1);
                                      setForgotPasswordEmail(formData?.email || "");
                                      setForgotOTP("");
                                      setNewPassword("");
                                      setConfirmPassword("");
                                      setForgotPasswordMessage("");
                                      setForgotPasswordError("");
                                    }}
                                    className="text-sm text-red-500 hover:underline"
                                  >
                                    Forgot Password?
                                  </button>
                                </div>
                              )}
                            </form>
                        </div>
                    </div>
                )}
      {/* DESKTOP SUGGESTIONS DROPDOWN */}
        {searchDropdownVisible && searchContext === 'desktop' && (
          <div
            ref={searchDropdownRef}
            className="hidden sm:flex flex-col fixed z-[80] bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden"
            style={{
              top: `70px`,
              left: `18%`,
              width: `50%`,
              maxHeight: '420px'
            }}
            role="listbox"
            aria-label="Search product suggestions"
          >
            <div className="px-5 pt-3 pb-2 text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase select-none">
              Products
            </div>
            <div className="px-3 pb-3 overflow-y-auto custom-scrollbar space-y-2">
              {suggestions.length > 0
                ? suggestions.map(renderDesktopSuggestionItem)
                : (searchQuery.trim() && (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                    {/* Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-12 mb-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>

                    {/* Message */}
                    <p className="text-sm font-medium">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                  </div>
                  ))
              }
            </div>
          </div>
        )}
    </>
  );
}
