"use client";

import { cva, cx } from "class-variance-authority";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { useBlockNumber } from "wagmi";
import { Hooks } from "wagmi/tempo";

export const Context = createContext<Context.Value>({
	address: undefined,
	initial: undefined,
	spent: 0n,
	token: undefined,
});

export namespace Context {
	export type Value = {
		address: Address | undefined;
		initial: bigint | undefined;
		spent: bigint;
		token: Address | undefined;
	};
}

export function Window({ address, children, className, token }: Window.Props) {
	const [initial, setInitial] = useState<bigint | undefined>(undefined);

	const { data: balance, refetch: refetchBalance } = Hooks.token.useGetBalance({
		account: address,
		token,
		query: { enabled: !!address && !!token },
	});

	const { data: blockNumber } = useBlockNumber({
		query: {
			enabled: !!address && !!token,
			refetchInterval: 1_500,
		},
	});

	useEffect(() => {
		blockNumber;
		refetchBalance();
	}, [blockNumber, refetchBalance]);

	useEffect(() => {
		if (balance !== undefined && initial === undefined) setInitial(balance);
	}, [balance, initial]);

	const spent =
		initial !== undefined && balance !== undefined && initial > balance
			? initial - balance
			: 0n;

	return (
		<Context.Provider value={{ address, initial, spent, token }}>
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
		address?: Address;
		children: ReactNode;
		className?: string;
		token?: Address;
	};
}

export function TitleBar({ title, children, className }: TitleBar.Props) {
	return (
		<div
			className={cx(
				"flex items-center justify-between px-4 py-2.5 border-b border-primary bg-primary text-gray8",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				<div className="flex gap-1.5">
					<span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
					<span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
					<span className="w-3 h-3 rounded-full bg-[#27c93f]" />
				</div>
				{title && <span className="text-[13px] tracking-tight ml-2 mt-[2px]">{title}</span>}
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
				"flex items-center justify-between px-4 h-8 border-t border-primary bg-primary text-xs",
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
	const { initial, spent } = useContext(Context);
	const balance = initial !== undefined ? initial - spent : undefined;

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
	const { spent } = useContext(Context);

	if (spent === 0n) return null;

	const formatted = formatUnits(spent, 6);
	const display = Number(formatted).toLocaleString("en-US", {
		maximumFractionDigits: 4,
		minimumFractionDigits: 3,
	});

	return (
		<span className={cx("text-gray8", className)}>
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
