"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null); // track hovered category

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories/get");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getSubcategories = (parentId) =>
    categories.filter(
      (cat) => cat.parentid === parentId && cat.status === "Active"
    );

  const topCategories = categories.filter(
    (cat) => cat.parentid === "none" && cat.status === "Active"
  );

  // Function to chunk brands into groups of 10
  const chunkBrands = (brands, chunkSize = 10) => {
    const chunks = [];
    for (let i = 0; i < brands.length; i += chunkSize) {
      chunks.push(brands.slice(i, i + chunkSize));
    }
    return chunks;
  };

  return (
   <div className="hidden lg:flex items-center space-x-10 ml-4 whitespace-nowrap relative">

  {/* HOME link */}
  <Link
    href="/"
    className="text-white hover:text-white font-bold text-[12px] uppercase py-[21px] tracking-[0.5px]"
  >
    HOME
  </Link>

  {/* Top Categories */}
  {!loading &&
    topCategories.map((topCat) => (
      <div
        key={topCat._id}
        className="relative"
        onMouseEnter={() => setActiveCat(topCat)}
        onMouseLeave={() => setActiveCat(null)}
      >
        <Link
          href={`/category/${topCat.category_slug}`}
          className="flex items-center text-white hover:text-white font-bold text-[12px] uppercase py-[21px] tracking-[0.5px]"
        >
          {topCat.category_name.toUpperCase()}
          {/* <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg> */}

          {/* Show arrow ONLY if subcats or brands exist */}
        {(getSubcategories(topCat._id).length > 0 || topCat.brands?.length > 0) && (
          <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        )}
        </Link>

        {/* ======================
            MEGA MENU DROPDOWN
            <div className="absolute top-[100%] left-full -translate-x-1/2 mt-[2px] bg-white shadow-xl border-t z-50 flex" onMouseEnter={() => setActiveCat(topCat)} onMouseLeave={() => setActiveCat(null)}>
           ====================== */}
        {activeCat?._id === topCat._id &&
          (getSubcategories(topCat._id).length > 0 ||
            topCat.brands?.length > 0) && (
            <div
              className={`
                absolute 
                top-[100%] 
                left-full 
                ${topCat.category_name === "Accessories" ? "-translate-x-4/3" : "-translate-x-1/2"} 
                mt-[2px] 
                bg-white 
                shadow-xl 
                border-t 
                z-50 
                flex
              `}
              onMouseEnter={() => setActiveCat(topCat)}
              onMouseLeave={() => setActiveCat(null)}
            >

              <div className="flex">
                {(() => {
                  // MERGE SUBCATEGORIES
                  const subcats = getSubcategories(topCat._id).map((s) => ({
                    type: "sub",
                    id: s._id,
                    name: s.category_name,
                    slug: `/category/${topCat.category_slug}/${s.category_slug}`,
                  }));

                  // MERGE BRANDS
                  const brands = (topCat.brands || []).map((b) => ({
                    type: "brand",
                    id: b._id,
                    name: b.brand_name,
                    slug: `/brand/${b.brand_slug || b._id}`,
                  }));

                  // MERGED ARRAY
                  const merged = [
                    ...subcats,
                    ...(brands.length
                      ? [{ type: "heading", name: "BRANDS", id: "heading" }]
                      : []),
                    ...brands,
                  ];

                  // SPLIT INTO COLUMNS OF 10
                  const columns = [];
                  for (let i = 0; i < merged.length; i += 10) {
                    columns.push(merged.slice(i, i + 10));
                  }

                  return (
                    <>
                      {/* {columns.length <= 6 && columns.map((col, colIndex) => ( */}
                      {columns.slice(0, 6).map((col, colIndex) => (
                        <div
                          key={colIndex}
                          className={`flex flex-col px-4 py-3 border-r w-56 ${
                            colIndex % 2 === 0 ? "bg-white" : "bg-red-50"
                          }`}
                        >
                          {/* Main title only in first column */}
                          {colIndex === 0 && (
                            <h3 className="text-[14px] font-bold text-[#222529] mb-3 uppercase">
                              {topCat.category_name.toUpperCase()}
                            </h3>
                          )}

                          <div className="flex flex-col gap-2">
                            {col.map((item) =>
                              item.type === "heading" ? (
                                <div
                                  key={item.id}
                                  className="text-[12px] font-bold uppercase mt-2"
                                >
                                  {item.name}
                                </div>
                              ) : (
                                <Link
                                  key={item.id}
                                  href={item.slug}
                                  className="text-[12px] text-[#222529] hover:text-red-500 font-semibold uppercase"
                                >
                                  {item.name.toUpperCase()}
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      ))}

                      {/* IMAGE COLUMN */}
                      {columns.length <= 5 && topCat.navImage && (
                        <div className="w-56 flex items-center justify-center bg-white">
                          <img
                            src={topCat.navImage}
                            alt={topCat.category_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
      </div>
    ))}

</div>

);
}