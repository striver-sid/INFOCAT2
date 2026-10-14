import { userService } from '../services/user.service.js';

export class UserController {
  /**
   * GET /api/v1/users
   */
  async getUsers(req, res, next) {
    try {
      const users = userService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
export default userController;
