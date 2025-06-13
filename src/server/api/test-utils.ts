import type { Session, User } from "better-auth/types";
import { MappingService } from "~/lib/domains/mapping/services/mapping.service";

export function createMockContext(options?: {
  user?: Partial<User>;
  session?: Partial<Session>;
}) {
  const user = options?.user
    ? {
        id: options.user.id ?? "test-user-id",
        email: options.user.email ?? "test@example.com",
        name: options.user.name ?? "Test User",
        image: options.user.image ?? null,
        emailVerified: options.user.emailVerified ?? false,
        createdAt: options.user.createdAt ?? new Date(),
        updatedAt: options.user.updatedAt ?? new Date(),
      }
    : null;

  const session = options?.session
    ? {
        ...options.session,
        userId: user?.id ?? "",
      }
    : null;

  return {
    user,
    session,
    mappingService: new MappingService(),
  };
}