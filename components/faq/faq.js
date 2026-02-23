"use client";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { FaTruck,FaShoppingCart, FaCreditCard, FaGavel,  FaUserCircle, FaComments  } from "react-icons/fa";
import { FiFileText, FiBook, FiShield, FiMail, FiLink, FiCreditCard  } from 'react-icons/fi';
import { MdOutlinePolicy, MdOutlineSecurity } from "react-icons/md";

const TermsAndConditions = ({faqs = null}) => {
    const [currentDate, setCurrentDate] = useState('');
    
    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
        }));
    }, []);

    const defaultFaqs = [
        {
            q: "Who runs Sathya Mobiles? How can I contact you?",
            a: "We are Sathya Mobiles — a retail store specializing in smartphones and accessories. For support or inquiries, email support@sathyamobiles.com. You can also add a phone or WhatsApp number on the site.",
        },
        {
            q: "What payment methods do you accept?",
            a: "We accept debit/credit cards, UPI, netbanking and Cash on Delivery (COD) where applicable. Payment options are shown at checkout.",
        },
        {
            q: "How soon will my order be delivered?",
            a: "Orders are usually processed within 24–48 hours. Delivery time depends on your city — typically 3–7 business days for major cities.",
        },
        {
            q: "Can I change my shipping address after placing an order?",
            a: "If the order hasn't been dispatched we can update the shipping details. Contact support@sathyamobiles.com immediately with your order number.",
        },
        {
            q: "What is your return and refund policy?",
            a: "If the product is defective, damaged, or not as described, request a return/replacement within the specified days (shown on product page). Keep original packaging and invoice.",
        },
        {
            q: "Do the phones come with warranty?",
            a: "Yes — warranty varies by brand and product. Details appear on the product page and invoice. Keep the warranty card and invoice for claims.",
        },
        {
            q: "Are the phones brand new or refurbished?",
            a: "All phones are brand new and unused unless explicitly marked as refurbished or open‑box on the product page.",
        },
        {
            q: "How do I track my order?",
            a: "After shipping you'll receive an email/SMS with a tracking number — use it on the courier's website or the order page on our site.",
        },
        {
            q: "What items are included inside the phone box?",
            a: "Most bundles include handset, charger, USB cable, SIM‑eject tool (if applicable), user manual and warranty card. Accessories may vary by model.",
        },
        {
            q: "Is my payment information secure?",
            a: "Yes — we use trusted, encrypted payment gateways. Sensitive card data is not stored on our servers.",
        },
    ];
    const items = faqs && faqs.length ? faqs : defaultFaqs;

  // Open one item at a time
  const [openIndex, setOpenIndex] = useState(null);

  function toggleIndex(i) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

    return (
        <div>
            {/* Header Bar */}
            <div className="bg-red-100 py-6 px-8 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">FAQ</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/" className="text-gray-600 hover:text-red-600">🏠 Home</Link>
                    <span className="text-gray-500">›</span>
                    <span className="text-red-600 font-semibold">Faq</span>
                </div>
            </div>

            {/* FAQ Content */}
            <div className="container mx-auto px-8 py-12 text-gray-800 leading-relaxed">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">FAQ</h1>
                <div className="max-w-3xl mx-auto space-y-6 mb-8">
                    {items.map((item, i) => {
                    const isOpen = openIndex === i;

                    return (
                        <div
                        key={i}
                        className="border rounded-lg overflow-hidden bg-white shadow-sm"
                        >
                        {/* Question */}
                        <button
                            onClick={() => toggleIndex(i)}
                            aria-expanded={isOpen}
                            className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                            <div>
                            <div className="text-gray-900 font-semibold text-lg">
                                {item.q}
                            </div>
                            </div>

                            {/* Chevron icon */}
                            <div
                            className={`transform transition-transform duration-200 ${
                                isOpen ? "rotate-180" : "rotate-0"
                            }`}
                            >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                                />
                            </svg>
                            </div>
                        </button>

                        {/* Answer Panel */}
                        <div
                            className={`px-5 pb-4 transition-all duration-200 ${
                            isOpen ? "block" : "hidden"
                            }`}
                        >
                            <div className="mt-1 text-gray-700 leading-relaxed bg-gray-50 p-4 rounded">
                            {item.a}
                            </div>
                        </div>
                        </div>
                    );
                    })}
                    <p>For support, contact - Email:  <a className="text-red-600 font-semibold">support@sathyamobiles.com</a></p>
                    <p className="text-sm text-gray-500 mt-8"><em>Last updated on: {currentDate}</em></p>
                </div>
                
            </div>
        </div>
    );
};

export default TermsAndConditions;