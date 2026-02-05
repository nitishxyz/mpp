"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cva, cx } from "class-variance-authority";
import {
	Children,
	createContext,
	isValidElement,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import {
	useConnect,
	useConnection,
	useConnectors,
	useDisconnect,
} from "wagmi";
import { Hooks } from "wagmi/tempo";

export const Context = createContext<Context.Value>({
	balance: {
		address: undefined,
		balance: undefined,
		initial: undefined,
		spent: 0n,
		token: undefined,
	},
	interaction: {
		active: null,
		setActive: () => { },
	},
	steps: {
		index: 0,
		next: () => { },
		prev: () => { },
		reset: () => { },
	},
});

export namespace Context {
	export type InteractionType = "select" | "toggle" | null;

	export type Balance = {
		address: Address | undefined;
		balance: bigint | undefined;
		initial: bigint | undefined;
		spent: bigint;
		token: Address | undefined;
	};

	export type Interaction = {
		active: InteractionType;
		setActive: (type: InteractionType) => void;
	};

	export type Steps = {
		index: number;
		next: () => void;
		prev: () => void;
		reset: () => void;
	};

	export type Value = {
		balance: Balance;
		interaction: Interaction;
		steps: Steps;
	};
}

export function Window({ children, className, token }: Window.Props) {
	const { address } = useConnection();

	const [initial, setInitial] = useState<bigint | undefined>(undefined);
	const [active, setActive] = useState<Context.InteractionType>(null);
	const [stepIndex, setStepIndex] = useState(0);

	const { data: balance } = Hooks.token.useGetBalance({
		account: address,
		token,
		query: {
			enabled: !!address && !!token,
			refetchInterval: 1_000,
		},
	});

	useEffect(() => {
		if (!address) {
			setInitial(undefined);
			return;
		}
		if (balance !== undefined && initial === undefined) setInitial(balance);
	}, [address, balance, initial]);

	const spent =
		initial !== undefined && balance !== undefined && initial > balance
			? initial - balance
			: 0n;

	const next = useCallback(() => setStepIndex((i) => i + 1), []);
	const prev = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);
	const reset = useCallback(() => setStepIndex(0), []);

	const steps = useMemo(
		() => ({ index: stepIndex, next, prev, reset }),
		[stepIndex, next, prev, reset],
	);

	return (
		<Context.Provider
			value={{
				balance: { address, balance, initial, spent, token },
				interaction: { active, setActive },
				steps,
			}}
		>
			<div
				className={cx(
					"bg-gray2 rounded-xl overflow-hidden font-mono text-sm border border-primary",
					className,
				)}
			>
				{children}
			</div>
		</Context.Provider>
	);
}

export namespace Window {
	export type Props = {
		children: ReactNode;
		className?: string;
		token?: Address;
	};
}

