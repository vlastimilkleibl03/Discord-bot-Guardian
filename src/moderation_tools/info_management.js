import { saveInfoChannelData, INFO_CHANNEL_TYPES } from './moderation_repository.js';
import {
    errorInformation, replyInformation,
    permissionReply
} from '#src/informative_replies/user_notification.js';
import { hasModifyPermission } from '#src/permissions/permission_check.js';


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
