// shared/layout/mockData.ts
import {
  ListTodo,
  MessageCircleMore,
  Ticket,
  Bolt,
  Newspaper,
} from "lucide-react";



export const SIDEBAR_MENU = [

	{
		id: "ticket",
		label: "Ticket",
		icon: Ticket,
		children: [
			{ label: "Dashboard", path: "/ticket/dashboard" },
			{ label: "All Tickets", path: "/ticket/all-tickets" },
			{ label: "Reports", path: "/ticket/reports" },
		],
	},

	{
		id: "minor-task",
		label: "Minor Task",
		icon: ListTodo,
		children: [
			{ label: "Dashboard", path: "/minor-task/dashboard" },
			{ label: "All Tickets", path: "/minor-task/all-task" },
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
		id: "setting",
		label: "Setting",
		icon: Bolt,
		children: [
			{ label: "User", path: "/setting/user" },
			{ label: "Template", path: "/setting/template" },
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

