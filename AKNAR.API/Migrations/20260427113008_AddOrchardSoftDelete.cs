using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrchardSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeactivatedAt",
                table: "Orchards",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Orchards",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeactivatedAt",
                table: "Orchards");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Orchards");
        }
    }
}
