/*
 * Colour derivation record — a SNAPSHOT, no longer generated.
 *
 * This was written by scripts/generate-color-ladder.mjs, which has been
 * deleted along with the solver it documented. The palette is hand-authored
 * now, so nothing re-derives these numbers.
 *
 * The Colour page still renders the parts that are about the palette itself
 * (PALETTE_FACTS, FAMILY_FACTS, LAYER_KEYS, HUE_SWEEP, HUE_CEILINGS). The
 * per-layer role figures in FAMILY_FACTS describe the OLD behaviour, where a
 * role re-solved at every depth — roles are fixed steps now, so those columns
 * are a record of what changed rather than a description of what ships.
 * Gutting this page is its own pass; see .agent/todo/colour-followups.md.
 *
 * The facts behind projects/demo's Colour page: the dials that were turned and
 * what the solver made of them. Contrast ratios are NOT here on purpose — the
 * demo measures those from the shipped CSS at runtime, so a demonstration can
 * never agree with a generator that is wrong about its own output.
 */

/** A neutral contrast rank and the floor it was solved against. */
export interface RankFact {
	readonly rank: number;
	readonly intent: string;
	/** Human-readable floor, e.g. "4.5:1". Ranks 1 and 6 are not ratio targets. */
	readonly floor: string;
	/** The numeric floor, or null where the rank is not a contrast target. */
	readonly ratio: number | null;
}

/** An (L, C) pair, as the theme publishes them. Hue travels separately. */
export interface Lc {
	readonly l: number;
	readonly c: number;
}

/** A family's solid fill: the one part of an accent that never varies. */
export interface SolidFact extends Lc {
	/** Measured contrast of the chosen label against the fill, per the solver. */
	readonly ratio: number;
	/** Lightness delta from the seed. 0 means the seed was honoured as given. */
	readonly movedFromSeed: number;
	/** Which pole won the label. Derived, never chosen. */
	readonly label: "light" | "dark";
	readonly labelL: number;
	readonly labelC: number;
	/** Stepped AWAY from the label, so a state can only improve its contrast. */
	readonly hover: Lc;
	readonly active: Lc;
}

/** One seeded accent family, and what the solver had to do to the seed. */
export interface FamilyFact {
	readonly id: string;
	readonly role: string;
	readonly variant: string;
	/** The seed's human name, where it has one. Decoration, not an input. */
	readonly name: string | null;
	readonly hue: number;
	/** Colourways re-solve per layer; statuses are solved against layer 0 only. */
	readonly perLayer: boolean;
	readonly seed: { readonly l: number; readonly c: number; readonly h: number };
	/** The most chroma this hue can reach at ANY lightness in sRGB. */
	readonly chromaCeiling: number;
	/** What the seed asked for, after clamping to that ceiling. */
	readonly chromaIntent: number;
	/** How much chroma the gamut took. Non-zero means the seed over-asked. */
	readonly chromaClamped: number;
	readonly solid: SolidFact;
}

/** Which hues resolve at a given seed strength, and which cannot. */
export interface HueSweepFact {
	readonly seedL: number;
	readonly seedC: number;
	readonly step: number;
	/** Hues with no solution at this strength — the case that motivated the clamp. */
	readonly failed: readonly number[];
}

/** The most chroma a hue can reach at any lightness. The gamut, as a curve. */
export interface HueCeiling {
	readonly hue: number;
	readonly peakChroma: number;
}

/** The dials, verbatim. The surface a config file and a live editor would bind to. */
export interface InputFacts {
	readonly depth: { readonly below: number; readonly above: number };
	readonly ramp: Record<string, Record<string, number>>;
	readonly tint: Record<string, { readonly c: number; readonly h: number }>;
	readonly accent: Record<string, unknown>;
	readonly seeds: Record<string, unknown>;
}

export const RANK_FACTS: readonly RankFact[] = [
	{
		rank: 1,
		intent: "wash — hover fills, stripes",
		floor: "perceptible (≥ 0.02 L)",
		ratio: null
	},
	{
		rank: 2,
		intent: "hairline, dividers",
		floor: "1.5:1",
		ratio: 1.5
	},
	{
		rank: 3,
		intent: "border, emphasis edge",
		floor: "3:1",
		ratio: 3
	},
	{
		rank: 4,
		intent: "secondary text",
		floor: "4.5:1",
		ratio: 4.5
	},
	{
		rank: 5,
		intent: "body text",
		floor: "7:1",
		ratio: 7
	},
	{
		rank: 6,
		intent: "maximum",
		floor: "as far as the scheme allows",
		ratio: null
	}
];

/** Ramp keys, deepest sink first — the order the ladder is emitted in. */
export const LAYER_KEYS: readonly string[] = [
	"0",
	"1",
	"2"
];

/** Surface lightness per scheme, per layer. Chroma and hue come from the tint. */
export const SURFACE_FACTS: Record<string, Record<string, number>> = {
	light: {
		"0": 0.99,
		"1": 0.965,
		"2": 0.94
	},
	dark: {
		"0": 0.17,
		"1": 0.202,
		"2": 0.234
	}
};

export const FAMILY_FACTS: readonly FamilyFact[] = [
	{
		id: "colorway",
		role: "colorway",
		variant: "default",
		name: "Science Blue",
		hue: 264,
		perLayer: true,
		seed: {
			l: 0.5,
			c: 0.19,
			h: 264
		},
		chromaCeiling: 0.285,
		chromaIntent: 0.19,
		chromaClamped: 0,
		solid: {
			l: 0.5,
			c: 0.19,
			ratio: 6.067,
			movedFromSeed: 0,
			label: "light",
			labelL: 0.99,
			labelC: 0.006,
			hover: {
				l: 0.45,
				c: 0.19
			},
			active: {
				l: 0.41,
				c: 0.19
			}
		}
	},
	{
		id: "colorway-amber",
		role: "colorway",
		variant: "amber",
		name: "Cream Can",
		hue: 82.32,
		perLayer: true,
		seed: {
			l: 0.832,
			c: 0.12,
			h: 82.32
		},
		chromaCeiling: 0.171,
		chromaIntent: 0.12,
		chromaClamped: 0,
		solid: {
			l: 0.832,
			c: 0.12,
			ratio: 11.103,
			movedFromSeed: 0,
			label: "dark",
			labelL: 0.18,
			labelC: 0.02,
			hover: {
				l: 0.882,
				c: 0.119
			},
			active: {
				l: 0.922,
				c: 0.077
			}
		}
	},
	{
		id: "danger",
		role: "danger",
		variant: "seventies",
		name: null,
		hue: 33,
		perLayer: false,
		seed: {
			l: 0.5,
			c: 0.105,
			h: 33
		},
		chromaCeiling: 0.238,
		chromaIntent: 0.105,
		chromaClamped: 0,
		solid: {
			l: 0.5,
			c: 0.105,
			ratio: 6.081,
			movedFromSeed: 0,
			label: "light",
			labelL: 0.99,
			labelC: 0.006,
			hover: {
				l: 0.45,
				c: 0.105
			},
			active: {
				l: 0.41,
				c: 0.105
			}
		}
	},
	{
		id: "info",
		role: "info",
		variant: "seventies",
		name: null,
		hue: 218,
		perLayer: false,
		seed: {
			l: 0.53,
			c: 0.058,
			h: 218
		},
		chromaCeiling: 0.146,
		chromaIntent: 0.058,
		chromaClamped: 0,
		solid: {
			l: 0.53,
			c: 0.058,
			ratio: 5.052,
			movedFromSeed: 0,
			label: "light",
			labelL: 0.99,
			labelC: 0.006,
			hover: {
				l: 0.48,
				c: 0.058
			},
			active: {
				l: 0.44,
				c: 0.058
			}
		}
	},
	{
		id: "success",
		role: "success",
		variant: "seventies",
		name: null,
		hue: 122,
		perLayer: false,
		seed: {
			l: 0.53,
			c: 0.078,
			h: 122
		},
		chromaCeiling: 0.226,
		chromaIntent: 0.078,
		chromaClamped: 0,
		solid: {
			l: 0.53,
			c: 0.078,
			ratio: 5.015,
			movedFromSeed: 0,
			label: "light",
			labelL: 0.99,
			labelC: 0.006,
			hover: {
				l: 0.48,
				c: 0.078
			},
			active: {
				l: 0.44,
				c: 0.078
			}
		}
	},
	{
		id: "warning",
		role: "warning",
		variant: "seventies",
		name: null,
		hue: 78,
		perLayer: false,
		seed: {
			l: 0.62,
			c: 0.105,
			h: 78
		},
		chromaCeiling: 0.169,
		chromaIntent: 0.105,
		chromaClamped: 0,
		solid: {
			l: 0.62,
			c: 0.105,
			ratio: 5.118,
			movedFromSeed: 0,
			label: "dark",
			labelL: 0.18,
			labelC: 0.02,
			hover: {
				l: 0.67,
				c: 0.105
			},
			active: {
				l: 0.71,
				c: 0.105
			}
		}
	},
	{
		id: "danger-eighties",
		role: "danger",
		variant: "eighties",
		name: null,
		hue: 25,
		perLayer: false,
		seed: {
			l: 0.55,
			c: 0.19,
			h: 25
		},
		chromaCeiling: 0.255,
		chromaIntent: 0.19,
		chromaClamped: 0,
		solid: {
			l: 0.55,
			c: 0.19,
			ratio: 5.157,
			movedFromSeed: 0,
			label: "light",
			labelL: 0.99,
			labelC: 0.006,
			hover: {
				l: 0.5,
				c: 0.19
			},
			active: {
				l: 0.46,
				c: 0.187
			}
		}
	},
	{
		id: "info-eighties",
		role: "info",
		variant: "eighties",
		name: null,
		hue: 264,
		perLayer: false,
		seed: {
			l: 0.5,
			c: 0.19,
			h: 264
		},
		chromaCeiling: 0.285,
		chromaIntent: 0.19,
		chromaClamped: 0,
		solid: {
			l: 0.5,
			c: 0.19,
			ratio: 6.067,
			movedFromSeed: 0,
			label: "light",
			labelL: 0.99,
			labelC: 0.006,
			hover: {
				l: 0.45,
				c: 0.19
			},
			active: {
				l: 0.41,
				c: 0.19
			}
		}
	},
	{
		id: "success-eighties",
		role: "success",
		variant: "eighties",
		name: null,
		hue: 145,
		perLayer: false,
		seed: {
			l: 0.62,
			c: 0.19,
			h: 145
		},
		chromaCeiling: 0.271,
		chromaIntent: 0.19,
		chromaClamped: 0,
		solid: {
			l: 0.62,
			c: 0.19,
			ratio: 5.56,
			movedFromSeed: 0,
			label: "dark",
			labelL: 0.18,
			labelC: 0.02,
			hover: {
				l: 0.67,
				c: 0.19
			},
			active: {
				l: 0.71,
				c: 0.19
			}
		}
	},
	{
		id: "warning-eighties",
		role: "warning",
		variant: "eighties",
		name: null,
		hue: 85,
		perLayer: false,
		seed: {
			l: 0.75,
			c: 0.17,
			h: 85
		},
		chromaCeiling: 0.172,
		chromaIntent: 0.17,
		chromaClamped: 0,
		solid: {
			l: 0.75,
			c: 0.154,
			ratio: 8.38,
			movedFromSeed: 0,
			label: "dark",
			labelL: 0.18,
			labelC: 0.02,
			hover: {
				l: 0.8,
				c: 0.164
			},
			active: {
				l: 0.84,
				c: 0.17
			}
		}
	}
];