export function TitleBar({ title, children, className }: TitleBar.Props) {
	return (
		<div
			className={cx(
				"flex items-center justify-between px-4 h-9 border-b border-primary bg-primary text-secondary",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				<div className="flex gap-1.5">
					<span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
					<span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
					<span className="w-3 h-3 rounded-full bg-[#27c93f]" />
				</div>
				{title && (
					<span className="text-[13px] tracking-tight ml-2 mt-[2px]">
						{title}
					</span>
				)}
			</div>
			{children && (
				<div className="flex items-center gap-3 text-xs">{children}</div>
			)}
		</div>
	);
}

export namespace TitleBar {
	export type Props = {
		title?: string;
		children?: ReactNode;
		className?: string;
	};
}

export function Panel({
	children,
	height,
	autoScroll,
	className,
}: Panel.Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (autoScroll && ref.current) {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
	});

	return (
		<div
			ref={ref}
			className={cx(
				"p-4 overflow-y-auto bg-primary flex flex-col-reverse",
				className,
			)}
			style={height ? { height } : undefined}
		>
			<div className="flex flex-col gap-6">{children}</div>
		</div>
	);
}

export namespace Panel {
	export type Props = {
		children: ReactNode;
		height?: number;
		autoScroll?: boolean;
		className?: string;
	};
}

export function Line({ variant, prefix, children, className }: Line.Props) {
	return (
		<div
			className={cva("leading-normal whitespace-nowrap", {
				variants: {
					variant: {
						default: "text-primary",
						info: "text-gray8",
						success: "text-success",
						error: "text-destructive",
						input: "text-primary",
						warning: "text-warning",
						loading: "text-secondary",
					},
				},
				defaultVariants: {
					variant: "default",
				},
			})({ variant, className })}
		>
			{variant === "loading" && <Spinner />}
			{prefix && (
				<span
					className={cva("", {
						variants: {
							variant: {
								default: "text-primary",
								info: "text-gray8",
								success: "text-success",
								error: "text-destructive",
								input: "text-accent8",
								warning: "text-warning",
								loading:
									"text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
							},
						},
						defaultVariants: {
							variant: "default",
						},
					})({ variant })}
				>
					{prefix}{" "}
				</span>
			)}
			{children}
		</div>
	);
}

function Spinner() {
	const [frame, setFrame] = useState(0);
	const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

	useEffect(() => {
		const interval = setInterval(() => {
			setFrame((f) => (f + 1) % frames.length);
		}, 80);
		return () => clearInterval(interval);
	}, []);

	return (
		<span className="text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]">
			{frames[frame]}{" "}
		</span>
	);
}

export namespace Line {
	export type Variant =
		| "default"
		| "info"
		| "success"
		| "error"
		| "input"
		| "warning"
		| "loading";

	export type Props = {
		variant?: Variant;
		prefix?: "❯" | "✓" | "✗" | "→";
		children: ReactNode;
		className?: string;
	};
}

export function Block({ children, className }: Block.Props) {
	return <div className={cx("flex flex-col gap-1", className)}>{children}</div>;
}

export namespace Block {
	export type Props = {
		children: ReactNode;
		className?: string;
	};

	export function Startup() {
		const { steps } = useContext(Context);
		const [phase, setPhase] = useState<"init" | "ready">("init");

		useEffect(() => {
			if (steps.index !== 0) return;

			setPhase("init");

			const initTimer = setTimeout(() => setPhase("ready"), 1000);
			const nextTimer = setTimeout(() => steps.next(), 2000);

			return () => {
				clearTimeout(initTimer);
				clearTimeout(nextTimer);
			};
		}, [steps]);

		return (
			<Block>
				<Line>MPP Agent Demo v0.1.0</Line>
				{phase === "init" ? (
					<Line variant="loading">Initializing...</Line>
				) : (
					<Line variant="success" prefix="✓">
						Agent ready
					</Line>
				)}
			</Block>
		);
	}

	export function ConnectWallet() {
		const { steps } = useContext(Context);
		const { address } = useConnection();
		const connectors = useConnectors();
		const { connect, isPending } = useConnect();

		const connector = connectors[0];

		useEffect(() => {
			if (address) {
				const timer = setTimeout(() => steps.next(), 500);
				return () => clearTimeout(timer);
			}
		}, [address, steps]);

		return (
			<Block>
				<Line variant="info">
					Create a Tempo Wallet, or use your existing one:
				</Line>
				{address ? (
					<Line variant="success" prefix="✓">
						Connected: {address.slice(0, 10)}…{address.slice(-8)}
					</Line>
				) : isPending ? (
					<Line variant="loading">Connecting...</Line>
				) : (
					<Toggle
						autoFocus
						onSubmit={(type) => {
							if (connector) {
								connect(
									{
										connector,
										capabilities: { type: type as "sign-in" | "sign-up" },
									},
									{ onSuccess: () => steps.next() },
								);
							}
						}}
					>
						<Toggle.Option value="sign-in">Sign In</Toggle.Option>
						<Toggle.Option value="sign-up">Sign Up</Toggle.Option>
					</Toggle>
				)}
			</Block>
		);
	}

	export function Faucet() {
		const { steps, balance: ctx } = useContext(Context);
		const { address } = useConnection();
		const { mutate, isPending, isSuccess } = Hooks.faucet.useFundSync();
		const [alreadyFunded, setAlreadyFunded] = useState(false);

		useEffect(() => {
			if (!address) return;
			if (isPending) return;
			if (isSuccess) return;
			if (alreadyFunded) return;
			if (ctx.initial === undefined) return;
			if (ctx.initial > 0n) {
				setAlreadyFunded(true);
				return;
			}

			mutate({ account: address });
		}, [address, alreadyFunded, ctx.initial, isPending, isSuccess, mutate]);

		useEffect(() => {
			if (isSuccess || alreadyFunded) {
				const timer = setTimeout(() => steps.next(), 1000);
				return () => clearTimeout(timer);
			}
		}, [alreadyFunded, isSuccess, steps]);

		if (!address) return null;

		const funded = isSuccess || alreadyFunded;

		return (
			<Block>
				{isPending && (
					<Line variant="loading">Requesting testnet funds...</Line>
				)}
				{funded && (
					<Line variant="success" prefix="✓">
						Wallet funded
					</Line>
				)}
			</Block>
		);
	}
}

export function Link({ href, children, className }: Link.Props) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={cx(
				"text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))] underline block leading-relaxed",
				className,
			)}
		>
			{children}
		</a>
	);
}

