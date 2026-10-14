import { userRepository } from '../repositories/user.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class UserService {
  /**
   * Retrieves all demonstration identities.
   * @returns {Array<object>}
   */
  getAllUsers() {
    return userRepository.findAll();
  }

  /**
   * Retrieves a demonstration user by ID.
   * @param {number} id 
   * @returns {object}
   */
  getUserById(id) {
    const user = userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID '${id}' was not found.`);
    }
    return user;
  }
}

export const userService = new UserService();
export default userService;
