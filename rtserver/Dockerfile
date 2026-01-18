FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD sh -c "npx sequelize-cli --options-path .sequelizerc.main db:migrate && npx sequelize-cli --options-path .sequelizerc.crm db:migrate && node app.js"