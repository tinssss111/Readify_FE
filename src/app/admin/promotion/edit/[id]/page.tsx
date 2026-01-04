"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import { PromotionApiRequest } from "@/api-request/promotion";
import type {
  Promotion,
  PromotionDiscountType,
  PromotionApplyScope,
  PromotionStatus,
} from "@/types/promotion";

export default function EditPromotionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountType: "PERCENT" as PromotionDiscountType,
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    applyScope: "ORDER" as PromotionApplyScope,
    status: "INACTIVE" as PromotionStatus,
  });

  useEffect(() => {
    if (id) {
      fetchPromotion();
    }
  }, [id]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const response = await PromotionApiRequest.getPromotionById(id);

      if (response.payload.success) {
        const data = response.payload.data;
        setPromotion(data);

        // Format dates for datetime-local input
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        setFormData({
          name: data.name,
          description: data.description || "",
          discountType: data.discountType,
          discountValue: data.discountValue.toString(),
          minOrderValue: data.minOrderValue?.toString() || "",
          maxDiscount: data.maxDiscount?.toString() || "",
          startDate: formatDateTimeLocal(startDate),
          endDate: formatDateTimeLocal(endDate),
          usageLimit: data.usageLimit?.toString() || "",
          applyScope: data.applyScope,
          status: data.status,
        });
      }
    } catch (err) {
      console.error("Error fetching promotion:", err);
      setError("Failed to load promotion");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const isFieldLocked = () => {
    if (!promotion) return false;

    const now = new Date();
    const isRunningOrStarted =
      promotion.status === "ACTIVE" || now >= new Date(promotion.startDate);
    const isUsed = (promotion.usedCount || 0) > 0;

    return isRunningOrStarted || isUsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.discountValue) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Please select start and end dates");
      return;
    }

    const discountValue = parseFloat(formData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      setError("Discount value must be a positive number");
      return;
    }

    if (formData.discountType === "PERCENT" && discountValue > 100) {
      setError("Discount percentage cannot exceed 100%");
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        name: formData.name,
        endDate: new Date(formData.endDate).toISOString(),
      };

      // Only include status if it's ACTIVE or INACTIVE
      // EXPIRED status is managed by the system based on endDate
      // Backend DTO only accepts ACTIVE or INACTIVE
      if (formData.status === "ACTIVE" || formData.status === "INACTIVE") {
        payload.status = formData.status;
      }

      // Only add description if it has value
      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }

      // Only include these fields if not locked
      if (!isFieldLocked()) {
        payload.discountType = formData.discountType;
        payload.discountValue = discountValue;

        const minOrder = formData.minOrderValue?.trim();
        if (minOrder && !isNaN(parseFloat(minOrder))) {
          payload.minOrderValue = parseFloat(minOrder);
        }

        const maxDisc = formData.maxDiscount?.trim();
        if (maxDisc && !isNaN(parseFloat(maxDisc))) {
          payload.maxDiscount = parseFloat(maxDisc);
        }
      }

      const usageLimit = formData.usageLimit?.trim();
      if (usageLimit && !isNaN(parseInt(usageLimit))) {
        payload.usageLimit = parseInt(usageLimit);
      }

      console.log("Update payload:", payload);

      const response = await PromotionApiRequest.updatePromotion(id, payload);

      if (response.payload.success) {
        router.push(`/admin/promotion/${id}`);
      } else {
        setError("Failed to update promotion");
      }
    } catch (err: any) {
      console.error("Error updating promotion:", err);
      console.error("Full error details:", JSON.stringify(err, null, 2));
      console.error("Error payload:", err.payload);

      const errorMessage =
        err.payload?.data?.message ||
        err.payload?.data?.details?.[0]?.message ||
        err.message ||
        "An error occurred while updating promotion";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: string,
    value:
      | string
      | PromotionDiscountType
      | PromotionApplyScope
      | PromotionStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Promotion not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const locked = isFieldLocked();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/promotion/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Promotion</h1>
          <p className="text-muted-foreground">
            Code:{" "}
            <span className="font-mono font-semibold">{promotion.code}</span>
          </p>
        </div>
      </div>

      {locked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Some fields are locked because this promotion has started, is
            active, or has been used. You can still edit the name, description,
            end date, and status.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promotion Code (Read-only)</Label>
              <Input id="code" value={promotion.code} disabled />
              <p className="text-xs text-muted-foreground">
                Code cannot be changed after creation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Discount Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    handleChange("discountType", value as PromotionDiscountType)
                  }
                  disabled={locked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                {locked && (
                  <p className="text-xs text-muted-foreground">
                    Locked (promotion started/active/used)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    handleChange("discountValue", e.target.value)
                  }
                  disabled={locked}
                  min="0"
                  step={formData.discountType === "PERCENT" ? "0.01" : "1"}
                />
                {locked && (
                  <p className="text-xs text-muted-foreground">
                    Locked (promotion started/active/used)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderValue">Minimum Order Value</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    handleChange("minOrderValue", e.target.value)
                  }
                  disabled={locked}
                  min="0"
                />
                {locked && (
                  <p className="text-xs text-muted-foreground">
                    Locked (promotion started/active/used)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Maximum Discount</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => handleChange("maxDiscount", e.target.value)}
                  disabled={locked}
                  min="0"
                />
                {locked && (
                  <p className="text-xs text-muted-foreground">
                    Locked (promotion started/active/used)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity & Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Validity & Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Read-only)</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Start date cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => handleChange("usageLimit", e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Current usage: {promotion.usedCount || 0}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applyScope">Apply Scope (Read-only)</Label>
                <Select value={formData.applyScope} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDER">Order</SelectItem>
                    <SelectItem value="SPECIFIC_BOOKS">
                      Specific Books
                    </SelectItem>
                    <SelectItem value="CATEGORY">Category</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Apply scope cannot be changed after creation
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              {promotion.status === "EXPIRED" ? (
                <>
                  <Input value="Expired" disabled />
                  <p className="text-xs text-muted-foreground">
                    Status is automatically set to EXPIRED by the system when
                    end date has passed
                  </p>
                </>
              ) : (
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange("status", value as PromotionStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/promotion/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Promotion"}
          </Button>
        </div>
      </form>
    </div>
  );
}
