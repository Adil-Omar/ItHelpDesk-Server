import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./lib/supabase.js";
import allRoutes from "./routes/index.js"
import { authVerify } from "./middleware/authVerify.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())

app.use("/api", allRoutes)

app.get("/authVerify", authVerify)


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app