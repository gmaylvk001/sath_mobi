"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import Addtocart from "@/components/AddToCart";

import "swiper/css";
import "swiper/css/pagination";


export default function NewlyArrivedSection() {
  const [product, setProduct] = useState(null);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    fetch("/api/home/new-arrived")
      .then(res => res.json())
      .then(data => {
        if (data.success) setProduct(data.product);
      });
  }, []);

  if (!product) return null;

  return (
     <>
     <section className="w-full inner-section-padding bg-linear-to-r from-linearyellow via-white to-linearyellow py-5 border border-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <h2 className="text-primary font-semibold text-2xl mb-4">
        Newly Arrived
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">

        {/* LEFT: PRODUCT IMAGE */}
        <div className="flex flex-col items-center">
        <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop
            className="w-full max-w-[320px]"
        >
            {product.images?.map((img, index) => (
            <SwiperSlide key={index}>
                <Link href={`/product/${product.slug}`}>
                <div className="flex justify-center items-center ">
                    <Image
                    src={`/uploads/products/${img}`}
                    alt={`${product.name} ${index + 1}`}
                    width={320}
                    height={500}
                    className="object-contain cursor-pointer"
                    priority={index === 0}
                    />
                </div>
                </Link>
            </SwiperSlide>
            ))}
        </Swiper>
        </div>

        {/* MIDDLE: PRODUCT HIGHLIGHTS */}
        <div>
          <h3 className="text-primary text-2xl font-semibold mb-4">
            Product Highlights
          </h3>

          <ul
            className={`productHighlights transition-all duration-300 overflow-hidden ${
              showHighlights ? "max-h-[600px]" : "max-h-[250px]"
            }`}
          >
            {product.product_highlights?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {product.product_highlights?.length > 3 && (
            <button
              onClick={() => setShowHighlights(!showHighlights)}
              className="text-primary text-sm font-semibold mt-2 hover:underline"
            >
              {showHighlights ? "View Less" : "View More"}
            </button>
          )}
        </div>

        {/* RIGHT: PRODUCT FEATURES */}
        <div className="md:col-span-2 lg:col-span-1">
          <h3 className="text-primary font-semibold text-2xl mb-4">
            Product Features
          </h3>

          <ul
            className={`productFeatures transition-all duration-300 overflow-hidden ${
              showFeatures ? "max-h-[600px]" : "max-h-[250px]"
            }`}
          >
            {product.features?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {product.features?.length > 3 && (
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="text-primary text-sm font-semibold mt-2 hover:underline"
            >
              {showFeatures ? "View Less" : "View More"}
            </button>
          )}

          {/* PRICE + CTA */}

          <div className="mt-6">
            {/*
            <p className="text-xl font-bold text-black">
              ₹ {product.special_price || product.price}
            </p>
            
            <Link
              href={`/product/${product.slug}`}
              className="inline-block mt-3 bg-primary text-white px-5 py-2 rounded-lg hover:opacity-90 transition"
            >
              View Product
            </Link>
            */}
          </div>
        </div>

      </div>
    </section>
     {/* ===== CUSTOM STYLES ===== */}
      <style jsx>{`

      .swiper-pagination-bullet {
  background: #999;
  opacity: 1;
}

.swiper-pagination-bullet-active {
  background: #e11d48; /* primary/red */
}
        .banner-pagination {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.85);
          padding: 8px 12px;
          border-radius: 9999px;
        }
        .banner-pagination .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #999;
          transform: rotate(45deg);
          border-radius: 2px;
        }
        .banner-pagination .swiper-pagination-bullet-active {
          background: #fff;
          border: 2px solid var(--color-primary);
        }
          .productFeatures li,
            .productHighlights li {
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 8px;
            font-weight: 700;
            list-style: none;
            padding: 10px 10px;
            border-radius: 10px 50px 50px 10px;
            border: 2px solid var(--primary-color);
            background-color: #ffffff;
            position: relative;
            color: #585858;
            overflow: hidden;
            }

            .productFeatures li:not(:last-child),
            .productHighlights li:not(:last-child) {
            margin-bottom: 15px;
            }

            .productFeatures li::after,
            .productHighlights li::after {
            content: "";
            background-color: #eaa221;
            border-radius: 50px;
            width: 30px;
            height: 20px;
            position: absolute;
            top: -10px;
            left: -10px;
            }

            .productFeatures,
            .productHighlights {
            padding-left: 0;
            }

      `}</style>
       </>
  );
  
}
