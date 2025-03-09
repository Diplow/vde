import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { UserEntity } from "~/lib/domains/actors/entities";
import type { UserRepository } from "~/lib/domains/actors/repositories";

const getClerkUsername = (user: User): string | undefined => {
  return user.firstName ?? undefined;
};

export const ClerkUserRepository = (): UserRepository => {
  return {
    getOne: async (userId: string): Promise<UserEntity> => {
      const user = await clerkClient.users.getUser(userId);
      return new UserEntity({
        username: getClerkUsername(user),
        imageUrl: user.imageUrl,
        userId: user.id,
      });
    },
    getManyByIds: async (userIds: string[]): Promise<UserEntity[]> => {
      return (
        await clerkClient.users.getUserList({
          userId: userIds,
          limit: 110,
        })
      ).map((user) => {
        return new UserEntity({
          username: getClerkUsername(user),
          imageUrl: user.imageUrl,
          userId: user.id,
        });
      });
    },
  } as const;
};
