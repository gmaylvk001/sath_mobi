"use client";

import { useEffect, useState  } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectCards } from "swiper/modules";
import Swiperr from "swiper";
import Link from 'next/link';
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-cards";
import VideoModal from "./VideoModal";
import BestSeller from '@/components/home/BestSeller';
import LatestProducts from '@/components/home/LatestProducts';
import OnSaleSection from '@/components/home/OnSaleSection';
import TopSellersSection from '@/components/home/TopSellersSection';
import NewlyArrivedSection from '@/components/home/NewlyArrivedSection';
import BrandSlider from '@/components/home/BrandSlider';

const videos = [
  {
    id: "vtSFhuZCde4",
    title: "Mobileனா நம்ம சத்யாதான்! | Buy the Latest Mobiles at SATHYA!",
  },
  {
    id: "XmgjuO14qdM",
    title: "Sathya Tirupati 2nd Anniversary Super Sale 🎁 Assured Gifts + Chairs Offer | Jan 26",
  },
  {
    id: "aOTjbRi4yDY",
    title: "உங்கள் சத்யா பொம்மிடியில் , ஷோரூமின் 2ஆம் ஆண்டு துவக்க விழா சிறப்பு விற்பனை",
  },
  {
    id: "iZMbSWuTlV0",
    title: "🪁✨ Biggest Sankranthi Sale at Sathya | Up to 70% OFF 🛍️🎁",
  },
];



export default function HomePage() {

  const brands = [
  "daikin",
  "general",
  "haier",
  "lg",
  "panasonic",
  "samsung",
  "onida",
  "sony",
];

const [activeVideo, setActiveVideo] = useState(null);
const [isBrandsLoading, setIsBrandsLoading] = useState(true);
const fetchBrands = async () => {
        setIsBrandsLoading(true);
        try {
            const response = await fetch('/api/brand/get');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.success) {
                setBrands(data.brands || []);
            }
        } catch (error) {
            console.error("Error fetching brands:", error);
            setBrands([]);
        } finally {
            setIsBrandsLoading(false);
        }
    };

const openVideo = (videoId) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

   useEffect(() => {
    new Swiperr(".onsale-product-swiper", {
      slidesPerView: 1,
      navigation: {
        nextEl: ".onsale-product-nav-next",
        prevEl: ".onsale-product-nav-prev",
      },
    });
  }, []);

  /* Reusable Card */
