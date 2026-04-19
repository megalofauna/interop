import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { TableColumn } from './interop-table';

/**
 * Context object provided to custom cell templates.
 *
 * @example Access in template via `let-` microsyntax
 * ```html
 * <ng-template itxCell="name" let-item let-column="column" let-index="index">
 *   <code>{{ item.name }}</code>
 * </ng-template>
 * ```
 */
export interface InteropCellContext<T = any> {
	/** The row data item (bound to the implicit template variable). */
	$implicit: T;

	/** The column definition for this cell. */
	column: TableColumn<T>;

	/** The row index within the visible items. */
	index: number;
}

/**
 * InteropCellDef — custom cell template directive for InteropTable.
 *
 * Place on an `<ng-template>` inside a `<table interop-table>` to override
 * the default text rendering for a specific column. The directive's value
 * is the column key it applies to.
 *
 * The consumer component must import this directive alongside InteropTable.
 *
 * @example Basic custom cell
 * ```html
 * <table interop-table [collection]="users" [columns]="columns">
 *   <ng-template itxCell="email" let-item>
 *     <a [href]="'mailto:' + item.email">{{ item.email }}</a>
 *   </ng-template>
 * </table>
 * ```
 *
 * @example Multiple custom cells with full context
 * ```html
 * <table interop-table [collection]="entries" [columns]="columns">
 *   <ng-template itxCell="name" let-item let-column="column" let-index="index">
 *     <code>{{ item.name }}</code>
 *   </ng-template>
 *   <ng-template itxCell="type" let-item>
 *     <span class="type-badge">{{ item.type }}</span>
 *   </ng-template>
 * </table>
 * ```
 */
@Directive({
	selector: '[itxCell]',
	standalone: true,
})
export class InteropCellDef<T = any> {
	/**
	 * The column key this template applies to.
	 * Must match a `key` value from the table's column definitions.
	 */
	readonly itxCell = input.required<string>();

	/** Reference to the template provided by the consumer. */
	readonly templateRef = inject(TemplateRef<InteropCellContext<T>>);
}
