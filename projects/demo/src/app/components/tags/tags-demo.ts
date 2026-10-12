import { Component, signal } from "@angular/core";
import { type TagAddDetail } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { InteropTagInput, InteropTags } from "interop/tags";
import { examples } from "./tags-examples";

@Component({
	selector: "demo-tags",
	imports: [InteropCodeBlock, InteropIcon, InteropTagInput, InteropTags],
	templateUrl: "./tags-demo.html",
	styleUrl: "./tags-demo.css",
})
export class TagsDemo {
	protected readonly examples = examples;
	protected readonly filters = signal([
		"In stock",
		"Under $50",
		"Free delivery",
		"4 stars and up",
		"Ships to every country in the European Economic Area within five working days",
	]);
	protected readonly alreadyAdded = (value: string) => `${value} is already added.`;
	protected readonly skills = signal(["Angular", "CSS"]);
	protected readonly saved = signal<string | null>(null);
	protected readonly sizes = [
		{ value: "sm", label: "Small" },
		{ value: null, label: "Default" },
		{ value: "lg", label: "Large" },
	];

	protected removeFilter(filter: string): void {
		this.filters.update((filters) => filters.filter((f) => f !== filter));
	}

	protected addSkill(event: Event): void {
		const { value } = (event as CustomEvent<TagAddDetail>).detail;
		if (this.skills().includes(value)) event.preventDefault();
		else this.skills.update((skills) => [...skills, value]);
	}

	protected removeSkill(skill: string): void {
		this.skills.update((skills) => skills.filter((s) => s !== skill));
	}

	protected submit(event: SubmitEvent): void {
		event.preventDefault();
		this.saved.set(new FormData(event.target as HTMLFormElement).getAll("skills").join(", "));
	}
}
