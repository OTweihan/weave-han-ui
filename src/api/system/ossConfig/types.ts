export interface OssConfigVO extends BaseEntity {
  ossConfigId: number | string;
  configName: string;
  storageType: number;
  configData: Record<string, any>;
  master: boolean;
  remark: string;
}

export interface OssConfigQuery extends PageQuery {
  configName: string;
  bucketName: string;
  storageType: string;
  master: string;
}

export interface OssConfigForm {
  ossConfigId: string | number | undefined;
  configName: string;
  storageType: number;
  configData: Record<string, any>;
  master: boolean;
  remark: string;
}
