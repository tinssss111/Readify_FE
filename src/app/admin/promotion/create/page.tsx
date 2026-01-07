"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import { PromotionApiRequest } from "@/api-request/promotion";
import type { PromotionDiscountType } from "@/types/promotion";
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

export default function CreatePromotionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "PERCENT" as PromotionDiscountType,
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code || !formData.name || !formData.discountValue) {
      toast.error("Please fill in all required fields", toastErrorStyle);
      return;
    }

    // Validate code format (alphanumeric and underscore only)
    const codeRegex = /^[A-Z0-9_]+$/;
    if (!codeRegex.test(formData.code)) {
      toast.error(
        "Promotion code can only contain uppercase letters, numbers, and underscores",
        toastErrorStyle
      );
      return;
    }

    if (formData.code.length < 3) {
      toast.error(
        "Promotion code must be at least 3 characters long",
        toastErrorStyle
      );
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
    const now = new Date();

    if (startDate < now) {
      toast.error("Start date must be in the future", toastErrorStyle);
      return;
    }

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

      // For PERCENT type, ensure maxDiscount makes sense
      if (formData.discountType === "PERCENT" && formData.minOrderValue) {
        const minOrderValue = parseFloat(formData.minOrderValue);
        const calculatedMaxDiscount = (minOrderValue * discountValue) / 100;
        if (maxDiscount > calculatedMaxDiscount * 10) {
          toast.error(
            `Maximum discount seems too high. For ${discountValue}% on min order ${minOrderValue.toLocaleString()} VND, max discount should be reasonable`,
            toastErrorStyle
          );
          return;
        }
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
    }

    try {
      setSubmitting(true);

      const payload: any = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: discountValue,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (formData.minOrderValue) {
        payload.minOrderValue = parseFloat(formData.minOrderValue);
      }

      if (formData.maxDiscount) {
        payload.maxDiscount = parseFloat(formData.maxDiscount);
      }

      if (formData.usageLimit) {
        payload.usageLimit = parseInt(formData.usageLimit);
      }

      const response = await PromotionApiRequest.createPromotion(payload);

      if (response.payload.success) {
        toast.success("Promotion created successfully!", toastSuccessStyle);
        router.push("/admin/promotion");
      } else {
        toast.error("Failed to create promotion", toastErrorStyle);
      }
    } catch (err: any) {
      console.error("Error creating promotion:", err);
      toast.error(
        err.payload?.data?.message ||
          "An error occurred while creating promotion",
        toastErrorStyle
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: string,
    value: string | PromotionDiscountType
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/promotion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Promotion
          </h1>
          <p className="text-muted-foreground">
            Create a new promotional campaign
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Promotion Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="SALE10"
                  value={formData.code}
                  onChange={(e) =>
                    handleChange("code", e.target.value.toUpperCase())
                  }
                  required
                  maxLength={50}
                  pattern="[A-Z0-9_]+"
                />
                <p className="text-xs text-muted-foreground">
                  Uppercase letters, numbers, and underscores only (min 3 chars)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Sale 10%"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  minLength={3}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your promotion..."
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
                <Label htmlFor="discountType">
                  Discount Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    handleChange("discountType", value as PromotionDiscountType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Discount Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={
                    formData.discountType === "PERCENT" ? "10" : "50000"
                  }
                  value={formData.discountValue}
                  onChange={(e) =>
                    handleChange("discountValue", e.target.value)
                  }
                  required
                  min={formData.discountType === "PERCENT" ? "0.01" : "1000"}
                  max={formData.discountType === "PERCENT" ? "100" : "10000000"}
                  step={formData.discountType === "PERCENT" ? "0.01" : "1000"}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.discountType === "PERCENT"
                    ? "Enter percentage (e.g., 10 for 10%)"
                    : "Enter amount in VND"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderValue">Minimum Order Value</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  placeholder="200000"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    handleChange("minOrderValue", e.target.value)
                  }
                  min="1000"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum order value in VND (optional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Maximum Discount</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  placeholder="50000"
                  value={formData.maxDiscount}
                  onChange={(e) => handleChange("maxDiscount", e.target.value)}
                  min="1000"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum discount in VND (optional)
                </p>
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
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  required
                />
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

            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                placeholder="1000"
                value={formData.usageLimit}
                onChange={(e) => handleChange("usageLimit", e.target.value)}
                min="1"
                max="1000000"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of uses (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/promotion">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Promotion"}
          </Button>
        </div>
      </form>
    </div>
  );
}
