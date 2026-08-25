import { db } from '#src/database/index.js';
import { DEFAULT_CATEGORIES } from './ticket_category.js'

// TICKETS

/**
 * Creates a new unique ticket in database.
 * @param {any} userId Id of user that opened the ticket.
 * @param {any} guildId Id of guild where ticket was opened.
 * @param {any} adminMessageId Id of message that is a copy of ticket in user dm.
 * @param {any} userMessageId Id of message in admin chat for tickets.
 * @param {any} category Name of a ticket category.
 */
export async function saveTicketData(userId, guildId, adminMessageId, userMessageId, category) {
    await db.ticket.create({
        data: {
            userId,
            guildId,
            adminMessageId,
            userMessageId,
            category
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


// TICKET CATEGORIES

/**
 * Creates a new record of ticket category or modifies it for given guild and specific channel.
 * @param {any} guildId Id of given guild.
 * @param {any} categoryName Name of a new category.
 * @param {any} channelId Id of channel where tickets from this category will be sent.
 */
export async function saveCategoryData(guildId, categoryName, channelId) {
    await db.ticketCategory.upsert({
        where: { guildId_categoryName: { guildId, categoryName } },
        create: { guildId, categoryName, categoryChannel: channelId },
        update: { categoryChannel: channelId }
    });
}

/**
 * Returns all ticket categories available for given guild.
 * @param {any} guildId Id of given guild.
 * @returns An array of ticketCategory objects.
 */
export async function loadGuildTicketCategories(guildId) {
    const categories = await db.ticketCategory.findMany({
        where: { guildId: guildId }
    });

    return categories;
}

/**
 * Finds a corresponding channel for a ticket category in given guild.
 * @param {any} guildId Id of given guild.
 * @param {any} categoryName Name of a category.
 * @returns Id of found channel.
 */
export async function getGuildTicketChannel(guildId, categoryName) {
    const category = await db.ticketCategory.findFirst({
        where: {
            guildId: guildId,
            categoryName: categoryName
        }
    });

    return category?.categoryChannel;
}

/**
 * Removes a ticket category from database.
 * @param {any} guildId Id of guild where ticket category is removed.
 * @param {any} categoryName Name of a removed category.
 * @param {boolean} noCheckDefaults Optional check, setting to true enables to delete the default categories.
 */
export async function deleteCategory(guildId, categoryName, noCheckDefaults = false) {
    if (noCheckDefaults || !DEFAULT_CATEGORIES.includes(categoryName)) {
        await db.ticketCategory.delete({
            where: {
                guildId_categoryName: {
                    guildId,
                    categoryName
                }
            }
        });
    }
}
