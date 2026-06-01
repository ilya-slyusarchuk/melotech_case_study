<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Melotech Project Overview

## One-line description

Melotech is an AI-native media and entertainment company that creates art through technology for humans to enjoy.

## What Melotech does

Melotech publicly describes itself as revolutionizing media and entertainment. Its website emphasizes three creative and distribution verticals:

- Music: songs, playlists, artists, labels, charts, stages, culture, and generations.
- Video: films, channels, directors, studios, screens, audiences, societies, and history.
- Communities: people, voices, leaders, trends, movements, borders, and futures.

The company is not positioned only as an AI tooling vendor. Its public language suggests a vertically integrated creative company: it creates, curates, distributes, grows audiences, and partners across entertainment ecosystems.

## What their goal appears to be

The goal is to build a new kind of media and entertainment company where technology, especially AI, increases the speed, scale, and precision of creative production and distribution.

A practical interpretation of the strategy:

- Use AI to generate and adapt creative assets.
- Use data and distribution feedback to understand what audiences respond to.
- Build systems that help content perform across platforms, formats, and regions.
- Turn technology into a creative and commercial advantage.

## Why this matters for the assignment

The take-home assignment is not just asking for an LLM wrapper. It is asking for a miniature version of an AI content distribution pipeline.

The most relevant engineering signals are:

- Can the developer build a production-shaped AI workflow?
- Can the system support multiple content platforms without hard-coded branching everywhere?
- Can the system validate unreliable LLM outputs?
- Can failures be handled gracefully?
- Can user history, usage, rate limits, and credits be handled safely?
- Can the frontend make the workflow feel like an internal Melotech tool?

## Product interpretation

The project should feel like a small internal Melotech console for preparing AI-generated music concepts for multi-platform distribution.

The system should help a user answer:

- How should this music concept be positioned on Spotify?
- How should it be turned into a TikTok hook?
- How should it be described and tagged for YouTube?
- How should the output change for a target region and demographic?
- How many AI credits were consumed?
- What previous generations have I created?

## Public-source basis

This document is based on Melotech's public website, public job descriptions, and the assignment text provided by the candidate.
