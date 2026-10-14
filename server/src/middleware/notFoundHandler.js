/**
 * 404 Not Found Middleware.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
      availableEndpoints: ['/api/v1/health'],
    },
  });
};

export default notFoundHandler;
