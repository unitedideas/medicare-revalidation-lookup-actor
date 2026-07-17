# Apify MCP discovery screen — 2026-07-17

## Decision

Publish a direct MCP usage path for the existing paid Actor. Do not claim generic MCP discovery or paid demand.

## Measured evidence

- The official hosted endpoint initialized successfully over Streamable HTTP using protocol version `2025-06-18` and Apify MCP server version `0.11.5`.
- Anonymous discovery exposed `search-actors` and `fetch-actor-details`, matching Apify's documented unauthenticated tool boundary.
- `fetch-actor-details` returned `actablesite/medicare-revalidation-lookup-actor` with its public description, $0.00005 start event, $0.01 NPI-result event, input schema, inferred structured output, two total users, one monthly user, and 100% public-run success.
- The Actor did not appear in the first ten results for `Medicare revalidation`, `Medicare revalidation due date`, `provider enrollment`, or `Medicare` through `search-actors`.
- The Actor-only endpoint `https://mcp.apify.com?tools=actablesite/medicare-revalidation-lookup-actor` returns HTTP 401 without authentication, which is the expected boundary for running Actors or accessing run data.

## Primary sources

- https://docs.apify.com/integrations/mcp
- https://docs.apify.com/actors/publishing/monetize

## Product rule

The listing may say the Actor is directly usable through Apify MCP after buyer OAuth. It may not say that generic MCP search currently discovers it, that an agent can run it anonymously, or that agentic payments are enabled. The connected buyer remains responsible for Apify authentication and charges.

## Success and rejection rule

Success still requires an authenticated non-owner paid result with automatic delivery. An MCP details lookup, Store impression, free run, or owner test is acquisition evidence only. If the direct endpoint remains live but produces no paid use through a reasonable observation window, this channel does not rescue the Actor from the existing rejection rule.
