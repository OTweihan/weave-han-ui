export interface CategoryVO extends BaseEntity {
  categoryId: number | string;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | string | null;
  coverImage?: number | string | null;
  postCount: number;
  children?: CategoryVO[];
}

export interface CategoryForm {
  categoryId?: number | string;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | string;
  coverImage?: number | string;
  remark?: string;
}

export interface CategoryQuery {
  name?: string;
  slug?: string;
}
