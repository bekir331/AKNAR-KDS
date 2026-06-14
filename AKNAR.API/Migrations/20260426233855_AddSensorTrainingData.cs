using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSensorTrainingData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            /*
            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Orchards",
                type: "decimal(18,10)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Orchards",
                type: "decimal(18,10)",
                nullable: true);
            */

            migrationBuilder.CreateTable(
                name: "SensorKdsReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrchardId = table.Column<int>(type: "int", nullable: false),
                    Score = table.Column<double>(type: "float", nullable: false),
                    Advice = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SensorKdsReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SensorKdsReports_Orchards_OrchardId",
                        column: x => x.OrchardId,
                        principalTable: "Orchards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SensorKdsReports_OrchardId",
                table: "SensorKdsReports",
                column: "OrchardId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SensorKdsReports");

            /*
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Orchards");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Orchards");
            */
        }
    }
}
