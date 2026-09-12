"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export default function RemovedProductTable() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringIds, setRestoringIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchRemovedProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/product/removed");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch removed products");
      }

      setProducts(data);
    } catch (error) {
      console.error("Error fetching removed products:", error);
      setErrorMessage("Failed to load removed products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemovedProducts();
  }, []);

  const handleRestoreProduct = async (productIds) => {
    const ids = Array.isArray(productIds) ? productIds : [productIds];

    try {
      setRestoringIds(ids);
      setErrorMessage("");

      const response = await fetch("/api/product/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to restore product");
      }

      setSuccessMessage(`${ids.length} product${ids.length === 1 ? "" : "s"} restored successfully.`);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => !ids.includes(product._id))
      );
      setSelectedProductIds([]);
    } catch (error) {
      console.error("Error restoring product:", error);
      setErrorMessage("Failed to restore product(s).");
    } finally {
      setRestoringIds([]);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId]
    );
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      product.name?.toLowerCase().includes(query) ||
      product.slug?.toLowerCase().includes(query) ||
      product.item_code?.toLowerCase().includes(query)
    );
  });

  const allFilteredProductsSelected = filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedProductIds.includes(product._id));

  const toggleFilteredProductSelection = () => {
    const filteredProductIds = filteredProducts.map((product) => product._id);

    setSelectedProductIds((currentIds) =>
      allFilteredProductsSelected
        ? currentIds.filter((id) => !filteredProductIds.includes(id))
        : [...new Set([...currentIds, ...filteredProductIds])]
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Removed Product List</h2>
      </div>

      {successMessage ? (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="bg-red-500 text-white px-4 py-2 rounded-md mb-4">
          {errorMessage}
        </div>
      ) : null}

      <div className="bg-white shadow-md rounded-lg p-5 mb-5">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search removed product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {selectedProductIds.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => handleRestoreProduct(selectedProductIds)}
              disabled={restoringIds.length > 0}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md inline-flex items-center gap-2"
            >
              <Icon icon="mdi:restore" />
              Restore selected ({selectedProductIds.length})
            </button>
          </div>
        )}

        {isLoading ? (
          <p>Loading removed products...</p>
        ) : (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full border border-gray-300" style={{ minWidth: "900px" }}>
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">
                    <input
                      type="checkbox"
                      checked={allFilteredProductsSelected}
                      onChange={toggleFilteredProductSelection}
                      aria-label="Select all removed products"
                    />
                  </th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Item Code</th>
                  <th className="p-2">Image</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Removed At</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="text-center border-b">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleRestoreProduct(product._id)}
                          disabled={restoringIds.length > 0}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-2 rounded-md inline-flex items-center gap-2"
                          title="Restore Product"
                        >
                          <Icon icon="mdi:restore" />
                          <span>
                            {restoringIds.includes(product._id) ? "Restoring..." : "Restore"}
                          </span>
                        </button>
                      </td>
                      <td className="p-2">{product.item_code || "-"}</td>
                      <td className="p-2">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={`/uploads/products/${product.images[0]}`}
                            alt={product.name}
                            className="w-12 h-12 object-contain mx-auto"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/no-image.jpg";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="max-w-xs mx-auto truncate" title={product.name}>
                          {product.name || "-"}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        Rs. {Number(product.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2">
                        {Number(product.quantity || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 font-semibold">
                        <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full font-medium text-sm">
                          Removed
                        </span>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {product.removedAt
                          ? new Date(product.removedAt).toLocaleString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center p-4">
                      No removed products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
