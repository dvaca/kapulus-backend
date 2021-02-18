FROM node:10
# Create app directory into the container
WORKDIR /app
RUN ls
# Install dependencies
COPY package*.json ./
RUN npm install
# Copy app code
COPY . .
# Expose app port
#EXPOSE 4000
#Execute the app
CMD [ "node", "src/index.js" ]