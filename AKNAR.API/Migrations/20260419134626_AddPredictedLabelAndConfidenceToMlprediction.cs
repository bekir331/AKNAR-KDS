using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPredictedLabelAndConfidenceToMlprediction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Confidence",
                table: "MLPredictions",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PredictedLabel",
                table: "MLPredictions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Confidence",
                table: "MLPredictions");

            migrationBuilder.DropColumn(
                name: "PredictedLabel",
                table: "MLPredictions");
        }
    }
}
