import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
const { NODE_ENV, PORT, PROD_DOMAIN, DEV_DOMAIN } = process.env;

// Initialize the server with socket.io
const app = express();

app.use(
  cors({
    origin: NODE_ENV === "production" ? PROD_DOMAIN : DEV_DOMAIN,
  })
);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: NODE_ENV === "production" ? PROD_DOMAIN : DEV_DOMAIN,
  },
});

// Define basic test route
app.get("/", (req, res) => {
  res.json({ message: "Hello World." });
});

// Create map for userId and socketId
// Integrate redis later
const userToSocket = new Map();
const socketToUser = new Map();

// Listen for incoming socket events
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Listen for socket events
  socket.on(
    "join-room",
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      userToSocket.set(userId, socket.id);
      socketToUser.set(socket.id, userId);

      io.to(socket.id).emit("joined-room", { roomId, userId });
    }
  );
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
