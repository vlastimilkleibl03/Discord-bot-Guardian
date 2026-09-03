import { sendMessageToChannel } from '#src/utils.js';
import {
    getUserJoinInfoChannel, getUserBans,
    getUserKicks, getUserMutes,
} from '#src/moderation_tools/moderation_repository.js';
import { buildUserRecordEmbed } from '#src/moderation_tools/info_management.js';


/**
 * Provides operations that is executed when new user joins on a server.
 * @param {any} member Guild member object representing new joined user.
 */
export async function userJoin(member) {
    const user = member.user;
    const guildId = member.guild.id;

    await sendUserPreviousRecords(guildId, user);
}


/**
 * Sends a message displaying all previous user moderation records.
 * @param {any} guildId Id of new joined server.
 * @param {any} user User object in server.
 */
async function sendUserPreviousRecords(guildId, user) {
    try {
        const channelId = await getUserJoinInfoChannel(guildId);
        const userName = user.username;
        const bans = await getUserBans(user.id, guildId);
        const kicks = await getUserKicks(user.id, guildId);
        const mutes = await getUserMutes(user.id, guildId);

        const embed = buildUserRecordEmbed(userName, bans, kicks, mutes);
        await sendMessageToChannel(channelId, { embeds: [embed] });
    }
    catch (err) {
        console.error('Failed to print user previous records, caused by: ' + err);
    }
}
