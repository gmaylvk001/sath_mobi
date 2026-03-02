"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { Ri24HoursLine } from "react-icons/ri";
import { FiMail, FiPhone } from "react-icons/fi";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { IoReload, IoStorefront, IoCardOutline, IoShieldCheckmark } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import Image from "next/image";
import { MdAccountCircle } from "react-icons/md";
import { FaShoppingBag } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";

const Footer = () => {
  const [years, setYears] = useState("");

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    setYears(`${previousYear}-${currentYear}`);
  }, []);
  const [categories, setCategories] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState({ main: [], subs: {} });

  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [errorStores, setErrorStores] = useState(null);
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/store/get');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        //console.log(data);
        if (data.success) {
          setStores(data.data);
        } else {
          setErrorStores(data.error || 'Failed to fetch stores');
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        setErrorStores(error.message);
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

    /* const groupedStores = stores.reduce((acc, store) => {
  const city = store.city; // or store.store_city based on your API
  if (!acc[city]) {
    acc[city] = [];
  }
  acc[city].push(store.organisation_name);
  return acc;
}, {}); */

const groupedStores = stores.reduce((acc, store) => {
  const city = store.city;

  if (!acc[city]) {
    acc[city] = [];
  }

  acc[city].push({
    name: store.organisation_name,
    slug: store.slug
  });

  return acc;
}, {});

const categoriesdescription = [
  {
    name: "Mobiles",
    description:
      "Explore the latest smartphones with powerful processors, advanced cameras, and 5G connectivity. Best deals and EMI options available."
  },
  {
    name: "Air Conditioner",
    description:
      "Energy-efficient Split and Window ACs with inverter technology and installation support at the best prices."
  },
  {
    name: "Laptop & Desktops",
    description:
      "High-performance laptops and desktops for work, gaming, and study with SSD storage and latest processors."
  },
  {
    name: "Smart TV",
    description:
      "4K Ultra HD Smart TVs with OTT apps, Dolby Audio, and Android/Google TV support."
  },
  {
    name: "Tablets",
    description:
      "Latest Android and iPad tablets for productivity, study, and entertainment with EMI options."
  }
];

  useEffect(() => {
   const fetchCategories = async () => {
  try {
    const res = await fetch("/api/categories/get");
    const data = await res.json();
    
    if (data) {
      // ✅ Filter only Active categories
      const activeCategories = data.filter(cat => cat.status === "Active");

      setCategories(activeCategories);
      const grouped = groupCategories(activeCategories);
      setGroupedCategories(grouped);
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
};


    fetchCategories();
    checkAuthStatus();
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
        setUserData(data.user);
      } else {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError('');
    setLoadingAuth(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      setUserData(data.user);
      setShowAuthModal(false);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData(null);
  };

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const groupCategories = (categories) => {
    const grouped = { main: [], subs: {} };
    
    const mainCats = categories.filter(cat => cat.parentid === "none");
    
    mainCats.forEach(mainCat => {
      const subs = categories.filter(cat => cat.parentid === mainCat._id.toString());
      grouped.main.push(mainCat);
      grouped.subs[mainCat._id] = subs;
    });
    
    return grouped;
  };

  // Function to get unique brands for a category
// Updated function to get brands with slugs
const getCategoryBrands = (category) => {
  if (!category.brands || category.brands.length === 0) return [];
  
  // Get unique brands with name and slug
  const uniqueBrands = category.brands.reduce((acc, brand) => {
    if (brand && brand.brand_name) {
      // Check if brand already exists
      const exists = acc.find(b => b.brand_name === brand.brand_name);
      if (!exists) {
        acc.push({
          brand_name: brand.brand_name,
          brand_slug: brand.brand_slug || brand.brand_name.toLowerCase().replace(/\s+/g, '-')
        });
      }
    }
    return acc;
  }, []);
  
  return uniqueBrands;
};

  return (
    <>
      <footer className="bg-[#222529] text-gray-300 text-sm py-5 md:px-4 p-6">
        <div className="bg-[#222529] text-gray-400  border-white ">
          <div className="w-full flex justify-center">
            <div className="w-full container mx-auto px-3  grid grid-cols-1 md:grid-cols-3 gap-16 justify-between">
              {/* Corporate Office */}
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-lg mb-4">Corporate Office</h3>
                <p>
                  SATHYA Mobiles India Pvt. Ltd., <br />
                  No.27, 27/1, 27/A, 27/B, Gipson Puram, <br />
                  Thoothukudi-628002, Tamilnadu, India.
                </p>
                <hr className="border-gray-600 my-3" />
                <h3 className="text-white font-semibold text-lg mb-4">Contact Information</h3>
                <div className="flex items-center gap-2">
                  <FiPhone /> <span>+91 90470 48777</span>
                </div>
                <hr className="border-gray-600 my-3" />
                <div className="flex items-center gap-2">
                   <FiMail /> <span>contact@sathyamobiles.store</span>
                </div>
                <hr className="border-gray-600 my-3" />
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Ri24HoursLine /><span>Online Support 24/7: +91 90470 48777</span>
                </div>
              </div>
              {/* My Account & Policy */}
              <div className="flex flex-col space-y-6 md:mx-auto">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">My Account</h3>
                  <ul className="space-y-1">
                    {isLoggedIn ? (
                      <>
                        <li>
                          <Link href="/order" className="hover:underline hover:text-white flex items-center gap-2">
                            <FaShoppingBag /> My Orders
                          </Link>
                        </li>
                        <li>
                          <button 
                            onClick={handleLogout}
                            className="hover:underline hover:text-white flex items-center gap-2"
                          >
                            <IoLogOut /> Logout
                          </button>
                        </li>
                      </>
                    ) : (
                      <li>
                        <button 
                          onClick={() => setShowAuthModal(true)}
                          className="hover:underline hover:text-white"
                        >
                          Sign In / Register
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-4">Policy</h3>
                  <ul className="space-y-2">
                    <li><Link href="/privacypolicy" className="hover:underline hover:text-white">Privacy Policy</Link></li>
                    <li><Link href="/terms-and-condition" className="hover:underline hover:text-white">Terms and Conditions</Link></li>
                    <li><Link href="/cancellation-refund-policy" className="hover:underline hover:text-white">Cancellation Policy</Link></li>
                    <li><Link href="/shipping" className="hover:underline hover:text-white">Shipping and Delivery Policy</Link></li>
                  </ul>
                </div>
                <div className="mb-2  flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left ml-1 mb-1">
                    <p>
                      <a href="#" className="hover:underline text-white">&copy; {years} SATHYA.</a> All Rights Reserved.
                    </p>
                  </div>
                </div>
              </div>
              {/* Company & Social Media */}
              <div className="md:ml-12">
                <div className="mb-8">
                   <h3 className="text-white font-semibold text-lg mb-1">Company</h3>
                  <ul className="space-y-1">
                    <li><Link href="/aboutus" className="hover:underline hover:text-white">About Us</Link></li>
                    <li><Link href="/contact" className="hover:underline hover:text-white">Contact Us</Link></li>
                    <li><Link href="/blog" className="hover:underline hover:text-white">Blog</Link></li>
                    <li><Link href="/faq" className="hover:underline hover:text-white">FAQ</Link></li>
                  </ul>
                </div>
              <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Connect With Us</h3>
                  <div className="flex space-x-3"> 
                    <Link href="https://www.facebook.com/SathyaRetail.mobiles/">
                      <div className="p-2 rounded-full border border-gray transition-colors duration-300 hover:border-white hover:bg-red-500 group">
                        <FaFacebookF className="text-sm text-white transition-colors duration-300 group-hover:text-white" />
                      </div>
                    </Link>
                    <Link href="https://www.instagram.com/sathyamobiles.store/">
                      <div className="p-2 rounded-full border border-gray transition-colors duration-300 hover:border-white hover:bg-pink-500 group">
                        <FaInstagram className="text-sm text-white transition-colors duration-300 group-hover:text-white" />
                      </div>
                    </Link>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="py-3">
                    <img src="/uploads/payments.png" alt="Payment methods" className="w-[200px]" />
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bg-[#222529] text-gray-400 mt-10 pt-5 border-t border-white">
          <div className="container mx-auto px-2 grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* LEFT SECTION (Categories + Brands) */}
              <div className="col-span-2">
                {/* <div className="mb-2  flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left ml-1 mb-1">
                    <p>
                      <a href="#" className="hover:underline text-white">&copy; {years} SATHYA.</a> All Rights Reserved.
                    </p>
                  </div>
                </div> */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-1">Categories</h3>
                  {groupedCategories.main
                    .filter((mainCat) => groupedCategories.subs[mainCat._id]?.length > 0)
                    .map((mainCat) => {
                      const categoryBrands = getCategoryBrands(mainCat);
                      
                      return (
                        <div key={mainCat._id} className="mb-2">
                          <Link
                            href={`/category/${mainCat.category_slug}`}
                            className="text-white hover:underline whitespace-nowrap"
                          >
                            {capitalizeFirstLetter(mainCat.category_name)} :
                          </Link>
                          
                          {/* Subcategories */}
                          <span className="text-gray-400 ml-2">
                            {groupedCategories.subs[mainCat._id].map((subcat, index) => (
                              <span key={subcat._id}>
                                <Link
                                  href={`/category/${mainCat.category_slug}/${subcat.category_slug}`}
                                  className="hover:text-white hover:underline"
                                >
                                  {capitalizeFirstLetter(subcat.category_name)}
                                </Link>
                                {index < groupedCategories.subs[mainCat._id].length - 1 && ' / '}
                              </span>
                            ))}
                          </span>

                          {/* Brands Section */}
                        {/* Brands Section */}
                        {categoryBrands.length > 0 && (
                          <div className="">
                            <span className="text-white text-sm">Brands: </span>
                            <span className="text-gray-400 text-sm">
                              {categoryBrands.map((brand, index) => (
                                <span key={brand.brand_name}>
                                  <Link
                                    href={`/category/brand/${mainCat.category_slug}/${brand.brand_slug}`}
                                    className="hover:text-white hover:underline"
                                  >
                                    {capitalizeFirstLetter(brand.brand_name)}
                                  </Link>
                                  {index < categoryBrands.length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                        </div>
                      );
                    })}
                </div>
              </div>
              {/* RIGHT SECTION (Our Location) */}
              <div className="col-span-1">
                <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg mb-4">Our Stores</h3>
                {/* {Object.entries(groupedStores).map(([city, orgs], index) => (
                  <div key={index}>
                    <p className="text-sm text-gray-400">{orgs.join(", ")}</p>
                  </div>
                ))} */}

                {/* {Object.entries(groupedStores).map(([city, orgList], index) => (
                        <div key={index}>
                          {orgList.map((org, i) => (
                            <a key={i} href={`store/${org.slug}`} className="hover:text-white hover:underline">
                              <p className="text-sm text-white-400">{org.name}</p>
                            </a>
                          ))}
                        </div>
                      ))} */}

                      <p className="text-gray-600 leading-7 text-sm">
                        {Object.entries(groupedStores).map(([city, orgList]) =>
                          orgList.map((org, index) => (
                            <span key={org.slug}>
                              <a
                                href={`/store/${org.slug}`}
                                className="hover:text-red-600 hover:underline"
                              >
                                {org.name}
                              </a>
                              {", "}
                            </span>
                          ))
                        )}
                      </p>
               </div>
              </div>
          </div>

          <section className="py-10  md:px-2">
  <div className="max-w-7xl mx-auto space-y-8 text-sm leading-7">

    {/* Main Heading */}
    <div>
      <h2 className="font-semibold text-lg mb-3">
        Buy Electronics Online at Sathya Mobiles – Tamil Nadu's Trusted Electronics Store
      </h2>
      <p>
        Transform your home and lifestyle with the latest electronics from Sathya Mobiles.
        Discover a wide range of smartphones, laptops, smart TVs, air conditioners,
        tablets, and home appliances from top brands. Shop online or visit our stores
        across Tamil Nadu for the best deals, easy EMI options, exchange offers,
        and genuine warranty products.
      </p>
    </div>

    {/* Mobiles */}
    <div>
      <h3 className="font-semibold mb-2">
        Buy Latest Mobiles Online
      </h3>
      <p>
        Explore the newest smartphones with advanced cameras, powerful processors,
        long-lasting batteries, and 5G connectivity. Choose from top brands offering
        budget, mid-range, and flagship devices. Sathya Mobiles ensures competitive
        pricing, exchange offers, and secure online shopping for a seamless
        mobile buying experience.
      </p>
    </div>

    {/* Laptops */}
    <div>
      <h3 className="font-semibold mb-2">
        Buy Best Laptops & Desktops Online
      </h3>
      <p>
        Find high-performance laptops and desktops for work, gaming, and study.
        Shop from leading brands with SSD storage, high RAM capacity, latest processors,
        and dedicated graphics options. Sathya Mobiles provides reliable products,
        warranty support, and flexible EMI plans.
      </p>
    </div>

    {/* Smart TV */}
    <div>
      <h3 className="font-semibold mb-2">
        Buy Smart TVs at Best Prices Online
      </h3>
      <p>
        Upgrade your home entertainment with Smart TVs featuring 4K Ultra HD,
        Dolby Audio, Android TV, and OTT app support. Choose from LED, QLED,
        and large-screen models with stunning picture clarity and immersive sound.
      </p>
    </div>

    {/* Air Conditioner */}
    <div>
      <h3 className="font-semibold mb-2">
        Buy Air Conditioners Online – Shop Now
      </h3>
      <p>
        Stay cool with energy-efficient Split and Window Air Conditioners.
        Explore inverter ACs with fast cooling technology and lower power
        consumption. Get installation support and seasonal offers at
        Sathya Mobiles.
      </p>
    </div>

    {/* Tablets */}
    <div>
      <h3 className="font-semibold mb-2">
        Buy Tablets Online at Best Deals
      </h3>
      <p>
        Shop the latest tablets designed for productivity, entertainment,
        and online learning. Choose from high-resolution displays, long battery
        life, and powerful processors. Enjoy affordable pricing and EMI options.
      </p>
    </div>

  </div>
</section>
          
          {/* Categories Section with Brands */}
          <div className="bg-[#222529]">
            <div className="container mx-auto px-4 text-base font-medium space-y-2 mt-4">
              
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal (unchanged) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setFormError('');
                setError('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>

            <div className="flex gap-4 mb-6 border-b">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'login' 
                    ? 'border-b-2 border-red-500 text-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'register'
                    ? 'border-b-2 border-red-500 text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              {activeTab === 'register' && (
                <input
                  type="tel"
                  placeholder="Mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              )}
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                minLength={6}
              />
              
              {(formError || error) && (
                <div className="text-red-500 text-sm">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400 transition-colors duration-200"
              >
                {loadingAuth ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
