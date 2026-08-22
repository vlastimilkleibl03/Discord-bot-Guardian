import { MessageComponentTypes, InteractionResponseType, InteractionResponseFlags, ButtonStyleTypes } from 'discord-interactions';
import { sendMessageToChannel, getUserMessageChannel } from '#src/utils.js';
import { saveTicketData, getGuildTicketChannel } from './database.js';

const TICKET_MODAL_ID = 'ticket_modal'
const TICKET_CATEGORY_ID = 'ticket_category';
const TICKET_DESCRIPTION_ID = 'ticket_description';

/**
 * Creates and displays a modal window for new ticket creation invoked by command.
 * @param {any} res Object allowing to send a response for a http request.
 */
export function displayTicketModal(res) {
    return res.send({
        type: InteractionResponseType.MODAL,
        data: {
            custom_id: TICKET_MODAL_ID,
            title: 'Open a new ticket',
            components: [
                {
                    type: MessageComponentTypes.TEXT_DISPLAY,
                    content: 'Please select a category and write about your issue.'
                },
                {
                    type: MessageComponentTypes.LABEL,
                    label: 'Category',
                    description: 'Select the category of your issue.',
                    required: true,
                    component: {
                        type: MessageComponentTypes.STRING_SELECT,
                        custom_id: TICKET_CATEGORY_ID,
                        options: [
                            {
                                label: 'Moderation appeals',
                                value: 'moderation_appeals'
                            },
                            {
                                label: 'Server features',
                                value: 'server_features'
                            },
                            {
                                label: 'Other',
                                value: 'other'
                            }
                        ]
                    }
                },
                {
                    type: MessageComponentTypes.LABEL,
                    label: 'Issue description',
                    description: 'Describe your issue.',
                    component: {
                        type: MessageComponentTypes.INPUT_TEXT,
                        custom_id: TICKET_DESCRIPTION_ID,
                        style: 2,
                        required: true
                    }
                }
            ]
        }
    });
}


/**
 * Processes a data sent through a ticket modal window. 
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender Discord user who sent the data.
 * @param {any} guild Discord server where ticket is opened.
 * @param {any} formComponents Components of the ticket modal window.
 */
export async function processTicketModal(res, sender, guild, formComponents) {
    let category;
    let description;

    for (const component of formComponents) {
        if (component.type === MessageComponentTypes.LABEL) {
            const child = component.component;
            if (child.custom_id === TICKET_CATEGORY_ID) {
                category = child.values[0];
            }
            if (child.custom_id === TICKET_DESCRIPTION_ID) {
                description = child.value;
            }
        }
    }

    const adminMessage = buildAdminTicketMessage(category, description, sender);
    const userMessage = buildUserTicketMessage(category, description, guild);

    let result = 'Your ticket has been submitted.';
    try {
        // Data from ticket form are sent to preselect admin discord channel
        const channelId = getGuildTicketChannel(guild.id);
        const adminMessageId = await sendMessageToChannel(channelId, adminMessage);

        // Copy is also sent to user
        const userMessageChannel = await getUserMessageChannel(sender.id)
        const userMessageId = await sendMessageToChannel(userMessageChannel, userMessage);

        // Save ticket details to database
        saveTicketData('ID', sender.id, guild.id, adminMessageId, userMessageId);
    }
    catch (err) {
        console.error(err);
        result = 'Something went wrong while sending a ticket.';
    }

    // User is notified about operation result
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: result,
            flags: InteractionResponseFlags.EPHEMERAL
        }
    });
}

function buildAdminTicketMessage(category, description, sender) {
    return {
        embeds: [
            {
                title: 'New ticket',
                fields: [
                    {
                        name: 'Category',
                        value: category,
                        inline: true
                    },
                    {
                        name: 'Description',
                        value: description
                    }
                ],
                footer: {
                    text: 'Submitted by ' + (sender.username ?? 'Unknown user')
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                    {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: 'ticket_reply_admin',
                        label: 'Reply',
                        style: ButtonStyleTypes.PRIMARY
                    },
                    {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: 'ticket_close_admin',
                        label: 'Close',
                        style: ButtonStyleTypes.DANGER
                    }
                ]
            }
        ]
    }
}

function buildUserTicketMessage(category, description, guild) {
    return {
        embeds: [
            {
                title: 'Copy of your ticket',
                fields: [
                    {
                        name: 'Category',
                        value: category,
                        inline: true
                    },
                    {
                        name: 'Description',
                        value: description
                    }
                ],
                footer: {
                    text: 'Submitted in ' + (guild.name ?? 'Unknown server')
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                    {
                        type: MessageComponentTypes.BUTTON,
                        custom_id: 'ticket_close_user',
                        label: 'Close',
                        style: ButtonStyleTypes.DANGER
                    }
                ]
            }
        ]
    }
}
