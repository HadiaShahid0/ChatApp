import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../config/db.js";
import routes from "./routes/index.js";
import socketHelper from "./utils/socketHelper.js";

dotenv.config();
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));

routes(app);

socketHelper(io);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (error) {
    console.log(error.message);
  }
};

startServer();
