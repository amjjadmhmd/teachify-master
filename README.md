# Teachify - Email System Branch

A comprehensive educational platform with integrated email communication system. This branch (`Email-System`) focuses on email functionality implementation.

## Project Overview

Teachify is a full-stack web application built with:
- **Frontend**: React 19 + TypeScript with Vite
- **Backend**: Django 4.2 with Django REST Framework
- **Email System**: Celery + Redis for async email processing
- **Database**: PostgreSQL with Django ORM
- **AI Integration**: Google Generative AI (Gemini)

## Project Structure

```
techify/
├── backend/
│   └── cubraos/
│       └── teachify/              # Django project root
│           ├── apps/              # Django applications
│           ├── teachify/          # Project settings & configuration
│           ├── templates/         # Email templates
│           ├── static/            # Static files (CSS, JS)
│           ├── media/             # User uploads
│           ├── manage.py          # Django management script
│           ├── requirements.txt   # Python dependencies
│           ├── .env              # Environment variables
│           ├── EMAIL_IMPLEMENTATION.md  # Email system docs
│           ├── verify_email_setup.py    # Email verification script
│           ├── test_email_manually.py   # Email testing script
│           └── db.sqlite3        # SQLite database
│
├── frontend/
│   └── skill/                     # React frontend application
│       ├── src/
│       │   ├── components/        # React components
│       │   ├── pages/             # Page components
│       │   ├── api/               # API integration
│       │   ├── hooks/             # Custom React hooks
│       │   ├── context/           # Context providers
│       │   ├── services/          # Business logic services
│       │   ├── utils/             # Utility functions
│       │   ├── constants/         # Constants
│       │   ├── types.ts           # TypeScript type definitions
│       │   ├── App.tsx            # Main App component
│       │   └── index.tsx          # Entry point
│       ├── index.html             # HTML template
│       ├── vite.config.ts         # Vite configuration
│       ├── tsconfig.json          # TypeScript configuration
│       ├── package.json           # Node dependencies
│       └── .env                   # Frontend environment variables
│
└── files/                         # File storage directory
```

## Technology Stack

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework 3.14.0** - RESTful API
- **Django CORS Headers 4.3.1** - CORS handling
- **Django Jazzmin 3.0.1** - Admin interface
- **djangorestframework-simplejwt 5.5.1** - JWT authentication
- **Celery 5.3.4** - Async task queue
- **Redis 5.0.1** - Message broker & caching
- **PostgreSQL** - Database
- **Pillow 10.1.0** - Image processing
- **python-dotenv 1.0.0** - Environment management

### Frontend
- **React 19.2.3** - UI library
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool
- **Axios 1.6.2** - HTTP client
- **Lucide React 0.561.0** - Icon library
- **Recharts 3.5.1** - Chart library
- **Framer Motion 11.11.1** - Animation library
- **html2canvas 1.4.1** - Screenshot utility
- **jsPDF 4.0.0** - PDF generation
- **Sonner 2.0.7** - Toast notifications
- **@google/genai 1.33.0** - Google AI integration

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 12+ (production)
- Redis 6+ (for email/task queue)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend/cubraos
```

2. Create and activate virtual environment:
```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r teachify/requirements.txt
```

4. Configure environment variables:
```bash
cd teachify
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

Backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend/skill
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL and keys
```

4. Run development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173` (or as shown in terminal)

### Email System Setup

The Email System branch includes full email functionality. See `backend/cubraos/teachify/EMAIL_IMPLEMENTATION.md` for detailed setup instructions.

**Key Setup Steps:**
1. Configure email provider (Gmail, SendGrid, etc.) in Django settings
2. Set email environment variables in `.env`
3. Start Celery worker for async email processing
4. Configure Redis for message broker

**Celery Worker:**
```bash
celery -A teachify worker -l info
```

**Celery Beat (for scheduled tasks):**
```bash
celery -A teachify beat -l info
```

## Email Testing

Two utility scripts are available for testing email functionality:

1. **Verify Email Setup** - Checks email configuration:
```bash
python verify_email_setup.py
```

2. **Test Email Manually** - Sends test email:
```bash
python test_email_manually.py
```

## Key Features

- User authentication with JWT
- Email notifications system
- Async task processing with Celery
- AI-powered assistant using Google Generative AI
- Chart and analytics visualization
- PDF generation from reports
- Admin interface with Jazzmin
- Responsive design with Framer Motion animations

## Environment Variables

### Backend (.env)
```
ALLOWED_HOSTS=localhost,127.0.0.1
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/dbname
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
```

### Frontend (.env)
```
VITE_API_URL=http://127.0.0.1:8000
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_APP_NAME=Teachify
VITE_APP_VERSION=1.0.0
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_ANALYTICS=false
```

## Development Workflow

1. Create a feature branch from `Email-System`
2. Make your changes in backend and/or frontend
3. Test thoroughly (see testing section)
4. Commit with clear messages
5. Push and create a pull request

## API Documentation

API endpoints are available at `/api/` when running the Django development server. Swagger/OpenAPI documentation may be available depending on your configuration.

## Building for Production

### Backend
```bash
# Ensure static files are collected
python manage.py collectstatic

# Use a production WSGI server (e.g., Gunicorn)
gunicorn teachify.wsgi:application
```

### Frontend
```bash
# Build for production
npm run build

# Output is in the 'dist' directory
```

## Troubleshooting

### Email Not Sending
- Check `EMAIL_IMPLEMENTATION.md` for detailed troubleshooting
- Run `verify_email_setup.py` to validate configuration
- Check Celery worker logs if using async tasks
- Verify Redis is running: `redis-cli ping`

### Database Issues
- Run migrations: `python manage.py migrate`
- Check PostgreSQL connection string in `.env`
- Reset database (development only): `python manage.py flush`

### Frontend Build Issues
- Clear cache: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)
- Rebuild: `npm run build`

## Contributing

When contributing to the Email-System branch:
1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Use meaningful commit messages

## License

Your project license here

## Contact

For questions or support regarding this project, contact the development team.

---

**Branch**: Email-System
**Last Updated**: January 26, 2025
**Repository**: https://github.com/Mahmoud-Wafi/Teachify_Master
