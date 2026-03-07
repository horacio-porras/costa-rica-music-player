namespace CostaRicaMusic.Middleware
{
    public class MiddlewareGlobalExceptionHandler
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<MiddlewareGlobalExceptionHandler> _logger;


        public MiddlewareGlobalExceptionHandler(RequestDelegate next, ILogger<MiddlewareGlobalExceptionHandler> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context) 
        {

            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
      
        }


        private async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            _logger.LogError(ex, "Ocurrió una excepción no controlada.");

            ExceptionResponse response = ex switch
            {
                NotImplementedException => new ExceptionResponse(System.Net.HttpStatusCode.BadRequest, "Funcionalidad no implementada."),
                ApplicationException => new ExceptionResponse(System.Net.HttpStatusCode.BadRequest, "Error en la aplicación"),
                _ => new ExceptionResponse(System.Net.HttpStatusCode.InternalServerError, "Ocurrió un error inesperado.")   
            };

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)response.statusCode;
            await context.Response.WriteAsJsonAsync(response);

        }

        //SOLID

        //PRINCIOPIO DE RESPONSABILIDAD UNICA (SRP): La clase MiddlewareGlobalExceptionHandler tiene una única responsabilidad, que es manejar las excepciones globales en la aplicación. No se encarga de otras tareas como la lógica de negocio o el acceso a datos, lo que facilita su mantenimiento y comprensión.
        //PRINCIPIO DE ABIERTO/CERRADO (OCP): La clase está abierta para la extensión pero cerrada para la modificación. Si se desea agregar un nuevo tipo de excepción, se puede hacer extendiendo el método HandleExceptionAsync sin modificar el código existente, lo que reduce el riesgo de introducir errores.
        //PRINCIPIO DE SUSTITUCIÓN DE LISKOV (LSP): La clase MiddlewareGlobalExceptionHandler puede ser utilizada en cualquier lugar donde se espere un middleware de ASP.NET Core, sin que el comportamiento del programa se vea afectado. Esto permite que la clase sea fácilmente integrable en la cadena de middleware.
        //PRINCIPIO DE SEGREGACIÓN DE INTERFACES (ISP): La clase no implementa interfaces innecesarias, lo que evita que los clientes dependan de métodos que no utilizan. En este caso, la clase se enfoca únicamente en manejar excepciones, sin imponer métodos adicionales.
        //PRINCIPIO DE INVERSIÓN DE DEPENDENCIAS (DIP): La clase depende de abstracciones (como ILogger) en lugar de concretos, lo que permite una mayor flexibilidad y facilita la prueba unitaria. Esto también permite que la clase sea fácilmente testeable y desacoplada de implementaciones específicas de logging.





    }
}
