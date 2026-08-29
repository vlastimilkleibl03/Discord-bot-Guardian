import { createDefaultTicketCategories } from '#src/ticket_system/ticket_category.js';


/**
 * Provides operations that is executed when bot joins a new discord server.
 * @param {any} guild Joined discord server object.
 */
export async function guildJoin(guild) {
    await createDefaultTicketCategories(guild.id);
}
