export const ApiEndpoint = {

  // --------------------- AUTH ---------------------------

  LOGIN_OTP: "/api/v1/auth/login-otp",
  VERIFY_OTP: "/api/v1/auth/verify-otp",
  LOGIN_SUPER_ADMIN: "/api/v1/public/login/super-admin",
  LOGOUT_SUPER_ADMIN: "/api/v1/protected/logout/super-admin",
  LOGOUT: "/api/v1/protected/logout",
  REGISTER: "/api/v1/protected/register-user", 
  getAllUsers: `/api/v1/protected/get-all-users`,

  // --------------------- SUPER ADMIN ---------------------

  PATCH_CHANGED_ROLE_ADMIN: (id: number | string) => `/api/v1/protected/change-role-admin/${id}`,
  PATCH_CHANGED_USER_STATUS: (id: number | string) => `/api/v1/protected/user/${id}/status`,

  GET_ALL_INSTITUTION_BY_SUPER_ADMIN: "api/v1/public/institution/get",
  GET_USER_BY_INSTI_SA: (institutionId: number | string) => `/api/v1/protected/users/${institutionId}`,
  GET_POSITION_BY_INSTI: (institutionId: number | string) => `/api/v1/protected/job-positions/${institutionId}`,
  GET_SUPER_ADMIN_BY_ID: (id: number | string) => `/api/v1/protected/get-super-admin/${id}`,

  POST_SUPER_ADMIN: "/api/v1/public/register/super-admin",

  // --------------------- INSTI ADMIN ---------------------

  GET_USERS_BY_INSTITUTION_ID: (institutionId: number | string) => `/api/v1/protected/users/institution/${institutionId}`,
  GET_POSITION_BY_INSTITUTION: "/api/v1/protected/job-positions-by-institution",
  GET_TICKET_TYPE: "/api/v1/protected/get-ticket-types",
  GET_CATEGORY: (ticketTypeId: number | string) => `/api/v1/protected/get-categories/${ticketTypeId}`,
  GET_SUB_CATEGORY: (categoryId: number | string) => `/api/v1/protected/get-sub-categories/${categoryId}`,
  GET_TICKET_TYPE_BY_ID: (tickeTypeId: number | string) => `/api/v1/protected/get-ticket-type/${tickeTypeId}`,
  GET_CATEGORY_BY_ID: (categoryId: number | string) => `/api/v1/protected/get-category/${categoryId}`,
  GET_SUB_CATEGORY_BY_ID: (subCategoryId: number | string) => `/api/v1/protected/get-sub-category/${subCategoryId}`,

  POST_POSITION: "/api/v1/protected/add/job-position",
  POST_TICKET_TYPE: "/api/v1/protected/add-ticket-types",
  POST_CATEGORY: "/api/v1/protected/add-category",
  POST_SUB_CATEGORY: "/api/v1/protected/add-sub-category",

  PATCH_TICKET_TYPE: (ticketTypeId: number | string) => `/api/v1/protected/edit-ticket-type-info/${ticketTypeId}`,
  PATCH_CATEGORY: (categoryId: number | string) => `/api/v1/protected/edit-category-info/${categoryId}`,
  PATCH_SUB_CATEGORY: (subCategoryId: number | string) => `/api/v1/protected/edit-sub-category-info/${subCategoryId}`,

  // --------------------- USER ---------------------------

  GET_USER_BY_ID_U: (id: number | string) => `/api/v1/protected/get-user/details/${id}`,
  GET_USER_BY_INSTI_U: (institutionId: number | string) => `/api/v1/protected/get-users/${institutionId}`,
  GET_USER: "/api/v1/protected/get-all-users",

  // --------------------- ROLE ----------------------------

  POST_ROLE: "/api/v1/role/add",

  GET_ROLE_BY_INSTI: (institutionId: number | string) => `/api/v1/role/get/${institutionId}`,

  PATCH_CHANGED_ROLE: (id: number | string) => `/api/v1/role/change/${id}`,
  PATCH_EDIT_ROLE: (id: number | string) => `/api/v1/role/edit/${id}`,

  // --------------------- INSTITUTION ----------------------
  POST_ADD_INSTI: "/api/v1/institution/create",
  POST_EDIT_INSTI: (institutionId: number | string) => `/api/v1/institution/edit/${institutionId}`,
  POST_ALLOW_INSTI_TICKET: "/api/v1/institution/allow-institution-ticket",

  GET_ALL_INSTITUTIONS: "/api/v1/institution/get",

  PATCH_CHANGED_INSTI_STATUS: (institutionId: number | string) => `/api/v1/institution/change-status/${institutionId}`,

  // --------------------- TICKET ----------------------------
  POST_CREATE_TICKET: "/api/v1/ticket/create",
  POST_PROCESS_TICKET: (ticketId: string | number) => `/api/v1/ticket/${ticketId}/process`,

  PATCH_UPDATE_TICKET: (ticketId: string | number) =>`/api/v1/ticket/update/${ticketId}`,

  GET_ALL_TICKET: "/api/v1/ticket/all",
  GET_ALL_TICKET_BY_INSTI: (institutionId: number | string) => `/api/v1/ticket/get/by-institution/${institutionId}`,
  GET_TICKET_BY_TICKETID: (ticketId: number | string) => `/api/v1/ticket/get/${ticketId}`,

  // --------------------- REMARKS ----------------------------

  POST_REMARKS: "/api/v1/remarks/add-options",

  GET_REMARKS: "/api/v1/remarks/get",

  PATCH_REMARKS: "/api/v1/remarks/edit",

  // --------------------- PROJECT ---------------------------\

  POST_CREATE_SERVER: "/api/v1/project/server/create",
  POST_CREATE_PROJECT: "/api/v1/project/create",

  GET_SERVER_BY_ID: (serverId: number | string) => `/api/v1/project/get/server/${serverId}`,
  GET_PROJECT_BY_ID: (projectId: number | string) => `/api/v1/project/get/${projectId}`,
  GET_SERVER: "/api/v1/get/servers",
  GET_PROJECT: (serverId: number | string) => `/api/v1/project/get/projects/${serverId}`,
};