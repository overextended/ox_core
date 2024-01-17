## Installation

The rewrite is still a work in progress - the docs will not be updated to reflected changes until finalised.

- Download and install the LTS version of Node.js.
- Open a command-line terminal (e.g. Terminal, Command Prompt).
- Enter node --version to confirm successful installation.
- Enter `npm install -g pnpm` to globally install the package.
- Download or clone the repo with `git clone https://github.com/overextended/ox_core`.
- Download and install [MariaDB Community Server](https://mariadb.com/downloads/community/community-server/).
- Execute the queries in `sql/install.sql` in your database.
- Install all dependencies with `pnpm i`.
- Build the resource with `pnpm build`.

Use `pnpm watch` to rebuild whenever a file is modified.

~~Refer to our [documentation](https://overextended.github.io/docs/ox_core/) for installing and setting up ox_core on your server.~~

## Database

This project is designed to be used with [MariaDB](https://mariadb.com/downloads/) and utilises [mariadb-connector-nodejs](https://github.com/mariadb-corporation/mariadb-connector-nodejs).

## Third-party resources

When releasing a resource using the this framework _do not use the ox prefix_. This creates confusion about the creator of the resource, and causes conflicts between similarly named resources.

## Sample usage

todo

~~Refer to [ox_core-example](https://github.com/overextended/ox_core-example) for some sample code. This should give some idea of how to use player and vehicle refs.~~

## Copyright

Copyright © 2024 Overextended <https://github.com/overextended>

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