export const HUE_SWEEP: HueSweepFact = {
	seedL: 0.55,
	seedC: 0.19,
	step: 15,
	failed: []
};

/**
 * Peak chroma per hue — the gamut, as a curve.
 *
 * This is the constraint every seed is clamped against, and the reason the
 * clamp is not theoretical: 28 of these 72 hues top out BELOW the default .19
 * seed strength, bottoming at .145 around hue 215. A teal seeded at .19 has no
 * solution at any lightness, which is precisely what it used to return.
 */
export const HUE_CEILINGS: readonly HueCeiling[] = [
	{
		hue: 0,
		peakChroma: 0.26
	},
	{
		hue: 5,
		peakChroma: 0.257
	},
	{
		hue: 10,
		peakChroma: 0.255
	},
	{
		hue: 15,
		peakChroma: 0.252
	},
	{
		hue: 20,
		peakChroma: 0.253
	},
	{
		hue: 25,
		peakChroma: 0.255
	},
	{
		hue: 30,
		peakChroma: 0.253
	},
	{
		hue: 35,
		peakChroma: 0.229
	},
	{
		hue: 40,
		peakChroma: 0.214
	},
	{
		hue: 45,
		peakChroma: 0.2
	},
	{
		hue: 50,
		peakChroma: 0.19
	},
	{
		hue: 55,
		peakChroma: 0.182
	},
	{
		hue: 60,
		peakChroma: 0.176
	},
	{
		hue: 65,
		peakChroma: 0.173
	},
	{
		hue: 70,
		peakChroma: 0.171
	},
	{
		hue: 75,
		peakChroma: 0.169
	},
	{
		hue: 80,
		peakChroma: 0.17
	},
	{
		hue: 85,
		peakChroma: 0.172
	},
	{
		hue: 90,
		peakChroma: 0.176
	},
	{
		hue: 95,
		peakChroma: 0.181
	},
	{
		hue: 100,
		peakChroma: 0.188
	},
	{
		hue: 105,
		peakChroma: 0.197
	},
	{
		hue: 110,
		peakChroma: 0.21
	},
	{
		hue: 115,
		peakChroma: 0.215
	},
	{
		hue: 120,
		peakChroma: 0.221
	},
	{
		hue: 125,
		peakChroma: 0.231
	},
	{
		hue: 130,
		peakChroma: 0.245
	},
	{
		hue: 135,
		peakChroma: 0.26
	},
	{
		hue: 140,
		peakChroma: 0.28
	},
	{
		hue: 145,
		peakChroma: 0.271
	},
	{
		hue: 150,
		peakChroma: 0.24
	},
	{
		hue: 155,
		peakChroma: 0.215
	},
	{
		hue: 160,
		peakChroma: 0.199
	},
	{
		hue: 165,
		peakChroma: 0.185
	},
	{
		hue: 170,
		peakChroma: 0.175
	},
	{
		hue: 175,
		peakChroma: 0.168
	},
	{
		hue: 180,
		peakChroma: 0.161
	},
	{
		hue: 185,
		peakChroma: 0.157
	},
	{
		hue: 190,
		peakChroma: 0.155
	},
	{
		hue: 195,
		peakChroma: 0.154
	},
	{
		hue: 200,
		peakChroma: 0.15
	},
	{
		hue: 205,
		peakChroma: 0.147
	},
	{
		hue: 210,
		peakChroma: 0.145
	},
	{
		hue: 215,
		peakChroma: 0.145
	},
	{
		hue: 220,
		peakChroma: 0.146
	},
	{
		hue: 225,
		peakChroma: 0.148
	},
	{
		hue: 230,
		peakChroma: 0.151
	},
	{
		hue: 235,
		peakChroma: 0.157
	},
	{
		hue: 240,
		peakChroma: 0.163
	},
	{
		hue: 245,
		peakChroma: 0.174
	},
	{
		hue: 250,
		peakChroma: 0.187
	},
	{
		hue: 255,
		peakChroma: 0.204
	},
	{
		hue: 260,
		peakChroma: 0.233
	},
	{
		hue: 265,
		peakChroma: 0.309
	},
	{
		hue: 270,
		peakChroma: 0.302
	},
	{
		hue: 275,
		peakChroma: 0.297
	},
	{
		hue: 280,
		peakChroma: 0.295
	},
	{
		hue: 285,
		peakChroma: 0.292
	},
	{
		hue: 290,
		peakChroma: 0.291
	},
	{
		hue: 295,
		peakChroma: 0.291
	},
	{
		hue: 300,
		peakChroma: 0.294
	},
	{
		hue: 305,
		peakChroma: 0.296
	},
	{
		hue: 310,
		peakChroma: 0.299
	},
	{
		hue: 315,
		peakChroma: 0.305
	},
	{
		hue: 320,
		peakChroma: 0.309
	},
	{
		hue: 325,
		peakChroma: 0.316
	},
	{
		hue: 330,
		peakChroma: 0.315
	},
	{
		hue: 335,
		peakChroma: 0.302
	},
	{
		hue: 340,
		peakChroma: 0.291
	},
	{
		hue: 345,
		peakChroma: 0.281
	},
	{
		hue: 350,
		peakChroma: 0.274
	},
	{
		hue: 355,
		peakChroma: 0.267
	}
];

export const INPUT_FACTS: InputFacts = {
	depth: {
		below: 0,
		above: 2
	},
	ramp: {
		light: {
			page: 0.99,
			up: -0.025,
			ease: 1,
			min: 0.12,
			max: 0.99
		},
		dark: {
			page: 0.17,
			up: 0.032,
			ease: 1,
			min: 0.17,
			max: 0.62
		}
	},
	tint: {
		light: {
			c: 0.006,
			h: 250
		},
		dark: {
			c: 0.006,
			h: 250
		}
	},
	accent: {
		onSolid: 4.5,
		tint: {
			minDeltaL: 0.02,
			delta: {
				light: 0.05,
				dark: 0.06
			}
		},
		onTint: 4.5,
		border: 3,
		text: 4.5,
		keepChroma: 0.8,
		solidHover: 0.05,
		solidActive: 0.09
	},
	seeds: {
		colorway: {
			default: {
				name: "Science Blue",
				seed: [
					0.5,
					0.19,
					264
				]
			},
			amber: {
				name: "Cream Can",
				seed: [
					0.832,
					0.12,
					82.32
				]
			}
		},
		status: {
			seventies: {
				danger: [
					0.5,
					0.105,
					33
				],
				info: [
					0.53,
					0.058,
					218
				],
				success: [
					0.53,
					0.078,
					122
				],
				warning: [
					0.62,
					0.105,
					78
				]
			},
			eighties: {
				danger: [
					0.55,
					0.19,
					25
				],
				info: [
					0.5,
					0.19,
					264
				],
				success: [
					0.62,
					0.19,
					145
				],
				warning: [
					0.75,
					0.17,
					85
				]
			}
		}
	}
};

/** One step: the lightness and chroma one scheme's arm actually receives. */
export interface PaletteStep {
	readonly step: number;
	readonly l: number;
	readonly c: number;
	/** The nearest step that clears 4.5:1 on this one. Null in the middle of
	    the ramp, where the AA distance does not fit in either direction. */
	readonly label: number | null;
}

export interface PaletteFamily {
	readonly id: string;
	readonly hue: number;
	readonly light: readonly PaletteStep[];
	readonly dark: readonly PaletteStep[];
}

