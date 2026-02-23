"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Addtocart from "@/components/AddToCart";
import Swiper from "swiper";
import "swiper/css";

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

    // Random discount between 9% and 15%
    const randomDiscount =
      Math.floor(Math.random() * (15 - 9 + 1)) + 9;

    return { sell: s, mrp, discount: randomDiscount };
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
    new Swiper(".onsale-product-swiper", {
      slidesPerView: 1,
      navigation: {
        nextEl: ".onsale-product-nav-next",
        prevEl: ".onsale-product-nav-prev",
      },
    });
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
    <section className="w-full inner-section-padding bg-linear-to-r from-linearyellow via-white to-linearyellow py-10 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <h2 className="text-xl text-primary font-bold mb-2">
        Fast Moving Products of{" "}
        <span className="text-2xl text-red-800">
          {selectedProduct}
        </span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 gap-y-4 items-start">

        {/* LEFT CATEGORY LIST */}
        <div className="space-y-4 text-center lg:text-left z-50">
          <div className="lg:grid lg:grid-rows-7 lg:gap-y-2.5 flex gap-x-2.5 overflow-x-auto">
            {categories.map((cat) => (
              <div
                key={cat._id}
                onClick={() =>
                  loadProducts(cat._id, cat.category_name)
                }
                className="shrink-0 cursor-pointer"
              >
                <div className="flex items-center border-2 rounded-full bg-white border-primary">
                  <div className="bg-white rounded-full overflow-hidden w-fit h-fit">
                    <Image
                      src={cat.image}
                      alt={cat.category_name}
                      width={50}
                      height={50}
                    />
                  </div>

                  <span className="max-lg:pr-2.5 text-red-600 font-bold text-sm ml-4">
                    {cat.category_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCT AREA */}
        <div className="relative z-0 col-span-2">
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3.5 auto-rows-fr">

            {products.map((p) => {
              const { sell, mrp, discount } =
                calculatePricing(p.price, p.special_price);

              return (
                <div
                  key={p._id}
                  className="bg-white rounded-xl shadow-lg p-4 flex gap-4 h-full"
                >
                  <Link href={`/product/${p.slug}`}>
                    <Image
                      src={`/uploads/products/${p.images?.[0]}`}
                      alt="Product image"
                      width={112}
                      height={112}
                      className="object-contain shrink-0"
                    />
                  </Link>

                  <div className="flex flex-col justify-between w-full min-h-full">

                    <div>
                      <p className="mb-2 text-sm text-gray-500">
                        {brandMap[p.brand] && (
                          <Link
                            href={`/brand/${brandMap[
                              p.brand
                            ]?.toLowerCase().replace(/\s+/g, "-")}`}
                            className="hover:text-red-600"
                          >
                            Brand: {brandMap[p.brand]}
                          </Link>
                        )}
                      </p>

                      <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                        <Link href={`/product/${p.slug}`}>
                          {p.name}
                        </Link>
                      </h3>
                    </div>

                    <ul className="text-gray-500 mt-2 text-xs line-clamp-3">
                      {p.specs?.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>

                    {/* 🔥 PRICE SECTION */}
                    <div className="mt-2 ">
                      <span className="text-red-600 font-bold text-lg px-2 py-2">
                        ₹ {sell}
                      </span>

                      {mrp && (
                        <>
                          <span className="text-gray-500 line-through ml-2 px-2 py-2">
                            ₹ {mrp}
                          </span>

                          <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md ml-2">
                            {discount}% Off
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <Addtocart
                        productId={p._id}
                        stockQuantity={p.quantity}
                        special_price={p.special_price}
                        category={p.category}
                        className="flex-1 text-xs sm:text-sm py-1.5 sm:py-2"
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

            {!products.length && (
              <p className="col-span-2 text-center text-gray-500">
                No products available
              </p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}