# Bule Music

Bule Music is a real-time music streaming platform that allows up to three users to listen to music together in perfect sync. It uses Socket.IO for synchronized playback and Amazon S3 for secure music streaming, providing a fast and responsive listening experience.

## Features

- Create and join music party rooms
- Real-time synchronized playback
- Shared music queue
- Floating music player
- Instant song search
- Member list with host identification
- Secure music streaming using Amazon S3 signed URLs
- HTML5 Audio API
- Responsive design
- Toast notifications
- Loading screens and skeleton loaders
- Smooth animations
- Automatic room synchronization
- Automatic reconnection after refresh

## Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- Socket.IO Client
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO

### Storage

- Amazon S3

## Project Structure

```text
Bule-Music/
│
├── frontend/
└── backend/
```

## Installation

### Clone the Repository

```bash
git clone https://github.com/Sanjith2006k/BuleMusic.git
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Backend (.env)

```env
PORT=5000

FRONTEND_URL=http://localhost:3000

AWS_ACCESS_KEY_ID= "here_add_your_aws_key"

AWS_SECRET_ACCESS_KEY= "here_add_your_aws_seceret_key"

AWS_REGION= "aws_region"

S3_BUCKET_NAME= "s3_bucke_name"
```

## Future Improvements

- User authentication
- Persistent playlists
- Chat inside party rooms
- Favorites
- Playback history
- Database integration

## Deployment

- Frontend: Vercel
- Backend: Render
- Music Storage: Amazon S3

## License

S Sanjith Kumar
