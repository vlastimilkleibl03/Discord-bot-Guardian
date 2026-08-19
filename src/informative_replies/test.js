import { InteractionResponseType, InteractionResponseFlags, MessageComponentTypes } from 'discord-interactions';
import { getRandomEmoji } from '#src/utils.js';

export function testReply(res) {
    // Send a message into the channel where command was triggered from
    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
                {
                    type: MessageComponentTypes.TEXT_DISPLAY,
                    // Fetches a random emoji to send from a helper function
                    content: `Hello, I am online ${getRandomEmoji()}`
                }
            ]
        },
    });
}
