export interface TagVO extends BaseEntity {
  tagId: number | string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
}

export interface TagForm {
  tagId?: number | string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount?: number;
  remark?: string;
}

export interface TagQuery extends PageQuery {
  name?: string;
  slug?: string;
}
