export interface StorageConfigVO extends BaseEntity {
  storageConfigId: number | string;
  configName: string;
  storageType: number | string;
  configData: Record<string, any>;
  master: boolean;
  remark: string;
  createTime?: string;
}

export interface StorageConfigQuery extends PageQuery {
  configName: string;
  storageType: string;
  master: string;
}

export interface StorageConfigForm {
  storageConfigId: string | number | undefined;
  configName: string;
  storageType: number | undefined;
  configData: Record<string, any>;
  master: boolean;
  remark: string;
}

export type OssConfigVO = StorageConfigVO;
export type OssConfigQuery = StorageConfigQuery;
export type OssConfigForm = StorageConfigForm;
