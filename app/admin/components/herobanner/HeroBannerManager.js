"use client";

import { useEffect, useState } from "react";

const emptyBanner = {
  banner_image: null,
  redirect_url: "",
  status: "Active",
};

export default function HeroBannerManager() {
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState(emptyBanner);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [editingStates, setEditingStates] = useState({});
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/topbanner");
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to fetch hero banners.");
        return;
      }

      setBanners(data.banners || []);

      const states = {};
      (data.banners || []).forEach((banner) => {
        states[banner._id] = {
          redirect_url: banner.redirect_url || "",
          status: banner.status || "Active",
          banner_image: null,
          error: "",
        };
      });
      setEditingStates(states);
    } catch (err) {
      setError("Failed to fetch hero banners.");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetNewBanner = () => {
    setNewBanner(emptyBanner);
    setShowAddForm(false);
    setError("");
    setImageError("");
  };

  const handleSave = async () => {
    setError("");
    setImageError("");

    if (!newBanner.banner_image) {
      setImageError("Please choose a banner image.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("banner_image", newBanner.banner_image);
      formData.append("redirect_url", newBanner.redirect_url.trim());
      formData.append("status", newBanner.status);

      const res = await fetch("/api/topbanner", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to save hero banner.");
        return;
      }

      resetNewBanner();
      fetchBanners();
    } catch (err) {
      setError("Failed to save hero banner.");
    } finally {
      setLoading(false);
    }
  };

  const handleExistingChange = (id, field, value) => {
    setEditingStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        error: "",
      },
    }));
  };

  const handleUpdate = async (id) => {
    const current = editingStates[id];
    if (!current) return;

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("redirect_url", current.redirect_url || "");
      formData.append("status", current.status || "Active");

      if (current.banner_image) {
        formData.append("banner_image", current.banner_image);
      }

      const res = await fetch("/api/topbanner", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        setEditingStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            error: data.message || "Failed to update hero banner.",
          },
        }));
        return;
      }

      fetchBanners();
    } catch (err) {
      setError("Failed to update hero banner.");
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= banners.length) return;

    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    setBanners(reordered);

    try {
      const res = await fetch("/api/topbanner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((banner) => banner._id) }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to reorder hero banners.");
        fetchBanners();
      }
    } catch (err) {
      setError("Failed to reorder hero banners.");
      fetchBanners();
    }
  };

  const openDeleteModal = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setBannerToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;

    setLoading(true);

    try {
      const res = await fetch("/api/topbanner", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bannerToDelete._id }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to delete hero banner.");
        return;
      }

      closeDeleteModal();
      fetchBanners();
    } catch (err) {
      setError("Failed to delete hero banner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hero Banner Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage the homepage slider banners shown at the top of the home page.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showAddForm ? "Close" : "+ Add Banner"}
        </button>
      </div>

      {(error || imageError) && (
        <div className="space-y-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {imageError && <p className="text-sm text-red-600">{imageError}</p>}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-lg font-semibold">Add New Hero Banner</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewBanner({
                    ...newBanner,
                    banner_image: e.target.files?.[0] || null,
                  })
                }
                className="w-full border px-3 py-2 rounded"
              />
              <p className="text-xs text-gray-500">Recommended size: 1920x600 or similar wide banner.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Redirect URL
              </label>
              <input
                type="text"
                value={newBanner.redirect_url}
                onChange={(e) =>
                  setNewBanner({ ...newBanner, redirect_url: e.target.value })
                }
                placeholder="/category/mobiles (optional)"
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="max-w-xs space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={newBanner.status}
              onChange={(e) => setNewBanner({ ...newBanner, status: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Banner"}
            </button>
            <button
              onClick={resetNewBanner}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500">
            No hero banners added yet.
          </div>
        ) : (
          banners.map((banner, index) => (
            <div
              key={banner._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
            >
              <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div>
                  <img
                    src={banner.banner_image}
                    alt={`Hero banner ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">Banner {index + 1}</p>
                      <p className="text-xs text-gray-500">Current order in homepage slider</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="px-3 py-2 rounded bg-gray-100 text-gray-700 disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        onClick={() => handleMove(index, 1)}
                        disabled={index === banners.length - 1}
                        className="px-3 py-2 rounded bg-gray-100 text-gray-700 disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        onClick={() => openDeleteModal(banner)}
                        className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Redirect URL
                      </label>
                      <input
                        type="text"
                        value={editingStates[banner._id]?.redirect_url || ""}
                        onChange={(e) =>
                          handleExistingChange(banner._id, "redirect_url", e.target.value)
                        }
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        value={editingStates[banner._id]?.status || "Active"}
                        onChange={(e) =>
                          handleExistingChange(banner._id, "status", e.target.value)
                        }
                        className="w-full border px-3 py-2 rounded"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Replace Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleExistingChange(
                            banner._id,
                            "banner_image",
                            e.target.files?.[0] || null
                          )
                        }
                        className="w-full border px-3 py-2 rounded"
                      />
                      {editingStates[banner._id]?.error && (
                        <p className="text-sm text-red-600">
                          {editingStates[banner._id].error}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleUpdate(banner._id)}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900">Delete hero banner?</h3>
            <p className="text-sm text-gray-600 mt-2">
              This will remove the banner from the homepage slider.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
