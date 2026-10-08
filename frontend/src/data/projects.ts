import type { Project } from "../types/project";

// Will later be fetched from the ASP.NET Core API
export const projects: Project[] = [
    {
        id: "lillebaelt-ar",
        image: "/images/project_lillebaelt.png",
        client: "Naturpark Lillebælt",
        tech: "Unity, AR Foundation, C#, Blender",
    },
    {
        id: "sensible-xr",
        image: "/images/project_turbine.png",
        client: "Sensible ApS",
        tech: "WebXR, Three.js, JavaScript, AI Diagnostics",
    },
    {
        id: "veterandykkerne",
        image: "/images/project_dive.png",
        client: "Veterandykkerne Forening & SDU",
        tech: "Unity, WebGL, 3D Modellering, Spatial Audio",
    },
    {
        id: "nfc-display",
        image: "/images/project_nfc.jpg",
        client: "ErhvervsTanken & Dansk Metal",
        tech: "NFC, 3D Scanning, Arduino, Node.js",
    },
    {
        id: "lillebaelt-vr",
        image: "/images/project_lillebaelt_vr.png",
        client: "Naturpark Lillebælt",
        tech: "Unity, Meta XR SDK, Blender, Oculus Quest",
    },
    {
        id: "jelling-metaverse",
        image: "/images/project_jelling.png",
        client: "Kongernes Jelling (Nationalmuseet)",
        tech: "SynergyXR, Unity, VR/AR, Multi-User Meta",
    },
];
