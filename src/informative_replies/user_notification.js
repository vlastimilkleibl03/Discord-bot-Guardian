import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions'


/**
 * Sends an informative message to user about invoked action.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} description Content of the message.
 * @param {boolean} hidden Sign if message is visible only for the author.
 */
export function replyInformation(res, description, hidden=false) {
    const messageData = { content: description };
    if (hidden) {
        messageData.flags = InteractionResponseFlags.EPHEMERAL
    }

    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: messageData
    });
}

/**
 * Sends an informative message to user and logs the caused error.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} err Error object, that is logged to a console.
 * @param {any} description Content of the message.
 */
export function errorInformation(res, err, description) {
    console.error(err);
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: description,
            flags: InteractionResponseFlags.EPHEMERAL
        }
    });
}

/**
 * Sends an informative message to user about insufficient permissions.
 * @param {any} res Object allowing to send a response for a http request.
 */
export function permissionReply(res) {
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: 'You do not have persmission for this action.',
            flags: InteractionResponseFlags.EPHEMERAL
        } 
    });
}
