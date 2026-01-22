import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import Handlebars from "handlebars";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

type HttpRequestData = {
  variableName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpRequestDataExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  // TODO: Publish "loading" state for Http Request

  if (!data.endpoint) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: No endpoint configured");
  }

  if (!data.variableName) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError(
      "HTTP Request node: Variable name not configured",
    );
  }

  if (!data.method) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: Method not configured");
  }

  const result = await step.run("http-request", async () => {
    const endpoint = Handlebars.compile(data.endpoint)(context);
    // console.log("Endpoint", { endpoint });
    //  POST /api/inngest?fnId=nodebase-dev-execute-workflow&stepId=step 206 in 764ms
    //  POST /api/inngest?fnId=nodebase-dev-execute-workflow&stepId=step 206 in 8ms
    // Endpoint { endpoint: 'https://jsonplaceholder.typicode.com/todos/1' }
    //  PUT /api/inngest 200 in 22ms
    //  POST /api/inngest?fnId=nodebase-dev-execute-workflow&stepId=step 206 in 1124ms
    // Endpoint { endpoint: 'https://jsonplaceholder.typicode.com/users/1' }

    const method = data.method;

    const options: KyOptions = { method };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      const resolved = Handlebars.compile(data.body || "{}")(context);
      console.log("BODY: ", resolved);
      JSON.parse(resolved);
      options.body = resolved;
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    const response = await ky(endpoint, options);

    const contentType = response.headers.get("content-type");

    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    const responsePayload = {
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    };

    return {
      ...context,
      [data.variableName]: responsePayload,
    };
  });

  // TODO: Publish "success" state for  Http Request

  return result;
};
