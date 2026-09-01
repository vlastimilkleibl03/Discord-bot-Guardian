import { getExpiredBans, removeActiveBan } from '#src/moderation_tools/moderation_repository.js';
import { unbanUser } from '#src/utils.js';


/**
 * Repeatedly checks active bans and unbans users where ban date is expired.
 * @param {any} repeatIntervalMinutes Number of minutes for pause between checks.
 */
export async function unbanUsers(repeatIntervalMinutes) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (true) {
        console.log('Checking expired bans...')

        let expiredBans;
        try {
            expiredBans = await getExpiredBans(new Date());
        }
        catch (err) {
            console.error(err);
            await sleep(1000 * 60 * 5);
            continue;
        }

        for (const ban of expiredBans) {
            try {
                await unbanUser(ban.userId, ban.guildId);
                await removeActiveBan(ban.guildId, ban.userId);
            }
            catch (err) {
                console.error(err);
            }
        }

        console.log('Checking expired bans complete. Next check in: ' + repeatIntervalMinutes + ' minutes.');
        await sleep(1000 * 60 * repeatIntervalMinutes);
    }
}
