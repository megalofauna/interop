import {
	ChangeDetectionStrategy,
	Component,
	forwardRef,
	input,
} from "@angular/core";
import {
	InteropTreeItem,
	InteropTreeToggle,
	InteropTreeGroup,
} from "interop";

export interface TreeNode {
	key: string;
	label: string;
	children?: TreeNode[];
}

/**
 * Recursive renderer for the scale example. Applied *to the list element*
 * (`<ul interop-tree-group demo-tree-nodes>`) so no wrapper element lands
 * between a `<ul>` and its `<li>` children — list semantics are the whole
 * reason the tree gets correct item counts for free.
 *
 * This is a **component**, not an `<ng-template>` + `ngTemplateOutlet`, and
 * that is load-bearing. An embedded view created by `ngTemplateOutlet`
 * resolves DI from where the template was *declared*, not where it was
 * *inserted* — so items rendered that way never find `INTEROP_TREE` (NG0201)
 * and, if they did, would all compute depth 1 because they cannot see an
 * ancestor item either. A component's element injector sits at its insertion
 * point, so nesting resolves the way the markup reads.
 */
@Component({
	selector: "[demo-tree-nodes]",
	standalone: true,
	imports: [
		InteropTreeItem,
		InteropTreeToggle,
		InteropTreeGroup,
		forwardRef(() => DemoTreeNodes),
	],
	template: `
		@for (node of nodes(); track node.key) {
			<li interop-tree-item [key]="node.key" [label]="node.label">
				<span interop-tree-row>
					<span interop-tree-toggle></span>
					<span>{{ node.label }}</span>
				</span>
				@if (node.children) {
					<ul interop-tree-group demo-tree-nodes [nodes]="node.children"></ul>
				}
			</li>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoTreeNodes {
	readonly nodes = input.required<TreeNode[]>({ alias: "nodes" });
}
