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
    res.body instanceof $conversation.Bits ? res.body[0].buffer : res.body[0];

  return new Response(new Blob([body]), {
    status: res.status,
    headers: res.headers,
  });
}

export function readText(body) {
  return handleErrors(() => body.text());
}

export function readBits(body) {
  return handleErrors(
    async () => new $gleam.BitArray(new Uint8Array(await body.arrayBuffer()))
  );
}

export function readJson(body) {
  return handleErrors(() => body.json());
}

export function readForm(body) {
  return handleErrors(async () => {
    const formData = await body.formData();
    const values = [];
    const files = [];

    for (const [key, value] of formData) {
      if (value instanceof File) {
        files.push([
          key,
          new $conversation.UploadedFile(value.name, value.webkitRelativePath),
        ]);
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

async function handleErrors(cb) {
  try {
    return new $gleam.Ok(await cb());
  } catch (e) {
    let error;

    if (e instanceof TypeError && e.message === 'Body already consumed.') {
      error = new $conversation.AlreadyRead();
    } else if (e instanceof SyntaxError) {
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
