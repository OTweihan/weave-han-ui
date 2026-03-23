import type { CategoryVO } from '@/api/blog/category/types';
import type { TagVO } from '@/api/blog/tag/types';

export interface PostVO extends BaseEntity {
  postId: number | string;
  title: string;
  slug?: string;
  summary?: string;
  coverImage?: number | string | null;
  authorId?: number | string;
  authorName?: string;
  categoryId?: number | string | null;
  category?: CategoryVO;
  tags?: TagVO[];
  status: string;
  isTop: string;
  isFeatured: string;
  allowComment: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  password?: string;
  sourceType: string;
  sourceUrl?: string;
  seoKeywords?: string;
  seoDescription?: string;
  publishedTime?: string;
  lastCommentTime?: string;
  delFlag?: number;
  content?: string;
  contentHtml?: string;
  wordCount?: number;
  readingTime?: number;
}

export interface PostForm {
  postId?: number | string;
  title: string;
  slug?: string;
  summary?: string;
  coverImage?: number | string;
  categoryId?: number | string;
  tagIds?: Array<number | string>;
  status: string;
  isTop: string;
  isFeatured: string;
  allowComment: string;
  password?: string;
  sourceType: string;
  sourceUrl?: string;
  seoKeywords?: string;
  seoDescription?: string;
  publishedTime?: string;
  content: string;
  contentHtml?: string;
  wordCount?: number;
  readingTime?: number;
}

export interface PostQuery extends PageQuery {
  title?: string;
  slug?: string;
  categoryId?: number | string;
  status?: string;
  sourceType?: string;
  isTop?: string;
  isFeatured?: string;
}
