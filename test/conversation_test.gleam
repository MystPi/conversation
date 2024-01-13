import gleam/http
import gleam/http/request.{type Request as HttpRequest}
import gleam/http/response.{type Response as HttpResponse}
import gleam/javascript/promise.{type Promise}
import conversation.{
  type JsRequest, type JsResponse, type RequestBody, type ResponseBody, Text,
  translate_request, translate_response,
}

type Response =
  Promise(HttpResponse(ResponseBody))

type Request =
  HttpRequest(RequestBody)

pub fn main() {
  serve(handler)
}

/// This is the server wrapper, where all the magic happens.
fn serve(handler: fn(Request) -> Response) -> Nil {
  deno_serve(fn(req) {
    // Translate the JsRequest into a Gleam Request
    translate_request(req)
    // Pass it to the handler, which returns a Gleam Response
    |> handler
    // Translate the response into a JsResponse, which in turn will get sent to
    // the client
    |> promise.map(translate_response)
  })
}

/// ./serve.mjs is only a single line:
///
///     export const serve = Deno.serve;
///
/// Since `conversation` handles type conversions for us, very little external
/// JavaScript needs to be written.
@external(javascript, "./serve.mjs", "serve")
fn deno_serve(handler: fn(JsRequest) -> Promise(JsResponse)) -> Nil

fn handler(req: Request) -> Response {
  case req.method {
    http.Get -> show_form()
    http.Post -> handle_form_submission(req)
    _ -> text_resp("Method not allowed", 405)
  }
}

fn show_form() -> Response {
  "<form method='post'>
    <label>Title:
      <input type='text' name='title'>
    </label>
    <label>Name:
      <input type='text' name='name'>
    </label>
    <input type='submit' value='Submit'>
  </form>"
  |> html_resp(200)
}

fn handle_form_submission(req: Request) -> Response {
  use formdata <- promise.await(conversation.read_form(req.body))

  case formdata {
    Ok(formdata) -> {
      case formdata.values {
        // Since FormData values are sorted alphabetically, we can safely pattern
        // match on them. Here we have gotten both a name and title.
        [#("name", name), #("title", title)] -> {
          // Remember to always do HTML escaping in real applications. Never trust
          // the client!
          "Hi, " <> title <> " " <> name <> "!"
        }
        // Since required data is missing, we give a generic greeting.
        _ -> "Hi there!"
      }
      |> html_resp(200)
    }
    Error(_) -> text_resp("Bad request", 400)
  }
}

fn text_resp(text: String, status: Int) -> Response {
  response.new(status)
  |> response.set_body(Text(text))
  |> promise.resolve
}

fn html_resp(html: String, status: Int) -> Response {
  response.new(status)
  |> response.set_body(Text(html))
  |> response.set_header("content-type", "text/html")
  |> promise.resolve
}
