"use client";
import { useEffect, useState } from "react";

export default function ProductReviews({ productId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/reviews/${productId}`)
      .then((res) => res.json())
      .then(setData);
  }, [productId]);

  if (!data) return null;

  const { averageRating, totalReviews, ratingCount, reviews } = data;

  const maxCount = Math.max(...Object.values(ratingCount));

  return (
    <div className=" bg-white p-6 rounded border">
      

      {/* SUMMARY */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 text-center">
          <div className="text-5xl font-bold">{averageRating}</div>
          <div className="text-yellow-500 text-xl">★★★★★</div>
          <div className="text-gray-500 mt-1">
            {totalReviews} Reviews
          </div>
        </div>

        {/* DISTRIBUTION */}
        <div className="col-span-9 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3">
              <span className="w-8">{star} ★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{
                    width: `${
                      maxCount
                        ? (ratingCount[star] / maxCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="w-12 text-sm text-gray-600">
                {ratingCount[star]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEWS */}
      <div className="mt-8 space-y-6">
        {reviews.map((r) => (
          <div key={r._id} className="border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-sm">
                {r.reviews_rating} ★
              </span>
              <h4 className="font-semibold">{r.reviews_title}</h4>
            </div>

             {/* IMAGES */}
            {r.review_images?.length > 0 && (
              <div className="flex gap-2 mt-3">
                {r.review_images.map((img, i) => (
                  <img
                    key={i}
                    src={`/uploads/reviews/${img}`}
                    alt=""
                    className="w-20 h-20 object-cover rounded border"
                  />
                ))}
              </div>
            )}

            <p className="mt-2 text-gray-700">
              {r.reviews_comments}
            </p>

           

            <div className="mt-2 text-sm text-gray-500">
              {r.user_id?.name} •{" "}
              {new Date(r.created_date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
