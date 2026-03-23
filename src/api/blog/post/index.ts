import request from '@/utils/request';
import type { PostForm, PostQuery, PostVO } from './types';
import type { AxiosPromise } from 'axios';

// 查询文章列表
export function listPost(query?: PostQuery): AxiosPromise<PostVO[]> {
  return request({
    url: '/blog/post/list',
    method: 'get',
    params: query
  });
}

// 查询公开文章列表
export function listPublicPost(query?: PostQuery): AxiosPromise<PostVO[]> {
  return request({
    url: '/blog/post/public/list',
    method: 'get',
    params: query
  });
}

// 查询文章详细
export function getPost(postId: number | string): AxiosPromise<PostVO> {
  return request({
    url: '/blog/post/' + postId,
    method: 'get'
  });
}

// 根据别名查询文章
export function getPostBySlug(slug: string): AxiosPromise<PostVO> {
  return request({
    url: '/blog/post/slug/' + slug,
    method: 'get'
  });
}

// 新增文章
export function addPost(data: PostForm) {
  return request({
    url: '/blog/post',
    method: 'post',
    data: data
  });
}

// 修改文章
export function updatePost(data: PostForm) {
  return request({
    url: '/blog/post',
    method: 'put',
    data: data
  });
}

// 删除文章
export function delPost(postId: Array<string | number> | string | number) {
  return request({
    url: '/blog/post/' + postId,
    method: 'delete'
  });
}

// 增加文章浏览量
export function incrementPostView(postId: number | string) {
  return request({
    url: '/blog/post/view/' + postId,
    method: 'post'
  });
}
