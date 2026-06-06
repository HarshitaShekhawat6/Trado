let authToken = null;

export const saveToken = async (token) => {
  authToken = token || null;
};

export const getToken = async () => authToken;

export const clearToken = async () => {
  authToken = null;
};
