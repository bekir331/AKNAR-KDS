using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToOrchard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Orchards",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Orchards");
        }
    }
}
