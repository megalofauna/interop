import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InteropContent } from 'src/public-api';
import { DemoSection } from '../../components/demo-section/demo-section';
import { DemoExample } from '../../components/demo-example/demo-example';
import * as content from './content.djot';

@Component({
	selector: 'content-page',
	standalone: true,
	imports: [InteropContent, DemoSection, DemoExample],
	templateUrl: './content-page.html',
	styleUrl: './content-page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPage {
	protected readonly content = content;
}
