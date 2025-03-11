export interface UserAttributes {
  username?: string;
  imageUrl?: string;
  userId: string;
}

import { UserContract } from "./user-contract";

export class UserEntity {
  public data: UserAttributes;

  constructor(data: UserAttributes) {
    this.data = {
      username: data.username,
      imageUrl: data.imageUrl,
      userId: data.userId,
    };
  }

  export(): UserContract {
    return {
      username: this.data.username,
      imageUrl: this.data.imageUrl,
      userId: this.data.userId,
    };
  }
}
