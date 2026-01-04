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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { PromotionApiRequest } from "@/api-request/promotion";
import type { PromotionDiscountType } from "@/types/promotion";

export default function CreatePromotionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    // Validation
    if (!formData.code || !formData.name || !formData.discountValue) {
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
        router.push("/admin/promotion");
      } else {
        setError("Failed to create promotion");
      }
    } catch (err: any) {
      console.error("Error creating promotion:", err);
      setError(
        err.payload?.data?.message ||
          "An error occurred while creating promotion"
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
                />
                <p className="text-xs text-muted-foreground">
                  Code will be automatically converted to uppercase
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
                  min="0"
                  step={formData.discountType === "PERCENT" ? "0.01" : "1"}
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
                  min="0"
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
                  min="0"
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
                min="0"
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
