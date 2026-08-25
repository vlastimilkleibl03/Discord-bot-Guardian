import { InteractionResponseType } from 'discord-interactions'
import { getUserMessageChannel, sendMessageWithReference, removeButtonsFromMessage } from '#src/utils.js';
import { errorInformation } from '#src/informative_replies/user_notification.js';
import { getTicketByUser, getTicketByGuild, getGuildTicketChannel, deleteTicket } from './ticket_repository.js';


/**
 * Closes an opened ticket between admin and user side.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} messageId Id of message from which interaction was triggered.
 * @param {any} relationId Represents userId or guildId depending on userInitiated value.
 * @param {any} userInitiated Determines whether interaction was triggered by user or admin.
 */
export async function closeTicket(res, messageId, relationId, userInitiated) {
    try {
        // Find ticket in database
        const ticket = userInitiated
            ? await getTicketByUser(relationId, messageId)
            : await getTicketByGuild(relationId, messageId);
        if (!ticket) {
            throw new Error('Ticket is not in database.');
        }

        // Get coresponding channels
        const userMessageChannel = await getUserMessageChannel(ticket.userId);
        const adminChannel = await getGuildTicketChannel(ticket.guildId, ticket.category);

        // Delete ticket from database
        await deleteTicket(ticket.id);

        // Remove buttons
        await removeButtonsFromMessage(ticket.adminMessageId, adminChannel);
        await removeButtonsFromMessage(ticket.userMessageId, userMessageChannel);

        // Send ticket closed message
        const message = {
            embeds: [
                {
                    title: 'Ticket closed' + (userInitiated ? ' by user' : ' by admin')
                }
            ]
        }
        // To admin channel
        await sendMessageWithReference(adminChannel, message, ticket.adminMessageId);
        // To user
        await sendMessageWithReference(userMessageChannel, message, ticket.userMessageId);
    }
    catch (err) {
        return errorInformation(res, err, 'Ticket closing failed.');
    }

    return res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
    });
}
