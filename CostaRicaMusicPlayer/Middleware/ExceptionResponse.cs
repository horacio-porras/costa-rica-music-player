using System.Net;

namespace CostaRicaMusic.Middleware
{
    public record ExceptionResponse(HttpStatusCode statusCode, string description);

}
