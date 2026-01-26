export interface CategoryVO extends BaseEntity {
  categoryId: number | string;
  name: string;
  slug: string;
  description: string;
  parentId: number | string;
  sortOrder: number;
  coverImage: number | string;
  postCount: number;
  children?: CategoryVO[];
}

export interface CategoryForm {
  categoryId?: number | string;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | string;
  sortOrder?: number;
  coverImage?: number | string;
  remark?: string;
}

export interface CategoryQuery extends PageQuery {
  name?: string;
  status?: string;
}
