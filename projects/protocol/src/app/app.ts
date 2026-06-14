import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Header } from "./shell/header/header";
import { Footer } from "./shell/footer/footer";

@Component({
	selector: "[app-root]",
	imports: [RouterOutlet, Header, Footer],
	template: `
		<header ptx-header></header>
		<main>
			<router-outlet />
		</main>
		<footer ptx-footer></footer>
	`,
})
export class App {}
