import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeRenderer } from "src/public-api";

@Component({
	selector: "home-page",
	standalone: true,
	imports: [RouterLink, InteropCodeRenderer],
	templateUrl: "./home-page.html",
	styleUrl: "./home-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
