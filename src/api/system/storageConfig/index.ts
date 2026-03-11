import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { OssConfigForm, OssConfigQuery, OssConfigVO, StorageConfigForm, StorageConfigQuery, StorageConfigVO } from './types';

// 查询存储配置列表
export function listStorageConfig(query: StorageConfigQuery): AxiosPromise<StorageConfigVO[]> {
  return request({
    url: '/resource/storage/config/list',
    method: 'get',
    params: query
  });
}

// 查询存储配置详细
export function getStorageConfig(storageConfigId: string | number): AxiosPromise<StorageConfigVO> {
  return request({
    url: '/resource/storage/config/' + storageConfigId,
    method: 'get'
  });
}

// 新增存储配置
export function addStorageConfig(data: StorageConfigForm) {
  return request({
    url: '/resource/storage/config',
    method: 'post',
    data: data
  });
}

// 修改存储配置
export function updateStorageConfig(data: StorageConfigForm) {
  return request({
    url: '/resource/storage/config',
    method: 'put',
    data: data
  });
}

// 删除存储配置
export function deleteStorageConfig(storageConfigId: string | number | Array<string | number>) {
  return request({
    url: '/resource/storage/config/' + storageConfigId,
    method: 'delete'
  });
}

// 测试存储配置
export function testStorageConfig(storageConfigId: string | number): AxiosPromise<string> {
  return request({
    url: '/resource/storage/config/test',
    method: 'get',
    params: { storageConfigId }
  });
}

// 设置为主配置
export function updateStorageConfigMaster(storageConfigId: string | number) {
  return request({
    url: '/resource/storage/config/updateMaster',
    method: 'put',
    data: { storageConfigId }
  });
}

export const listOssConfig = (query: OssConfigQuery): AxiosPromise<OssConfigVO[]> => listStorageConfig(query);
export const getOssConfig = (storageConfigId: string | number): AxiosPromise<OssConfigVO> => getStorageConfig(storageConfigId);
export const addOssConfig = (data: OssConfigForm) => addStorageConfig(data);
export const updateOssConfig = (data: OssConfigForm) => updateStorageConfig(data);
export const delOssConfig = (storageConfigId: string | number | Array<string | number>) => deleteStorageConfig(storageConfigId);
export const testOssConfig = (storageConfigId: string | number): AxiosPromise<string> => testStorageConfig(storageConfigId);
export const updateOssConfigMaster = (storageConfigId: string | number) => updateStorageConfigMaster(storageConfigId);
