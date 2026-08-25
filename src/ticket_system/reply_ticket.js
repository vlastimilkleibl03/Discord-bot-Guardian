import {
    MessageComponentTypes, InteractionResponseType,
    ButtonStyleTypes
} from 'discord-interactions';
import {
    sendMessageWithReference,
    removeButtonsFromMessage,
    getUserMessageChannel,
    fetchMessage,
    editMessage
} from '#src/utils.js'
import { errorInformation } from '#src/informative_replies/user_notification.js';
import {
    getTicketByGuild, getTicketByUser,
    getGuildTicketChannel, updateTicketMessages
} from './ticket_repository.js'


const REPLY_TEXT_ID = 'reply_text'

/**
 * Creates and displays a modal window for replying to an open ticket.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} role Determinizes if user or server admin is interacting.
 * @param {any} message Message that invoked the command, used for future identification.
 */
export function displayReplyModal(res, role, message) {
    return res.send({
        type: InteractionResponseType.MODAL,
        data: {
            custom_id: 'ticket_reply_' + role + ':' + message.id,
            title: 'Reply to a ticket',
            components: [
                {
                    type: MessageComponentTypes.LABEL,
                    label: 'Your reply:',
                    component: {
                        type: MessageComponentTypes.INPUT_TEXT,
                        custom_id: REPLY_TEXT_ID,
                        style: 2,
                        required: true
                    }
                }
            ]
        }
    });
}


/**
 * Processes a data sent by admin through a ticket reply modal window. 
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} replyFormComponents Components of the ticket modal window.
 * @param {any} referenceId Id of last message regarding the open ticket.
 * @param {any} guild Discord server where reply was sent.
 */
export async function processReplyAdmin(res, replyFormComponents, referenceId, guild) {
    try {
        // Find ticket in database and get channels
        const ticket = await getTicketByGuild(guild.id, referenceId);
        if (!ticket) {
            throw new Error('Ticket not found in database.')
        }

        const adminChannel = await getGuildTicketChannel(ticket.guildId, ticket.category);
        const userChannel = await getUserMessageChannel(ticket.userId)

        // Set which message will be edited and where a new one will be sent
        const interactive = { channel: userChannel, reference: ticket.userMessageId };
        const update = { channel: adminChannel, reference: ticket.adminMessageId }

        // Process the reply by editing/sendind messages and update database
        const updateId = await processReply(replyFormComponents, interactive, update, 'user', 'admin');
        await updateTicketMessages(ticket.id, ticket.adminMessageId, updateId);

    }
    catch (err) {
        return errorInformation(res, err, 'Something went wrong while replying to ticket.');
    }

    return res.send({
        type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE
    })
}

/**
 * Processes a data sent by user through a ticket reply modal window. 
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} replyFormComponents Components of the ticket modal window.
 * @param {any} referenceId Id of last message regarding the open ticket.
 * @param {any} user User who replied to a ticket.
 */
export async function processReplyUser(res, replyFormComponents, referenceId, user) {
    try {
        // Find ticket in database and get channels
        const ticket = await getTicketByUser(user.id, referenceId);
        if (!ticket) {
            throw new Error('Ticket not found in database.')
        }

        const adminChannel = await getGuildTicketChannel(ticket.guildId, ticket.category);
        const userChannel = await getUserMessageChannel(ticket.userId)

        // Set which message will be edited and where a new one will be sent
        const interactive = { channel: adminChannel, reference: ticket.adminMessageId };
        const update = { channel: userChannel, reference: ticket.userMessageId }

        // Process the reply by editing/sendind messages and update database
        const updateId = await processReply(replyFormComponents, interactive, update, 'admin', 'user');
        await updateTicketMessages(ticket.id, updateId, ticket.userMessageId);

    }
    catch (err) {
        return errorInformation(res, err, 'Something went wrong while replying to ticket.');
    }

    return res.send({
        type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE
    })
}


/**
 * Sends messages and update the old to contain no buttons.
 * @param {any} replyFormComponents Components of the ticket modal window.
 * @param {any} interactive Object containing channelId and messageId where interactive reply will be sent.
 * @param {any} update Object containing channelId and messageId where reply will be edited to old message.
 * @param {any} interactiveRole Is used to determine if admin or user will be next replier.
 * @param {any} updateRole Is used to determine if admin or user is current replier, for closing ticket.
 * @returns Id of new sent interactive messsage.
 */
async function processReply(replyFormComponents, interactive, update, interactiveRole, updateRole) {
    let replyMessageText = replyFormComponents[0].component.value

    try {
        // Remove buttons from old messages
        await removeButtonsFromMessage(interactive.reference, interactive.channel);
        await removeButtonsFromMessage(update.reference, update.channel);

        // Send a new message with reply option to other side and edit the sender´s one
        const newMessageId = await sendInteractiveReply(
            interactive.channel,
            replyMessageText,
            interactive.reference,
            interactiveRole);
        await updateReferenced(update.channel, replyMessageText, update.reference, updateRole);
        return newMessageId
    }
    catch (err) {
        console.error(err);
        throw new Error('Failed to update old messages or send a new reply');
    }
}

async function sendInteractiveReply(channelId, messageText, referenceId, role) {
    const message = {
        embeds: [
            {
                title: 'Ticket reply',
                fields: [
                    {
                        name: 'Reply',
                        value: messageText
                    }
                ]
            }
        ],
        components: [
            {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                    {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: 'ticket_reply_' + role,
                        label: 'Reply',
                        style: ButtonStyleTypes.PRIMARY
                    },
                    {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: 'ticket_close_' + role,
                        label: 'Close',
                        style: ButtonStyleTypes.DANGER
                    }
                ]
            }
        ]
    }

    return sendMessageWithReference(channelId, message, referenceId);
}

async function updateReferenced(channelId, messageText, referenceId, role) {
    const previousMessage = await fetchMessage(referenceId, channelId);
    const embed = previousMessage.embeds[0];

    // Add reply as a new field
    embed.fields = [
        ...(embed.fields ?? []),
        {
            name: "Reply:",
            value: messageText,
            inline: false
        }
    ];

    // Add button for closing ticket
    previousMessage.components = [
        {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
                {
                    type: MessageComponentTypes.BUTTON,
                    style: ButtonStyleTypes.DANGER,
                    label: "Close",
                    custom_id: "ticket_close_" + role,
                }
            ]
        }
    ];

    return editMessage(referenceId, channelId, previousMessage);
}
