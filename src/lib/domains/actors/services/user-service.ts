import { UserActions } from "~/lib/domains/actors/actions";
import type { UserRepository } from "~/lib/domains/actors/repositories";

export const UserService = (repository: UserRepository) => {
  const actions = UserActions(repository);

  const getOne = async (userId: string) => {
    const user = await actions.getOne(userId);
    return user;
  };

  const getMany = async (userIds: string[]) => {
    const users = await actions.getManyByIds(userIds);
    return users.map((user: any) => user.export());
  };

  return {
    getOne,
    getMany,
  } as const;
};
