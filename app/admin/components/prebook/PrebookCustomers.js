"use client";

import { useEffect, useMemo, useState } from "react";

export default function PrebookCustomers() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await fetch("/api/prebook", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load customer details.");
        }
        setBookings(result.bookings);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) =>
      [
        booking.name,
        booking.phone,
        booking.pincode,
        booking.district,
        booking.product,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [bookings, search]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pre-booked Customers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View customer enquiries submitted from the pre-booking page.
          </p>
        </div>
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
          Total: {filteredBookings.length}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b p-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, contact, pincode, district or product"
            className="w-full max-w-xl rounded-lg border border-gray-300 px-3 py-2.5"
          />
        </div>

        {loading ? (
          <p className="p-6 text-gray-500">Loading customer details...</p>
        ) : error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : filteredBookings.length === 0 ? (
          <p className="p-6 text-gray-500">No pre-booked customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Pincode</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {booking.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${booking.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {booking.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">{booking.pincode || "-"}</td>
                    <td className="px-4 py-3">{booking.district || "-"}</td>
                    <td className="px-4 py-3">{booking.product}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(booking.createdAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
