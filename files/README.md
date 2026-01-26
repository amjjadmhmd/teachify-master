# Teachify - E-Learning Platform

A comprehensive full-stack e-learning platform built with Django REST Framework and React, providing a complete educational management system with AI-powered features.

## Project Overview

Teachify is a master template designed for educational institutions and training platforms. It provides a scalable, production-ready foundation for building customized e-learning solutions for future clients.

**Repository:** https://github.com/Mahmoud-Wafi/Teachify_Master

---

## Project Structure

```
techify/
├── backend/                          # Django REST API Backend
│   └── cubraos/
│       ├── teachify/                 # Django Project Config
│       │   ├── settings.py            # Project settings & configuration
│       │   ├── urls.py                # URL routing
│       │   ├── views.py               # View logic
│       │   ├── asgi.py                # ASGI configuration
│       │   └── wsgi.py                # WSGI configuration
│       ├── apps/                      # Django Applications
│       │   ├── accounts/              # User authentication & profiles
│       │   ├── branding/              # Branding & customization
│       │   ├── common/                # Shared utilities
│       │   ├── courses/               # Course management
│       │   └── exams/                 # Exam & assessment system
│       ├── templates/                 # HTML templates
│       ├── static/                    # Static files (CSS, JS images)
│       ├── media/                     # User uploads (avatars, files)
│       ├── manage.py                  # Django management script
│       ├── requirements.txt           # Python dependencies
│       ├── db.sqlite3                 # SQLite database
│       ├── .env.example               # Environment variables template
│       └── set_lesson_durations.py    # Utility script
│
├── frontend/                          # React TypeScript Frontend
│   └── skill/
│       ├── src/
│       │   ├── api/                   # API client & endpoints
│       │   ├── components/            # React components
│       │   ├── pages/                 # Page components
│       │   ├── hooks/                 # Custom React hooks
│       │   ├── context/               # React context for state management
│       │   ├── services/              # Business logic services
│       │   ├── utils/                 # Utility functions
│       │   ├── constants/             # Constants & configuration
│       │   ├── types.ts               # TypeScript type definitions
│       │   ├── App.tsx                # Root app component
│       │   └── index.tsx              # Entry point
│       ├── public/
│       ├── vite.config.ts             # Vite bundler configuration
│       ├── tsconfig.json              # TypeScript configuration
│       ├── package.json               # Node dependencies
│       ├── .env.example               # Environment variables template
│       └── index.html                 # HTML entry point
│
└── .git/                              # Version control
```

---

## Technology Stack

### Backend
- **Framework:** Django 4.2.7
- **API:** Django REST Framework 3.14.0
- **Authentication:** JWT (djangorestframework-simplejwt 5.5.1)
- **Database:** PostgreSQL (psycopg2-binary) or SQLite (development)
- **Admin Panel:** Django Jazzmin 3.0.1
- **CORS:** django-cors-headers 4.3.1
- **Code Quality:** Black, Flake8, isort, mypy
- **Media Management:** Pillow 10.1.0
- **Utilities:** python-dotenv, requests, python-dateutil

### Frontend
- **Framework:** React 19.2.3 with TypeScript
- **Build Tool:** Vite 6.2.0
- **UI Components:** Lucide React (icons), Framer Motion (animations)
- **Data Visualization:** Recharts 3.5.1
- **HTTP Client:** Axios 1.6.2
- **Notifications:** Sonner 2.0.7
- **PDF Export:** jsPDF 4.0.0 + html2canvas 1.4.1
- **AI Integration:** Google GenAI 1.33.0
- **Styling:** TailwindCSS (via components)

---

## Development Phases

### Phase 1: Foundation Setup
- [x] Project initialization (Django + React)
- [x] Database models creation (accounts, courses, exams)
- [x] User authentication system
- [x] API endpoint structure

### Phase 2: Core Features
- [x] Course management CRUD operations
- [x] Exam & assessment system
- [x] User roles & permissions
- [x] Branding customization

### Phase 3: Enhancement
- [x] AI-powered features (Google GenAI integration)
- [x] PDF generation & export
- [x] Media handling (avatars, course materials)
- [x] Analytics & dashboards

### Phase 4: Refinement
- [x] Code quality tools (Black, Flake8, isort)
- [x] Error handling & validation
- [x] Performance optimization

---

## Setup Instructions

