require("dotenv").config();
const { PORT = 8000 } = process.env;
const app = require("./app");

const { connectDB } = require("./db/mongoose");
const { initModels } = require("./models/init");

async function startServer() {
    try {
        await connectDB();
        await initModels();

        app.listen(PORT, () => {

console.log(`Listening on Port ${PORT}!`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
}
startServer();