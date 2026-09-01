import { unbanUsers } from './check_bans.js';


/**
 * Starts all async functions that are executed repeatedly after some time.
 */
export async function startPeriodicJobs() {
	unbanUsers(10);
}
