"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Addtocart from "@/components/AddToCart";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";

export default function TopSellersSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandMap, setBrandMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // ✅ PRICE LOGIC (9%–15% RANDOM DISCOUNT)
  const getPriceData = (product) => {
    const basePrice = Number(product.price || 0);
    const specialPrice = Number(product.special_price || 0);

    let finalPrice = specialPrice || basePrice;
    let originalPrice = basePrice;

    // If no real offer → generate fake 9%–15% discount
    if (!specialPrice || basePrice === specialPrice) {
      const randomDiscount = Math.floor(Math.random() * 7) + 9; // 9–15%
      originalPrice = Math.round(finalPrice * (1 + randomDiscount / 100));
    }

    const discountPercent = Math.round(
      100 - (finalPrice / originalPrice) * 100
    );

    return { finalPrice, originalPrice, discountPercent };
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
        console.error("Error fetching brands:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetch("/api/home/top-sellers")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="w-full inner-section-padding bg-linear-to-r from-linearyellow via-white to-linearyellow py-10 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 lg:gap-8 items-center">

        {/* LEFT LIST */}
        <div className="space-y-4 text-center md:col-span-2 lg:col-span-1 lg:text-left z-50">
          <h2 className="text-2xl text-primary font-bold">
            New Trending&apos;s of Sathya
          </h2>

          <div className="grid grid-rows-3 gap-y-2.5">
            {products.slice(0, 3).map((product, i) => {
              const { finalPrice, originalPrice, discountPercent } =
                getPriceData(product);

              return (
                <div
                  key={i}
                  className="flex items-center rounded-xl bg-linear-to-tr from-pink-200 to-orange-200 p-3"
                >
                  <div className="bg-white rounded-xl overflow-hidden shrink-0">
                    <Link href={`/product/${product.slug}`}>
                      <Image
                        src={`/uploads/products/${product.images?.[0]}`}
                        alt={product.name}
                        width={130}
                        height={130}
                      />
                    </Link>
                  </div>

                  <div className="ml-4">
                    <h4 className="text-xs text-gray-500 uppercase truncate">
                      <Link
                        href={`/brand/${brandMap[product.brand]
                          ?.toLowerCase()
                          .replace(/\s+/g, "-") || ""}`}
                        className="hover:text-red-600"
                      >
                        Brand: {brandMap[product.brand] || ""}
                      </Link>
                    </h4>

                    <p className="font-semibold text-sm mb-2 line-clamp-2">
                      <Link href={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    </p>

                    {/* PRICE */}
                    <div className="flex items-center flex-wrap gap-x-2 p">
                      <span className="font-bold text-lg">
                        ₹ {finalPrice}
                      </span>

                      {originalPrice > finalPrice && (
                        <>
                          <span className="text-red-500 line-through">
                            ₹ {originalPrice}
                          </span>

                          <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                            {discountPercent}% Off
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <Addtocart
                        productId={product._id}
                        stockQuantity={product.quantity}
                        special_price={product.special_price}
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
              );
            })}
          </div>
        </div>

        {/* CENTER SLIDER */}
        <div className="relative col-span-2 pt-10">
          <div className="topselling-prev absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer z-50">
            <i className="fi fi-ss-angle-small-left text-white" />
          </div>

          <div className="topselling-next absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer z-50">
            <i className="fi fi-ss-angle-small-right text-white" />
          </div>

          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".topselling-next",
              prevEl: ".topselling-prev",
            }}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              550: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
            }}
          >
            {products.slice(3, 10).map((product, i) => {
              const { finalPrice, originalPrice, discountPercent } =
                getPriceData(product);

              return (
                <SwiperSlide key={i}>
                  <div className="rounded-xl bg-linear-120 from-yellow-200 to-pink-200 p-4 h-[430px] flex flex-col">
                    <div className="bg-white rounded-lg p-4 flex justify-center items-center h-[240px]">
                      <Link href={`/product/${product.slug}`}>
                        <Image
                          src={`/uploads/products/${product.images?.[0]}`}
                          alt={product.name}
                          width={240}
                          height={240}
                          className="object-contain max-h-full"
                        />
                      </Link>
                    </div>

                    <div className="mt-3 flex flex-col flex-1 justify-between">
                      <div>
                        <Link href={`/product/${product.slug}`}>
                          <p className="font-semibold text-sm mb-2 line-clamp-2">
                            {product.name}
                          </p>
                        </Link>

                        <h4 className="text-xs text-gray-500 uppercase truncate mb-1">
                          <Link
                            href={`/brand/${brandMap[product.brand]
                              ?.toLowerCase()
                              .replace(/\s+/g, "-") || ""}`}
                            className="hover:text-red-600"
                          >
                            Brand: {brandMap[product.brand] || ""}
                          </Link>
                        </h4>
                      </div>

                      {/* PRICE */}
                      <div>
                        <div className="flex items-center gap-x-2">
                          <span className="font-bold text-lg">
                            ₹ {finalPrice}
                          </span>

                          {originalPrice > finalPrice && (
                            <>
                              <span className="text-red-500 line-through">
                                ₹ {originalPrice}
                              </span>

                              <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                                {discountPercent}% Off
                              </span>
                            </>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <Addtocart
                            productId={product._id}
                            stockQuantity={product.quantity}
                            special_price={product.special_price}
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
      </div>
    </section>
  );
}