# Sabir Amin Real Estate LLC SPC - Check-In/Check-Out System

A comprehensive web-based application for managing tenant check-ins, check-outs, property inspections, and Google Drive integration. Built with pure HTML, CSS, and JavaScript for easy deployment and tablet-friendly usage.

## Features

- **Tenant Management** - Add, edit, and manage tenant information with detailed profiles
- **Studio/Property Management** - Manage multiple studios with individual details
- **Check-In/Check-Out System** - Complete inspection checklists with condition ratings
- **Digital Signatures** - Capture tenant and inspector signatures
- **Photo/Video Uploads** - Document property condition with media files
- **Google Drive Integration** - Automatic folder creation and file synchronization
- **PDF Generation** - Export checklists as PDF documents
- **Company Policies** - Manage and display company policies for tenants
- **Responsive Design** - Optimized for Windows/Android tablets and desktop browsers

## Project Structure

```
html-app/
├── index.html              # Login page
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   ├── config.js          # Configuration settings
│   ├── auth.js            # Authentication module
│   └── app.js             # Application utilities
├── pages/
│   ├── dashboard.html     # Main dashboard
│   ├── tenants.html       # Tenant management
│   ├── tenant-detail.html # Individual tenant view
│   ├── studios.html       # Studio management
│   ├── checklist.html     # Check-in/check-out forms
│   ├── drive.html         # Google Drive browser
│   └── policies.html      # Company policies
└── README.md
```

## Quick Start

### 1. Deploy Frontend

This is a static HTML application that can be hosted on any web server or static hosting service:

**Option A: GitHub Pages**
1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings > Pages
4. Select source branch (main/master)
5. Your app will be available at `https://yourusername.github.io/repository-name/`

**Option B: Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `html-app` folder
3. Your app will be live instantly

**Option C: Traditional Web Hosting**
1. Upload all files to your web server
2. Ensure `index.html` is at the root
3. Access via your domain

### 2. Setup Backend API

The frontend requires a backend API. You'll need to deploy the Node.js backend separately:

```bash
# Clone and setup the backend
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start the server
npm start
```

### 3. Configure API URL

Update `js/config.js` with your backend API URL:

```javascript
const CONFIG = {
    API_URL: 'https://your-api-domain.com/api',
    APP_NAME: 'Sabir Amin Real Estate',
    VERSION: '1.0.0'
};
```

## Environment Variables (Backend)

Create a `.env` file in your backend directory:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=./data/database.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Google Drive API
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-refresh-token

# CORS (add your frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com
```

## Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Download credentials and configure backend
6. Run authentication flow to get refresh token

## Tablet Optimization

The application is optimized for tablet usage:

- **Touch-friendly buttons** - Minimum 44px touch targets
- **Responsive sidebar** - Collapses on smaller screens
- **Large form inputs** - Easy to tap and fill
- **Signature pad** - Touch-optimized canvas
- **File upload** - Camera and gallery access on tablets

### Recommended Tablet Settings

- **Minimum Resolution**: 1024x768
- **Browser**: Chrome, Safari, or Edge
- **Orientation**: Landscape recommended for forms

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Studios
- `GET /api/studios` - List all studios
- `POST /api/studios` - Create studio
- `PUT /api/studios/:id` - Update studio
- `DELETE /api/studios/:id` - Delete studio

### Checklists
- `GET /api/checklists` - List checklists
- `POST /api/checklists` - Create checklist
- `GET /api/checklists/:id` - Get checklist details
- `GET /api/checklists/:id/pdf` - Download PDF

### Google Drive
- `POST /api/drive/sync-studios` - Sync studios to Drive
- `GET /api/drive/folders/:id/files` - List folder contents

### Policies
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

## Browser Compatibility

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

## Security Notes

1. **HTTPS Required** - Always use HTTPS in production
2. **JWT Tokens** - Stored in localStorage, cleared on logout
3. **CORS** - Configure backend with your frontend domain
4. **File Uploads** - Validate file types and sizes server-side
5. **Google Drive** - Use service account for production

## Troubleshooting

### Common Issues

**CORS Errors**
- Ensure backend CORS_ORIGIN matches your frontend URL
- Check that API_URL in config.js is correct

**Google Drive Not Working**
- Verify Google API credentials
- Check refresh token is valid
- Ensure Drive API is enabled in Google Cloud Console

**Login Issues**
- Check JWT_SECRET is set in backend
- Verify API is running and accessible
- Check browser console for errors

**File Uploads Failing**
- Check file size limits
- Verify upload directory permissions
- Ensure proper multipart/form-data handling

## Development

### Local Development

1. Start backend server on port 5000
2. Update `js/config.js` to use `http://localhost:5000/api`
3. Open `index.html` in browser or use a local server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:3000
```

### Making Changes

- Edit HTML files directly
- Update CSS in `css/style.css`
- Modify JavaScript in `js/` folder
- Refresh browser to see changes

## Support

For issues or questions:
- Check the troubleshooting section
- Review browser console for errors
- Verify API connectivity
- Ensure all environment variables are set

## License

Private - Sabir Amin Real Estate LLC SPC

---

**Version**: 1.0.0  
**Last Updated**: 2024
