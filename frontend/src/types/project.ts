// A portfolio project on the public website, as returned by GET /api/public/projects?lang=da|en.
// Texts are already in the requested language.
export interface Project {
    id: string;
    title: string;
    tags: string[];
    intro: string;
    body: string;          // HTML (<h4>, <p>) written by Innopixel's administrators
    image: string | null;
    client: string;
    tech: string;
}
