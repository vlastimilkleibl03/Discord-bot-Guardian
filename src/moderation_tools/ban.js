import {
    getOption, issueBan,
    sendMessageToChannel, getUserMessageChannel,
    fetchUser, fetchGuild
} from '#src/utils.js';
import {
    permissionReply, errorInformation,
    replyInformation
} from '#src/informative_replies/user_notification.js';
import { setActiveBan, setBanRecord, getBanInfoChannel } from './moderation_repository.js'


/**
 * Temporarily bans an user in guild.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked the command, user for permission check and information.
 * @param {any} guildId Id of guild where user will be banned.
 * @param {any} parameters Raw command parameters.
 */
export async function banUser(res, sender, guildId, parameters) {
    if (!hasBanPermission(sender)) {
        return permissionReply(res);
    }

    try {
        // Get parameters from command and set unban date
        const bannedUserId = getOption(parameters, 'user_select');
        const banReason = getOption(parameters, 'ban_reason');

        const bannedDays = getOption(parameters, 'ban_length_days');
        const unbanDate = new Date();
        unbanDate.setDate(unbanDate.getDate() + bannedDays);

        // Send informative messages
        const userMessageChannel = await getUserMessageChannel(bannedUserId);
        const adminMessageChannel = await getBanInfoChannel(guildId);

        const adminMessage = await buildAdminBanMessage(sender, bannedUserId, unbanDate, banReason);
        const userMessage = await buildUserBanMessage(guildId, unbanDate, banReason);

        await sendMessageToChannel(userMessageChannel, userMessage);
        await sendMessageToChannel(adminMessageChannel, adminMessage);

        // Ban user and set record
        await issueBan(bannedUserId, guildId);

        await setActiveBan(bannedUserId, guildId, unbanDate);
        await setBanRecord(bannedUserId, guildId, new Date(), unbanDate, banReason);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to ban an user.');
    }

    return replyInformation(res, 'User banned.', true);
}

function hasBanPermission(guildMember) {
    const permissions = BigInt(guildMember.permissions);
    const BAN_USERS = 1n << 2n;
    const ADMINISTRATOR = 1n << 3n;

    return (permissions & ADMINISTRATOR) !== 0n || (permissions & BAN_USERS) !== 0n;
}

async function buildAdminBanMessage(moderator, bannedUserId, unbanDate, banReason) {
    let bannedUserName;
    try {
        const bannedUser = await fetchUser(bannedUserId);
        bannedUserName = bannedUser.username;
    }
    catch (err) {
        console.error(err);
        bannedUserName = 'Unknown user';
    }

    return {
        embeds: [
            {
                title: 'Ban',
                fields: [
                    {
                        name: 'Banned user',
                        value: bannedUserName,
                        inline: true
                    },
                    {
                        name: 'Banned by',
                        value: moderator.user.username
                    },
                    {
                        name: 'Ban reason',
                        value: banReason
                    },
                    {
                        name: 'Banned to:',
                        value: unbanDate.toISOString()
                    }
                ],
                timestamp: new Date().toISOString()
            }
        ],
    }
}

async function buildUserBanMessage(guildId, unbanDate, banReason) {
    let bannedGuildName;
    try {
        const bannedGuild = await fetchGuild(guildId);
        bannedGuildName = bannedGuild.name;
    }
    catch (err) {
        console.error(err);
        bannedGuildName = 'Unknown server';
    }

    return {
        embeds: [
            {
                title: 'Ban',
                fields: [
                    {
                        name: 'Banned in server',
                        value: bannedGuildName
                    },
                    {
                        name: 'Ban reason',
                        value: banReason
                    },
                    {
                        name: 'Banned to:',
                        value: unbanDate.toISOString()
                    }
                ],
                timestamp: new Date().toISOString()
            }
        ],
    }
}