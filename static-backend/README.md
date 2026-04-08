# Static-Backend Microservice

A microservice for handling file uploads (images and videos) for the IICPA Institute platform.

## Features

- **Image Uploads**: Support for JPEG, PNG, GIF, WebP (5MB limit)
- **Video Uploads**: Support for MP4, AVI, MOV, WMV, FLV (350MB limit)
- **CDN Integration**: Generates proper CDN URLs for uploaded files
- **Database Storage**: MongoDB database for file metadata
- **File Management**: List, upload, and delete files
- **CORS Enabled**: Cross-origin requests supported

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**

   - Copy `config.env` and modify as needed
   - Set your CDN base URL: `CDN_BASE_URL=https://cdn.iicpa.in`
   - Configure MongoDB connection: `MONGODB_URI=mongodb://localhost:27017/static_backend`
   - Adjust file size limits if needed

3. **Start the Service**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Welcome

```
GET /
```

**Response:**

```json
{
  "message": "Welcome to Static API",
  "service": "static-backend",
  "version": "1.0.0",
  "endpoints": {
    "welcome": "GET /",
    "health": "GET /health",
    "uploadImage": "POST /upload/image",
    "uploadVideo": "POST /upload/video",
    "uploadMultipleImages": "POST /upload/images",
    "uploadMultipleVideos": "POST /upload/videos",
    "bulkUpload": "POST /upload/bulk",
    "getFiles": "GET /files",
    "getImages": "GET /files/images",
    "getVideos": "GET /files/videos",
    "deleteFile": "DELETE /files/:id"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Upload Files

#### Upload Single Image

```
POST /upload/image
Content-Type: multipart/form-data

Body: { image: [file] }
```

**Response:**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filename": "img-1234567890-123456789.jpg",
    "originalName": "example.jpg",
    "size": 1024000,
    "cdnUrl": "https://cdn.iicpa.in/uploads/images/img-1234567890-123456789.jpg"
  }
}
```

#### Upload Single Video

```
POST /upload/video
Content-Type: multipart/form-data

Body: { video: [file] }
```

**Response:**

```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "filename": "vid-1234567890-123456789.mp4",
    "originalName": "example.mp4",
    "size": 52428800,
    "cdnUrl": "https://cdn.iicpa.in/uploads/videos/vid-1234567890-123456789.mp4"
  }
}
```

#### Upload Multiple Images

```
POST /upload/images
Content-Type: multipart/form-data

Body: { images: [file1, file2, file3, ...] }
```

**Note:** Maximum 10 images per upload

**Response:**

```json
{
  "success": true,
  "message": "Successfully uploaded 3 images",
  "data": {
    "uploaded": [
      {
        "id": "507f1f77bcf86cd799439011",
        "filename": "img-1234567890-123456789.jpg",
        "originalName": "image1.jpg",
        "size": 1024000,
        "cdnUrl": "https://cdn.iicpa.in/uploads/images/img-1234567890-123456789.jpg"
      }
    ],
    "errors": [],
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

#### Upload Multiple Videos

```
POST /upload/videos
Content-Type: multipart/form-data

Body: { videos: [file1, file2, file3, ...] }
```

**Note:** Maximum 5 videos per upload

**Response:**

```json
{
  "success": true,
  "message": "Successfully uploaded 2 videos",
  "data": {
    "uploaded": [
      {
        "id": "507f1f77bcf86cd799439011",
        "filename": "vid-1234567890-123456789.mp4",
        "originalName": "video1.mp4",
        "size": 52428800,
        "cdnUrl": "https://cdn.iicpa.in/uploads/videos/vid-1234567890-123456789.mp4"
      }
    ],
    "errors": [],
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

#### Bulk Upload (Mixed Files)

```
POST /upload/bulk
Content-Type: multipart/form-data

Body: { files: [image1.jpg, video1.mp4, image2.png, ...] }
```

**Note:** Maximum 15 files total (images + videos)

**Response:**

```json
{
  "success": true,
  "message": "Successfully uploaded 5 files",
  "data": {
    "uploaded": [
      {
        "id": "507f1f77bcf86cd799439011",
        "filename": "img-1234567890-123456789.jpg",
        "originalName": "image1.jpg",
        "size": 1024000,
        "cdnUrl": "https://cdn.iicpa.in/uploads/images/img-1234567890-123456789.jpg",
        "type": "image"
      }
    ],
    "errors": [],
    "total": 5,
    "successful": 5,
    "failed": 0,
    "summary": {
      "images": 3,
      "videos": 2
    }
  }
}
```

### File Management

#### Get All Files

```
GET /files
```

#### Get Files by Type

```
GET /files/images
GET /files/videos
```

#### Delete File

```
DELETE /files/:id
```

### Health Check

```
GET /health
```

## File Storage Structure

```
static-backend/
├── uploads/
│   ├── images/          # Image files
│   └── videos/          # Video files
├── .env                 # Environment configuration
├── index.js             # Main server file
├── package.json         # Dependencies
└── README.md            # Documentation
```

## Database Schema

```javascript
// MongoDB Collection: files
{
  _id: ObjectId,
  filename: String,
  original_name: String,
  file_path: String,
  file_size: Number,
  file_type: String,
  cdn_url: String,
  upload_date: Date
}
```

## Environment Variables

| Variable          | Description               | Default                                  |
| ----------------- | ------------------------- | ---------------------------------------- |
| `PORT`            | Server port               | 3001                                     |
| `CDN_BASE_URL`    | CDN base URL              | https://cdn.iicpa.in                     |
| `MAX_IMAGE_SIZE`  | Max image size in bytes   | 5242880 (5MB)                            |
| `MAX_VIDEO_SIZE`  | Max video size in bytes   | 367001600 (350MB)                        |
| `MONGODB_URI`     | MongoDB connection string | mongodb://localhost:27017/static_backend |
| `MONGODB_DB_NAME` | MongoDB database name     | static_backend                           |

## Supported File Types

### Images

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Videos

- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- WMV (.wmv)
- FLV (.flv)

## Deployment

1. **Server Setup**

   - Deploy to your server at `cdn.iicpa.in`
   - Ensure proper file permissions for uploads directory
   - Set up reverse proxy if needed

2. **Environment Configuration**

   - Update `CDN_BASE_URL` to match your domain
   - Set appropriate file size limits
   - Configure database path

3. **File Permissions**
   ```bash
   chmod 755 uploads/
   chmod 755 uploads/images/
   chmod 755 uploads/videos/
   ```

## Integration with Frontend

The microservice generates CDN URLs that can be directly used in your frontend:

```javascript
// Example: Upload image and get CDN URL
const formData = new FormData();
formData.append("image", file);

fetch("https://cdn.iicpa.in/upload/image", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => {
    const cdnUrl = data.data.cdnUrl;
    // Use cdnUrl in your rich text editor or content
  });
```

## Error Handling

The service includes comprehensive error handling for:

- File size limits
- Invalid file types
- Database errors
- File system errors
- Multer errors

## Security Features

- File type validation
- File size limits
- Unique filename generation
- CORS configuration
- Input validation

## Monitoring

- Health check endpoint (`/health`)
- Comprehensive logging
- Error tracking
- File upload statistics via database
