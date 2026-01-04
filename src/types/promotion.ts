// Promotion types
export enum PromotionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EXPIRED = "EXPIRED",
}

export enum PromotionDiscountType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export enum PromotionApplyScope {
  ORDER = "ORDER",
  SPECIFIC_BOOKS = "SPECIFIC_BOOKS",
  CATEGORY = "CATEGORY",
}

export enum PromotionSortBy {
  CREATED_AT = "createdAt",
  START_DATE = "startDate",
  END_DATE = "endDate",
  DISCOUNT_VALUE = "discountValue",
  USAGE_LIMIT = "usageLimit",
  USED_COUNT = "usedCount",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export type Promotion = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  applyScope: PromotionApplyScope;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  status: PromotionStatus;
  bookIds?: string[];
  categoryIds?: string[];
  isDeleted?: boolean;
  createdBy?:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
  updatedBy?:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
  createdAt: string;
  updatedAt: string;
};

export type SearchPromotionDto = {
  q?: string;
  status?: PromotionStatus;
  discountType?: PromotionDiscountType;
  applyScope?: PromotionApplyScope;
  sortBy?: PromotionSortBy;
  order?: SortOrder;
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};
