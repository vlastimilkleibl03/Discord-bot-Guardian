import { ChannelTypes } from 'discord-interactions';
import { createGuildChannel } from '#src/utils.js';
import { getGuildTicketCategories, DEFAULT_CATEGORIES } from '#src/ticket_system/ticket_category.js'
import { saveCategoryData } from '#src/ticket_system/ticket_repository.js';
import {
    INFO_CHANNEL_TYPES, saveInfoChannelData,
    getGuildInfoChannels
} from '#src/moderation_tools/moderation_repository.js'


/**
 * Provides operations that is executed when bot joins a new discord server.
 * @param {any} guild Joined discord server object.
 */
export async function guildJoin(guild) {
    await createDefaultTicketCategories(guild.id);
    await setDefaultModerationChannels(guild.id);
}


/**
 * Creates a new default ticket categories after joing a new server.
 * @param {any} guildId Id of joined guild.
 */
async function createDefaultTicketCategories(guildId) {
    try {
        let defaultChannel = null;

        // Get previously created categories, so no modification is made on existing (in case bot was on server before)
        const activeCategories = await getGuildTicketCategories(guildId);

        // Add all non present default categories
        for (const category of DEFAULT_CATEGORIES) {
            if (!activeCategories.includes(category)) {
                // If channel is not set, create new
                if (defaultChannel === null) {
                    defaultChannel = await createGuildChannel(guildId, 'Guardian-tickets', ChannelTypes.GUILD_TEXT);
                }
                await saveCategoryData(guildId, category, defaultChannel.id);
            }
        }
    }
    catch (err) {
        console.error('Failed to set default ticket categories, caused by: ' + err);
    }
}

/**
 * Sets a default channel used for moderation actions information.
 * @param {any} guildId Id of joined guild.
 */
async function setDefaultModerationChannels(guildId) {
    try {
        let defaultChannel = null;

        // Previously set channels are not modified (bot was on server before)
        const setTypes = await getGuildInfoChannels(guildId);

        // Types that are not set are set to default channel
        for (const type of Object.values(INFO_CHANNEL_TYPES)) {
            if (!setTypes.includes(type)) {
                if (defaultChannel === null) {
                    defaultChannel = await createGuildChannel(guildId, 'Guardian-moderation', ChannelTypes.GUILD_TEXT);
                }
                await saveInfoChannelData(guildId, defaultChannel.id, type);
            }
        }
    }
    catch (err) {
        console.error('Failed to set default info channel for moderation actions, caused by: ' + err);
    }
}
