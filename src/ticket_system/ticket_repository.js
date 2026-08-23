import { db } from '#src/database/index.js';


/**
 * Creates a new unique ticket in database.
 * @param {any} userId Id of user that opened the ticket.
 * @param {any} guildId Id of guild where ticket was opened.
 * @param {any} adminMessageId Id of message that is a copy of ticket in user dm.
 * @param {any} userMessageId Id of message in admin chat for tickets.
 */
export async function saveTicketData(userId, guildId, adminMessageId, userMessageId) {
    await db.ticket.create({
        data: {
            userId,
            guildId,
            adminMessageId,
            userMessageId
        }
    });
}

/**
 * Fetches a ticket from database by user given details.
 * @param {any} userId Id of user with opened ticket.
 * @param {any} messageId Id of last message regarding the open ticket in user dm.
 * @returns Ticket object from database or null if not present.
 */
export async function getTicketByUser(userId, messageId) {
    return db.ticket.findFirst({
        where: {
            userId,
            userMessageId: messageId
        }
    });
}

/**
 * Fetches a ticket from database by guild given details.
 * @param {any} guildId Id of guild where ticket is open.
 * @param {any} messageId Id of last message regarding the ticket in admin chat for tickets.
 * @returns Ticket object from database or null if not present.
 */
export async function getTicketByGuild(guildId, messageId) {
    return db.ticket.findFirst({
        where: {
            guildId,
            adminMessageId: messageId
        }
    });
}

/**
 * Removes ticket object from database by given id.
 * @param {any} ticketId Id of removing ticket.
 */
export async function deleteTicket(ticketId) {
    await db.ticket.delete({
        where: {
            id: ticketId
        }
    });
}

/**
 * Updates message fields data for a ticket.
 * @param {any} ticketId Id of updated ticket.
 * @param {any} newAdminMessageId Id of new message in admin ticket chat.
 * @param {any} newUserMessageId Id of new message in user dm.
 */
export async function updateTicketMessages(ticketId, newAdminMessageId, newUserMessageId) {
    await db.ticket.update({
        where: {
            id: ticketId
        },
        data: {
            adminMessageId: newAdminMessageId,
            userMessageId: newUserMessageId
        }
    });
}

