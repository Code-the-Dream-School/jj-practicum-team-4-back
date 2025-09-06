const { PORT = 8000 } = process.env;
const app = require("./app");

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SESSION_SECRET) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const listener = () => console.log(`Listening on Port ${PORT}!`);
app.listen(PORT, listener);
