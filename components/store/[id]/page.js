import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Navigation } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'

SwiperCore.use([Navigation])

export default function StoreDetail() {
  const router = useRouter()
  const { id } = router.query // store id if you want to fetch data

  useEffect(() => {
    // You can fetch store data here using the `id` from the route.
    // Example: fetch(`/api/stores/${id}`).then(...)
  }, [id])

  return (
    <>
      <Head>
        <title>Store Detail</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-10 text-slate-900">
        {/* STORE CARD + BANNER */}
        <section className="bg-white grid grid-cols-2 max-sm:grid-cols-none max-md:grid-cols-none max-lg:grid-cols-[2fr_4fr] gap-4 rounded-lg">
          <div className="border border-gray-300 rounded-2xl">
            <h1 className="text-xl md:text-xl font-semibold p-3.5 border-b border-gray-300">
              Sangeetha Gadgets -<br /> Himayathnagar
            </h1>

            <div className="flex px-5 py-2 gap-x-3.5">
              <div className="flex items-center">
                <i className="flex items-center text-blue-900 text-2xl">🏢</i>
              </div>
              <div className="text-sm">
                <p className="mb-2">No X-35/153A, Vishwa Bhavan, Himayathnagar</p>
                <p className="mb-2">Hyderabad - 500004</p>
              </div>
            </div>

            <div className="flex px-5 py-2 gap-x-3.5">
              <div className="flex items-center">
                <i className="flex items-center text-blue-900 text-2xl">📞</i>
              </div>
              <div className="text-sm">
                <a href="tel:+918041017651"> +918041017651 </a>
              </div>
            </div>

            <div className="flex px-5 py-2 mb-2 gap-x-3.5">
              <div className="flex items-center">
                <i className="flex items-center text-blue-900 text-2xl">⏰</i>
              </div>
              <div className="text-sm flex flex-row gap-x-2">
                <p className="font-medium">Open until 09:45 PM</p>
                <button type="button" className="border-0 bg-none">▾</button>
                <p className="font-medium">OPEN NOW</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden relative">
            <img src="/images/1stbanner.jpg" alt="Winter sale banner" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 text-center mb-3.5 mx-auto w-fit">
              <div className="flex gap-x-3 px-3 py-1.5 banner-navigation bg-white rounded-4xl">
                <button className="active w-3.5 h-3.5 bg-gray-400 rounded-full" />
                <button className="w-3.5 h-3.5 bg-gray-400 rounded-full" />
                <button className="w-3.5 h-3.5 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT FORM */}
        <section className="bg-white rounded-xl border border-gray-300 p-4 md:p-6 space-y-4">
          <form className="mx-2">
            <div className="text-center mb-7 border-b border-gray-300 pb-3.5">
              <h2 className="text-lg md:text-xl font-semibold mb-2.5">Get In Touch</h2>
              <p className="text-sm text-slate-600">Write to us with your query and we shall get back.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              <input type="text" placeholder="Name*" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email*" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="tel" placeholder="Phone No.*" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select Product</option>
                <option>Smartphone</option>
                <option>Television</option>
                <option>Home Appliance</option>
              </select>
            </div>

            <div className="flex justify-center mx-[30%]">
              <button type="submit" className="px-8 py-2 w-full rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-orange-700 transition">Submit</button>
            </div>
          </form>
        </section>

        {/* FEATURED PRODUCTS CAROUSEL */}
        <section className="p-7 overflow-hidden bg-blue-800 rounded-xl">
          <div className="text-center mb-7">
            <h2 className="text-white text-lg md:text-xl font-semibold">Featured Products</h2>
          </div>

          <div className="relative">
            <Swiper
              slidesPerView={4}
              spaceBetween={15}
              breakpoints={{
                1200: { slidesPerView: 4 },
                992: { slidesPerView: 3 },
                768: { slidesPerView: 2 },
                576: { slidesPerView: 2 },
                0: { slidesPerView: 1 },
              }}
              navigation
              className="featured-products-swiper"
            >
              {["aircooler-product.png","dishwasher-product.png","mobile-product-2.jpg","ac-product.jpeg","fridge-product.jpg","washing-machine-product.png","mobile-product.jpg","mobile-product-2.jpg","mobile-product.jpg","aircooler-product.png","dishwasher-product.png"].map((img, idx) => (
                <SwiperSlide key={idx} className="flex flex-col items-center gap-3">
                  <div className="circle-thumb w-48 h-48 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
                    <img src={`/images/${img}`} alt="product" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm font-medium text-center text-white">Featured Item</p>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* OFFERS CAROUSEL */}
        <section className="space-y-4">
          <h2 className="text-2xl max-md:text-xl font-semibold text-center">Offers</h2>

          <div className="relative season-offer">
            <Swiper slidesPerView={1} spaceBetween={16} navigation className="offers-swiper">
              {[1,2].map((i)=> (
                <SwiperSlide key={i} className="rounded-xl shadow-sm">
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden grid lg:grid-cols-[4fr_2fr]">
                    <div>
                      <img src="/images/wintersale.jpg" alt="Winter Sale" className="w-full h-40 md:h-full object-cover" />
                    </div>
                    <div className="p-4 flex flex-col justify-around">
                      <div className="space-y-2 text-center">
                        <p className="text-2xl font-semibold text-slate-700">Winter Sale</p>
                        <p className="text-xs text-slate-500">Valid till 10-Jan-2025</p>
                      </div>
                      <div className="mt-4 text-center">
                        <button className="px-4 py-2 text-sm rounded-full border border-blue-600 text-blue-600 font-medium hover:bg-blue-50">View Details</button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* QR + RATINGS / REVIEWS */}
        <section className="grid grid-cols-[1fr] md:grid-cols-[1fr_2fr] gap-4 md:gap-6 items-stretch">
          <div className="bg-white rounded-xl border border-gray-300 justify-center shadow-sm p-4 md:p-6 flex flex-col gap-4">
            <h3 className="text-xl text-center font-semibold">Discover More With Us</h3>
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 bg-slate-100 flex items-center justify-center">
                <span className="text-xs text-slate-500">QR CODE</span>
              </div>
            </div>
            <p className="text-xs text-center text-slate-500">Scan the QR code to discover more offers with us.</p>
            <div className="flex justify-center">
              <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">Download QR</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4 md:p-6 flex flex-col gap-4">
            <div className="text-center border-b border-b-gray-300">
              <h3 className="text-xl font-semibold">Store Ratings</h3>

              <div className="flex items-center gap-4 justify-center mb-3.5">
                <div className="text-3xl font-semibold">4.4</div>
                <div className="flex flex-col gap-1 items-baseline">
                  <div className="text-yellow-400 text-lg">★★★★★</div>
                  <p className="text-xs text-slate-500">Based on 250+ reviews</p>
                </div>
              </div>

              <div className="flex gap-2 justify-center mb-3.5">
                <button className="px-4 py-2 text-xs rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700">Submit a Review</button>
                <button className="px-4 py-2 text-xs rounded-full border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">View All</button>
              </div>
            </div>

            <div className="mt-2 space-y-3 max-h-40 overflow-y-auto text-xs">
              {[1,2,3].map((i)=> (
                <div key={i} className="border-b border-dashed pb-3 border-b-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-baseline">
                      <span className="font-medium text-base">Good service</span>
                      <p className="text-slate-500 text-base">Raguvaran</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-yellow-500 text-lg">★★★★☆</span>
                      <p className="text-slate-500">Visited on Nov-25-25</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="bg-blue-800 rounded-xl shadow-sm p-4 md:p-6 space-y-3 text-white">
          <h2 className="text-lg md:text-2xl text-center font-semibold">About Sangeetha</h2>
          <p className="text-sm leading-relaxed text-center">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Your full copy goes here.
          </p>
        </section>

        {/* HOURS / DIRECTIONS / OTHER STORES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:mb-10 mb-5">
          <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-lg">Business Hours</h3>
            <ul className="space-y-1 text-xs text-slate-600 font-medium">
              <li className="flex justify-between"><span>Mon</span><span>09:45 AM – 09:45 PM</span></li>
              <li className="flex justify-between"><span>Tue</span><span>09:45 AM – 09:45 PM</span></li>
            </ul>
          </div>

          <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-lg">Get Direction To Sangeetha Gadgets</h3>
            <p className="text-xs text-slate-600 font-medium">7J2V+Q2V, Himayath Nagar, Hyderabad, Telangana, India</p>
            <button className="mt-2 px-4 py-2 text-xs rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium">Open in Maps</button>
          </div>

          <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-lg">Other Stores Of Sangeetha Gadgets</h3>
            <ul className="space-y-1 text-xs text-slate-600 font-medium">
              <li>Sangeetha Gadgets Stores in Telangana</li>
              <li>Sangeetha Gadgets Stores in Hyderabad</li>
            </ul>
          </div>
        </section>

        {/* ... remaining sections (highlights, nearby stores, tags) can be added similarly ... */}
      </main>
    </>
  )
}
