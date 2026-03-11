import request from '@/utils/request';
import { FileQuery, FileVO, OssQuery, OssVO } from './types';
import { AxiosPromise } from 'axios';

// 查询文件列表
export function listFile(query: FileQuery): AxiosPromise<FileVO[]> {
  return request({
    url: '/resource/file/page',
    method: 'get',
    params: query
  });
}

// 查询文件信息（基于id串）
export function listFilesByIds(fileIds: string | number): AxiosPromise<FileVO[]> {
  return request({
    url: '/resource/file/listByIds/' + fileIds,
    method: 'get'
  });
}

// 删除文件
export function deleteFile(fileIds: string | number | Array<string | number>) {
  return request({
    url: '/resource/file/delete',
    method: 'delete',
    params: { ids: fileIds }
  });
}

export const listOss = (query: OssQuery): AxiosPromise<OssVO[]> => listFile(query);
export const listByIds = (fileIds: string | number): AxiosPromise<OssVO[]> => listFilesByIds(fileIds);
export const delOss = (fileIds: string | number | Array<string | number>) => deleteFile(fileIds);