export namespace Link {
	export type Props = {
		href: string;
		children: ReactNode;
		className?: string;
	};
}

export function Blank({ className }: Blank.Props) {
	return <div className={cx("h-4", className)} />;
}

export namespace Blank {
	export type Props = {
		className?: string;
	};
}

export function CtaBar({ className, left, right }: CtaBar.Props) {
	return (
		<div
			className={cx(
				"flex items-center justify-between px-4 h-9 border-t border-primary bg-primary text-xs",
				className,
			)}
		>
			<div className="flex items-center gap-3">{left}</div>
			<div className="flex items-center gap-3">{right}</div>
		</div>
	);
}

export namespace CtaBar {
	export type Props = {
		className?: string;
		left?: ReactNode;
		right?: ReactNode;
	};
}

export function Balance({ className, label = "Balance" }: Balance.Props) {
	const { balance: { balance } } = useContext(Context);

	if (balance === undefined) return null;

	const formatted = formatUnits(balance, 6);
	const display = Number(formatted).toLocaleString("en-US", {
		maximumFractionDigits: 4,
		minimumFractionDigits: 2,
	});

	return (
		<span className={cx("text-secondary", className)}>
			{label}: <span className="text-success">${display}</span>
		</span>
	);
}

export namespace Balance {
	export type Props = {
		className?: string;
		label?: string;
	};
}

export function Spent({ className, label = "Spent" }: Spent.Props) {
	const { balance } = useContext(Context);
	const { address, spent } = balance;

	if (!address) return null;

	const formatted = formatUnits(spent, 6);
	const display = Number(formatted).toLocaleString("en-US", {
		maximumFractionDigits: 4,
		minimumFractionDigits: 2,
	});

	return (
		<span className={cx("text-secondary", className)}>
			{label}: <span className="text-warning">${display}</span>
		</span>
	);
}

export namespace Spent {
	export type Props = {
		className?: string;
		label?: string;
	};
}

export function Status({ children, className, variant }: Status.Props) {
	return (
		<span
			className={cva(
				"px-2 py-0.5 rounded text-[10px] uppercase tracking-wider",
				{
					variants: {
						variant: {
							complete: "bg-success/20 text-success",
							error: "bg-destructive/20 text-destructive",
							idle: "bg-gray8/20 text-gray8",
							ready: "bg-gray8/20 text-gray8",
							running: "bg-warning/20 text-warning",
						},
					},
					defaultVariants: {
						variant: "idle",
					},
				},
			)({ variant, className })}
		>
			{children}
		</span>
	);
}

export namespace Status {
	export type Variant = "complete" | "error" | "idle" | "ready" | "running";

	export type Props = {
		children: ReactNode;
		className?: string;
		variant?: Variant;
	};
}

export function StatusDot({ children, className, variant }: StatusDot.Props) {
	return (
		<span className={cx("flex items-center gap-2 text-secondary", className)}>
			<span
				className={cva("w-2 h-2 rounded-full", {
					variants: {
						variant: {
							error: "bg-destructive",
							offline: "bg-gray8",
							success: "bg-success",
							warning: "bg-warning",
						},
					},
					defaultVariants: {
						variant: "success",
					},
				})({ variant })}
			/>
			{children}
		</span>
	);
}

