import {
    MessageComponentTypes, InteractionResponseType,
    ButtonStyleTypes
} from 'discord-interactions';
import { sendMessageToChannel, getUserMessageChannel } from '#src/utils.js';
import { errorInformation, replyInformation } from '#src/informative_replies/user_notification.js';
import { saveTicketData, getGuildTicketChannel } from './ticket_repository.js';
import {
    categoryFormatName, getGuildTicketCategories,
    prepareCategorySelection
} from './ticket_category.js';

const TICKET_MODAL_ID = 'ticket_modal'
const TICKET_CATEGORY_ID = 'ticket_category';
const TICKET_DESCRIPTION_ID = 'ticket_description';

/**
 * Creates and displays a modal window for new ticket creation invoked by command.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} guild Server where command is invoked, used for getting ticket categories.
 */
export async function displayTicketModal(res, guild) {
    // Load ticket categories in guild
    let categories;
    try {
        categories = await getGuildTicketCategories(guild.id)
    }
    catch (err) {
        return errorInformation(res, err, 'Something went wrong.');
    }

    // Create a modal form
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
                        options: [...prepareCategorySelection(categories)]
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

    const categoryDisplay = categoryFormatName(category);
    const adminMessage = buildAdminTicketMessage(categoryDisplay, description, sender);
    const userMessage = buildUserTicketMessage(categoryDisplay, description, guild);

    try {
        // Check if ticket category is available for current guild
        const guildCategories = await getGuildTicketCategories(guild.id);
        if (!guildCategories.includes(category)) {
            throw new Error('Ticket category is not in database.')
        }

        // Data from ticket form are sent to preselect admin discord channel
        const channelId = await getGuildTicketChannel(guild.id, category);
        const adminMessageId = await sendMessageToChannel(channelId, adminMessage);

        // Copy is also sent to user
        const userMessageChannel = await getUserMessageChannel(sender.id)
        const userMessageId = await sendMessageToChannel(userMessageChannel, userMessage);

        // Save ticket details to database
        await saveTicketData(sender.id, guild.id, adminMessageId, userMessageId, category);
    }
    catch (err) {
        return errorInformation(res, err, 'Something went wrong while sending a ticket.');
    }

    // User is notified about operation result
    return replyInformation(res, 'Your ticket has been submitted.', true);
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
