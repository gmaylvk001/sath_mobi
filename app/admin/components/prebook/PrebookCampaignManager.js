"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const emptyForm = {
  product_name: "",
  product_details: "",
  status: "Active",
  banner_image: null,
  mobile_banner_image: null,
  detail_images: [],
  retained_detail_images: [],
};

export default function PrebookCampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/prebook-campaign", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      setCampaigns(result.campaigns);
    } catch (requestError) {
      setError(requestError.message || "Unable to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const startEdit = (campaign) => {
    setEditing(campaign);
    setForm({
      product_name: campaign.product_name || "",
      product_details: campaign.product_details || "",
      status: campaign.status || "Active",
      banner_image: null,
      mobile_banner_image: null,
      detail_images: [],
      retained_detail_images: campaign.detail_images || [],
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      if (editing) payload.append("id", editing._id);
      payload.append("product_name", form.product_name);
      payload.append("product_details", form.product_details);
      payload.append("status", form.status);
      if (form.banner_image) payload.append("banner_image", form.banner_image);
      if (form.mobile_banner_image) {
        payload.append("mobile_banner_image", form.mobile_banner_image);
      }
      form.detail_images.forEach((file) => payload.append("detail_images", file));
      if (editing) {
        payload.append(
          "retained_detail_images",
          JSON.stringify(form.retained_detail_images)
        );
      }

      const response = await fetch("/api/prebook-campaign", {
        method: editing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: payload,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save campaign.");
      }

      setMessage(editing ? "Campaign updated successfully." : "Campaign added successfully.");
      resetForm();
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError.message || "Unable to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pre-booking Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add or edit the public pre-booking banner and product details.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-5 text-lg font-semibold">
          {editing ? "Edit campaign" : "Add campaign"}
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Product name *</span>
            <input
              required
              value={form.product_name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  product_name: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, status: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Product details</span>
            <textarea
              rows={6}
              value={form.product_details}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  product_details: event.target.value,
                }))
              }
              placeholder="Enter product features, launch information and offer details"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Desktop banner {!editing && "*"}
            </span>
            <input
              type="file"
              accept="image/*"
              required={!editing}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  banner_image: event.target.files?.[0] || null,
                }))
              }
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {editing?.banner_image && !form.banner_image && (
              <Image
                src={editing.banner_image}
                alt="Current desktop banner"
                width={480}
                height={180}
                className="mt-3 h-28 w-full rounded-lg object-cover"
              />
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Mobile banner (optional)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  mobile_banner_image: event.target.files?.[0] || null,
                }))
              }
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {editing?.mobile_banner_image && !form.mobile_banner_image && (
              <Image
                src={editing.mobile_banner_image}
                alt="Current mobile banner"
                width={240}
                height={240}
                className="mt-3 h-28 w-28 rounded-lg object-cover"
              />
            )}
          </label>

          <div className="md:col-span-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Small detail banners (optional)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    detail_images: Array.from(event.target.files || []),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 p-2"
              />
              <span className="mt-1 block text-xs text-gray-500">
                You can select multiple side images for product features and offers.
              </span>
            </label>

            {form.detail_images.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {form.detail_images.length} new image(s) selected
              </div>
            )}

            {editing && form.retained_detail_images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {form.retained_detail_images.map((image) => (
                  <div key={image} className="relative overflow-hidden rounded-lg border">
                    <Image
                      src={image}
                      alt="Small detail banner"
                      width={320}
                      height={180}
                      className="aspect-video w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          retained_detail_images:
                            previous.retained_detail_images.filter(
                              (currentImage) => currentImage !== image
                            ),
                        }))
                      }
                      className="absolute right-1 top-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : editing ? "Update campaign" : "Add campaign"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-5 py-2.5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="font-semibold">Campaigns</h2>
        </div>
        {loading ? (
          <p className="p-6 text-gray-500">Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <p className="p-6 text-gray-500">No campaigns added.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Banner</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="border-t">
                    <td className="px-4 py-3">
                      <Image
                        src={campaign.banner_image}
                        alt={campaign.product_name}
                        width={120}
                        height={50}
                        className="h-12 w-28 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{campaign.product_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          campaign.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(campaign.updatedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="flex gap-2 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => startEdit(campaign)}
                        className="rounded bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      {campaign.slug && (
                        <Link
                          href={`/prebook/${campaign.slug}`}
                          target="_blank"
                          className="rounded bg-green-50 px-3 py-1.5 text-green-700 hover:bg-green-100"
                        >
                          View
                        </Link>
                      )}
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
