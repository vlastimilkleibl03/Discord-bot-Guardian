import 'dotenv/config';
import { ChannelTypes } from 'discord-interactions';
import { InstallGlobalCommands } from './utils.js';


// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const TICKET_COMMAND = {
    name: 'ticket',
    description: 'Open a new ticket',
    type: 1,
    integration_types: [0],
    contexts: [0],
};

const ADD_CATEGORY_COMMAND = {
    name: 'add_category',
    description: 'Add a new ticket category or modify existing, use snake_case',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'category_name',
            description: 'Name of a category',
            type: 3,
            required: true,
        },
        {
            name: 'category_channel',
            description: 'Admin channel for tickets',
            type: 7,
            channel_types: [ChannelTypes.GUILD_TEXT],
            required: true
        }
    ]
};

const DELETE_CATEGORY_COMMAND = {
    name: 'delete_category',
    description: 'Delete a ticket category',
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
        {
            name: 'category_name',
            description: 'Name of category to delete',
            type: 3,
            required: true,
        }
    ]
};

const ALL_COMMANDS = [TEST_COMMAND, TICKET_COMMAND, ADD_CATEGORY_COMMAND, DELETE_CATEGORY_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
