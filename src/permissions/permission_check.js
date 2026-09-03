// PERMISSION TYPES
const KICK_USERS = 1n << 1n;
const BAN_USERS = 1n << 2n;
const ADMINISTRATOR = 1n << 3n;
const MODERATOR_MUTE = 1n << 40n;

function hasPermission(guildMember, permissions) {
    const userPermissions = BigInt(guildMember.permissions);

    for (const permission of permissions) {
        if ((userPermissions & permission) !== 0n) {
            return true
        }
    }

    return false;
}


/**
 * Decides if user has permissions for kick command.
 * @param {any} guildMember User who invoked the command.
 * @returns True if user can perform the kick, otherwise false.
 */
export function hasKickPermission(guildMember) {
    return hasPermission(guildMember, [KICK_USERS, ADMINISTRATOR]);
}

/**
 * Decides if user has permissions for ban command.
 * @param {any} guildMember User who invoked the command.
 * @returns True if user can issue the ban, otherwise false.
 */
export function hasBanPermission(guildMember) {
    return hasPermission(guildMember, [BAN_USERS, ADMINISTRATOR]);
}

/**
 * Decides if user has permissions for modifing commands.
 * @param {any} guildMember User who invoked the command.
 * @returns True if user can modify the bot specific features, otherwise false.
 */
export function hasModifyPermission(guildMember) {
    return hasPermission(guildMember, [ADMINISTRATOR]);
}

/**
 * Decides if user has permissions for mute command.
 * @param {any} guildMember User who invoked the command.
 * @returns True if user can mute other users, otherwise false.
 */
export function hasMutePermission(guildMember) {
    return hasPermission(guildMember, [ADMINISTRATOR, MODERATOR_MUTE])
}

/**
 * Decides if user has permissions for display user moderation records.
 * @param {any} guildMember User who invoked the command.
 * @param {any} displayUserId Id of user which records are displayed.
 * @returns True if user can display user moderation records, otherwise false.
 */
export function hasDisplayRecordPermission(guildMember, displayUserId) {
    return guildMember.user.id === displayUserId
        || hasPermission(guildMember, [ADMINISTRATOR, MODERATOR_MUTE, KICK_USERS, BAN_USERS]);
}
