# Contributing Guide

This guide explains how to contribute to Erupt. Please take a few minutes to read it before opening an **issue** or a **pull request**.

## Code of Conduct

We have a [Code of Conduct](https://github.com/erupts/erupt/blob/master/CODE_OF_CONDUCT.md) that we expect every contributor to follow. Please take the time to read it so you know what is and is not acceptable.

## Transparent Development

All our work happens on [GitHub](https://github.com/erupts/erupt). Both core-team members and external contributors go through the same pull-request review process.

## Bugs

We use [GitHub Issues](https://github.com/erupts/erupt/issues) for bug tracking.

Before filing a bug, please search the existing issues and read the [FAQ](/en/guide/faq).

## First-time Contribution

If you are new to opening Pull Requests on GitHub, the following resources can help:

- [How to contribute to open source](https://opensource.guide/how-to-contribute/)
- [First Contributions](https://github.com/firstcontributions/first-contributions)

## Code Contributions

The Erupt team monitors every Pull Request. We review and merge your code, and we may ask for changes or explain why we cannot accept a particular contribution.

## How to Open a Pull Request

1. Fork the `erupt` repository. All subsequent steps happen in your fork.
2. From the `master` branch run: `git remote add upstream https://github.com/erupts/erupt`
3. From the `master` branch run: `git pull upstream master`
4. From the `master` branch run: `git push origin master`
5. Switch to the feature branch you are working on (e.g. `docs-fix`): `git checkout docs-fix`
6. On the `docs-fix` branch run: `git rebase origin/master`
7. Make your changes on the `docs-fix` branch and commit them: `git commit -a`
8. Push your code: `git push` (may need `-f`)
9. Open a Pull Request on GitHub
