# Sketch Party 🎨

A real-time collaborative drawing application that allows multiple users to draw together on a shared canvas.

## ✨ Features

- **Real-time collaboration** - Draw with others simultaneously
- **Multiple drawing tools** - Pen, line, rectangle, circle, eraser
- **Room-based sessions** - Private drawing rooms with unique IDs
- **Clear all functionality** - Clear the canvas for all users
- **Responsive design** - Works on desktop, tablet, and mobile
- **Cross-platform** - Web-based, works on any device with a browser

## 💻 Local Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sketchParty
   ```

2. **Setup Backend**
   ```bash
   cd backend-server
   npm install
   cp .env.example .env
   npm start
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. **Open the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## 🛠️ Technologies

### Frontend
- **Next.js 14** - React framework with app router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Recoil** - State management
- **RoughJS** - Hand-drawn style graphics
- **Lucide React** - Beautiful icons

### Backend
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing

## 📱 How to Use

1. **Create or Join a Room** - Each drawing session has a unique room ID
2. **Choose Your Tool** - Select from pen, line, rectangle, circle, or eraser
3. **Start Drawing** - Draw on the canvas and see others' drawings in real-time
4. **Clear Canvas** - Use the clear button to remove all drawings for everyone
5. **Share Room ID** - Copy and share the room ID for others to join

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

**Happy Drawing!** 🎨✨