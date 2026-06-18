using Microsoft.EntityFrameworkCore;
using TaskManagement.Models;

namespace TaskManagement.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<TaskHistory> TaskHistories { get; set; }
        public DbSet<ProjectUser> ProjectUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(320).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.AvatarUrl).HasMaxLength(2048);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_Users_Username_NotEmpty", "length(trim(\"Username\")) > 0");
                    t.HasCheckConstraint("CK_Users_Email_NotEmpty", "length(trim(\"Email\")) > 0");
                });
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(4000);

                entity.HasOne(e => e.CreatedBy)
                    .WithMany(u => u.OwnedProjects)
                    .HasForeignKey(e => e.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_Projects_Name_NotEmpty", "length(trim(\"Name\")) > 0");
                    t.HasCheckConstraint("CK_Projects_EndDate", "\"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
                });
            });

            modelBuilder.Entity<ProjectUser>(entity =>
            {
                entity.HasKey(e => new { e.ProjectId, e.UserId });

                entity.HasOne(e => e.Project)
                    .WithMany(p => p.Members)
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Projects)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.Property(e => e.Title).HasMaxLength(300).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(8000);

                entity.HasOne(e => e.Project)
                    .WithMany(p => p.Tasks)
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Assignee)
                    .WithMany(u => u.AssignedTasks)
                    .HasForeignKey(e => e.AssigneeId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.CreatedBy)
                    .WithMany(u => u.CreatedTasks)
                    .HasForeignKey(e => e.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_Tasks_Title_NotEmpty", "length(trim(\"Title\")) > 0");
                    t.HasCheckConstraint("CK_Tasks_DueDate", "\"DueDate\" IS NULL OR \"DueDate\" >= \"CreatedAt\"");
                });
            });

            modelBuilder.Entity<Comment>(entity =>
            {
                entity.Property(e => e.Text).HasMaxLength(8000).IsRequired();

                entity.HasOne(e => e.Task)
                    .WithMany(t => t.Comments)
                    .HasForeignKey(e => e.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Comments)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.ToTable(t =>
                    t.HasCheckConstraint("CK_Comments_Text_NotEmpty", "length(trim(\"Text\")) > 0"));
            });

            modelBuilder.Entity<TaskHistory>(entity =>
            {
                entity.Property(e => e.Comment).HasMaxLength(2000);

                entity.HasOne(e => e.Task)
                    .WithMany(t => t.Histories)
                    .HasForeignKey(e => e.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ChangedBy)
                    .WithMany(u => u.TaskHistoryEntries)
                    .HasForeignKey(e => e.ChangedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
