# Infrastructure

This document details my servers layout.

Design and description licensed under MIT.

## Linode Server

This is my legacy server, I will move it to another host soon.

`jspenguin.com` domain, registration expires 2019.04 or 2020.04 depending on my
migration progress.

`Debian 8` operating system, support ends 2020.06.

`Node.js 8` runtime, support ends 2019.12.

## Lightsail Servers

`hugoxu.com` base domain, registration automatically renew.

### `legacy.hugoxu.com`

Legacy server, runs a mirror of `jspenguin.com`.

`Debian 9` operating system, support ends 2022.06.

`Node.js 10` runtime, support ends 2021.04.

### `git.hugoxu.com`

Private Git server.

`Debian 9` operating system, support ends 2022.06.

`Node.js 10` runtime, support ends 2021.04.

`Gitea` server engine, rolling release.
