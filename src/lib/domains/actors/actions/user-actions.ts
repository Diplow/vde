import { UserRepository } from "../repositories";

export class UserActions {
  private readonly repository: UserRepository;

  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  public async getOne(userId: string) {
    const user = await this.repository.getOne(userId);
    return user.export();
  }

  public async getManyByIds(userIds: string[]) {
    const users = await this.repository.getManyByIds(userIds);
    return users.map((user) => user.export());
  }
}
