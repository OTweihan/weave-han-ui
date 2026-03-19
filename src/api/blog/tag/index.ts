import request from '@/utils/request';
import { TagForm, TagQuery, TagVO } from './types';
import { AxiosPromise } from 'axios';

// 查询标签列表
export function listTag(query?: TagQuery): AxiosPromise<TagVO[]> {
  return request({
    url: '/blog/tag/list',
    method: 'get',
    params: query
  });
}

// 查询全部标签（不分页）
export function listAllTag(): AxiosPromise<TagVO[]> {
  return request({
    url: '/blog/tag/all',
    method: 'get'
  });
}

// 查询标签详细
export function getTag(tagId: number | string): AxiosPromise<TagVO> {
  return request({
    url: '/blog/tag/' + tagId,
    method: 'get'
  });
}

// 根据别名查询标签
export function getTagBySlug(slug: string): AxiosPromise<TagVO> {
  return request({
    url: '/blog/tag/slug/' + slug,
    method: 'get'
  });
}

// 新增标签
export function addTag(data: TagForm) {
  return request({
    url: '/blog/tag',
    method: 'post',
    data: data
  });
}

// 修改标签
export function updateTag(data: TagForm) {
  return request({
    url: '/blog/tag',
    method: 'put',
    data: data
  });
}

// 删除标签
export function delTag(tagId: Array<string | number> | string | number) {
  return request({
    url: '/blog/tag/' + tagId,
    method: 'delete'
  });
}
