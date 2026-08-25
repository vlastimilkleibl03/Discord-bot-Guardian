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
 * Fetches and return a message that was sent in given channel.
 * @param {any} messageId Id of message.
 * @param {any} channelId Id of channel, where message is posted.
 * @returns Body of fetched message.
 */
export async function fetchMessage(messageId, channelId) {
    const endpoint = 'channels/' + channelId + '/messages/' + messageId;
    try {
        const response = await DiscordRequest(endpoint, { method: 'GET' });
        const message = await response.json();
        return message;
    }
    catch (err) {
        console.error(err);
        throw new Error('Failed to fetch a message: ' + messageId + ' from channel with id: ' + channelId);
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
 * Sends a message that references another message in channel.
 * @param {any} channelId Id of channel where message is send.
 * @param {any} message Message to send.
 * @param {any} referenceId Id of message that is referenced, must be in same channel.
 * @returns Id of sent message.
 */
export async function sendMessageWithReference(channelId, message, referenceId) {
    message.message_reference = {
        message_id: referenceId,
        channel_id: channelId
    }
    const messageId = await sendMessageToChannel(channelId, message);
    return messageId;
}

/**
 * Sends a message to a given user through a DM.
 * @param {any} userId Id of user.
 * @returns Id of dm channel to user.
 */
export async function getUserMessageChannel(userId) {
    const endpoint = 'users/@me/channels';
    let channel;

    try {
        const response = await DiscordRequest(endpoint, { method: 'POST', body: { recipient_id: userId }});
        channel = await response.json();
        return channel.id;
    }
    catch (err) {
        console.error(err);
        throw new Error('Failed to get channel id for dm with user: ' + userId);
    }
}


/**
 * Replaces the whole message body with a new given.
 * @param {any} messageId Id of message that should be modified.
 * @param {any} channelId Id of channel where message is posted.
 * @param {any} newMessageContent New message body.
 */
export async function editMessage(messageId, channelId, newMessageContent) {
    const endpoint = 'channels/' + channelId + '/messages/' + messageId;

    try {
        return DiscordRequest(endpoint, { method: 'PATCH', body: newMessageContent });
    } catch (err) {
        console.error(err);
        throw new Error('Failed to send a message to a channel with id: ' + channelId);
    }
}

/**
 * Modifies already posted message so it contains no interactive buttons.
 * @param {any} messageId Id of modified message.
 * @param {any} channelId Id of channel where message was send.
 */
export async function removeButtonsFromMessage(messageId, channelId) {
    const endpoint = 'channels/' + channelId + '/messages/' + messageId;

    try {
        await DiscordRequest(endpoint, { method: 'PATCH', body: { components: [] } });
    }
    catch (err) {
        console.log(err);
        throw new Error('Failed to remove buttons from message: ' + messageId + ' in channel: ' + channelId);
    }
}


// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getOption(data, name) {
    return data.options?.find(option => option.name === name)?.value;
}
