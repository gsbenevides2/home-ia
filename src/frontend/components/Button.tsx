import React from "react";

interface ButtonProps {
    href: string;
    children: React.ReactNode;
    variant?: "primary" | "red" | "gray";
    target?: string;
    rel?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function Button({
    href,
    children,
    variant = "primary",
    target,
    rel,
    onClick,
}: ButtonProps) {
    const getButtonClass = () => {
        switch (variant) {
            case "primary":
                return "bg-blue-500 hover:bg-blue-600";
            case "red":
                return "bg-red-500 hover:bg-red-600";
            case "gray":
                return "bg-gray-500 hover:bg-gray-600";
            default:
                return "bg-blue-500 hover:bg-blue-600";
        }
    };

    return (
        <a
            href={href}
            target={target}
            rel={rel}
            onClick={onClick}
            className={`px-4 py-2 ${getButtonClass()} text-white rounded text-center`}
        >
            {children}
        </a>
    );
}
