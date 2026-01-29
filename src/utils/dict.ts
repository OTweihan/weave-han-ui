import { getDicts, listData } from '@/api/system/dict/data';
import { useDictStore } from '@/store/modules/dict';

/**
 * 获取字典数据
 */
const pendingPromises = new Map<string, Promise<DictDataOption[]>>();

export const useDict = (...args: string[]): { [key: string]: DictDataOption[] } => {
  const res = ref<{ [key: string]: DictDataOption[] }>({});
  args.forEach(async (dictType) => {
    res.value[dictType] = [];
    const dicts = useDictStore().getDict(dictType);
    if (dicts && dicts.length > 0) {
      res.value[dictType] = dicts;
    } else {
      if (!pendingPromises.has(dictType)) {
        const promise = (async () => {
          let result: DictDataOption[] = [];
          try {
            const resp = await getDicts(dictType);
            result = resp.data.map(
              (p): DictDataOption => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, elTagClass: p.cssClass })
            );
            if (!result || result.length === 0) {
              const listResp = await listData({ pageNum: 1, pageSize: 50, dictName: '', dictType: dictType, dictLabel: '' } as any);
              const rows = (listResp as any).rows || [];
              result = rows.map(
                (p: any): DictDataOption => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, elTagClass: p.cssClass })
              );
            }
            useDictStore().setDict(dictType, result);
          } catch (e) {
            console.error('[useDict] 加载字典失败', dictType, e);
          } finally {
            pendingPromises.delete(dictType);
          }
          return result;
        })();
        pendingPromises.set(dictType, promise);
      }
      const result = await pendingPromises.get(dictType);
      if (result) {
        res.value[dictType] = result;
      }
    }
  });
  return reactive(res.value);
};
