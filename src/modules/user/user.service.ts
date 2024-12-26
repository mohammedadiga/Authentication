import UserModel from "../../database/models/auth/user.models";

export class UserService {
  public async findUserById(userId: string) {
    const user = await UserModel.findById(userId, { password: false });
    return user || null;
  }
}