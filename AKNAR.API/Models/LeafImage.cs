using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;


public partial class LeafImage
{

    public int Id { get; set; }

   
    public int OrchardId { get; set; }

  
    public string FilePath { get; set; } = null!;

 
    public DateTime UploadedAt { get; set; }

    public int? PredictionId { get; set; }


    public virtual Orchard Orchard { get; set; } = null!;

    public virtual Mlprediction? Mlprediction { get; set; }
}
