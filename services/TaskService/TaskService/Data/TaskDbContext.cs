using Microsoft.EntityFrameworkCore;
using TaskService.Models;

namespace TaskService.Data;

public class TaskDbContext(DbContextOptions<TaskDbContext> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskItem>().ToTable("Tasks");
    }
}
