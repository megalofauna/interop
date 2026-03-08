import { Component, input } from "@angular/core";
import { InteropIcon } from "src/lib/components/interop-icon/interop-icon";
import { SiteNavigation } from "../site-navigation/site-navigation";

type SiteHeaderMeta = {
	version: string;
};

@Component({
	selector: "[dtx-site-header]",
	imports: [InteropIcon, SiteNavigation],
	templateUrl: "./site-header.html",
	styleUrl: "./site-header.scss",
})
export class SiteHeader {
	meta = input<SiteHeaderMeta>({ version: "" });
}
