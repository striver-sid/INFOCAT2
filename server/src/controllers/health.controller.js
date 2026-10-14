import { healthService } from '../services/health.service.js';

export class HealthController {
  /**
   * Handles GET /api/v1/health
   */
  async getHealth(req, res, next) {
    try {
      const healthData = await healthService.getSystemHealth();
      const statusCode = healthData.success ? 200 : 503;
      return res.status(statusCode).json(healthData);
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
export default healthController;