function CategoryCard({ image, title, bg }) {
  return (
    <div className={`rounded-2xl overflow-hidden relative ${bg}`}>
      <Image
        src={image}
        alt={title}
        width={600}
        height={450}
        className="w-full h-full object-contain aspect-[4/3]"
      />
      <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">
        {title}
      </span>
    </div>
  );
}

  return (
    
    <>
      {/* ================= FULL IMAGE BANNER ================= */}
      <section className="w-full overflow-hidden relative">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true, el: ".banner-pagination" }}
          speed={800}
          className="bannerSwiper"
        >
          <SwiperSlide>
            <Image
              src="/assets/images/main-banner-1.webp"
              alt="Banner 1"
              width={1920}
              height={600}
              className="w-full h-full object-cover"
            />
          </SwiperSlide>

          <SwiperSlide>
            <Image
              src="/assets/images/main-banner-3.webp"
              alt="Banner 2"
              width={1920}
              height={600}
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        </Swiper>

        <div className="swiper-pagination banner-pagination" style={{ 
              width: `5%`,
            }}></div>
      </section>

      {/* ================= BANK OFFER STRIP ================= */}
      <section className="w-full bg-white border-dotted border-b">
        <div className="mx-5 py-4 ">
          <div className="flex gap-4 overflow-x-auto items-center justify-between">
            {[
              "hsbc",
              "sbi-card",
              "onecard",
              "dbs",
              "bob-card",
            ].map((bank) => (
              <div
                key={bank}
                className="w-[235px] shrink-0 flex items-center gap-3 border rounded-xs border-gray-400 px-4 py-2 bg-white"
              >
                <Image
                  src={`/assets/images/banks/${bank}.svg`}
                  alt={bank}
                  width={60}
                  height={24}
                  className="h-6 object-contain border-r px-2 border-dotted"
                />
                <div className="text-xs leading-none">
                  <p className="text-[10px]">
                    5% Instant Discount Upto Rs.10,000 on Credit Card EMI
                  </p>
                  <p className="text-gray-400 text-[11px]">*T&C apply</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHAT'S HOT ================= */}
      <section className="inner-section-padding mt-5 mb-10">
        <h2 className="text-primary font-bold text-2xl mb-3">What&apos;s Hot</h2>

        <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-4">
          {[
            "/category/air-conditioner",
            "/category/mobiles",
            "/category/accessories",
            "/category/laptop-desktops",
          ].map((link, index) => (
            <Link href={link} key={index}>
              <Image
                src={`/assets/images/latest-sm-${index + 1}.png`}
                alt="Hot item"
                width={400}
                height={400}
                className="rounded-xl w-full h-full cursor-pointer hover:scale-105 transition-transform"
              />
            </Link>
          ))}
        </div>
      </section>

       {/* ================= BEST SELLERS ================= */}    
      <BestSeller />

        <div className="inner-section-padding my-10">
          <div className="my-0 rounded-2xl overflow-hidden">
            <Link href="/category/mobiles">
            <Image
              src="/assets/images/banner-w-pt-m-st.png"
              alt="Sony Banner"
              width={1400}
              height={400}
              className="w-full h-auto rounded-2xl"
            />
            </Link>
          </div>
        </div>

          {/* ================= Latest Products ================= */}  
        <LatestProducts />
    

    {/* TOP BANNER */}
      <div className="inner-section-padding my-10">
        <div className="my-0 rounded-2xl overflow-hidden">
          <Link href="/category/air-conditioner">
          <Image
            src="/assets/images/test-banner-w-pt.png"
            alt="AC"
            width={1400}
            height={400}
            className="w-full h-auto rounded-2xl"
            priority
          />
          </Link>
        </div>
        
      </div>

       {/* ================= Latest Products ================= */}  
        <OnSaleSection />

     

      <section className="inner-section-padding py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT BIG BANNER */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-black min-h-[260px] lg:min-h-[420px]">
          <Link href="/category/smart-tv">
            <Image
              src="/assets/images/all-tv-image.png"
              alt="All LED"
              fill
              className="object-cover opacity-80"
              priority
            />
        </Link>
          <div className="relative z-10 p-6 lg:p-10 h-full flex flex-col justify-between">
            <Link href="/category/smart-tv">
            <h3 className="text-white text-2xl font-semibold">All LED</h3>
            </Link>
          </div>
        </div>

        {/* RIGHT GRID */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* QLED */}
          <Link href="/category/qled">
            <CategoryCard
              image="/assets/images/qled-img.webp"
              title="QLED"
              bg="bg-gray-800"
            />
          </Link>
          {/* QNED */}
          <Link href="/category/led-hd">
          <CategoryCard
            image="/assets/images/qned.webp"
            title="QNED"
            bg="bg-blue-900"
          />
          </Link>
          {/* OLED */}
          <Link href="/category/ultra-hd">
          <CategoryCard
            image="/assets/images/oled.webp"
            title="OLED"
            bg="bg-gray-700"
          />
          </Link>
          {/* HD READY */}
          <Link href="/category/led-hd">
          <CategoryCard
            image="/assets/images/hdready-Photoroom.png"
            title="HD READY"
            bg="bg-gray-600"
          />
          </Link>
        </div>
      </div>
    </section>

{/* ================= Top Sellers Section Products ================= */}  
        <TopSellersSection />


     {/* TOP BANNER */}
      <div className="inner-section-padding my-10">
        <div>
          <Link href="/aboutus">
            <Image
              src="/assets/images/channels4_banner.jpg"
              alt="Sony Banner"
              width={1920}
              height={600}
              className="rounded-2xl w-full h-auto"
              priority
            />
          </Link>
        </div>
      </div>



      {/* NEWLY ARRIVED SECTION */}
          <NewlyArrivedSection />
      
      {/* NEWLY Brand Slider SECTION */}
          <BrandSlider />

     
    <section className="w-full inner-section-padding py-5">
        <h2 className="text-primary mb-5 text-2xl font-bold">
          What&apos;s Trending
        </h2>

        <Swiper
          slidesPerView={1}
          breakpoints={{
            450: { slidesPerView: 2, spaceBetween: 20 },
            820: { slidesPerView: 3, spaceBetween: 20 },
            1200: { slidesPerView: 4, spaceBetween: 20 },
          }}
        >
          {videos.map((video) => (
            <SwiperSlide key={video.id} className="!h-auto flex">
              <div className="border-2 border-primary rounded-lg overflow-hidden flex flex-col w-full">
                <button
                  onClick={() => setActiveVideo(video.id)}
                  className="relative w-full border-b-2 border-primary"
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    className="w-full aspect-video object-cover"
                    alt="" 
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-pink-100 shadow-lg text-primary rounded-full w-10 h-10 flex items-center justify-center">
                      <i className="fi fi-sr-play"></i>
                    </span>
                  </span>
                </button>

                <div className="text-primary p-2 text-[10px] md:text-xs font-bold text-center flex-1 flex items-center justify-center">
                  {video.title}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className="w-full inner-section-paddy py-5 mt-10 bg-linear-to-r from-primelinear from-0% via-white via-50% to-primelinear to-100%">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">

        {/* Feature 1 */}
        <div className="flex items-center justify-center gap-5">
          <Image
            src="/assets/images/shipped.webp"
            alt="Fast Delivery"
            width={60}
            height={60}
            className="max-sm:w-[40px]"
          />
          <div className="text-left">
            <p className="font-semibold mb-1 max-sm:text-xs">Fast Delivery</p>
            <span className="text-sm max-sm:text-[10px] text-gray-500">
              Quick &amp; Reliable
            </span>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex items-center justify-center gap-5">
          <Image
            src="/assets/images/payment-protection.webp"
            alt="Safe Payments"
            width={60}
            height={60}
            className="max-sm:w-[40px]"
          />
          <div className="text-left">
            <p className="font-semibold mb-1 max-sm:text-xs">Safe Payments</p>
            <span className="text-sm max-sm:text-[10px] text-gray-500">
              Secure Checkout
            </span>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex items-center justify-center gap-5">
          <Image
            src="/assets/images/tag.webp"
            alt="Quality Products"
            width={60}
            height={60}
            className="max-sm:w-[40px]"
          />
          <div className="text-left">
            <p className="font-semibold mb-1 max-sm:text-xs">Quality Products</p>
            <span className="text-sm max-sm:text-[10px] text-gray-500">
              Top Quality
            </span>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="flex items-center justify-center gap-5">
          <Image
            src="/assets/images/service.webp"
            alt="Help Center"
            width={60}
            height={60}
            className="max-sm:w-[40px]"
          />
          <div className="text-left">
            <p className="font-semibold mb-1 max-sm:text-xs">Help Center</p>
            <span className="text-sm max-sm:text-[10px] text-gray-500">
              24/7 Support
            </span>
          </div>
        </div>

      </div>
    </section>

      {/* Video Modal */}
      <VideoModal
        videoId={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      {/* ===== CUSTOM STYLES ===== */}
      <style jsx>{`
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
  font-size: 20px;
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
