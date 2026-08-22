/*
 * Colour derivation record — GENERATED, do not edit by hand.
 *
 *   node scripts/generate-color-ladder.mjs
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
	"n4",
	"n3",
	"n2",
	"n1",
	"0",
	"1",
	"2",
	"3",
	"4"
];

/** Surface lightness per scheme, per layer. Chroma and hue come from the tint. */
export const SURFACE_FACTS: Record<string, Record<string, number>> = {
	light: {
		"0": 0.898,
		"1": 0.926,
		"2": 0.953,
		"3": 0.978,
		"4": 1,
		n1: 0.855,
		n2: 0.812,
		n3: 0.769,
		n4: 0.726
	},
	dark: {
		"0": 0.232,
		"1": 0.272,
		"2": 0.311,
		"3": 0.351,
		"4": 0.39,
		n1: 0.187,
		n2: 0.142,
		n3: 0.097,
		n4: 0.052
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
		below: 4,
		above: 4
	},
	ramp: {
		light: {
			page: 0.898,
			up: 0.028,
			ease: 0.95,
			down: 0.043,
			min: 0.6,
			max: 1
		},
		dark: {
			page: 0.232,
			up: 0.0395,
			ease: 1,
			down: 0.045,
			min: 0.03,
			max: 0.44
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
