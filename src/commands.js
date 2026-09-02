import 'dotenv/config';
import { ChannelTypes } from 'discord-interactions';
import { InstallGlobalCommands } from './utils.js';


// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command.',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const TICKET_COMMAND = {
    name: 'ticket',
    description: 'Open a new ticket.',
    type: 1,
    integration_types: [0],
    contexts: [0],
};

const MODIFY_CATEGORY_COMMAND = {
    name: 'modify_category',
    description: 'Add a new ticket category or modify existing.',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'category_name',
            description: 'Name of a category, use snake_case.',
            type: 3,
            required: true,
        },
        {
            name: 'category_channel',
            description: 'Admin channel for tickets.',
            type: 7,
            channel_types: [ChannelTypes.GUILD_TEXT],
            required: true
        }
    ]
};

const DELETE_CATEGORY_COMMAND = {
    name: 'delete_category',
    description: 'Delete a ticket category.',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'category_name',
            description: 'Name of category to delete, use snake_case.',
            type: 3,
            required: true,
        }
    ]
};

const BAN_COMMAND = {
    name: 'ban',
    description: 'Issue a ban to selected user.',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'user_select',
            description: 'Select a user.',
            type: 6,
            required: true
        },
        {
            name: 'ban_length_days',
            description: 'Input number of days.',
            type: 4,
            required: true,
            min_value: 1
        },
        {
            name: 'ban_reason',
            description: 'Reason of the ban.',
            type: 3,
            required: true,
            max_length: 100
        }
    ]
};

const KICK_COMMAND = {
    name: 'kick',
    description: 'Kick a selected user out of server.',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'user_select',
            description: 'Select a user.',
            type: 6,
            required: true
        },
        {
            name: 'kick_reason',
            description: 'Reason of the kick.',
            type: 3,
            required: true,
            max_length: 100
        }
    ]
};

const MUTE_COMMAND = {
    name: 'mute',
    description: 'Mute a selected user in server (can not send messages or join voice rooms)',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'user_select',
            description: 'Select a user.',
            type: 6,
            required: true
        },
        {
            name: 'mute_length_hours',
            description: 'Input number of hours.',
            type: 4,
            required: true,
            min_value: 1
        },
        {
            name: 'mute_reason',
            description: 'Reason of the mute.',
            type: 3,
            required: true,
            max_length: 100
        }
    ]
}

const SET_INFO_CHANNEL = {
    name: 'set_info_channel',
    description: 'Modify channel for sending information about moderation actions.',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'type',
            description: 'Select moderation type',
            type: 3,
            required: true,
            choices: [
                {
                    name: 'ban',
                    value: 'ban',
                },
                {
                    name: 'kick',
                    value: 'kick',
                },
                {
                    name: 'mute',
                    value: 'mute'
                }
            ]
        },
        {
            name: 'channel',
            description: 'Select a text channel for info messages.',
            type: 7,
            channel_types: [ChannelTypes.GUILD_TEXT],
            required: true
        }
    ]
};

const ALL_COMMANDS = [
    TEST_COMMAND,
    TICKET_COMMAND,
    MODIFY_CATEGORY_COMMAND,
    DELETE_CATEGORY_COMMAND,
    BAN_COMMAND,
    KICK_COMMAND,
    MUTE_COMMAND,
    SET_INFO_CHANNEL,
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
