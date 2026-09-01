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
    await db.activeBan.upsert({
        where: { guildId_userId: { guildId, userId } },
        create: { guildId, userId, unbanDate },
        update: { unbanDate }
    });
}

/**
 * Returns all ban info objects that expired to given date.
 * @param {any} toDate Bordeline date for bans expiration.
 * @returns Array of expired bans.
 */
export async function getExpiredBans(toDate) {
    const result = await db.activeBan.findMany({
        where: {
            unbanDate: {
                lt: toDate
            }
        }
    });

    return result;
}

/**
 * Removes an active ban record from a database.
 * @param {any} guildId Id of given where ban is removes.
 * @param {any} userId Id of banned user.
 */
export async function removeActiveBan(guildId, userId) {
    await db.activeBan.delete({
        where: {
            guildId_userId: {guildId, userId}
        }
    })
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

/**
 * Saves details about user kick to database.
 * @param {any} userId Id of kicked user.
 * @param {any} guildId Id of guild where user was kicked out.
 * @param {any} date DateTime of kick.
 * @param {any} reason Kick reason.
 */
export async function setKickRecord(userId, guildId, date, reason) {
    await db.kickRecord.create({
        data: {
            userId,
            guildId,
            kickDate: date,
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
    });

    return result;
}

/**
 * Returns a channel where informational messages about bans are sent in server.
 * @param {any} guildId Id of given server.
 * @returns Id of channel set for guild.
 */
export async function getBanInfoChannel(guildId) {
    return await getInfoChannel(guildId, INFO_CHANNEL_TYPES.BAN);
}

/**
 * Returns a channel where informational messages about kicks are sent in server.
 * @param {any} guildId Id of given server.
 * @returns Id of channel set for guild.
 */
export async function getKickInfoChannel(guildId) {
    return await getInfoChannel(guildId, INFO_CHANNEL_TYPES.KICK);
}

async function getInfoChannel(guildId, type) {
    const result = await db.infoChannel.findFirst({
        where: {
            guildId,
            type: type
        }
    });

    return result?.channelId;
}
