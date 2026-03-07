using System;
using System.Collections.Generic;
using System.Text;

namespace CostaRicaMusicBLL.Dtos
{
    public class CustomResponse<T> //forma de implementación
    {
        public bool esCorrecto { get; set; }
        public string mensaje { get; set; }
        public T Data { get; set; }
        public int codigoStatus { get; set; }


        public CustomResponse()
        {
            esCorrecto = true;
            mensaje = "Operación realizada correctamente."; //Operación realizada correctamente.
            codigoStatus = 200; // OK
        }
    }
}
