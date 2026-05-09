import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { InteropIcon, provideInteropIcons } from 'interop';
import { TablerRocket } from 'interop/lib/iconsets/tabler/outline/tabler-rocket';
import { TablerBug } from 'interop/lib/iconsets/tabler/outline/tabler-bug';
import { TablerBolt } from 'interop/lib/iconsets/tabler/outline/tabler-bolt';
import { TablerArchive } from 'interop/lib/iconsets/tabler/outline/tabler-archive';
import { TablerInfoCircle } from 'interop/lib/iconsets/tabler/outline/tabler-info-circle';

export type DemoNoteType = 'release' | 'bugfix' | 'breaking' | 'deprecated' | 'note';

export interface DemoNote {
	type: DemoNoteType;
	label: string;
	title?: string;
	body: string;
}

const NOTE_ICONS: Record<DemoNoteType, string> = {
	release: 'tabler-rocket',
	bugfix: 'tabler-bug',
	breaking: 'tabler-bolt',
	deprecated: 'tabler-archive',
	note: 'tabler-info-circle',
};

@Component({
	selector: 'demo-notes',
	standalone: true,
	imports: [InteropIcon],
	providers: [provideInteropIcons(TablerRocket, TablerBug, TablerBolt, TablerArchive, TablerInfoCircle)],
	template: `
		<ul class="demo-notes__list" role="list">
			@for (note of notes(); track note.label) {
				<li class="demo-notes__item" [attr.data-type]="note.type">
					<span class="demo-notes__icon">
						<interop-icon [name]="iconFor(note.type)" [size]="16" />
					</span>
					<div class="demo-notes__content">
						<div class="demo-notes__meta">
							<span class="demo-notes__type">{{ note.type }}</span>
							<span class="demo-notes__label">{{ note.label }}</span>
						</div>
						@if (note.title) {
							<strong class="demo-notes__title">{{ note.title }}</strong>
						}
						<p class="demo-notes__body">{{ note.body }}</p>
					</div>
				</li>
			}
		</ul>
	`,
	styleUrl: './demo-notes.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoNotes {
	notes = input.required<DemoNote[]>();

	iconFor(type: DemoNoteType): string {
		return NOTE_ICONS[type];
	}
}
