import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getOption } from './utils.js';
import { testReply } from './informative_replies/test.js';
import { displayTicketModal, processTicketModal } from './ticket_system/open_ticket.js';
import { displayReplyModal, processReplyAdmin, processReplyUser } from './ticket_system/reply_ticket.js';
import { closeTicket } from './ticket_system/close_ticket.js';
import { addTicketCategory, deleteTicketCategory } from './ticket_system/ticket_category.js';

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
            case 'ticket': return displayTicketModal(res, req.body.guild);
            case 'add_category': return addTicketCategory(
                res,
                req.body.member.user,
                req.body.guild.id,
                getOption(data, 'category_name'),
                getOption(data, 'category_channel')
            );
            case 'delete_category': return deleteTicketCategory(
                res,
                req.body.member.user,
                req.body.guild.id,
                getOption(data, 'category_name')
            );
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }
    // Handle modal submits
    else if (type === InteractionType.MODAL_SUBMIT) {
        const { custom_id } = data;
        const guild = req.body.guild

        switch (custom_id.split(':')[0]) {
            case 'ticket_modal': return processTicketModal(res, req.body.member.user, guild, data.components);
            case 'ticket_reply_admin': return processReplyAdmin(res, data.components, custom_id.split(':')[1], guild);
            case 'ticket_reply_user': return processReplyUser(res, data.components, custom_id.split(':')[1], req.body.user);
        }

        console.error(`unknown modal id: ${custom_id}`);
        return res.status(400).json({ error: 'unknown modal id' });
    }
    // Handle button interactions
    else if (type === InteractionType.MESSAGE_COMPONENT) {
        const { custom_id } = data;
        const message = req.body.message;

        switch (custom_id) {
            case 'ticket_close_user': return closeTicket(res, message.id, req.body.user.id, true);
            case 'ticket_close_admin': return closeTicket(res, message.id, req.body.guild.id, false);
            case 'ticket_reply_admin': return displayReplyModal(res, 'admin', message);
            case 'ticket_reply_user': return displayReplyModal(res, 'user', message);
        }

        console.error(`unknown button id: ${custom_id}`);
        return res.status(400).json({ error: 'unknown component id' });
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});
