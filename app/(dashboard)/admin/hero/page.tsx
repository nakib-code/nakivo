"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Trash2,
  Loader2,
  Plus,
  Pencil,
  Power,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface HeroBanner {
  _id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  order?: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function sortBanners(list: HeroBanner[]): HeroBanner[] {
  return [...list].sort(
    (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)
  );
}

export default function HeroListPage() {
  const [heroes, setHeroes] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit Dialog State
  const [editingHero, setEditingHero] = useState<HeroBanner | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editButtonText, setEditButtonText] = useState("");
  const [editButtonLink, setEditButtonLink] = useState("");
  const [editOrder, setEditOrder] = useState("0");
  const [editActive, setEditActive] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    return () => {
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [editImagePreview]);

  // =========================
  // Fetch Heroes
  // =========================

  useEffect(() => {
    let active = true;

    async function loadHeroes() {
      try {
        const res = await fetch("/api/admin/hero", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load heroes");
        }

        if (active) {
          setHeroes(sortBanners(Array.isArray(data.data) ? data.data : []));
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load heroes",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHeroes();

    return () => {
      active = false;
    };
  }, []);

  // =========================
  // Open Edit Modal
  // =========================

  const openEditDialog = (hero: HeroBanner) => {
    setEditingHero(hero);
    setEditTitle(hero.title || "");
    setEditDescription(hero.description || "");
    setEditButtonText(hero.buttonText || "Shop Now");
    setEditButtonLink(hero.buttonLink || "/products");
    setEditOrder(String(hero.order ?? 0));
    setEditActive(Boolean(hero.active));
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const closeEditDialog = () => {
    if (savingEdit) return;
    setEditingHero(null);
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const handleEditImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      toast.error(
        "Unsupported image type. Allowed: JPEG, PNG, WebP, GIF, AVIF"
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must not exceed 5MB");
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  // =========================
  // Save Edited Banner
  // =========================

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingHero) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      toast.error("Banner title is required");
      return;
    }

    const parsedOrder = Number(editOrder);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      toast.error("Display order must be a non-negative integer");
      return;
    }

    try {
      setSavingEdit(true);

      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("description", editDescription.trim());
      formData.append("buttonText", editButtonText.trim() || "Shop Now");
      formData.append("buttonLink", editButtonLink.trim() || "/products");
      formData.append("order", String(parsedOrder));
      formData.append("active", String(editActive));

      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const res = await fetch(`/api/admin/hero/${editingHero._id}`, {
        method: "PATCH",
        body: formData,
      });

      const result = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: HeroBanner;
      } | null;

      if (!res.ok || !result?.success || !result.data) {
        throw new Error(result?.message || "Failed to update banner");
      }

      const updated = result.data;
      setHeroes((prev) =>
        sortBanners(
          prev.map((item) => (item._id === updated._id ? updated : item))
        )
      );

      toast.success("Hero banner updated successfully");
      setEditingHero(null);
      setEditImageFile(null);
      setEditImagePreview("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update banner"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================
  // Toggle Active Status
  // =========================

  const handleToggleActive = async (hero: HeroBanner) => {
    try {
      setTogglingId(hero._id);

      const res = await fetch(`/api/admin/hero/${hero._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !hero.active }),
      });

      const result = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: HeroBanner;
      } | null;

      if (!res.ok || !result?.success || !result.data) {
        throw new Error(result?.message || "Failed to update banner status");
      }

      const updated = result.data;
      setHeroes((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );

      toast.success(
        updated.active ? "Banner activated" : "Banner deactivated"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  // =========================
  // Delete Hero
  // =========================

  const deleteHero = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this hero?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(id);

      const res = await fetch(`/api/admin/hero/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      toast.success("Hero deleted successfully");

      setHeroes((prev) => prev.filter((hero) => hero._id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hero Banners</h1>
          <p className="text-sm text-muted-foreground">
            Manage homepage hero banners, ordering, and visibility
          </p>
        </div>

        <Link href="/admin/hero/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Hero
          </Button>
        </Link>
      </div>

      {heroes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hero banner found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {heroes.map((hero) => (
            <Card key={hero._id} className="overflow-hidden">
              {/* Image */}
              <div className="relative h-52 w-full bg-slate-100">
                {hero.image ? (
                  <Image
                    src={hero.image}
                    alt={hero.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">
                  Order #{hero.order ?? 0}
                </span>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-1">{hero.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {hero.description || "No subtitle provided"}
                </p>

                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-semibold">Button:</span>{" "}
                    {hero.buttonText}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold">Link:</span>{" "}
                    {hero.buttonLink}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                  <button
                    type="button"
                    disabled={togglingId === hero._id}
                    onClick={() => handleToggleActive(hero)}
                    title={
                      hero.active
                        ? "Click to deactivate banner"
                        : "Click to activate banner"
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                      hero.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {togglingId === hero._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Power className="h-3 w-3" />
                    )}
                    {hero.active ? "Active" : "Inactive"}
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(hero)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deleting === hero._id}
                      onClick={() => deleteHero(hero._id)}
                    >
                      {deleting === hero._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="ml-1.5">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Hero Banner Dialog */}
      <Dialog
        open={Boolean(editingHero)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Hero Banner</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {/* Image Preview & Replacement */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Banner Image (optional replacement, max 5MB)
              </label>

              {(editImagePreview || editingHero?.image) && (
                <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-slate-100">
                  <img
                    src={editImagePreview || editingHero?.image || ""}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleEditImageChange}
                disabled={savingEdit}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-hero-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-hero-title"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={savingEdit}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-hero-description"
                className="text-sm font-medium"
              >
                Subtitle / Description
              </label>
              <Input
                id="edit-hero-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={savingEdit}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-hero-btn-text"
                  className="text-sm font-medium"
                >
                  Button Text
                </label>
                <Input
                  id="edit-hero-btn-text"
                  value={editButtonText}
                  onChange={(e) => setEditButtonText(e.target.value)}
                  disabled={savingEdit}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-hero-btn-link"
                  className="text-sm font-medium"
                >
                  Button Link
                </label>
                <Input
                  id="edit-hero-btn-link"
                  value={editButtonLink}
                  onChange={(e) => setEditButtonLink(e.target.value)}
                  placeholder="/products"
                  disabled={savingEdit}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-hero-order"
                  className="text-sm font-medium"
                >
                  Display Order
                </label>
                <Input
                  id="edit-hero-order"
                  type="number"
                  min={0}
                  step={1}
                  value={editOrder}
                  onChange={(e) => setEditOrder(e.target.value)}
                  disabled={savingEdit}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-2 text-sm font-medium sm:pt-5">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  disabled={savingEdit}
                  className="h-4 w-4 accent-black"
                />
                Active on homepage
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
