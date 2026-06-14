using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKNAR.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDiseaseRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
       name: "DiseaseRecommendations",
       columns: table => new
       {
           Id = table.Column<int>(type: "int", nullable: false)
               .Annotation("SqlServer:Identity", "1, 1"),
           DiseaseName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
           Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
           Treatment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
           Prevention = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
           RiskLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
           SeasonWarning = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
       },
       constraints: table =>
       {
           table.PrimaryKey("PK_DiseaseRecommendations", x => x.Id);
       });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DiseaseRecommendations");
        }
    }
}
