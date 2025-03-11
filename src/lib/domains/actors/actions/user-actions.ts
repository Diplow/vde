import { UserRepository } from "../repositories";

export const UserActions = (repository: UserRepository) => {
  const getOne = async (userId: string) => {
    const user = await repository.getOne(userId);
    return user.export();
  };

  const getManyByIds = async (userIds: string[]) => {
    const users = await repository.getManyByIds(userIds);
    return users.map((user) => user.export());
  };

  return {
    getOne,
    getManyByIds,
  };
};