/** A background step, and what clears each floor on it. Per scheme. */
export interface PaletteBackground {
	readonly step: number;
	readonly floors: Record<
		string,
		readonly { readonly step: number; readonly ratio: number }[]
	>;
}

export interface PaletteFacts {
	readonly steps: number;
	readonly curve: number;
	readonly floors: readonly { readonly id: string; readonly ratio: number }[];
	/** How far apart two steps must be to clear a floor, anywhere on the ramp. */
	readonly distances: readonly {
		readonly id: string;
		readonly ratio: number;
		readonly steps: number | null;
	}[];
	readonly families: readonly PaletteFamily[];
	/** Neutral and colourway only — what the legibility board renders. */
	readonly legible: Record<string, Record<string, readonly PaletteBackground[]>>;
}

/**
 * The shipped palette, measured off the same ramp the CSS is written from.
 *
 * Note that legibility is keyed by scheme before it is keyed by step. Scheme
 * pairing fixes the DISTANCE from the page, not the ratio, so a step that
 * carries body text in light may only reach secondary in dark.
 */
export const PALETTE_FACTS: PaletteFacts = {
	steps: 14,
	curve: 1.3,
	floors: [
		{
			id: "border",
			ratio: 3
		},
		{
			id: "secondary",
			ratio: 4.5
		},
		{
			id: "body",
			ratio: 7
		}
	],
	distances: [
		{
			id: "border",
			ratio: 3,
			steps: 7
		},
		{
			id: "secondary",
			ratio: 4.5,
			steps: 8
		},
		{
			id: "body",
			ratio: 7,
			steps: 10
		}
	],
	families: [
		{
			id: "neutral",
			hue: 250,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.002,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.005,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.007,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.009,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.011,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.011,
					label: 13
				},
				{
					step: 7,
					l: 0.528,
					c: 0.012,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.012,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.011,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.011,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.009,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.007,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.005,
					label: 6
				},
				{
					step: 14,
					l: 0.17,
					c: 0.002,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.002,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.005,
					label: 9
				},
				{
					step: 3,
					l: 0.24,
					c: 0.007,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.009,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.011,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.011,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.012,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.012,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.011,
					label: 2
				},
				{
					step: 10,
					l: 0.666,
					c: 0.011,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.009,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.007,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.005,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.002,
					label: 8
				}
			]
		},
		{
			id: "colorway",
			hue: 264,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.014,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.053,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.093,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.134,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.168,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.182,
					label: 14
				},
				{
					step: 7,
					l: 0.528,
					c: 0.189,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.189,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.182,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.168,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.147,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.118,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.083,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.037,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.037,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.083,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.118,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.147,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.168,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.182,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.189,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.189,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.182,
					label: 1
				},
				{
					step: 10,
					l: 0.666,
					c: 0.168,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.134,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.093,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.053,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.014,
					label: 8
				}
			]
		},
		{
			id: "colorway-amber",
			hue: 82.32,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.023,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.052,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.075,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.093,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.106,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.115,
					label: 14
				},
				{
					step: 7,
					l: 0.528,
					c: 0.109,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.095,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.083,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.071,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.06,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.05,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.042,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.023,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.023,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.042,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.05,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.06,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.071,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.083,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.095,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.109,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.115,
					label: 1
				},
				{
					step: 10,
					l: 0.666,
					c: 0.106,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.093,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.075,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.052,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.023,
					label: 8
				}
			]
		},
		{
			id: "danger",
			hue: 33,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.015,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.046,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.065,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.081,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.093,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.101,
					label: 14
				},
				{
					step: 7,
					l: 0.528,
					c: 0.105,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.105,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.101,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.093,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.081,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.065,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.046,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.02,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.02,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.046,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.065,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.081,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.093,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.101,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.105,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.105,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.101,
					label: 1
				},
				{
					step: 10,
					l: 0.666,
					c: 0.093,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.081,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.065,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.046,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.015,
					label: 8
				}
			]
		},
		{
			id: "info",
			hue: 218,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.011,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.025,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.036,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.045,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.051,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.056,
					label: 13
				},
				{
					step: 7,
					l: 0.528,
					c: 0.058,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.058,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.056,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.051,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.045,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.036,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.025,
					label: 6
				},
				{
					step: 14,
					l: 0.17,
					c: 0.011,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.011,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.025,
					label: 9
				},
				{
					step: 3,
					l: 0.24,
					c: 0.036,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.045,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.051,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.056,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.058,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.058,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.056,
					label: 2
				},
				{
					step: 10,
					l: 0.666,
					c: 0.051,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.045,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.036,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.025,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.011,
					label: 8
				}
			]
		},
		{
			id: "success",
			hue: 122,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.015,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.034,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.049,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.06,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.069,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.075,
					label: 13
				},
				{
					step: 7,
					l: 0.528,
					c: 0.078,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.078,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.075,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.069,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.06,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.049,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.034,
					label: 6
				},
				{
					step: 14,
					l: 0.17,
					c: 0.015,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.015,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.034,
					label: 9
				},
				{
					step: 3,
					l: 0.24,
					c: 0.049,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.06,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.069,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.075,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.078,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.078,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.075,
					label: 2
				},
				{
					step: 10,
					l: 0.666,
					c: 0.069,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.06,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.049,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.034,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.015,
					label: 8
				}
			]
		},
		{
			id: "warning",
			hue: 78,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.02,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.046,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.065,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.081,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.093,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.101,
					label: 14
				},
				{
					step: 7,
					l: 0.528,
					c: 0.105,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.097,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.084,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.072,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.061,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.051,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.042,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.02,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.02,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.042,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.051,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.061,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.072,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.084,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.097,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.105,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.101,
					label: 1
				},
				{
					step: 10,
					l: 0.666,
					c: 0.093,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.081,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.065,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.046,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.02,
					label: 8
				}
			]
		},
		{
			id: "danger-eighties",
			hue: 25,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.015,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.057,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.105,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.147,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.168,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.182,
					label: null
				},
				{
					step: 7,
					l: 0.528,
					c: 0.189,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.188,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.163,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.139,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.118,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.098,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.082,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.037,
					label: 5
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.037,
					label: 10
				},
				{
					step: 2,
					l: 0.199,
					c: 0.082,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.098,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.118,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.139,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.163,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.188,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.189,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.182,
					label: null
				},
				{
					step: 10,
					l: 0.666,
					c: 0.168,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.147,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.105,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.057,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.015,
					label: 8
				}
			]
		},
		{
			id: "info-eighties",
			hue: 264,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.014,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.053,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.093,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.134,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.168,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.182,
					label: 14
				},
				{
					step: 7,
					l: 0.528,
					c: 0.189,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.189,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.182,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.168,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.147,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.118,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.083,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.037,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.037,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.083,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.118,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.147,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.168,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.182,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.189,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.189,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.182,
					label: 1
				},
				{
					step: 10,
					l: 0.666,
					c: 0.168,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.134,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.093,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.053,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.014,
					label: 8
				}
			]
		},
		{
			id: "success-eighties",
			hue: 145,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.037,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.083,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.118,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.147,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.168,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.182,
					label: 13
				},
				{
					step: 7,
					l: 0.528,
					c: 0.166,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.146,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.126,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.108,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.091,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.076,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.063,
					label: 6
				},
				{
					step: 14,
					l: 0.17,
					c: 0.037,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.037,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.063,
					label: 9
				},
				{
					step: 3,
					l: 0.24,
					c: 0.076,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.091,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.108,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.126,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.146,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.166,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.182,
					label: 2
				},
				{
					step: 10,
					l: 0.666,
					c: 0.168,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.147,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.118,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.083,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.037,
					label: 8
				}
			]
		},
		{
			id: "warning-eighties",
			hue: 85,
			light: [
				{
					step: 1,
					l: 0.97,
					c: 0.032,
					label: 7
				},
				{
					step: 2,
					l: 0.891,
					c: 0.074,
					label: 8
				},
				{
					step: 3,
					l: 0.814,
					c: 0.106,
					label: 9
				},
				{
					step: 4,
					l: 0.739,
					c: 0.131,
					label: 10
				},
				{
					step: 5,
					l: 0.666,
					c: 0.137,
					label: 11
				},
				{
					step: 6,
					l: 0.596,
					c: 0.122,
					label: 14
				},
				{
					step: 7,
					l: 0.528,
					c: 0.108,
					label: 1
				},
				{
					step: 8,
					l: 0.463,
					c: 0.095,
					label: 2
				},
				{
					step: 9,
					l: 0.401,
					c: 0.082,
					label: 3
				},
				{
					step: 10,
					l: 0.343,
					c: 0.071,
					label: 4
				},
				{
					step: 11,
					l: 0.289,
					c: 0.06,
					label: 5
				},
				{
					step: 12,
					l: 0.24,
					c: 0.05,
					label: 5
				},
				{
					step: 13,
					l: 0.199,
					c: 0.042,
					label: 5
				},
				{
					step: 14,
					l: 0.17,
					c: 0.033,
					label: 6
				}
			],
			dark: [
				{
					step: 1,
					l: 0.17,
					c: 0.033,
					label: 9
				},
				{
					step: 2,
					l: 0.199,
					c: 0.042,
					label: 10
				},
				{
					step: 3,
					l: 0.24,
					c: 0.05,
					label: 10
				},
				{
					step: 4,
					l: 0.289,
					c: 0.06,
					label: 10
				},
				{
					step: 5,
					l: 0.343,
					c: 0.071,
					label: 11
				},
				{
					step: 6,
					l: 0.401,
					c: 0.082,
					label: 12
				},
				{
					step: 7,
					l: 0.463,
					c: 0.095,
					label: 13
				},
				{
					step: 8,
					l: 0.528,
					c: 0.108,
					label: 14
				},
				{
					step: 9,
					l: 0.596,
					c: 0.122,
					label: 1
				},
				{
					step: 10,
					l: 0.666,
					c: 0.137,
					label: 4
				},
				{
					step: 11,
					l: 0.739,
					c: 0.131,
					label: 5
				},
				{
					step: 12,
					l: 0.814,
					c: 0.106,
					label: 6
				},
				{
					step: 13,
					l: 0.891,
					c: 0.074,
					label: 7
				},
				{
					step: 14,
					l: 0.97,
					c: 0.032,
					label: 8
				}
			]
		}
	],
	legible: {
		neutral: {
			light: [
				{
					step: 1,
					floors: {
						border: [
							{
								step: 6,
								ratio: 3.66
							},
							{
								step: 7,
								ratio: 4.87
							},
							{
								step: 8,
								ratio: 6.4
							},
							{
								step: 9,
								ratio: 8.33
							},
							{
								step: 10,
								ratio: 10.65
							},
							{
								step: 11,
								ratio: 13.03
							},
							{
								step: 12,
								ratio: 14.99
							},
							{
								step: 13,
								ratio: 16.62
							},
							{
								step: 14,
								ratio: 17.55
							}
						],
						secondary: [
							{
								step: 7,
								ratio: 4.87
							},
							{
								step: 8,
								ratio: 6.4
							},
							{
								step: 9,
								ratio: 8.33
							},
							{
								step: 10,
								ratio: 10.65
							},
							{
								step: 11,
								ratio: 13.03
							},
							{
								step: 12,
								ratio: 14.99
							},
							{
								step: 13,
								ratio: 16.62
							},
							{
								step: 14,
								ratio: 17.55
							}
						],
						body: [
							{
								step: 9,
								ratio: 8.33
							},
							{
								step: 10,
								ratio: 10.65
							},
							{
								step: 11,
								ratio: 13.03
							},
							{
								step: 12,
								ratio: 14.99
							},
							{
								step: 13,
								ratio: 16.62
							},
							{
								step: 14,
								ratio: 17.55
							}
						]
					}
				},
				{
					step: 2,
					floors: {
						border: [
							{
								step: 7,
								ratio: 3.83
							},
							{
								step: 8,
								ratio: 5.04
							},
							{
								step: 9,
								ratio: 6.56
							},
							{
								step: 10,
								ratio: 8.38
							},
							{
								step: 11,
								ratio: 10.25
							},
							{
								step: 12,
								ratio: 11.8
							},
							{
								step: 13,
								ratio: 13.08
							},
							{
								step: 14,
								ratio: 13.81
							}
						],
						secondary: [
							{
								step: 8,
								ratio: 5.04
							},
							{
								step: 9,
								ratio: 6.56
							},
							{
								step: 10,
								ratio: 8.38
							},
							{
								step: 11,
								ratio: 10.25
							},
							{
								step: 12,
								ratio: 11.8
							},
							{
								step: 13,
								ratio: 13.08
							},
							{
								step: 14,
								ratio: 13.81
							}
						],
						body: [
							{
								step: 10,
								ratio: 8.38
							},
							{
								step: 11,
								ratio: 10.25
							},
							{
								step: 12,
								ratio: 11.8
							},
							{
								step: 13,
								ratio: 13.08
							},
							{
								step: 14,
								ratio: 13.81
							}
						]
					}
				},
				{
					step: 3,
					floors: {
						border: [
							{
								step: 7,
								ratio: 3
							},
							{
								step: 8,
								ratio: 3.94
							},
							{
								step: 9,
								ratio: 5.13
							},
							{
								step: 10,
								ratio: 6.56
							},
							{
								step: 11,
								ratio: 8.02
							},
							{
								step: 12,
								ratio: 9.23
							},
							{
								step: 13,
								ratio: 10.23
							},
							{
								step: 14,
								ratio: 10.81
							}
						],
						secondary: [
							{
								step: 9,
								ratio: 5.13
							},
							{
								step: 10,
								ratio: 6.56
							},
							{
								step: 11,
								ratio: 8.02
							},
							{
								step: 12,
								ratio: 9.23
							},
							{
								step: 13,
								ratio: 10.23
							},
							{
								step: 14,
								ratio: 10.81
							}
						],
						body: [
							{
								step: 11,
								ratio: 8.02
							},
							{
								step: 12,
								ratio: 9.23
							},
							{
								step: 13,
								ratio: 10.23
							},
							{
								step: 14,
								ratio: 10.81
							}
						]
					}
				},
				{
					step: 4,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.02
							},
							{
								step: 9,
								ratio: 3.93
							},
							{
								step: 10,
								ratio: 5.02
							},
							{
								step: 11,
								ratio: 6.14
							},
							{
								step: 12,
								ratio: 7.07
							},
							{
								step: 13,
								ratio: 7.84
							},
							{
								step: 14,
								ratio: 8.28
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 5.02
							},
							{
								step: 11,
								ratio: 6.14
							},
							{
								step: 12,
								ratio: 7.07
							},
							{
								step: 13,
								ratio: 7.84
							},
							{
								step: 14,
								ratio: 8.28
							}
						],
						body: [
							{
								step: 12,
								ratio: 7.07
							},
							{
								step: 13,
								ratio: 7.84
							},
							{
								step: 14,
								ratio: 8.28
							}
						]
					}
				},
				{
					step: 5,
					floors: {
						border: [
							{
								step: 9,
								ratio: 3.01
							},
							{
								step: 10,
								ratio: 3.84
							},
							{
								step: 11,
								ratio: 4.7
							},
							{
								step: 12,
								ratio: 5.41
							},
							{
								step: 13,
								ratio: 5.99
							},
							{
								step: 14,
								ratio: 6.33
							}
						],
						secondary: [
							{
								step: 11,
								ratio: 4.7
							},
							{
								step: 12,
								ratio: 5.41
							},
							{
								step: 13,
								ratio: 5.99
							},
							{
								step: 14,
								ratio: 6.33
							}
						],
						body: []
					}
				},
				{
					step: 6,
					floors: {
						border: [
							{
								step: 1,
								ratio: 3.66
							},
							{
								step: 11,
								ratio: 3.56
							},
							{
								step: 12,
								ratio: 4.09
							},
							{
								step: 13,
								ratio: 4.54
							},
							{
								step: 14,
								ratio: 4.79
							}
						],
						secondary: [
							{
								step: 13,
								ratio: 4.54
							},
							{
								step: 14,
								ratio: 4.79
							}
						],
						body: []
					}
				},
				{
					step: 7,
					floors: {
						border: [
							{
								step: 1,
								ratio: 4.87
							},
							{
								step: 2,
								ratio: 3.83
							},
							{
								step: 3,
								ratio: 3
							},
							{
								step: 12,
								ratio: 3.08
							},
							{
								step: 13,
								ratio: 3.41
							},
							{
								step: 14,
								ratio: 3.61
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 4.87
							}
						],
						body: []
					}
				},
				{
					step: 8,
					floors: {
						border: [
							{
								step: 1,
								ratio: 6.4
							},
							{
								step: 2,
								ratio: 5.04
							},
							{
								step: 3,
								ratio: 3.94
							},
							{
								step: 4,
								ratio: 3.02
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 6.4
							},
							{
								step: 2,
								ratio: 5.04
							}
						],
						body: []
					}
				},
				{
					step: 9,
					floors: {
						border: [
							{
								step: 1,
								ratio: 8.33
							},
							{
								step: 2,
								ratio: 6.56
							},
							{
								step: 3,
								ratio: 5.13
							},
							{
								step: 4,
								ratio: 3.93
							},
							{
								step: 5,
								ratio: 3.01
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 8.33
							},
							{
								step: 2,
								ratio: 6.56
							},
							{
								step: 3,
								ratio: 5.13
							}
						],
						body: [
							{
								step: 1,
								ratio: 8.33
							}
						]
					}
				},
				{
					step: 10,
					floors: {
						border: [
							{
								step: 1,
								ratio: 10.65
							},
							{
								step: 2,
								ratio: 8.38
							},
							{
								step: 3,
								ratio: 6.56
							},
							{
								step: 4,
								ratio: 5.02
							},
							{
								step: 5,
								ratio: 3.84
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 10.65
							},
							{
								step: 2,
								ratio: 8.38
							},
							{
								step: 3,
								ratio: 6.56
							},
							{
								step: 4,
								ratio: 5.02
							}
						],
						body: [
							{
								step: 1,
								ratio: 10.65
							},
							{
								step: 2,
								ratio: 8.38
							}
						]
					}
				},
				{
					step: 11,
					floors: {
						border: [
							{
								step: 1,
								ratio: 13.03
							},
							{
								step: 2,
								ratio: 10.25
							},
							{
								step: 3,
								ratio: 8.02
							},
							{
								step: 4,
								ratio: 6.14
							},
							{
								step: 5,
								ratio: 4.7
							},
							{
								step: 6,
								ratio: 3.56
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 13.03
							},
							{
								step: 2,
								ratio: 10.25
							},
							{
								step: 3,
								ratio: 8.02
							},
							{
								step: 4,
								ratio: 6.14
							},
							{
								step: 5,
								ratio: 4.7
							}
						],
						body: [
							{
								step: 1,
								ratio: 13.03
							},
							{
								step: 2,
								ratio: 10.25
							},
							{
								step: 3,
								ratio: 8.02
							}
						]
					}
				},
				{
					step: 12,
					floors: {
						border: [
							{
								step: 1,
								ratio: 14.99
							},
							{
								step: 2,
								ratio: 11.8
							},
							{
								step: 3,
								ratio: 9.23
							},
							{
								step: 4,
								ratio: 7.07
							},
							{
								step: 5,
								ratio: 5.41
							},
							{
								step: 6,
								ratio: 4.09
							},
							{
								step: 7,
								ratio: 3.08
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 14.99
							},
							{
								step: 2,
								ratio: 11.8
							},
							{
								step: 3,
								ratio: 9.23
							},
							{
								step: 4,
								ratio: 7.07
							},
							{
								step: 5,
								ratio: 5.41
							}
						],
						body: [
							{
								step: 1,
								ratio: 14.99
							},
							{
								step: 2,
								ratio: 11.8
							},
							{
								step: 3,
								ratio: 9.23
							},
							{
								step: 4,
								ratio: 7.07
							}
						]
					}
				},
				{
					step: 13,
					floors: {
						border: [
							{
								step: 1,
								ratio: 16.62
							},
							{
								step: 2,
								ratio: 13.08
							},
							{
								step: 3,
								ratio: 10.23
							},
							{
								step: 4,
								ratio: 7.84
							},
							{
								step: 5,
								ratio: 5.99
							},
							{
								step: 6,
								ratio: 4.54
							},
							{
								step: 7,
								ratio: 3.41
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 16.62
							},
							{
								step: 2,
								ratio: 13.08
							},
							{
								step: 3,
								ratio: 10.23
							},
							{
								step: 4,
								ratio: 7.84
							},
							{
								step: 5,
								ratio: 5.99
							},
							{
								step: 6,
								ratio: 4.54
							}
						],
						body: [
							{
								step: 1,
								ratio: 16.62
							},
							{
								step: 2,
								ratio: 13.08
							},
							{
								step: 3,
								ratio: 10.23
							},
							{
								step: 4,
								ratio: 7.84
							}
						]
					}
				},
				{
					step: 14,
					floors: {
						border: [
							{
								step: 1,
								ratio: 17.55
							},
							{
								step: 2,
								ratio: 13.81
							},
							{
								step: 3,
								ratio: 10.81
							},
							{
								step: 4,
								ratio: 8.28
							},
							{
								step: 5,
								ratio: 6.33
							},
							{
								step: 6,
								ratio: 4.79
							},
							{
								step: 7,
								ratio: 3.61
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 17.55
							},
							{
								step: 2,
								ratio: 13.81
							},
							{
								step: 3,
								ratio: 10.81
							},
							{
								step: 4,
								ratio: 8.28
							},
							{
								step: 5,
								ratio: 6.33
							},
							{
								step: 6,
								ratio: 4.79
							}
						],
						body: [
							{
								step: 1,
								ratio: 17.55
							},
							{
								step: 2,
								ratio: 13.81
							},
							{
								step: 3,
								ratio: 10.81
							},
							{
								step: 4,
								ratio: 8.28
							}
						]
					}
				}
			],
			dark: [
				{
					step: 1,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.61
							},
							{
								step: 9,
								ratio: 4.79
							},
							{
								step: 10,
								ratio: 6.33
							},
							{
								step: 11,
								ratio: 8.28
							},
							{
								step: 12,
								ratio: 10.81
							},
							{
								step: 13,
								ratio: 13.81
							},
							{
								step: 14,
								ratio: 17.55
							}
						],
						secondary: [
							{
								step: 9,
								ratio: 4.79
							},
							{
								step: 10,
								ratio: 6.33
							},
							{
								step: 11,
								ratio: 8.28
							},
							{
								step: 12,
								ratio: 10.81
							},
							{
								step: 13,
								ratio: 13.81
							},
							{
								step: 14,
								ratio: 17.55
							}
						],
						body: [
							{
								step: 11,
								ratio: 8.28
							},
							{
								step: 12,
								ratio: 10.81
							},
							{
								step: 13,
								ratio: 13.81
							},
							{
								step: 14,
								ratio: 17.55
							}
						]
					}
				},
				{
					step: 2,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.41
							},
							{
								step: 9,
								ratio: 4.54
							},
							{
								step: 10,
								ratio: 5.99
							},
							{
								step: 11,
								ratio: 7.84
							},
							{
								step: 12,
								ratio: 10.23
							},
							{
								step: 13,
								ratio: 13.08
							},
							{
								step: 14,
								ratio: 16.62
							}
						],
						secondary: [
							{
								step: 9,
								ratio: 4.54
							},
							{
								step: 10,
								ratio: 5.99
							},
							{
								step: 11,
								ratio: 7.84
							},
							{
								step: 12,
								ratio: 10.23
							},
							{
								step: 13,
								ratio: 13.08
							},
							{
								step: 14,
								ratio: 16.62
							}
						],
						body: [
							{
								step: 11,
								ratio: 7.84
							},
							{
								step: 12,
								ratio: 10.23
							},
							{
								step: 13,
								ratio: 13.08
							},
							{
								step: 14,
								ratio: 16.62
							}
						]
					}
				},
				{
					step: 3,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.08
							},
							{
								step: 9,
								ratio: 4.09
							},
							{
								step: 10,
								ratio: 5.41
							},
							{
								step: 11,
								ratio: 7.07
							},
							{
								step: 12,
								ratio: 9.23
							},
							{
								step: 13,
								ratio: 11.8
							},
							{
								step: 14,
								ratio: 14.99
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 5.41
							},
							{
								step: 11,
								ratio: 7.07
							},
							{
								step: 12,
								ratio: 9.23
							},
							{
								step: 13,
								ratio: 11.8
							},
							{
								step: 14,
								ratio: 14.99
							}
						],
						body: [
							{
								step: 11,
								ratio: 7.07
							},
							{
								step: 12,
								ratio: 9.23
							},
							{
								step: 13,
								ratio: 11.8
							},
							{
								step: 14,
								ratio: 14.99
							}
						]
					}
				},
				{
					step: 4,
					floors: {
						border: [
							{
								step: 9,
								ratio: 3.56
							},
							{
								step: 10,
								ratio: 4.7
							},
							{
								step: 11,
								ratio: 6.14
							},
							{
								step: 12,
								ratio: 8.02
							},
							{
								step: 13,
								ratio: 10.25
							},
							{
								step: 14,
								ratio: 13.03
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 4.7
							},
							{
								step: 11,
								ratio: 6.14
							},
							{
								step: 12,
								ratio: 8.02
							},
							{
								step: 13,
								ratio: 10.25
							},
							{
								step: 14,
								ratio: 13.03
							}
						],
						body: [
							{
								step: 12,
								ratio: 8.02
							},
							{
								step: 13,
								ratio: 10.25
							},
							{
								step: 14,
								ratio: 13.03
							}
						]
					}
				},
				{
					step: 5,
					floors: {
						border: [
							{
								step: 10,
								ratio: 3.84
							},
							{
								step: 11,
								ratio: 5.02
							},
							{
								step: 12,
								ratio: 6.56
							},
							{
								step: 13,
								ratio: 8.38
							},
							{
								step: 14,
								ratio: 10.65
							}
						],
						secondary: [
							{
								step: 11,
								ratio: 5.02
							},
							{
								step: 12,
								ratio: 6.56
							},
							{
								step: 13,
								ratio: 8.38
							},
							{
								step: 14,
								ratio: 10.65
							}
						],
						body: [
							{
								step: 13,
								ratio: 8.38
							},
							{
								step: 14,
								ratio: 10.65
							}
						]
					}
				},
				{
					step: 6,
					floors: {
						border: [
							{
								step: 10,
								ratio: 3.01
							},
							{
								step: 11,
								ratio: 3.93
							},
							{
								step: 12,
								ratio: 5.13
							},
							{
								step: 13,
								ratio: 6.56
							},
							{
								step: 14,
								ratio: 8.33
							}
						],
						secondary: [
							{
								step: 12,
								ratio: 5.13
							},
							{
								step: 13,
								ratio: 6.56
							},
							{
								step: 14,
								ratio: 8.33
							}
						],
						body: [
							{
								step: 14,
								ratio: 8.33
							}
						]
					}
				},
				{
					step: 7,
					floors: {
						border: [
							{
								step: 11,
								ratio: 3.02
							},
							{
								step: 12,
								ratio: 3.94
							},
							{
								step: 13,
								ratio: 5.04
							},
							{
								step: 14,
								ratio: 6.4
							}
						],
						secondary: [
							{
								step: 13,
								ratio: 5.04
							},
							{
								step: 14,
								ratio: 6.4
							}
						],
						body: []
					}
				},
				{
					step: 8,
					floors: {
						border: [
							{
								step: 1,
								ratio: 3.61
							},
							{
								step: 2,
								ratio: 3.41
							},
							{
								step: 3,
								ratio: 3.08
							},
							{
								step: 12,
								ratio: 3
							},
							{
								step: 13,
								ratio: 3.83
							},
							{
								step: 14,
								ratio: 4.87
							}
						],
						secondary: [
							{
								step: 14,
								ratio: 4.87
							}
						],
						body: []
					}
				},
				{
					step: 9,
					floors: {
						border: [
							{
								step: 1,
								ratio: 4.79
							},
							{
								step: 2,
								ratio: 4.54
							},
							{
								step: 3,
								ratio: 4.09
							},
							{
								step: 4,
								ratio: 3.56
							},
							{
								step: 14,
								ratio: 3.66
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 4.79
							},
							{
								step: 2,
								ratio: 4.54
							}
						],
						body: []
					}
				},
				{
					step: 10,
					floors: {
						border: [
							{
								step: 1,
								ratio: 6.33
							},
							{
								step: 2,
								ratio: 5.99
							},
							{
								step: 3,
								ratio: 5.41
							},
							{
								step: 4,
								ratio: 4.7
							},
							{
								step: 5,
								ratio: 3.84
							},
							{
								step: 6,
								ratio: 3.01
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 6.33
							},
							{
								step: 2,
								ratio: 5.99
							},
							{
								step: 3,
								ratio: 5.41
							},
							{
								step: 4,
								ratio: 4.7
							}
						],
						body: []
					}
				},
				{
					step: 11,
					floors: {
						border: [
							{
								step: 1,
								ratio: 8.28
							},
							{
								step: 2,
								ratio: 7.84
							},
							{
								step: 3,
								ratio: 7.07
							},
							{
								step: 4,
								ratio: 6.14
							},
							{
								step: 5,
								ratio: 5.02
							},
							{
								step: 6,
								ratio: 3.93
							},
							{
								step: 7,
								ratio: 3.02
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 8.28
							},
							{
								step: 2,
								ratio: 7.84
							},
							{
								step: 3,
								ratio: 7.07
							},
							{
								step: 4,
								ratio: 6.14
							},
							{
								step: 5,
								ratio: 5.02
							}
						],
						body: [
							{
								step: 1,
								ratio: 8.28
							},
							{
								step: 2,
								ratio: 7.84
							},
							{
								step: 3,
								ratio: 7.07
							}
						]
					}
				},
				{
					step: 12,
					floors: {
						border: [
							{
								step: 1,
								ratio: 10.81
							},
							{
								step: 2,
								ratio: 10.23
							},
							{
								step: 3,
								ratio: 9.23
							},
							{
								step: 4,
								ratio: 8.02
							},
							{
								step: 5,
								ratio: 6.56
							},
							{
								step: 6,
								ratio: 5.13
							},
							{
								step: 7,
								ratio: 3.94
							},
							{
								step: 8,
								ratio: 3
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 10.81
							},
							{
								step: 2,
								ratio: 10.23
							},
							{
								step: 3,
								ratio: 9.23
							},
							{
								step: 4,
								ratio: 8.02
							},
							{
								step: 5,
								ratio: 6.56
							},
							{
								step: 6,
								ratio: 5.13
							}
						],
						body: [
							{
								step: 1,
								ratio: 10.81
							},
							{
								step: 2,
								ratio: 10.23
							},
							{
								step: 3,
								ratio: 9.23
							},
							{
								step: 4,
								ratio: 8.02
							}
						]
					}
				},
				{
					step: 13,
					floors: {
						border: [
							{
								step: 1,
								ratio: 13.81
							},
							{
								step: 2,
								ratio: 13.08
							},
							{
								step: 3,
								ratio: 11.8
							},
							{
								step: 4,
								ratio: 10.25
							},
							{
								step: 5,
								ratio: 8.38
							},
							{
								step: 6,
								ratio: 6.56
							},
							{
								step: 7,
								ratio: 5.04
							},
							{
								step: 8,
								ratio: 3.83
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 13.81
							},
							{
								step: 2,
								ratio: 13.08
							},
							{
								step: 3,
								ratio: 11.8
							},
							{
								step: 4,
								ratio: 10.25
							},
							{
								step: 5,
								ratio: 8.38
							},
							{
								step: 6,
								ratio: 6.56
							},
							{
								step: 7,
								ratio: 5.04
							}
						],
						body: [
							{
								step: 1,
								ratio: 13.81
							},
							{
								step: 2,
								ratio: 13.08
							},
							{
								step: 3,
								ratio: 11.8
							},
							{
								step: 4,
								ratio: 10.25
							},
							{
								step: 5,
								ratio: 8.38
							}
						]
					}
				},
				{
					step: 14,
					floors: {
						border: [
							{
								step: 1,
								ratio: 17.55
							},
							{
								step: 2,
								ratio: 16.62
							},
							{
								step: 3,
								ratio: 14.99
							},
							{
								step: 4,
								ratio: 13.03
							},
							{
								step: 5,
								ratio: 10.65
							},
							{
								step: 6,
								ratio: 8.33
							},
							{
								step: 7,
								ratio: 6.4
							},
							{
								step: 8,
								ratio: 4.87
							},
							{
								step: 9,
								ratio: 3.66
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 17.55
							},
							{
								step: 2,
								ratio: 16.62
							},
							{
								step: 3,
								ratio: 14.99
							},
							{
								step: 4,
								ratio: 13.03
							},
							{
								step: 5,
								ratio: 10.65
							},
							{
								step: 6,
								ratio: 8.33
							},
							{
								step: 7,
								ratio: 6.4
							},
							{
								step: 8,
								ratio: 4.87
							}
						],
						body: [
							{
								step: 1,
								ratio: 17.55
							},
							{
								step: 2,
								ratio: 16.62
							},
							{
								step: 3,
								ratio: 14.99
							},
							{
								step: 4,
								ratio: 13.03
							},
							{
								step: 5,
								ratio: 10.65
							},
							{
								step: 6,
								ratio: 8.33
							}
						]
					}
				}
			]
		},
		colorway: {
			light: [
				{
					step: 1,
					floors: {
						border: [
							{
								step: 6,
								ratio: 3.78
							},
							{
								step: 7,
								ratio: 5.05
							},
							{
								step: 8,
								ratio: 6.74
							},
							{
								step: 9,
								ratio: 8.84
							},
							{
								step: 10,
								ratio: 11.1
							},
							{
								step: 11,
								ratio: 13.41
							},
							{
								step: 12,
								ratio: 15.35
							},
							{
								step: 13,
								ratio: 16.78
							},
							{
								step: 14,
								ratio: 17.51
							}
						],
						secondary: [
							{
								step: 7,
								ratio: 5.05
							},
							{
								step: 8,
								ratio: 6.74
							},
							{
								step: 9,
								ratio: 8.84
							},
							{
								step: 10,
								ratio: 11.1
							},
							{
								step: 11,
								ratio: 13.41
							},
							{
								step: 12,
								ratio: 15.35
							},
							{
								step: 13,
								ratio: 16.78
							},
							{
								step: 14,
								ratio: 17.51
							}
						],
						body: [
							{
								step: 9,
								ratio: 8.84
							},
							{
								step: 10,
								ratio: 11.1
							},
							{
								step: 11,
								ratio: 13.41
							},
							{
								step: 12,
								ratio: 15.35
							},
							{
								step: 13,
								ratio: 16.78
							},
							{
								step: 14,
								ratio: 17.51
							}
						]
					}
				},
				{
					step: 2,
					floors: {
						border: [
							{
								step: 7,
								ratio: 3.98
							},
							{
								step: 8,
								ratio: 5.32
							},
							{
								step: 9,
								ratio: 6.98
							},
							{
								step: 10,
								ratio: 8.76
							},
							{
								step: 11,
								ratio: 10.59
							},
							{
								step: 12,
								ratio: 12.12
							},
							{
								step: 13,
								ratio: 13.24
							},
							{
								step: 14,
								ratio: 13.82
							}
						],
						secondary: [
							{
								step: 8,
								ratio: 5.32
							},
							{
								step: 9,
								ratio: 6.98
							},
							{
								step: 10,
								ratio: 8.76
							},
							{
								step: 11,
								ratio: 10.59
							},
							{
								step: 12,
								ratio: 12.12
							},
							{
								step: 13,
								ratio: 13.24
							},
							{
								step: 14,
								ratio: 13.82
							}
						],
						body: [
							{
								step: 10,
								ratio: 8.76
							},
							{
								step: 11,
								ratio: 10.59
							},
							{
								step: 12,
								ratio: 12.12
							},
							{
								step: 13,
								ratio: 13.24
							},
							{
								step: 14,
								ratio: 13.82
							}
						]
					}
				},
				{
					step: 3,
					floors: {
						border: [
							{
								step: 7,
								ratio: 3.08
							},
							{
								step: 8,
								ratio: 4.12
							},
							{
								step: 9,
								ratio: 5.4
							},
							{
								step: 10,
								ratio: 6.78
							},
							{
								step: 11,
								ratio: 8.19
							},
							{
								step: 12,
								ratio: 9.38
							},
							{
								step: 13,
								ratio: 10.25
							},
							{
								step: 14,
								ratio: 10.7
							}
						],
						secondary: [
							{
								step: 9,
								ratio: 5.4
							},
							{
								step: 10,
								ratio: 6.78
							},
							{
								step: 11,
								ratio: 8.19
							},
							{
								step: 12,
								ratio: 9.38
							},
							{
								step: 13,
								ratio: 10.25
							},
							{
								step: 14,
								ratio: 10.7
							}
						],
						body: [
							{
								step: 11,
								ratio: 8.19
							},
							{
								step: 12,
								ratio: 9.38
							},
							{
								step: 13,
								ratio: 10.25
							},
							{
								step: 14,
								ratio: 10.7
							}
						]
					}
				},
				{
					step: 4,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.14
							},
							{
								step: 9,
								ratio: 4.12
							},
							{
								step: 10,
								ratio: 5.17
							},
							{
								step: 11,
								ratio: 6.25
							},
							{
								step: 12,
								ratio: 7.15
							},
							{
								step: 13,
								ratio: 7.81
							},
							{
								step: 14,
								ratio: 8.16
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 5.17
							},
							{
								step: 11,
								ratio: 6.25
							},
							{
								step: 12,
								ratio: 7.15
							},
							{
								step: 13,
								ratio: 7.81
							},
							{
								step: 14,
								ratio: 8.16
							}
						],
						body: [
							{
								step: 12,
								ratio: 7.15
							},
							{
								step: 13,
								ratio: 7.81
							},
							{
								step: 14,
								ratio: 8.16
							}
						]
					}
				},
				{
					step: 5,
					floors: {
						border: [
							{
								step: 9,
								ratio: 3.12
							},
							{
								step: 10,
								ratio: 3.92
							},
							{
								step: 11,
								ratio: 4.74
							},
							{
								step: 12,
								ratio: 5.42
							},
							{
								step: 13,
								ratio: 5.93
							},
							{
								step: 14,
								ratio: 6.18
							}
						],
						secondary: [
							{
								step: 11,
								ratio: 4.74
							},
							{
								step: 12,
								ratio: 5.42
							},
							{
								step: 13,
								ratio: 5.93
							},
							{
								step: 14,
								ratio: 6.18
							}
						],
						body: []
					}
				},
				{
					step: 6,
					floors: {
						border: [
							{
								step: 1,
								ratio: 3.78
							},
							{
								step: 11,
								ratio: 3.55
							},
							{
								step: 12,
								ratio: 4.06
							},
							{
								step: 13,
								ratio: 4.44
							},
							{
								step: 14,
								ratio: 4.63
							}
						],
						secondary: [
							{
								step: 14,
								ratio: 4.63
							}
						],
						body: []
					}
				},
				{
					step: 7,
					floors: {
						border: [
							{
								step: 1,
								ratio: 5.05
							},
							{
								step: 2,
								ratio: 3.98
							},
							{
								step: 3,
								ratio: 3.08
							},
							{
								step: 12,
								ratio: 3.04
							},
							{
								step: 13,
								ratio: 3.32
							},
							{
								step: 14,
								ratio: 3.47
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 5.05
							}
						],
						body: []
					}
				},
				{
					step: 8,
					floors: {
						border: [
							{
								step: 1,
								ratio: 6.74
							},
							{
								step: 2,
								ratio: 5.32
							},
							{
								step: 3,
								ratio: 4.12
							},
							{
								step: 4,
								ratio: 3.14
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 6.74
							},
							{
								step: 2,
								ratio: 5.32
							}
						],
						body: []
					}
				},
				{
					step: 9,
					floors: {
						border: [
							{
								step: 1,
								ratio: 8.84
							},
							{
								step: 2,
								ratio: 6.98
							},
							{
								step: 3,
								ratio: 5.4
							},
							{
								step: 4,
								ratio: 4.12
							},
							{
								step: 5,
								ratio: 3.12
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 8.84
							},
							{
								step: 2,
								ratio: 6.98
							},
							{
								step: 3,
								ratio: 5.4
							}
						],
						body: [
							{
								step: 1,
								ratio: 8.84
							}
						]
					}
				},
				{
					step: 10,
					floors: {
						border: [
							{
								step: 1,
								ratio: 11.1
							},
							{
								step: 2,
								ratio: 8.76
							},
							{
								step: 3,
								ratio: 6.78
							},
							{
								step: 4,
								ratio: 5.17
							},
							{
								step: 5,
								ratio: 3.92
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 11.1
							},
							{
								step: 2,
								ratio: 8.76
							},
							{
								step: 3,
								ratio: 6.78
							},
							{
								step: 4,
								ratio: 5.17
							}
						],
						body: [
							{
								step: 1,
								ratio: 11.1
							},
							{
								step: 2,
								ratio: 8.76
							}
						]
					}
				},
				{
					step: 11,
					floors: {
						border: [
							{
								step: 1,
								ratio: 13.41
							},
							{
								step: 2,
								ratio: 10.59
							},
							{
								step: 3,
								ratio: 8.19
							},
							{
								step: 4,
								ratio: 6.25
							},
							{
								step: 5,
								ratio: 4.74
							},
							{
								step: 6,
								ratio: 3.55
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 13.41
							},
							{
								step: 2,
								ratio: 10.59
							},
							{
								step: 3,
								ratio: 8.19
							},
							{
								step: 4,
								ratio: 6.25
							},
							{
								step: 5,
								ratio: 4.74
							}
						],
						body: [
							{
								step: 1,
								ratio: 13.41
							},
							{
								step: 2,
								ratio: 10.59
							},
							{
								step: 3,
								ratio: 8.19
							}
						]
					}
				},
				{
					step: 12,
					floors: {
						border: [
							{
								step: 1,
								ratio: 15.35
							},
							{
								step: 2,
								ratio: 12.12
							},
							{
								step: 3,
								ratio: 9.38
							},
							{
								step: 4,
								ratio: 7.15
							},
							{
								step: 5,
								ratio: 5.42
							},
							{
								step: 6,
								ratio: 4.06
							},
							{
								step: 7,
								ratio: 3.04
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 15.35
							},
							{
								step: 2,
								ratio: 12.12
							},
							{
								step: 3,
								ratio: 9.38
							},
							{
								step: 4,
								ratio: 7.15
							},
							{
								step: 5,
								ratio: 5.42
							}
						],
						body: [
							{
								step: 1,
								ratio: 15.35
							},
							{
								step: 2,
								ratio: 12.12
							},
							{
								step: 3,
								ratio: 9.38
							},
							{
								step: 4,
								ratio: 7.15
							}
						]
					}
				},
				{
					step: 13,
					floors: {
						border: [
							{
								step: 1,
								ratio: 16.78
							},
							{
								step: 2,
								ratio: 13.24
							},
							{
								step: 3,
								ratio: 10.25
							},
							{
								step: 4,
								ratio: 7.81
							},
							{
								step: 5,
								ratio: 5.93
							},
							{
								step: 6,
								ratio: 4.44
							},
							{
								step: 7,
								ratio: 3.32
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 16.78
							},
							{
								step: 2,
								ratio: 13.24
							},
							{
								step: 3,
								ratio: 10.25
							},
							{
								step: 4,
								ratio: 7.81
							},
							{
								step: 5,
								ratio: 5.93
							}
						],
						body: [
							{
								step: 1,
								ratio: 16.78
							},
							{
								step: 2,
								ratio: 13.24
							},
							{
								step: 3,
								ratio: 10.25
							},
							{
								step: 4,
								ratio: 7.81
							}
						]
					}
				},
				{
					step: 14,
					floors: {
						border: [
							{
								step: 1,
								ratio: 17.51
							},
							{
								step: 2,
								ratio: 13.82
							},
							{
								step: 3,
								ratio: 10.7
							},
							{
								step: 4,
								ratio: 8.16
							},
							{
								step: 5,
								ratio: 6.18
							},
							{
								step: 6,
								ratio: 4.63
							},
							{
								step: 7,
								ratio: 3.47
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 17.51
							},
							{
								step: 2,
								ratio: 13.82
							},
							{
								step: 3,
								ratio: 10.7
							},
							{
								step: 4,
								ratio: 8.16
							},
							{
								step: 5,
								ratio: 6.18
							},
							{
								step: 6,
								ratio: 4.63
							}
						],
						body: [
							{
								step: 1,
								ratio: 17.51
							},
							{
								step: 2,
								ratio: 13.82
							},
							{
								step: 3,
								ratio: 10.7
							},
							{
								step: 4,
								ratio: 8.16
							}
						]
					}
				}
			],
			dark: [
				{
					step: 1,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.47
							},
							{
								step: 9,
								ratio: 4.63
							},
							{
								step: 10,
								ratio: 6.18
							},
							{
								step: 11,
								ratio: 8.16
							},
							{
								step: 12,
								ratio: 10.7
							},
							{
								step: 13,
								ratio: 13.82
							},
							{
								step: 14,
								ratio: 17.51
							}
						],
						secondary: [
							{
								step: 9,
								ratio: 4.63
							},
							{
								step: 10,
								ratio: 6.18
							},
							{
								step: 11,
								ratio: 8.16
							},
							{
								step: 12,
								ratio: 10.7
							},
							{
								step: 13,
								ratio: 13.82
							},
							{
								step: 14,
								ratio: 17.51
							}
						],
						body: [
							{
								step: 11,
								ratio: 8.16
							},
							{
								step: 12,
								ratio: 10.7
							},
							{
								step: 13,
								ratio: 13.82
							},
							{
								step: 14,
								ratio: 17.51
							}
						]
					}
				},
				{
					step: 2,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.32
							},
							{
								step: 9,
								ratio: 4.44
							},
							{
								step: 10,
								ratio: 5.93
							},
							{
								step: 11,
								ratio: 7.81
							},
							{
								step: 12,
								ratio: 10.25
							},
							{
								step: 13,
								ratio: 13.24
							},
							{
								step: 14,
								ratio: 16.78
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 5.93
							},
							{
								step: 11,
								ratio: 7.81
							},
							{
								step: 12,
								ratio: 10.25
							},
							{
								step: 13,
								ratio: 13.24
							},
							{
								step: 14,
								ratio: 16.78
							}
						],
						body: [
							{
								step: 11,
								ratio: 7.81
							},
							{
								step: 12,
								ratio: 10.25
							},
							{
								step: 13,
								ratio: 13.24
							},
							{
								step: 14,
								ratio: 16.78
							}
						]
					}
				},
				{
					step: 3,
					floors: {
						border: [
							{
								step: 8,
								ratio: 3.04
							},
							{
								step: 9,
								ratio: 4.06
							},
							{
								step: 10,
								ratio: 5.42
							},
							{
								step: 11,
								ratio: 7.15
							},
							{
								step: 12,
								ratio: 9.38
							},
							{
								step: 13,
								ratio: 12.12
							},
							{
								step: 14,
								ratio: 15.35
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 5.42
							},
							{
								step: 11,
								ratio: 7.15
							},
							{
								step: 12,
								ratio: 9.38
							},
							{
								step: 13,
								ratio: 12.12
							},
							{
								step: 14,
								ratio: 15.35
							}
						],
						body: [
							{
								step: 11,
								ratio: 7.15
							},
							{
								step: 12,
								ratio: 9.38
							},
							{
								step: 13,
								ratio: 12.12
							},
							{
								step: 14,
								ratio: 15.35
							}
						]
					}
				},
				{
					step: 4,
					floors: {
						border: [
							{
								step: 9,
								ratio: 3.55
							},
							{
								step: 10,
								ratio: 4.74
							},
							{
								step: 11,
								ratio: 6.25
							},
							{
								step: 12,
								ratio: 8.19
							},
							{
								step: 13,
								ratio: 10.59
							},
							{
								step: 14,
								ratio: 13.41
							}
						],
						secondary: [
							{
								step: 10,
								ratio: 4.74
							},
							{
								step: 11,
								ratio: 6.25
							},
							{
								step: 12,
								ratio: 8.19
							},
							{
								step: 13,
								ratio: 10.59
							},
							{
								step: 14,
								ratio: 13.41
							}
						],
						body: [
							{
								step: 12,
								ratio: 8.19
							},
							{
								step: 13,
								ratio: 10.59
							},
							{
								step: 14,
								ratio: 13.41
							}
						]
					}
				},
				{
					step: 5,
					floors: {
						border: [
							{
								step: 10,
								ratio: 3.92
							},
							{
								step: 11,
								ratio: 5.17
							},
							{
								step: 12,
								ratio: 6.78
							},
							{
								step: 13,
								ratio: 8.76
							},
							{
								step: 14,
								ratio: 11.1
							}
						],
						secondary: [
							{
								step: 11,
								ratio: 5.17
							},
							{
								step: 12,
								ratio: 6.78
							},
							{
								step: 13,
								ratio: 8.76
							},
							{
								step: 14,
								ratio: 11.1
							}
						],
						body: [
							{
								step: 13,
								ratio: 8.76
							},
							{
								step: 14,
								ratio: 11.1
							}
						]
					}
				},
				{
					step: 6,
					floors: {
						border: [
							{
								step: 10,
								ratio: 3.12
							},
							{
								step: 11,
								ratio: 4.12
							},
							{
								step: 12,
								ratio: 5.4
							},
							{
								step: 13,
								ratio: 6.98
							},
							{
								step: 14,
								ratio: 8.84
							}
						],
						secondary: [
							{
								step: 12,
								ratio: 5.4
							},
							{
								step: 13,
								ratio: 6.98
							},
							{
								step: 14,
								ratio: 8.84
							}
						],
						body: [
							{
								step: 14,
								ratio: 8.84
							}
						]
					}
				},
				{
					step: 7,
					floors: {
						border: [
							{
								step: 11,
								ratio: 3.14
							},
							{
								step: 12,
								ratio: 4.12
							},
							{
								step: 13,
								ratio: 5.32
							},
							{
								step: 14,
								ratio: 6.74
							}
						],
						secondary: [
							{
								step: 13,
								ratio: 5.32
							},
							{
								step: 14,
								ratio: 6.74
							}
						],
						body: []
					}
				},
				{
					step: 8,
					floors: {
						border: [
							{
								step: 1,
								ratio: 3.47
							},
							{
								step: 2,
								ratio: 3.32
							},
							{
								step: 3,
								ratio: 3.04
							},
							{
								step: 12,
								ratio: 3.08
							},
							{
								step: 13,
								ratio: 3.98
							},
							{
								step: 14,
								ratio: 5.05
							}
						],
						secondary: [
							{
								step: 14,
								ratio: 5.05
							}
						],
						body: []
					}
				},
				{
					step: 9,
					floors: {
						border: [
							{
								step: 1,
								ratio: 4.63
							},
							{
								step: 2,
								ratio: 4.44
							},
							{
								step: 3,
								ratio: 4.06
							},
							{
								step: 4,
								ratio: 3.55
							},
							{
								step: 14,
								ratio: 3.78
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 4.63
							}
						],
						body: []
					}
				},
				{
					step: 10,
					floors: {
						border: [
							{
								step: 1,
								ratio: 6.18
							},
							{
								step: 2,
								ratio: 5.93
							},
							{
								step: 3,
								ratio: 5.42
							},
							{
								step: 4,
								ratio: 4.74
							},
							{
								step: 5,
								ratio: 3.92
							},
							{
								step: 6,
								ratio: 3.12
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 6.18
							},
							{
								step: 2,
								ratio: 5.93
							},
							{
								step: 3,
								ratio: 5.42
							},
							{
								step: 4,
								ratio: 4.74
							}
						],
						body: []
					}
				},
				{
					step: 11,
					floors: {
						border: [
							{
								step: 1,
								ratio: 8.16
							},
							{
								step: 2,
								ratio: 7.81
							},
							{
								step: 3,
								ratio: 7.15
							},
							{
								step: 4,
								ratio: 6.25
							},
							{
								step: 5,
								ratio: 5.17
							},
							{
								step: 6,
								ratio: 4.12
							},
							{
								step: 7,
								ratio: 3.14
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 8.16
							},
							{
								step: 2,
								ratio: 7.81
							},
							{
								step: 3,
								ratio: 7.15
							},
							{
								step: 4,
								ratio: 6.25
							},
							{
								step: 5,
								ratio: 5.17
							}
						],
						body: [
							{
								step: 1,
								ratio: 8.16
							},
							{
								step: 2,
								ratio: 7.81
							},
							{
								step: 3,
								ratio: 7.15
							}
						]
					}
				},
				{
					step: 12,
					floors: {
						border: [
							{
								step: 1,
								ratio: 10.7
							},
							{
								step: 2,
								ratio: 10.25
							},
							{
								step: 3,
								ratio: 9.38
							},
							{
								step: 4,
								ratio: 8.19
							},
							{
								step: 5,
								ratio: 6.78
							},
							{
								step: 6,
								ratio: 5.4
							},
							{
								step: 7,
								ratio: 4.12
							},
							{
								step: 8,
								ratio: 3.08
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 10.7
							},
							{
								step: 2,
								ratio: 10.25
							},
							{
								step: 3,
								ratio: 9.38
							},
							{
								step: 4,
								ratio: 8.19
							},
							{
								step: 5,
								ratio: 6.78
							},
							{
								step: 6,
								ratio: 5.4
							}
						],
						body: [
							{
								step: 1,
								ratio: 10.7
							},
							{
								step: 2,
								ratio: 10.25
							},
							{
								step: 3,
								ratio: 9.38
							},
							{
								step: 4,
								ratio: 8.19
							}
						]
					}
				},
				{
					step: 13,
					floors: {
						border: [
							{
								step: 1,
								ratio: 13.82
							},
							{
								step: 2,
								ratio: 13.24
							},
							{
								step: 3,
								ratio: 12.12
							},
							{
								step: 4,
								ratio: 10.59
							},
							{
								step: 5,
								ratio: 8.76
							},
							{
								step: 6,
								ratio: 6.98
							},
							{
								step: 7,
								ratio: 5.32
							},
							{
								step: 8,
								ratio: 3.98
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 13.82
							},
							{
								step: 2,
								ratio: 13.24
							},
							{
								step: 3,
								ratio: 12.12
							},
							{
								step: 4,
								ratio: 10.59
							},
							{
								step: 5,
								ratio: 8.76
							},
							{
								step: 6,
								ratio: 6.98
							},
							{
								step: 7,
								ratio: 5.32
							}
						],
						body: [
							{
								step: 1,
								ratio: 13.82
							},
							{
								step: 2,
								ratio: 13.24
							},
							{
								step: 3,
								ratio: 12.12
							},
							{
								step: 4,
								ratio: 10.59
							},
							{
								step: 5,
								ratio: 8.76
							}
						]
					}
				},
				{
					step: 14,
					floors: {
						border: [
							{
								step: 1,
								ratio: 17.51
							},
							{
								step: 2,
								ratio: 16.78
							},
							{
								step: 3,
								ratio: 15.35
							},
							{
								step: 4,
								ratio: 13.41
							},
							{
								step: 5,
								ratio: 11.1
							},
							{
								step: 6,
								ratio: 8.84
							},
							{
								step: 7,
								ratio: 6.74
							},
							{
								step: 8,
								ratio: 5.05
							},
							{
								step: 9,
								ratio: 3.78
							}
						],
						secondary: [
							{
								step: 1,
								ratio: 17.51
							},
							{
								step: 2,
								ratio: 16.78
							},
							{
								step: 3,
								ratio: 15.35
							},
							{
								step: 4,
								ratio: 13.41
							},
							{
								step: 5,
								ratio: 11.1
							},
							{
								step: 6,
								ratio: 8.84
							},
							{
								step: 7,
								ratio: 6.74
							},
							{
								step: 8,
								ratio: 5.05
							}
						],
						body: [
							{
								step: 1,
								ratio: 17.51
							},
							{
								step: 2,
								ratio: 16.78
							},
							{
								step: 3,
								ratio: 15.35
							},
							{
								step: 4,
								ratio: 13.41
							},
							{
								step: 5,
								ratio: 11.1
							},
							{
								step: 6,
								ratio: 8.84
							}
						]
					}
				}
			]
		}
	}
};
