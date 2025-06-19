# Sketch Party Frontend

A real-time collaborative drawing application built with Next.js, React, and Socket.IO.

## Features

- Real-time collaborative drawing
- Multiple drawing tools (pen, line, rectangle, circle, eraser)
- Clear all functionality
- Room-based collaboration
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js 18+ or pnpm
- A running backend server (see `../backend-server`)

### Installation

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update the environment variables in `.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 2. Build Configuration

Vercel will automatically detect this as a Next.js project. The build settings should be:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Recoil** - State management
- **RoughJS** - Hand-drawn style graphics
- **Lucide React** - Icons 