import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Download,
  Eye,
  EyeOff,
  X,
  Upload,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { useAdminMagazineList } from "@/hooks/useAdminMagazineList";
import {
  useCreateMagazine,
  useUpdateMagazine,
  useDeleteMagazine,
} from "@/hooks/useMagazineMutation";
import { uploadImage } from "@/lib/uploadImage";
import Pagination from "@/components/product/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import type { DigitalMagazine } from "@/types";
import toast from "react-hot-toast";

interface MagazineFormData {
  title: string;
  description: string;
  cover_image_url: string;
  file_url: string;
  issue_date: string;
  is_active: boolean;
}

const EMPTY_FORM: MagazineFormData = {
  title: "",
  description: "",
  cover_image_url: "",
  file_url: "",
  issue_date: "",
  is_active: true,
};

export default function AdminMagazinesPage() {
  const { data, isLoading, search, page, setFilter } =
    useAdminMagazineList();
  const createMutation = useCreateMagazine();
  const updateMutation = useUpdateMagazine();
  const deleteMutation = useDeleteMagazine();

  const [editingMag, setEditingMag] = useState<DigitalMagazine | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MagazineFormData>(EMPTY_FORM);
  const [uploading, setUploading] = useState<"cover" | "pdf" | null>(null);

  const openCreate = () => {
    setEditingMag(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (mag: DigitalMagazine) => {
    setEditingMag(mag);
    setForm({
      title: mag.title,
      description: mag.description ?? "",
      cover_image_url: mag.cover_image_url ?? "",
      file_url: mag.file_url ?? "",
      issue_date: mag.issue_date ?? "",
      is_active: mag.is_active,
    });
    setFormOpen(true);
  };

  const handleUploadCover = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    try {
      const url = await uploadImage(file, "magazines");
      setForm((f) => ({ ...f, cover_image_url: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleUploadPdf = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF must be under 50MB");
      return;
    }
    setUploading("pdf");
    try {
      const url = await uploadImage(file, "magazines");
      setForm((f) => ({ ...f, file_url: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      if (editingMag) {
        await updateMutation.mutateAsync({ id: editingMag.id, data: form });
        toast.success("Magazine updated");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Magazine created");
      }
      setFormOpen(false);
    } catch {
      toast.error("Failed to save magazine");
    }
  };

  const handleDelete = async (mag: DigitalMagazine) => {
    if (!confirm(`Delete "${mag.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(mag.id);
      toast.success("Magazine deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleActive = async (mag: DigitalMagazine) => {
    try {
      await updateMutation.mutateAsync({
        id: mag.id,
        data: {
          title: mag.title,
          is_active: !mag.is_active,
        },
      });
      toast.success(mag.is_active ? "Magazine hidden" : "Magazine published");
    } catch {
      toast.error("Failed to update");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Helmet>
        <title>Magazines | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Digital Magazines
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage free digital magazine issues.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Issue
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Search magazines..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Cover
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Title
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Issue Date
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Downloads
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.magazines.map((mag) => (
                    <tr key={mag.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {mag.cover_image_url ? (
                          <img
                            src={mag.cover_image_url}
                            alt=""
                            className="h-14 w-10 rounded border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-10 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-300">
                            <Download className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {mag.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {mag.issue_date
                          ? format(
                              new Date(mag.issue_date),
                              "yyyy-MM-dd",
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Download className="h-3.5 w-3.5" />
                          {mag.download_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(mag)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            mag.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {mag.is_active ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {mag.is_active ? "Active" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(mag)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mag)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.magazines.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        No magazines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  current={page}
                  total={data.totalPages}
                  onChange={(p) => setFilter("page", String(p))}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-primary">
                {editingMag ? "Edit Magazine" : "New Magazine"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Korean Local Travel Contents - June 2024"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Brief description of this issue..."
                />
              </div>

              {/* Issue Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Issue Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issue_date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cover Image
                </label>
                {form.cover_image_url ? (
                  <div className="relative inline-block">
                    <img
                      src={form.cover_image_url}
                      alt="Cover"
                      className="h-32 w-24 rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      onClick={() =>
                        setForm((f) => ({ ...f, cover_image_url: "" }))
                      }
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-primary hover:text-primary">
                    {uploading === "cover" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading === "cover"
                      ? "Uploading..."
                      : "Upload cover image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCover}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* PDF Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  PDF File
                </label>
                {form.file_url ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <Download className="h-4 w-4" />
                    <span className="flex-1 truncate">PDF uploaded</span>
                    <button
                      onClick={() =>
                        setForm((f) => ({ ...f, file_url: "" }))
                      }
                      className="text-red-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-primary hover:text-primary">
                    {uploading === "pdf" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading === "pdf"
                      ? "Uploading..."
                      : "Upload PDF (max 50MB)"}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleUploadPdf}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  Active (visible on public page)
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingMag ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
