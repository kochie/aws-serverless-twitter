import { Client } from "twitter-api-sdk";
import { searchStream, TwitterResponse } from "twitter-api-sdk/dist/types";
import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsCommandInput,
} from "@aws-sdk/client-eventbridge";

// const authClient = new auth.OAuth2User({
//   client_id: process.env.CLIENT_ID ?? "",
//   client_secret: process.env.CLIENT_SECRET,
//   callback: "http://127.0.0.1:3000/callback",
//   scopes: ["tweet.read", "users.read", "offline.access"],
// });

async function setupRules() {
  const rules = await client.tweets.getRules();
  if (rules.data?.some((rule) => rule.tag === "from:kochie")) {
    console.log("rules already exist, skipping...");
    return;
  }

  console.log("adding rules...");
  await client.tweets.addOrDeleteRules({
    add: [{ value: "from:kochie", tag: "from:kochie" }],
  });
}

const client = new Client(process.env.BEARER_TOKEN ?? "");
const eventBridgeClient = new EventBridgeClient({});

function handle_tweet(tweet: TwitterResponse<searchStream>) {
  if (tweet.data) {
    console.log(tweet.data);
    const event: PutEventsCommandInput = {
      Entries: [
        {
          Source: "twitter",
          DetailType: "tweet",
          Detail: JSON.stringify(tweet.data),
          EventBusName: process.env.EVENT_BUS_ARN,
        },
      ],
    };
    eventBridgeClient.send(new PutEventsCommand(event));
  }
}

async function main() {
  console.log("Setting up rules...");
  await setupRules();

  console.log("Starting stream...");
  const stream = client.tweets.searchStream({
    "user.fields": ["name", "url", "username", "verified"],
    "tweet.fields": [
      "attachments",
      "author_id",
      "possibly_sensitive",
      "referenced_tweets",
      "text",
      "entities",
    ],
    "media.fields": [
      "alt_text",
      "height",
      "url",
      "width",
      "preview_image_url",
      "media_key",
    ],
  });
  for await (const tweet of stream) {
    handle_tweet(tweet);
  }
}

main();
