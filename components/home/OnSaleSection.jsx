"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Addtocart from "@/components/AddToCart";

export default function OnSaleSection({ excludeIds = [], onLoaded }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [brandMap, setBrandMap] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  // Scroll controls for products row (slides 1 full 4-grid page)
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      if (clientWidth > 0) {
        const pageIndex = Math.round(scrollLeft / clientWidth);
        setCurrentSlide(pageIndex);
      }
    }
  };

  // 🔥 Pricing Logic
  const calculatePricing = (price, special) => {
    const p = Number(price);
    const s = Number(special);

    if (!s || s <= 0) {
      return { sell: p, mrp: null, discount: 0 };
    }

    let mrp = p === s ? Math.round(s * 1.1) : p;
    const discount = Math.max(1, Math.round(100 - (s / mrp) * 100));

    return { sell: s, mrp, discount };
  };

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch("/api/brand");
        const result = await res.json();
        if (!result.error && Array.isArray(result.data)) {
          const map = {};
          result.data.forEach((b) => {
            map[b._id] = { name: b.brand_name, image: b.image };
          });
          setBrandMap(map);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    fetch("/api/home/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setCategories(data);
          loadProducts(data[0]._id, data[0]?.category_name);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, [JSON.stringify(excludeIds)]);

  const loadProducts = async (slug, name) => {
    setActiveCat(slug);
    setSelectedProduct(name);
    setCurrentSlide(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "instant" });
    }
    try {
      const excludeQuery =
        Array.isArray(excludeIds) && excludeIds.length > 0
          ? `&exclude=${excludeIds.join(",")}`
          : "";
      const res = await fetch(`/api/home/onsale?category=${slug}${excludeQuery}`);
      const data = await res.json();
      const productList = data.data || [];
      setProducts(productList);
      if (onLoaded && productList.length > 0) {
        onLoaded(productList.map((p) => p._id));
      }
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // Chunk products into groups of 4 (for 2x2 grid on mobile & 4-col row on desktop)
  const productPages = [];
  for (let i = 0; i < products.length; i += 4) {
    productPages.push(products.slice(i, i + 4));
  }

  return (
    <section className="w-full inner-section-padding bg-linear-to-r from-linearyellow via-white to-linearyellow py-8 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:border-none max-sm:shadow-none max-sm:bg-[#f0fdf4] max-sm:p-3 max-sm:rounded-2xl max-sm:mx-2 max-sm:my-3 max-sm:w-auto">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-4 max-sm:mb-3 px-1">
        <h2 className="text-xl text-primary font-bold max-sm:text-base">
          Fast Moving Products of{" "}
          <span className="text-2xl text-red-700 max-sm:text-base font-extrabold">
            {selectedProduct}
          </span>
        </h2>
        <div className="hidden max-sm:flex w-7 h-7 bg-black text-white rounded-full items-center justify-center font-bold text-xs shrink-0">
          ➔
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-6 gap-y-4 items-start">
        {/* LEFT CATEGORY LIST / TABS */}
        <div className="space-y-3 relative z-10">
          <div className="lg:grid lg:grid-rows-7 lg:gap-y-3 flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide pb-2 pt-1 px-0.5">
            {categories.map((cat) => {
              const isActive = activeCat === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => loadProducts(cat._id, cat.category_name)}
                  className={`shrink-0 cursor-pointer snap-start transition-all duration-200 outline-none flex items-center justify-center sm:justify-start border-2 rounded-full bg-white pl-2 pr-3.5 py-1.5 ${isActive
                      ? "border-red-600 text-red-600 font-bold shadow-sm ring-1 ring-red-600/30"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 font-medium"
                    }`}
                >
                  <div className="bg-white rounded-full overflow-hidden w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                    {cat.image ? (
                      <img
                        src={
                          cat.image.startsWith("http") ||
                            cat.image.startsWith("/")
                            ? cat.image
                            : `/uploads/category/${cat.image}`
                        }
                        alt={cat.category_name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>

                  <span className="text-xs sm:text-sm ml-1.5 sm:ml-2 whitespace-nowrap truncate">
                    {cat.category_name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MOBILE CATEGORY INDICATOR DOTS */}
          <div className="flex md:hidden items-center justify-center gap-1.5 mt-1 mb-1">
            {categories.map((cat) => (
              <span
                key={cat._id}
                className={`transition-all duration-300 rounded-full ${activeCat === cat._id
                    ? "w-6 h-1.5 bg-black"
                    : "w-1.5 h-1.5 bg-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT PRODUCT AREA (2x2 GRID ON MOBILE, 1x4 ON DESKTOP PER SLIDE) */}
        <div className="relative z-10 col-span-3 min-w-0 max-sm:bg-white max-sm:p-2.5 max-sm:rounded-2xl max-sm:border max-sm:border-emerald-100/80 max-sm:shadow-xs">
          {/* RED SLIDE NAVIGATION BUTTONS */}
          {productPages.length > 1 && (
            <>
              <button
                onClick={scrollLeft}
                aria-label="Previous Products"
                className="absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 bg-red-600 hover:bg-red-700 active:scale-95 text-white border-2 border-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={scrollRight}
                aria-label="Next Products"
                className="absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 bg-red-600 hover:bg-red-700 active:scale-95 text-white border-2 border-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* SLIDING HORIZONTAL PAGES CONTAINER */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide w-full py-1"
          >
            {productPages.map((page, pageIdx) => (
              <div
                key={pageIdx}
                className="w-full shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 snap-start px-0.5"
              >
                {page.map((p) => {
                  const { sell, mrp, discount } = calculatePricing(
                    p.price,
                    p.special_price
                  );

                  const productImgSrc = p.images?.[0]
                    ? p.images[0].startsWith("http") || p.images[0].startsWith("/")
                      ? p.images[0]
                      : `/uploads/products/${p.images[0]}`
                    : "/assets/images/no-image.png";

                  return (
                    <div
                      key={p._id}
                      className="rounded-xl bg-linear-120 from-yellow-200 to-pink-200 p-2.5 sm:p-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* PRODUCT IMAGE */}
                        <div className="bg-white rounded-lg p-2 flex items-center justify-center relative aspect-square mb-2 overflow-hidden">
                          <Link
                            href={`/product/${p.slug}`}
                            className="w-full h-full flex items-center justify-center"
                          >
                            <img
                              src={productImgSrc}
                              alt={p.name}
                              className="object-contain max-h-full w-auto max-w-full hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "/assets/images/no-image.png";
                              }}
                            />
                          </Link>
                        </div>

                        {/* BRAND & TITLE */}
                        <div>
                          {brandMap[p.brand] && (
                            <Link
                              href={`/brand/${brandMap[p.brand]?.name
                                ?.toLowerCase()
                                .replace(/\s+/g, "-")}`}
                              className="hover:opacity-80 block mb-0.5"
                            >
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate block">
                                BRAND: {brandMap[p.brand]?.name || ""}
                              </span>
                            </Link>
                          )}

                          <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 text-gray-900 min-h-[2rem] sm:min-h-[2.5rem]">
                            <Link
                              href={`/product/${p.slug}`}
                              className="hover:text-red-600 transition-colors"
                            >
                              {p.name}
                            </Link>
                          </h3>
                        </div>
                      </div>

                      {/* PRICE & ACTIONS */}
                      <div className="mt-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                          <span className="text-red-600 font-extrabold text-xs sm:text-sm">
                            ₹{sell.toLocaleString("en-IN")}
                          </span>

                          {mrp && (
                            <span className="text-gray-400 line-through text-[10px] sm:text-xs">
                              ₹{mrp.toLocaleString("en-IN")}
                            </span>
                          )}

                          {discount > 0 && (
                            <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                              {discount}% Off
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 w-full">
                          <Addtocart
                            productId={p._id}
                            stockQuantity={p.quantity}
                            special_price={p.special_price}
                            category={p.category}
                            className="flex-1 text-[11px] sm:text-sm py-1.5"
                          />

                          <a
                            href={`https://wa.me/919047048777?text=${encodeURIComponent(
                              `Check Out This Product: ${typeof window !== "undefined"
                                ? window.location.origin
                                : ""
                              }/product/${p.slug}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Contact on WhatsApp"
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full flex items-center justify-center shrink-0 transition"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 32 32"
                              fill="currentColor"
                            >
                              <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {!products.length && (
              <p className="w-full text-center text-gray-500 py-8">
                No products available
              </p>
            )}
          </div>

          {/* PRODUCT SLIDE INDICATOR DOTS */}
          {productPages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 mb-1">
              {productPages.map((_, idx) => (
                <span
                  key={idx}
                  className={`transition-all duration-300 rounded-full ${currentSlide === idx
                      ? "w-6 h-1.5 bg-red-600"
                      : "w-1.5 h-1.5 bg-gray-300"
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

