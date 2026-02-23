"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export default function ReviewsComponent() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ================= FILTERS ================= */
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  

  /* ================= FETCH REVIEWS ================= */
  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews/get");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  /* ================= FILTER LOGIC ================= */
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchQuery === "" ||
      review.product_id?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      review.user_id?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "" ||
      review.reviews_rating === Number(ratingFilter);

    const matchesStatus =
      statusFilter === "" || review.review_status === statusFilter;

    return matchesSearch && matchesRating && matchesStatus;
  });

  /* ================= OVERVIEW STATS ================= */
  const totalReviews = reviews.length;

  const avgRating =
    totalReviews === 0
      ? "0.0"
      : (
          reviews.reduce((sum, r) => sum + r.reviews_rating, 0) /
          totalReviews
        ).toFixed(1);

  const pendingCount = reviews.filter(
    (r) => r.review_status === "pending"
  ).length;

  const flaggedCount = reviews.filter(
    (r) => r.review_status === "flagged"
  ).length;

  /* ================= REVIEW TRENDS ================= */
  const months = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (7 - i));
    return d.toLocaleString("en-US", { month: "short" });
  });

  const monthlyCounts = months.map((month) =>
    reviews.filter((r) => {
      const d = new Date(r.created_date);
      return d.toLocaleString("en-US", { month: "short" }) === month;
    }).length
  );

  const maxMonth = Math.max(...monthlyCounts, 1);

  const reviewLinePoints = monthlyCounts
    .map((count, i) => {
      const x = 50 + i * 70;
      const y = 220 - (count / maxMonth) * 160;
      return `${x},${y}`;
    })
    .join(" ");

  /* ================= RATING DISTRIBUTION ================= */
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (r) => reviews.filter((rv) => rv.reviews_rating === r).length
  );

  const maxRating = Math.max(...ratingCounts, 1);

  const ratingBars = ratingCounts.map((count) => ({
    height: (count / maxRating) * 160,
    y: 220 - (count / maxRating) * 160,
  }));

  /* ================= TOP REVIEWED PRODUCTS ================= */
