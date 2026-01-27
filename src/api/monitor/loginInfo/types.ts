export interface LoginInfoVO {
  infoId: string | number;
  userAccount: string;
  status: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  msg: string;
  loginTime: string;
}

export interface LoginInfoQuery extends PageQuery {
  ipaddr: string;
  userAccount: string;
  status: string;
  orderByColumn: string;
  isAsc: string;
}
