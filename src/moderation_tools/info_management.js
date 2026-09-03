import { fetchGuild, fetchUser } from '#src/utils.js'
import {
    saveInfoChannelData, INFO_CHANNEL_TYPES,
    getUserBans, getUserKicks, getUserMutes,
} from './moderation_repository.js';
import {
    errorInformation, replyInformation,
    permissionReply, replyEmbed
} from '#src/informative_replies/user_notification.js';
import { hasModifyPermission, hasDisplayRecordPermission } from '#src/permissions/permission_check.js';


/**
 * Modifies the channel for sending information about moderation actions.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked this command, needed for permission check.
 * @param {any} guildId Id of discord server where command was invoked.
 * @param {any} type Type of moderation action (ban, kick...).
 * @param {any} channelId Id channel in guild where to send the information.
 */
export async function modifyInfoChannel(res, sender, guildId, type, channelId) {
    // Check permissions and correct moderation type
    if (!hasModifyPermission(sender)) {
        return permissionReply(res);
    }
    if (!Object.values(INFO_CHANNEL_TYPES).includes(type)) {
        return replyInformation(res, 'Can not change a channel for not existing moderation type.', true);
    }

    // Modify info channel
    try {
        await saveInfoChannelData(guildId, channelId, type);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to modify moderation info channel.');
    }

    return replyInformation(res, 'Successfully modified info channel for moderation type: ' + type);
}

/**
 * Fetches and returns a public guild name.
 * @param {any} guildId Id of searched guild.
 * @returns Name of guild or Unknown server if error occured.
 */
export async function getGuildName(guildId) {
    try {
        const guild = await fetchGuild(guildId);
        return guild.name;
    }
    catch (err) {
        console.error(err);
        return 'Unknown server';
    }
}

/**
 * Fetches and returns a public username.
 * @param {any} userId Id of searched user.
 * @returns Name of user or Unknown user if error occured.
 */
export async function getUserName(userId) {
    try {
        const user = await fetchUser(userId);
        return user.username;
    }
    catch (err) {
        console.error(err);
        return 'Unknown user';
    }
}

/**
 * Loads all moderation action records about user from a database and prints them to a user.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked this command, needed for permission check.
 * @param {any} guildId Id of discord server where command was invoked.
 * @param {any} userId Id of user which records will be shown.
 */
export async function displayUserRecords(res, sender, guildId, userId) {
    if (!hasDisplayRecordPermission(sender, userId)) {
        return permissionReply(res);
    }

    const userName = await getUserName(userId);

    try {
        const bans = await getUserBans(userId, guildId);
        const kicks = await getUserKicks(userId, guildId);
        const mutes = await getUserMutes(userId, guildId);
        
        const embed = buildUserRecordEmbed(userName, bans, kicks, mutes);
        return replyEmbed(res, [embed]);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to load user records.');
    }
}

/**
 * Constructs embed object for messages containing moderation information.
 * @param {any} userName Name of the user with records.
 * @param {any} bans Array of user recorded bans.
 * @param {any} kicks Array of user recorded kicks.
 * @param {any} mutes Array of user recorded mutes.
 * @returns One embed object for an embeds message field.
 */
export function buildUserRecordEmbed(userName, bans, kicks, mutes) {
    const banField = bans.map(
        ban => 'From: ' + ban.banDate.toISOString() + ' to: ' + ban.unbanDate.toISOString() + ' reason: ' + ban.reason
    ).join('\n');
    const kickField = kicks.map(
        kick => 'Date: ' + kick.kickDate.toISOString() + ' reason: ' + kick.reason
    ).join('\n');
    const muteField = mutes.map(
        mute => 'Date: ' + mute.muteDate.toISOString() + ' for: ' + mute.length + ' hours reason: ' + mute.reason
    ).join('\n');

    return {
        title: 'User records',
        fields: [
            {
                name: 'User:',
                value: userName
            },
            {
                name: 'Bans:',
                value: banField || 'no record',
            },
            {
                name: 'Kicks:',
                value: kickField || 'no record'
            },
            {
                name: 'Mutes:',
                value: muteField || 'no record'
            }
        ],
        timestamp: new Date().toISOString()
    }
}
