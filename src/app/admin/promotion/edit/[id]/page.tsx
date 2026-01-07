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
import { toast } from "sonner";

// Toast styling helpers
const toastErrorStyle = {
  style: {
    "--normal-bg": "light-dark(var(--color-red-600), var(--color-red-400))",
    "--normal-text": "var(--color-white)",
    "--normal-border": "light-dark(var(--color-red-600), var(--color-red-400))",
  } as React.CSSProperties,
  duration: 5000,
};

const toastSuccessStyle = {
  style: {
    "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
    "--normal-text": "var(--color-white)",
    "--normal-border":
      "light-dark(var(--color-green-600), var(--color-green-400))",
  } as React.CSSProperties,
  duration: 5000,
};

export default function EditPromotionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error("Failed to load promotion", toastErrorStyle);
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

    if (!formData.name || !formData.discountValue) {
      toast.error("Please fill in all required fields", toastErrorStyle);
      return;
    }

    if (formData.name.trim().length < 3) {
      toast.error(
        "Promotion name must be at least 3 characters long",
        toastErrorStyle
      );
      return;
    }

    if (formData.name.trim().length > 100) {
      toast.error(
        "Promotion name cannot exceed 100 characters",
        toastErrorStyle
      );
      return;
    }

    // Validate description length
    if (formData.description && formData.description.trim().length > 500) {
      toast.error("Description cannot exceed 500 characters", toastErrorStyle);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates", toastErrorStyle);
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      toast.error("End date must be after start date", toastErrorStyle);
      return;
    }

    // Validate at least 1 hour duration
    const duration = endDate.getTime() - startDate.getTime();
    const oneHour = 60 * 60 * 1000;
    if (duration < oneHour) {
      toast.error(
        "Promotion duration must be at least 1 hour",
        toastErrorStyle
      );
      return;
    }

    // Validate discount value
    const discountValue = parseFloat(formData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.error("Discount value must be a positive number", toastErrorStyle);
      return;
    }

    if (formData.discountType === "PERCENT") {
      if (discountValue > 100) {
        toast.error("Discount percentage cannot exceed 100%", toastErrorStyle);
        return;
      }
      if (discountValue < 0.01) {
        toast.error(
          "Discount percentage must be at least 0.01%",
          toastErrorStyle
        );
        return;
      }
    } else {
      // FIXED amount validation
      if (discountValue < 1000) {
        toast.error(
          "Fixed discount must be at least 1,000 VND",
          toastErrorStyle
        );
        return;
      }
    }

    // Validate minOrderValue
    if (formData.minOrderValue) {
      const minOrderValue = parseFloat(formData.minOrderValue);
      if (isNaN(minOrderValue) || minOrderValue < 0) {
        toast.error("Minimum order value must be a positive number");
        return;
      }
      if (minOrderValue < 1000) {
        toast.error("Minimum order value must be at least 1,000 VND");
        return;
      }

      // For FIXED type, ensure minOrderValue is greater than discount
      if (formData.discountType === "FIXED" && minOrderValue <= discountValue) {
        toast.error(
          "Minimum order value must be greater than the fixed discount amount"
        );
        return;
      }
    }

    // Validate maxDiscount
    if (formData.maxDiscount) {
      const maxDiscount = parseFloat(formData.maxDiscount);
      if (isNaN(maxDiscount) || maxDiscount < 0) {
        toast.error(
          "Maximum discount must be a positive number",
          toastErrorStyle
        );
        return;
      }
      if (maxDiscount < 1000) {
        toast.error(
          "Maximum discount must be at least 1,000 VND",
          toastErrorStyle
        );
        return;
      }

      // For FIXED type, maxDiscount should not be greater than discountValue
      if (formData.discountType === "FIXED" && maxDiscount > discountValue) {
        toast.error(
          "Maximum discount cannot be greater than the discount value",
          toastErrorStyle
        );
        return;
      }
    }

    // Validate usageLimit
    if (formData.usageLimit) {
      const usageLimit = parseInt(formData.usageLimit);
      if (isNaN(usageLimit) || usageLimit < 1) {
        toast.error("Usage limit must be at least 1", toastErrorStyle);
        return;
      }
      if (usageLimit > 1000000) {
        toast.error("Usage limit cannot exceed 1,000,000", toastErrorStyle);
        return;
      }

      // Validate that usage limit is not less than current usage
      if (promotion && usageLimit < promotion.usedCount) {
        toast.error(
          `Usage limit cannot be less than current usage (${promotion.usedCount})`,
          toastErrorStyle
        );
        return;
      }
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
        toast.success("Promotion updated successfully!", toastSuccessStyle);
        router.push(`/admin/promotion/${id}`);
      } else {
        toast.error("Failed to update promotion", toastErrorStyle);
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
      toast.error(errorMessage, toastErrorStyle);
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
                minLength={3}
                maxLength={100}
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
                  min={formData.discountType === "PERCENT" ? "0.01" : "1000"}
                  max={formData.discountType === "PERCENT" ? "100" : "10000000"}
                  step={formData.discountType === "PERCENT" ? "0.01" : "1000"}
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
                  min="1000"
                  step="1000"
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
                  min="1000"
                  step="1000"
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
                  min={(promotion?.usedCount || 0).toString()}
                  max="1000000"
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
