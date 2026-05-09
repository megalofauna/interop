import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeRenderer } from 'interop';

@Component({
	selector: "home-page",
	standalone: true,
	imports: [RouterLink, InteropCodeRenderer],
	templateUrl: "./home-page.html",
	styleUrl: "./home-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