### Prerequisites
- **Python 3.8+** (Backend)
- **Node.js 16+** (Frontend)
- **PostgreSQL 12+** (Production) or SQLite (Development)
- **Git**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend/cubraos/teachify
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (database, secret key, etc.)
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (admin account):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

8. **Start development server:**
   ```bash
   python manage.py runserver
   ```
   - API available at `http://localhost:8000`
   - Admin panel at `http://localhost:8000/admin`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend/skill
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Add API base URL and Gemini API key:
   # VITE_API_BASE_URL=http://localhost:8000
   # VITE_GEMINI_API_KEY=your_key_here
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   - App available at `http://localhost:5173`

### Running Both Servers

In separate terminal windows:
```bash
# Terminal 1: Backend
cd backend/cubraos/teachify
source venv/bin/activate
python manage.py runserver

# Terminal 2: Frontend
cd frontend/skill
npm run dev
```

---

## Building for Production

### Backend
```bash
cd backend/cubraos/teachify
# Configure PostgreSQL in .env
# Update ALLOWED_HOSTS in settings.py
# Run migrations on production database
python manage.py migrate --database=production
# Collect static files to production directory
python manage.py collectstatic --noinput
# Use production WSGI server (Gunicorn, uWSGI)
gunicorn teachify.wsgi:application
```

### Frontend
```bash
cd frontend/skill
# Build optimized production bundle
npm run build
# Output in dist/ directory
# Deploy to static hosting or CDN
```

---

## Using as Master Template for Future Clients

Teachify is designed to be cloned and customized for different educational institutions. Follow these steps to create a new project for a client:

### Step 1: Clone the Master Repository
```bash
# Clone the master template
git clone https://github.com/Mahmoud-Wafi/Teachify_Master.git ClientName_Teachify
cd ClientName_Teachify

# Initialize a new repository for the client
git remote remove origin
git remote add origin https://github.com/YourOrg/ClientName_Teachify.git
git branch -M main
git push -u origin main
```

### Step 2: Customize Project Settings

**Backend Customization:**
```bash
cd backend/cubraos/teachify

# Update Django settings for client
# 1. Modify ALLOWED_HOSTS in settings.py
# 2. Update DATABASES configuration
# 3. Configure email backend for client domain
# 4. Update CORS_ALLOWED_ORIGINS for frontend domain
# 5. Set up S3 or custom storage for media files
# 6. Configure third-party integrations (payment, email, etc.)

# Update branding
# - Modify logo & colors in branding app
# - Update email templates
# - Customize admin interface in apps
```

**Frontend Customization:**
```bash
cd frontend/skill

# 1. Update branding in components:
#    - Logo, colors, fonts
#    - Company name & contact info
#    - Theme configuration
# 
# 2. Modify API endpoints if needed
# 3. Update environment-specific configs
# 4. Customize features based on client needs
```

### Step 3: Database Setup for Client
```bash
# Create new PostgreSQL database
createdb client_teachify_db

# Update .env with client database credentials
# Run migrations
python manage.py migrate

# Create client-specific superuser
python manage.py createsuperuser

# Seed initial data if needed
python manage.py loaddata initial_data.json
```

### Step 4: Client-Specific Configuration

**Environment Variables (.env files):**

Backend:
```env
SECRET_KEY=your_client_secret_key
DEBUG=False
DATABASE_URL=postgresql://user:pass@localhost/client_teachify_db


Frontend:
```env
VITE_API_BASE_URL=https://api.client.example.com
VITE_APP_NAME=Client Teachify
VITE_GEMINI_API_KEY=client_specific_key
```

### Step 5: Deployment

**Backend Deployment:**
- Deploy to AWS EC2, Heroku, DigitalOcean, or your preferred platform
- Configure PostgreSQL database
- Set up SSL/HTTPS
- Configure domain & DNS
- Set up automated backups

**Frontend Deployment:**
- Build production bundle: `npm run build`
- Deploy to Vercel, Netlify, AWS S3+CloudFront, or your preferred platform
- Configure environment variables
- Set up CDN for assets

### Step 6: Version Management

```bash
# Create a client branch for tracking customizations
git checkout -b client/client-name

# Track all customizations on this branch
# Periodically merge updates from master
git merge main  # Pull latest updates from master template

