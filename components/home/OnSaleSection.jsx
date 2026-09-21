"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Addtocart from "@/components/AddToCart";

export default function OnSaleSection() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [brandMap, setBrandMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Pricing Logic (Same as previous)
  const calculatePricing = (price, special) => {
    const p = Number(price);
    const s = Number(special);

    if (!s || s <= 0) {
      return { sell: p, mrp: null, discount: 0 };
    }

    let mrp = p;

    // If price equals special_price → add 10% to MRP
    if (p === s) {
      mrp = Math.round(s * 1.1);
    }

    const discount = Math.max(1, Math.round(100 - (s / mrp) * 100));

    return { sell: s, mrp, discount };
  };

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
    fetch("/api/home/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length) {
          loadProducts(data[0]._id, data[0]?.category_name);
          setSelectedProduct(data[0]?.category_name);
        }
      });
  }, []);

  const loadProducts = async (slug, name) => {
    setActiveCat(slug);
    setSelectedProduct(name);
    const res = await fetch(`/api/home/onsale?category=${slug}`);
    const data = await res.json();
    setProducts(data.data || []);
  };



  return (
    <section className="w-full inner-section-padding bg-linear-to-r from-linearyellow via-white to-linearyellow py-10 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:border-none max-sm:shadow-none max-sm:bg-[#f0fdf4] max-sm:p-3.5 max-sm:rounded-2xl max-sm:mx-3 max-sm:my-4 max-sm:w-auto">
      <div className="flex items-center justify-between mb-5 max-sm:mb-3">
        <h2 className="text-xl text-primary max-sm:text-gray-900 font-bold max-sm:text-lg">
          Fast Moving Products of{" "}
          <span className="text-2xl text-red-800 max-sm:text-lg">
            {selectedProduct}
          </span>
        </h2>
        <div className="hidden max-sm:flex w-7 h-7 bg-black text-white rounded-full items-center justify-center font-bold text-xs shrink-0">
          ➔
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 gap-y-4 items-start">

        {/* LEFT CATEGORY LIST */}
        <div className="space-y-4 text-center z-40">
          <div className="lg:grid lg:grid-rows-7 lg:gap-y-3.5 flex gap-x-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide pb-2 pt-1 px-1">
            {categories.map((cat) => (
              <div
                key={cat._id}
                onClick={() =>
                  loadProducts(cat._id, cat.category_name)
                }
                className="shrink-0 max-sm:w-[calc(50%-0.35rem)] cursor-pointer snap-start"
              >
                <div className={`flex items-center justify-center sm:justify-start border-2 rounded-full bg-white transition-all pl-2 pr-3 py-1.5 ${
                  activeCat === cat._id ? "border-primary shadow-sm" : "border-gray-200"
                }`}>
                  <div className="bg-white rounded-full overflow-hidden w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                    {cat.image ? (
                      <img
                        src={
                          cat.image.startsWith("http") || cat.image.startsWith("/")
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

                  <span className="text-red-600 font-bold text-xs sm:text-sm ml-1.5 sm:ml-2 whitespace-nowrap truncate">
                    {cat.category_name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* MOBILE INDICATOR DOTS */}
          <div className="flex md:hidden items-center justify-center gap-1.5 mt-2 mb-1">
            {categories.map((cat) => (
              <span
                key={cat._id}
                className={`transition-all duration-300 rounded-full ${
                  activeCat === cat._id
                    ? "w-6 h-1.5 bg-black"
                    : "w-1.5 h-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* PRODUCT AREA */}
        <div className="relative z-0 col-span-3 max-sm:bg-white max-sm:p-3 max-sm:rounded-2xl max-sm:border max-sm:border-emerald-100/80 max-sm:shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 max-sm:gap-2.5 auto-rows-fr">
            {products.map((p) => {
              const { sell, mrp, discount } =
                calculatePricing(p.price, p.special_price);

              const productImgSrc = p.images?.[0]
                ? p.images[0].startsWith("http") || p.images[0].startsWith("/")
                  ? p.images[0]
                  : `/uploads/products/${p.images[0]}`
                : "/assets/images/no-image.png";

              return (
                <div
                  key={p._id}
                  className="bg-white rounded-xl shadow-lg max-sm:shadow-none max-sm:border max-sm:border-gray-100 p-4 max-sm:p-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-[#f8f9fa] rounded-lg p-2 flex items-center justify-center relative aspect-square mb-2">
                      <Link href={`/product/${p.slug}`} className="w-full h-full flex items-center justify-center">
                        <img
                          src={productImgSrc}
                          alt={p.name}
                          className="object-contain max-h-full w-auto max-w-full"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/images/no-image.png";
                          }}
                        />
                      </Link>
                    </div>

                    <div>
                      {brandMap[p.brand] && (
                        <Link
                          href={`/brand/${brandMap[p.brand]?.name?.toLowerCase().replace(/\s+/g, "-")}`}
                          className="hover:opacity-80 block mb-1"
                        >
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">
                            BRAND: {brandMap[p.brand]?.name || ""}
                          </span>
                        </Link>
                      )}

                      <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 text-gray-900">
                        <Link href={`/product/${p.slug}`}>
                          {p.name}
                        </Link>
                      </h3>
                    </div>
                  </div>

                  <div className="mt-2">
                    {/* PRICE SECTION */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-red-600 font-extrabold text-xs sm:text-sm">
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
                            `Check Out This Product: ${
                            typeof window !== "undefined"
                                ? window.location.origin
                                : ""
                            }/product/${p.slug}`
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
              );
            })}

            {!products.length && (
              <p className="col-span-full text-center text-gray-500 py-6">
                No products available
              </p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