export namespace StatusDot {
	export type Variant = "error" | "offline" | "success" | "warning";

	export type Props = {
		children: ReactNode;
		className?: string;
		variant?: Variant;
	};
}

const SelectContext = createContext<{
	onSubmit?: (value: string) => void;
	currentValue: string;
}>({ currentValue: "" });

function getFirstOptionValue(children: ReactNode): string {
	const childArray = Children.toArray(children);
	for (const child of childArray) {
		if (
			isValidElement<{ value?: string }>(child) &&
			typeof child.props.value === "string"
		) {
			return child.props.value;
		}
	}
	return "";
}

export function Select({
	autoFocus,
	children,
	className,
	disabled,
	onChange,
	onSubmit,
	value,
}: Select.Props) {
	const { interaction } = useContext(Context);
	const ref = useRef<HTMLDivElement>(null);
	const firstValue = getFirstOptionValue(children);
	const [internalValue, setInternalValue] = useState(firstValue);

	const currentValue = value ?? internalValue;

	useEffect(() => {
		if (!disabled) {
			interaction.setActive("select");
			return () => interaction.setActive(null);
		}
		interaction.setActive(null);
	}, [disabled, interaction]);

	useEffect(() => {
		if (autoFocus && !disabled && ref.current) {
			const firstRadio =
				ref.current.querySelector<HTMLElement>('[role="radio"]');
			firstRadio?.focus();
		}
	}, [autoFocus, disabled]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !disabled && currentValue) {
			e.preventDefault();
			onSubmit?.(currentValue);
		}
	};

	return (
		<SelectContext.Provider value={{ onSubmit, currentValue }}>
			<RadioGroup
				ref={ref}
				value={currentValue}
				onValueChange={(val) => {
					const v = val as string;
					setInternalValue(v);
					onChange?.(v);
				}}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				className={cx("flex flex-col [counter-reset:option]", className)}
			>
				{children}
			</RadioGroup>
		</SelectContext.Provider>
	);
}

export namespace Select {
	export type Props = {
		autoFocus?: boolean;
		children: ReactNode;
		className?: string;
		disabled?: boolean;
		onChange?: (value: string) => void;
		onSubmit?: (value: string) => void;
		value?: string;
	};

	export function Option({ children, className, value }: Option.Props) {
		const { onSubmit } = useContext(SelectContext);

		return (
			// biome-ignore lint/a11y/noLabelWithoutControl: Radio.Root renders an input
			<label
				className={cx(
					"flex items-center text-left py-0.5 px-1.5 -mx-1.5 rounded transition-colors cursor-pointer",
					"text-primary",
					"has-[[data-checked]]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
					"has-[[data-checked]]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
					"has-[:focus-visible]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
					"has-[:focus-visible]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
					"[counter-increment:option]",
					className,
				)}
				onPointerUp={() => onSubmit?.(value)}
			>
				<Radio.Root value={value} className="peer sr-only" />
				<span className="w-3 invisible peer-data-[checked]:visible peer-focus-visible:visible">
					▸
				</span>
				<span className="text-gray8 w-5 before:content-[counter(option)'.']" />
				<span>{children}</span>
			</label>
		);
	}

	export namespace Option {
		export type Props = {
			children: ReactNode;
			className?: string;
			value: string;
		};
	}
}

const ToggleContext = createContext<{
	onSubmit?: (value: string) => void;
	currentValue: string;
}>({ currentValue: "" });

