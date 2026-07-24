const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { errorMiddleware } = require("./errors/error");
const authRouter = require("./routes/authRoute");
const homeRouter = require("./routes/homeRoute");
const cookieParser = require("cookie-parser");
const allowanceRoute = require("./routes/allowanceRoute");
const calendarRoute = require("./routes/calendarRoute");
const planningRoute = require("./routes/planningRoute");
const expensesRoute = require("./routes/expensesRoute");
const goalRoute = require("./routes/goalRoute");
const behaviorProfileRoute = require("./routes/behaviorProfileRoute");
const onboardingRoute = require("./routes/onboardingRoute");
const chatbotRoute = require("./routes/chatbotRoute");
const shareRoute = require("./routes/shareRoutes");
require("./cron/parentReportCron");

dotenv.config({ path: "./config/config.env" });

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/home", homeRouter);
app.use("/api/allowance", allowanceRoute);
app.use("/api/calendar", calendarRoute);
app.use("/api/planning", planningRoute);
app.use("/api/expenses", expensesRoute);
app.use("/api/goal", goalRoute);
app.use("/api/profile", behaviorProfileRoute);
app.use("/api/onboarding", onboardingRoute);
app.use("/api/chat", chatbotRoute);
app.use("/api/share", shareRoute);

app.use(errorMiddleware);

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "MonthEnd",
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is connected!" });
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on ${process.env.PORT}`);
});