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
  // Listen for socket events
  socket.on(
    "join-room",
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      userToSocket.set(userId, socket.id);
      socketToUser.set(socket.id, userId);

      io.to(roomId).emit("user-joined", {
        userId,
        socketId: socket.id,
      });

      console.log("User joined room", roomId, userId, socket.id);

      socket.join(roomId);

      io.to(socket.id).emit("joined-room", { roomId, userId });
    }
  );

  socket.on(
    "offer",
    (data: { offer: RTCSessionDescriptionInit; to: string }) => {
      console.log("offer", data.to);
      io.to(data.to).emit("offer", {
        offer: data.offer,
        from: socket.id,
      });
    }
  );

  socket.on(
    "answer",
    (data: { answer: RTCSessionDescriptionInit; to: string }) => {
      console.log({ answer: data.answer, to: data.to });
      io.to(data.to).emit("answer", {
        answer: data.answer,
        from: socket.id,
      });
    }
  );

  socket.on(
    "negotiation-needed",
    (data: { offer: RTCSessionDescriptionInit; to: string }) => {
      console.log("offer", data.to);
      io.to(data.to).emit("negotiation-needed", {
        offer: data.offer,
        from: socket.id,
      });
    }
  );

  socket.on(
    "negotiation-done",
    (data: { answer: RTCSessionDescriptionInit; to: string }) => {
      console.log("answer", data.to);
      io.to(data.to).emit("negotiation-done", {
        answer: data.answer,
        from: socket.id,
      });
    }
  );
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
