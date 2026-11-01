// A React 19 app with <interop-tabs>, bundled for the browser checks. React renders the tabs from a
// list; the element binds itself.
import "interop/tabs";
import { createElement as h, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

function Logs() {
	const [logs, setLogs] = useState([
		{ id: "log-1", name: "Log 1" },
		{ id: "log-2", name: "Log 2" },
	]);
	const [last, setLast] = useState("");
	const tabs = useRef(null);
	useEffect(() => {
		const element = tabs.current;
		const changed = (event) => setLast(event.detail.panel?.id ?? "");
		element.addEventListener("interop-tabs-change", changed);
		return () => element.removeEventListener("interop-tabs-change", changed);
	}, []);
	const add = () =>
		setLogs((all) => [
			...all,
			{ id: `log-${all.length + 1}`, name: `Log ${all.length + 1}` },
		]);
	const removeSelected = () => {
		const id = tabs.current
			.querySelector('[role="tab"][aria-selected="true"]')
			?.getAttribute("aria-controls");
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
						},
						log.name,
					),
				),
			),
			logs.map((log, index) =>
				h(
					"section",
					{
						key: log.id,
						role: "tabpanel",
						id: log.id,
						hidden: index === 0 ? undefined : "until-found",
					},
					h("p", null, `${log.name} entry.`),
				),
			),
		),
		h("p", { id: "last" }, `Last change: ${last || "none"}`),
		h("button", { type: "button", id: "add", onClick: add }, "Add a log"),
		" ",
		h(
			"button",
			{ type: "button", id: "remove", onClick: removeSelected },
			"Remove the selected log",
		),
	);
}

createRoot(document.querySelector("#app")).render(h(Logs));
