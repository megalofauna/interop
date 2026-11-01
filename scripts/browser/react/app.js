// A React 19 app with <interop-tabs>, bundled for the browser checks. React renders the tabs from a
// list; the element binds itself. React writes the inputs: the tabs and panels, a tab's `disabled`,
// and `aria-selected` on a tab it inserts already selected. The element owns the rest.
import "interop/tabs";
import { createElement as h, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

/** The panel shown at first. It never changes, so React writes each panel's `hidden` once. */
const shownFirst = "log-1";

function Logs() {
	const [logs, setLogs] = useState([
		{ id: "log-1", name: "Log 1" },
		{ id: "log-2", name: "Log 2" },
	]);
	const [last, setLast] = useState("");
	const [disabled, setDisabled] = useState(null);
	const tabs = useRef(null);
	useEffect(() => {
		const element = tabs.current;
		const changed = (event) => setLast(event.detail.panel?.id ?? "");
		element.addEventListener("interop-tabs-change", changed);
		return () => element.removeEventListener("interop-tabs-change", changed);
	}, []);
	const selectedId = () =>
		tabs.current
			.querySelector('[role="tab"][aria-selected="true"]')
			?.getAttribute("aria-controls");
	const add = (selected) =>
		setLogs((all) => [
			...all,
			{ id: `log-${all.length + 1}`, name: `Log ${all.length + 1}`, selected },
		]);
	const removeSelected = () => {
		const id = selectedId();
		setLogs((all) => all.filter((log) => log.id !== id));
	};
	return h(
		"div",
		null,
		h(
			"interop-tabs",
			{ ref: tabs, "itx-activation": "manual" },
			h(
				"div",
				{ role: "tablist", "aria-label": "Logs" },
				logs.map((log) =>
					h(
						"button",
						{
							key: log.id,
							type: "button",
							role: "tab",
							"aria-controls": log.id,
							disabled: log.id === disabled,
							// Written once, when React inserts the tab: one added already selected takes the selection.
							"aria-selected": log.selected ? "true" : undefined,
						},
						log.name,
					),
				),
			),
			logs.map((log) =>
				h(
					"section",
					{
						key: log.id,
						role: "tabpanel",
						id: log.id,
						hidden: log.id === shownFirst ? undefined : "until-found",
					},
					h("p", null, `${log.name} entry.`),
				),
			),
		),
		h("p", { id: "last" }, `Last change: ${last || "none"}`),
		h(
			"button",
			{ type: "button", id: "add", onClick: () => add(false) },
			"Add a log",
		),
		" ",
		h(
			"button",
			{ type: "button", id: "add-selected", onClick: () => add(true) },
			"Add a selected log",
		),
		" ",
		h(
			"button",
			{
				type: "button",
				id: "disable",
				onClick: () => setDisabled(selectedId() ?? null),
			},
			"Disable the selected log",
		),
		" ",
		h(
			"button",
			{ type: "button", id: "remove", onClick: removeSelected },
			"Remove the selected log",
		),
	);
}

createRoot(document.querySelector("#app")).render(h(Logs));
