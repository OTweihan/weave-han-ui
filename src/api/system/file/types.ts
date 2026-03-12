export interface FileVO extends BaseEntity {
  id: string | number;
  configId?: string | number;
  fileName: string;
  originalName: string;
  fileSuffix: string;
  url: string;
  mimeType?: string;
  fileSize?: number;
  ossId?: string | number;
}

export interface FileQuery extends PageQuery {
  fileName: string;
  originalName: string;
  mimeType: string;
  orderByColumn: string;
  isAsc: string;
}

export interface FileForm {
  file: undefined | string;
}

export type OssVO = FileVO;
export type OssQuery = FileQuery;
export type OssForm = FileForm;
