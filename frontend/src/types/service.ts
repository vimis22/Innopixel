// A service on the public website, as returned by GET /api/public/services?lang=da|en.
export interface Service {
    id: string;
    icon: string;          // e.g. "vr"; mapped to an icon component in ServicesSection
    title: string;
    description: string;
}
