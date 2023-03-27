# Contributing

### High Level Process to Contribute Code

- You should open a PR against `main` and ensure that all CI passes.
- Your changes should have [unit](#unit-tests) and/or [integration tests](#integration-tests).
- Your changes should [pass the linter](#run-the-linter).
- You should get a full code review from two of the maintainers.
- Then you can merge your changes. (Which will then be included in the next release)

## Set up your dev environment

### Requirements

We use Node v14 for development - that is the version that our linters require.
You must also use `npm` v7. You can check your `npm` version with:

```bash
npm -v
```

If your `npm` version is too old, use this command to update it:

```bash
npm -g i npm@7
```

### Set up

1. Clone the repository
2. `cd` into the repository
3. Install dependencies with `npm install`

### Build

```bash
npm run build
```

## Run the linter

```bash
npm install
npm run build
npm run lint
```

## Running Tests

For integration and browser tests, we use a `rippled` node in standalone mode to test xrpl.js code against. To set this up, you can either run `rippled` locally, or set up the Docker container `natenichols/rippled-standalone:latest` for this purpose. The latter will require you to [install Docker](https://docs.docker.com/get-docker/).

### Unit Tests

```bash
npm install
npm run build
npm test
```

### Integration Tests

```bash
npm install
# sets up the rippled standalone Docker container - you can skip this step if you already have it set up
docker run -p 6006:6006 -it natenichols/rippled-standalone:latest
npm run build
npm run test:integration
```

### Browser Tests

There are two ways to run browser tests.

One is in the browser - run `npm run build:browserTests` and open `test/localIntegrationRunner.html` in your browser.

The other is in the command line (this is what we use for CI) -

```bash
npm run build
# sets up the rippled standalone Docker container - you can skip this step if you already have it set up
docker run -p 6006:6006 -it natenichols/rippled-standalone:latest
npm run test:browser
```

## High Level Architecture

This is a monorepo, which means that there are multiple packages in a single GitHub repository using [Lerna](https://lerna.js.org/).

The 4 packages currently here are:

1. xrpl.js - The client library for interacting with the ledger.
2. ripple-binary-codec - A library for serializing and deserializing transactions for the ledger.
3. ripple-keypairs - A library for generating and using cryptographic keypairs.
4. ripple-address-codec - A library for encoding and decoding XRP Ledger addresses and seeds.

Each package has it's own README which dives deeper into what it's main purpose is, and the core functionality it offers.
They also run tests independently as they were originally in separate repositories.

These are managed in a monorepo because often a change in a lower-level library will also require a change in xrpl.js, and so it makes sense to be able to allow for modifications of all packages at once without coordinating versions across multiple repositories.

Let's dive a bit into how xrpl.js is structured!

### The File Structure

Within the xrpl package, each folder has a specific purpose:

**Client** - This contains logic for handling the websocket connection to rippled servers.
**Models** - These types model LedgerObjects, Requests/Methods, and Transactions in order to give type hints and nice errors for users.
**Sugar** - This is where handy helper functions end up, like `submit`, `autofill`, and `getXRPBalance` amongst others.
**Utils** - These are shared functions which are useful for conversions, or internal implementation details within the library.
**Wallet** - This logic handles managing keys, addresses, and signing within xrpl.js

### Writing Tests for xrpl.js

For every file in `src`, we try to have a corresponding file in `test` with unit tests.

The goal is to maintain above 80% code coverage, and generally any new feature or bug fix should be accompanied by unit tests, and integration tests if applicable.

For an example of a unit test, check out the [autofill tests here](./packages/xrpl/test/client/autofill.ts).

If your code connects to the ledger (ex. Adding a new transaction type) it's handy to write integration tests to ensure that you can successfully interact with the ledger. Integration tests are generally run against a docker instance of rippled which contains the latest updates. Since standalone mode allows us to manually close ledgers, this allows us to run integration tests at a much faster rate than if we had to wait 4-5 seconds per transaction for the ledger to validate the transaction. [See above](#running-tests) for how to start up the docker container to run integration tests.

All integration tests should be written in the `test/integration` folder, with new `Requests` and `Transactions` tests being in their respective folders.

For an example of how to write an integration test for `xrpl.js`, you can look at the [Payment integration test](./packages/xrpl/test/integration/transactions/payment.ts).

## Generate reference docs

You can see the complete reference documentation at [`xrpl.js` docs](https://js.xrpl.org). You can also generate them locally using `typedoc`:

```bash
npm run docgen
```

This updates `docs/` at the top level, where GitHub Pages looks for the docs.

## Update `definitions.json`

Use [this repo](https://github.com/RichardAH/xrpl-codec-gen) to generate a new `definitions.json` file from the rippled source code. Instructions are available in that README.

## Adding and removing packages

`xrpl.js` uses `lerna` and `npm`'s workspaces features to manage a monorepo.
Adding and removing packages requires a slightly different process than normal
as a result.

### Adding or removing development dependencies

`xrpl.js` strives to use the same development dependencies in all packages.
You may add and remove dev dependencies like normal:

```bash
### adding a new dependency
npm install --save-dev abbrev
### removing a dependency
npm uninstall --save-dev abbrev
```

### Adding or removing runtime dependencies

You need to specify which package is changing using the `-w` flag:

```bash
### adding a new dependency to `xrpl`
npm install abbrev -w xrpl
### adding a new dependency to `ripple-keypairs`
npm install abbrev -w ripple-keypairs
### removing a dependency
npm uninstall abbrev -w xrpl
```

## Release process

### Release

1. Ensure that all tests passed on the last CI that ran on `main`.

NOW WE ARE READY TO PUBLISH! No new code changes happen manually now.

2. Checkout `main` (or your beta branch) and `git pull`.
3. Create a new branch (`git checkout -b <BRANCH_NAME>`) to capture updates that take place during this process.
4. Update `HISTORY.md` to reflect release changes.
5. Run `npm run docgen` if the docs were modified in this release to update them (skip this step for a beta).
6. Run `npm run build` to triple check the build still works
7. Run `npx lerna version --no-git-tag-version` - This creates a draft PR and bumps the versions of the packages.
  * For each changed package, pick what the new version should be. Lerna will bump the versions, commit version bumps to `main`, and create a new git tag for each published package.
  * If publishing a beta, make sure that the versions are all of the form `a.b.c-beta.d`, where `a`, `b`, and `c` are identical to the last normal release except for one, which has been incremented by 1.
8. Run `npm i` to update the package-lock with the updated versions
9. Create a new PR from this branch into `main` and merge it (you can directly merge into the beta branch for a beta).
10. Checkout `main` and `git pull` (you can skip this step for a beta since you already have the latest version of the beta branch).
11. Run `npx lerna publish from-package --yes` - This will actually publish the packages.
  * NOTE: if you're releasing a beta, run `npx lerna publish from-package --dist-tag beta --yes` instead.
  * If it asks for it, enter your [npmjs.com](https://npmjs.com) OTP (one-time password) to complete publication.
12. Create a new branch (`git checkout -b <BRANCH_NAME>`)to capture the updated packages from the release. Merge those changes into `main`. (You can skip this step on a beta release).

NOW YOU HAVE PUBLISHED! But you're not done; we have to notify people!

13. Pull the most recent changes to main locally.
14. Run `git tag <tagname> -m <tagname>`, where `<tagname>` is the new package and version (e.g. `xrpl@2.1.1`), for each version released.
15. Run `git push --follow-tags`, to push the tags to Github.
16. On Github, click the "releases" link on the right-hand side of the page.
17. Click "Draft a new release"
18. Click "Choose a tag", and choose a tag that you just created.
19. Edit the name of the release to match the tag (IE \<package\>@\<version\>) and edit the description as you see fit.
20. Repeat steps 17-19 for each release.
21. Send an email to [xrpl-announce](https://groups.google.com/g/xrpl-announce).

## Mailing Lists

We have a low-traffic mailing list for announcements of new `xrpl.js` releases. (About 1 email every couple of weeks)

+ [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

+ [Subscribe to ripple-server](https://groups.google.com/g/ripple-server)
