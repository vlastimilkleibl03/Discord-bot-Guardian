import { Client, GatewayIntentBits } from 'discord.js';
import { guildJoin } from './joinGuild.js';


/**
 * Discord gateway used for realtime updates and events.
 */
export const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds]
});


// EVENT HANDLERS

// Adding bot to a server
discordClient.on('guildCreate', async (guild) => {
    await guildJoin(guild);
});
