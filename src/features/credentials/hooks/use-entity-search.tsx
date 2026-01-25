import { useEffect, useState, useTransition } from "react"; // 引入 useTransition
import { PAGINATION } from "@/config/constants";

interface UseEntitySeachProps<
  T extends {
    search: string;
    page: number;
  },
> {
  params: T;
  setParams: (params: T) => void;
  debounceMs?: number;
}

export function useEntitySearch<
  T extends {
    search: string;
    page: number;
  },
>({ params, setParams, debounceMs = 500 }: UseEntitySeachProps<T>) {
  const [localSearch, setLoaclSearch] = useState(params.search);

  // 初始化 transition
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // 逻辑 A: 快速清空 (当用户删光文字时，不需要防抖，直接搜)
    if (localSearch === "" && params.search !== "") {
      startTransition(() => {
        // 包裹 setParams
        setParams({
          ...params,
          search: "",
          page: PAGINATION.DEFAULT_PAGE,
        });
      });
      return;
    }

    // 逻辑 B: 防抖搜索
    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        startTransition(() => {
          // 包裹 setParams
          setParams({
            ...params,
            search: localSearch,
            page: PAGINATION.DEFAULT_PAGE,
          });
        });
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localSearch, params, setParams, debounceMs]);

  // 逻辑 C: 同步 URL 参数回本地 (处理浏览器的后退/前进按钮)
  useEffect(() => {
    // 只有当本地值和 URL 值真的不一样时才同步
    // 并且加一个简单的判断：如果用户正在输入（isPending），暂时不要强制覆盖
    if (params.search !== localSearch) {
      setLoaclSearch(params.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.search]);

  return {
    searchValue: localSearch,
    onSearchChange: setLoaclSearch,
    isSearching: isPending, // 可以把这个状态传出去，让搜索框显示一个转圈圈
  };
}
