using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLeafImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LeafImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrchardId = table.Column<int>(type: "int", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    PredictionId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeafImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeafImages_MLPredictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "MLPredictions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LeafImages_Orchards_OrchardId",
                        column: x => x.OrchardId,
                        principalTable: "Orchards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeafImages_OrchardId",
                table: "LeafImages",
                column: "OrchardId");

            migrationBuilder.CreateIndex(
                name: "IX_LeafImages_PredictionId",
                table: "LeafImages",
                column: "PredictionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeafImages");
        }
    }
}
