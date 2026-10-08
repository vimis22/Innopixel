import type { ComponentType } from "react";
import { BrowserIcon, CodeIcon, CubeIcon, MapPinIcon, type IconProps } from "../components/icons/Icons";

export interface Service {
    key: string;                      // servicesPage.<key>Title / servicesPage.<key>Desc in translations.json
    Icon: ComponentType<IconProps>;
}

export const services: Service[] = [
    { key: "vr", Icon: CubeIcon },
    { key: "ar", Icon: MapPinIcon },
    { key: "modeling", Icon: CodeIcon },
    { key: "web", Icon: BrowserIcon },
];
