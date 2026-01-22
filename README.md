# Workflow 功能与使用说明

本文档说明当前 Workflow 的功能范围、设计方式，并用现有界面的 HTTP Request 示例做演示。内容保持简洁、严谨、可落地。

## 1. 现在我们做了什么（功能范围）

当前流程能力集中在“手动触发 + HTTP 请求”的最小可用闭环：

- **工作流程列表**：可查看、搜索、分页、创建与删除流程。
- **流程编辑器**：可编辑流程名称、添加节点、连线并保存。
- **手动触发（Trigger）**：点击 “Execute workflow” 即可启动流程。一个流程仅允许一个手动触发器。
- **HTTP Request 节点（Execution）**：配置请求方法、URL、请求体，并把响应数据作为后续节点可引用的变量。

## 2. 设计方式（我们如何组织流程）

- **流程结构固定为：触发器 → 执行步骤**。先定义“什么时候开始”，再定义“开始后要做什么”。
- **节点之间通过变量传递数据**：HTTP Request 的结果会以变量形式产出，供后续节点引用。
- **可视化串联**：节点在画布上连接，表示执行顺序与数据流向。

## 3. 示例：用两个 HTTP Request 组成一个最小流程

下面使用界面截图中的配置方式，说明“我们现在能做什么”，并严格对应现有字段：

### 3.1 节点 1：获取一条 todo（GET）

- **Variable Name**：`todo`
- **Method**：`GET`
- **Endpoint URL**：`https://jsonplaceholder.typicode.com/todos/1`

此节点执行后，会产生变量：

- `{{todo.httpResponse.data}}`：接口返回的数据对象

### 3.2 节点 2：创建一条 todo（POST）

- **Variable Name**：`create_todo`
- **Method**：`POST`
- **Endpoint URL**：`https://jsonplaceholder.typicode.com/todos`
- **Request Body**：`{{json todo.httpResponse.data}}`

此节点会把上一步的返回数据作为 JSON 请求体发送出去，完成“读 → 写”的链路。

### 3.3 触发方式

- **触发器**：手动触发（点击 “Execute workflow”）

点击执行后，流程会按连接顺序依次执行：先 GET，再 POST。

## 4. 可用场景（基于现有能力）

- **测试第三方接口是否可用**：用 GET/POST 节点快速验证接口返回与参数结构。
- **把一个系统的数据转发到另一个系统**：第一个 HTTP Request 取数，第二个 HTTP Request 发送到目标系统。
- **手动跑一次数据同步**：临时手动触发，避免写脚本或重复手工操作。

---

后续会新增更多触发器或执行节点（如定时触发、Webhook、通知等），在此文档基础上扩展。
