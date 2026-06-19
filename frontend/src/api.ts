import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { AuthServiceClient } from "./gen/TaskManagement.client";
import { ProjectServiceClient } from "./gen/TaskManagement.client";
import { TaskServiceClient } from "./gen/TaskManagement.client";

const transport = new GrpcWebFetchTransport({
  baseUrl: "http://localhost:5000",
});

export const authApi = new AuthServiceClient(transport);
export const projectApi = new ProjectServiceClient(transport);
export const taskApi = new TaskServiceClient(transport);
