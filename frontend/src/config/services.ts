import { mockRepository } from "../features/workspace/mockRepository";
import type { WorkspaceRepository } from "../features/workspace/repository";

export { USE_MOCK_API, authService } from "./auth";

// See auth.ts: swap for an API implementation once the backend exists
export const workspaceRepository: WorkspaceRepository = mockRepository;
