"use client";
import React from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
const ShippingPolicy = () => {
    const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // VALIDATION FUNCTION
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!form.phone) newErrors.phone = "Mobile No. is required";
    else if (isNaN(form.phone)) newErrors.phone = "Invalid Mobile Number";
    else if (form.phone.length !== 10)
      newErrors.phone = "Mobile No. must be 10 digits";
    else if (!["6", "7", "8", "9"].includes(form.phone[0]))
      newErrors.phone = "Mobile No. must start with 6, 7, 8 or 9";

    if (!form.city) newErrors.city = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT FUNCTION
  const submitForm = async () => {
    if (!validate()) return;

    const url = new URL(window.location.href);
    const utm_source = url.searchParams.get("utm_source") ?? "Vivo X300";
    const utm_medium = url.searchParams.get("utm_medium");
    const utm_campaign = url.searchParams.get("utm_campaign");

    const payload = {
      name: form.name,
      mobile: form.phone,
      city: form.city,
      lead_source: utm_source,
      lead_medium: utm_medium,
      lead_campaign: utm_campaign,
    };

    await fetch(
      "https://adtarbo.eywamedia.com/api/create-lead/96mBhgZrBH9St7neU6shc6XRmIvoNHGui",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSubmitted(true);
  };
    return (
<>
        <div className="bg-gray-50 min-h-screen">


            
        {/* PREBOOK BUTTON */}
        <button
          onClick={() => setShow(true)}
          className="fixed top-[28%] right-5 bg-red-600 text-white px-5 py-2 rounded-full shadow-lg z-[999]"
        >
          PreBook Now
        </button>

        {/* MODAL */}
        {show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[999]">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl w-[90%] max-w-xl p-6 relative"
            >
              <button
                className="absolute top-3 right-3 text-xl"
                onClick={() => setShow(false)}
              >
                ✕
              </button>

              {!submitted ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">
                    Please provide your details
                  </h2>

                  {/* FORM */}
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Name"
                        className={`border p-2 w-full rounded ${
                            errors.name ? "border-red-600" : "border-gray-300"
                          }`}
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        className={`border p-2 w-full rounded ${
                            errors.phone ? "border-red-600" : "border-gray-300"
                          }`}
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                      {errors.phone && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <select
                        className={`border p-2 w-full rounded ${
                            errors.city ? "border-red-600" : "border-gray-300"
                          }`}
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                      >
                        <option value="">Your District</option>
                        <option value="Aruppukkottai">Aruppukkottai</option>
                    <option value="Ambasamudhram">Ambasamudhram</option>
                    <option value="Coimbatore_saravanampatti">
                      Coimbatore (Saravanampatti)
                    </option>
                    <option value="Coimbatore_Hopes">Coimbatore (Hopes)</option>
                    <option value="Dindigul">Dindigul</option>
                    <option value="Eral">Eral</option>
                    <option value="Kovilpatti">Kovilpatti</option>
                    <option value="Madurai_simmakkal">
                      Madurai (Simmakkal)
                    </option>
                    <option value="Madurai_Kalaivasal">
                      Madurai (Kalaivasal)
                    </option>
                    <option value="Marthandam">Marthandam</option>
                    <option value="Nagercovil">Nagercovil</option>
                    <option value="Puliyankudi">Puliyankudi</option>
                    <option value="Rajapalayam">Rajapalayam</option>
                    <option value="Salem_ARRS">Salem (ARRS Multiplex)</option>
                    <option value="Salem_Gugai">Salem (Gugai)</option>
                    <option value="Sankarankovil">Sankarankovil</option>
                    <option value="Sattur">Sattur</option>
                    <option value="Surandai">Surandai</option>
                    <option value="Tenkasi">Tenkasi</option>
                    <option value="Tirunelveli">Tirunelveli</option>
                    <option value="Thisyanvilai">Thisyanvilai</option>
                    <option value="Thoothukudi">Thoothukudi</option>
                    <option value="Tirupur">Tirupur</option>
                    <option value="Valliyur">Valliyur</option>
                    <option value="Vilathikulam">Vilathikulam</option>
                    <option value="Viruthunagar">Viruthunagar</option>
                      </select>

                      {errors.city && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={submitForm}
                      className="w-full bg-red-600 text-white py-2 rounded-lg"
                    >
                      Submit
                    </button>
                  </div>
                </>
              ) : (
                <h2 className="text-center py-10 text-lg">
                  Thank You. We'll be in touch soon.
                </h2>
              )}
            </motion.div>
          </div>
        )}
            {/* 🔥 Banner Section */}
            <div className="w-full">
                <img src="/uploads/pre-book/vivo-x300/vivo-x300.jpeg" alt="Shipping Banner" className="w-full h-full object-cover"/>
            </div>

            {/* ⭐ Cards Section */}
            <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="relative w-full h-60">
                        <img src="/uploads/pre-book/vivo-x300/vivo-x300-2.jpeg" className="w-full h-full object-cover" alt="Card Background" />
                        {/* TEXT ON TOP OF IMAGE */}
                        <div className="absolute inset-0 flex flex-col justify-between p-5">
                            {/* TOP TEXT */}
                            <div>
                                <h3 className="text-lg font-semibold text-red-600">Performance</h3>
                                <p className="text-black-700 text-sm mt-2 leading-relaxed">
                                    6040 mAh Long-Lasting Battery7<br/>
                                    90W FlashCharge9<br/>
                                    Dimensity 9500
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        The next-gen battery keeps power steady through every challenge. No need to worry about low battery. The 90W FlashCharge or 40W Wireless FlashCharge gets you back in action fast.
                    </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="relative w-full h-60">
                        <img src="/uploads/pre-book/vivo-x300/vivo-x300-1.jpeg" className="w-full h-full object-cover" alt="Card Background" />
                        {/* TEXT ON TOP OF IMAGE */}
                        <div className="absolute inset-0 flex flex-col justify-between p-5">
                            {/* TOP TEXT */}
                            <div>
                                <h3 className="text-lg font-semibold text-red-600">The Ultimate Professional Rig</h3>
                                <p className="text-black-700 text-sm mt-2 leading-relaxed">
                                    Telephoto Extender Kit
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <p className="font-semibold">See the Unseen ,Go Further<br/></p>
                        Born for pros, the 13 high-transparency glass elements and the 3 ultra-low dispersion lenses deliver unmatched clarity.
                    </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    <div className="relative w-full h-60">
                        <img src="/uploads/pre-book/vivo-x300/vivo-x300-3.webp" className="w-full h-full object-cover" alt="Card Background" />
                        {/* TEXT ON TOP OF IMAGE */}
                        <div className="absolute inset-0 flex flex-col justify-between p-5">
                            {/* TOP TEXT */}
                            <div>
                                <h3 className="text-lg font-semibold text-red-600">Flagship Design</h3>
                                <p className="text-black-700 text-sm mt-2 leading-relaxed">
                                    16.04cm (6.31'') Compact Flat Screen<br/>
                                    Minimalist · Comfortable Design
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <p className="font-semibold">Lift Its Mysterious Veil<br/></p>
                            With Unibody 3D Glass Design, the seamless
                            design delivers both solid durability and
                            reliable dust protection'.
                    </div>
                </div>
            </div>
            {/* 🔥 Banner Section */}
            <div className="relative w-full h-[380px] md:h-[480px] lg:h-[550px]">
                {/* Background Image */}
                <img 
                    src="/uploads/pre-book/vivo-x300/vivo-x300-in-phantom-black-color.png.webp" 
                    alt="Phone Banner" 
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* TEXT BLOCK (Right side overlay) */}
                <div className="absolute bottom-16 right-10 max-w-sm text-righ">

                    <h3 className="text-white text-2xl md:text-3xl font-semibold mb-3">
                    Elite Black
                    </h3>

                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Deep and refined, it is a black that reveals beauty in its 
                    quietest details.
                    </p>
                </div>
            </div>

            <div className="w-full flex justify-center py-10">
                {/* ROUNDED BOX */}
                <div className="relative w-[90%] max-w-5xl h-[350px] md:h-[450px] bg-black rounded-3xl overflow-hidden shadow-lg">

                    {/* BACKGROUND IMAGE (animated) */}
                    <motion.img
                        src="/uploads/pre-book/vivo-x300/vivo-x300-with-a-7.95-mm-slim-profile-and-a-weight-of-190g-1.png.webp"
                        alt="background"
                        className="
                        absolute inset-0 w-full h-full 
                        object-contain 
                        scale-90 md:scale-95 
                        opacity-90
                        "
                        initial={{ y: 150, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />

                    {/* CONTENT */}
                    <div className="relative z-10 flex h-full">

                        {/* LEFT TEXT */}
                        <div className="w-1/2 flex flex-col justify-center pl-10">
                        <h3 className="text-white text-3xl md:text-5xl font-semibold">
                            16.04cm (6.31")
                        </h3>
                        <p className="text-gray-300 text-lg md:text-xl mt-1">
                            Compact Flat Screen¹
                        </p>
                        </div>

                        {/* RIGHT SIDE (Phone + 190g text) */}
                        <div className="w-1/2 relative flex flex-col justify-center items-center">

                        {/* PHONE IMAGE (center + smaller) */}
                        <motion.img
                            src="/uploads/pre-book/vivo-x300/vivo-x300-with-a-7.95-mm-slim-profile-and-a-weight-of-190g-2.png.webp"
                            alt="phone"
                            className="w-[130px] md:w-[190px] lg:w-[260px]"
                            initial={{ y: 150, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />

                        {/* 190g text moved to right side */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
                            <h3 className="text-white text-3xl md:text-5xl font-semibold">
                            190g
                            </h3>
                            <p className="text-gray-300 text-lg md:text-xl">
                            Weight¹
                            </p>
                        </div>

                        </div>

                    </div>

                </div>
            </div>

            <div className="w-full">
                <img src="/uploads/pre-book/vivo-x300/xcare.png.webp" alt="Shipping Banner" className="w-full h-full object-cover"/>
            </div>

            <div className="w-full">
                <img src="/uploads/pre-book/vivo-x300/protective.png.webp" alt="Shipping Banner" className="w-full h-full object-cover"/>
            </div>


            <div className="w-full flex justify-center py-10">
                {/* ROUNDED BOX */}
                <div className="relative w-[90%] max-w-5xl h-[350px] md:h-[450px] bg-black rounded-3xl overflow-hidden shadow-lg">
                    {/* BACKGROUND IMAGE */}
                    <img src="/uploads/pre-book/vivo-x300/security.webp" alt="background" className="absolute inset-0 w-full h-full object-contain scale-90 md:scale-95 opacity-90"/>
                    {/* CONTENT — TOP SIDE */}
                    <div className="absolute inset-0 flex flex-col items-center justify-start z-10 text-white px-5 pt-6">
                        <p>5-Year OS Upgrades & 7-Year Security Updates</p>
                        <h2 className="text-2xl md:text-4xl font-bold mb-2">The Future-Proof Device</h2>
                        <p className="text-center items-center">
                            A device you can truly rely on. We guarantee seven years of security updates and system maintenance so your technology stays current, secure, and performing at its best.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full relative h-[450px] md:h-[650px] overflow-hidden">

    {/* VIDEO */}
    <video
        src="/uploads/pre-book/vivo-x300/fingerprint.webm"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
    />

    {/* CONTENT */}
    <div
        className="
            absolute inset-0 z-10
            flex items-center
            justify-center
            px-4
            md:justify-end md:px-8
        "
    >
        <div className="text-white max-w-xs md:max-w-md text-center md:text-left">
            <p className="text-sm md:text-base text-gray-300 mb-1">
                3D Ultrasonic Fingerprint Scanning 2.0
            </p>

            <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-1">
                Register in One Second
            </h2>

            <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-3">
                Unlock in a Flash
            </h2>

            <p className="text-gray-300 md:text-lg leading-relaxed">
                Experience effortless, instant, and intuitive control and unlocking.
                Register your fingerprint in under a second and unlock just as quickly,
                all while maintaining a natural and comfortable hand position, with
                the assurance of enterprise-grade security.
            </p>
        </div>
    </div>
</div>


        </div>
        </>
    );
};

export default ShippingPolicy;
