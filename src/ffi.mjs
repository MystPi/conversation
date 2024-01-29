import * as $gleam from './gleam.mjs';
import * as $http from '../gleam_http/gleam/http.mjs';
import * as $request from '../gleam_http/gleam/http/request.mjs';
import * as $option from '../gleam_stdlib/gleam/option.mjs';
import * as $conversation from './conversation.mjs';

export function translateRequest(req) {
  const url = new URL(req.url);

  const method = $http.parse_method(req.method)[0];
  const headers = $gleam.List.fromArray([...req.headers]);
  const body = req;
  const scheme =
    url.protocol === 'https:' ? new $http.Https() : new $http.Http();
  const host = url.hostname;
  const port = maybe(+url.port);
  const path = url.pathname;
  const query = maybe(url.search.slice(1));

  return new $request.Request(
    method,
    headers,
    body,
    scheme,
    host,
    port,
    path,
    query
  );
}

export function translateResponse(res) {
  const body =
    res.body instanceof $conversation.Bits
      ? new Blob([res.body[0].buffer])
      : res.body[0];

  return new Response(body, {
    status: res.status,
    headers: res.headers,
  });
}

export function readText(body) {
  return safeRead(body, () => body.text());
}

export function readBits(body) {
  return safeRead(
    body,
    async () => new $gleam.BitArray(new Uint8Array(await body.arrayBuffer()))
  );
}

export function readJson(body) {
  return safeRead(body, () => body.json());
}

export function readForm(body) {
  return safeRead(body, async () => {
    const formData = await body.formData();
    const values = [];
    const files = [];

    for (const [key, value] of formData) {
      if (value instanceof File) {
        files.push([key, new $conversation.UploadedFile(value.name)]);
      } else {
        values.push([key, value]);
      }
    }

    return new $conversation.FormData(
      $gleam.List.fromArray(sortTuples(values)),
      $gleam.List.fromArray(sortTuples(files))
    );
  });
}

async function safeRead(body, cb) {
  // If the body has already been read, return an AlreadyRead error
  if (body.bodyUsed) return new $gleam.Error(new $conversation.AlreadyRead());

  try {
    return new $gleam.Ok(await cb());
  } catch (e) {
    let error;

    // .json() throws a SyntaxError when parsing invalid JSON
    // .formData() throws a TypeError when the form data is invalid
    // From the spec, these seem to be the only two exceptions we need to handle.
    // (https://fetch.spec.whatwg.org/#dom-body-arraybuffer)
    // Any other exception is a generic ReadError
    if (e instanceof SyntaxError || e instanceof TypeError) {
      error = new $conversation.ParseError(e.message);
    } else {
      error = new $conversation.ReadError(e.message);
    }

    return new $gleam.Error(error);
  }
}

function sortTuples(x) {
  return x.sort((a, b) => {
    if (a[0] < b[0]) {
      return -1;
    }
    if (a[0] > b[0]) {
      return 1;
    }
    return 0;
  });
}

function maybe(x) {
  if (x) {
    return new $option.Some(x);
  }
  return new $option.None();
}
