export const handleApiError = (error) => {
  if (!error.response) {
    return "Network error. Please check your connection.";
  }

  switch (error.response.status) {
    case 400: return error.response.data?.message || "Bad request.";
    case 401: return "Session expired. Please login again.";
    case 403: return "You are not authorized.";
    case 404: return "Resource not found.";
    case 422: return error.response.data?.message || "Validation error.";
    case 500: return "Server error. Please try again later.";
    default:  return "Something went wrong.";
  }
};