export function Toggle({
	autoFocus,
	children,
	className,
	disabled,
	onChange,
	onSubmit,
	value,
}: Toggle.Props) {
	const { interaction } = useContext(Context);
	const ref = useRef<HTMLDivElement>(null);
	const firstValue = getFirstOptionValue(children);
	const [internalValue, setInternalValue] = useState(firstValue);

	const currentValue = value ?? internalValue;

	useEffect(() => {
		if (!disabled) {
			interaction.setActive("toggle");
			return () => interaction.setActive(null);
		}
		interaction.setActive(null);
	}, [disabled, interaction]);

	useEffect(() => {
		if (autoFocus && !disabled && ref.current) {
			const firstRadio =
				ref.current.querySelector<HTMLElement>('[role="radio"]');
			firstRadio?.focus();
		}
	}, [autoFocus, disabled]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !disabled && currentValue) {
			e.preventDefault();
			onSubmit?.(currentValue);
		}
	};

	return (
		<ToggleContext.Provider value={{ onSubmit, currentValue }}>
			<RadioGroup
				ref={ref}
				value={currentValue}
				onValueChange={(val) => {
					const v = val as string;
					setInternalValue(v);
					onChange?.(v);
				}}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				className={cx("flex flex-row gap-2", className)}
			>
				{children}
			</RadioGroup>
		</ToggleContext.Provider>
	);
}

export namespace Toggle {
	export type Props = {
		autoFocus?: boolean;
		children: ReactNode;
		className?: string;
		disabled?: boolean;
		onChange?: (value: string) => void;
		onSubmit?: (value: string) => void;
		value?: string;
	};

	export function Option({ children, className, value }: Option.Props) {
		const { onSubmit } = useContext(ToggleContext);

		return (
			// biome-ignore lint/a11y/noLabelWithoutControl: Radio.Root renders an input
			<label
				className={cx(
					"flex items-center px-3 py-1 rounded cursor-pointer transition-colors",
					"text-secondary",
					"has-[[data-checked]]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
					"has-[[data-checked]]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
					"has-[:focus-visible]:bg-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]/10",
					"has-[:focus-visible]:text-[light-dark(var(--vocs-color-accent),var(--vocs-color-accent8))]",
					className,
				)}
				onPointerUp={() => onSubmit?.(value)}
			>
				<Radio.Root value={value} className="sr-only" />
				<span>{children}</span>
			</label>
		);
	}

	export namespace Option {
		export type Props = {
			children: ReactNode;
			className?: string;
			value: string;
		};
	}
}

export function Hint({ className }: Hint.Props) {
	const { interaction } = useContext(Context);
	const { address } = useConnection();

	if (!interaction.active) {
		return (
			<StatusDot
				variant={address ? "success" : "offline"}
				className={className}
			>
				{address ? "Connected" : "Disconnected"}
			</StatusDot>
		);
	}

	const hints: Record<NonNullable<Context.InteractionType>, string> = {
		select: "↑↓ or click to select",
		toggle: "←→ or click to select",
	};

	return (
		<span className={cx("text-gray8", className)}>
			{hints[interaction.active]}
		</span>
	);
}

export namespace Hint {
	export type Props = {
		className?: string;
	};
}

export function Account({ className }: Account.Props) {
	const { address } = useConnection();
	const { disconnect } = useDisconnect();

	if (!address) return null;

	return (
		<span className={cx("flex items-center gap-2", className)}>
			<span className="text-primary">
				{address.slice(0, 6)}…{address.slice(-4)}
			</span>
			<button
				type="button"
				onClick={() => disconnect()}
				className="text-secondary hover:text-primary transition-colors tracking-tight"
			>
				Log out
			</button>
		</span>
	);
}

export namespace Account {
	export type Props = {
		className?: string;
	};
}

export function Refresh({ className }: Refresh.Props) {
	const { steps } = useContext(Context);
	const { address } = useConnection();

	if (address) return null;

	return (
		<button
			type="button"
			onClick={() => steps.reset()}
			className={cx(
				"text-secondary hover:text-primary transition-colors tracking-tight",
				className,
			)}
		>
			Refresh
		</button>
	);
}

export namespace Refresh {
	export type Props = {
		className?: string;
	};
}

export function Steps({ children }: Steps.Props) {
	const { steps } = useContext(Context);
	const childArray = Children.toArray(children);

	return <>{childArray.slice(0, steps.index + 1)}</>;
}

export namespace Steps {
	export type Props = {
		children: ReactNode;
	};
}

export function Step({ children }: Step.Props) {
	return <>{children}</>;
}

export namespace Step {
	export type Props = {
		children: ReactNode;
	};
}
