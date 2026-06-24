import { request } from '@umijs/max';
import { downLoadXlsx } from '@/utils/downloadfile';

// 查询企业信息列表
export async function getEnterpriseList(params?: API.Kuaishu.EnterpriseListParams, options?: { [key: string]: any }) {
  return request<API.Kuaishu.EnterprisePageResult>('/api/enterprise/enterprise/list', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    params,
    ...(options || {})
  });
}

// 查询企业信息详细
export function getEnterprise(id: number, options?: { [key: string]: any }) {
  return request<API.Kuaishu.EnterpriseInfoResult>(`/api/enterprise/enterprise/${id}`, {
    method: 'GET',
    ...(options || {})
  });
}

// 新增企业信息
export async function addEnterprise(params: API.Kuaishu.Enterprise, options?: { [key: string]: any }) {
  return request<API.Result>('/api/enterprise/enterprise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: params,
    ...(options || {})
  });
}

// 修改企业信息
export async function updateEnterprise(params: API.Kuaishu.Enterprise, options?: { [key: string]: any }) {
  return request<API.Result>('/api/enterprise/enterprise', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: params,
    ...(options || {})
  });
}

// 删除企业信息
export async function removeEnterprise(ids: string, options?: { [key: string]: any }) {
  return request<API.Result>(`/api/enterprise/enterprise/${ids}`, {
    method: 'DELETE',
    ...(options || {})
  });
}

// 导出企业信息
export function exportEnterprise(params?: API.Kuaishu.EnterpriseListParams, options?: { [key: string]: any }) {
  return downLoadXlsx(`/api/enterprise/enterprise/export`, { params }, `enterprise_${new Date().getTime()}.xlsx`);
}

// 获取国民经济行业分类
export function getIndustryDictList(options?: { [key: string]: any }) {
  return request<API.Result>('/api/enterprise/enterprise/industry/dict/dl', {
    method: 'GET',
    ...(options || {})
  });
}

// 获取国民经济行业子分类
export function getIndustryChildDicts(parentCode: string, options?: { [key: string]: any }) {
  return request<API.Result>(`/api/enterprise/enterprise/industry/dict/children/${parentCode}`, {
    method: 'GET',
    ...(options || {})
  });
}

// 获取省信息
export function getProvinceList(options?: { [key: string]: any }) {
  return request<API.Result>('/api/enterprise/enterprise/getProvinceList', {
    method: 'GET',
    ...(options || {})
  });
}

// 修改企业状态
export function updateEnterpriseStatus(params: API.Kuaishu.Enterprise, options?: { [key: string]: any }) {
  return request<API.Result>('/api/enterprise/enterprise/updateStatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: params,
    ...(options || {})
  });
}