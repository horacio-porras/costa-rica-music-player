using System;
using System.Collections.Generic;
using System.Text;

namespace CostaRicaMusicDAL.Repositorios.Generico
{
    public interface IRepositorioGenerico<T> where T : class //Clase T, es decir, cualquier clase que se le pase como tipo genérico, debe ser una clase (no puede ser un tipo primitivo como int, string, etc.). Esto asegura que el repositorio genérico solo trabaje con entidades que son clases, lo cual es común en el contexto de acceso a datos y operaciones CRUD.
    {
        Task<T> ObtenerPorIdAsync(int id);
        Task<List<T>> ObtenerTodosAsync();
        void AgregarAsync(T entidad);
        void ActualizarAsync(T entidad);
        void EliminarAsync(int id);



        //Confirmación
        Task<bool> GuardarCambiosAsync(); //SavesChanges, se puede usar para confirmar los cambios en la base de datos, es decir, para guardar los cambios realizados en las operaciones CRUD. El método devuelve un booleano que indica si los cambios se guardaron correctamente o no.


    }
}
