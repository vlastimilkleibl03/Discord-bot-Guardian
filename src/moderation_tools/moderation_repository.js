import { db } from '#src/database/index.js';


export const INFO_CHANNEL_TYPES = {
    BAN: 'ban',
    KICK: 'kick',
    MUTE: 'mute',
}


// ACTIVE BANS

/**
 * Creates a new active ban record in database.
 * @param {any} userId Id of banned user.
 * @param {any} guildId Id of guild where user is banned.
 * @param {any} unbanDate Scheduled date for unban.
 */
export async function setActiveBan(userId, guildId, unbanDate) {
    await db.activeBan.create({
        data: {
            guildId,
            userId,
            unbanDate
        }
    });
}


// MODERATION RECORDS

/**
 * Saves details about issued ban to database.
 * @param {any} userId Id of banned user.
 * @param {any} guildId Id of guild where user is banned.
 * @param {any} bannedFrom Date of ban.
 * @param {any} bannedTo Scheduled date for unban.
 * @param {any} reason Ban reason.
 */
export async function setBanRecord(userId, guildId, bannedFrom, bannedTo, reason) {
    await db.banRecord.create({
        data: {
            userId,
            guildId,
            banDate: bannedFrom,
            unbanDate: bannedTo,
            reason
        }
    });
}


// INFORMATION CHANNELS

/**
 * Saves a new channel or modifies existing for given action type in guild.
 * @param {any} guildId Id of affected guild.
 * @param {any} channelId Id of channel with modified type.
 * @param {any} type Type of information.
 */
export async function saveInfoChannelData(guildId, channelId, type) {
    await db.infoChannel.upsert({
        where: { guildId_type: { guildId, type } },
        create: { guildId, channelId, type },
        update: { channelId: channelId }
    });
}

/**
 * Returns all information type channels for given guild.
 * @param {any} guildId Id of given guild.
 * @returns Array of objects with info type and channelId.
 */
export async function getGuildInfoChannels(guildId) {
    const result = await db.infoChannel.findMany({
        where: {
            guildId
        }
    })

    return result;
}

/**
 * Returns a channel where informational messages about bans are sent in server.
 * @param {any} guildId Id of given server.
 * @returns Id of channel set for guild.
 */
export async function getBanInfoChannel(guildId) {
    const result = await db.infoChannel.findFirst({
        where: {
            guildId,
            type: INFO_CHANNEL_TYPES.BAN
        }
    });

    return result?.channelId;
}
