"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export default function BrandSlider() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/brand"); // API explained below
        const data = await res.json();
       // console.log('brands data:',data);
        if (data.success) setBrands(data.data);
      } catch (error) {
        console.error("Brand fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  if (loading || !brands.length) return null;

  return (
    <section className="w-full inner-section-padding py-10 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-5">
        <h5 className= "text-lg font-semibold">Shop by Brands</h5>

        {/*
        <Link
          href="/brand"
          className="bg-linear-120 from-red-600 to-red-800 text-black text-lg px-3 py-1 rounded"
        >
          View all
        </Link>
        */}
      </div>

      {/* SLIDER */}
      <div className="bg-linear-to-r from-primelinear to-yellow-200 p-4 rounded-lg">
        <Swiper
          modules={[Autoplay]}
          loop
          grabCursor
          freeMode={{ enabled: true, momentum: false }}
          speed={2000}
          autoplay={{
            delay: 1,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{
            400: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
            768: { slidesPerView: 5 },
            992: { slidesPerView: 6 },
            1200: { slidesPerView: 7 },
            1300: { slidesPerView: 8 },
          }}
        >
          {[...brands, ...brands].map((brand, index) => {
                if (!brand.image || brand.image.trim() === "") return null;

                return (
                    <SwiperSlide
                    key={`${brand._id}-${index}`}
                    className="flex justify-center"
                    >
                    <Link href={`/brand/${brand.brand_slug}`}>
                        <div className="bg-white rounded-xl p-3 flex items-center justify-center h-[60px] w-[120px] hover:shadow-md transition">
                        <Image
                            src={`/uploads/Brands/${brand.image}`}
                            alt={brand.brand_name}
                            width={90}
                            height={40}
                            className="object-contain"
                        />
                        </div>
                    </Link>
                    </SwiperSlide>
                );
                })}
        </Swiper>
      </div>
    </section>
  );
}
