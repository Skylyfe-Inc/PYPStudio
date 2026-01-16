const config = {
  // Development configuration
  development: {
    // URL for the development api
    backendUrl: "http://localhost:8080",
  },
  // Production configuration
  production: {
    // URL for the production api
    backendUrl: "https://www.placeyourprintstudio.com",
  },

  authService: "https://localhost:2000", // temp example, every link should be written in either development or production object.
};

// Export the configuration object
export default config;
