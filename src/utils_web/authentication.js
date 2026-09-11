import { config } from '#src/config.js';
import { fetchBotGuilds } from '#src/utils.js';
import { hasModifyPermission } from '#src/permissions/permission_check.js';


/**
 * Fetches user account details from discord using authorization code.
 * @param {string} code Authorization code provided in discord auth callback.
 * @returns Object with user details.
 */
export async function authenticateDiscordUser(code) {
    // Get access code for user information
    const accessToken = await fetchAccessToken(code);

    // Fetch details about user
    const user = await getUserDetails(accessToken);
    const userGuilds = await getUserGuilds(accessToken);

    // Fetch server where bot is joined
    const botGuilds = await fetchBotGuilds();
    const botGuildsIds = botGuilds.map(guild => guild.id);

    // Common servers with bots and suitable user permissions are saved
    user.guilds = userGuilds.filter(guild => botGuildsIds.includes(guild.id) && hasModifyPermission(guild));

    return user;
}

async function fetchAccessToken(code) {
    const tokenResponse = await fetch(
        'https://discord.com/api/oauth2/token',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: config.APP_ID,
                client_secret: config.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.REDIRECT_URI,
            }),
        }
    );
    if (!tokenResponse.ok) {
        console.error(await tokenResponse.text());
        throw new Error('Unable to get Discord token.')
    }
    const tokens = await tokenResponse.json();
    return tokens.access_token;
}

async function getUserDetails(accessToken) {
    const userResponse = await fetch(
        'https://discord.com/api/users/@me',
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );
    if (!userResponse.ok) {
        throw new Error('Unable to load user details.');
    }

    return await userResponse.json();
}

async function getUserGuilds(accessToken) {
    const response = await fetch(
        'https://discord.com/api/v10/users/@me/guilds',
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch user guilds');
    }

    return await response.json();
}
