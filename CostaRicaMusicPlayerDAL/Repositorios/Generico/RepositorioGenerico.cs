using Microsoft.EntityFrameworkCore;
using CostaRicaMusicDAL.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace CostaRicaMusicDAL.Repositorios.Generico
{
    public class RepositorioGenerico<T> : IRepositorioGenerico<T> where T : class
    {
        private readonly CostaRicaMusicDbContext _context;
        private readonly DbSet<T> _dbSet;

        public RepositorioGenerico(CostaRicaMusicDbContext context) //Inyección de dependencias
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public void ActualizarAsync(T entidad)
        {
            var entityType = _context.Model.FindEntityType(typeof(T));
            var primaryKey = entityType?.FindPrimaryKey();

            if (primaryKey != null)
            {
                var keyValues = primaryKey.Properties
                    .Select(property => _context.Entry(entidad).Property(property.Name).CurrentValue)
                    .ToArray();

                var trackedEntity = _dbSet.Local.FirstOrDefault(localEntity =>
                {
                    var localEntry = _context.Entry(localEntity);
                    var localKeyValues = primaryKey.Properties
                        .Select(property => localEntry.Property(property.Name).CurrentValue);

                    return localKeyValues.SequenceEqual(keyValues);
                });

                if (trackedEntity != null && !ReferenceEquals(trackedEntity, entidad))
                {
                    _context.Entry(trackedEntity).State = EntityState.Detached;
                }
            }

            _dbSet.Update(entidad);
        }

        public void AgregarAsync(T entidad)
        {
            _dbSet.Add(entidad);
        }

        public void EliminarAsync(int id)
        {
            var entidad = _dbSet.Find(id);
            if (entidad != null)
            {
                _dbSet.Remove(entidad);
            }
        }

        public async Task<bool> GuardarCambiosAsync()
        {
            var resultado = await _context.SaveChangesAsync();

            return resultado > 0; //Si el resultado es mayor a 0, significa que se guardaron los cambios correctamente, por lo tanto, devuelve true. Si el resultado es 0 o menor, significa que no se guardaron los cambios, por lo tanto, devuelve false.
        }

        public async Task<T> ObtenerPorIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        public async Task<List<T>> ObtenerTodosAsync()
        {
            return await _dbSet.ToListAsync();
        }
    }
}
