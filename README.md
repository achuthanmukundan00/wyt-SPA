# WatchYourTemper Repository

This repository contains the official website and store experience for WatchYourTemper.

At a high level, this is the home for:

- the main immersive website
- the merch store
- the backend worker that supports store and checkout flows

Most of the day-to-day app code lives in [`watchyourtemper-site`](./watchyourtemper-site), which has the more detailed technical README.

## What's Here

- [`watchyourtemper-site`](./watchyourtemper-site): the main site, store UI, styling, and app code
- [`wrangler.jsonc`](./wrangler.jsonc): deployment configuration for the Worker that serves the app and store API

## Purpose

This repo exists to keep the WatchYourTemper web presence in one place, including the public-facing experience and the systems that help the merch store run.

If you need implementation details, local setup steps, or environment configuration, head to [`watchyourtemper-site/README.md`](./watchyourtemper-site/README.md).
