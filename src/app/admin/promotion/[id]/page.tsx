"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { PromotionApiRequest } from "@/api-request/promotion";
import type {
  Promotion,
  PromotionStatus,
  PromotionDiscountType,
  PromotionApplyScope,
} from "@/types/promotion";

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPromotion();
    }
  }, [id]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await PromotionApiRequest.getPromotionById(id);

      if (response.payload.success) {
        setPromotion(response.payload.data);
      } else {
        setError("Failed to fetch promotion details");
      }
    } catch (err: any) {
      console.error("Error fetching promotion:", err);
      setError(err.message || "An error occurred while fetching promotion");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this promotion?")) {
      return;
    }

    try {
      setDeleting(true);
      await PromotionApiRequest.deletePromotion(id);
      router.push("/admin/promotion");
    } catch (err: any) {
      console.error("Error deleting promotion:", err);
      alert(err.payload?.data?.message || "Failed to delete promotion");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: PromotionStatus) => {
    const variants: Record<
      PromotionStatus,
      "default" | "secondary" | "destructive"
    > = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      EXPIRED: "destructive",
    };

    const labels: Record<PromotionStatus, string> = {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
      EXPIRED: "Expired",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDiscountValue = (type: PromotionDiscountType, value: number) => {
    if (type === "PERCENT") {
      return `${value}%`;
    }
    return `${value.toLocaleString()} VND`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Promotion not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/admin/promotion">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Promotions
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/admin/promotion">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {promotion.name}
              </h1>
              <p className="text-muted-foreground">
                Promotion Code:{" "}
                <span className="font-mono font-semibold">
                  {promotion.code}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(promotion.status)}
          <Button asChild>
            <Link href={`/admin/promotion/edit/${promotion._id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || (promotion.usedCount || 0) > 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Discount Value
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDiscountValue(
                promotion.discountType,
                promotion.discountValue
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {promotion.discountType === "PERCENT"
                ? "Percentage"
                : "Fixed Amount"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Count</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotion.usedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {promotion.usageLimit
                ? `of ${promotion.usageLimit} limit`
                : "No limit"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Min Order Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotion.minOrderValue
                ? `${promotion.minOrderValue.toLocaleString()} VND`
                : "No minimum"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Discount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotion.maxDiscount
                ? `${promotion.maxDiscount.toLocaleString()} VND`
                : "No maximum"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="mt-1 text-sm">
                {promotion.description || "No description provided"}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Apply Scope
              </label>
              <p className="mt-1 text-sm">
                <Badge variant="outline">
                  {promotion.applyScope === "ORDER"
                    ? "Order"
                    : promotion.applyScope === "SPECIFIC_BOOKS"
                    ? "Specific Books"
                    : "Category"}
                </Badge>
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Start Date
                </label>
                <p className="mt-1 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(promotion.startDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  End Date
                </label>
                <p className="mt-1 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(promotion.endDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created By
              </label>
              <p className="mt-1 text-sm">
                {typeof promotion.createdBy === "object" && promotion.createdBy
                  ? `${promotion.createdBy.firstName} ${promotion.createdBy.lastName}`
                  : "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(promotion.createdAt)}
              </p>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated By
              </label>
              <p className="mt-1 text-sm">
                {typeof promotion.updatedBy === "object" && promotion.updatedBy
                  ? `${promotion.updatedBy.firstName} ${promotion.updatedBy.lastName}`
                  : "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(promotion.updatedAt)}
              </p>
            </div>

            {promotion.isDeleted && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Deleted</AlertTitle>
                  <AlertDescription>
                    This promotion has been marked as deleted
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
