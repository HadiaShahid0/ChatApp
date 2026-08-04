import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../config/db.js";
import routes from "./routes/index.js";
import socketHelper from "./utils/socketHelper.js";
import path from "path";
dotenv.config();
const app = express();

const server = http.createServer(app);

const io = socketHelper(server);
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

connectDB();

routes(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
