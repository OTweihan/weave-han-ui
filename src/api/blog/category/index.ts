import request from '@/utils/request';
import { CategoryForm, CategoryQuery, CategoryVO } from './types';
import { AxiosPromise } from 'axios';

// 查询分类列表
export function listCategory(query?: CategoryQuery): AxiosPromise<CategoryVO[]> {
  return request({
    url: '/blog/category/list',
    method: 'get',
    params: query
  });
}

// 查询全部分类（不分页）
export function listAllCategory(): AxiosPromise<CategoryVO[]> {
  return request({
    url: '/blog/category/all',
    method: 'get'
  });
}

// 查询分类详细
export function getCategory(categoryId: number | string): AxiosPromise<CategoryVO> {
  return request({
    url: '/blog/category/' + categoryId,
    method: 'get'
  });
}

// 新增分类
export function addCategory(data: CategoryForm) {
  return request({
    url: '/blog/category',
    method: 'post',
    data: data
  });
}

// 修改分类
export function updateCategory(data: CategoryForm) {
  return request({
    url: '/blog/category',
    method: 'put',
    data: data
  });
}

// 删除分类
export function delCategory(categoryId: number | string) {
  return request({
    url: '/blog/category/' + categoryId,
    method: 'delete'
  });
}
