'use client';
import { useState, useEffect } from "react";
import { SiTicktick } from "react-icons/si";
import Image from "next/image";
import { TbBrandAppgallery } from "react-icons/tb";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import { AiOutlineBarcode } from "react-icons/ai"; // import at top
import { FiBox, FiHash } from "react-icons/fi";
import Link from "next/link";
import { Poppins } from "next/font/google";
const poppins = Poppins({ subsets: ["latin"], weight: ["400","500","600"] });
import { jwtDecode } from 'jwt-decode';
import ProductReviews from "./ProductReviews";
export default function ProductDetailsSection({ product }) {
 
  
  const getFirstAvailableTab = () => {
  if (product.overviewdescription) return "overview";
  if (product.description) return "description";
  if (product.videos && product.videos.length > 0) return "videos";
  if (product.reviewItems && product.reviewItems.length > 0) return "reviews";
  if (product.key_specifications) return "keySpecs";
  if (product.product_highlights?.length > 0) return "productHighlights";
  return null;
};

 const [activeTab, setActiveTab] = useState(() => getFirstAvailableTab());
 const [brand, setBrand] = useState([]);

 const [canReview, setCanReview] = useState(false);
const [checkingReview, setCheckingReview] = useState(true);

const [showForm, setShowForm] = useState(false);
const [rating, setRating] = useState(0);
const [title, setTitle] = useState("");
const [comment, setComment] = useState("");
const [loading, setLoading] = useState(false);
const [images, setImages] = useState([]);
const [userId, setUserId] = useState(0);


const [alreadyReviewed, setAlreadyReviewed] = useState(false);
const [message, setMessage] = useState("");

useEffect(() => {
  const availableTab = getFirstAvailableTab();
  if (availableTab) setActiveTab(availableTab);
}, [product]);

/*
const [reviewsData, setReviewsData] = useState({
  rating: 0,
  count: 0,
  items: []
});

useEffect(() => {
  if (!product?._id) return;

  const fetchReviews = async () => {
    const res = await fetch(`/api/reviews/by-product/${product._id}`);
    const data = await res.json();
    setReviewsData(data);
  };

  fetchReviews();
}, [product?._id]);
*/

if (!userId) {
const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        const userId = decoded.userId;
        console.log('userId:', userId);
        setUserId(userId);
      }
    }

  const tabData = {
    overview: product.overviewdescription || "No overview available.",
    description: product.description || "No description available.",
    videos: product.videos || [],
    reviews: {
      rating: product.reviews_rating || 0,
      count: product.reviews_rating || 0,
      items: product.reviewItems || []
    }
  };
  


