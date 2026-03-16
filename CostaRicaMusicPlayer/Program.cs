using Microsoft.EntityFrameworkCore;
using CostaRicaMusicBLL;
using CostaRicaMusicBLL.Servicios.Artists;
using CostaRicaMusicBLL.Servicios.Playlists;
using CostaRicaMusicBLL.Servicios.Songs;
using CostaRicaMusicBLL.Servicios.Albums;
using CostaRicaMusicBLL.Servicios.Auth;
using CostaRicaMusicDAL.Data;
using CostaRicaMusicDAL.Repositorios.Generico;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// DbContext
builder.Services.AddDbContext<CostaRicaMusicDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositorio genérico
builder.Services.AddScoped(typeof(IRepositorioGenerico<>), typeof(RepositorioGenerico<>));

// Servicios de dominio
builder.Services.AddScoped<ISongServicio, SongServicio>();
builder.Services.AddScoped<IArtistServicio, ArtistServicio>();
builder.Services.AddScoped<IPlaylistServicio, PlaylistServicio>();
builder.Services.AddScoped<IAlbumServicio, AlbumServicio>();
builder.Services.AddScoped<IAuthServicio, AuthServicio>();

builder.Services.AddSingleton<IHostEnvironment>(builder.Environment);

// AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<MapeoClases>();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseSession();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
