import { MessageComponentTypes, InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { DiscordRequest } from '#src/utils.js';

const TICKET_MODAL_ID = 'ticket_modal'
const TICKET_CATEGORY_ID = 'ticket_modal';
const TICKET_DESCRIPTION_ID = 'ticket_description';

/**
 * Creates and displays a modal window for new ticket creation invoked by command.
 * @param {any} res Object allowing to send a response for a http request.
 */
export function displayTicketModal(res) {
    return res.send({
        type: 9,
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
 * Processes a data send through a ticket modal window. 
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender Discord user who sent the data.
 * @param {any} form_components Components of the ticket modal window.
 */
export function processTicketModal(res, sender, form_components) {
    let category;
    let description;

    for (const component of form_components) {
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

    // Data from ticket form are sent to preselect discord channel
    const CHANNEL_ID = '1539660986082926653';
    const endpoint = 'channels/' + CHANNEL_ID + '/messages';
    const message = {
        method: 'POST',
        body: {
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
                        text: 'Submitted by ' + (sender ?? 'Unknown user')
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        }
    };
    DiscordRequest(endpoint, message);

    // User is notified about successfull operation
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: 'Your ticket has been submitted.',
            flags: InteractionResponseFlags.EPHEMERAL
        }
    });
}
