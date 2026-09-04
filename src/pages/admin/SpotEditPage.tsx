import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SpotForm } from "@/components/admin/spots";
import { useAdminSpot } from "@/hooks/useAdminSpot";
import type { SpotFormData } from "@/types/admin";

export default function SpotEditPage() {
  const { id } = useParams<{ id: string }>();
  const spotId = id ? Number(id) : undefined;
  const { data: spot, isLoading, error } = useAdminSpot(spotId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-red-500">Spot not found</p>
        <Link to="/admin/spots" className="mt-4 text-sm text-primary hover:underline">
          Back to Spots
        </Link>
      </div>
    );
  }

  const defaultValues: Partial<SpotFormData> = {
    title: spot.title,
    slug: spot.slug,
    region: spot.region ?? "",
    area: spot.area ?? "",
    spot_type: spot.spot_type ?? "",
    tagline: spot.tagline ?? "",
    description: spot.description ?? "",
    tips: spot.tips ?? "",
    address: spot.address ?? "",
    google_maps_url: spot.google_maps_url ?? "",
    latitude: spot.latitude,
    longitude: spot.longitude,
    hours: spot.hours ?? "",
    price_range: spot.price_range ?? "",
    phone: spot.phone ?? "",
    website: spot.website ?? "",
    instagram: spot.instagram ?? "",
    thumbnail_url: spot.thumbnail_url ?? "",
    images: (Array.isArray(spot.images) ? (spot.images as string[]) : []),
    related_post_slugs: spot.related_post_slugs ?? [],
    badge: spot.badge ?? "",
    editor_pick: spot.editor_pick,
    is_active: spot.is_active,
    sort_order: spot.sort_order,
  };

  return (
    <>
      <Helmet>
        <title>Edit {spot.title} | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6">
          <Link to="/admin/spots" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Spots
          </Link>
          <h1 className="text-2xl font-bold text-primary">Edit: {spot.title}</h1>
        </div>

        <SpotForm mode="edit" spotId={spotId} defaultValues={defaultValues} />
      </div>
    </>
  );
}
