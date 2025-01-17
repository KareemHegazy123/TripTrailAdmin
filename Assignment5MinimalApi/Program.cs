using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Data.Sqlite;
using Dapper;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// SQLite connection string (adjust the path to your actual SQLite database)
var connectionString = "Data Source=data.db";

// Set WAL mode for SQLite once during application startup
using (var connection = new SqliteConnection(connectionString))
{
    await connection.OpenAsync();
    await connection.ExecuteAsync("PRAGMA journal_mode=WAL;");
}

// Serve default files and static files (index.html will be the default page)
app.UseDefaultFiles();
app.UseStaticFiles();

// API endpoint to retrieve all members (GET request)
app.MapGet("/members", async () =>
{
    using var connection = new SqliteConnection(connectionString);
    var members = await connection.QueryAsync<Member>("SELECT id, name, email, package_type AS PackageType FROM members");
    return Results.Ok(members);
});

// API endpoint to insert a new member (POST request)
app.MapPost("/members", async (Member member) =>
{
    const int maxRetries = 5;
    const int delayBetweenRetriesMs = 500;

    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            using var connection = new SqliteConnection(connectionString);
            await connection.OpenAsync();

            var sql = "INSERT INTO members (name, email, package_type) VALUES (@Name, @Email, @PackageType)";
            var result = await connection.ExecuteAsync(sql, member);

            if (result == 1)
            {
                return Results.Created($"/members/{member.Id}", new { message = "Member created successfully", member });
            }
            else
            {
                return Results.Json(new { error = "Failed to create member." });
            }
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 5) // SQLite Error 5: Database is locked
        {
            if (attempt == maxRetries)
            {
                return Results.Json(new { error = "Database is locked. Please try again later." });
            }
            await Task.Delay(delayBetweenRetriesMs);
        }
    }

    return Results.Json(new { error = "Unexpected error occurred." });
});

// API endpoint to delete a member by ID
app.MapDelete("/members/{id}", async (int id) =>
{
    try
    {
        using var connection = new SqliteConnection(connectionString);
        var sql = "DELETE FROM members WHERE id = @Id";
        var result = await connection.ExecuteAsync(sql, new { Id = id });

        if (result == 0)
        {
            return Results.NotFound(new { message = "Member not found" });
        }

        return Results.Ok(new { message = "Member deleted successfully" });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// API endpoint to retrieve all admins (GET request)
app.MapGet("/admins", async () =>
{
    using var connection = new SqliteConnection(connectionString);
    var admins = await connection.QueryAsync<Admin>("SELECT id, username FROM admins"); // Exclude password for security
    return Results.Ok(admins);
});

// API endpoint to add a new admin (POST request)
app.MapPost("/add-admin", async (AdminLogin newAdmin) =>
{
    using var connection = new SqliteConnection(connectionString);
    var sql = "INSERT INTO admins (username, password) VALUES (@Username, @Password)";
    
    var result = await connection.ExecuteAsync(sql, newAdmin);

    return result == 1 
        ? Results.Ok(new { message = "Admin added successfully" })
        : Results.BadRequest(new { error = "Failed to add admin" });
});

// API endpoint for admin login
app.MapPost("/admin/login", async (HttpRequest request) =>
{
    var loginData = await request.ReadFromJsonAsync<AdminLogin>();

    if (loginData == null)
    {
        return Results.Json(new { error = "Invalid request data" }, statusCode: 400);
    }

    using var connection = new SqliteConnection(connectionString);
    
    // Check if admin exists in database
    var admin = await connection.QueryFirstOrDefaultAsync<Admin>(
        "SELECT * FROM admins WHERE username = @Username AND password = @Password",
        new { Username = loginData.Username, Password = loginData.Password }
    );

    if (admin != null)
    {
        return Results.Json(new { message = "Login successful" }, statusCode: 200);
    }
    else
    {
        // Return JSON response with status code 401 for unauthorized
        return Results.Json(new { error = "Invalid username or password" }, statusCode: 401);
    }
});

// Run the application
app.Run();

// Class definitions

public class AdminLogin
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class Member
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PackageType { get; set; } = string.Empty;
}

public class Admin
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    // Password is omitted for security in get requests
}
