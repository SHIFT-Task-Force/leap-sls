const express = require("express");
const morgan = require("morgan");

const { ping } = require("./controllers/ping");
const { error } = require("./controllers/error");
const ruleRouter = require("./routes/rules");

const SLS = require("./controllers/sls");

const app = express();

//trust proxy
app.set("trust proxy", true);

//middlewares
process.env.NODE_ENV === "production" || app.use(morgan("dev"));
app.use(express.json({ type: "application/json" }));

//routes
app.get("/ping", ping);

app.post("/fhir/sls", SLS.post);

app.use("/rules", ruleRouter);

app.use(error);

module.exports = {
  app
};
