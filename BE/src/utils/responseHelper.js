/**
 * Standard response format helper
 */

export const sendResponse = (
  res,
  data,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res,
  message = "Error occurred",
  statusCode = 500,
  error = null
) => {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

export const sendReponseList = (
  res,
  data = {
    items: [],
    metadata: {
      total: 0,
      page: 1,
      limit: 10,
    },
  },
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export default {
  sendResponse,
  sendError,
  sendReponseList,
};
