"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertCircle,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  Tag,
  Calendar,
  TrendingUp,
  Percent,
} from "lucide-react";
import { PromotionApiRequest } from "@/api-request/promotion";
import type {
  Promotion,
  SearchPromotionDto,
  PromotionStatus,
  PromotionDiscountType,
  PromotionApplyScope,
  PromotionSortBy,
  SortOrder,
} from "@/types/promotion";

export default function PromotionListView() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | "all">(
    "all"
  );
  const [discountTypeFilter, setDiscountTypeFilter] = useState<
    PromotionDiscountType | "all"
  >("all");
  const [applyScopeFilter, setApplyScopeFilter] = useState<
    PromotionApplyScope | "all"
  >("all");
  const [sortBy, setSortBy] = useState<PromotionSortBy>(
    "createdAt" as PromotionSortBy
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc" as SortOrder);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPromotions();
  }, [
    searchQuery,
    statusFilter,
    discountTypeFilter,
    applyScopeFilter,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const query: SearchPromotionDto = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        order: sortOrder,
      };

      if (searchQuery.trim()) {
        query.q = searchQuery.trim();
      }

      if (statusFilter !== "all") {
        query.status = statusFilter as PromotionStatus;
      }

      if (discountTypeFilter !== "all") {
        query.discountType = discountTypeFilter as PromotionDiscountType;
      }

      if (applyScopeFilter !== "all") {
        query.applyScope = applyScopeFilter as PromotionApplyScope;
      }

      const response = await PromotionApiRequest.getPromotionList(query);

      if (response.payload.success) {
        setPromotions(response.payload.data.items);
        setTotal(response.payload.data.meta.total);
        setTotalPages(response.payload.data.meta.totalPages);
      } else {
        setError("Failed to fetch promotions");
      }
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setError("An error occurred while fetching promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) {
      return;
    }

    try {
      await PromotionApiRequest.deletePromotion(id);
      fetchPromotions();
    } catch (err) {
      console.error("Error deleting promotion:", err);
      alert("Failed to delete promotion");
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

  const getDiscountTypeBadge = (type: PromotionDiscountType) => {
    const labels: Record<PromotionDiscountType, string> = {
      PERCENT: "Percentage",
      FIXED: "Fixed Amount",
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getApplyScopeBadge = (scope: PromotionApplyScope) => {
    const labels: Record<PromotionApplyScope, string> = {
      ORDER: "Order",
      SPECIFIC_BOOKS: "Specific Books",
      CATEGORY: "Category",
    };

    return <Badge variant="outline">{labels[scope]}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDiscountValue = (type: PromotionDiscountType, value: number) => {
    if (type === "PERCENT") {
      return `${value}%`;
    }
    return `${value.toLocaleString()} VND`;
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            Manage your promotional campaigns and discount codes
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/promotion/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Promotions
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions.filter((p) => p.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions.filter((p) => p.status === "INACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions.filter((p) => p.status === "EXPIRED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
            <div className="relative md:col-span-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as any);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={discountTypeFilter}
                onValueChange={(value) => {
                  setDiscountTypeFilter(value as any);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Discount Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PERCENT">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as PromotionSortBy);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="startDate">Start Date</SelectItem>
                  <SelectItem value="endDate">End Date</SelectItem>
                  <SelectItem value="discountValue">Discount Value</SelectItem>
                  <SelectItem value="usageLimit">Usage Limit</SelectItem>
                  <SelectItem value="usedCount">Used Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No promotions found
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first promotion
              </p>
              <Button asChild>
                <Link href="/admin/promotion/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promotion
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion._id}>
                      <TableCell className="font-medium">
                        {promotion.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.name}</div>
                          {promotion.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {promotion.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatDiscountValue(
                            promotion.discountType,
                            promotion.discountValue
                          )}
                        </div>
                        {promotion.maxDiscount && (
                          <div className="text-xs text-muted-foreground">
                            Max: {promotion.maxDiscount.toLocaleString()} VND
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{promotion.usedCount}</div>
                          {promotion.usageLimit && (
                            <div className="text-muted-foreground">
                              / {promotion.usageLimit}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(promotion.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/promotion/${promotion._id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/promotion/edit/${promotion._id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(promotion._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <span className="px-3">...</span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
