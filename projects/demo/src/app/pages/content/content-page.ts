import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InteropContent } from 'interop';
import { DemoSection } from '../../components/demo-section/demo-section';
import { DemoExample } from '../../components/demo-example/demo-example';
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import * as content from './content.djot';

@Component({
	selector: 'content-page',
	standalone: true,
	imports: [InteropContent, DemoSection, DemoExample, DemoMasthead],
	templateUrl: './content-page.html',
	styleUrl: './content-page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPage {
	protected readonly content = content;
}
