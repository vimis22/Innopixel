namespace Innopixel.Projects.Domain;

public class CategoryList
{
    public int Id { get; set; }

    // Et projekt har højst én primær kategori.
    public bool IsPrimary { get; set; }

    public int ProjectsId { get; set; }
    public int CategoryId { get; set; }
}
