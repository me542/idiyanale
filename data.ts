// shared/layout/mockData.ts
import { profile } from "console";
import {
  ListTodo,
  MessageCircleMore,
  Ticket,
  BriefcaseBusiness,
  Newspaper,
  LayoutDashboard,
  User
} from "lucide-react";



export const SIDEBAR_MENU = [

	{
		id: "dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		path: "/Dashboard",
	},

	{
		id: "ticket",
		label: "Ticket",
		icon: Ticket,
		children: [
			{ label: "All Tickets", path: "/ticket/all-tickets" },
			{ label: "Reports", path: "/ticket/reports" },
		],
	},

	{
		id: "minor-task",
		label: "Minor Task",
		icon: ListTodo,
		children: [
			{ label: "All Tasks", path: "/minor-task/all-tasks" },
			{ label: "Reports", path: "/minor-task/reports" },
		],
	},

	{
		id: "chat",
		label: "Chat",
		icon: MessageCircleMore,
		path: "/chat",
	},

	{
		id: "profile",
		label: "Profile",
		icon: User,
		path: "/profile",
	},

	{
		id: "management",
		label: "Management",
		icon: BriefcaseBusiness,
		children: [
			{ label: "Template", path: "/setting/template" },
			{ label: "User Management", path: "/setting/user-management" },
			{ label: "Server Management", path: "/setting/server-management" },
			{ label: "Top", path: "/setting/top" },
		],
	},

	{
		id: "knowledge",
		label: "Knowledge",
		icon: Newspaper,
		path: "/knowledge",
	},
];

