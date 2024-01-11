export function serve(handler) {
  Deno.serve((req) => handler(req));
}
