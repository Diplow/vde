import { UserActions } from "~/lib/domains/actors/actions";
import type { UserRepository } from "~/lib/domains/actors/repositories";

export const ServiceUser = (repository: UserRepository) => {
  const actions = UserActions(repository);

  const getOne = async (userId: string) => {
    const user = await actions.getOne(userId);
    return user.export();
  };

  const getMany = async (userIds: string[]) => {
    const users = await actions.getManyByIds(userIds);
    return users.map((user) => user.export());
  };

  return {
    getOne,
    getMany,
  } as const;
};
