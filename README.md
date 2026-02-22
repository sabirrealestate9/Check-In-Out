# Sabir Amin Real Estate LLC SPC - Check-In/Check-Out System

A comprehensive web-based application for managing tenant check-ins, check-outs, and property inspections with seamless Google Drive integration.

## Features

### Core Functionality
- **Tenant Management**: Add, edit, and track tenant information
- **Check-In/Check-Out System**: Complete property condition checklists with digital signatures
- **Studio Management**: Manage multiple property units/studios
- **Google Drive Integration**: Automatic file organization and storage
- **Company Policies**: Manage and display company policies and instructions
- **Dashboard**: Real-time overview of occupancy, upcoming check-outs, and statistics
- **PDF Generation**: Automatic PDF reports for checklists and tenant details
- **Audit Logging**: Track all system activities

### Security Features
- JWT-based authentication
- Role-based access control (Admin/Staff)
- Secure password hashing
- Rate limiting
- CORS protection
- Helmet security headers

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router
- Axios
- Lucide React icons

### Backend
- Node.js with Express
- SQLite database
- Google Drive API v3
- JWT authentication
- Multer for file uploads
- PDFKit for PDF generation

## Project Structure

```
app/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, upload middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (Google Drive, PDF)
│   │   └── utils/           # Utility functions
│   ├── config/              # Configuration files
│   ├── uploads/             # Temporary upload storage
│   ├── database/            # SQLite database
│   ├── server.js            # Main server file
│   └── package.json
├── src/                     # React frontend
│   ├── components/          # Reusable components
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Google Cloud Platform account with Drive API enabled
- Service account credentials

### 1. Clone and Install Dependencies

```bash
# Frontend dependencies
cd app
npm install

# Backend dependencies
cd backend
npm install
```

### 2. Configure Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Google Drive API Configuration
# Option 1: Path to service account JSON file
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json

# Option 2: Paste JSON content directly (recommended for production)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Root Google Drive Folder ID
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-root-folder-id

# Database
DB_PATH=./database/realestate.db

# File Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=20

# Allowed Origins for CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend (.env)
Create a `.env` file in the `app` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Set Up Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name and description
   - Grant it "Editor" role
5. Create a key:
   - Click on the service account
   - Go to Keys tab
   - Add Key > Create new key > JSON
   - Download the JSON file
6. Save the JSON file as `backend/config/google-service-account.json`
7. Create a root folder in Google Drive and share it with the service account email
8. Copy the folder ID from the URL and set it as `GOOGLE_DRIVE_ROOT_FOLDER_ID`

### 4. Run the Application

```bash
# Start the backend server (from backend directory)
cd backend
npm run dev

# Start the frontend (from app directory, in a new terminal)
cd app
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### 5. Default Login Credentials

- **Email**: admin@sabiramin.ae
- **Password**: admin123

**Important**: Change the default password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - List all users (Admin only)
- `POST /api/auth/users` - Create new user (Admin only)
- `PUT /api/auth/users/:id` - Update user (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Tenants
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `POST /api/tenants/:id/checkout` - Check out tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Studios
- `GET /api/studios` - List all studios
- `GET /api/studios/:id` - Get studio details
- `POST /api/studios` - Create new studio
- `PUT /api/studios/:id` - Update studio
- `DELETE /api/studios/:id` - Delete studio

### Checklists
- `GET /api/checklists` - List all checklists
- `GET /api/checklists/:id` - Get checklist details
- `POST /api/checklists` - Create new checklist (with file upload)
- `PUT /api/checklists/:id` - Update checklist
- `DELETE /api/checklists/:id` - Delete checklist

### Google Drive
- `GET /api/drive/status` - Check Drive connection status
- `GET /api/drive/studios` - List studio folders
- `GET /api/drive/studios/:folderId/contents` - Get folder contents
- `GET /api/drive/studios/:folderId/structure` - Get folder structure
- `GET /api/drive/files/:fileId` - Get file details
- `GET /api/drive/files/:fileId/download` - Get download URL
- `POST /api/drive/sync-studios` - Sync studios with Drive

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/tenant-stats` - Get tenant statistics

### Company Policies
- `GET /api/policies` - List all policies
- `GET /api/policies/:id` - Get policy details
- `POST /api/policies` - Create new policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

## Google Drive Folder Structure

When a checklist is submitted, the system creates the following structure:

```
Root Folder (configured in .env)
├── Studio Name 1/
│   ├── 2024-01-15_10-30-00_From_2024-01-15_To_2024-01-20_check_in/
│   │   ├── Checklist_check_in_Tenant_Name.pdf
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── video1.mp4
│   └── 2024-01-20_14-00-00_From_2024-01-15_To_2024-01-20_check_out/
│       ├── Checklist_check_out_Tenant_Name.pdf
│       └── ...
├── Studio Name 2/
│   └── ...
```

## Production Deployment

### 1. Build Frontend
```bash
cd app
npm run build
```

### 2. Environment Variables for Production
Update `.env` files with production values:
- Use strong JWT secret
- Set `NODE_ENV=production`
- Update `ALLOWED_ORIGINS` with your domain
- Use production Google Drive credentials

### 3. Deploy Backend
Options:
- **VPS/Dedicated Server**: Use PM2 for process management
- **Heroku**: Follow Heroku Node.js deployment guide
- **Railway/Render**: Connect GitHub repository

### 4. Deploy Frontend
Options:
- **Vercel**: Connect GitHub repository
- **Netlify**: Connect GitHub repository
- **Static Hosting**: Upload `dist` folder contents

### 5. SSL/HTTPS
Ensure both frontend and backend use HTTPS in production.

## Security Considerations

1. **Change default admin password** immediately after first login
2. **Use strong JWT secret** in production
3. **Keep service account credentials secure** - never commit to version control
4. **Enable HTTPS** for production deployments
5. **Regular backups** of the SQLite database
6. **Monitor audit logs** for suspicious activity

## Troubleshooting

### Google Drive Connection Issues
1. Verify service account JSON is correct
2. Check that Drive API is enabled in Google Cloud Console
3. Ensure root folder is shared with service account email
4. Check server logs for detailed error messages

### File Upload Issues
1. Check `MAX_FILE_SIZE` setting
2. Verify temp upload directory exists and is writable
3. Check browser console for CORS errors

### Database Issues
1. Ensure `database` directory exists and is writable
2. Check file permissions
3. Verify SQLite3 is installed

## Support

For technical support or feature requests, please contact the development team.

## License

Private - Sabir Amin Real Estate LLC SPC
