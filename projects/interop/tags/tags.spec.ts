import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type TagAddDetail } from 'interop';
import { InteropTagInput, InteropTags } from './tags';

@Component({
	imports: [InteropTags, InteropTagInput],
	template: `
		<ul #list interop-tags role="list" aria-label="Tags" [fallback]="entry">
			@for (tag of tags(); track tag) {
				<li>{{ tag }} <button type="button" (click)="remove(tag)">Remove {{ tag }}</button></li>
			}
		</ul>
		<input #entry interop-tag-input [tags]="list" (interop-tags-add)="add($any($event).detail)" />
	`,
})
class Host {
	readonly tags = signal(['Football', 'Cricket']);
	add(detail: TagAddDetail) {
		this.tags.update((tags) => [...tags, detail.value]);
	}
	remove(tag: string) {
		this.tags.update((tags) => tags.filter((t) => t !== tag));
	}
}

describe('InteropTags and InteropTagInput', () => {
	it('adds a tag from the input, and keeps focus when a tag is removed', async () => {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		TestBed.tick();
		const el = fixture.nativeElement as HTMLElement;
		const input = el.querySelector('input')!;
		input.value = 'Rugby';
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		TestBed.tick();
		expect(fixture.componentInstance.tags()).toEqual(['Football', 'Cricket', 'Rugby']);
		const cricket = Array.from(el.querySelectorAll('button')).find((b) => b.textContent === 'Remove Cricket')!;
		cricket.focus();
		cricket.click();
		TestBed.tick();
		await new Promise((resolve) => setTimeout(resolve));
		expect(document.activeElement?.textContent).toBe('Remove Rugby');
	});
});
