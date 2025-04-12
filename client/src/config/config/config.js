const config = {
  // Development configuration
  development: {
    // URL for the development api
    backendUrl: "http://localhost:8080/api/v1/dalle",
  },
  // Production configuration
  production: {
    // URL for the production api
    backendUrl: "https://devswag.onrender.com/api/v1/dalle",
  },

  authService: "https://localhost:2000", // temp example, every link should be written in either development or production object.
};

// Export the configuration object
export default config;
