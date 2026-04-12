**Grupo B:**
- Cheryl Robles Quesada
- Adrian Morales Robles
- Marypaz Vargas Arce
- Horacio Porras Marin

**Repositorio:**
- https://github.com/horacio-porras/costa-rica-music-player

---

Especificación básica del proyecto

1) Arquitectura del proyecto
- La solución contiene varios proyectos en capas:
  - `CostaRicaMusicPlayer` (Aplicación web ASP.NET Core con vistas Razor - Controllers + Views)
  - `CostaRicaMusicPlayerBLL` (Capa de negocio / servicios)
  - `CostaRicaMusicPlayerDAL` (Capa de datos / entidades y repositorios)
  - `CostaRicaMusicPlayerAPI` (API separada incluida, para la funcionalidad del Login)
- Organización: Presentación -> Servicios (BLL) -> Acceso a datos (DAL). Separación de responsabilidades para facilitar pruebas y mantenimiento.

2) Libraries / paquetes NuGet principales
- `Microsoft.EntityFrameworkCore` (EF Core)
- `Microsoft.EntityFrameworkCore.Sqlite` (uso de SQLite según `Program.cs`)
- `AutoMapper` y `AutoMapper.Extensions.Microsoft.DependencyInjection` (mapeo entre entidades y DTOs)
- Paquetes de ASP.NET Core para MVC y sesión (`Microsoft.AspNetCore.Mvc`, `Microsoft.AspNetCore.Session`)

3) Principios SOLID y patrones de diseño utilizados
- Principios SOLID aplicados:
  - SRP: separación de responsabilidades en capas y clases con responsabilidad única.
  - OCP: extensibilidad mediante interfaces y servicios.
  - LSP: diseño orientado a interfaces y herencia limitada en entidades.
  - ISP: interfaces específicas por servicio (`IPlaylistServicio`, `IAlbumServicio`, etc.).
  - DIP: inyección de dependencias y uso de interfaces para repositorios y servicios.
  
- Patrones de diseño:
  - Repositorio genérico (`RepositorioGenerico<T>`) para abstracción del acceso a datos.
  - Service Layer (servicios en `CostaRicaMusicPlayerBLL`) para concentrar la lógica de negocio.
  - Mapper (AutoMapper) para transformaciones entidad <-> DTO.
  - Inyección de dependencias (DI) para componer servicios y repositorios.


---



