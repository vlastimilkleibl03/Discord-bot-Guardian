import {
    getOption, setMuteInGuild,
    sendMessageToChannel, getUserMessageChannel,
} from '#src/utils.js';
import {
    permissionReply, errorInformation,
    replyInformation
} from '#src/informative_replies/user_notification.js';
import { hasMutePermission } from '#src/permissions/permission_check.js';
import { setMuteRecord, getMuteInfoChannel } from './moderation_repository.js';
import { getGuildName, getUserName } from './info_management.js';


/**
 * Temporarily mutes a user in guild.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked the command, used for permission check and information.
 * @param {any} guildId Id of guild where user will be muted.
 * @param {any} parameters Raw command parameters.
 */
export async function muteUser(res, sender, guildId, parameters) {
    if (!hasMutePermission(sender)) {
        return permissionReply(res);
    }

    try {
        const mutedUserId = getOption(parameters, 'user_select');
        const muteReason = getOption(parameters, 'mute_reason');
        const muteLength = getOption(parameters, 'mute_length_hours');

        // Send informative messages
        const userMessageChannel = await getUserMessageChannel(mutedUserId);
        const adminMessageChannel = await getMuteInfoChannel(guildId);

        const adminMessage = await buildAdminMuteMessage(sender, mutedUserId, muteReason, muteLength);
        const userMessage = await buildUserMuteMessage(guildId, muteReason, muteLength);

        await sendMessageToChannel(userMessageChannel, userMessage);
        await sendMessageToChannel(adminMessageChannel, adminMessage);

        // Mute user and set record
        await setMuteInGuild(mutedUserId, guildId, muteLength);
        await setMuteRecord(mutedUserId, guildId, new Date(), muteLength, muteReason);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to mute a user.');
    }

    return replyInformation(res, 'User was muted.', true);
}


async function buildAdminMuteMessage(moderator, mutedUserId, muteReason, muteLength) {
    const mutedUserName = await getUserName(mutedUserId);

    return {
        embeds: [
            {
                title: 'Mute',
                fields: [
                    {
                        name: 'Muted user',
                        value: mutedUserName,
                        inline: true
                    },
                    {
                        name: 'Muted by',
                        value: moderator.user.username
                    },
                    {
                        name: 'Mute reason',
                        value: muteReason
                    },
                    {
                        name: 'Muted for next:',
                        value: muteLength + ' hours'
                    }
                ],
                timestamp: new Date().toISOString()
            }
        ],
    }
}

async function buildUserMuteMessage(guildId, muteReason, muteLength) {
    const mutedGuildName = await getGuildName(guildId);

    return {
        embeds: [
            {
                title: 'Mute',
                fields: [
                    {
                        name: 'Muted in server',
                        value: mutedGuildName
                    },
                    {
                        name: 'Mute reason',
                        value: muteReason
                    },
                    {
                        name: 'Muted for next:',
                        value: muteLength + ' hours'
                    }
                ],
                timestamp: new Date().toISOString()
            }
        ],
    }
}
