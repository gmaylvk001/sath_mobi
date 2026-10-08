"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import Link from "next/link";
import Addtocart from "@/components/AddToCart";

export default function LatestProducts({ excludeIds = [], onLoaded }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandMap, setBrandMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const mobileScrollRef = useRef(null);
  const [mobileCurrentSlide, setMobileCurrentSlide] = useState(0);

  const scrollLeftMobile = () => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollBy({
        left: -mobileScrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const scrollRightMobile = () => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollBy({
        left: mobileScrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
      const { scrollLeft, clientWidth } = mobileScrollRef.current;
      if (clientWidth > 0) {
        setMobileCurrentSlide(Math.round(scrollLeft / clientWidth));
      }
    }
  };

  useEffect(() => {
    const excludeQuery =
      Array.isArray(excludeIds) && excludeIds.length > 0
        ? `?exclude=${excludeIds.join(",")}`
        : "";

    fetch(`/api/home/latest-products${excludeQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          if (onLoaded && data.length > 0) {
            onLoaded(data.map((p) => p._id));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [JSON.stringify(excludeIds)]);

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

  // 🔥 Pricing Logic (Deterministic to prevent React Hydration Mismatch)
  const calculatePricing = (price, special) => {
    const p = Number(price);
    const s = Number(special);

    if (!s || s <= 0) {
      return { sell: p, mrp: null, discount: 0 };
    }

    let mrp = p;
    if (p === s) {
      mrp = Math.round(s * 1.12);
    }

    const discount = Math.max(1, Math.round(100 - (s / mrp) * 100));

    return { sell: s, mrp, discount };
  };

  const leftProducts = products.slice(0, 3);
  const swiperProducts = products.slice(3);

  // Chunk products into groups of 4 (for 2x2 grid per slide page on mobile)
  const mobileProductPages = [];
  for (let i = 0; i < products.length; i += 4) {
    mobileProductPages.push(products.slice(i, i + 4));
  }

  return (
    <section className="w-full py-10 bg-linear-to-r from-linearyellow via-white to-linearyellow inner-section-padding border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:border-none max-sm:shadow-none max-sm:bg-[#fff0f3] max-sm:p-3 max-sm:rounded-2xl max-sm:mx-3 max-sm:my-3 max-sm:w-auto">
      {/* ================= MOBILE VIEW (EXACT MATCHING SCREENSHOT DESIGN) ================= */}
      <div className="block md:hidden relative">
        {/* OUTER CONTAINER */}
        <div className="relative bg-gradient-to-tr from-yellow-200 via-pink-200 to-rose-200 p-2.5 sm:p-3.5 rounded-2xl shadow-sm border border-pink-200/80">
          {/* HEADER TITLE */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-base text-gray-900 font-extrabold tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              Latest Products
            </h2>
            <Link
              href="/category/mobiles"
              className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 active:scale-95 transition-all shadow-xs"
            >
              ➔
            </Link>
          </div>

          {/* SLIDE NAVIGATION BUTTONS (RED ROUND BUTTONS MATCHING SCREENSHOT) */}
          {mobileProductPages.length > 1 && (
            <>
              <button
                onClick={scrollLeftMobile}
                aria-label="Previous Page"
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 bg-red-600 hover:bg-red-700 text-white active:scale-95 border-2 border-white rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={scrollRightMobile}
                aria-label="Next Page"
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 bg-red-600 hover:bg-red-700 text-white active:scale-95 border-2 border-white rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* INNER WHITE CARD BOX HOLDING THE 2x2 GRID */}
          <div className="bg-white rounded-xl p-2 shadow-xs">
            <div
              ref={mobileScrollRef}
              onScroll={handleMobileScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide w-full"
            >
              {mobileProductPages.map((page, pageIdx) => (
                <div
                  key={pageIdx}
                  className="w-full shrink-0 grid grid-cols-2 gap-2 snap-start px-0.5"
                >
                  {page.map((product, idx) => {
                    const { sell, mrp, discount } = calculatePricing(
                      product.price,
                      product.special_price
                    );
                    const productImgSrc = product.images?.[0]
                      ? product.images[0].startsWith("http") || product.images[0].startsWith("/")
                        ? product.images[0]
                        : `/uploads/products/${product.images[0]}`
                      : "/assets/images/no-image.png";

                    return (
                      <div
                        key={product._id || product.slug || `latm-${pageIdx}-${idx}`}
                        className="rounded-xl overflow-hidden bg-linear-120 from-yellow-200 to-pink-200 p-2 flex flex-col justify-between group shadow-2xs transition-all"
                      >
                        {/* PRODUCT IMAGE BOX */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="bg-white rounded-lg p-1 h-[140px] sm:h-[160px] flex items-center justify-center relative overflow-hidden block w-full"
                        >
                          <img
                            src={productImgSrc}
                            alt={product.name || "Product"}
                            className="object-contain h-full w-auto max-h-full max-w-full transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/images/no-image.png";
                            }}
                          />
                        </Link>

                        {/* PRODUCT INFO DIRECTLY ON GRADIENT */}
                        <div className="pt-1.5 px-0.5 flex flex-col justify-between flex-1">
                          <Link
                            href={`/product/${product.slug}`}
                            className="text-xs font-bold text-gray-900 line-clamp-1 leading-snug hover:text-red-600 transition-colors"
                          >
                            {product.name}
                          </Link>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-extrabold text-red-600">
                              ₹{sell.toLocaleString("en-IN")}
                            </span>
                            {mrp && (
                              <span className="text-[9px] font-medium text-gray-400 line-through">
                                ₹{mrp.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>

                          {discount > 0 && (
                            <div className="mt-0.5">
                              <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded inline-block shadow-2xs">
                                {discount}% Off
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* PAGE INDICATOR DOTS */}
          {mobileProductPages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 mb-0.5">
              {mobileProductPages.map((_, idx) => (
                <span
                  key={idx}
                  className={`transition-all duration-300 rounded-full ${mobileCurrentSlide === idx
                    ? "w-6 h-1.5 bg-gray-800"
                    : "w-1.5 h-1.5 bg-gray-400"
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= DESKTOP VIEW (ORIGINAL LAYOUT) ================= */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">

        {/* LEFT CONTENT */}
        <div className="space-y-4 md:col-span-2 lg:col-span-1 z-40">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-primary max-sm:text-gray-900 font-bold max-sm:text-lg">Latest Products</h2>
            <div className="hidden max-sm:flex w-7 h-7 bg-black text-white rounded-full items-center justify-center font-bold text-xs shrink-0">
              ➔
            </div>
          </div>

          <div className="grid grid-rows-3 gap-y-2.5">
            {leftProducts.map((product) => {
              const { sell, mrp, discount } = calculatePricing(
                product.price,
                product.special_price
              );

              return (
                <div
                  key={product._id}
                  className="grid grid-cols-[100px_1fr] gap-4 rounded-xl bg-linear-to-tr from-pink-200 to-orange-200 p-3"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="bg-white rounded-xl overflow-hidden shrink-0 w-[100px] h-[100px] flex items-center justify-center p-2"
                  >
                    <img
                      src={
                        product.images?.[0]
                          ? `/uploads/products/${product.images[0]}`
                          : "/assets/images/no-image.png"
                      }
                      alt={product.name || "Product Image"}
                      className="object-contain max-h-full max-w-full w-auto h-auto"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/images/no-image.png";
                      }}
                    />
                  </Link>

                  <div className="grid min-w-0 grid-rows-[auto_auto_1fr_auto]">
                    <div className="mb-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        Brand: {brandMap[product.brand]?.name || ""}
                      </span>
                    </div>

                    <Link
                      href={`/product/${product.slug}`}
                      className="mb-2 min-w-0 break-words font-semibold text-sm antialiased line-clamp-2"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-bold text-md ">₹ {sell.toLocaleString('en-IN')}</span>
                      {mrp && (
                        <>
                          <span className="text-gray-500 line-through text-xs">₹ {mrp.toLocaleString('en-IN')}</span>
                          <span className="bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-md">
                            {discount}% Off
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <Addtocart
                        productId={product._id}
                        stockQuantity={product.quantity}
                        special_price={product.special_price}
                        className="text-xs sm:text-sm py-1.5 sm:py-2"
                      />

                      <a
                        href={`https://wa.me/919047048777?text=${encodeURIComponent(
                          `Check Out This Product: ${typeof window !== "undefined" ? window.location.origin : ""
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
              );
            })}
          </div>
        </div>

        {/* RIGHT SWIPER */}
        <div className="relative md:col-span-2 lg:col-span-2 z-0 pt-10">

          <div className="latest-prev absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer z-40 text-white">
            ‹
          </div>

          <div className="latest-next absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer z-40 text-white">
            ›
          </div>

          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: ".latest-prev",
              nextEl: ".latest-next",
            }}
            spaceBetween={16}
            slidesPerView={2} // default for mobile
            breakpoints={{
              768: { slidesPerView: 3 },  // tablets
              1024: { slidesPerView: 3 }, // desktop
            }}
          >
            {loading
              ? [...Array(2)].map((_, i) => (
                <SwiperSlide key={i}>
                  <div className="h-[380px] bg-gray-200 rounded-xl animate-pulse" />
                </SwiperSlide>
              ))
              : swiperProducts.map((product) => {
                const { sell, mrp, discount } =
                  calculatePricing(
                    product.price,
                    product.special_price
                  );

                return (
                  <SwiperSlide key={product._id}>
                    <div className="rounded-xl bg-linear-120 from-yellow-200 to-pink-200 p-2 md:p-4 h-auto flex flex-col">
                      <Link
                        href={`/product/${product.slug}`}
                        className="bg-white rounded-lg p-3 flex justify-center items-center h-[160px] sm:h-[220px] md:h-[200px] lg:h-[220px] overflow-hidden relative w-full shrink-0"
                      >
                        <img
                          src={
                            product.images?.[0]
                              ? `/uploads/products/${product.images[0]}`
                              : "/assets/images/no-image.png"
                          }
                          alt={product.name || "Product Image"}
                          className="object-contain max-h-full max-w-full w-auto h-auto transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/images/no-image.png";
                          }}
                        />
                      </Link>

                      <div className="mt-3 flex flex-col flex-1 justify-between text-sm">
                        <div className="mb-1">
                          <Link href={`/brand/${brandMap[product.brand]?.name?.toLowerCase().replace(/\s+/g, "-") || ""}`} className="hover:opacity-80">
                            {/* BRAND IMAGE - uncomment when ready
                            {brandMap[product.brand]?.image ? (
                              <img
                                src={brandMap[product.brand].image.startsWith('/') ? brandMap[product.brand].image : `/uploads/Brands/${brandMap[product.brand].image}`}
                                alt={brandMap[product.brand]?.name || "Brand"}
                                className="object-contain mix-blend-multiply h-[22px] max-w-[55px]"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Brand: {brandMap[product.brand]?.name || ""}
                              </span>
                            )}
                            */}
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              Brand: {brandMap[product.brand]?.name || ""}
                            </span>
                          </Link>
                        </div>
                        <p className="font-semibold line-clamp-2 min-h-[40px] text-md">
                          {product.name}
                        </p>


                        <div className="flex flex-wrap items-center gap-2 w-full py-2">

                          <div>
                            {/* Selling Price */}
                            <span className="font-bold text-xs sm:text-[15px] px-1 py-2">₹ {sell.toLocaleString('en-IN')}</span>

                            {/* MRP */}
                            {mrp && (
                              <span className="text-red-500 fold-semilod line-through px-1 py-2 text-[9px] sm:text-xs">
                                ₹ {mrp.toLocaleString('en-IN')}
                              </span>
                            )}

                          </div>
                          {/* Discount */}
                          {mrp && (
                            <span className="bg-green-600 text-white text-[9px] sm:text-[10px] font-semibold px-1 py-1 rounded-md 
                                w-auto mt-1 sm:mt-0">
                              {discount}% Off
                            </span>
                          )}
                        </div>
                        <div className="w-auto inline-flex items-center gap-2 mt-2">
                          <Addtocart
                            productId={product._id}
                            stockQuantity={product.quantity}
                            special_price={product.special_price}
                            className="text-xs sm:text-sm py-1.5 sm:py-2 w-auto inline-block"
                          />

                          <a
                            href={`https://wa.me/919047048777?text=${encodeURIComponent(
                              `Check Out This Product: ${typeof window !== "undefined" ? window.location.origin : ""
                              }/product/${product.slug}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full inline-flex items-center justify-center w-auto"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
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
      </div>
    </section>
  );
}
