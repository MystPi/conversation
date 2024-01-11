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
  return body.text();
}

export async function readBits(body) {
  return new $gleam.BitArray(new Uint8Array(await body.arrayBuffer()));
}

export function readJson(body) {
  return body.json();
}

function maybe(x) {
  if (x) {
    return new $option.Some(x);
  }
  return new $option.None();
}