# Tag release for client
git tag -a v1.0.0 -m "Client Teachify v1.0.0"
git push origin client/client-name --tags
```

---

## User Flows & Process Diagrams

### Student Journey Map

Students follow this path through the platform:

1. **Authentication** → Login/Signup
2. **Discovery** → Browse Marketplace
3. **Shopping** → Add to Wishlist/Cart → Submit Payment Proof
4. **Enrollment** → Wait for approval → Get enrolled in course
5. **Learning** → Watch lessons → Track progress
6. **Assessment** → Take exams → View results
7. **Certification** → Receive certificate on passing

### Instructor Management Flow

Instructors use these features to manage education:

1. **Authentication** → Login/Signup
2. **Content Creation** → Create courses → Add lessons → Upload videos → Add resources
3. **Assessment Setup** → Create exams → Add questions → Set grading rules → Create tasks
4. **Student Monitoring** → View enrollments → Track progress → Review submissions
5. **Grading** → Grade task submissions → Provide feedback
6. **Finance** → View payment requests → Track revenue
7. **Certification** → Issue certificates to passed students

### Database Model Relationships

The platform connects data through these relationships:

- **User** model: Central entity with role-based access (Student/Instructor/Admin)
- **Instructor Creates**: Courses → Lessons → Resources → Exams → Questions → Tasks
- **Student Enrolls**: Via Payment → Creates Enrollment → Tracks LessonProgress
- **Assessment**: Takes ExamAttempt → Submits StudentAnswers → Receives Certificate
- **Task Submission**: Student submits → Instructor grades → Provides feedback
- **Payment Flow**: Cart → PaymentRequest → (Approval) → Enrollment

---

## Key Features

### User Management
- Multi-role authentication (Student, Instructor, Admin)
- JWT-based API security
- User profiles with avatars
- Role-based access control

### Course Management
- Create, update, delete courses
- Organize courses by categories
- Lesson & module structure
- Course materials & resources

### Exam System
- Create & manage exams
- Multiple question types
- Automatic grading
- Result analytics

### Admin Features
- Django Jazzmin admin interface
- User & course management
- Analytics & reporting
- Branding customization

### AI Integration
- Google GenAI powered features
- Intelligent content generation
- Smart recommendations

### Export & Reporting
- PDF generation
- Report export functionality
- Analytics dashboards

---

## API Documentation

The Django REST Framework provides auto-generated API documentation:
- **Swagger UI:** `/api/docs/` (if configured)
- **ReDoc:** `/api/redoc/` (if configured)
- **Browsable API:** All `/api/` endpoints in browser

Main API endpoints:
- `/api/auth/` - Authentication
- `/api/courses/` - Course management
- `/api/exams/` - Exam management
- `/api/users/` - User management
- `/api/accounts/` - Account operations

---

## Database Models

### Key Models
- **User** - Extended Django user model
- **Course** - Course information
- **Lesson** - Individual lessons
- **Exam** - Examination records
- **Question** - Exam questions
- **Answer** - Student answers
- **UserProfile** - User metadata
- **Branding** - Organization customization

---

## Environment Variables Reference

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/db_name
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your-gemini-api-key
```

---

## Development Workflow

### Code Quality
```bash
# Format code with Black
black .

# Lint with Flake8
flake8 .

# Sort imports
isort .

# Type checking
mypy .
```

### Testing
```bash
# Run Django tests
python manage.py test

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Migrations
```bash
# Create new migration
python manage.py makemigrations app_name

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

---

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Change Django port
python manage.py runserver 8001

# Change Vite port
npm run dev -- --port 5174
```

**Database Connection Error:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists and user has permissions

**CORS Errors:**
- Check CORS_ALLOWED_ORIGINS in Django settings
- Verify frontend origin matches configuration

**Missing Dependencies:**
```bash
# Backend
pip install -r requirements.txt --upgrade

# Frontend
npm install --legacy-peer-deps
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make changes and test thoroughly
3. Commit with clear messages: `git commit -m "Add feature description"`
4. Push to branch: `git push origin feature/feature-name`
5. Create Pull Request for review

---

## Support & Documentation

- **Django Documentation:** https://docs.djangoproject.com/
- **Django REST Framework:** https://www.django-rest-framework.org/
- **React Documentation:** https://react.dev/
- **Vite Guide:** https://vitejs.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## License

This project is proprietary. All rights reserved. Use only as authorized by the project owner.

---


**Repository:** https://github.com/Mahmoud-Wafi/Teachify_Master

---

**Last Updated:** January 2026  
**Version:** 1.0.0
