"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import Link from "next/link";
import Addtocart from "@/components/AddToCart";

const BestSellers = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandMap, setBrandMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const brandResponse = await fetch("/api/brand");
        const brandResult = await brandResponse.json();
        if (!brandResult.error) {
          const map = {};
          brandResult.data.forEach((b) => {
            map[b._id] = b.brand_name;
          });
          setBrandMap(map);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  

  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetch("/api/home/best-sellers");
      const data = await res.json();

      if (data.ok && data.categories.length > 0) {
        setCategories(data.categories);
        setCategoryName(data.categories[0].category_name);
        setActiveCategory(data.categories[0]._id);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!activeCategory) return;

    const loadProducts = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/home/best-sellers?category=${activeCategory}`
      );
      const data = await res.json();
      setProducts(data.products || []);
      setLoading(false);
    };

    loadProducts();
  }, [activeCategory]);

  // 🔥 Pricing Helper
  const calculatePricing = (price, special) => {
    const p = Number(price);
    const s = Number(special);

    if (!s || s <= 0) {
      return { sell: p, mrp: null, discount: 0 };
    }

    let mrp = p;

    // If price == special_price → increase MRP by 10%
    if (p === s) {
      mrp = Math.round(s * 1.1);
    }

    // 🔥 Random discount between 9% and 15%
    const randomDiscount = Math.floor(Math.random() * (15 - 9 + 1)) + 9;

    return { sell: s, mrp, discount: randomDiscount };
  };

  return (
    <section className="inner-section-padding py-10 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <h2 className="text-2xl font-bold text-primary text-center mb-5">
        Best Price in the Market
      </h2>

      {/* CATEGORY SCROLL */}
      <div className="max-w-2xl mx-auto mb-5 overflow-x-auto">
        <div className="flex gap-x-2 justify-between">
          {categories.map((cat) => {
            const isActive = activeCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => {
  setActiveCategory(cat._id);
  setCategoryName(cat.category_name);
}}
                className="shrink-0 flex flex-col items-center gap-2"
              >
                <div
                  className={`border-2 rounded-full bg-white w-24 h-24 overflow-hidden ${
                    isActive ? "border-primary" : "border-gray-400"
                  }`}
                >
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.category_name}
                      width={96}
                      height={96}
                      className="object-cover p-2"
                    />
                  )}
                </div>
                <span
                  className={`text-sm font-bold ${
                    isActive ? "text-primary" : "text-gray-600"
                  }`}
                >
                  {cat.category_name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
         
       
          {categoryName === "Mobiles" && (
            <>
          {/* ---------------- Mobile GRID ---------------- */}
      <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 mb-10">
        <div className="col-span-2 max-sm:col-span-2">
          <Link href="/category/mobiles">
            <GridImage src="/assets/images/categoryimages/M-1.png" alt="Mobile Main" />
          </Link>
          
        </div>

        <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4">
          <Link href="/category/mobiles">
          <GridImage src="/assets/images/categoryimages/M-2.png" alt="iPhone Category" />
          </Link>
          <Link href="/category/mobiles"> 
          <GridImage src="/assets/images/categoryimages/M-3.png" alt="iPhone Category" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4">
          <Link href="/category/mobiles"> 
          <GridImage src="/assets/images/categoryimages/M-4.png" alt="Android Category" />
          </Link>
          <Link href="/category/mobiles"> 
          <GridImage src="/assets/images/categoryimages/M-5.png" alt="Keypad Category" />
          </Link>
        </div>
      </div>
      </>
        )}
        {categoryName === "Air Conditioner" && (
          <>  
      {/* ---------------- AC GRID ---------------- */}
      <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 mb-10">
        <div className="col-span-2 max-sm:col-span-2">
          <Link href="/category/air-conditioner">
          <GridImage src="/assets/images/categoryimages/ac-w-button-new-1.png" alt="AC Main" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1">
          <Link href="/category/air-conditioner">
          <GridImage src="/assets/images/categoryimages/ac-inverter-w-button-new-1.png" alt="Inverter AC" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4">
          <Link href="/category/air-conditioner">
          <GridImage src="/assets/images/categoryimages/ac-split-w-button-new-1.png" alt="Split AC" />
          </Link>
          <Link href="/category/air-conditioner">
          <GridImage src="/assets/images/categoryimages/ac-window-w-button-new-1.png" alt="Window AC" />
          </Link>
        </div>
      </div>
    </>
        )}
{categoryName === "Smart Tv" && (
  <> 
      {/* ---------------- TV GRID ---------------- */}
      <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 mb-10">
        <div className="col-span-2 max-sm:col-span-2">
          <Link href="/category/smart-tv">
          <GridImage src="/assets/images/categoryimages/TV-1.png" alt="TV Main" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4">
          <Link href="/category/smart-tv">
          <GridImage src="/assets/images/categoryimages/TV-2.png" alt="TV Category" />
          </Link>
          <Link href="/category/smart-tv">
          <GridImage src="/assets/images/categoryimages/TV-3.png" alt="TV Category" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4">
          <Link href="/category/smart-tv">
          <GridImage src="/assets/images/categoryimages/TV-4.png" alt="TV Category" />
          </Link>
          <Link href="/category/smart-tv">
          <GridImage src="/assets/images/categoryimages/TV-5.png" alt="TV Category" />
            </Link>
        </div>
      </div>
</>
        )}
        {categoryName === "Laptop& Desktops" && (
          <> 
      {/* ---------------- LAPTOP & DESKTOP GRID ---------------- */}
      <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 mb-10">
        <div className="col-span-2 max-sm:col-span-2">
          <Link href="/category/laptop-desktops">
          <GridImage src="/assets/images/categoryimages/L-D-1.png" alt="Laptop Main" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1">
          <Link href="/category/laptop-desktops">
          <GridImage src="/assets/images/categoryimages/L-D-2.png" alt="Laptop Category" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1">
          <Link href="/category/laptop-desktops">
          <GridImage src="/assets/images/categoryimages/L-D-3.png" alt="Desktop Category" />
          </Link>
        </div>
      </div>
</>
        )}
{categoryName === "Accessories" && (
  <> 
      {/* ---------------- ACCESSORIES GRID ---------------- */}
      <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 mb-10">
        <div className="col-span-1">
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-1.png" alt="Accessories" />
          </Link>
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-2.png" alt="Accessories" />
          </Link>
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-3.png" alt="Accessories" />
          </Link>
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-4.png" alt="Accessories" />
          </Link>
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-5.png" alt="Accessories" />
          </Link>
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-6.png" alt="Accessories" />
          </Link>
          <Link href="/category/accessories">
          <GridImage src="/assets/images/categoryimages/access-7.png" alt="Accessories" />
          </Link>
        </div>
      </div>
</>
        )}
{categoryName === "Tablets" && (
  <> 
      {/* ---------------- TABLETS GRID ---------------- */}
      <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 mb-10">
        <div className="col-span-2 max-sm:col-span-2">
          <Link href={`/category/tablets`}>
          <GridImage src="/assets/images/categoryimages/T-1.png" alt="Tablet Main" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1">
           <Link href={`/category/tablets`}>
          <GridImage src="/assets/images/categoryimages/T-2.png" alt="Tablet Category" />
          </Link>
        </div>

        <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4">
          <Link href={`/category/tablets`}>
          <GridImage src="/assets/images/categoryimages/T-3.png" alt="Tablet Category" />
          </Link>
          <Link href={`/category/tablets`}>
          <GridImage src="/assets/images/categoryimages/T-4.png" alt="Tablet Category" />
          </Link>
        </div>
      </div>
</>
        )}
     

      {/* PRODUCT SWIPER */}
      <div className="relative">
        <div className="product-nav-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer">
          <i className="fi fi-ss-angle-small-left text-white"></i>
        </div>
        <div className="product-nav-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer">
          <i className="fi fi-ss-angle-small-right text-white"></i>
        </div>

        <Swiper
          modules={[Navigation]}
          navigation={{
            nextEl: ".product-nav-next",
            prevEl: ".product-nav-prev",
          }}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            550: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
        >
          {loading
            ? [...Array(4)].map((_, i) => (
                <SwiperSlide key={i}>
                  <div className="h-[380px] bg-gray-200 rounded-xl animate-pulse" />
                </SwiperSlide>
              ))
            : products.map((product) => {
                const { sell, mrp, discount } = calculatePricing(
                  product.price,
                  product.special_price
                );

                return (
                  <SwiperSlide key={product._id}>
                    <div className="rounded-xl bg-linear-120 from-yellow-200 to-pink-200 p-4 h-[430px] flex flex-col">
                      <div className="bg-white rounded-lg p-4 flex justify-center items-center h-[260px]">
                        <Link href={`/product/${product.slug}`}>
                          <Image
                            src={`/uploads/products/${product.images?.[0]}`}
                            alt={product.name}
                            width={200}
                            height={250}
                            className="object-contain max-h-full"
                          />
                        </Link>
                      </div>

                      <div className="mt-3 text-sm flex flex-col flex-1 justify-between">
                        <h4 className="text-xs text-gray-500 mb-1 uppercase truncate">
                          <Link
                            href={`/brand/${
                              brandMap[product.brand]
                                ?.toLowerCase()
                                .replace(/\s+/g, "-") || ""
                            }`}
                            className="hover:text-red-600"
                          >
                            Brand: {brandMap[product.brand] || ""}
                          </Link>
                        </h4>

                        <Link href={`/product/${product.slug}`}>
                          <p className="font-semibold line-clamp-2 min-h-[40px]">
                            {product.name}
                          </p>
                        </Link>

                        <div className="mt-2">
                          <span className="font-bold text-lg px-2 py-2">
                            ₹ {sell}
                          </span>

                          {mrp && (
                            <>
                              <span className="text-red-500 line-through ml-2 px-2 py-2">
                                ₹ {mrp}
                              </span>

                              {discount > 0 && (
                                <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md ml-2">
                                  {discount}% Off
                                </span>
                              )}
                            </>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <Addtocart
                              productId={product._id}
                              stockQuantity={product.quantity}
                              special_price={sell}
                              className="flex-1 text-xs sm:text-sm py-1.5 sm:py-2"
                            />
                            <a
                            href={`https://wa.me/919047048777?text=${encodeURIComponent(
                                `Check Out This Product: ${
                                typeof window !== "undefined"
                                    ? window.location.origin
                                    : ""
                                }/product/${product.slug}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full flex items-center justify-center transition"
                            >
                            <svg className="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
                                <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                            </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
        </Swiper>
      </div>
    </section>
  );
    
};

function GridImage({ src, alt }) {
  return (
    <div className="h-full rounded-lg overflow-hidden shadow-[5px_5px_3px_0px_rgba(0,0,0,0.3)]">
      <Image
        src={src}
        alt={alt}
        width={600}
        height={400}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default BestSellers;