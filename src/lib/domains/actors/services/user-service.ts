import { UserActions } from "~/lib/domains/actors/actions";
import type { UserRepository } from "~/lib/domains/actors/repositories";

export class UserService {
  private readonly actions: UserActions;

  constructor(repository: UserRepository) {
    this.actions = new UserActions(repository);
  }

  public async getOne(userId: string) {
    const user = await this.actions.getOne(userId);
    return user;
  }

  public async getManyByIds(userIds: string[]) {
    const users = await this.actions.getManyByIds(userIds);
    return users.map((user: any) => user.export());
  }
}
