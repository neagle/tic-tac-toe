# Tic-Tac-Toe
## Serverless Multiplayer Xs and Os with Ably, Next.JS, and Vercel

Play Tic-Tac-Toe with other players online including a handy chat box with which to exchange pleasantries (and smack talk!) during your games. It's powered by a combination of Ably (for real-time pub/sub communication), Next.JS (for front-end React and a simple serverless API), and Vercel KV (Redis) for state persistence.

[Play Tic-Tac-Toe on the deployed version](https://tic-tac-toe-pi-two.vercel.app/).

(If you don't have anyone else to play with, you can be your own opponent by opening up the URL in a separate browser or a private/incognito window/tab.)

## Dependencies

To deploy your own version, you'll need a few things:

* [Node.js](https://nodejs.org/)
* An [Ably](https://ably.com) account
* The [Next.JS CLI](https://nextjs.org/docs/getting-started/installation)
* A [Vercel](https://vercel.com) account

## Setup

Armed with those dependencies, you'll need to:

* Create an app in Ably for your project
* Fork this repo and create a project in Vercel with the URL to your new repo
* [Create a new KV Database in Vercel](https://vercel.com/docs/storage/vercel-kv/quickstart) and connect it to your project
* Make a copy of the [env.template](https://github.com/neagle/tic-tac-toe/blob/main/env.template) file named `.env` and populate the values of those keys with the values from Ably and Vercel KV.

```sh
cp env.template .env
```

```
ABLY_API_KEY=
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

## Getting Started

Once you have the prerequisites and setup, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
