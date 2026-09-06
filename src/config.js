import 'dotenv/config'


// Load values from env and check their existence
const APP_ID = process.env.APP_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const PORT = process.env.PORT

if (!APP_ID || !DISCORD_TOKEN || !PUBLIC_KEY || !REDIRECT_URI || !SESSION_SECRET || !CLIENT_SECRET) {
    throw new Error('Missing env values.');
}

export const config = {
    APP_ID,
    DISCORD_TOKEN,
    PUBLIC_KEY,
    REDIRECT_URI,
    SESSION_SECRET,
    CLIENT_SECRET,
    PORT
}
