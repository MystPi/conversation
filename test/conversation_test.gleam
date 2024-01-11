import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/javascript/promise.{type Promise}
import conversation.{
  type JsRequest, type JsResponse, type RequestBody, type ResponseBody, Text,
  translate_request, translate_response,
}

pub fn main() {
  serve(fn(req) {
    let body = "Hello at " <> req.path <> "!"

    response.new(200)
    |> response.set_body(Text(body))
    |> promise.resolve
  })
}

fn serve(
  handler: fn(Request(RequestBody)) -> Promise(Response(ResponseBody)),
) -> Nil {
  deno_serve(fn(req) {
    translate_request(req)
    |> handler
    |> promise.map(translate_response)
  })
}

@external(javascript, "./serve.mjs", "serve")
fn deno_serve(handler: fn(JsRequest) -> Promise(JsResponse)) -> Nil
