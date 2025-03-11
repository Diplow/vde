import type { UserEntity } from "~/lib/domains/actors/objects";

export interface UserRepository {
  getOne(userId: string): Promise<UserEntity>;
  getManyByIds(userIds: string[]): Promise<UserEntity[]>;
}
