import { ChannelTypes } from 'discord-interactions';
import { capitalize, fetchGuildChannels } from '#src/utils.js';
import { replyInformation, errorInformation, permissionReply } from '#src/informative_replies/user_notification.js';
import { loadGuildTicketCategories, saveCategoryData, deleteCategory } from './ticket_repository.js';


export const DEFAULT_CATEGORIES = ['moderation_appeals', 'server_features', 'other'];

/**
 * Adds a new ticket category or modifies the already added.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked this command, needed for permission check.
 * @param {any} guildId Id of discord server where command was invoked.
 * @param {any} categoryName Name of a ticket category.
 * @param {any} channelId Id of admin channel where tickets of given category will be sent.
 */
export async function modifyTicketCategory(res, sender, guildId, categoryName, channelId) {
    if (!hasModifyPermission(sender)) {
        return permissionReply(res)
    }

    try {
        await saveCategoryData(guildId, categoryName, channelId);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to modify ticket categories.')
    }

    return replyInformation(res, 'Successfully modified category: ' + categoryName);
}

/**
 * Removes a ticket category from a discord server.
 * @param {any} res Object allowing to send a response for a http request.
 * @param {any} sender User who invoked this command, needed for permission check.
 * @param {any} guildId Id of discord server where command was invoked.
 * @param {any} categoryName Name of a ticket category.
 */
export async function deleteTicketCategory(res, sender, guildId, categoryName) {
    if (!hasModifyPermission(sender)) {
        return permissionReply(res)
    }

    try {
        await deleteCategory(guildId, categoryName);
    }
    catch (err) {
        return errorInformation(res, err, 'Failed to modify ticket categories.')
    }

    return replyInformation(res, 'Successfully removed category: ' + categoryName);
}

function hasModifyPermission(guildMember) {
    const permissions = BigInt(guildMember.permissions);
    const ADMINISTRATOR = 1n << 3n;

    return (permissions & ADMINISTRATOR) !== 0n;
}


/**
 * Returns available ticket categories for given guild.
 * @param {any} guildId Id of guild.
 * @returns Array with category names.
 */
export async function getGuildTicketCategories(guildId) {
    const categories = await loadGuildTicketCategories(guildId);
    return categories.map(cat => cat.categoryName);
}

/**
 * Prepares an array for select menu from given categories.
 * @param {any} categoryNames Array of category names.
 * @returns Array of objects for a select menu.
 */
export function prepareCategorySelection(categoryNames) {
    return categoryNames
        .map(cat => ({ label: categoryFormatName(cat), value: cat }));
}

/**
 * Converts a snake_case category value name to capitalized format for display.
 * @param {any} str Category name.
 * @returns Modified category name string.
 */
export function categoryFormatName(str) {
    return str
        .split('_')
        .map(capitalize)
        .join(' ');
}


/**
 * Creates a new default ticket categories after joing a new server.
 * @param {any} guildId Id of joined guild.
 */
export async function createDefaultTicketCategories(guildId) {
    try {
        // Get text channels in guild and select one random to where send tickets
        const guildChannels = await fetchGuildChannels(guildId);
        const textChannels = guildChannels.filter(channel => channel.type === ChannelTypes.GUILD_TEXT)
        const defaultChannel = textChannels[0];

        // Get previously created categories, so no modification is made on existing (in case bot was on server before)
        const activeCategories = await getGuildTicketCategories(guildId);

        // Add all non present default categories
        for (const category of DEFAULT_CATEGORIES) {
            if (!activeCategories.includes(category)) {
                console.log(category + 'add');
                await saveCategoryData(guildId, category, defaultChannel.id);
            }
        }
    }
    catch (err) {
        console.error('Failed to set default ticket categories, caused by: ' + err);
    }
}
