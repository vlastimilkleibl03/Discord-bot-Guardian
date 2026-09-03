import { Client, GatewayIntentBits } from 'discord.js';
import { guildJoin } from './joinGuild.js';
import { userJoin } from './userGuildJoin.js';


/**
 * Discord gateway used for realtime updates and events.
 */
export const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});


// EVENT HANDLERS

// Adding bot to a server
discordClient.on('guildCreate', async (guild) => {
    await guildJoin(guild);
});

// User joins a server
discordClient.on('guildMemberAdd', async (member) => {
    await userJoin(member);
});