const topProducts = Object.values(
  reviews.reduce((acc, r) => {
    if (
      !r.product_id ||
      typeof r.product_id !== "object" ||
      !r.product_id._id
    ) {
      return acc;
    }

    const pid = r.product_id._id;

    if (!acc[pid]) {
      acc[pid] = {
        product: r.product_id,
        count: 0,
        totalRating: 0,
      };
    }

    acc[pid].count += 1;
    acc[pid].totalRating += r.reviews_rating;

    return acc;
  }, {})
)
  .map((p) => ({
    ...p,
    avgRating: (p.totalRating / p.count).toFixed(1),
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 50);

  /* ================= PAGINATION ================= */
  const pageCount = Math.ceil(filteredReviews.length / itemsPerPage);
 

  const safePage =
  currentPage >= pageCount ? pageCount - 1 : currentPage;

const paginatedReviews = filteredReviews.slice(
  safePage * itemsPerPage,
  (safePage + 1) * itemsPerPage
);

const deleteReview = async (id) => {
  if (!confirm("Are you sure you want to delete this review?")) return;

  await fetch("/api/reviews/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewId: id }),
  });

  fetchReviews();
};

  /* ================= STATUS UPDATE ================= */
  const updateStatus = async (id, status) => {
    await fetch("/api/reviews/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: id, status }),
    });
    fetchReviews();
  };

  useEffect(() => {
  setCurrentPage(0);
}, [searchQuery, ratingFilter, statusFilter]);

  return (
    <div className="container mx-auto p-4">
      {/* HEADER */}
      <h2 className="text-2xl font-bold mb-6">Reviews Dashboard</h2>

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Avg Rating" value={avgRating} icon="mdi:star" />
        <StatCard
          title="Total Reviews"
          value={totalReviews}
          icon="mdi:comment"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon="mdi:clock-outline"
        />
        <StatCard
          title="Flagged"
          value={flaggedCount}
          icon="mdi:flag"
        />
      </div>
    <div className="bg-white shadow rounded-lg p-4 mb-6 gap-4">
      <h3 className="text-lg font-semibold mb-4">
          Analytics
        </h3>

      {/* ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* REVIEW TRENDS */}
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-semibold mb-3">Review Trends</h4>
          <svg className="w-full h-64" viewBox="0 0 600 260">
            <polyline
              fill="none"
              stroke="#6b6ffb"
              strokeWidth="3"
              points={reviewLinePoints}
            />
            {months.map((m, i) => (
              <text
                key={m}
                x={50 + i * 70}
                y="240"
                className="fill-gray-500 text-xs"
              >
                {m}
              </text>
            ))}
          </svg>
        </div>

        {/* RATING DISTRIBUTION */}
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-semibold mb-3">Rating Distribution</h4>
          <svg className="w-full h-64" viewBox="0 0 600 260">
            {ratingBars.map((bar, i) => (
              <rect
                key={i}
                x={70 + i * 90}
                y={bar.y}
                width="70"
                height={bar.height}
                rx="8"
                fill="#6b6ffb"
              />
            ))}
            {[5, 4, 3, 2, 1].map((r, i) => (
              <text
                key={r}
                x={95 + i * 90}
                y="240"
                className="fill-gray-500 text-xs"
              >
                {r}★
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
    <div className="bg-white shadow rounded-lg p-4 mb-6 gap-4">
       <h3 className="text-lg font-semibold mb-4">
          Reviews Management
        </h3>
       {/* FILTERS */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search product / customer"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(0);
          }}
          className="p-2 border rounded-md"
        />

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Star
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        {isLoading ? (
          <p className="p-4">Loading reviews...</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Comment</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReviews.map((review) => (
                <tr key={review._id} className="border-b text-center">
                  <td className="p-2">{review.product_id?.name}</td>
                  <td className="p-2">{review.user_id?.name}</td>
                  <td className="p-2 text-left">
                    {review.reviews_comments}
                  </td>
                  <td className="p-2 text-orange-500">
                    {"★".repeat(review.reviews_rating)}
                  </td>
                 <td className="p-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                        ${
                          review.review_status === "approved"
                            ? "bg-green-100 text-green-700"
                            : review.review_status === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : review.review_status === "flagged"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {review.review_status}
                    </span>
                  </td>
                  <td className="p-2 text-right space-x-6 flex items-center">
                    <Icon
                      icon="mdi:check"
                      className="cursor-pointer text-green-600"
                      onClick={() =>
                        updateStatus(review._id, "approved")
                      }
                    />
                    <Icon
                      icon="mdi:flag"
                      className="cursor-pointer text-yellow-600"
                      onClick={() =>
                        updateStatus(review._id, "flagged")
                      }
                    />
                     {/* DELETE / REJECT (glyphicon-remove equivalent) */}
                    <Icon
                      icon="mdi:close-circle"
                      title="Delete"
                      className="cursor-pointer text-red-600 hover:scale-110 transition"
                      onClick={() => deleteReview(review._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Showing{" "}
          {filteredReviews.length === 0
            ? 0
            : currentPage * itemsPerPage + 1}
          {" - "}
          {Math.min(
            (currentPage + 1) * itemsPerPage,
            filteredReviews.length
          )}{" "}
          of {filteredReviews.length}
        </p>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            « Prev
          </button>

          <span className="px-3 py-1 border rounded bg-gray-100">
            {currentPage + 1} / {pageCount || 1}
          </span>

          <button
            disabled={currentPage >= pageCount - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next »
          </button>
        </div>
      </div>
    </div>
          {/* TOP PRODUCTS */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Top Reviewed Products
        </h3>

        {topProducts.length === 0 ? (
  <p className="text-gray-500">No review data available</p>
) : (
  topProducts.map((item) => (
    <div
      key={item.product._id}
      className="flex justify-between items-center py-3 border-b"
    >
      <div>
        <div className="font-medium">{item.product.name}</div>
        <div className="text-sm text-gray-500">
          {item.count} reviews ·{" "}
          <a
            href={`/product/${item.product.slug}`}
            className="text-blue-600"
          >
            View
          </a>
        </div>
      </div>

      <div className="font-semibold">
        ★ {item.avgRating}
      </div>
    </div>
  ))
)}

      </div>

    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <Icon icon={icon} className="text-3xl text-blue-600" />
    </div>
  );
}
