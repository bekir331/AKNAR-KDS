using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrchardBoundaries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Boundaries",
                table: "Orchards",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Boundaries",
                table: "Orchards");
        }
    }
}
