import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/javascript/promise.{type Promise}
import gleam/dynamic.{type Dynamic}

/// A standard JavaScript [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request).
pub type JsRequest

/// A standard JavaScript [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).
pub type JsResponse

/// The body of an incoming request. It must be read with functions like
/// [`read_text`](#read_text), and can only be read once.
pub type RequestBody

/// Body type for an outgoing response.
///
/// ```
/// import gleam/http/response
/// import conversation.{Text}
///
/// response.new(200)
/// |> response.set_body(Text("Hello, world!"))
/// ```
pub type ResponseBody {
  Text(String)
  Bits(BitArray)
}

/// Data parsed from form sent in a request's body.
pub type FormData {
  FormData(
    /// String values of the form's fields, sorted alphabetically.
    values: List(#(String, String)),
    /// Uploaded files, sorted alphabetically by file name.
    files: List(#(String, UploadedFile)),
  )
}

/// File uploaded from the client.
pub type UploadedFile {
  UploadedFile(
    /// The name that was given to the file in the form.
    /// This is user input and should not be trusted.
    file_name: String,
    /// The location of the file on the server.
    /// This is a temporary file and will be deleted when the request has
    /// finished being handled.
    path: String,
  )
}

/// Translates a [`JsRequest`](#JsRequest) into a Gleam
/// [`Request`](https://hexdocs.pm/gleam_http/gleam/http/request.html#Request).
@external(javascript, "./ffi.mjs", "translateRequest")
pub fn translate_request(req: JsRequest) -> Request(RequestBody)

/// Translates a Gleam [`Response`](https://hexdocs.pm/gleam_http/gleam/http/response.html#Response)
/// into a [`JsResponse`](#JsResponse).
@external(javascript, "./ffi.mjs", "translateResponse")
pub fn translate_response(res: Response(ResponseBody)) -> JsResponse

/// Read a request body as text.
@external(javascript, "./ffi.mjs", "readText")
pub fn read_text(body: RequestBody) -> Promise(Result(String, Nil))

/// Read a request body as a BitArray.
@external(javascript, "./ffi.mjs", "readBits")
pub fn read_bits(body: RequestBody) -> Promise(Result(BitArray, Nil))

/// Read a request body as JSON, returning a
/// [`Dynamic`](https://hexdocs.pm/gleam_stdlib/gleam/dynamic.html#Dynamic) value
/// which can then be decoded with [`gleam_json`](https://hexdocs.pm/gleam_json/).
@external(javascript, "./ffi.mjs", "readJson")
pub fn read_json(body: RequestBody) -> Promise(Result(Dynamic, Nil))

/// Read a request body as [`FormData`](#FormData).
@external(javascript, "./ffi.mjs", "readForm")
pub fn read_form(body: RequestBody) -> Promise(Result(FormData, Nil))
