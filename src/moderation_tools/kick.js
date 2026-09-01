import {
    getOption, performKick,
    sendMessageToChannel, getUserMessageChannel,
    fetchUser, fetchGuild
} from '#src/utils.js';
import {
    permissionReply, errorInformation,
    replyInformation
} from '#src/informative_replies/user_notification.js';
import { hasKickPermission } from '#src/permissions/permission_check.js';
import { setKickRecord, getKickInfoChannel } from './moderation_repository.js'


/**
 * Temporarily bans an user in guild.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked the command, user for permission check and information.
 * @param {any} guildId Id of guild where user will be kicked.
 * @param {any} parameters Raw command parameters.
 */
export async function kickUser(res, sender, guildId, parameters) {
    if (!hasKickPermission(sender)) {
        return permissionReply(res);
    }

    try {
        const kickedUserId = getOption(parameters, 'user_select');
        const kickReason = getOption(parameters, 'kick_reason');

        // Send informative messages
        const userMessageChannel = await getUserMessageChannel(kickedUserId);
        const adminMessageChannel = await getKickInfoChannel(guildId);

        const adminMessage = await buildAdminKickMessage(sender, kickedUserId, kickReason);
        const userMessage = await buildUserKickMessage(guildId, kickReason);

        await sendMessageToChannel(userMessageChannel, userMessage);
        await sendMessageToChannel(adminMessageChannel, adminMessage);

        // Kick user and set record
        await performKick(kickedUserId, guildId);
        await setKickRecord(kickedUserId, guildId, new Date(), kickReason);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to kick an user.');
    }

    return replyInformation(res, 'User kicked.', true);
}


async function buildAdminKickMessage(moderator, kickedUserId, kickReason) {
    let kickedUserName;
    try {
        const kickedUser = await fetchUser(kickedUserId);
        kickedUserName = kickedUser.username;
    }
    catch (err) {
        console.error(err);
        kickedUserName = 'Unknown user';
    }

    return {
        embeds: [
            {
                title: 'Kick',
                fields: [
                    {
                        name: 'Kicked user',
                        value: kickedUserName,
                        inline: true
                    },
                    {
                        name: 'Kicked by',
                        value: moderator.user.username
                    },
                    {
                        name: 'Kick reason',
                        value: kickReason
                    },
                ],
                timestamp: new Date().toISOString()
            }
        ],
    }
}

async function buildUserKickMessage(guildId, kickReason) {
    let kickedGuildName;
    try {
        const kickedGuild = await fetchGuild(guildId);
        kickedGuildName = kickedGuild.name;
    }
    catch (err) {
        console.error(err);
        kickedGuildName = 'Unknown server';
    }

    return {
        embeds: [
            {
                title: 'Kick',
                fields: [
                    {
                        name: 'Kicked from server',
                        value: kickedGuildName
                    },
                    {
                        name: 'Kick reason',
                        value: kickReason
                    }
                ],
                timestamp: new Date().toISOString()
            }
        ],
    }
}
