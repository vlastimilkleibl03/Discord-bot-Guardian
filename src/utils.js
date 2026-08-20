import 'dotenv/config';

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'Discord bot Guardian (https://github.com/vlastimilkleibl03/Discord-bot-Guardian)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}


/**
 * Sends a message to a given channel or throws an error when not successfull.
 * @param {any} channelId Id of given channel.
 * @param {any} message Message to send.
 * @returns Id of sent message.
 */
export async function sendMessageToChannel(channelId, message) {
    const endpoint = 'channels/' + channelId + '/messages';

    try {
        const response = await DiscordRequest(endpoint, { method: 'POST', body: message });
        const data = await response.json();
        return data.id
    } catch (err) {
        console.error(err);
        throw new Error('Failed to send a message to a channel with id: ' + channelId);
    }
}

/**
 * Sends a message to a given user through a DM.
 * @param {any} userId Id of user.
 * @param {any} message Message to send.
 * @returns Id of sent message.
 */
export async function sendMessageToUser(userId, message) {
    const endpoint = 'users/@me/channels';
    let channel;

    try {
        const response = await DiscordRequest(endpoint, { method: 'POST', body: { recipient_id: userId }});
        channel = await response.json();
    }
    catch (err) {
        console.error(err);
        throw new Error('Failed to get channel id for dm with user: ' + userId);
    }

    return await sendMessageToChannel(channel.id, message);
}


// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
