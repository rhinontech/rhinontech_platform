const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "RT Server",
    version: "1.0.0",
  },
  host: "localhost:5001",
  schemes: ["http"],
};

const outputFile = "./swagger_output.json";

// Scan app.js AND all routes including nested CRM folders
const endpointsFiles = ["./app.js", "./routes/**/*.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
