import { apiRepository } from "../features/workspace/apiRepository";
import type { WorkspaceRepository } from "../features/workspace/repository";

export { authService } from "./auth";

export const workspaceRepository: WorkspaceRepository = apiRepository;
