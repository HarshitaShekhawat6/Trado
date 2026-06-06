const ENV = {
  development: {
   // API_BASE_URL: "https://tradeloop.sragindia.com/",
   API_BASE_URL: "http://localhost:5000",
  },
  production: {
// API_BASE_URL: "https://tradeloop.sragindia.com/",
 API_BASE_URL: "http://localhost:5000",

  },
};

const getEnv = () => { 
  if (__DEV__) return ENV.development;
  return ENV.production;
};

const currentEnv = getEnv();

export default currentEnv;
