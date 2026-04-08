#!/bin/bash

# Deployment setup script for static-backend microservice
echo "Setting up static-backend for deployment..."

# Create upload directories with proper permissions
echo "Creating upload directories..."
mkdir -p uploads/images
mkdir -p uploads/videos

# Set proper permissions (adjust as needed for your server)
chmod 755 uploads
chmod 755 uploads/images
chmod 755 uploads/videos

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/static_backend
MONGODB_DB_NAME=static_backend

# CDN Configuration
CDN_BASE_URL=https://cdn.iicpa.in

# File Upload Limits
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=367001600

# Allowed File Types
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_VIDEO_TYPES=video/mp4,video/avi,video/mov,video/wmv,video/flv,video/webm

# Server Configuration
PORT=3001
EOF
    echo ".env file created. Please update with your actual values."
else
    echo ".env file already exists."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup MongoDB indexes
echo "Setting up MongoDB indexes..."
node setup-mongodb.js

echo "Deployment setup complete!"
echo "Make sure to:"
echo "1. Update .env with your actual MongoDB connection string"
echo "2. Update CDN_BASE_URL to match your domain"
echo "3. Ensure MongoDB is running and accessible"
echo "4. Start the service with: npm start"
