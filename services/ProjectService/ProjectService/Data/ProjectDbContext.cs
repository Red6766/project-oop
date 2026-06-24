using Microsoft.EntityFrameworkCore;
using ProjectService.Models;

namespace ProjectService.Data;

public class ProjectDbContext(DbContextOptions<ProjectDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(project => project.Name).HasMaxLength(200).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(2000);
            entity.HasMany(project => project.Members)
                .WithOne(member => member.Project)
                .HasForeignKey(member => member.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(member => new { member.ProjectId, member.UserId });
            entity.HasIndex(member => member.UserId);
        });
    }
}
