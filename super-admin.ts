// shared/layout/mockData.ts
import {
    LayoutDashboard,
    LayoutList,
} from "lucide-react";



export const SuperAdminSIDEBAR_MENU = [


	{
		id: "dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		path: "/dashboard",
	},

    {
		id: "management",
		label: "Management",
		icon: LayoutList,
		children: [
			{ label: "User", path: "/management/user" },
			{ label: "Institution", path: "/management/institution" },
		],
	},

];

