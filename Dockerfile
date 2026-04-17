# Use a lightweight Node + Python image
FROM nikolaik/python-nodejs:python3.10-nodejs20

WORKDIR /app

# Copy everything
COPY . .

# Install Backend dependencies
RUN cd backend && npm install

# Install ML dependencies (using --no-cache to save space)
RUN cd sample_AIML && pip install --no-cache-dir pandas -r requirements.txt

# Expose the port Render uses
EXPOSE 10000

# Start the server
CMD ["node", "MonthEnd/backend/server.js"]