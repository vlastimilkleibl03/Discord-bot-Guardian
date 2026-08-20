import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { testReply } from './informative_replies/test.js';
import { displayTicketModal, processTicketModal } from './ticket_system/open_ticket.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;


/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
    // Interaction id, type and data
    const { id, type, data } = req.body;

    /**
    * Handle verification requests
    */
    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    /**
    * Handle slash command requests
    * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
    */
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        switch (name) {
            case 'test': return testReply(res);
            case 'ticket': return displayTicketModal(res);
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }
    // Handle modal submits
    else if (type === InteractionType.MODAL_SUBMIT) {
        const { custom_id } = data;
        const sender = req.body.member.user;

        switch (custom_id) {
            case 'ticket_modal': return processTicketModal(res, sender, data.components);
        }

        console.error(`unknown modal id: ${custom_id}`);
        return res.status(400).json({ error: 'unknown modal id' });
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});
