FROM node:10
# Create app directory into the container
WORKDIR /usr/src/app/kapulus-backend
# Install dependencies
COPY . ./
RUN npm install
# Expose app port
EXPOSE 5000
#Execute the app
CMD [ "npm", "start"]
