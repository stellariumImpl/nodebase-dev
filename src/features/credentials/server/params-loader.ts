import { createLoader } from "nuqs/server";

import { credentialsParams } from "../params";

// 创建一个 loader，用于从 URL 中获取查询参数
export const credentialsParamsLoader = createLoader(credentialsParams);
