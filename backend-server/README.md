# Sketch Party Backend

A real-time WebSocket server for the Sketch Party collaborative drawing application. Built with Express.js and Socket.IO.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env`:
```env
PORT=8000
CLIENT_URL=http://localhost:3000
```

### Development

Run the development server:

```bash
npm start
# or
pnpm start
```
### 3. Environment Variables

In your Render service settings, add:

```
PORT=8000
CLIENT_URL=https://your-frontend.vercel.app
```

Note: Render automatically provides the `PORT` environment variable, but you can override it.

## API Endpoints

### HTTP Endpoints

- `GET /` - Health check endpoint

### Socket.IO Events

#### Client to Server

- `joinRequest(roomID)` - Join a drawing room
- `draw(drawData)` - Send drawing data
- `clearAll(roomID)` - Clear all drawings in room
- `close(roomID)` - Leave room

#### Server to Client

- `RoomJoined(boolean)` - Confirm room join
- `otherUsersDraw(drawData)` - Receive drawing from other users
- `clearCanvas(boolean)` - Clear canvas command
- `closing(boolean)` - Room closing notification

## Technologies Used

- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing
- **tsx** - TypeScript execution

## Development Scripts

- `npm start` - Start the server
- `npm run build` - Compile TypeScript
- `npm test` - Run tests (placeholder)