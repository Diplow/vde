import { TRPCError } from "@trpc/server";
import { UserMappingService } from "../services/user-mapping.service";

export function _ensureUserAuthenticated(
  user: any,
): asserts user is NonNullable<typeof user> {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated",
    });
  }
}

export async function _getUserId(user: any): Promise<number> {
  _ensureUserAuthenticated(user);

  // user.id is a string from better-auth, convert it to integer for mapping system
  if (typeof user.id !== "string") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid user ID format",
    });
  }

  return await UserMappingService.getOrCreateMappingUserId(user.id);
}

export function _getUserName(user: any): string {
  _ensureUserAuthenticated(user);
  return user.name || user.email || "User";
}

export function _createSuccessResponse<T = Record<string, unknown>>(
  data?: T,
): { success: true } & T {
  return { success: true, ...data } as { success: true } & T;
}

export function _createErrorResponse<T = Record<string, unknown>>(
  error: string,
  data?: T,
): { success: false; error: string } & T {
  return { success: false, error, ...data } as {
    success: false;
    error: string;
  } & T;
}
