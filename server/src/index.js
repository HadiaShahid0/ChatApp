import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../config/db.js";
import routes from "./routes/index.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(express.json());

app.use(cookieParser());
connectDB();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
routes(app);
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
export default app;
