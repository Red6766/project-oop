using Microsoft.EntityFrameworkCore;

namespace ProjectService.Data;

public static class ProjectDatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<ProjectDbContext>();

        await database.Database.EnsureCreatedAsync();
        await database.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "ProjectMembers" (
                "ProjectId" integer NOT NULL,
                "UserId" integer NOT NULL,
                "Role" text NOT NULL DEFAULT 'member',
                CONSTRAINT "PK_ProjectMembers" PRIMARY KEY ("ProjectId", "UserId"),
                CONSTRAINT "FK_ProjectMembers_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
            );
            ALTER TABLE "ProjectMembers" ADD COLUMN IF NOT EXISTS "Role" text NOT NULL DEFAULT 'member';
            CREATE INDEX IF NOT EXISTS "IX_ProjectMembers_UserId" ON "ProjectMembers" ("UserId");
            UPDATE "ProjectMembers" SET "Role" = 'admin' WHERE "Role" = 'member' AND ("ProjectId", "UserId") IN (SELECT "Id", "CreatedById" FROM "Projects" WHERE "CreatedById" > 0);
            INSERT INTO "ProjectMembers" ("ProjectId", "UserId", "Role")
            SELECT "Id", "CreatedById", 'admin' FROM "Projects"
            WHERE "CreatedById" > 0
            ON CONFLICT DO NOTHING;
            """);
    }
}