const submitReview = async () => {
  if (!rating || !title) return alert("Rating & title required");

  setLoading(true);

  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("product_id", product._id);
  formData.append("reviews_rating", rating);
  formData.append("reviews_title", title);
  formData.append("reviews_comments", comment);

  images.forEach((img) => {
    formData.append("images", img);
  });

  const res = await fetch("/api/reviews/add", {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    alert("Review submitted for approval");
    setShowForm(false);
    setImages([]);
    setTitle("");
    setComment("");
    setRating(0);
  }

  setLoading(false);
};

  //console.log('Product id:', product?._id);

  const handleImageChange = (e) => {
  const files = Array.from(e.target.files);

  if (images.length + files.length > 5) {
    alert("Maximum 5 images allowed");
    return;
  }

  setImages((prev) => [...prev, ...files]);
};

const removeImage = (index) => {
  setImages(images.filter((_, i) => i !== index));
};


  useEffect(() => {
  const checkCanReview = async () => {
    try {
      const res = await fetch(
        `/api/reviews/can-review?&userId=${userId}&productcode=${product.item_code}&productId=${product._id}`
      );
      const data = await res.json();
      console.log('Can review:', data);
      setAlreadyReviewed(data.alreadyReviewed);
      setCanReview(data.canReview);
      setMessage(data.message || "");
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingReview(false);
    }
  };

  if (product?._id) {
    checkCanReview();
  }
}, [product?._id]);

  
const fetchBrand = async () => {
  try {
    const response = await fetch("/api/brand");
    const result = await response.json();
    if (result.error) {
      toast.error(result.error);
    } else {
      const data = result.data;

      // Format for react-select
      const brandOptions = data.map((b) => ({
        value: b._id,
        label: b.brand_name,
      }));

      setBrand(brandOptions);
      // 👉 If you already have the ID and want to get the label (e.g., when editing)
      if (product.brand) {
        const matched = brandOptions.find((b) => b.value === product.brand);
        if (matched) {
          //console.log("Selected Brand Name:", matched.label);
        }
      }
    }
  } catch (error) {
    toast.error(error.message);
  }
};

useEffect(() => {
  fetchBrand();
}, []);

  const fetchRelatedProducts = async () => {
    try {
      setLoadingRelated(true);
      const response = await fetch(
        `/api/product/related?categoryId=${product.category._id}&excludeId=${product._id}&limit=4`
      );
      const data = await response.json();
      if (data.success) {
        setRelatedProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const fetchRecentlyViewed = async () => {
    try {
      setLoadingRecentlyViewed(true);
      const response = await fetch(`/api/product/recently-viewed?limit=4`);
      const data = await response.json();
      if (data.success) {
        setRecentlyViewed(data.products);
      }
    } catch (error) {
      console.error("Error fetching recently viewed products:", error);
    } finally {
      setLoadingRecentlyViewed(false);
    }
  };

  const renderProductCard = (product) => {
    const discountPercentage = product.special_price 
      ? Math.round(((product.price - product.special_price) / product.price) * 100)
      : 0;

    return (
      <div key={product._id} className="border rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow relative">
        {discountPercentage > 0 && (
          <span className={`px-1 sm:px-2 py-1 text-xs font-bold text-white rounded absolute top-1 sm:top-2 left-1 sm:left-2 ${
            discountPercentage > 30 ? "bg-blue-500" : "bg-red-500"
          }`}>
            {discountPercentage}% OFF
          </span>
        )}
        
        <Link href={`/product/${product.slug || product._id}`}>
          <div className="relative h-32 sm:h-40 w-full">
            <Image 
              src={`/uploads/products/${product.images?.[0]}` || "/placeholder.jpg"} 
              alt={product.name} 
              fill
              className="object-contain rounded-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.jpg";
              }}
            />
          </div>
        </Link>

        <Link href={`/product/${product.slug || product._id}`}>
          <h3 className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 hover:text-blue-600 line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-gray-600 text-xs">By {product.brand?.brand_name || "Our Store"}</p>
        <div className="flex items-center mt-1">
          <p className="text-sm sm:text-lg font-bold">${product.special_price || product.price}</p>
          {product.special_price && (
            <p className="text-gray-500 text-xs sm:text-sm line-through ml-1 sm:ml-2">${product.price}</p>
          )}
        </div>
        <div className="flex items-center text-xs sm:text-sm mt-1">
          <FaStar className="text-yellow-400 text-xs sm:text-sm" /> 
          <span className="px-1">{product.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-gray-500">({product.reviews || 0})</span>
        </div>
        <button 
          className="w-full mt-1 sm:mt-2 py-1 sm:py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition duration-300"
          style={{ backgroundColor: '#e0e7ff', color: '#1d4ed8' }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#e0e7ff';
            e.target.style.color = '#1d4ed8';
          }}
        >
          Add To Cart <FaShoppingCart className="text-xs sm:text-sm" />
        </button>
      </div>
    );
  };

  const renderLoadingSkeleton = (count = 4) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(count)].map((_, index) => (
          <div key={index} className="border rounded-lg p-2 sm:p-3 shadow-md animate-pulse">
            <div className="bg-gray-200 h-32 sm:h-40 rounded-md"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mt-1 sm:mt-2"></div>
            <div className="h-2 sm:h-3 bg-gray-200 rounded mt-1 w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mt-1 sm:mt-2 w-1/2"></div>
            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg mt-1 sm:mt-2"></div>
          </div>
        ))}
      </div>
    );
  };

    // put this near the top of your component (before return)
  const parseJSONSafe = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value; // already an object
    if (typeof value !== "string") return null;

    const tryParse = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return undefined;
      }
    };

    let s = value.trim();

    // 1) direct parse
    let parsed = tryParse(s);
    if (parsed !== undefined) {
      // if parsed is a string again (double-encoded), recurse
      return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    }

    // 2) strip wrapping quotes if present and try again
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
      parsed = tryParse(s);
      if (parsed !== undefined) return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    }

    // 3) unescape common escaped quotes/slashes and try one last time
    try {
      const unescaped = s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      parsed = tryParse(unescaped);
      if (parsed !== undefined) return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    } catch {}

    return null; // couldn't parse
  };
  const decodeAndClean = (str) => {
    if (!str) return "";

    // Create a temporary element to decode HTML entities
    const temp = document.createElement("textarea");
    temp.innerHTML = str;
    let decoded = temp.value;

    // Remove both actual LRM char and literal "&lrm;"
    decoded = decoded.replace(/\u200E/g, "").replace(/&lrm;/gi, "");

    return decoded.trim();
  };

  const descObj = parseJSONSafe(product?.description);

  const hasValidDescription = descObj && typeof descObj === "object" && Object.keys(descObj).length > 0;
  const hasPlainDescription = product?.description && typeof product.description === "string" && !descObj;
  const hasSpecifications = [
    product.ingredients,
    product.weight,
    product.dimensions,
  ].some(Boolean);
  if (!hasValidDescription && !hasPlainDescription && !hasSpecifications) return null;

  return (
    <div className="mt-4 sm:mt-8 border border-gray-400 rounded-lg p-3 sm:p-6 bg-white shadow-sm">
      {/* Tabs */}
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 w-max min-w-full pb-2">
          <button
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "overview" ? "bg-red-600 text-white" : "text-red-800 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "description" ? "bg-red-600 text-white" : "text-red-800 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("description")}
          >
            Detailed Specs
          </button>
          <button
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "videos" ? "bg-red-600 text-white" : "text-red-800 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("videos")}
          >
            Videos
          </button>
          <button
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "reviews" ? "bg-red-600 text-white" : "text-red-800 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>

             <button
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "keySpecs" ? "bg-red-600 text-white" : "text-red-800 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("keySpecs")}
          >
             Features
          </button>

              <button
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "productHighlights" ? "bg-red-600 text-white" : "text-red-800 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("productHighlights")}
          >
              Highlights
          </button>
  
      

          
          <div className="ml-2 sm:ml-auto px-2 sm:px-4 py-1 sm:py-2 text-red-800 font-medium flex items-center text-xs sm:text-sm whitespace-nowrap">
            <SiTicktick className="text-red-800 mr-1 text-xs sm:text-sm" /> 100% Satisfaction
          </div>
        </div>

        {/* Move border lower */}
        <div className="border-b border-gray-300 mt-2 sm:mt-2"></div>
      </div>

      {/* Tab Content */}
      <div className="p-2 sm:p-4">
      {activeTab === "overview" && (
  <div>
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Product Overview</h2>
    {tabData.overview && (
      <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base">{tabData.overview}</p>
    )}

   {product.overviewdescription?.length > 0 && (
  <>
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-4 sm:mt-6">Highlights</h2>

   {Array.isArray(product.product_highlights) && product.product_highlights.length > 0 && (
  <ul className="list-disc pl-4 sm:pl-5 mt-1 sm:mt-3 text-gray-700 text-sm sm:text-base">
    {product.product_highlights.flatMap((item) =>
      item
        .split(/[\n,]+/) // split by newline or comma
        .map((subItem) => subItem.trim())
        .filter((subItem) => subItem.length > 0)
    ).map((feature, index) => (
      <li key={index}>{feature}</li>
    ))}
  </ul>
)}

  </>
)}

  </div>
)}


        {activeTab === "description" && (
          <div>
            {/* <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Product Description</h2>
            <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base">{tabData.description}</p> */}
            {(hasValidDescription || hasPlainDescription) && (
              <>
                <h2 className={`text-sm font-bold text-left ${poppins.className}`}>
                  Product Description
                </h2>

                {hasValidDescription ? (
                  <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
                    {Object.entries(descObj).map(([key, val]) => {
                      const cleanKey = decodeAndClean(key);
                      const cleanVal = decodeAndClean(val);
                      return (
                        <div
                          key={cleanKey}
                          className="grid grid-cols-[150px,1fr] gap-x-2 items-start"
                        >
                          <div className={`text-xs sm:text-sm font-bold ${poppins.className}`}>
                            {cleanKey}:
                          </div>
                          <div className={`text-xs sm:text-sm ${poppins.className}`}>
                            {cleanVal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="mt-3 text-xs sm:text-sm text-gray-700 prose prose-gray max-w-none text-left [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_tr:nth-child(even)]:bg-gray-50 [&_th]:bg-gray-100 [&_th]:font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: decodeAndClean(String(product?.description || "")),
                    }}
                  />
                )}
              </>
            )}


            {product.features?.length > 0 && (
              <>
                <h2 className="text-lg sm:text-xl font-semibold text-grya-900 mt-3 sm:mt-6">Key Features</h2>
                <ul className="list-disc pl-4 sm:pl-5 mt-1 sm:mt-3 text-gray-700 text-sm sm:text-base">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </>
            )}

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-3 sm:mt-6">Product Specifications</h2>
            <ul className="mt-1 sm:mt-2 space-y-2 text-gray-700 text-sm sm:text-base">
           <li className="flex items-center space-x-2 text-sm">
              <div className="w-5 h-5 flex items-center justify-center bg-red-600 rounded-md">
                <TbBrandAppgallery size={14} className="text-white" />
              </div>
              <strong>Brand:</strong>
              <span>
                {
                  brand.find((b) => b.value === product.brand)?.label || "N/A"
                }
              </span>
            </li>
            <li className="flex items-center space-x-2 text-sm">
                <div className="w-5 h-5 flex items-center justify-center bg-red-600 rounded-md">
                <FiBox size={14} className="text-white" />
                </div>
                <strong>Quantity:</strong>
                <span>{product.quantity || "N/A"}</span>
              </li>
             <li className="flex items-center space-x-2 text-sm">
              <div className="w-5 h-5 flex items-center justify-center bg-red-600 rounded-md">
              <FiHash size={16} className="text-white" />
              </div>
              <strong>Item Code:</strong>
              <span>{product.item_code || "N/A"}</span>
            </li>

            </ul>
          </div>
        )}

        {activeTab === "videos" && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-grya-900">Product Videos</h2>
            {tabData.videos.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-2 sm:mt-4">
                {tabData.videos.map((video, index) => (
                  <div key={index} className="aspect-w-16 aspect-h-9">
                    <iframe
                      className="w-full h-48 sm:h-64 rounded-lg"
                      src={video.url}
                      title={video.title || `Product Video ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    {video.title && (
                      <p className="mt-1 sm:mt-2 font-medium text-gray-800 text-sm sm:text-base">{video.title}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">No videos available for this product.</p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
  <div className="grid grid-cols-2  sm:p-6 gap-4 border rounded-lg bg-white">
    <div className="p-2 sm:p-4 border rounded-lg bg-white">
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
      Customer Reviews
    </h2>

    {/* Write Review Section */}
    {!checkingReview && canReview && (
      <div className="mt-4 p-4 border rounded-lg bg-green-50">
        <p className="text-green-700 font-medium text-sm mb-2">
          You have purchased and received this product ✔
        </p>

        <button
  onClick={() => setShowForm(!showForm)}
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
>
  Write a Review
</button>

{showForm && (
  <>
    {/* BACKDROP */}
    <div
      className="fixed inset-0 bg-black/50 z-40"
      onClick={() => setShowForm(false)}
    />

    {/* MODAL */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg relative max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <h3 className="text-lg font-semibold">Write a Review</h3>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">

          {/* Rating */}
          <div>
            <label className="text-sm font-medium">Rating</label>
            <div className="mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer text-3xl ${
                    star <= rating
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className="w-full p-2 border rounded"
          />

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
            className="w-full p-2 border rounded"
            rows={4}
          />

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium">
              Upload Images (max 5)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2"
            />

            {/* Preview */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(img)}
                    alt="preview"
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 justify-end pt-3 border-t">
            <button
              onClick={() => {
                setShowForm(false);
                setRating(0);
                setTitle("");
                setComment("");
                setImages([]);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>

            <button
              onClick={submitReview}
              disabled={loading || rating === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
)}



      </div>
    )}

       {alreadyReviewed && (
  <p className="text-sm text-orange-600 font-medium">
    {message}
  </p>
)}

    {!checkingReview && !canReview && !alreadyReviewed && (
      <p className="mt-4 text-sm text-gray-500">
        Only customers who ordered and received this product can write a review.
      </p>
    )}

 

    </div>

    <div  className="p-2 sm:p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-4">Ratings & Reviews</h2>
    {/* Existing Reviews */}
    <ProductReviews productId={product._id} />
    </div>
  </div>
)}


       {activeTab === "keySpecs" && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Product Features</h2>
            {product.key_specifications &&
  typeof product.key_specifications === "string" ? (
    (() => {
      try {
        const parsed = JSON.parse(product.key_specifications);
        if (typeof parsed === "object" && parsed !== null) {
          return (
            <div className="mt-2 p-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            {Object.entries(parsed).map(([key, value], idx) => (
              <li key={idx}>
                <span className="font-bold ">{key}:</span> <span className="text-gray-600 text-right">{value}</span>
              </li>
            ))}
          </ol>
        </div>

          );
        } else {
          const words = product.key_specifications.split(" ");
          const shortText = words.slice(0, 50).join(" ");
          return (
            <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base text-justify">
              {words.length > 50 ? shortText + "..." : product.key_specifications}
            </p>
          );
        }
      } catch (err) {
        const words = product.key_specifications.split(" ");
        const shortText = words.slice(0, 50).join(" ");
        return (
          <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base text-justify">
            {words.length > 50 ? shortText + "..." : product.key_specifications}
          </p>
        );
      }
    })()
  ) : (
    <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">No features available.</p>
  )}
          </div>
        )}



       {activeTab === "productHighlights" && (
  <div>
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Product Highlights</h2>

  {Array.isArray(product.product_highlights) && product.product_highlights.length > 0 ? (
  <ul className="list-disc pl-4 sm:pl-5 mt-1 sm:mt-3 text-gray-700 text-sm sm:text-base">
    {product.product_highlights
      .map((item) =>
        item
          .replace(/^\[|\]$/g, '')     // remove starting and ending brackets
          .replace(/^"|"$/g, '')       // remove wrapping quotes
          .replace(/\\"/g, '') 
          .replace(/[\[\]{}"]/g, '') // <-- removes curly braces, square brackets, quotes
          .replace(/\s+/g, ' ')        // remove escaped quotes
          .trim()
      )
      .flatMap((cleanedItem) =>
        cleanedItem
          .split(/[\n]+/)              // split by newlines only (remove `,` to keep full phrases)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      )
      .map((feature, index) => (
        <li key={index}>{feature}</li>
      ))}
  </ul>
) : (
  <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">No highlights available.</p>
)}

  </div>
)}


      </div>
    </div>
  );
}
