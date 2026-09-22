"use client";

import { useEffect, useState } from "react";
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
    id: "E62B6Jjfy4s",
    title: "சத்யா மொபைல்ஸ்ன் புதிய ஷோரூம் ... at Tirupur ( (palladam main Road ) அக்டோபர் 14 முதல்",
  },
  {
    id: "gMrwZ8qaxMM",
    title: "சத்யா மொபைல்ஸ்ன் புதிய ஷோரூம் ...@ Tirupur (palladam main Road ) அக்டோபர் 14 முதல்",
  },
  {
    id: "NkOcJ91TqNQ",
    title: "🛍️🎁 Sathya Mobiles now @ Nagercoil. Buy #Smartphone & Get #Smartwatch @ just ₹500 only",
  },
  {
    id: "12KTBPkoJs0",
    title: "🪁✨ Sathya Mobiles now @ Nagercoil. Buy #Smartphone & Get #Smartwatch @ just ₹500 only",
  },
];



export default function HomePage() {
  const [heroBanners, setHeroBanners] = useState([]);
  const [isHeroLoading, setIsHeroLoading] = useState(true);

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
  const defaultHeroBanners = [
    {
      _id: "default-main-banner-2",
      banner_image: "/assets/images/main-banner-2.png",
      redirect_url: "",
      status: "Active",
    },
  ];
  const displayedHeroBanners = isHeroLoading ? defaultHeroBanners : heroBanners;
  const bannerPaginationWidth = `${Math.max(displayedHeroBanners.length * 2.5, 2.5)}%`;
  const isUploadedHeroImage = (imageUrl = "") =>
    String(imageUrl).startsWith("/uploads/topbanner/");
  const getVersionedHeroImage = (imageUrl = "", version = "") => {
    if (!isUploadedHeroImage(imageUrl)) return imageUrl;

    const filename = String(imageUrl).split("/").filter(Boolean).pop();
    if (!filename) return imageUrl;

    const dynamicImageUrl = `/api/topbanner?image=${encodeURIComponent(filename)}`;
    if (!version) return dynamicImageUrl;

    return `${dynamicImageUrl}&v=${encodeURIComponent(version)}`;
  };

  const fetchHeroBanners = async () => {
    setIsHeroLoading(true);

    try {
      const response = await fetch(`/api/topbanner?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (data.success) {
        const activeBanners = (data.banners || []).filter(
          (banner) => banner.status === "Active" && banner.banner_image
        );

        setHeroBanners(activeBanners.length > 0 ? activeBanners : defaultHeroBanners);
      } else {
        setHeroBanners(defaultHeroBanners);
      }
    } catch (error) {
      console.error("Error fetching hero banners:", error);
      setHeroBanners(defaultHeroBanners);
    } finally {
      setIsHeroLoading(false);
    }
  };

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
    fetchHeroBanners();
  }, []);

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
      {/* ================= FULL IMAGE BANNER (FLIPKART MOBILE CARD STYLE) ================= */}
      <section className="w-full overflow-hidden relative max-sm:px-3 max-sm:pt-2.5">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true, el: ".banner-pagination" }}
          speed={800}
          className="bannerSwiper max-sm:rounded-2xl max-sm:overflow-hidden max-sm:shadow-xs"
        >
          {displayedHeroBanners.map((banner, index) => {
            const isUploadedBanner = isUploadedHeroImage(banner.banner_image);
            const imageSrc = getVersionedHeroImage(
              banner.banner_image,
              banner.updatedAt || banner._id
            );
            const mobileImageSrc = banner.mobile_banner_image
              ? getVersionedHeroImage(
                banner.mobile_banner_image,
                banner.updatedAt || banner._id
              )
              : null;
            const image = isUploadedBanner ? (
              <picture className="block rounded-2xl max-sm:rounded-xl overflow-hidden">
                {mobileImageSrc && (
                  <source media="(max-width: 767px)" srcSet={mobileImageSrc} />
                )}
                <img
                  src={imageSrc}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover rounded-2xl max-sm:rounded-xl md:rounded-none"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
              </picture>
            ) : (
              <div className="block rounded-2xl max-sm:rounded-xl overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={`Banner ${index + 1}`}
                  width={1920}
                  height={600}
                  className="w-full h-full object-cover rounded-2xl max-sm:rounded-xl md:rounded-none"
                  priority={index === 0}
                />
              </div>
            );

            const isExternal = banner.redirect_url?.startsWith("http");

            return (
              <SwiperSlide key={banner._id || index}>
                {banner.redirect_url ? (
                  isExternal ? (
                    <a href={banner.redirect_url} target="_blank" rel="noreferrer" className="block rounded-2xl max-sm:rounded-xl overflow-hidden">
                      {image}
                    </a>
                  ) : (
                    <Link href={banner.redirect_url} className="block rounded-2xl max-sm:rounded-xl overflow-hidden">
                      {image}
                    </Link>
                  )
                ) : (
                  image
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="swiper-pagination banner-pagination"></div>
      </section>

      {/* ================= BANK OFFER STRIP ================= */}
      <section className="w-full bg-white max-sm:bg-transparent border-dotted border-b max-sm:border-none">
        <div className="mx-5 py-4 max-sm:mx-3 max-sm:py-2">
          {/* DESKTOP VIEW */}
          <div className="hidden md:flex gap-4 overflow-x-auto items-center justify-between">
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

          {/* MOBILE VIEW FLIPKART STYLE AUTO-SLIDING BANK OFFER CARDS */}
          <div className="block md:hidden bg-gradient-to-r from-blue-50/80 via-purple-50/60 to-pink-50/80 p-2.5 rounded-2xl border border-blue-100/70 shadow-xs">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Bank Offers &amp; Credit Card EMI Deals
              </span>
              <span className="text-[10px] font-semibold text-primary">Swipe ➔</span>
            </div>
            <Swiper
              modules={[Autoplay]}
              slidesPerView={1.15}
              spaceBetween={10}
              loop
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              speed={600}
              className="bankOfferSwiper"
            >
              {[
                { bank: "hsbc", name: "HSBC Bank" },
                { bank: "sbi-card", name: "SBI Card" },
                { bank: "onecard", name: "OneCard" },
                { bank: "dbs", name: "DBS Bank" },
                { bank: "bob-card", name: "BOB Card" },
              ].map((item) => (
                <SwiperSlide key={item.bank}>
                  <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 shrink-0 flex items-center justify-center w-[58px] h-[40px]">
                      <Image
                        src={`/assets/images/banks/${item.bank}.svg`}
                        alt={item.name}
                        width={50}
                        height={20}
                        className="h-5 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="bg-red-50 text-red-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded">5% OFF</span>
                        <span className="text-[10px] font-bold text-gray-700 truncate">{item.name}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-900 leading-tight line-clamp-1">
                        Instant Discount Upto ₹10,000 on EMI
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5">*T&C apply</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* ================= WHAT'S HOT (FLIPKART STYLE CARD ON MOBILE) ================= */}
      <section className="inner-section-padding mt-5 mb-10 max-sm:mt-3 max-sm:mb-4 max-sm:mx-3 max-sm:p-3.5 max-sm:bg-[#fff0f3] max-sm:rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-primary max-sm:text-gray-900 font-bold text-2xl max-sm:text-lg">What&apos;s Hot</h2>
          <div className="hidden max-sm:flex w-7 h-7 bg-black text-white rounded-full items-center justify-center font-bold text-xs shrink-0">
            ➔
          </div>
        </div>

        <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-4 max-sm:gap-3">
          {[
            {
              line1: "Best Selling",
              line2: "Air Conditioner",
              productImg: "/assets/images/acbg.png",
              defaultImg: "/assets/images/latest-sm-1.png",
              price: "Starting @ ₹ 27,990",
              link: "/category/air-conditioner",
              bgImg: "/assets/images/cardbg.png",
            },
            {
              line1: "Best Selling",
              line2: "Smart Phone",
              productImg: "/assets/images/phonebg.png",
              defaultImg: "/assets/images/latest-sm-2.png",
              price: "Starting @ ₹ 11,990",
              link: "/category/mobiles",
              bgImg: "/assets/images/cardbg.png",
            },
            {
              line1: "Best Selling",
              line2: "Neck Band",
              productImg: "/assets/images/neck.png",
              defaultImg: "/assets/images/latest-sm-3.png",
              price: "Starting @ ₹ 299",
              link: "/category/accessories",
              bgImg: "/assets/images/cardbg.png",
            },
            {
              line1: "Best Selling",
              line2: "Laptop",
              productImg: "/assets/images/lap.png",
              defaultImg: "/assets/images/latest-sm-4.png",
              price: "Starting @ ₹ 39,790",
              link: "/category/laptop-desktops",
              bgImg: "/assets/images/cardbg.png",
            },
          ].map((item, index) => {
            const cardBg = item.bgImg || "/assets/images/cardbg.png";
            const productImgSrc = item.productImg || item.image || item.localImg || item.defaultImg;
            const titleText = item.title || `${item.line1} ${item.line2}`;

            return (
              <Link href={item.link || "#"} key={index} className="group block w-full h-full">
                <div
                  className="relative flex flex-col justify-between items-center rounded-2xl max-sm:rounded-xl overflow-hidden p-2.5 sm:p-4 aspect-[3/4.2] sm:aspect-[3/4] w-full bg-cover bg-center shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  style={{ backgroundImage: `url(${cardBg})` }}
                >
                  {/* Single Unified Inner Content Wrapper for 1-Piece Hover Scale */}
                  <div className="w-full h-full flex flex-col justify-between items-center transition-transform duration-300 ease-out group-hover:scale-[1.06]">
                    {/* 1. Header Title Container (2-Line Format) */}
                    <div className="w-full pt-1 sm:pt-1.5 pb-0.5 text-center">
                      <h3 className="text-white text-center font-extrabold text-[13px] max-sm:text-[14px] sm:text-xl md:text-2xl leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        <span className="block">{item.line1 || "Best Selling"}</span>
                        <span className="block font-black">{item.line2 || titleText}</span>
                      </h3>
                    </div>

                    {/* 2. Product Image Container (Enlarged for Mobile & Desktop) */}
                    <div className="w-full flex-1 flex items-center justify-center my-0.5 px-0.5 overflow-hidden relative">
                      {productImgSrc && (
                        <img
                          src={productImgSrc}
                          alt={titleText}
                          className="w-full h-full object-contain scale-[1.65] sm:scale-[1.45] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-transform duration-300"
                          onError={(e) => {
                            if (item.defaultImg && e.currentTarget.src !== window.location.origin + item.defaultImg) {
                              e.currentTarget.src = item.defaultImg;
                            }
                          }}
                        />
                      )}
                    </div>

                    {/* 3. Horizontal Yellow Line (Centered Divider) */}
                    <div className="w-3/5 sm:w-2/3 h-[2px] sm:h-[3.5px] bg-[#facc15] my-1 sm:my-1.5 rounded-full shadow-sm shrink-0" />

                    {/* 4. Price Container (Single Line No Wrap) */}
                    <div className="w-full text-center pb-1 sm:pb-2 pt-0.5">
                      <span className="text-white font-extrabold text-[12px] max-sm:text-[13px] sm:text-lg md:text-xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                        {item.price}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <BestSeller />

      <div className="inner-section-padding my-10 max-sm:px-3 max-sm:my-4">
        <div className="my-0 rounded-2xl max-sm:rounded-2xl overflow-hidden shadow-xs">
          <Link href="/category/mobiles">
            <Image
              src="/assets/images/mobile-banner.png"
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
      <div className="inner-section-padding my-10 max-sm:px-3 max-sm:my-4">
        <div className="my-0 rounded-2xl max-sm:rounded-2xl overflow-hidden shadow-xs">
          <Link href="/category/air-conditioner">
            <Image
              src="/assets/images/ac-banner.png"
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

      <section className="inner-section-padding py-10 max-sm:py-4 max-sm:mx-3 max-sm:my-4 max-sm:p-3.5 max-sm:bg-[#eff6ff] max-sm:rounded-2xl max-sm:w-auto">
        <div className="hidden max-sm:flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-lg">Trending TV Categories</h2>
          <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
            ➔
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-sm:gap-2.5 max-sm:bg-white max-sm:p-2.5 max-sm:rounded-xl">
          {/* LEFT BIG BANNER */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-black min-h-[260px] lg:min-h-[420px] max-sm:min-h-[180px]">
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
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 max-sm:grid-cols-2 max-sm:gap-2.5">
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
      <div className="inner-section-padding my-10 max-sm:px-3 max-sm:my-4">
        <div>
          <Link href="/aboutus">
            <Image
              src="/assets/images/sm-about-banner.png"
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


      <section className="w-auto inner-section-padding py-5 max-sm:mx-3 max-sm:my-3 max-sm:p-3.5 max-sm:bg-white max-sm:rounded-2xl max-sm:shadow-xs max-sm:w-auto">
        <h2 className="text-primary mb-5 text-2xl font-bold max-sm:text-lg max-sm:text-gray-900 max-sm:mb-3">
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
                  <div className="absolute inset-0 bg-black/15"></div>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-pink-100 shadow-lg text-primary rounded-full w-9 h-9 flex items-center justify-center">
                      <i className="fi fi-sr-play flex"></i>
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
          position: relative;
          margin-top: 10px;
          margin-bottom: 4px;
          left: auto;
          bottom: auto;
          transform: none;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          background: transparent;
          padding: 0;
          width: 100% !important;
        }
        .banner-pagination :global(.swiper-pagination-bullet) {
          width: 8px;
          height: 5px;
          background: #d1d5db;
          border-radius: 9999px;
          opacity: 1;
          transition: all 0.3s ease;
          margin: 0 !important;
          transform: none;
        }
        .banner-pagination :global(.swiper-pagination-bullet-active) {
          width: 24px;
          height: 5px;
          background: #000000;
          border-radius: 9999px;
          border: none;
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
