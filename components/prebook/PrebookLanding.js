"use client";

import Image from "next/image";
import { useState } from "react";

const emptyForm = {
  name: "",
  phone: "",
  pincode: "",
  district: "",
};

export default function PrebookLanding({ campaign }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone)) {
      nextErrors.phone = "Enter a valid 10-digit contact number";
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      nextErrors.pincode = "Enter a valid 6-digit pincode";
    }
    if (!form.district.trim()) nextErrors.district = "District is required";
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const normalizedValue =
      name === "phone" || name === "pincode"
        ? value.replace(/\D/g, "")
        : value;

    setForm((previous) => ({ ...previous, [name]: normalizedValue }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          product: campaign.product_name,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit your pre-booking.");
      }

      setForm(emptyForm);
      setSuccess(true);
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const bannerImage = campaign.mobile_banner_image || campaign.banner_image;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="relative w-full overflow-hidden bg-gray-900">
        <picture>
          {campaign.mobile_banner_image && (
            <source media="(max-width: 767px)" srcSet={campaign.mobile_banner_image} />
          )}
          <img
            src={bannerImage}
            alt={`${campaign.product_name} pre-booking banner`}
            width={1920}
            height={720}
            priority
            className="h-auto w-full object-cover"
          />
        </picture>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-3 py-6 md:grid-cols-[minmax(0,1fr)_420px] md:px-4 md:py-10">
        <div>
          
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-600">
            Pre-booking now open
          </p>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {campaign.product_name}
          </h1>
          {campaign.product_details && (
            <div className="mt-5 whitespace-pre-line text-base leading-7 text-gray-700">
              {campaign.product_details}
            </div>
          )}
          {campaign.detail_images?.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {campaign.detail_images.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`${campaign.product_name} detail banner ${index + 1}`}
                  width={600}
                  height={850}
                  className="mx-auto h-auto max-h-[850px] w-full max-w-[600px] rounded-xl border border-gray-200 bg-white object-contain"
                />
              ))}
            </div>
          )}
         
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-lg md:p-7">
          <h2 className="text-xl font-bold text-gray-900">Pre-book now</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your details and our team will contact you.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {[
              { name: "name", label: "Name", maxLength: 80 },
              { name: "phone", label: "Contact", inputMode: "numeric", maxLength: 10 },
              { name: "pincode", label: "Pincode", inputMode: "numeric", maxLength: 6 },
              { name: "district", label: "District", maxLength: 80 },
            ].map(({ label, ...field }) => (
              <label key={field.name} className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  {label}
                </span>
                <input
                  {...field}
                  value={form[field.name]}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-200 ${
                    errors[field.name] ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors[field.name] && (
                  <span className="mt-1 block text-xs text-red-600">
                    {errors[field.name]}
                  </span>
                )}
              </label>
            ))}

            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
            {success && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Your pre-booking was submitted successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Pre-booking"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
