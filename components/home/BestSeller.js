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
            map[b._id] = { name: b.brand_name, image: b.image };
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

    const discount = Math.max(1, Math.round(100 - (s / mrp) * 100));

    return { sell: s, mrp, discount };
  };

  return (
    <section className="inner-section-padding py-10 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:border-none max-sm:shadow-none max-sm:bg-[#fff7ed] max-sm:p-3.5 max-sm:rounded-2xl max-sm:mx-3 max-sm:my-4 max-sm:w-auto">
      <div className="flex items-center justify-between mb-5 max-sm:mb-3">
        <h2 className="text-2xl font-bold text-primary max-sm:text-gray-900 text-center max-sm:text-left max-sm:text-lg">
          Best Price in the Market
        </h2>
        <Link
          href={`/category/${categoryName?.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-") || "mobiles"}`}
          className="hidden max-sm:flex w-7 h-7 bg-black text-white rounded-full items-center justify-center font-bold text-xs shrink-0 shadow-xs hover:bg-gray-800 active:scale-95 transition-all"
        >
          ➔
        </Link>
      </div>

      {/* CATEGORY SCROLL (FLIPKART APP ICON CARD STYLE - UNIFORM SIZE) */}
      <div className="max-w-3xl mx-auto mb-3 max-sm:mb-2">
        <div className="flex gap-3 max-sm:gap-2 justify-start md:justify-center overflow-x-auto scrollbar-hide px-1 py-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => {
                  setActiveCategory(cat._id);
                  setCategoryName(cat.category_name);
                }}
                className="shrink-0 flex flex-col items-center gap-1.5 w-20 max-sm:w-15 transition-all"
              >
                <div
                  className={`w-16 h-16 max-sm:w-14 max-sm:h-14 aspect-square shrink-0 rounded-2xl max-sm:rounded-xl flex items-center justify-center p-2 border transition-all duration-200 overflow-hidden ${isActive
                    ? "bg-white border-2 border-primary shadow-md ring-2 ring-primary/20"
                    : "bg-white max-sm:bg-gradient-to-b max-sm:from-white max-sm:to-amber-50/60 border-gray-200/90 hover:border-gray-300 shadow-2xs"
                    }`}
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.category_name}
                      className={`w-full h-full object-contain max-w-full max-h-full ${cat.category_name === "Accessories" ? "scale-90 p-0.5" : ""
                        }`}
                    />
                  )}
                </div>
                <span
                  className={`text-xs max-sm:text-[10px] text-center w-full truncate ${isActive ? "text-primary font-extrabold" : "text-gray-700 font-bold"
                    }`}
                >
                  {cat.category_name}
                </span>
              </button>
            );
          })}
        </div>

        {/* MOBILE INDICATOR DOTS LIKE IMAGE 2 */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mt-2.5 mb-1">
          {categories.map((cat) => (
            <span
              key={cat._id}
              className={`transition-all duration-300 rounded-full ${activeCategory === cat._id
                ? "w-6 h-1.5 bg-black"
                : "w-1.5 h-1.5 bg-gray-300"
                }`}
            />
          ))}
        </div>
      </div>


      {categoryName === "Mobiles" && (
        <>
          {/* ---------------- Mobile GRID ---------------- */}
          <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 max-sm:gap-3 mb-8 max-sm:mb-4 max-sm:bg-white max-sm:p-3 max-sm:rounded-2xl max-sm:border max-sm:border-amber-100 max-sm:shadow-xs">
            <div className="col-span-2 max-sm:col-span-2">
              <Link href="/category/mobiles">
                <GridImage src="/assets/images/categoryimages/M-1.png" alt="Mobile Main" />
              </Link>

            </div>

            <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4 max-sm:gap-3">
              <Link href="/category/iphones">
                <GridImage src="/assets/images/categoryimages/M-2.png" alt="iPhone Category" />
              </Link>
              <Link href="/category/galaxy-phone">
                <GridImage src="/assets/images/categoryimages/M-3.png" alt="iPhone Category" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4 max-sm:gap-3">
              <Link href="/category/google-pixel">
                <GridImage src="/assets/images/categoryimages/M-4.png" alt="Android Category" />
              </Link>
              <Link href="/category/smart-phone">
                <GridImage src="/assets/images/categoryimages/M-5.png" alt="Keypad Category" />
              </Link>
            </div>
          </div>
        </>
      )}
      {categoryName === "Air Conditioner" && (
        <>
          {/* ---------------- AC GRID ---------------- */}
          <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 max-sm:gap-3 mb-8 max-sm:mb-4 max-sm:bg-white max-sm:p-3 max-sm:rounded-2xl max-sm:border max-sm:border-amber-100 max-sm:shadow-xs">
            <div className="col-span-2 max-sm:col-span-2">
              <Link href="/category/air-conditioner">
                <GridImage src="/assets/images/categoryimages/ac-w-button-new-1.png" alt="AC Main" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1">
              <Link href="/category/inverter-ac">
                <GridImage src="/assets/images/categoryimages/ac-inverter-w-button-new-1.png" alt="Inverter AC" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4 max-sm:gap-3">
              <Link href="/category/split-ac">
                <GridImage src="/assets/images/categoryimages/ac-split-w-button-new-1.png" alt="Split AC" />
              </Link>
              <Link href="/category/window-ac">
                <GridImage src="/assets/images/categoryimages/ac-window-w-button-new-1.png" alt="Window AC" />
              </Link>
            </div>
          </div>
        </>
      )}
      {categoryName === "Smart Tv" && (
        <>
          {/* ---------------- TV GRID ---------------- */}
          <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 max-sm:gap-3 mb-8 max-sm:mb-4 max-sm:bg-white max-sm:p-3 max-sm:rounded-2xl max-sm:border max-sm:border-amber-100 max-sm:shadow-xs">
            <div className="col-span-2 max-sm:col-span-2">
              <Link href="/category/smart-tv">
                <GridImage src="/assets/images/categoryimages/TV-1.png" alt="TV Main" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4 max-sm:gap-3">
              <Link href="/category/led-hd">
                <GridImage src="/assets/images/categoryimages/TV-2.png" alt="TV Category1" />
              </Link>
              <Link href="/category/ultra-hd">
                <GridImage src="/assets/images/categoryimages/TV-3.png" alt="TV Category2" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4 max-sm:gap-3">
              <Link href="/category/qled">
                <GridImage src="/assets/images/categoryimages/TV-4.png" alt="TV Category3" />
              </Link>
              <Link href="/category/hometheatre">
                <GridImage src="/assets/images/categoryimages/TV-5.png" alt="TV Category4" />
              </Link>
            </div>
          </div>
        </>
      )}
      {categoryName === "Laptop & Desktops" && (
        <>
          {/* ---------------- LAPTOP & DESKTOP GRID ---------------- */}
          <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 max-sm:gap-3 mb-8 max-sm:mb-4 max-sm:bg-white max-sm:p-3 max-sm:rounded-2xl max-sm:border max-sm:border-amber-100 max-sm:shadow-xs">
            <div className="col-span-2 max-sm:col-span-2">
              <Link href="/category/laptop-desktops">
                <GridImage src="/assets/images/categoryimages/L-D-1.png" alt="Laptop Main" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1">
              <Link href="/category/laptops">
                <GridImage src="/assets/images/categoryimages/L-D-2.png" alt="Laptop Category" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1">
              <Link href="/category/desktops">
                <GridImage src="/assets/images/categoryimages/L-D-3.png" alt="Desktop Category" />
              </Link>
            </div>
          </div>
        </>
      )}
      {categoryName === "Accessories" && (
        <div
          className="
            grid
            grid-cols-3
            gap-4
            mb-8
            items-stretch

            max-sm:grid-cols-2
            max-sm:gap-2.5
            max-sm:bg-white
            max-sm:p-3
            max-sm:rounded-2xl
            max-sm:border
            max-sm:border-amber-100
            max-sm:shadow-xs
          "
        >
          {/* ================= 1 - DESKTOP MAIN ACCESSORIES CARD (Desktop Only) ================= */}
          <Link
            href="/category/accessories"
            className="
              hidden
              sm:flex
              col-span-1
              w-full
              h-full
              min-h-0
            "
          >
            <GridImage
              src="/assets/images/categoryimages/access-1.png"
              alt="Accessories1"
              fill={true}
              className="w-full h-full"
              imgClassName="object-contain"
            />
          </Link>

          {/* ================= 1 - MOBILE MAIN ACCESSORIES CARD (Mobile Only) ================= */}
          <Link
            href="/category/accessories"
            className="
              sm:hidden
              col-span-2
              w-full
              aspect-[1.15/1]
            "
          >
            <GridImage
              src="/assets/images/categoryimages/access-1.png"
              alt="Accessories1"
              fill={true}
              className="w-full h-full aspect-[1.15/1]"
              imgClassName="object-contain"
            />
          </Link>

          {/* ================= RIGHT 6-CARD GRID ================= */}
          <div
            className="
              col-span-2
              max-sm:col-span-2
              grid
              grid-cols-3
              gap-4
              w-full
              max-sm:grid-cols-2
              max-sm:gap-2.5
            "
          >
            {/* 2 - SPEAKERS */}
            <Link
              href="/category/speakers"
              className="
                rounded-2xl
                overflow-hidden
                aspect-square
                sm:aspect-[1/0.88]
                w-full
              "
            >
              <GridImage
                src="/assets/images/categoryimages/access-2.png"
                alt="Accessories2"
                imgClassName="w-full h-full object-contain"
              />
            </Link>

            {/* 3 - EARBUDS */}
            <Link
              href="/category/earbuds"
              className="
                rounded-2xl
                overflow-hidden
                aspect-square
                sm:aspect-[1/0.88]
                w-full
              "
            >
              <GridImage
                src="/assets/images/categoryimages/access-4.png"
                alt="Accessories4"
                imgClassName="w-full h-full object-contain"
              />
            </Link>

            {/* 4 - CHARGERS */}
            <Link
              href="/category/chargers"
              className="
                rounded-2xl
                overflow-hidden
                aspect-square
                sm:aspect-[1/0.88]
                w-full
              "
            >
              <GridImage
                src="/assets/images/categoryimages/access-6.png"
                alt="Accessories6"
                imgClassName="w-full h-full object-contain"
              />
            </Link>

            {/* 5 - SMART WATCH */}
            <Link
              href="/category/smartwatches-and-accessories"
              className="
                rounded-2xl
                overflow-hidden
                aspect-square
                sm:aspect-[1/0.88]
                w-full
              "
            >
              <GridImage
                src="/assets/images/categoryimages/access-3.png"
                alt="Accessories3"
                imgClassName="w-full h-full object-contain"
              />
            </Link>

            {/* 6 - POWER BANK */}
            <Link
              href="/category/power-banks"
              className="
                rounded-2xl
                overflow-hidden
                aspect-square
                sm:aspect-[1/0.88]
                w-full
              "
            >
              <GridImage
                src="/assets/images/categoryimages/access-5.png"
                alt="Accessories5"
                imgClassName="w-full h-full object-contain"
              />
            </Link>

            {/* 7 - BACK CASE */}
            <Link
              href="/category/back-case"
              className="
                rounded-2xl
                overflow-hidden
                aspect-square
                sm:aspect-[1/0.88]
                w-full
              "
            >
              <GridImage
                src="/assets/images/categoryimages/access-7.png"
                alt="Accessories7"
                imgClassName="w-full h-full object-contain"
              />
            </Link>
          </div>
        </div>
      )}
      {categoryName === "Tablets" && (
        <>
          {/* ---------------- TABLETS GRID ---------------- */}
          <div className="grid max-sm:grid-cols-2 grid-cols-4 gap-4 max-sm:gap-3 mb-8 max-sm:mb-4 max-sm:bg-white max-sm:p-3 max-sm:rounded-2xl max-sm:border max-sm:border-amber-100 max-sm:shadow-xs">
            <div className="col-span-2 max-sm:col-span-2">
              <Link href={`/category/tablets`}>
                <GridImage src="/assets/images/categoryimages/T-1.png" alt="Tablet Main" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1">
              <Link href={`/category/ipad`}>
                <GridImage src="/assets/images/categoryimages/T-2.png" alt="Tablet Category1" />
              </Link>
            </div>

            <div className="col-span-1 max-sm:col-span-1 flex flex-col gap-4 max-sm:gap-3">
              <Link href={`/category/tablet-with-call-facility`}>
                <GridImage src="/assets/images/categoryimages/T-3.png" alt="Tablet Category2" />
              </Link>
              <Link href={`/category/tablet-without-call-facility`}>
                <GridImage src="/assets/images/categoryimages/T-4.png" alt="Tablet Category3" />
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
          slidesPerView={1} // mobile: single product card per view
          breakpoints={{
            640: { slidesPerView: 2 },  // large phones
            768: { slidesPerView: 3 },  // tablets
            1024: { slidesPerView: 4 }, // desktop
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
                <SwiperSlide key={product._id} className="!h-auto flex">
                  <div className="rounded-xl bg-linear-120 from-yellow-200 to-pink-200 p-2 md:p-4 h-full w-full flex flex-col">
                    <div className="bg-white rounded-lg p-3 sm:p-4 flex justify-center items-center h-[240px] sm:h-[260px] md:h-[220px] lg:h-[260px]">
                      <Link href={`/product/${product.slug}`} className="flex h-full w-full items-center justify-center">

                        <img
                          src={`/uploads/products/${product.images?.[0]}`}
                          alt={product.name}
                          className="object-contain max-h-full w-auto"
                          width={300}
                          height={300}
                        />
                      </Link>
                    </div>

                    <div className="mt-3 text-sm flex flex-col flex-1 justify-between">
                      <div className="mb-1">
                        <Link
                          href={`/brand/${brandMap[product.brand]?.name
                            ?.toLowerCase()
                            .replace(/\s+/g, "-") || ""
                            }`}
                          className="hover:opacity-80"
                        >
                          {/* BRAND IMAGE - uncomment when ready
                            {brandMap[product.brand]?.image ? (
                              <img
                                src={brandMap[product.brand].image.startsWith('/') ? brandMap[product.brand].image : `/uploads/Brands/${brandMap[product.brand].image}`}
                                alt={brandMap[product.brand]?.name || "Brand"}
                                className="object-contain mix-blend-multiply h-[22px] max-w-[55px]"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">
                                {brandMap[product.brand]?.name || ""}
                              </span>
                            )}
                            */}
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            Brand: {brandMap[product.brand]?.name || ""}
                          </span>
                        </Link>
                      </div>

                      <Link href={`/product/${product.slug}`}>
                        <p className="font-semibold line-clamp-2 min-h-[40px] text-md">
                          {product.name}
                        </p>
                      </Link>

                      <div className="flex flex-wrap items-center gap-1.5 w-full mt-1.5">
                        <span className="font-extrabold text-red-600 text-xs sm:text-sm">
                          ₹{sell.toLocaleString('en-IN')}
                        </span>

                        {mrp && (
                          <span className="text-gray-400 line-through text-[10px] sm:text-xs">
                            ₹{mrp.toLocaleString('en-IN')}
                          </span>
                        )}

                        {discount > 0 && (
                          <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            {discount}% Off
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 justify-between mt-2.5 w-full">
                        <Addtocart
                          productId={product._id}
                          stockQuantity={product.quantity}
                          special_price={sell}
                          className="flex-1 text-[11px] sm:text-sm py-1.5"
                        />

                        <a
                          href={`https://wa.me/919047048777?text=${encodeURIComponent(
                            `Check Out This Product: ${typeof window !== "undefined"
                              ? window.location.origin
                              : ""
                            }/product/${product.slug}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full flex items-center justify-center shrink-0 transition"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 32 32" fill="currentColor">
                            <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                          </svg>
                        </a>
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

function GridImage({ src, alt, className, imgClassName, fill = false }) {
  const isContain = imgClassName?.includes("object-contain");
  return (
    <div className={`h-full rounded-2xl max-sm:rounded-xl overflow-hidden shadow-2xs max-sm:shadow-xs border border-gray-100 hover:shadow-md transition-all duration-300 bg-white p-0.5 max-sm:p-1 active:scale-[0.98] ${className || ""}`}>
      <div className="relative w-full h-full min-h-0 rounded-xl max-sm:rounded-lg overflow-hidden">
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={`w-full h-full ${isContain ? "object-contain" : "object-cover"} rounded-xl max-sm:rounded-lg ${imgClassName || ""}`}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={600}
            height={400}
            className={`w-full h-full ${isContain ? "object-contain" : "object-cover"} rounded-xl max-sm:rounded-lg ${imgClassName || ""}`}
          />
        )}
      </div>
    </div>
  );
}

export default BestSellers;
