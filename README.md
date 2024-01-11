# conversation

[![Package Version](https://img.shields.io/hexpm/v/conversation)](https://hex.pm/packages/conversation)
[![Hex Docs](https://img.shields.io/badge/hex-docs-ffaff3)](https://hexdocs.pm/conversation/)

Gleam bindings for the standard JavaScript [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) APIs.

## Installation

This package can be added to your Gleam project:

```sh
gleam add conversation
```

and its documentation can be found at <https://hexdocs.pm/conversation>.

## Example Usage

An example wrapper for `Deno.serve` that uses `conversation` can be found in [./test](./test/). The example can be run with the command `gleam test`.