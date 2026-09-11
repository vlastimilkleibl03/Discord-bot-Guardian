import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet'
import crypto from 'crypto';
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';

import { config } from './config.js'
import { getOption } from './utils.js';
import { discordClient } from './gateway/init.js';
import { startPeriodicJobs } from './periodic_jobs/init.js'

import { authenticateDiscordUser } from './utils_web/authentication.js';

import { testReply } from './informative_replies/test.js';
import { displayTicketModal, processTicketModal } from './ticket_system/open_ticket.js';
import { displayReplyModal, processReplyAdmin, processReplyUser } from './ticket_system/reply_ticket.js';
import { closeTicket } from './ticket_system/close_ticket.js';
import { modifyTicketCategory, deleteTicketCategory } from './ticket_system/ticket_category.js';

import { banUser } from './moderation_tools/ban.js';
import { kickUser } from './moderation_tools/kick.js';
import { muteUser } from './moderation_tools/mute.js';
import { modifyInfoChannel, displayUserRecords } from './moderation_tools/info_management.js';


// CREATE APPLICATION

// Resolve the current file and its directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = config.PORT || 3000;

app.use(helmet());

// Set required proxy level, can be customized
app.set('trust proxy', 1);

// Set to use sessions, needed for authentication
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
    }
}));

// Provide folder with static file for a web
app.use(express.static(path.join(__dirname, 'public_web')));



// API handlers

/**
 * Provides details about authenticated user.
 */
app.get('/api/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Not authenticated.'
        });
    }

    res.json(req.session.user);
});



// OTHER WEB ROUTES LOGIC

/**
 * Prepares for a user authentication process provided by discord.
 */
app.get('/auth/discord', (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');
    req.session.oauthState = state;

    const params = new URLSearchParams({
        client_id: config.APP_ID,
        redirect_uri: config.REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds',
        state
    });

    res.redirect('https://discord.com/oauth2/authorize?' + params);
});

/**
 * Processes callback from discord user authentication and fetches user details.
 */
app.get('/auth/discord/callback', async (req, res) => {
    const { code, state } = req.query;

    // Validate incoming data from discord
    if (typeof code !== 'string' || typeof state !== 'string') {
        return res.status(400).send('Invalid OAuth request.');
    }
    if (state !== req.session.oauthState) {
        return res.status(403).send('Not valid OAuth state.');
    }
    delete req.session.oauthState;

    try {
        // Get user details from discord
        const user = await authenticateDiscordUser(code);

        // Setup a new session after login and save user data
        req.session.regenerate((err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Unable to create session.');
            }

            req.session.user = {
                id: user.id,
                username: user.global_name ?? user.username,
                avatar: user.avatar,
                guilds: user.guilds
            };

            res.redirect('/dashboard.html');
        });
    }
    catch (err) {
        delete req.session.user;
        res.status(500).send('Authentication failed.');
        return;
    }
});

/**
 * Ends an active session and redirects to a main page.
 */
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});





// DISCORD BOT INTERACTIONS PART

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(config.PUBLIC_KEY), async function (req, res) {
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
            case 'modify_category': return modifyTicketCategory(
                res,
                req.body.member,
                req.body.guild.id,
                getOption(data, 'category_name'),
                getOption(data, 'category_channel')
            );
            case 'delete_category': return deleteTicketCategory(
                res,
                req.body.member,
                req.body.guild.id,
                getOption(data, 'category_name')
            );
            case 'ban': return banUser(
                res,
                req.body.member,
                req.body.guild.id,
                data
            );
            case 'kick': return kickUser(
                res,
                req.body.member,
                req.body.guild.id,
                data
            );
            case 'mute': return muteUser(
                res,
                req.body.member,
                req.body.guild.id,
                data
            );
            case 'set_info_channel': return modifyInfoChannel(
                res,
                req.body.member,
                req.body.guild.id,
                getOption(data, 'type'),
                getOption(data, 'channel')
            );
            case 'user_record': return displayUserRecords(
                res,
                req.body.member,
                req.body.guild.id,
                getOption(data, 'user_select'),
            )
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
    discordClient.login(config.DISCORD_TOKEN);
    startPeriodicJobs();
    console.log('Listening on port', PORT);
});
