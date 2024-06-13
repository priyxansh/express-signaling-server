FROM node:21.1-alpine

# Create a new user and group in the container
RUN addgroup --system app && adduser --system --ingroup app app

# Change the user to the app user
USER app

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Copy pnpm-lock.yaml file to the working directory
COPY pnpm-lock.yaml ./

# Change the user to root
USER root

# Install pnpm
RUN npm install -g pnpm

# Change the owner of the working directory to the app user
RUN chown -R app:app /app

# Change the user to the app user
USER app

# Install the dependencies
RUN pnpm install

# Copy the source code to the working directory
COPY . .

# Build the application
RUN pnpm run build

# Expose the port
EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]