require("dotenv").config();
require("./auth");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const connectDB = require("./db/connect");
const cors = require("cors");
const favicon = require("express-favicon");
const logger = require("morgan");
const cron = require("node-cron");
const { runPromptSync } = require("../src/controllers/promptController.js");

//MongoDB

connectDB(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

//Passport Inialization
app.use(passport.initialize());
app.use(passport.session());

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/favicon.ico"));

//Routers
const mainRouter = require("./routes/mainRouter.js");
const authRouter = require("./routes/authRouter.js");
const promptRouter = require("./routes/promptRouter");
const imageRouter = require("./routes/imageRouter");

//Routes
app.use("/api", mainRouter);
app.use("/api/prompts", promptRouter);
app.use("/auth", authRouter);
app.use('/images', imageRouter);

//CRON scheduler

if (process.env.ENABLE_CRON === "true") {
  //once a week: Sunday 00:05 UTC  -> 5 0 * * 0 ("* * * * *" - for test only)
  cron.schedule(
    "5 0 * * 0",
    async () => {
      try {
        const result = await runPromptSync();
        console.log("[CRON] weekly sync done:", JSON.stringify(result));
      } catch (e) {
        console.error("[CRON] weekly sync failed:", e?.message || e);
      }
    },
    { timezone: "Etc/UTC" }
  );

  console.log("[CRON] registered: Sun 00:05 UTC");
}

module.exports = app;
