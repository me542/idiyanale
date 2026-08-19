"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SuperAdminSIDEBAR_MENU } from "../../super-admin";
import Footer from "./footer";

export default function SuperAdminSidebar() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [openMenus, setOpenMenus] = useState<string[]>([]);
	const pathname = usePathname();

	const toggleMenu = (id: string) => {
		setOpenMenus((prev) =>
			prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
		);
	};

	return (
		<aside
			onMouseEnter={() => setIsExpanded(true)}
			onMouseLeave={() => {
				setIsExpanded(false);
				setOpenMenus([]); // Optional: close submenus when collapsing
			}}
			className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-50 transition-all duration-300 ease-in-out flex flex-col ${
				isExpanded ? "w-64" : "w-20"
			}`}
		>
			{/* Brand Section */}
			<div className="h-20 flex items-center px-6 overflow-hidden">
				<div className="min-w-8 relative w-8 h-8">
					<Image
						src="/Idiyanale.png"
						alt="Bakawan Logo"
						fill
						sizes="32px"
						className="object-contain"
					/>
				</div>
				<div
					className={`ml-3 transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 invisible"}`}
				>
					<span className="font-bold whitespace-nowrap bg-gradient-to-b from-[#E5CA7F] to-[#896C38] bg-clip-text text-transparent">
					IDIYANALE
					</span>
				</div>
			</div>

			{/* Nav Section */}
			<nav className="flex-1 px-4 mt-4 space-y-2 overflow-y-auto no-scrollbar">
				{SuperAdminSIDEBAR_MENU.map((item) => {
					const isActive =
						pathname === item.path ||
						item.children?.some((c) => c.path === pathname);
					const Icon = item.icon;
					const hasChildren = item.children && item.children.length > 0;
					const isMenuOpen = openMenus.includes(item.id);

					// Define the inner content to avoid repeating code
					const NavContent = (
						<div
							className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
								isActive
									? "bg-[#1E4637] text-white"
									: "text-gray-500 hover:bg-gray-50"
							}`}
							onClick={() => hasChildren && isExpanded && toggleMenu(item.id)}
						>
							<div className="flex items-center gap-3 min-w-6">
								<Icon size={20} />
								{isExpanded && (
									<span className="text-sm font-semibold whitespace-nowrap">
										{item.label}
									</span>
								)}
							</div>
							{hasChildren && isExpanded && (
								<ChevronDown
									size={16}
									className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
								/>
							)}
						</div>
					);

					return (
						<div key={item.id} className="w-full">
							{/* If it has no children, wrap in Link for navigation. 
          If it has children, just render the div for toggling. */}
							{!hasChildren && item.path ? (
								<Link href={item.path}>{NavContent}</Link>
							) : (
								NavContent
							)}

							{/* Submenu logic remains the same */}
							{hasChildren && isExpanded && isMenuOpen && (
								<div className="ml-6 mt-2 border-l border-gray-100 pl-4 space-y-1">
									{item.children?.map((child) => (
										<Link
											key={child.path}
											href={child.path}
											className={`block py-2 text-sm transition-colors ${
												pathname === child.path
													? "text-[#1E4637] font-bold"
													: "text-gray-400 hover:text-gray-900"
											}`}
										>
											{child.label}
										</Link>
									))}
								</div>
							)}
						</div>
					);
				})}

				<Footer isExpanded={isExpanded} />
			</nav>
		</aside>
	);
}


