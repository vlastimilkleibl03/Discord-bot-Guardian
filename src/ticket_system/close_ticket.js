import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions'
import { getUserMessageChannel, sendMessageWithReference, removeButtonsFromMessage } from '#src/utils.js';
import { getTicketByUser, getTicketByGuild, getGuildTicketChannel } from './database.js';


/**
 * Closes an opened ticket between admin and user side.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} messageId Id of message from which interaction was triggered.
 * @param {any} relationId Represents userId or guildId depending on userInitiated value.
 * @param {any} userInitiated Determines whether interaction was triggered by user or admin.
 */
export async function closeTicket(res, messageId, relationId, userInitiated) {
    const ticket = userInitiated ? getTicketByUser(relationId, messageId) : getTicketByGuild(relationId, messageId);
    const userMessageChannel = await getUserMessageChannel(ticket.user);
    const adminChannel = getGuildTicketChannel(ticket.guild);

    // TODO delete from database

    try {
        // Remove buttons
        await removeButtonsFromMessage(ticket.adminMessage, adminChannel);
        await removeButtonsFromMessage(ticket.userMessage, userMessageChannel);

        // Send ticket closed message
        const message = {
            embeds: [
                {
                    title: 'Ticket closed' + (userInitiated ? ' by user' : ' by admin')
                }
            ]
        }
        // To admin channel
        await sendMessageWithReference(adminChannel, message, ticket.adminMessage);
        // To user
        await sendMessageWithReference(userMessageChannel, message, ticket.userMessage);
    }
    catch (err) {
        console.error(err);

        // User is informed about the error
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Ticket closing failed.',
                flags: InteractionResponseFlags.EPHEMERAL
            }
        });
    }

    return res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
    });
}
