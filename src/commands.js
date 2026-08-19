import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';


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

const ALL_COMMANDS = [TEST_COMMAND, TICKET_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
